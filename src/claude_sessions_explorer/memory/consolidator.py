"""Consolidate multiple session extractions into unified project memory."""

import json
import re
from datetime import datetime
from pathlib import Path

from claude_agent_sdk import query, ClaudeAgentOptions
from claude_agent_sdk.types import AssistantMessage, ResultMessage

from ..models import (
    SessionExtraction,
    ProjectMemory,
    ConsolidatedEpisodic,
    ConsolidatedSemantic,
    ConsolidatedProcedural,
    ConsolidatedDecision,
    ConsolidatedGotcha,
)
from ..prompts.consolidate import get_consolidation_prompt


DATA_DIR = Path(".data")


def load_extractions(project: str) -> list[SessionExtraction]:
    """Load all extractions for a project."""
    extractions_dir = DATA_DIR / "extractions" / project
    if not extractions_dir.exists():
        return []

    extractions = []
    for f in extractions_dir.glob("*.json"):
        with open(f) as fp:
            data = json.load(fp)
            extractions.append(SessionExtraction(**data))

    return sorted(extractions, key=lambda e: e.extracted_at)


def get_all_projects() -> list[str]:
    """Get list of all projects with extractions."""
    extractions_dir = DATA_DIR / "extractions"
    if not extractions_dir.exists():
        return []

    return [d.name for d in extractions_dir.iterdir() if d.is_dir()]


async def consolidate_with_llm(extractions: list[SessionExtraction], existing_memory: ProjectMemory | None = None) -> dict:
    """Use Claude to consolidate extractions intelligently."""
    extractions_json = json.dumps(
        [e.model_dump() for e in extractions],
        indent=2
    )

    existing_memory_json = "None - this is the first consolidation."
    if existing_memory:
        existing_memory_json = json.dumps(existing_memory.model_dump(), indent=2)

    system_prompt, user_prompt = get_consolidation_prompt(extractions_json, existing_memory_json)

    # Enable tools so Claude can write code to analyze patterns, deduplicate, etc.
    response_text = ""
    async for msg in query(
        prompt=user_prompt,
        options=ClaudeAgentOptions(
            max_turns=30,  # Allow many turns for thorough analysis and consolidation
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
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse consolidation response: {e}\nResponse: {response_text[:500]}")


def simple_consolidate(extractions: list[SessionExtraction]) -> dict:
    """Simple consolidation without LLM - just aggregate and deduplicate."""
    episodic_map: dict[str, dict] = {}
    semantic_map: dict[str, dict] = {}
    procedural_map: dict[str, dict] = {}
    decisions_map: dict[str, dict] = {}
    gotchas_map: dict[str, dict] = {}

    for ext in extractions:
        for item in ext.episodic:
            key = item.incident.lower().strip()
            if key in episodic_map:
                episodic_map[key]["occurrences"] += 1
                episodic_map[key]["sessions"].append(ext.session_id)
                episodic_map[key]["last_seen"] = ext.extracted_at[:10]
            else:
                episodic_map[key] = {
                    "incident": item.incident,
                    "resolution": item.resolution,
                    "occurrences": 1,
                    "sessions": [ext.session_id],
                    "last_seen": ext.extracted_at[:10]
                }

        for item in ext.semantic:
            key = item.knowledge.lower().strip()
            if key in semantic_map:
                semantic_map[key]["frequency"] += 1
                if semantic_map[key]["frequency"] >= 3:
                    semantic_map[key]["confidence"] = "high"
            else:
                semantic_map[key] = {
                    "knowledge": item.knowledge,
                    "category": item.category,
                    "frequency": 1,
                    "confidence": item.confidence
                }

        for item in ext.procedural:
            key = item.workflow.lower().strip()
            if key in procedural_map:
                procedural_map[key]["times_used"] += 1
                if len(item.steps) > len(procedural_map[key]["steps"]):
                    procedural_map[key]["steps"] = item.steps
            else:
                procedural_map[key] = {
                    "workflow": item.workflow,
                    "steps": item.steps,
                    "trigger": item.trigger,
                    "times_used": 1
                }

        for item in ext.decisions:
            key = item.decision.lower().strip()
            decisions_map[key] = {
                "decision": item.decision,
                "rationale": item.rationale,
                "alternatives_considered": item.alternatives_considered,
                "status": "active",
                "date": item.date or ext.extracted_at[:10]
            }

        for item in ext.gotchas:
            key = item.issue.lower().strip()
            if key in gotchas_map:
                gotchas_map[key]["frequency"] += 1
                gotchas_map[key]["tags"] = list(set(gotchas_map[key]["tags"] + item.tags))
            else:
                gotchas_map[key] = {
                    "issue": item.issue,
                    "cause": item.cause,
                    "solution": item.solution,
                    "tags": item.tags,
                    "frequency": 1
                }

    return {
        "episodic": list(episodic_map.values()),
        "semantic": list(semantic_map.values()),
        "procedural": list(procedural_map.values()),
        "decisions": list(decisions_map.values()),
        "gotchas": list(gotchas_map.values()),
    }


async def consolidate_project(project: str, use_llm: bool = True) -> ProjectMemory:
    """Consolidate all extractions for a project into unified memory."""
    extractions = load_extractions(project)
    if not extractions:
        raise ValueError(f"No extractions found for project: {project}")

    if use_llm and len(extractions) > 1:
        data = await consolidate_with_llm(extractions)
    else:
        data = simple_consolidate(extractions)

    last_extraction = max(extractions, key=lambda e: e.extracted_at)

    return ProjectMemory(
        project=project,
        generated_at=datetime.now().isoformat(),
        sessions_analyzed=len(extractions),
        last_session=last_extraction.extracted_at,
        episodic=[ConsolidatedEpisodic(**e) for e in data.get("episodic", [])],
        semantic=[ConsolidatedSemantic(**s) for s in data.get("semantic", [])],
        procedural=[ConsolidatedProcedural(**p) for p in data.get("procedural", [])],
        decisions=[ConsolidatedDecision(**d) for d in data.get("decisions", [])],
        gotchas=[ConsolidatedGotcha(**g) for g in data.get("gotchas", [])],
    )


def save_project_memory(memory: ProjectMemory, output_dir: Path | None = None) -> Path:
    """Save consolidated project memory to JSON file."""
    if output_dir is None:
        output_dir = DATA_DIR / "memory" / memory.project

    output_dir.mkdir(parents=True, exist_ok=True)

    history_dir = output_dir / "history"
    history_dir.mkdir(exist_ok=True)
    history_file = history_dir / f"{datetime.now().strftime('%Y-%m-%d_%H%M%S')}.json"

    output_file = output_dir / "consolidated.json"
    if output_file.exists():
        import shutil
        shutil.copy(output_file, history_file)

    with open(output_file, "w") as f:
        json.dump(memory.model_dump(), f, indent=2)

    return output_file


def load_project_memory(project: str) -> ProjectMemory | None:
    """Load consolidated memory for a project."""
    memory_file = DATA_DIR / "memory" / project / "consolidated.json"
    if not memory_file.exists():
        return None

    with open(memory_file) as f:
        return ProjectMemory(**json.load(f))
