# Claude Code Sessions Explorer

Tools and documentation for exploring, searching, and analyzing Claude Code session history.

## Session Storage Locations

| What | Path | Format |
|------|------|--------|
| All prompts (all projects) | `~/.claude/history.jsonl` | JSONL - one entry per user message |
| Full conversations | `~/.claude/projects/<project-hash>/*.jsonl` | JSONL - complete message history |
| Session summaries | `~/.claude/projects/<project-hash>/sessions-index.json` | JSON - metadata for all sessions |
| Project memory | `~/.claude/projects/<project-hash>/CLAUDE.md` | Markdown |
| Usage statistics | `~/.claude/stats-cache.json` | JSON |
| Todo lists | `~/.claude/todos/` | JSON |

## Data Structures

### history.jsonl Entry

```json
{
  "display": "your prompt text",
  "pastedContents": {},
  "timestamp": 1759271168143,
  "project": "/Users/you/workspace/project-name"
}
```

### sessions-index.json Entry

```json
{
  "sessionId": "uuid",
  "fullPath": "/Users/you/.claude/projects/.../session.jsonl",
  "firstPrompt": "what the session was about",
  "messageCount": 18,
  "created": "2026-01-01T07:59:34.980Z",
  "modified": "2026-01-01T08:05:39.942Z",
  "gitBranch": "main",
  "projectPath": "/Users/you/workspace/project"
}
```

### Session JSONL (full conversation)

Each line is a message object containing:
- `type`: "human" or "assistant"
- `content`: the message content (text or tool calls)
- `timestamp`: when the message was sent
- Tool calls and results for assistant messages

## Quick Commands

```bash
# List all unique projects you've worked on
jq -r '.project' ~/.claude/history.jsonl | sort | uniq -c | sort -rn

# Search for specific topics across all sessions
grep -i "keyword" ~/.claude/history.jsonl | jq '.display'

# Get sessions from a specific project
jq -r 'select(.project | contains("project-name")) | .display' ~/.claude/history.jsonl

# Export to CSV for analysis
jq -r '[.timestamp, .project, .display] | @csv' ~/.claude/history.jsonl > ~/claude_sessions.csv

# List all sessions with first prompts across all projects
for idx in ~/.claude/projects/*/sessions-index.json; do
  project=$(dirname "$idx" | xargs basename)
  echo "=== $project ==="
  jq -r '.entries[] | "\(.created): \(.firstPrompt)"' "$idx" 2>/dev/null | head -5
done
```

## Usage

```bash
# Explore sessions
python explore.py

# Search across all sessions
python explore.py --search "authentication"

# Export all data to JSON
python explore.py --export all_sessions.json
```
