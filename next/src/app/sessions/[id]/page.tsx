import Link from "next/link";
import { MessageBubble } from "@/components/MessageBubble";
import type { Session } from "@/types";

async function getSession(id: string): Promise<Session | null> {
  try {
    const res = await fetch(`http://localhost:3000/api/sessions/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.session;
  } catch {
    return null;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession(id);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Session Not Found
          </h1>
          <Link
            href="/"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/projects/${session.projectId}`}
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
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {session.firstPrompt || "Session"}
              </h1>
              <div className="flex flex-wrap gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <span>{formatDate(session.created)}</span>
                {session.gitBranch && (
                  <>
                    <span>·</span>
                    <span className="font-mono text-xs">
                      {session.gitBranch}
                    </span>
                  </>
                )}
                <span>·</span>
                <span>{session.messageCount} messages</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Commits section */}
        {session.commits && session.commits.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Commits in this session
            </h2>
            <div className="space-y-2">
              {session.commits.map((commit, idx) => (
                <div
                  key={`${commit.commitHash}-${idx}`}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-green-600 dark:text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                        {commit.commitHash}
                      </code>
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {commit.branch}
                      </span>
                    </div>
                    {commit.repoUrl && (
                      <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {commit.repoUrl}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(commit.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Messages section */}
        <div className="space-y-2">
          {session.messages?.map((message) => (
            <MessageBubble key={message.uuid} message={message} />
          ))}
        </div>

        {(!session.messages || session.messages.length === 0) && (
          <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
            No messages in this session
          </div>
        )}
      </main>
    </div>
  );
}
