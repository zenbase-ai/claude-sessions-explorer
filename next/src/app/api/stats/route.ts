import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { homedir } from "os";
import path from "path";
import type { StatsCache } from "@/types";

export async function GET() {
  try {
    const claudeDir = path.join(homedir(), ".claude");
    const statsPath = path.join(claudeDir, "stats-cache.json");

    const statsContent = await fs.readFile(statsPath, "utf-8");
    const stats: StatsCache = JSON.parse(statsContent);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error reading stats:", error);
    return NextResponse.json(
      { error: "Failed to read stats" },
      { status: 500 }
    );
  }
}
