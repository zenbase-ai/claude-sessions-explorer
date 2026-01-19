# TODO: Session Learning Extraction

> **Status: ✅ COMPLETED** (2026-01-18)

## Phase 1: Project Setup

- [x] Create package structure
  - [x] `src/claude_sessions_explorer/__init__.py`
  - [x] `src/claude_sessions_explorer/memory/__init__.py`
  - [x] `src/claude_sessions_explorer/prompts/__init__.py`

- [x] Create data directories
  - [x] `.data/extractions/`
  - [x] `.data/memory/`
  - [x] `.data/generated/`

- [x] Define Pydantic models for data structures
  - [x] `EpisodicMemory` - incident/resolution pairs
  - [x] `SemanticMemory` - general knowledge
  - [x] `ProceduralMemory` - workflows
  - [x] `Decision` - architectural choices
  - [x] `Gotcha` - things that don't work
  - [x] `SessionExtraction` - per-session output
  - [x] `ProjectMemory` - consolidated memory
  - [x] `ActionableTask` - generated fix tasks

## Phase 2: Extraction (GEPA-style Reflection)

- [x] Create `src/claude_sessions_explorer/memory/extractor.py`
  - [x] Load session JSONL file
  - [x] Format as execution trace (user prompts, tool calls, results, errors)
  - [x] Call Claude Agent SDK with reflective extraction prompt
  - [x] Parse response into `SessionExtraction` model
  - [x] Save to `.data/extractions/<project>/<session-id>.json`

- [x] Create extraction prompt (`src/claude_sessions_explorer/prompts/extract.py`)
  - [x] Reflective analysis instructions
  - [x] JSON schema for structured output
  - [x] Examples for each memory type
  - [x] Scope tagging (universal vs environment-specific)

- [x] Add CLI command: `extract <session-id>`
  - [x] Validate session exists
  - [x] Show extraction progress
  - [x] Display summary of extracted items

- [x] Add CLI command: `extract-all -p <project>`
  - [x] Find all sessions for project
  - [x] Skip already-extracted (unless `--force`)
  - [x] Filter out sub-agent sessions
  - [x] Progress and summary

## Phase 3: Consolidation

- [x] Create `src/claude_sessions_explorer/memory/consolidator.py`
  - [x] Load all extractions for a project
  - [x] Group similar items (fuzzy matching)
  - [x] Track frequency and recency
  - [x] Call Claude to merge intelligently
  - [x] Save to `.data/memory/<project>/consolidated.json`

- [x] Create consolidation prompt (`src/claude_sessions_explorer/prompts/consolidate.py`)
  - [x] Deduplication instructions
  - [x] Frequency weighting guidance
  - [x] Environment-specific filtering

- [x] Add CLI command: `consolidate -p <project>`
  - [x] Load extractions
  - [x] Show consolidation progress
  - [x] Display summary

## Phase 4: Generation

- [x] Create `src/claude_sessions_explorer/memory/generator.py`
  - [x] Load consolidated memory
  - [x] Generate CLAUDE.md content
  - [x] Generate skill files (custom slash commands)
  - [x] Generate actionable tasks
  - [x] Generate knowledge.json (queryable format)
  - [x] Save to `.data/generated/<project>/`
  - [x] Verification step to validate content
  - [x] Frequency filtering (only repeated patterns)
  - [x] Stale item filtering

- [x] Create generation prompts (`src/claude_sessions_explorer/prompts/generate.py`)
  - [x] CLAUDE.md format template
  - [x] Skill file format template
  - [x] Task generation prompt
  - [x] Verification prompt
  - [x] Priority/ordering rules

- [x] Add CLI command: `generate -p <project>`
  - [x] Generate all outputs
  - [x] Show verification results

- [x] Add CLI command: `apply -p <project>`
  - [x] Backup existing CLAUDE.md
  - [x] Copy generated files to project

## Phase 5: All-in-One

- [x] Add CLI command: `learn -p <project>`
  - [x] Run extract-all (if new sessions)
  - [x] Run consolidate
  - [x] Run generate
  - [x] Show summary of learnings

- [x] Add CLI command: `query -p <project> "question"`
  - [x] Load consolidated memory
  - [x] Search for relevant items
  - [x] Return formatted answer

## Phase 6: Polish

- [x] Update project README
- [x] Add usage examples
- [ ] Add tests for each module
- [ ] Add logging with verbosity levels
- [ ] Handle edge cases (empty sessions, API errors)

## Future Enhancements

- [ ] Incremental learning (only new sessions since last run)
- [ ] Cross-project insights
- [x] Web UI for browsing/editing memories (basic knowledge page added)
- [ ] Hooks integration (auto-learn on session end)
- [ ] Confidence decay for old memories
- [ ] Conflict detection alerts
