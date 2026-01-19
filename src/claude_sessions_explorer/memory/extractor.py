"""Session extraction logic using Claude Agent SDK."""

import json
import re
from datetime import datetime
from pathlib import Path

from claude_agent_sdk import query, ClaudeAgentOptions
from claude_agent_sdk.types import AssistantMessage, ResultMessage

from ..models import SessionExtraction
from ..prompts import get_extraction_prompt


CLAUDE_DIR = Path.home() / ".claude"
PROJECTS_DIR = CLAUDE_DIR / "projects"
DATA_DIR = Path(".data")


def find_session_path(session_id: str) -> Path | None:
    """Find the session file path by session ID."""
    for project_dir in PROJECTS_DIR.iterdir():
        if not project_dir.is_dir():
            continue
        session_path = project_dir / f"{session_id}.jsonl"
        if session_path.exists():
            return session_path
    return None


def get_project_name(session_path: Path) -> str:
    """Extract project name from session path."""
    project_dir = session_path.parent
    index_file = project_dir / "sessions-index.json"
    if index_file.exists():
        with open(index_file) as f:
            data = json.load(f)
            entries = data.get("entries", [])
            if entries:
                project_path = entries[0].get("projectPath", "")
                if project_path:
                    return Path(project_path).name
    return project_dir.name


def load_session_trace(session_path: Path) -> str:
    """Load and format session as execution trace for analysis."""
    messages = []
    with open(session_path) as f:
        for line in f:
            try:
                messages.append(json.loads(line))
            except json.JSONDecodeError:
                continue

    trace_parts = []
    for msg in messages:
        if msg.get("isMeta"):
            continue

        role = msg.get("type", "unknown")
        content = msg.get("message", {}).get("content", "")

        if isinstance(content, list):
            text_parts = []
            tool_parts = []
            for block in content:
                if isinstance(block, dict):
                    if block.get("type") == "text":
                        text_parts.append(block.get("text", ""))
                    elif block.get("type") == "tool_use":
                        tool_name = block.get("name", "tool")
                        tool_input = block.get("input", {})
                        # Truncate large tool inputs
                        input_str = json.dumps(tool_input)
                        if len(input_str) > 500:
                            input_str = input_str[:500] + "..."
                        tool_parts.append(f"[Tool: {tool_name}] {input_str}")
                    elif block.get("type") == "tool_result":
                        result = block.get("content", "")
                        if isinstance(result, str) and len(result) > 500:
                            result = result[:500] + "..."
                        tool_parts.append(f"[Tool Result] {result}")

            content = "\n".join(text_parts + tool_parts)

        if not content or not content.strip():
            continue

        label = "USER" if role == "user" else "ASSISTANT"
        trace_parts.append(f"=== {label} ===\n{content}")

    return "\n\n".join(trace_parts)


async def extract_from_session(session_id: str, project: str | None = None, max_trace_chars: int = 50000) -> SessionExtraction:
    """Extract memories from a single session using Claude Agent SDK."""
    session_path = find_session_path(session_id)
    if not session_path:
        raise ValueError(f"Session not found: {session_id}")

    if not project:
        project = get_project_name(session_path)

    trace = load_session_trace(session_path)

    # Truncate trace if too large to avoid context limits
    if len(trace) > max_trace_chars:
        trace = trace[:max_trace_chars] + "\n\n[... trace truncated ...]"

    # Prepare prompt using the helper function that fills in all placeholders
    system_prompt, user_prompt = get_extraction_prompt(trace, tip_key="practical")

    # Call Claude via SDK (uses existing CLI configuration)
    # Enable tools so Claude can explore long traces, write code to analyze patterns, etc.
    response_text = ""
    async for msg in query(
        prompt=user_prompt,
        options=ClaudeAgentOptions(
            max_turns=30,  # Allow many turns for thorough exploration and analysis
            system_prompt=system_prompt
        )
    ):
        if isinstance(msg, AssistantMessage):
            for block in msg.content:
                if hasattr(block, 'text'):
                    response_text += block.text
        elif isinstance(msg, ResultMessage) and msg.result:
            # Prefer the final result if available
            response_text = msg.result

    # Extract JSON from response (may be wrapped in markdown code block)
    json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", response_text)
    if json_match:
        json_str = json_match.group(1)
    else:
        json_str = response_text

    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse extraction response: {e}\nResponse: {response_text[:500]}")

    # Build extraction result
    return SessionExtraction(
        session_id=session_id,
        project=project,
        extracted_at=datetime.now().isoformat(),
        session_summary=data.get("session_summary", ""),
        episodic=data.get("episodic", []),
        semantic=data.get("semantic", []),
        procedural=data.get("procedural", []),
        decisions=data.get("decisions", []),
        gotchas=data.get("gotchas", []),
    )


def save_extraction(extraction: SessionExtraction, output_dir: Path | None = None):
    """Save extraction to JSON file."""
    if output_dir is None:
        output_dir = DATA_DIR / "extractions" / extraction.project

    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / f"{extraction.session_id}.json"

    with open(output_file, "w") as f:
        json.dump(extraction.model_dump(), f, indent=2)

    return output_file
