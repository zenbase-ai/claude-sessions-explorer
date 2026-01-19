import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { homedir } from "os";
import path from "path";
import type { Project, SessionIndex } from "@/types";

export async function GET() {
  try {
    const claudeDir = path.join(homedir(), ".claude");
    const projectsDir = path.join(claudeDir, "projects");

    const projectDirs = await fs.readdir(projectsDir);
    const projects: Project[] = [];

    for (const dir of projectDirs) {
      const projectPath = path.join(projectsDir, dir);
      const stat = await fs.stat(projectPath);

      if (!stat.isDirectory()) continue;

      const indexPath = path.join(projectPath, "sessions-index.json");

      try {
        const indexContent = await fs.readFile(indexPath, "utf-8");
        const index: SessionIndex = JSON.parse(indexContent);

        // Get last activity from most recent session
        let lastActivity = "";
        if (index.entries.length > 0) {
          const sorted = [...index.entries].sort(
            (a, b) =>
              new Date(b.modified).getTime() - new Date(a.modified).getTime()
          );
          lastActivity = sorted[0].modified;
        }

        // Parse the directory name to get a readable project name
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
        continue;
      }
    }

    // Sort by last activity
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
