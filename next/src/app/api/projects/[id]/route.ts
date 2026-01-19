/**
 * API Route: GET /api/projects/[id]
 *
 * Returns details for a specific project and all its sessions.
 *
 * URL Parameters:
 * - id: The project ID (URL-encoded path, e.g., "-Users-amir-workspace-myapp")
 *
 * Data Source:
 * - Reads ~/.claude/projects/{id}/sessions-index.json
 *
 * Response: { project: Project, sessions: SessionIndexEntry[] }
 * - Sessions are sorted by modified date (most recent first)
 *
 * Error Response: { error: string } with status 500
 */

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { homedir } from "os";
import path from "path";
import type { Project, SessionIndex } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Extract project ID from URL params (Next.js 15+ uses Promise for params)
    const { id } = await params;

    // Construct path to project's session index
    const claudeDir = path.join(homedir(), ".claude");
    const projectPath = path.join(claudeDir, "projects", id);
    const indexPath = path.join(projectPath, "sessions-index.json");

    // Read the session index which contains metadata for all sessions
    const indexContent = await fs.readFile(indexPath, "utf-8");
    const index: SessionIndex = JSON.parse(indexContent);

    // Sort sessions by modified date (most recent first) for the UI
    const sessions = [...index.entries].sort(
      (a, b) =>
        new Date(b.modified).getTime() - new Date(a.modified).getTime()
    );

    // Determine last activity from the most recent session
    let lastActivity = "";
    if (sessions.length > 0) {
      lastActivity = sessions[0].modified;
    }

    // Convert directory name back to readable path for display
    // "-Users-amir-workspace-myapp" -> "Users/amir/workspace/myapp"
    const projectName = id.replace(/-/g, "/").replace(/^\//, "");

    // Construct the Project object
    const project: Project = {
      id,
      name: projectName,
      path: projectPath,
      sessionCount: sessions.length,
      lastActivity,
    };

    return NextResponse.json({ project, sessions });
  } catch (error) {
    console.error("Error reading project:", error);
    return NextResponse.json(
      { error: "Failed to read project" },
      { status: 500 }
    );
  }
}
