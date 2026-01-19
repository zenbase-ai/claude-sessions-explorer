import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn, formatDate, truncate } from "@/lib/utils"
import type { SessionIndexEntry } from "@/types"

type SessionCardProps = {
  session: SessionIndexEntry
}

export const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
  const hasPrompt = session.firstPrompt && session.firstPrompt.trim().length > 0

  return (
    <Link href={`/sessions/${session.sessionId}`}>
      <Card className="p-4 transition-colors hover:border-primary/50 hover:bg-accent/50">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "font-medium",
                hasPrompt ? "text-card-foreground" : "italic text-muted-foreground"
              )}
            >
              {hasPrompt ? truncate(session.firstPrompt!, 100) : "Empty session"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{session.messageCount} messages</Badge>
              {session.gitBranch && (
                <Badge variant="outline" className="font-mono text-xs">
                  {session.gitBranch}
                </Badge>
              )}
            </div>
          </div>
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
