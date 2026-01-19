"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { SessionCard } from "@/components/SessionCard"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Project, SessionIndexEntry } from "@/types"
import { getProjectName } from "@/lib/utils"

export default function ProjectPage() {
  const params = useParams()
  const id = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [sessions, setSessions] = useState<SessionIndexEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProject(data.project)
        setSessions(data.sessions)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!project) {
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
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-foreground">
                {getProjectName(project.name)}
              </h1>
              <p className="mt-1 truncate text-sm text-muted-foreground" title={project.name}>
                {project.name}
              </p>
              <div className="mt-2 flex items-center gap-2">
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
