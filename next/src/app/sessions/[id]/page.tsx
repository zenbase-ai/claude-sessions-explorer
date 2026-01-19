/**
 * Session Detail Page
 *
 * Displays the full conversation history for a Claude Code session.
 * Shows messages as chat bubbles and lists any git commits made during the session.
 *
 * URL Parameters:
 * - id: The session ID (UUID format)
 *
 * Data Flow:
 * 1. On mount, fetches full session from /api/sessions/[id]
 * 2. API searches all projects to find the session
 * 3. Returns messages from JSONL file and commits from .commits.json
 *
 * Sections:
 * - Commits: Shows git commits made during the session (if any)
 *   - Links to GitHub/GitLab if remote URL is available
 * - Conversation: Chat-style message bubbles using MessageBubble component
 *
 * Navigation:
 * - Back button links to the project this session belongs to
 *
 * Architecture Notes:
 * - Client component using useParams hook
 * - Sticky header for navigation while scrolling
 * - Messages rendered with MessageBubble component
 */

"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { MessageBubble } from "@/components/MessageBubble"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import type { Session } from "@/types"

export default function SessionPage() {
  // Get session ID from URL
  const params = useParams()
  const id = params.id as string

  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch session on mount or when ID changes
  useEffect(() => {
    fetch(`/api/sessions/${id}`)
      .then((res) => res.json())
      .then((data) => setSession(data.session))
      .finally(() => setLoading(false))
  }, [id])

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // Not found state
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
      {/* Sticky header with session info */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Back to project */}
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
              {/* Session title (first prompt) */}
              <h1 className="truncate text-lg font-semibold text-foreground">
                {session.firstPrompt || "Session"}
              </h1>
              {/* Session metadata */}
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
        {/* Commits section - only shown if commits exist */}
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
                  {/* Commit success icon */}
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
                      {/* Commit hash - links to GitHub if remote URL exists */}
                      {commit.repoUrl ? (
                        <a
                          href={`${commit.repoUrl.replace(/\.git$/, "")}/commit/${commit.commitHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded bg-muted px-2 py-0.5 font-mono text-sm hover:bg-primary/20 hover:text-primary transition-colors"
                        >
                          {commit.commitHash}
                        </a>
                      ) : (
                        <code className="rounded bg-muted px-2 py-0.5 font-mono text-sm">
                          {commit.commitHash}
                        </code>
                      )}
                      {/* Branch badge */}
                      <Badge variant="secondary" className="text-xs">
                        {commit.branch}
                      </Badge>
                      {/* GitHub icon link */}
                      {commit.repoUrl && (
                        <a
                          href={commit.repoUrl.replace(/\.git$/, "")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="size-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                  {/* Commit timestamp */}
                  <div className="shrink-0 text-xs text-muted-foreground">
                    {new Date(commit.timestamp).toLocaleTimeString()}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Messages section - the conversation */}
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Conversation
          </h2>
          <div className="space-y-2">
            {session.messages?.map((message) => (
              <MessageBubble key={message.uuid} message={message} />
            ))}
          </div>

          {/* Empty state */}
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
