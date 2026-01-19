import Link from "next/link";
import { StatsCard } from "@/components/StatsCard";
import { SessionCard } from "@/components/SessionCard";
import type { StatsCache, Project, SessionIndexEntry } from "@/types";

async function getStats(): Promise<StatsCache | null> {
  try {
    const res = await fetch("http://localhost:3000/api/stats", {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.stats;
  } catch {
    return null;
  }
}

async function getProjects(): Promise<Project[]> {
  try {
    const res = await fetch("http://localhost:3000/api/projects", {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.projects;
  } catch {
    return [];
  }
}

async function getRecentSessions(): Promise<SessionIndexEntry[]> {
  try {
    const res = await fetch("http://localhost:3000/api/projects", {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();

    // Get sessions from all projects and sort by modified date
    const allSessions: SessionIndexEntry[] = [];
    for (const project of data.projects.slice(0, 5)) {
      const projectRes = await fetch(
        `http://localhost:3000/api/projects/${project.id}`,
        { cache: "no-store" }
      );
      if (projectRes.ok) {
        const projectData = await projectRes.json();
        allSessions.push(...projectData.sessions);
      }
    }

    // Sort by modified date and take top 10
    return allSessions
      .sort(
        (a, b) =>
          new Date(b.modified).getTime() - new Date(a.modified).getTime()
      )
      .slice(0, 10);
  } catch {
    return [];
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export default async function Home() {
  const [stats, projects, recentSessions] = await Promise.all([
    getStats(),
    getProjects(),
    getRecentSessions(),
  ]);

  const totalTokens = stats
    ? Object.values(stats.modelUsage).reduce(
        (acc, m) => acc + m.inputTokens + m.outputTokens,
        0
      )
    : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Claude Sessions Explorer
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Browse your Claude Code session history
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Stats Overview */}
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
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

        {/* Quick Links */}
        <section className="mb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Projects
            </h2>
            <Link
              href="/projects"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                  {project.name}
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {project.sessionCount} sessions
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Sessions */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Recent Sessions
          </h2>
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <SessionCard key={session.sessionId} session={session} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
