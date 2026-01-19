/**
 * Projects List Page
 *
 * Displays all Claude Code projects in a grid view.
 * Each project card shows the project name, path, session count, and last activity.
 *
 * Data Flow:
 * 1. On mount, fetches all projects from /api/projects
 * 2. Renders a grid of project cards
 * 3. Each card links to /projects/[id] for project details
 *
 * Navigation:
 * - Back button links to dashboard (/)
 * - Project cards link to /projects/[id]
 *
 * Architecture Notes:
 * - Client component for client-side data fetching
 * - Simple single-fetch pattern (no complex state management)
 */

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, getProjectName } from "@/lib/utils"
import type { Project } from "@/types"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch projects on mount
  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data.projects))
      .finally(() => setLoading(false))
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button and title */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-center gap-4">
            {/* Back to dashboard */}
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Projects
              </h1>
              <p className="text-sm text-muted-foreground">
                {projects.length} projects with Claude Code sessions
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Project cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="p-5 transition-colors hover:border-primary/50 hover:bg-accent/50">
                {/* Project name (last folder in path) */}
                <p className="font-medium text-card-foreground">
                  {getProjectName(project.name)}
                </p>
                {/* Full path shown on hover */}
                <p className="mt-1 truncate text-xs text-muted-foreground" title={project.name}>
                  {project.name}
                </p>
                {/* Session count and last activity */}
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="secondary">
                    {project.sessionCount} sessions
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(project.lastActivity)}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {projects.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No projects found</p>
          </Card>
        )}
      </main>
    </div>
  )
}
