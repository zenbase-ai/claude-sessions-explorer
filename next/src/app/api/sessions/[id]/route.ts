import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { homedir } from "os";
import path from "path";
import type { SessionMessage, SessionIndex, SessionIndexEntry } from "@/types";

async function findSession(
  sessionId: string
): Promise<{ entry: SessionIndexEntry; projectId: string } | null> {
  const claudeDir = path.join(homedir(), ".claude");
  const projectsDir = path.join(claudeDir, "projects");

  const projectDirs = await fs.readdir(projectsDir);

  for (const dir of projectDirs) {
    const projectPath = path.join(projectsDir, dir);
    const stat = await fs.stat(projectPath);

    if (!stat.isDirectory()) continue;

    const indexPath = path.join(projectPath, "sessions-index.json");

    try {
      const indexContent = await fs.readFile(indexPath, "utf-8");
      const index: SessionIndex = JSON.parse(indexContent);

      const entry = index.entries.find((e) => e.sessionId === sessionId);
      if (entry) {
        return { entry, projectId: dir };
      }
    } catch {
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

    const result = await findSession(sessionId);
    if (!result) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const { entry, projectId } = result;

    // Read the session JSONL file
    const sessionContent = await fs.readFile(entry.fullPath, "utf-8");
    const lines = sessionContent.trim().split("\n");

    const messages: SessionMessage[] = [];

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (
          (parsed.type === "user" || parsed.type === "assistant") &&
          parsed.message
        ) {
          messages.push(parsed as SessionMessage);
        }
      } catch {
        // Skip invalid JSON lines
        continue;
      }
    }

    // Read commits file if it exists
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
      // No commits file exists
    }

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
