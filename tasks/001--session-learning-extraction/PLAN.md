# Session Learning Extraction

Extract learnings from Claude Code sessions to generate project-specific knowledge.

## Goal

Analyze session history to identify:
- Repeated mistakes and how they were fixed
- Common patterns and conventions
- Frequently used commands
- Project-specific decisions

Output: Auto-generated CLAUDE.md additions and custom skills.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Session Analysis                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Session 1 ──┐                                               │
│  Session 2 ──┼──► Extract ──► learnings.json                │
│  Session N ──┘      │                                        │
│                     │ (Claude Agent SDK)                     │
│                     ▼                                        │
│              Per-session extraction:                         │
│              - errors_fixed[]                                │
│              - patterns[]                                    │
│              - commands[]                                    │
│              - decisions[]                                   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                       Merge & Analyze                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  All learnings ──► Dedupe ──► Weight by frequency            │
│                      │                                       │
│                      ▼                                       │
│              Merged learnings:                               │
│              - Top errors (seen 5x = important)              │
│              - Common patterns                               │
│              - Must-run commands                             │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                        Generate Output                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Merged ──► Generate ──► CLAUDE.md additions                 │
│                │                                             │
│                ├──► Custom slash commands                    │
│                │                                             │
│                └──► Project rules/conventions                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Structures

### Per-Session Extraction

```json
{
  "session_id": "uuid",
  "project": "project-name",
  "extracted_at": "2026-01-18T...",

  "errors_fixed": [
    {
      "error": "TypeError: Cannot read property 'x' of undefined",
      "fix": "Added null check before accessing property",
      "file": "src/utils.ts",
      "frequency": 1
    }
  ],

  "patterns": [
    {
      "pattern": "Use async/await instead of .then()",
      "context": "API calls",
      "examples": ["fetchUser()", "getData()"]
    }
  ],

  "commands": [
    {
      "command": "bun run test",
      "purpose": "Run tests before commit",
      "frequency": 5
    }
  ],

  "decisions": [
    {
      "decision": "Use Tailwind CSS for styling",
      "rationale": "Consistent with existing codebase",
      "date": "2026-01-15"
    }
  ],

  "conventions": [
    {
      "rule": "Components in src/components/",
      "type": "file_structure"
    }
  ]
}
```

### Merged Output

```json
{
  "project": "project-name",
  "generated_at": "2026-01-18T...",
  "session_count": 25,

  "top_errors": [
    {
      "error": "Type error pattern",
      "fix": "Standard fix",
      "occurrences": 5,
      "sessions": ["uuid1", "uuid2", ...]
    }
  ],

  "conventions": [...],
  "commands": [...],
  "patterns": [...]
}
```

## CLI Commands

### Extract from single session

```bash
rye run python explore.py extract <session-id>
# Output: tasks/extractions/<session-id>.json
```

### Extract from all sessions in a project

```bash
rye run python explore.py extract-project <project-name>
# Output: tasks/extractions/<project>/*.json
```

### Learn (merge + generate)

```bash
rye run python explore.py learn -p <project-name>
# Output:
#   - tasks/learnings/<project>/merged.json
#   - tasks/learnings/<project>/CLAUDE.md.suggested
#   - tasks/learnings/<project>/commands/*.md
```

### Apply learnings

```bash
rye run python explore.py apply -p <project-name>
# Copies suggested CLAUDE.md to project
```

## Implementation Steps

See TODO.md for detailed tasks.

## Prompt Templates

### Extraction Prompt

```
Analyze this Claude Code session and extract learnings.

Session messages:
{messages}

Extract:
1. Errors encountered and how they were fixed
2. Coding patterns and conventions used
3. Commands run frequently
4. Decisions made about architecture/tools
5. Any rules or conventions established

Return as JSON matching this schema:
{schema}
```

### Merge Prompt

```
Merge these session learnings into consolidated project knowledge.

Learnings from {n} sessions:
{learnings}

Deduplicate, weight by frequency, and generate:
1. Top recurring errors and fixes
2. Established conventions
3. Common commands to run
4. Key decisions

Return as JSON.
```

### Generate CLAUDE.md Prompt

```
Generate CLAUDE.md content from these project learnings.

Learnings:
{merged_learnings}

Generate concise, actionable instructions that will help
Claude Code avoid past mistakes and follow established patterns.

Format as markdown with sections:
- Common Errors to Avoid
- Conventions
- Commands
- Notes
```

## Files to Create

```
src/claude_sessions_explorer/
├── __init__.py
├── extractor.py      # Session extraction logic
├── merger.py         # Merge multiple extractions
├── generator.py      # Generate CLAUDE.md / commands
└── prompts/
    ├── extract.txt
    ├── merge.txt
    └── generate.txt

tasks/
├── extractions/      # Per-session extractions
│   └── <session-id>.json
└── learnings/        # Merged learnings per project
    └── <project>/
        ├── merged.json
        ├── CLAUDE.md.suggested
        └── commands/
```
