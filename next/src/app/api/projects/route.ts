/**
 * API Route: GET /api/projects
 *
 * Lists all Claude Code projects found in the user's ~/.claude/projects/ directory.
 * Each project corresponds to a working directory where Claude Code was used.
 *
 * Data Source:
 * - Scans ~/.claude/projects/ for subdirectories
 * - Reads sessions-index.json from each project directory
 *
 * Response: { projects: Project[] }
 * - Projects are sorted by last activity (most recent first)
 *
 * Error Response: { error: string } with status 500
 */

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { homedir } from "os";
import path from "path";
import type { Project, SessionIndex } from "@/types";

export async function GET() {
  try {
    // Claude Code stores all data in ~/.claude/
    const claudeDir = path.join(homedir(), ".claude");
    const projectsDir = path.join(claudeDir, "projects");

    // Each subdirectory in projects/ represents one project
    // Directory names are URL-encoded paths (e.g., "-Users-amir-workspace-myapp")
    const projectDirs = await fs.readdir(projectsDir);
    const projects: Project[] = [];

    for (const dir of projectDirs) {
      const projectPath = path.join(projectsDir, dir);
      const stat = await fs.stat(projectPath);

      // Skip non-directories (shouldn't normally exist, but be safe)
      if (!stat.isDirectory()) continue;

      // Each project has a sessions-index.json with metadata about all sessions
      const indexPath = path.join(projectPath, "sessions-index.json");

      try {
        const indexContent = await fs.readFile(indexPath, "utf-8");
        const index: SessionIndex = JSON.parse(indexContent);

        // Find the most recently modified session for "last activity" timestamp
        let lastActivity = "";
        if (index.entries.length > 0) {
          const sorted = [...index.entries].sort(
            (a, b) =>
              new Date(b.modified).getTime() - new Date(a.modified).getTime()
          );
          lastActivity = sorted[0].modified;
        }

        // Convert directory name back to readable path
        // "-Users-amir-workspace-myapp" -> "Users/amir/workspace/myapp"
        const projectName = dir.replace(/-/g, "/").replace(/^\//, "");

        projects.push({
          id: dir,
          name: projectName,
          path: projectPath,
          sessionCount: index.entries.length,
          lastActivity,
        });
      } catch {
        // Skip directories without a valid sessions-index.json
        // This can happen if the directory is corrupted or not a real project
        continue;
      }
    }

    // Sort by last activity (most recent first) for the UI
    projects.sort(
      (a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error reading projects:", error);
    return NextResponse.json(
      { error: "Failed to read projects" },
      { status: 500 }
    );
  }
}
