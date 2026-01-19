# Session Learning Extraction

Build a memory system that learns from Claude Code sessions to generate project-specific knowledge.

## Inspiration

This approach is inspired by several sources:

- **[Mem0 Context Engineering](https://mem0.ai/blog/context-engineering-ai-agents-guide)** - Multi-level memory hierarchy (episodic, semantic, procedural) based on cognitive science
- **[GEPA (DSPy Optimizer)](https://github.com/gepa-ai/gepa)** - Reflective prompt evolution that analyzes execution traces to identify what went well/wrong and propose improvements
- **[Amazon Bedrock AgentCore Memory](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-memory.html)** - Session summaries and persistent memory for AI agents
- **[Claude Code Best Practices](https://docs.anthropic.com/en/docs/claude-code/best-practices)** - CLAUDE.md files for project-specific instructions

Key insight from GEPA: Instead of just extracting knowledge, we use **LLM reflection on execution traces** to identify:
1. What went well → Reinforce as best practices
2. What went wrong → Document as gotchas
3. What was repeated → Capture as workflows
4. What was decided → Record rationale

## Goal

Create a "project brain" that:
- Remembers specific incidents and how they were resolved
- Extracts general knowledge and conventions
- Learns workflows and multi-step processes
- Tracks architectural decisions and their rationale
- Identifies gotchas and things that don't work

**Output:** Auto-generated CLAUDE.md, custom skills, and a queryable knowledge base.

## Memory Model

Inspired by [Mem0's context engineering](https://mem0.ai/blog/context-engineering-ai-agents-guide) and cognitive science:

```
┌─────────────────────────────────────────────────────────────┐
│                     Project Memory                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  EPISODIC MEMORY                                             │
│  ─────────────────                                           │
│  Specific incidents with full context                        │
│  • "TypeError in auth.ts fixed by adding null check"         │
│  • "Build failed because missing env var"                    │
│  • "API rate limit hit, added retry logic"                   │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SEMANTIC MEMORY                                             │
│  ─────────────────                                           │
│  General knowledge extracted over time                       │
│  • "Always use async/await, not .then()"                     │
│  • "Components go in src/components/"                        │
│  • "Use zod for validation"                                  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PROCEDURAL MEMORY                                           │
│  ─────────────────                                           │
│  Learned workflows and "how-to" knowledge                    │
│  • "To deploy: bun build → docker push → kubectl apply"      │
│  • "To add feature: create branch → implement → test → PR"   │
│  • "To debug: check logs → reproduce → fix → add test"       │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  DECISION LOG                                                │
│  ─────────────────                                           │
│  Architectural choices with rationale                        │
│  • "Chose Tailwind over CSS modules for consistency"         │
│  • "Using Redis for caching because of existing infra"       │
│  • "Monorepo structure for shared types"                     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GOTCHAS                                                     │
│  ─────────────────                                           │
│  Things that don't work or cause problems                    │
│  • "Don't use default exports - breaks tree shaking"         │
│  • "API v2 endpoint is deprecated, use v3"                   │
│  • "Tests fail if DB not seeded first"                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Reflective Extraction (GEPA-Inspired)

Like GEPA's approach to prompt optimization, we treat each Claude Code session as an **execution trace** and use LLM reflection to extract insights:

```
Session Trace Analysis
──────────────────────────────────────────────────────────────

1. TRACE CAPTURE
   ├── User prompts (what was asked)
   ├── Tool calls (what Claude did)
   ├── Tool results (what happened)
   ├── Errors/retries (what went wrong)
   └── Final outcomes (what succeeded)

2. REFLECTIVE ANALYSIS (LLM reviews the trace)
   ├── "The build failed because X, then succeeded after Y"
   ├── "The user asked to do A, we followed pattern B"
   ├── "Tried approach X, didn't work, switched to Y"
   └── "Made architectural choice X because of Y"

3. KNOWLEDGE EXTRACTION
   ├── Episodic: Specific incident → resolution pairs
   ├── Semantic: Generalizable rules and conventions
   ├── Procedural: Multi-step workflows discovered
   ├── Decisions: Choices made with rationale
   └── Gotchas: Things that failed or caused issues
```

This differs from simple summarization because we:
- **Attribute success/failure** to specific actions
- **Extract causal relationships** (X happened because Y)
- **Identify repeated patterns** across the trace
- **Preserve context** about why things worked or didn't

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    1. EXTRACT                                │
│                    (per session, GEPA-style reflection)      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Session JSONL ──► Claude Agent SDK ──► memory.json         │
│                     (reflective analysis)                    │
│                                                              │
│   Analyzes execution trace to extract:                       │
│   • What happened (episodic)                                 │
│   • What was learned (semantic)                              │
│   • What process was followed (procedural)                   │
│   • What was decided (decisions)                             │
│   • What didn't work (gotchas)                               │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    2. CONSOLIDATE                            │
│                    (per project)                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   All memories ──► Dedupe ──► Weight ──► Consolidate         │
│                                                              │
│   • Merge similar items                                      │
│   • Track frequency (seen 5x = important)                    │
│   • Identify conflicts/contradictions                        │
│   • Build relationships between concepts                     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    3. GENERATE                               │
│                    (outputs)                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Consolidated ──► CLAUDE.md (instructions for Claude)       │
│               ──► skills/ (custom slash commands)            │
│               ──► knowledge.json (queryable memory)          │
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
  "session_summary": "Implemented user authentication with OAuth",

  "episodic": [
    {
      "incident": "TypeError: Cannot read property 'user' of undefined",
      "context": "Accessing user before auth check completed",
      "resolution": "Added await to auth middleware",
      "file": "src/middleware/auth.ts",
      "severity": "error"
    }
  ],

  "semantic": [
    {
      "knowledge": "Always await auth middleware before accessing user",
      "category": "authentication",
      "confidence": "high"
    },
    {
      "knowledge": "Use zod schemas for API request validation",
      "category": "validation",
      "confidence": "high"
    }
  ],

  "procedural": [
    {
      "workflow": "Adding new API endpoint",
      "steps": [
        "Create route in src/routes/",
        "Add zod schema for request/response",
        "Implement handler",
        "Add tests",
        "Update OpenAPI spec"
      ],
      "trigger": "when adding new endpoint"
    }
  ],

  "decisions": [
    {
      "decision": "Use HttpOnly cookies for auth tokens",
      "rationale": "More secure than localStorage, prevents XSS",
      "alternatives_considered": ["localStorage", "sessionStorage"],
      "date": "2026-01-18"
    }
  ],

  "gotchas": [
    {
      "issue": "Tests fail with 'connection refused'",
      "cause": "Database container not running",
      "solution": "Run 'docker-compose up -d db' first",
      "tags": ["testing", "docker"]
    }
  ]
}
```

### Consolidated Project Memory

```json
{
  "project": "project-name",
  "project_path": "/Users/x/workspace/project",
  "generated_at": "2026-01-18T...",
  "sessions_analyzed": 25,
  "last_session": "2026-01-18T...",

  "episodic": [
    {
      "incident": "TypeError on user access",
      "resolution": "Add await to auth",
      "occurrences": 3,
      "sessions": ["uuid1", "uuid2", "uuid3"],
      "last_seen": "2026-01-15"
    }
  ],

  "semantic": [
    {
      "knowledge": "Always await auth middleware",
      "category": "authentication",
      "frequency": 5,
      "confidence": "high"
    }
  ],

  "procedural": [
    {
      "workflow": "Adding new API endpoint",
      "steps": ["..."],
      "times_used": 8
    }
  ],

  "decisions": [
    {
      "decision": "HttpOnly cookies for auth",
      "rationale": "Security",
      "status": "active"
    }
  ],

  "gotchas": [
    {
      "issue": "Tests need DB running",
      "solution": "docker-compose up -d db",
      "frequency": 4
    }
  ]
}
```

## CLI Commands

```bash
# Extract from a single session
rye run python explore.py extract <session-id>

# Extract from all sessions in a project
rye run python explore.py extract-all -p <project>

# Consolidate extractions into project memory
rye run python explore.py consolidate -p <project>

# Generate CLAUDE.md and skills from memory
rye run python explore.py generate -p <project>

# All-in-one: extract + consolidate + generate
rye run python explore.py learn -p <project>

# Apply generated files to project
rye run python explore.py apply -p <project>

# Query project memory
rye run python explore.py query -p <project> "how to add endpoint"
```

## Output Files

```
.data/
├── extractions/
│   └── <project>/
│       └── <session-id>.json       # Per-session extraction
│
├── memory/
│   └── <project>/
│       ├── consolidated.json       # Merged project memory
│       └── history/                # Previous versions
│           └── 2026-01-18.json
│
└── generated/
    └── <project>/
        ├── CLAUDE.md               # Ready to copy to project
        ├── skills/                 # Custom slash commands
        │   ├── add-endpoint.md
        │   └── run-tests.md
        └── knowledge.json          # Queryable format
```

## Generated CLAUDE.md Format

```markdown
# Project: my-app

> Auto-generated from 25 Claude Code sessions
> Last updated: 2026-01-18

## Common Errors

- **TypeError on user access**: Always await auth middleware before accessing `req.user`
- **Connection refused in tests**: Run `docker-compose up -d db` before testing

## Conventions

- Use async/await, not .then() chains
- Components in `src/components/`, hooks in `src/hooks/`
- Validate all API inputs with zod schemas

## Workflows

### Adding a New API Endpoint
1. Create route in `src/routes/`
2. Add zod schema for request/response
3. Implement handler
4. Add tests
5. Update OpenAPI spec

## Decisions

- **Auth tokens**: HttpOnly cookies (not localStorage) for XSS prevention
- **Styling**: Tailwind CSS for consistency with existing code

## Gotchas

- Don't use default exports - breaks tree shaking
- API v2 is deprecated, always use v3
- Tests require seeded database
```

## Implementation

### Files to Create

```
src/claude_sessions_explorer/
├── __init__.py
├── memory/
│   ├── __init__.py
│   ├── extractor.py      # Extract from single session
│   ├── consolidator.py   # Merge multiple extractions
│   └── generator.py      # Generate CLAUDE.md / skills
├── prompts/
│   ├── extract.py        # Extraction prompt template
│   ├── consolidate.py    # Consolidation prompt
│   └── generate.py       # Generation prompts
└── cli/
    ├── __init__.py
    └── commands.py       # CLI command handlers
```

### Key Dependencies

- `claude-agent-sdk` - Call Claude for extraction/generation
- `pydantic` - Data validation and schemas
- Already installed via rye

## Future Enhancements

1. **Incremental learning** - Only process new sessions
2. **Memory queries** - "How did we fix X last time?"
3. **Cross-project insights** - Patterns across all projects
4. **Hooks integration** - Auto-learn on session end
5. **Web UI** - Browse and edit memories
6. **Conflict detection** - Flag contradictory learnings
7. **Confidence decay** - Old memories become less confident
