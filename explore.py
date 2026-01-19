#!/usr/bin/env python3
"""
Claude Code Sessions Explorer

Explore, search, and analyze Claude Code session history.
"""

import json
import os
from pathlib import Path
from datetime import datetime
from collections import Counter
import argparse


CLAUDE_DIR = Path.home() / ".claude"
HISTORY_FILE = CLAUDE_DIR / "history.jsonl"
PROJECTS_DIR = CLAUDE_DIR / "projects"


def load_history():
    """Load all prompts from history.jsonl"""
    entries = []
    if HISTORY_FILE.exists():
        with open(HISTORY_FILE, "r") as f:
            for line in f:
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return entries


def load_sessions_index(project_dir: Path):
    """Load sessions index for a project"""
    index_file = project_dir / "sessions-index.json"
    if index_file.exists():
        with open(index_file, "r") as f:
            data = json.load(f)
            return data.get("entries", [])
    return []


def load_session(session_path: Path):
    """Load a full session conversation"""
    messages = []
    if session_path.exists():
        with open(session_path, "r") as f:
            for line in f:
                try:
                    messages.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return messages


def get_all_projects():
    """Get all project directories"""
    if not PROJECTS_DIR.exists():
        return []
    return [d for d in PROJECTS_DIR.iterdir() if d.is_dir()]


def list_projects():
    """List all projects with session counts"""
    history = load_history()
    project_counts = Counter(e.get("project", "unknown") for e in history)

    print("\n=== Projects by Prompt Count ===\n")
    for project, count in project_counts.most_common():
        print(f"  {count:4d}  {project}")
    print()


def search_history(query: str, case_sensitive: bool = False):
    """Search for a query in all prompts"""
    history = load_history()

    if not case_sensitive:
        query = query.lower()

    matches = []
    for entry in history:
        display = entry.get("display", "")
        check = display if case_sensitive else display.lower()
        if query in check:
            matches.append(entry)

    print(f"\n=== Found {len(matches)} matches for '{query}' ===\n")
    for entry in matches:
        ts = entry.get("timestamp", 0)
        date = datetime.fromtimestamp(ts / 1000).strftime("%Y-%m-%d %H:%M")
        project = entry.get("project", "unknown")
        display = entry.get("display", "")[:100]
        print(f"  [{date}] {project}")
        print(f"    {display}...")
        print()


def list_sessions(project_filter: str = None):
    """List all sessions with summaries"""
    for project_dir in get_all_projects():
        project_name = project_dir.name

        if project_filter and project_filter not in project_name:
            continue

        sessions = load_sessions_index(project_dir)
        if not sessions:
            continue

        print(f"\n=== {project_name} ({len(sessions)} sessions) ===\n")
        for session in sessions[:10]:  # Show first 10
            created = session.get("created", "unknown")[:10]
            prompt = session.get("firstPrompt", "No prompt")[:80]
            msg_count = session.get("messageCount", 0)
            print(f"  [{created}] ({msg_count} msgs) {prompt}")


def analyze_tools(session_path: Path):
    """Analyze tool usage in a session"""
    messages = load_session(session_path)
    tools = Counter()

    for msg in messages:
        content = msg.get("message", {}).get("content", [])
        if isinstance(content, list):
            for block in content:
                if isinstance(block, dict) and block.get("type") == "tool_use":
                    tools[block.get("name", "unknown")] += 1

    return tools


def tool_stats():
    """Show tool usage statistics across all sessions"""
    all_tools = Counter()

    for project_dir in get_all_projects():
        for session_file in project_dir.glob("*.jsonl"):
            if session_file.name.startswith("agent-"):
                continue
            tools = analyze_tools(session_file)
            all_tools.update(tools)

    print("\n=== Tool Usage Statistics ===\n")
    for tool, count in all_tools.most_common(20):
        print(f"  {count:5d}  {tool}")
    print()


def export_all(output_path: str):
    """Export all session data to a single JSON file"""
    data = {
        "history": load_history(),
        "projects": {}
    }

    for project_dir in get_all_projects():
        project_name = project_dir.name
        sessions = load_sessions_index(project_dir)
        data["projects"][project_name] = {
            "sessions": sessions,
            "path": str(project_dir)
        }

    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"Exported to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Explore Claude Code sessions")
    parser.add_argument("--projects", action="store_true", help="List all projects")
    parser.add_argument("--search", type=str, help="Search for a term in prompts")
    parser.add_argument("--sessions", action="store_true", help="List all sessions")
    parser.add_argument("--project", type=str, help="Filter by project name")
    parser.add_argument("--tools", action="store_true", help="Show tool usage stats")
    parser.add_argument("--export", type=str, help="Export all data to JSON file")

    args = parser.parse_args()

    if args.projects:
        list_projects()
    elif args.search:
        search_history(args.search)
    elif args.sessions:
        list_sessions(args.project)
    elif args.tools:
        tool_stats()
    elif args.export:
        export_all(args.export)
    else:
        # Default: show summary
        history = load_history()
        projects = get_all_projects()

        print("\n=== Claude Code Session Summary ===\n")
        print(f"  Total prompts: {len(history)}")
        print(f"  Total projects: {len(projects)}")
        print()
        print("Commands:")
        print("  --projects    List all projects with prompt counts")
        print("  --search X    Search for term in all prompts")
        print("  --sessions    List all sessions with summaries")
        print("  --tools       Show tool usage statistics")
        print("  --export F    Export all data to JSON file")
        print()


if __name__ == "__main__":
    main()
