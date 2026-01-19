"""
GEPA-inspired reflective extraction prompt for session analysis.

Inspired by:
- GEPA (arxiv.org/abs/2507.19457): Reflective analysis of execution traces
- Mem0 (mem0.ai): Multi-level memory extraction (episodic, semantic, procedural)
- DSPy (dspy.ai): Structured signature-based prompting with tips
"""

# Tips for extraction quality (inspired by DSPy's TIPS dictionary)
EXTRACTION_TIPS = {
    "thorough": "Extract ALL learnings, even minor ones. More is better than missing important details.",
    "selective": "Focus only on high-value, non-obvious insights. Quality over quantity.",
    "technical": "Emphasize technical details: specific commands, file paths, error messages, code patterns.",
    "practical": "Focus on actionable knowledge that will help in future sessions.",
}

EXTRACTION_SYSTEM_PROMPT = '''You are a Reflective Session Analyzer, specialized in extracting structured knowledge from Claude Code execution traces.

Your primary role is to perform GEPA-style reflective analysis on session transcripts, identifying:
1. What went well → Reinforce as best practices
2. What went wrong → Document as gotchas with root causes
3. What was repeated → Capture as reusable workflows
4. What was decided → Record with full rationale

You extract knowledge into a multi-level memory hierarchy inspired by cognitive science:
- EPISODIC: Specific incidents with context and resolution
- SEMANTIC: General facts, rules, and conventions
- PROCEDURAL: Step-by-step workflows and processes
- DECISIONS: Architectural choices with alternatives considered
- GOTCHAS: Non-obvious pitfalls and failure patterns'''

EXTRACTION_PROMPT = '''## TASK
Analyze the execution trace below and extract structured memories for the project knowledge base.

## REFLECTIVE ANALYSIS PROCESS

Follow this multi-stage analysis (like GEPA's reflective mutation):

### Stage 1: Trace Overview
Read the full session and identify:
- Primary objective(s) of the session
- Key milestones reached
- Failure points and recovery attempts
- Final outcome (success/partial/failure)

### Stage 2: Causal Analysis
For each significant event, determine:
- What action was taken?
- What was the result?
- WHY did it succeed or fail?
- What lesson can be extracted?

### Stage 3: Knowledge Extraction
Categorize learnings into the memory types below.

---

## MEMORY CATEGORIES

### EPISODIC MEMORIES
Specific incidents or problems encountered during this session.

Extract when you observe:
- Errors, exceptions, or failures
- Debugging sessions
- Performance issues resolved
- Security vulnerabilities discovered

**CRITICAL**: Mark incidents caused by user's local environment (shell config, zoxide, personal tooling) as `scope: "environment-specific"`. These will be filtered out of project documentation.

Required fields:
```json
{{
  "incident": "Brief description of what happened",
  "context": "What was being attempted when this occurred",
  "resolution": "How it was fixed (or 'unresolved' if not fixed)",
  "file": "Relevant file path if applicable, or null",
  "severity": "critical | warning | info",
  "scope": "universal | environment-specific"
}}
```

### SEMANTIC MEMORIES
General knowledge and facts about the codebase.

Extract when you observe:
- Code conventions being followed or enforced
- Dependency usage patterns
- API behavior or quirks
- Testing patterns
- Configuration requirements

Required fields:
```json
{{
  "knowledge": "The fact or rule discovered",
  "category": "architecture | patterns | conventions | dependencies | testing | deployment | security | performance",
  "confidence": "high | medium | low",
  "source": "Brief description of how this was learned"
}}
```

### PROCEDURAL MEMORIES
Multi-step workflows and processes.

Extract when you observe:
- Repeated multi-step processes
- Build/deploy sequences
- Testing workflows
- Feature implementation patterns

Required fields:
```json
{{
  "workflow": "Name of the workflow",
  "steps": ["Step 1", "Step 2", "..."],
  "trigger": "When to use this workflow",
  "prerequisites": ["Required conditions before starting"]
}}
```

### DECISIONS
Architectural or design choices made during the session.

Extract when you observe:
- Library/framework selections
- Design pattern choices
- Trade-off discussions
- Approach selections after considering alternatives

Required fields:
```json
{{
  "decision": "What was decided",
  "rationale": "Why this choice was made",
  "alternatives_considered": ["Alternative 1", "Alternative 2"],
  "trade_offs": "What was sacrificed for this choice"
}}
```

### GOTCHAS
Non-obvious issues, pitfalls, and things that don't work.

Extract when you observe:
- Unexpected failures
- Counter-intuitive behavior
- Deprecated patterns encountered
- Environment-specific issues

**CRITICAL**: Distinguish between:
- **universal**: Issues that affect anyone working on this project
- **environment-specific**: Issues caused by user's local setup (shell config, OS quirks, personal tooling)

Environment-specific examples (should be marked as such):
- Shell aliases (zsh, zoxide, oh-my-zsh) causing command failures
- Local path issues specific to user's machine
- IDE or editor configuration problems
- Personal tool configurations

Required fields:
```json
{{
  "issue": "Brief description of the pitfall",
  "cause": "Root cause analysis",
  "solution": "How to avoid or fix",
  "tags": ["relevant", "category", "tags"],
  "scope": "universal | environment-specific"
}}
```

---

## OUTPUT FORMAT

Return a JSON object with this exact structure:
```json
{{
  "session_summary": "1-2 sentence summary of what was accomplished",
  "primary_objective": "What the user was trying to achieve",
  "outcome": "success | partial | failure",
  "episodic": [...],
  "semantic": [...],
  "procedural": [...],
  "decisions": [...],
  "gotchas": [...]
}}
```

---

## CRITICAL INSTRUCTIONS

DO:
- Extract causal relationships (X happened BECAUSE of Y)
- Include specific file paths, commands, and error messages
- Preserve exact terminology used in the session
- Note confidence levels honestly

DO NOT:
- Include trivial or obvious knowledge
- Guess at information not present in the trace
- Include personally identifiable information
- Fabricate resolutions for unresolved issues

YOU WILL BE PENALIZED IF YOU:
- Include knowledge not supported by the session content
- Miss critical errors or failures that occurred
- Fail to identify the root cause when it's discoverable from the trace

---

## TIP
{tip}

---

## EXECUTION TRACE

{session_trace}
'''

def get_extraction_prompt(session_trace: str, tip_key: str = "practical") -> tuple[str, str]:
    """
    Get the extraction prompt with the specified tip.

    Args:
        session_trace: The session transcript to analyze
        tip_key: One of "thorough", "selective", "technical", "practical"

    Returns:
        Tuple of (system_prompt, user_prompt)
    """
    tip = EXTRACTION_TIPS.get(tip_key, EXTRACTION_TIPS["practical"])
    user_prompt = EXTRACTION_PROMPT.format(
        tip=tip,
        session_trace=session_trace
    )
    return EXTRACTION_SYSTEM_PROMPT, user_prompt
