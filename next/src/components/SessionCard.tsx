import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, truncate } from "@/lib/utils"
import type { SessionIndexEntry } from "@/types"

type SessionCardProps = {
  session: SessionIndexEntry
}

export const SessionCard: React.FC<SessionCardProps> = ({ session }) => (
  <Link href={`/sessions/${session.sessionId}`}>
    <Card className="p-4 transition-colors hover:border-primary/50 hover:bg-accent/50">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-card-foreground">
            {truncate(session.firstPrompt || "No prompt", 100)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {session.messageCount} messages
            </Badge>
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
