/**
 * SessionCard Component
 *
 * Displays a preview card for a Claude Code session.
 * Used in session lists on the dashboard and project detail pages.
 *
 * Features:
 * - Shows first prompt as title (or "Empty session" if none)
 * - Displays message count and git branch badges
 * - Shows last modified date
 * - Links to the full session view
 *
 * Used by: Dashboard (recent sessions), /projects/[id] page
 */

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn, formatDate, truncate } from "@/lib/utils"
import type { SessionIndexEntry } from "@/types"

/**
 * Props for the SessionCard component
 */
type SessionCardProps = {
  /** Session metadata from the project's sessions-index.json */
  session: SessionIndexEntry
}

export const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
  // Check if session has a valid first prompt to display
  const hasPrompt = session.firstPrompt && session.firstPrompt.trim().length > 0

  return (
    <Link href={`/sessions/${session.sessionId}`}>
      <Card className="p-4 transition-colors hover:border-primary/50 hover:bg-accent/50">
        <div className="flex items-start justify-between gap-4">
          {/* Left side: prompt preview and badges */}
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "font-medium",
                hasPrompt ? "text-card-foreground" : "italic text-muted-foreground"
              )}
            >
              {hasPrompt ? truncate(session.firstPrompt!, 100) : "Empty session"}
            </p>

            {/* Session metadata badges */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{session.messageCount} messages</Badge>
              {session.gitBranch && (
                <Badge variant="outline" className="font-mono text-xs">
                  {session.gitBranch}
                </Badge>
              )}
            </div>
          </div>

          {/* Right side: modification date */}
          <div className="shrink-0 text-right">
            <p className="text-sm text-muted-foreground">
              {formatDate(session.modified)}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
