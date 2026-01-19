import Link from "next/link"
import { StatsCard } from "@/components/StatsCard"
import { SessionCard } from "@/components/SessionCard"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { StatsCache, Project, SessionIndexEntry } from "@/types"

async function getStats(): Promise<StatsCache | null> {
  try {
    const res = await fetch("http://localhost:3000/api/stats", {
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.stats
  } catch {
    return null
  }
}

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

async function getRecentSessions(): Promise<SessionIndexEntry[]> {
  try {
    const res = await fetch("http://localhost:3000/api/projects", {
      cache: "no-store",
    })
    if (!res.ok) return []
    const data = await res.json()

    const allSessions: SessionIndexEntry[] = []
    for (const project of data.projects.slice(0, 5)) {
      const projectRes = await fetch(
        `http://localhost:3000/api/projects/${project.id}`,
        { cache: "no-store" }
      )
      if (projectRes.ok) {
        const projectData = await projectRes.json()
        allSessions.push(...projectData.sessions)
      }
    }

    return allSessions
      .sort(
        (a, b) =>
          new Date(b.modified).getTime() - new Date(a.modified).getTime()
      )
      .slice(0, 10)
  } catch {
    return []
  }
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
  if (num >= 1000) return (num / 1000).toFixed(1) + "K"
  return num.toString()
}

export default async function Home() {
  const [stats, projects, recentSessions] = await Promise.all([
    getStats(),
    getProjects(),
    getRecentSessions(),
  ])

  const totalTokens = stats
    ? Object.values(stats.modelUsage).reduce(
        (acc, m) => acc + m.inputTokens + m.outputTokens,
        0
      )
    : 0

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
        {/* Stats Overview */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Overview
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Sessions"
              value={stats?.totalSessions ?? 0}
              subtitle={`Across ${projects.length} projects`}
            />
            <StatsCard
              title="Total Messages"
              value={formatNumber(stats?.totalMessages ?? 0)}
            />
            <StatsCard
              title="Total Tokens"
              value={formatNumber(totalTokens)}
              subtitle="Input + Output"
            />
            <StatsCard
              title="First Session"
              value={
                stats?.firstSessionDate
                  ? new Date(stats.firstSessionDate).toLocaleDateString()
                  : "N/A"
              }
            />
          </div>
        </section>

        {/* Projects */}
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
                  <p className="truncate font-medium text-card-foreground">
                    {project.name}
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

        {/* Recent Sessions */}
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
