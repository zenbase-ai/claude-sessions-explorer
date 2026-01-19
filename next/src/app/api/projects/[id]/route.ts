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
    const { id } = await params;
    const claudeDir = path.join(homedir(), ".claude");
    const projectPath = path.join(claudeDir, "projects", id);
    const indexPath = path.join(projectPath, "sessions-index.json");

    const indexContent = await fs.readFile(indexPath, "utf-8");
    const index: SessionIndex = JSON.parse(indexContent);

    // Sort sessions by modified date (most recent first)
    const sessions = [...index.entries].sort(
      (a, b) =>
        new Date(b.modified).getTime() - new Date(a.modified).getTime()
    );

    // Get last activity from most recent session
    let lastActivity = "";
    if (sessions.length > 0) {
      lastActivity = sessions[0].modified;
    }

    // Parse the directory name to get a readable project name
    const projectName = id.replace(/-/g, "/").replace(/^\//, "");

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
