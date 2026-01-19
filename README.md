# Claude Sessions Explorer

A web app to browse and explore your Claude Code session history, with commit tracking.

## Features

- **Dashboard** - Overview of sessions, messages, tokens, and projects
- **Project Browser** - View all projects with Claude Code sessions
- **Session Viewer** - Full conversation history with markdown rendering
- **Commit Tracking** - See which git commits were made during each session
- **Collapsible Tool Calls** - Expand/collapse tool inputs and outputs

## Quick Start

```bash
cd next
bun install
bun run dev
```

Open http://localhost:3000 to browse your sessions.

## Commit Tracking Setup

To track git commits made during Claude Code sessions, add this hook to your Claude Code settings.

### 1. Create the hook script

Save this to `~/.claude/scripts/track-commits.sh`:

```bash
#!/bin/bash

# Claude Code PostToolUse hook to track git commits
# Writes commits to a JSON file alongside the session JSONL

set -o pipefail
trap 'exit 0' ERR

command -v jq >/dev/null 2>&1 || exit 0

INPUT=$(cat 2>/dev/null) || exit 0
[ -z "$INPUT" ] && exit 0

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null) || exit 0
[ "$TOOL_NAME" != "Bash" ] && exit 0

STDOUT=$(echo "$INPUT" | jq -r '.tool_response.stdout // empty' 2>/dev/null) || exit 0
[ -z "$STDOUT" ] && exit 0

# Check for git commit output pattern: [branch hash]
echo "$STDOUT" | grep -qE '^\[.+ [a-f0-9]{7,}\]' || exit 0

COMMIT_LINE=$(echo "$STDOUT" | grep -oE '^\[.+ [a-f0-9]{7,}\]' 2>/dev/null | head -1) || exit 0
[ -z "$COMMIT_LINE" ] && exit 0

BRANCH=$(echo "$COMMIT_LINE" | sed -E 's/^\[(.+) [a-f0-9]+\]$/\1/' 2>/dev/null) || exit 0
HASH=$(echo "$COMMIT_LINE" | sed -E 's/^\[.+ ([a-f0-9]+)\]$/\1/' 2>/dev/null) || exit 0
[ -z "$BRANCH" ] || [ -z "$HASH" ] && exit 0

SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty' 2>/dev/null) || exit 0
CWD=$(echo "$INPUT" | jq -r '.cwd // empty' 2>/dev/null) || exit 0
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty' 2>/dev/null) || exit 0

if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
  COMMITS_FILE="${TRANSCRIPT_PATH%.jsonl}.commits.json"
else
  exit 0
fi

COMMITS_DIR=$(dirname "$COMMITS_FILE")
[ -d "$COMMITS_DIR" ] && [ -w "$COMMITS_DIR" ] || exit 0

REPO_URL=""
if [ -n "$CWD" ] && [ -d "$CWD" ]; then
  REPO_URL=$(cd "$CWD" 2>/dev/null && git remote get-url origin 2>/dev/null) || REPO_URL=""
fi

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null) || exit 0

NEW_COMMIT=$(jq -n -c \
  --arg hash "$HASH" \
  --arg branch "$BRANCH" \
  --arg repo "$REPO_URL" \
  --arg cwd "$CWD" \
  --arg ts "$TIMESTAMP" \
  '{commitHash: $hash, branch: $branch, repoUrl: $repo, cwd: $cwd, timestamp: $ts}' 2>/dev/null) || exit 0

[ -z "$NEW_COMMIT" ] && exit 0

if [ -f "$COMMITS_FILE" ]; then
  EXISTING=$(cat "$COMMITS_FILE" 2>/dev/null) || EXISTING="[]"
  echo "$EXISTING" | jq -e 'type == "array"' >/dev/null 2>&1 || EXISTING="[]"
else
  EXISTING="[]"
fi

RESULT=$(echo "$EXISTING" | jq -c ". + [$NEW_COMMIT]" 2>/dev/null) || exit 0
[ -z "$RESULT" ] && exit 0

TEMP_FILE="${COMMITS_FILE}.tmp.$$"
echo "$RESULT" > "$TEMP_FILE" 2>/dev/null && mv "$TEMP_FILE" "$COMMITS_FILE" 2>/dev/null || rm -f "$TEMP_FILE" 2>/dev/null

exit 0
```

Make it executable:

```bash
chmod +x ~/.claude/scripts/track-commits.sh
```

### 2. Add the hook to Claude Code settings

Add this to your `~/.claude/settings.json` (or create the file):

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "$HOME/.claude/scripts/track-commits.sh"
          }
        ]
      }
    ]
  }
}
```

### 3. Restart Claude Code

The hook will now track all git commits made during sessions. Commits will appear in the session viewer with links to GitHub.

## Session Data Locations

| Data | Path | Format |
|------|------|--------|
| All prompts | `~/.claude/history.jsonl` | JSONL |
| Conversations | `~/.claude/projects/<hash>/*.jsonl` | JSONL |
| Session index | `~/.claude/projects/<hash>/sessions-index.json` | JSON |
| Commit tracking | `~/.claude/projects/<hash>/*.commits.json` | JSON |
| Usage stats | `~/.claude/stats-cache.json` | JSON |

## Session Retention

By default, Claude Code removes sessions older than 30 days. To keep sessions longer, add to your settings:

```json
{
  "cleanupPeriodDays": 365
}
```

## Tech Stack

- Next.js 16 with App Router
- Tailwind CSS v4
- shadcn/ui components
- TypeScript

## License

MIT
