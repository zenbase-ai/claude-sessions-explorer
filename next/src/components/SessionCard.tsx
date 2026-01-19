import Link from "next/link";
import type { SessionIndexEntry } from "@/types";

interface SessionCardProps {
  session: SessionIndexEntry;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

export function SessionCard({ session }: SessionCardProps) {
  return (
    <Link
      href={`/sessions/${session.sessionId}`}
      className="block rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {truncate(session.firstPrompt || "No prompt", 100)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <span>{session.messageCount} messages</span>
            {session.gitBranch && (
              <>
                <span>·</span>
                <span className="font-mono text-xs">{session.gitBranch}</span>
              </>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right text-sm text-zinc-500 dark:text-zinc-400">
          <p>{formatDate(session.modified)}</p>
        </div>
      </div>
    </Link>
  );
}
