import Link from "next/link";
import { SessionCard } from "@/components/SessionCard";
import type { Project, SessionIndexEntry } from "@/types";

interface ProjectData {
  project: Project;
  sessions: SessionIndexEntry[];
}

async function getProject(id: string): Promise<ProjectData | null> {
  try {
    const res = await fetch(`http://localhost:3000/api/projects/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProject(id);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Project Not Found
          </h1>
          <Link
            href="/projects"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const { project, sessions } = data;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/projects"
              className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {project.name}
              </h1>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                {sessions.length} sessions
              </p>
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
          <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
            No sessions found for this project
          </div>
        )}
      </main>
    </div>
  );
}
