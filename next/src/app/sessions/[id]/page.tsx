import Link from "next/link"
import { MessageBubble } from "@/components/MessageBubble"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import type { Session } from "@/types"

async function getSession(id: string): Promise<Session | null> {
  try {
    const res = await fetch(`http://localhost:3000/api/sessions/${id}`, {
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.session
  } catch {
    return null
  }
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession(id)

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Session Not Found
          </h1>
          <Button variant="link" asChild className="mt-4">
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/projects/${session.projectId}`}>
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
              <h1 className="truncate text-lg font-semibold text-foreground">
                {session.firstPrompt || "Session"}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {formatDate(session.created)}
                </span>
                {session.gitBranch && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {session.gitBranch}
                  </Badge>
                )}
                <Badge variant="secondary">
                  {session.messageCount} messages
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Commits section */}
        {session.commits && session.commits.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Commits in this session
            </h2>
            <div className="space-y-2">
              {session.commits.map((commit, idx) => (
                <Card
                  key={`${commit.commitHash}-${idx}`}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-4 text-green-600 dark:text-green-400"
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
                      <code className="rounded bg-muted px-2 py-0.5 font-mono text-sm">
                        {commit.commitHash}
                      </code>
                      <Badge variant="secondary" className="text-xs">
                        {commit.branch}
                      </Badge>
                    </div>
                    {commit.repoUrl && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {commit.repoUrl}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    {new Date(commit.timestamp).toLocaleTimeString()}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Messages section */}
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Conversation
          </h2>
          <div className="space-y-2">
            {session.messages?.map((message) => (
              <MessageBubble key={message.uuid} message={message} />
            ))}
          </div>

          {(!session.messages || session.messages.length === 0) && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No messages in this session</p>
            </Card>
          )}
        </section>
      </main>
    </div>
  )
}
