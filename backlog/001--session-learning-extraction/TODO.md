# TODO: Session Learning Extraction

## Phase 1: Project Setup

- [ ] Create package structure
  - [ ] `src/claude_sessions_explorer/__init__.py`
  - [ ] `src/claude_sessions_explorer/memory/__init__.py`
  - [ ] `src/claude_sessions_explorer/prompts/__init__.py`
  - [ ] `src/claude_sessions_explorer/cli/__init__.py`

- [ ] Create data directories
  - [ ] `.data/extractions/`
  - [ ] `.data/memory/`
  - [ ] `.data/generated/`

- [ ] Define Pydantic models for data structures
  - [ ] `EpisodicMemory` - incident/resolution pairs
  - [ ] `SemanticMemory` - general knowledge
  - [ ] `ProceduralMemory` - workflows
  - [ ] `Decision` - architectural choices
  - [ ] `Gotcha` - things that don't work
  - [ ] `SessionExtraction` - per-session output
  - [ ] `ProjectMemory` - consolidated memory

## Phase 2: Extraction (GEPA-style Reflection)

- [ ] Create `src/claude_sessions_explorer/memory/extractor.py`
  - [ ] Load session JSONL file
  - [ ] Format as execution trace (user prompts, tool calls, results, errors)
  - [ ] Call Claude Agent SDK with reflective extraction prompt
  - [ ] Parse response into `SessionExtraction` model
  - [ ] Save to `.data/extractions/<project>/<session-id>.json`

- [ ] Create extraction prompt (`src/claude_sessions_explorer/prompts/extract.py`)
  - [ ] Reflective analysis instructions
  - [ ] JSON schema for structured output
  - [ ] Examples for each memory type

- [ ] Add CLI command: `extract <session-id>`
  - [ ] Validate session exists
  - [ ] Show extraction progress
  - [ ] Display summary of extracted items

- [ ] Add CLI command: `extract-all -p <project>`
  - [ ] Find all sessions for project
  - [ ] Skip already-extracted (unless `--force`)
  - [ ] Rate limiting between calls
  - [ ] Progress bar and summary

## Phase 3: Consolidation

- [ ] Create `src/claude_sessions_explorer/memory/consolidator.py`
  - [ ] Load all extractions for a project
  - [ ] Group similar items (fuzzy matching)
  - [ ] Track frequency and recency
  - [ ] Call Claude to merge intelligently
  - [ ] Identify conflicts/contradictions
  - [ ] Save to `.data/memory/<project>/consolidated.json`
  - [ ] Archive previous version to `history/`

- [ ] Create consolidation prompt (`src/claude_sessions_explorer/prompts/consolidate.py`)
  - [ ] Deduplication instructions
  - [ ] Conflict resolution rules
  - [ ] Frequency weighting guidance

- [ ] Add CLI command: `consolidate -p <project>`
  - [ ] Load extractions
  - [ ] Show consolidation progress
  - [ ] Display diff from previous version

## Phase 4: Generation

- [ ] Create `src/claude_sessions_explorer/memory/generator.py`
  - [ ] Load consolidated memory
  - [ ] Generate CLAUDE.md content
  - [ ] Generate skill files (custom slash commands)
  - [ ] Generate knowledge.json (queryable format)
  - [ ] Save to `.data/generated/<project>/`

- [ ] Create generation prompts (`src/claude_sessions_explorer/prompts/generate.py`)
  - [ ] CLAUDE.md format template
  - [ ] Skill file format template
  - [ ] Priority/ordering rules

- [ ] Add CLI command: `generate -p <project>`
  - [ ] Generate all outputs
  - [ ] Preview generated content

- [ ] Add CLI command: `apply -p <project>`
  - [ ] Show diff with existing files
  - [ ] Backup existing CLAUDE.md
  - [ ] Copy generated files to project
  - [ ] Confirm before overwriting

## Phase 5: All-in-One

- [ ] Add CLI command: `learn -p <project>`
  - [ ] Run extract-all (if new sessions)
  - [ ] Run consolidate
  - [ ] Run generate
  - [ ] Show summary of learnings

- [ ] Add CLI command: `query -p <project> "question"`
  - [ ] Load consolidated memory
  - [ ] Search for relevant items
  - [ ] Return formatted answer

## Phase 6: Polish

- [ ] Add tests for each module
- [ ] Add logging with verbosity levels
- [ ] Handle edge cases (empty sessions, API errors)
- [ ] Update project README
- [ ] Add usage examples

## Future Enhancements

- [ ] Incremental learning (only new sessions since last run)
- [ ] Cross-project insights
- [ ] Web UI for browsing/editing memories
- [ ] Hooks integration (auto-learn on session end)
- [ ] Confidence decay for old memories
- [ ] Conflict detection alerts
