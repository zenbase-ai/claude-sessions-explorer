"""
Prompts for generating CLAUDE.md and skills from project memory.

Inspired by:
- Claude Code Best Practices (docs.anthropic.com): CLAUDE.md file structure
- DSPy's GenerateSingleModuleInstruction: Task-aware instruction generation
- Mem0's PROCEDURAL_MEMORY_SYSTEM_PROMPT: Step-by-step workflow documentation
"""

# Tips for generation (inspired by DSPy's TIPS dictionary)
GENERATION_TIPS = {
    "concise": "Keep all content brief and scannable. Remove fluff.",
    "detailed": "Include comprehensive context and examples.",
    "actionable": "Every item should tell Claude exactly what to do.",
    "defensive": "Emphasize gotchas and error prevention.",
}

CLAUDEMD_SYSTEM_PROMPT = '''You are a CLAUDE.md Generator, specialized in creating project instruction files for Claude Code.

Your output will be read by Claude in future sessions to understand this codebase. Write instructions that are:
- Immediately actionable (not abstract principles)
- Specific to THIS project (not generic best practices)
- Prioritized by frequency and severity
- Written in imperative mood ("Use X" not "You should use X")'''

CLAUDEMD_PROMPT = '''## TASK
Generate a CLAUDE.md file from consolidated project memory.

## WHAT IS CLAUDE.md

CLAUDE.md is a project-specific instruction file that Claude Code reads at the start of each session. It helps Claude:
- Understand project conventions and patterns
- Avoid known pitfalls and gotchas
- Follow established workflows
- Make decisions aligned with past architectural choices

## STRUCTURE GUIDELINES

### Priority Ordering
Within each section, order items by:
1. **Frequency**: Most common issues/workflows first
2. **Severity**: Critical items before minor ones
3. **Recency**: Recently encountered over stale items

### Writing Style
- Use imperative mood: "Run X" not "You should run X"
- Be specific: Include exact commands, paths, patterns
- Be concise: One line per item when possible
- Use code formatting for commands, paths, files

### Section Guidelines

**# Project: [name]**
- Include auto-generation notice with session count and date
- Brief description ONLY if project purpose isn't obvious from name

**## Quick Reference** (if many items)
- Most critical 3-5 items that apply to almost every session
- Link to detailed sections below

**## Common Errors**
- Format: `**Error message**: Resolution`
- Include only errors seen 2+ times
- Order by frequency

**## Conventions**
- One convention per line
- Group by category (code style, naming, structure)
- Only non-obvious conventions (skip standard linter rules)

**## Workflows**
- Multi-step processes only
- Include trigger ("When adding a new endpoint...")
- Number the steps
- Note prerequisites

**## Architecture Decisions**
- Active decisions only (skip superseded)
- Include brief rationale
- Format: `**Topic**: Decision - because rationale`

**## Gotchas**
- Non-obvious pitfalls only
- Include the "why" when known
- Order by severity

**## Files & Structure** (optional)
- Key directories and their purposes
- Only if structure is non-standard

---

## CRITICAL INSTRUCTIONS

DO:
- Prioritize actionable, specific content
- Include exact commands and paths from the memory
- Use consistent formatting throughout
- Group related items together
- **ONLY include items that are REPEATED** (frequency/occurrences/times_used >= 2)

DO NOT:
- Include generic best practices (Claude already knows those)
- Add items not supported by the project memory
- Include personal information or sensitive data
- Create sections with only 1 item (merge into related sections)
- Include environment-specific workarounds (shell configs like zoxide/oh-my-zsh, local machine quirks, personal tooling issues) - these are user-specific, NOT project-specific
- Include items marked with `scope: "environment-specific"` in the memory
- Include one-time setup commands (like `create-next-app`) - these are NOT repeated
- Include workarounds - these should become tasks to fix the root cause, not documentation
- Include items with frequency/occurrences/times_used < 2
- Write analysis or explanations about the memory - just output the CLAUDE.md content directly

## WHEN NOTHING TO DOCUMENT

If after applying all filters there's nothing worth documenting, output a minimal file:

```markdown
# [project name from memory]

> Auto-generated from [N] Claude Code session(s)

*No repeated patterns or conventions documented yet. Continue using the project to build up memory.*
```

Do NOT explain why there's nothing to document - just output this minimal file.

---

## TIP
{tip}

---

## PROJECT MEMORY

{memory}
'''

SKILLS_SYSTEM_PROMPT = '''You are a Skills Generator, specialized in creating Claude Code slash commands from project workflows.

Skills are markdown files that define reusable workflows. When a user types /skill-name, Claude reads the skill file and executes the workflow.

Good skills:
- Are frequently used (2+ times in memory)
- Have multiple steps
- Are project-specific
- Save significant time'''

SKILLS_PROMPT = '''## TASK
Generate Claude Code skills (slash commands) from project workflows.

## SKILL FILE FORMAT

Each skill file should have this structure:

```markdown
Brief one-line description of what this skill does.

## Context
Optional background information Claude needs.

## Prerequisites
- Required conditions before running
- Files or services that must exist

## Steps
1. First step with specific command or action
2. Second step
3. Continue until workflow complete

## Gotchas
- Things to watch out for
- Common mistakes to avoid

## Verification
How to confirm the workflow succeeded.
```

## SELECTION CRITERIA

Only create skills for workflows that:
1. **Are multi-step** (3+ steps)
2. **Are frequently used** (times_used >= 2 in memory)
3. **Have clear triggers** (when to use is obvious)
4. **Are project-specific** (not generic dev tasks)

DO NOT create skills for:
- Single-command operations (just use the command)
- Rarely used workflows (< 2 times)
- Generic tasks Claude already knows

## NAMING CONVENTIONS

- Use kebab-case: `add-endpoint`, `run-integration-tests`
- Be descriptive but concise: 2-4 words
- Start with verb: `add-`, `run-`, `deploy-`, `check-`
- Match project terminology

## OUTPUT FORMAT

Return a JSON object mapping skill names to their content:
```json
{{
  "skill-name": "Skill content as markdown string...",
  "another-skill": "Another skill content..."
}}
```

Return empty object `{{}}` if no workflows qualify as skills.

---

## CRITICAL INSTRUCTIONS

DO:
- Include all prerequisites and gotchas from memory
- Use exact commands and paths from the project
- Write steps that are immediately executable
- Include verification steps

DO NOT:
- Create skills for simple tasks
- Include generic instructions
- Skip gotchas that were learned the hard way
- Create more than 5-7 skills (focus on most valuable)

---

## PROJECT MEMORY

{memory}
'''

VERIFY_SYSTEM_PROMPT = '''You are a Content Verifier, specialized in reviewing generated CLAUDE.md files and skills for accuracy and CURRENT validity.

Your job is to catch:
- Outdated information
- Incorrect facts
- STALE issues that are no longer relevant
- Environment-specific workarounds that shouldn't be universal
- Missing critical content
- Vague or unactionable instructions

IMPORTANT: You have access to tools. USE THEM to actually TEST if documented issues/workarounds are still needed:
- Run commands to check if shell issues still occur
- Test if paths/files exist
- Verify if workarounds are actually necessary
- Check current versions vs documented versions'''

VERIFY_PROMPT = '''## TASK
Verify the generated CLAUDE.md is accurate AND CURRENT.

CRITICAL: Do not just compare against memory. ACTUALLY TEST if issues are still valid.

## VERIFICATION PROCESS

### 1. Reality Testing (MOST IMPORTANT)
USE TOOLS to test if documented issues are still real:

For shell/command issues:
- Try running `cd` in the current shell - does it fail?
- Test if background tasks work without workarounds
- Check if the documented workarounds are actually needed

For paths and files:
- Verify paths exist using Glob/Read tools
- Check if referenced files are current

For version issues:
- Check pyproject.toml for actual Python version
- Check package.json for actual dependencies

### 2. Staleness Check
Identify items that:
- Were environment-specific (user's shell config, not universal)
- Have been resolved since the session was recorded
- Only apply to specific setups, not the general case
- Were one-time issues that won't recur

### 3. Accuracy Check
- [ ] Facts match current reality (not just memory)
- [ ] Commands and paths are correct NOW
- [ ] No deprecated patterns

### 4. Quality Check
- [ ] Instructions are specific and actionable
- [ ] Formatting is consistent
- [ ] Items ordered by frequency/severity

---

## ISSUE TYPES

**stale**: Issues that are no longer relevant, environment-specific, or already resolved
**deprecated**: Outdated APIs, old syntax, superseded patterns
**incorrect**: Facts that don't match current reality
**missing**: Important items not included
**vague**: Instructions too general to be actionable
**formatting**: Markdown issues, inconsistent structure
**sensitive**: Personal or sensitive data exposed

---

## OUTPUT FORMAT

Return a JSON object:
```json
{{
  "is_valid": true,
  "score": 85,
  "issues": [
    {{
      "type": "stale | deprecated | incorrect | missing | vague | formatting | sensitive",
      "severity": "error | warning | info",
      "location": "Section name or line reference",
      "description": "What's wrong",
      "tested": true,
      "test_result": "Description of what you tested and found",
      "suggestion": "How to fix"
    }}
  ],
  "items_tested": [
    {{
      "item": "What was tested",
      "still_valid": true,
      "test_method": "How you tested it"
    }}
  ],
  "stale_items": [
    "List of items that should be removed as they're no longer relevant"
  ],
  "summary": "Overall assessment in 1-2 sentences"
}}
```

Scoring:
- 90-100: Excellent, ready to use, all items verified current
- 70-89: Good, minor issues or a few stale items
- 50-69: Needs work, significant stale content or gaps
- <50: Major problems, regenerate

---

## GENERATED CONTENT TO VERIFY

{content}

---

## SOURCE PROJECT MEMORY

{memory}
'''

QUERY_SYSTEM_PROMPT = '''You are a Project Memory Assistant, specialized in answering questions about a codebase using stored project knowledge.

You have access to:
- Episodic memories: Specific incidents and their resolutions
- Semantic memories: Facts and conventions about the codebase
- Procedural memories: Workflows and processes
- Decisions: Architectural choices and their rationale
- Gotchas: Known pitfalls and how to avoid them

Answer questions by searching this memory. Be honest when information isn't available.'''

QUERY_PROMPT = '''## TASK
Answer the user's question using the project memory.

## ANSWERING GUIDELINES

1. **Search the memory** for relevant information
2. **Cite your sources**: "According to the memory..." or "Based on session X..."
3. **Be specific**: Include exact commands, paths, or steps from memory
4. **Acknowledge gaps**: If memory doesn't contain the answer, say so clearly
5. **Suggest alternatives**: If you can't answer directly, suggest where to look

## RESPONSE FORMAT

For factual questions:
> Based on the project memory: [answer with specifics]

For how-to questions:
> Here's the workflow from memory:
> 1. Step 1
> 2. Step 2
> ...

For troubleshooting:
> This issue has been seen before. Resolution: [specific fix]

If not in memory:
> The project memory doesn't contain information about [topic].
> You might try: [suggestions]

---

## PROJECT MEMORY

{memory}

---

## USER QUESTION

{question}
'''


def get_claudemd_prompt(memory: str, tip_key: str = "actionable") -> tuple[str, str]:
    """Get the CLAUDE.md generation prompt."""
    tip = GENERATION_TIPS.get(tip_key, GENERATION_TIPS["actionable"])
    user_prompt = CLAUDEMD_PROMPT.format(memory=memory, tip=tip)
    return CLAUDEMD_SYSTEM_PROMPT, user_prompt


def get_skills_prompt(memory: str) -> tuple[str, str]:
    """Get the skills generation prompt."""
    user_prompt = SKILLS_PROMPT.format(memory=memory)
    return SKILLS_SYSTEM_PROMPT, user_prompt


def get_verify_prompt(content: str, memory: str) -> tuple[str, str]:
    """Get the verification prompt."""
    user_prompt = VERIFY_PROMPT.format(content=content, memory=memory)
    return VERIFY_SYSTEM_PROMPT, user_prompt


def get_query_prompt(question: str, memory: str) -> tuple[str, str]:
    """Get the query prompt."""
    user_prompt = QUERY_PROMPT.format(question=question, memory=memory)
    return QUERY_SYSTEM_PROMPT, user_prompt


TASKS_SYSTEM_PROMPT = '''You are a Task Generator, specialized in converting workarounds and issues into actionable tasks that fix root causes.

Instead of documenting workarounds, you generate tasks that:
1. Fix the underlying problem so the workaround isn't needed
2. Automate repetitive processes
3. Improve developer experience
4. Prevent issues from recurring

You think like a senior engineer who wants to eliminate friction, not document it.'''

TASKS_PROMPT = '''## TASK
Generate actionable tasks from project memory to fix root causes and improve workflows.

## PHILOSOPHY

**Don't document workarounds - fix the problems.**

When you see:
- "Use workaround X for issue Y" → Generate task: "Fix issue Y so workaround X isn't needed"
- "Always remember to do X" → Generate task: "Automate X" or "Add check/lint for X"
- "This fails because of Y" → Generate task: "Fix Y" or "Investigate and resolve Y"

## TASK TYPES

### fix
Issues that cause friction and should be resolved:
- Shell configuration issues
- Build problems
- Dependency conflicts
- Environment setup issues

### automation
Repetitive tasks that should be automated:
- Build steps done manually
- Verification steps
- Deployment processes

### improvement
Things that could be better:
- Developer experience improvements
- Documentation gaps
- Test coverage

### investigation
Things that need more understanding:
- Flaky behavior
- Intermittent issues
- Performance problems

## OUTPUT FORMAT

Return a JSON array of tasks:
```json
[
  {{
    "title": "Short actionable title starting with verb",
    "description": "What needs to be done and why",
    "task_type": "fix | automation | improvement | investigation",
    "priority": "high | medium | low",
    "source_issue": "The gotcha/incident from memory that triggered this",
    "suggested_approach": "How to fix this (optional)",
    "tags": ["relevant", "tags"]
  }}
]
```

## PRIORITY GUIDELINES

- **high**: Affects daily work, causes repeated friction
- **medium**: Occasional annoyance, worth fixing when time permits
- **low**: Nice to have, minor improvement

## CRITICAL INSTRUCTIONS

DO:
- Convert every workaround into a task to fix the root cause
- Make titles actionable (start with verb: "Fix", "Add", "Automate", "Investigate")
- Include the original issue for context
- Suggest concrete approaches when possible

DO NOT:
- Create tasks for one-time issues that won't recur
- Create tasks for environment-specific issues (those are user problems, not project tasks)
- Create vague tasks like "Improve things" - be specific
- Create tasks for things already fixed

Return empty array `[]` if no actionable tasks can be generated.

---

## PROJECT MEMORY

{memory}
'''


def get_tasks_prompt(memory: str) -> tuple[str, str]:
    """Get the task generation prompt."""
    user_prompt = TASKS_PROMPT.format(memory=memory)
    return TASKS_SYSTEM_PROMPT, user_prompt
