"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { StatsCard } from "@/components/StatsCard"
import { SessionCard } from "@/components/SessionCard"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { StatsCache, Project, SessionIndexEntry } from "@/types"
import { getProjectName } from "@/lib/utils"

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
  if (num >= 1000) return (num / 1000).toFixed(1) + "K"
  return num.toString()
}

export default function Home() {
  const [stats, setStats] = useState<StatsCache | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [recentSessions, setRecentSessions] = useState<SessionIndexEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, projectsRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/projects"),
        ])

        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data.stats)
        }

        if (projectsRes.ok) {
          const data = await projectsRes.json()
          setProjects(data.projects)

          // Get recent sessions from first few projects
          const allSessions: SessionIndexEntry[] = []
          for (const project of data.projects.slice(0, 5)) {
            const res = await fetch(`/api/projects/${project.id}`)
            if (res.ok) {
              const projectData = await res.json()
              allSessions.push(...projectData.sessions)
            }
          }

          const sorted = allSessions
            .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
            .slice(0, 10)
          setRecentSessions(sorted)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const totalTokens = stats
    ? Object.values(stats.modelUsage).reduce(
        (acc, m) => acc + m.inputTokens + m.outputTokens,
        0
      )
    : 0

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-5 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Claude Sessions Explorer
              </h1>
              <p className="text-sm text-muted-foreground">
                Browse your Claude Code session history
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Overview
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Sessions"
              value={stats?.totalSessions ?? 0}
              subtitle={`Across ${projects.length} projects`}
              icon={
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
            />
            <StatsCard
              title="Total Messages"
              value={formatNumber(stats?.totalMessages ?? 0)}
              icon={
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              }
              iconClassName="bg-green-500/10 text-green-500"
            />
            <StatsCard
              title="Total Tokens"
              value={formatNumber(totalTokens)}
              subtitle="Input + Output"
              icon={
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              }
              iconClassName="bg-purple-500/10 text-purple-500"
            />
            <StatsCard
              title="First Session"
              value={
                stats?.firstSessionDate
                  ? new Date(stats.firstSessionDate).toLocaleDateString()
                  : "N/A"
              }
              icon={
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              iconClassName="bg-orange-500/10 text-orange-500"
            />
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Projects
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/projects">View all</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="p-4 transition-colors hover:border-primary/50 hover:bg-accent/50">
                  <p className="font-medium text-card-foreground">
                    {getProjectName(project.name)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary">
                      {project.sessionCount} sessions
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Recent Sessions
          </h2>
          <div className="space-y-3">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => (
                <SessionCard key={session.sessionId} session={session} />
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No sessions found</p>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
