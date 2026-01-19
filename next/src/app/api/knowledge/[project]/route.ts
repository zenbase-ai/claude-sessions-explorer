/**
 * API Route: GET /api/knowledge/[project]
 *
 * Returns all knowledge data for a specific project.
 * Includes consolidated knowledge, CLAUDE.md content, extractions, tasks,
 * verification, memory, and skills.
 *
 * Data Sources:
 * - ../.data/generated/[project]/knowledge.json - Consolidated knowledge
 * - ../.data/generated/[project]/CLAUDE.md - Generated documentation
 * - ../.data/generated/[project]/tasks/tasks.json - Generated tasks
 * - ../.data/generated/[project]/verification.json - Verification results
 * - ../.data/generated/[project]/skills/*.md - Generated skills
 * - ../.data/memory/[project]/consolidated.json - Full memory data
 * - ../.data/extractions/[project]/*.json - Raw session extractions
 *
 * Response: { data: KnowledgeData }
 *
 * Error Response: { error: string } with status 404 or 500
 */

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { KnowledgeData, ProjectKnowledge, SessionExtraction, Task, Verification, Skill } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ project: string }> }
) {
  try {
    const { project } = await params;

    // .data is at the root of the project, one level up from next/
    const dataDir = path.join(process.cwd(), "..", ".data");
    const generatedDir = path.join(dataDir, "generated", project);
    const extractionsDir = path.join(dataDir, "extractions", project);
    const memoryDir = path.join(dataDir, "memory", project);

    const result: KnowledgeData = {
      project,
      knowledge: null,
      claudeMd: null,
      extractions: [],
      tasks: [],
      verification: null,
      memory: null,
      skills: [],
    };

    // Read knowledge.json if it exists
    try {
      const knowledgePath = path.join(generatedDir, "knowledge.json");
      const content = await fs.readFile(knowledgePath, "utf-8");
      result.knowledge = JSON.parse(content) as ProjectKnowledge;
    } catch {
      // Knowledge file doesn't exist
    }

    // Read CLAUDE.md if it exists
    try {
      const claudeMdPath = path.join(generatedDir, "CLAUDE.md");
      result.claudeMd = await fs.readFile(claudeMdPath, "utf-8");
    } catch {
      // CLAUDE.md doesn't exist
    }

    // Read tasks.json if it exists
    try {
      const tasksPath = path.join(generatedDir, "tasks", "tasks.json");
      const content = await fs.readFile(tasksPath, "utf-8");
      result.tasks = JSON.parse(content) as Task[];
    } catch {
      // Tasks file doesn't exist
    }

    // Read verification.json if it exists
    try {
      const verificationPath = path.join(generatedDir, "verification.json");
      const content = await fs.readFile(verificationPath, "utf-8");
      result.verification = JSON.parse(content) as Verification;
    } catch {
      // Verification file doesn't exist
    }

    // Read skills from skills directory
    try {
      const skillsDir = path.join(generatedDir, "skills");
      const files = await fs.readdir(skillsDir);
      for (const file of files) {
        if (!file.endsWith(".md")) continue;
        const filePath = path.join(skillsDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        result.skills.push({
          name: file.replace(".md", ""),
          content,
        });
      }
    } catch {
      // Skills directory doesn't exist
    }

    // Read memory/consolidated.json if it exists
    try {
      const memoryPath = path.join(memoryDir, "consolidated.json");
      const content = await fs.readFile(memoryPath, "utf-8");
      result.memory = JSON.parse(content) as ProjectKnowledge;
    } catch {
      // Memory file doesn't exist
    }

    // Read all extraction files
    try {
      const files = await fs.readdir(extractionsDir);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;

        const filePath = path.join(extractionsDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        result.extractions.push(JSON.parse(content) as SessionExtraction);
      }

      // Sort extractions by date (newest first)
      result.extractions.sort(
        (a, b) =>
          new Date(b.extracted_at).getTime() - new Date(a.extracted_at).getTime()
      );
    } catch {
      // Extractions directory doesn't exist
    }

    // Return 404 if no data was found
    const hasData = result.knowledge || result.claudeMd || result.extractions.length > 0 ||
                    result.tasks.length > 0 || result.verification || result.memory || result.skills.length > 0;
    if (!hasData) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error reading project knowledge:", error);
    return NextResponse.json(
      { error: "Failed to read project knowledge" },
      { status: 500 }
    );
  }
}
