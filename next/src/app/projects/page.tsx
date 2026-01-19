import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import type { Project } from "@/types"

async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch("http://localhost:3000/api/projects", {
      cache: "no-store",
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.projects
  } catch {
    return []
  }
}

export default async function ProjectsPage() {
  const projects = await getProjects()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-center gap-4">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="p-5 transition-colors hover:border-primary/50 hover:bg-accent/50">
                <p className="truncate font-medium text-card-foreground">
                  {project.name}
                </p>
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

        {projects.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No projects found</p>
          </Card>
        )}
      </main>
    </div>
  )
}
