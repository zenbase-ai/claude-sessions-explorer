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

Quick command-line exploration.

```bash
# Setup (requires rye)
rye sync

# Exploration commands
rye run python explore.py                    # Stats overview
rye run python explore.py projects           # List all projects
rye run python explore.py sessions           # List recent sessions
rye run python explore.py sessions -p pixel  # Filter by project name
rye run python explore.py search "auth"      # Search prompts
rye run python explore.py show <session-id>  # View a session
rye run python explore.py tools              # Tool usage statistics
rye run python explore.py commits            # List tracked commits
rye run python explore.py export data.json   # Export all data to JSON
rye run python explore.py open               # Open web UI in browser
```

## Session Learning Extraction

Extract learnings from your Claude Code sessions to generate project-specific CLAUDE.md files and actionable tasks.

### How It Works

1. **Extract**: Analyze session transcripts using GEPA-inspired reflective analysis
2. **Consolidate**: Merge extractions into unified project memory (Mem0-style operations)
3. **Generate**: Create CLAUDE.md, skills, and actionable tasks

### Commands

```bash
# Extract from all sessions for a project
rye run python explore.py extract-all -p myproject

# Consolidate extractions into project memory
rye run python explore.py consolidate -p myproject

# Generate CLAUDE.md, skills, and tasks
rye run python explore.py generate -p myproject

# All-in-one: extract + consolidate + generate
rye run python explore.py learn -p myproject

# Apply generated files to your project
rye run python explore.py apply -p myproject -t /path/to/project

# Query project memory
rye run python explore.py query -p myproject "How do I start the dev server?"
```

### What Gets Generated

- **CLAUDE.md**: Project-specific instructions based on repeated patterns
- **Tasks**: Actionable fixes for workarounds (fix root causes, don't document them)
- **Skills**: Reusable workflows as slash commands

### Key Features

- **Frequency filtering**: Only includes patterns seen 2+ times
- **Environment detection**: Filters out user-specific issues (shell configs, local machine quirks)
- **Verification**: Validates generated content against current reality
- **Task generation**: Converts workarounds into actionable fix tasks

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
