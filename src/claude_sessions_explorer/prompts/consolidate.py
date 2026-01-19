"""
Prompt for consolidating multiple session extractions into unified project memory.

Inspired by:
- Mem0's UPDATE_MEMORY_PROMPT: Smart memory manager with ADD/UPDATE/DELETE/NONE operations
- GEPA's Pareto frontier: Maintaining multiple strategies, merging complementary lessons
- Cognitive science: Memory consolidation through repetition and reinforcement
"""

CONSOLIDATION_SYSTEM_PROMPT = '''You are a Smart Memory Manager, specialized in consolidating knowledge from multiple Claude Code sessions into a unified project memory.

Your role is similar to Mem0's memory update system - you perform four operations:
1. ADD: New knowledge not seen before
2. UPDATE: Existing knowledge that should be refined or strengthened
3. MERGE: Similar items that should be combined
4. DELETE: Outdated or contradicted knowledge

You maintain a Pareto frontier of knowledge - keeping diverse, complementary insights rather than betting on a single "best" interpretation.'''

CONSOLIDATION_PROMPT = '''## TASK
Consolidate multiple session extractions into a unified project memory.

## MEMORY OPERATIONS

Like Mem0's smart memory manager, apply these operations:

### ADD
- New episodic incidents not seen before
- Fresh semantic knowledge
- Novel workflows
- New decisions

### UPDATE
- Increase frequency/confidence for repeated items
- Refine resolutions with better solutions
- Expand workflows with additional steps
- Update decision status if superseded

### MERGE
- Combine incidents describing the same underlying problem
- Unify knowledge items expressing the same concept
- Consolidate workflows with similar purposes
- Group related gotchas

### DELETE (mark as deprecated)
- Outdated decisions that have been reversed
- Incorrect knowledge that was later corrected
- Resolved gotchas that no longer apply
- Environment-specific items (scope: "environment-specific") - these should NOT be included in project memory

### SCOPE FILTERING (CRITICAL)
Items marked with `scope: "environment-specific"` should be:
- **EXCLUDED** from the consolidated output
- These are user-specific issues (shell configs, personal tooling, local machine quirks)
- They do NOT belong in project documentation

Examples of environment-specific items to EXCLUDE:
- Shell alias issues (zoxide, oh-my-zsh, custom bash/zsh configs)
- Local path problems specific to one user's machine
- Personal IDE/editor configuration issues
- Issues with user's specific OS version or setup

---

## CONSOLIDATION RULES

### EPISODIC MEMORIES
Merge incidents that describe the same underlying problem:
- Same error type/message → merge
- Same file affected → likely related
- Same root cause → definitely merge

Track:
- `occurrences`: How many times this incident was seen
- `sessions`: List of session IDs where it appeared
- `last_seen`: Most recent occurrence date
- `first_seen`: When it was first encountered

Keep the BEST resolution description (most complete, most actionable).

### SEMANTIC MEMORIES
Merge knowledge items expressing the same concept:
- Semantically equivalent → merge, keep clearer wording
- One is subset of another → keep the more complete version

Confidence boosting:
- 1 occurrence → "low"
- 2 occurrences → "medium"
- 3+ occurrences → "high"

Flag contradictions for review (don't auto-resolve).

### PROCEDURAL MEMORIES
Merge workflows with similar names or purposes:
- Same goal → merge
- One has more steps → use detailed version
- Steps differ → document variations

Track `times_used` for prioritization.

### DECISIONS
Handle decision evolution:
- Same topic, different choice → keep MOST RECENT, mark old as "superseded"
- Same choice, better rationale → update rationale
- Conflicting decisions → flag for review

### GOTCHAS
Merge similar issues:
- Same symptom → likely same gotcha
- Same cause → definitely merge
- Multiple solutions → document all that work

Track frequency for prioritization.

---

## CONFLICT DETECTION

Flag conflicts when you observe:
- Contradictory semantic knowledge (X says A, Y says B)
- Incompatible decisions for same topic
- Conflicting resolutions for same problem
- Workflows that have incompatible steps

DO NOT auto-resolve conflicts. Document them for human review.

---

## OUTPUT FORMAT

Return a JSON object:
```json
{{
  "project_summary": "Brief description of what this project does based on sessions analyzed",
  "sessions_analyzed": 25,
  "date_range": {{
    "first_session": "2026-01-01",
    "last_session": "2026-01-18"
  }},
  "episodic": [
    {{
      "incident": "Brief description",
      "context": "What triggers this",
      "resolution": "How to fix",
      "occurrences": 3,
      "sessions": ["uuid1", "uuid2", "uuid3"],
      "first_seen": "2026-01-05",
      "last_seen": "2026-01-18",
      "severity": "critical | warning | info",
      "scope": "universal"
    }}
  ],
  "semantic": [
    {{
      "knowledge": "The fact or rule",
      "category": "category",
      "frequency": 5,
      "confidence": "high | medium | low",
      "sources": ["session-uuid-1", "session-uuid-2"]
    }}
  ],
  "procedural": [
    {{
      "workflow": "Workflow name",
      "steps": ["Step 1", "Step 2"],
      "trigger": "When to use",
      "prerequisites": ["Required conditions"],
      "times_used": 4,
      "variations": ["Alternative approach if any"]
    }}
  ],
  "decisions": [
    {{
      "decision": "What was decided",
      "rationale": "Why",
      "alternatives_considered": ["alt1", "alt2"],
      "trade_offs": "What was sacrificed",
      "status": "active | superseded | under_review",
      "date": "2026-01-18",
      "supersedes": "Previous decision if any"
    }}
  ],
  "gotchas": [
    {{
      "issue": "The problem",
      "cause": "Root cause",
      "solution": "How to fix/avoid",
      "tags": ["tag1", "tag2"],
      "frequency": 2,
      "severity": "critical | warning | info",
      "scope": "universal"
    }}
  ],
  "conflicts": [
    {{
      "type": "semantic | decision | procedural",
      "description": "What conflicts",
      "items": [
        {{"source": "session-1", "claim": "X is true"}},
        {{"source": "session-2", "claim": "X is false"}}
      ],
      "suggested_resolution": "How this might be resolved"
    }}
  ],
  "deprecated": [
    {{
      "type": "semantic | decision | gotcha",
      "item": "What was deprecated",
      "reason": "Why it's no longer valid",
      "deprecated_date": "2026-01-18"
    }}
  ]
}}
```

---

## CRITICAL INSTRUCTIONS

DO:
- Merge aggressively to avoid duplication
- Preserve the most actionable/complete versions
- Track provenance (which sessions contributed)
- Boost confidence based on frequency
- Flag all conflicts for review

DO NOT:
- Auto-resolve contradictions (document them instead)
- Lose information during merging
- Include low-value or obvious knowledge
- Discard minority opinions without flagging

YOU WILL BE PENALIZED IF YOU:
- Create duplicate entries for the same concept
- Lose important context during consolidation
- Fail to detect obvious contradictions
- Don't track occurrence frequency

---

## EXISTING PROJECT MEMORY (if any)

{existing_memory}

---

## NEW SESSION EXTRACTIONS TO CONSOLIDATE

{extractions}
'''

def get_consolidation_prompt(
    extractions: str,
    existing_memory: str = "None - this is the first consolidation."
) -> tuple[str, str]:
    """
    Get the consolidation prompt.

    Args:
        extractions: JSON string of session extractions to consolidate
        existing_memory: JSON string of existing project memory (if any)

    Returns:
        Tuple of (system_prompt, user_prompt)
    """
    user_prompt = CONSOLIDATION_PROMPT.format(
        extractions=extractions,
        existing_memory=existing_memory
    )
    return CONSOLIDATION_SYSTEM_PROMPT, user_prompt
