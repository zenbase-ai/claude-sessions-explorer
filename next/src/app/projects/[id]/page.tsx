import Link from "next/link"
import { SessionCard } from "@/components/SessionCard"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Project, SessionIndexEntry } from "@/types"

type ProjectData = {
  project: Project
  sessions: SessionIndexEntry[]
}

async function getProject(id: string): Promise<ProjectData | null> {
  try {
    const res = await fetch(`http://localhost:3000/api/projects/${id}`, {
      cache: "no-store",
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getProject(id)

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Project Not Found
          </h1>
          <Button variant="link" asChild className="mt-4">
            <Link href="/projects">Back to Projects</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const { project, sessions } = data

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/projects">
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
                {project.name}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary">{sessions.length} sessions</Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard key={session.sessionId} session={session} />
          ))}
        </div>

        {sessions.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              No sessions found for this project
            </p>
          </Card>
        )}
      </main>
    </div>
  )
}
