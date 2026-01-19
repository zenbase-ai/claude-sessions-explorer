/**
 * API Route: GET /api/sessions/[id]
 *
 * Returns full session details including all messages and git commits.
 * This is the main endpoint for viewing a conversation.
 *
 * URL Parameters:
 * - id: The session ID (UUID format)
 *
 * Data Source:
 * - Searches all projects to find the session by ID
 * - Reads the session's JSONL file for messages
 * - Reads the session's .commits.json file for git commits (if exists)
 *
 * Response: { session: Session }
 * - Includes messages array and commits array
 *
 * Error Response:
 * - { error: "Session not found" } with status 404
 * - { error: "Failed to read session" } with status 500
 */

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { homedir } from "os";
import path from "path";
import type { SessionMessage, SessionIndex, SessionIndexEntry } from "@/types";

/**
 * Searches all projects to find a session by its ID.
 *
 * Claude Code doesn't store a global session index, so we need to
 * search through each project's sessions-index.json to find the session.
 *
 * @param sessionId - The UUID of the session to find
 * @returns The session entry and its project ID, or null if not found
 */
async function findSession(
  sessionId: string
): Promise<{ entry: SessionIndexEntry; projectId: string } | null> {
  const claudeDir = path.join(homedir(), ".claude");
  const projectsDir = path.join(claudeDir, "projects");

  // Iterate through all project directories
  const projectDirs = await fs.readdir(projectsDir);

  for (const dir of projectDirs) {
    const projectPath = path.join(projectsDir, dir);
    const stat = await fs.stat(projectPath);

    if (!stat.isDirectory()) continue;

    const indexPath = path.join(projectPath, "sessions-index.json");

    try {
      const indexContent = await fs.readFile(indexPath, "utf-8");
      const index: SessionIndex = JSON.parse(indexContent);

      // Search for the session in this project's index
      const entry = index.entries.find((e) => e.sessionId === sessionId);
      if (entry) {
        return { entry, projectId: dir };
      }
    } catch {
      // Skip projects with invalid/missing index files
      continue;
    }
  }

  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    // Find the session across all projects
    const result = await findSession(sessionId);
    if (!result) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const { entry, projectId } = result;

    // Read the session's JSONL file
    // Each line is a JSON object representing one event (message, tool use, etc.)
    const sessionContent = await fs.readFile(entry.fullPath, "utf-8");
    const lines = sessionContent.trim().split("\n");

    const messages: SessionMessage[] = [];

    // Parse each line and filter for user/assistant messages
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        // Only include actual conversation messages (not system events)
        if (
          (parsed.type === "user" || parsed.type === "assistant") &&
          parsed.message
        ) {
          messages.push(parsed as SessionMessage);
        }
      } catch {
        // Skip invalid JSON lines (shouldn't happen, but be defensive)
        continue;
      }
    }

    // Try to read the commits file (tracked by PostToolUse hook)
    // File is named: {session-id}.commits.json (same as JSONL but different extension)
    const commitsPath = entry.fullPath.replace(/\.jsonl$/, ".commits.json");
    let commits: Array<{
      commitHash: string;
      branch: string;
      repoUrl: string;
      cwd: string;
      timestamp: string;
    }> = [];

    try {
      const commitsContent = await fs.readFile(commitsPath, "utf-8");
      commits = JSON.parse(commitsContent);
    } catch {
      // No commits file exists - this is normal if no commits were made
    }

    // Return the full session with messages and commits
    return NextResponse.json({
      session: {
        id: sessionId,
        projectId,
        firstPrompt: entry.firstPrompt,
        messageCount: entry.messageCount,
        created: entry.created,
        modified: entry.modified,
        gitBranch: entry.gitBranch,
        messages,
        commits,
      },
    });
  } catch (error) {
    console.error("Error reading session:", error);
    return NextResponse.json(
      { error: "Failed to read session" },
      { status: 500 }
    );
  }
}
