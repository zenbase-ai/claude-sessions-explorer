import Link from "next/link";
import type { Project } from "@/types";

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

function formatDate(dateString: string): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
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
                Projects
              </h1>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                {projects.length} projects with Claude Code sessions
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                {project.name}
              </p>
              <div className="mt-3 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
                <span>{project.sessionCount} sessions</span>
                <span>{formatDate(project.lastActivity)}</span>
              </div>
            </Link>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
            No projects found
          </div>
        )}
      </main>
    </div>
  );
}
