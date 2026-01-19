# TODO: Session Learning Extraction

## Phase 1: Core Extraction

- [ ] Create `src/claude_sessions_explorer/extractor.py`
  - [ ] Load session messages from JSONL
  - [ ] Format messages for Claude prompt
  - [ ] Call Claude Agent SDK with extraction prompt
  - [ ] Parse and validate JSON response
  - [ ] Save extraction to `tasks/extractions/<session-id>.json`

- [ ] Create extraction prompt template
  - [ ] Define JSON schema for extraction output
  - [ ] Test prompt with sample sessions
  - [ ] Iterate on prompt for better results

- [ ] Add CLI command: `extract <session-id>`
  - [ ] Add to explore.py
  - [ ] Handle errors gracefully
  - [ ] Show progress/status

## Phase 2: Batch Extraction

- [ ] Add CLI command: `extract-project <project-name>`
  - [ ] Find all sessions for project
  - [ ] Extract each session (with rate limiting)
  - [ ] Save all extractions
  - [ ] Show summary when done

- [ ] Add caching/skip logic
  - [ ] Skip already-extracted sessions
  - [ ] Add `--force` flag to re-extract

## Phase 3: Merge & Analyze

- [ ] Create `src/claude_sessions_explorer/merger.py`
  - [ ] Load all extractions for a project
  - [ ] Deduplicate similar items
  - [ ] Weight by frequency
  - [ ] Call Claude to merge intelligently
  - [ ] Save merged output

- [ ] Add CLI command: `learn -p <project>`
  - [ ] Run extraction if needed
  - [ ] Merge all extractions
  - [ ] Generate outputs

## Phase 4: Generate Outputs

- [ ] Create `src/claude_sessions_explorer/generator.py`
  - [ ] Generate CLAUDE.md suggestions
  - [ ] Generate custom slash commands
  - [ ] Format as clean markdown

- [ ] Add CLI command: `apply -p <project>`
  - [ ] Preview changes
  - [ ] Copy to project directory
  - [ ] Backup existing files

## Phase 5: Polish

- [ ] Add tests
- [ ] Add error handling
- [ ] Add logging
- [ ] Update README
- [ ] Add examples

## Nice to Have

- [ ] Incremental learning (only new sessions)
- [ ] Compare learnings across projects
- [ ] Web UI for viewing learnings
- [ ] Export to different formats
- [ ] Integration with hooks (auto-learn on session end)
