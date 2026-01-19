# Claude Sessions Explorer

Browse and explore your Claude Code session history.

## Options

### Web App (Next.js)

A full-featured web interface to browse sessions.

```bash
cd next
bun install
bun run dev
```

Open http://localhost:3000

**Features:**
- Dashboard with stats overview
- Project browser
- Session viewer with markdown rendering
- Commit tracking with GitHub links
- Collapsible tool calls

### CLI (Python)

Quick command-line exploration. No dependencies required.

```bash
python explore.py                    # Stats overview
python explore.py projects           # List all projects
python explore.py sessions           # List recent sessions
python explore.py sessions -p pixel  # Filter by project name
python explore.py search "auth"      # Search prompts
python explore.py show <session-id>  # View a session
python explore.py tools              # Tool usage statistics
python explore.py commits            # List tracked commits
python explore.py export data.json   # Export all data to JSON
python explore.py open               # Open web UI in browser
```

## Commit Tracking

Track git commits made during Claude Code sessions.

### Setup

1. **Copy the hook script:**

```bash
mkdir -p ~/.claude/scripts
cp hooks/track-commits.sh ~/.claude/scripts/
chmod +x ~/.claude/scripts/track-commits.sh
```

2. **Add to Claude Code settings** (`~/.claude/settings.json`):

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

3. **Restart Claude Code**

Commits will now appear in the session viewer with links to GitHub.

## Session Data

| Data | Path |
|------|------|
| Prompts | `~/.claude/history.jsonl` |
| Conversations | `~/.claude/projects/<hash>/*.jsonl` |
| Session index | `~/.claude/projects/<hash>/sessions-index.json` |
| Commits | `~/.claude/projects/<hash>/*.commits.json` |
| Stats | `~/.claude/stats-cache.json` |

## Session Retention

Keep sessions longer than the default 30 days:

```json
{
  "cleanupPeriodDays": 365
}
```

## License

MIT
