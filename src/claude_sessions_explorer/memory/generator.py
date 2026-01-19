"""Generate CLAUDE.md and skills from consolidated project memory."""

import json
import re
from datetime import datetime
from pathlib import Path

from claude_agent_sdk import query, ClaudeAgentOptions
from claude_agent_sdk.types import AssistantMessage, ResultMessage

from ..models import ProjectMemory, ConsolidatedEpisodic, ConsolidatedGotcha
from ..prompts.generate import (
    get_claudemd_prompt,
    get_skills_prompt,
    get_verify_prompt,
    get_query_prompt,
    get_tasks_prompt,
    CLAUDEMD_PROMPT,
    VERIFY_SYSTEM_PROMPT,
)
from .consolidator import load_project_memory


DATA_DIR = Path(".data")
MAX_TURNS = 30  # Allow enough turns for thorough exploration


def filter_stale_items(memory: ProjectMemory, verification: dict) -> ProjectMemory:
    """Filter out stale/environment-specific items from memory based on verification results.

    This creates a cleaned copy of the memory without items identified as stale.
    """
    if not verification or not verification.get("stale_items"):
        return memory

    stale_items = set(s.lower() for s in verification.get("stale_items", []))
    stale_keywords = {"zoxide", "zsh", "__zoxide_z", "oh-my-zsh", "environment-specific"}

    # Also extract keywords from issue descriptions
    for issue in verification.get("issues", []):
        if issue.get("type") == "stale" and issue.get("severity") == "error":
            desc = issue.get("description", "").lower()
            for word in ["zoxide", "zsh", "oh-my-zsh", "shell configuration"]:
                if word in desc:
                    stale_keywords.add(word)

    def is_stale(text: str) -> bool:
        """Check if text contains stale keywords."""
        text_lower = text.lower()
        return any(kw in text_lower for kw in stale_keywords)

    # Filter episodic memories
    filtered_episodic = [
        e for e in memory.episodic
        if not is_stale(e.incident) and not is_stale(e.resolution) and getattr(e, 'scope', 'universal') != 'environment-specific'
    ]

    # Filter gotchas
    filtered_gotchas = [
        g for g in memory.gotchas
        if not is_stale(g.issue) and not is_stale(g.solution or "") and getattr(g, 'scope', 'universal') != 'environment-specific'
    ]

    # Filter procedural (remove workflows with stale steps)
    filtered_procedural = [
        p for p in memory.procedural
        if not is_stale(p.workflow) and not any(is_stale(step) for step in p.steps)
    ]

    # Filter decisions
    filtered_decisions = [
        d for d in memory.decisions
        if not is_stale(d.decision) and not is_stale(d.rationale)
    ]

    # Create cleaned memory
    return ProjectMemory(
        project=memory.project,
        project_path=memory.project_path,
        generated_at=memory.generated_at,
        sessions_analyzed=memory.sessions_analyzed,
        last_session=memory.last_session,
        episodic=filtered_episodic,
        semantic=memory.semantic,  # Keep semantic as-is for now
        procedural=filtered_procedural,
        decisions=filtered_decisions,
        gotchas=filtered_gotchas,
    )


def extract_final_markdown(text: str) -> str:
    """Extract the final CLAUDE.md content, removing thinking/preamble text."""
    lines = text.strip().split('\n')

    # Patterns that indicate this is NOT real CLAUDE.md content
    invalid_content_patterns = [
        '## key changes',
        '## changes made',
        '## summary of',
        '### ✅',
        '### removed',
        '### verified',
        '### kept',
        'the file now contains',
        'i have removed',
        'i have fixed',
    ]

    # Check if the content looks like a summary instead of actual CLAUDE.md
    first_200_chars = text[:200].lower()
    if any(pattern in first_200_chars for pattern in invalid_content_patterns):
        # This looks like a summary, not the actual file
        # Try to find actual CLAUDE.md content after the summary
        for i, line in enumerate(lines):
            stripped = line.strip().lower()
            # Look for a proper project heading
            if stripped.startswith('# ') and not any(word in stripped for word in ['changes', 'summary', 'removed', 'verified', 'fixed']):
                return '\n'.join(lines[i:]).strip()
        # No valid content found - return error message
        return "# Error: Generation Failed\n\nThe generator produced a summary instead of actual CLAUDE.md content. Please regenerate."

    # Normal extraction - find the first valid heading
    start_idx = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue
        # Skip preamble patterns
        preamble_patterns = [
            'perfect', 'now i', "let me", "i can see", "i'll", "here's",
            "based on", "looking at", "after", "this is", "the following",
            "great", "okay", "alright", "sure", "certainly"
        ]
        if any(stripped.lower().startswith(p) for p in preamble_patterns):
            continue
        # Look for markdown heading that's actually a title
        if stripped.startswith('#') and not stripped.startswith('#!/'):
            # Make sure it's not a summary heading
            if not any(word in stripped.lower() for word in ['changes', 'summary', 'removed', 'verified', 'fixed', 'key ']):
                start_idx = i
                break

    return '\n'.join(lines[start_idx:]).strip()


async def generate_claudemd(memory: ProjectMemory) -> str:
    """Generate CLAUDE.md content from project memory using Claude."""
    memory_json = json.dumps(memory.model_dump(), indent=2)
    system_prompt, user_prompt = get_claudemd_prompt(memory_json)

    # Enable tools so Claude can explore the project structure if needed
    response_text = ""
    async for msg in query(
        prompt=user_prompt,
        options=ClaudeAgentOptions(
            max_turns=MAX_TURNS,
            system_prompt=system_prompt
        )
    ):
        if isinstance(msg, AssistantMessage):
            for block in msg.content:
                if hasattr(block, 'text'):
                    response_text += block.text
        elif isinstance(msg, ResultMessage) and msg.result:
            response_text = msg.result

    # Clean up any preamble text before the actual markdown
    return extract_final_markdown(response_text)


async def generate_skills(memory: ProjectMemory) -> dict[str, str]:
    """Generate skill files from project memory using Claude."""
    if not memory.procedural:
        return {}

    memory_json = json.dumps(memory.model_dump(), indent=2)
    system_prompt, user_prompt = get_skills_prompt(memory_json)

    # Enable tools so Claude can explore the project to create better skills
    response_text = ""
    async for msg in query(
        prompt=user_prompt,
        options=ClaudeAgentOptions(
            max_turns=MAX_TURNS,
            system_prompt=system_prompt
        )
    ):
        if isinstance(msg, AssistantMessage):
            for block in msg.content:
                if hasattr(block, 'text'):
                    response_text += block.text
        elif isinstance(msg, ResultMessage) and msg.result:
            response_text = msg.result

    json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", response_text)
    if json_match:
        json_str = json_match.group(1)
    else:
        json_str = response_text

    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        return {}


async def generate_tasks(memory: ProjectMemory) -> list[dict]:
    """Generate actionable tasks from project memory to fix root causes."""
    # Only generate tasks if there are issues to address
    if not memory.gotchas and not memory.episodic:
        return []

    memory_json = json.dumps(memory.model_dump(), indent=2)
    system_prompt, user_prompt = get_tasks_prompt(memory_json)

    response_text = ""
    async for msg in query(
        prompt=user_prompt,
        options=ClaudeAgentOptions(
            max_turns=MAX_TURNS,
            system_prompt=system_prompt
        )
    ):
        if isinstance(msg, AssistantMessage):
            for block in msg.content:
                if hasattr(block, 'text'):
                    response_text += block.text
        elif isinstance(msg, ResultMessage) and msg.result:
            response_text = msg.result

    json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", response_text)
    if json_match:
        json_str = json_match.group(1)
    else:
        json_str = response_text

    try:
        tasks = json.loads(json_str)
        return tasks if isinstance(tasks, list) else []
    except json.JSONDecodeError:
        return []


async def verify_content(content: str, memory: ProjectMemory) -> dict:
    """Verify generated content for issues, staleness, and deprecated patterns.

    This function uses Claude to ACTUALLY TEST if documented issues are still
    current by running commands, checking paths, etc.
    """
    memory_json = json.dumps(memory.model_dump(), indent=2)
    system_prompt, user_prompt = get_verify_prompt(content, memory_json)

    response_text = ""
    async for msg in query(
        prompt=user_prompt,
        options=ClaudeAgentOptions(
            max_turns=MAX_TURNS,
            system_prompt=system_prompt
        )
    ):
        if isinstance(msg, AssistantMessage):
            for block in msg.content:
                if hasattr(block, 'text'):
                    response_text += block.text
        elif isinstance(msg, ResultMessage) and msg.result:
            response_text = msg.result

    json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", response_text)
    if json_match:
        json_str = json_match.group(1)
    else:
        json_str = response_text

    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        return {"is_valid": True, "issues": [], "summary": "Could not parse verification response", "score": 0}


def generate_claudemd_simple(memory: ProjectMemory) -> str:
    """Generate CLAUDE.md without LLM - template-based generation."""
    lines = [
        f"# Project: {memory.project}",
        "",
        f"> Auto-generated from {memory.sessions_analyzed} Claude Code sessions",
        f"> Last updated: {datetime.now().strftime('%Y-%m-%d')}",
        "",
    ]

    if memory.episodic:
        lines.extend(["## Common Errors", ""])
        for item in sorted(memory.episodic, key=lambda x: -x.occurrences)[:10]:
            lines.append(f"- **{item.incident}**: {item.resolution}")
        lines.append("")

    if memory.semantic:
        lines.extend(["## Conventions", ""])
        for item in sorted(memory.semantic, key=lambda x: -x.frequency)[:15]:
            lines.append(f"- {item.knowledge}")
        lines.append("")

    if memory.procedural:
        lines.extend(["## Workflows", ""])
        for item in sorted(memory.procedural, key=lambda x: -x.times_used)[:5]:
            lines.append(f"### {item.workflow}")
            for i, step in enumerate(item.steps, 1):
                lines.append(f"{i}. {step}")
            lines.append("")

    if memory.decisions:
        lines.extend(["## Decisions", ""])
        for item in memory.decisions[:10]:
            alts = f" (alternatives: {', '.join(item.alternatives_considered)})" if item.alternatives_considered else ""
            lines.append(f"- **{item.decision}**: {item.rationale}{alts}")
        lines.append("")

    if memory.gotchas:
        lines.extend(["## Gotchas", ""])
        for item in sorted(memory.gotchas, key=lambda x: -x.frequency)[:10]:
            solution = f" - {item.solution}" if item.solution else ""
            lines.append(f"- {item.issue}{solution}")
        lines.append("")

    return "\n".join(lines)


def generate_skills_simple(memory: ProjectMemory) -> dict[str, str]:
    """Generate skills without LLM - from procedural memories."""
    skills = {}

    for item in memory.procedural:
        if item.times_used < 2:
            continue

        name = item.workflow.lower().replace(" ", "-")
        name = re.sub(r"[^a-z0-9-]", "", name)

        content = [
            item.workflow,
            "",
            "## Steps",
            "",
        ]
        for i, step in enumerate(item.steps, 1):
            content.append(f"{i}. {step}")

        if item.trigger:
            content.extend(["", "## When to Use", "", item.trigger])

        skills[name] = "\n".join(content)

    return skills


def filter_low_frequency_items(memory: ProjectMemory, min_frequency: int = 2) -> ProjectMemory:
    """Filter out items that haven't been seen enough times to be worth documenting.

    Only keeps items with frequency/occurrences/times_used >= min_frequency.
    """
    return ProjectMemory(
        project=memory.project,
        project_path=memory.project_path,
        generated_at=memory.generated_at,
        sessions_analyzed=memory.sessions_analyzed,
        last_session=memory.last_session,
        episodic=[e for e in memory.episodic if e.occurrences >= min_frequency],
        semantic=[s for s in memory.semantic if s.frequency >= min_frequency],
        procedural=[p for p in memory.procedural if p.times_used >= min_frequency],
        decisions=memory.decisions,  # Keep all decisions
        gotchas=[g for g in memory.gotchas if g.frequency >= min_frequency],
        tasks=memory.tasks,
    )


async def generate_all(
    project: str,
    use_llm: bool = True,
    output_dir: Path | None = None,
    verify: bool = True,
    min_frequency: int = 2
) -> dict:
    """Generate all output files from project memory with optional verification."""
    memory = load_project_memory(project)
    if not memory:
        raise ValueError(f"No consolidated memory found for project: {project}")

    if output_dir is None:
        output_dir = DATA_DIR / "generated" / project

    output_dir.mkdir(parents=True, exist_ok=True)
    skills_dir = output_dir / "skills"
    skills_dir.mkdir(exist_ok=True)
    tasks_dir = output_dir / "tasks"
    tasks_dir.mkdir(exist_ok=True)

    if use_llm:
        # Generate tasks FIRST from unfiltered memory (to capture all issues)
        tasks = await generate_tasks(memory)

        # Filter by frequency for CLAUDE.md generation
        filtered_memory = filter_low_frequency_items(memory, min_frequency)

        claudemd_content = await generate_claudemd(filtered_memory)
        skills = await generate_skills(filtered_memory)

        # Verification step - check for issues and deprecated patterns
        verification = None
        if verify:
            verification = await verify_content(claudemd_content, filtered_memory)

            # If there are error-level issues, filter stale items and regenerate
            if verification.get("issues"):
                error_issues = [i for i in verification["issues"] if i.get("severity") == "error"]
                if error_issues:
                    # Filter stale items from memory BEFORE regenerating
                    cleaned_memory = filter_stale_items(filtered_memory, verification)

                    # Include the issues in the prompt for regeneration
                    issues_text = "\n".join([f"- {i['description']}: {i.get('suggestion', '')}" for i in error_issues])
                    feedback_prompt = f"The previous generation had these issues:\n{issues_text}\n\nPlease fix these issues and regenerate."

                    # Regenerate with CLEANED memory
                    claudemd_content = await generate_claudemd_with_feedback(cleaned_memory, feedback_prompt)
                    verification = await verify_content(claudemd_content, cleaned_memory)

                    # Use cleaned memory for final output
                    filtered_memory = cleaned_memory
    else:
        filtered_memory = filter_low_frequency_items(memory, min_frequency)
        claudemd_content = generate_claudemd_simple(filtered_memory)
        skills = generate_skills_simple(filtered_memory)
        tasks = []  # No task generation without LLM
        verification = None

    claudemd_path = output_dir / "CLAUDE.md"
    with open(claudemd_path, "w") as f:
        f.write(claudemd_content)

    skill_paths = []
    for name, content in skills.items():
        skill_path = skills_dir / f"{name}.md"
        with open(skill_path, "w") as f:
            f.write(content)
        skill_paths.append(skill_path)

    knowledge_path = output_dir / "knowledge.json"
    with open(knowledge_path, "w") as f:
        json.dump(filtered_memory.model_dump(), f, indent=2)

    # Save tasks
    task_paths = []
    if tasks:
        tasks_json_path = tasks_dir / "tasks.json"
        with open(tasks_json_path, "w") as f:
            json.dump(tasks, f, indent=2)
        task_paths.append(tasks_json_path)

        # Also save individual task files for easy reading
        for i, task in enumerate(tasks):
            # Sanitize filename - remove problematic characters
            safe_title = task.get('title', 'task').lower()
            safe_title = safe_title.replace(' ', '-').replace('/', '-').replace('\\', '-')
            safe_title = ''.join(c for c in safe_title if c.isalnum() or c == '-')[:40]
            task_path = tasks_dir / f"{i+1:02d}-{safe_title}.md"
            task_content = f"""# {task.get('title', 'Task')}

**Type:** {task.get('task_type', 'fix')}
**Priority:** {task.get('priority', 'medium')}

## Description

{task.get('description', '')}

## Source Issue

{task.get('source_issue', 'N/A')}

## Suggested Approach

{task.get('suggested_approach', 'N/A')}

## Tags

{', '.join(task.get('tags', []))}
"""
            with open(task_path, "w") as f:
                f.write(task_content)
            task_paths.append(task_path)

    # Save verification report
    if verification:
        verification_path = output_dir / "verification.json"
        with open(verification_path, "w") as f:
            json.dump(verification, f, indent=2)
    else:
        verification_path = None

    return {
        "claudemd": claudemd_path,
        "skills": skill_paths,
        "tasks": task_paths,
        "knowledge": knowledge_path,
        "verification": verification_path,
        "verification_result": verification,
    }


async def generate_claudemd_with_feedback(memory: ProjectMemory, feedback: str) -> str:
    """Regenerate CLAUDE.md with feedback about issues to fix."""
    memory_json = json.dumps(memory.model_dump(), indent=2)
    system_prompt, user_prompt = get_claudemd_prompt(memory_json)

    # Append feedback to the prompt with explicit instruction to output ONLY the file
    user_prompt_with_feedback = user_prompt + f"""

## FEEDBACK FROM VERIFIER

The previous generation had these issues that MUST be fixed:

{feedback}

## CRITICAL INSTRUCTION

You MUST output ONLY the corrected CLAUDE.md content.
- Start with "# " followed by the project name
- Do NOT write a summary of changes
- Do NOT explain what you fixed
- Do NOT include any text before the "# " heading
- Just output the corrected CLAUDE.md file content directly
"""

    response_text = ""
    async for msg in query(
        prompt=user_prompt_with_feedback,
        options=ClaudeAgentOptions(
            max_turns=MAX_TURNS,
            system_prompt=system_prompt + "\n\nCRITICAL: Output ONLY the CLAUDE.md file content. No explanations, no summaries, no 'here is the file'. Just the raw markdown starting with # heading."
        )
    ):
        if isinstance(msg, AssistantMessage):
            for block in msg.content:
                if hasattr(block, 'text'):
                    response_text += block.text
        elif isinstance(msg, ResultMessage) and msg.result:
            response_text = msg.result

    return extract_final_markdown(response_text)


async def query_memory(project: str, question: str) -> str:
    """Query project memory using natural language."""
    memory = load_project_memory(project)
    if not memory:
        raise ValueError(f"No consolidated memory found for project: {project}")

    memory_json = json.dumps(memory.model_dump(), indent=2)
    system_prompt, user_prompt = get_query_prompt(question, memory_json)

    # Enable tools so Claude can explore the project to answer questions better
    response_text = ""
    async for msg in query(
        prompt=user_prompt,
        options=ClaudeAgentOptions(
            max_turns=MAX_TURNS,
            system_prompt=system_prompt
        )
    ):
        if isinstance(msg, AssistantMessage):
            for block in msg.content:
                if hasattr(block, 'text'):
                    response_text += block.text
        elif isinstance(msg, ResultMessage) and msg.result:
            response_text = msg.result

    return response_text.strip()


def apply_to_project(project: str, target_path: Path) -> dict:
    """Apply generated files to the target project directory."""
    generated_dir = DATA_DIR / "generated" / project

    if not generated_dir.exists():
        raise ValueError(f"No generated files found for project: {project}")

    results = {"copied": [], "skipped": []}

    claudemd_src = generated_dir / "CLAUDE.md"
    if claudemd_src.exists():
        claudemd_dest = target_path / "CLAUDE.md"
        if claudemd_dest.exists():
            backup = target_path / f"CLAUDE.md.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            import shutil
            shutil.copy(claudemd_dest, backup)
            results["backup"] = str(backup)

        import shutil
        shutil.copy(claudemd_src, claudemd_dest)
        results["copied"].append(str(claudemd_dest))

    skills_src = generated_dir / "skills"
    if skills_src.exists() and any(skills_src.iterdir()):
        skills_dest = target_path / ".claude" / "skills"
        skills_dest.mkdir(parents=True, exist_ok=True)

        for skill_file in skills_src.glob("*.md"):
            dest_file = skills_dest / skill_file.name
            import shutil
            shutil.copy(skill_file, dest_file)
            results["copied"].append(str(dest_file))

    return results
