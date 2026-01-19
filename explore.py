#!/usr/bin/env python3
"""
Claude Sessions Explorer CLI

Browse and search your Claude Code session history.
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from collections import Counter
import argparse
import subprocess

CLAUDE_DIR = Path.home() / ".claude"
HISTORY_FILE = CLAUDE_DIR / "history.jsonl"
PROJECTS_DIR = CLAUDE_DIR / "projects"
STATS_FILE = CLAUDE_DIR / "stats-cache.json"


# ============ Data Loading ============

def load_history():
    """Load all prompts from history.jsonl"""
    if not HISTORY_FILE.exists():
        return []
    entries = []
    with open(HISTORY_FILE) as f:
        for line in f:
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return entries


def load_stats():
    """Load usage statistics"""
    if not STATS_FILE.exists():
        return None
    with open(STATS_FILE) as f:
        return json.load(f)


def get_projects():
    """Get all project directories with metadata"""
    if not PROJECTS_DIR.exists():
        return []

    projects = []
    for d in PROJECTS_DIR.iterdir():
        if not d.is_dir():
            continue
        index_file = d / "sessions-index.json"
        if index_file.exists():
            with open(index_file) as f:
                data = json.load(f)
                entries = data.get("entries", [])
                if entries:
                    # Get project path from first session
                    project_path = entries[0].get("projectPath", d.name)
                    projects.append({
                        "id": d.name,
                        "path": project_path,
                        "name": Path(project_path).name if project_path else d.name,
                        "sessions": entries,
                        "session_count": len(entries),
                        "last_modified": max(e.get("modified", "") for e in entries) if entries else ""
                    })

    # Sort by last modified
    projects.sort(key=lambda p: p["last_modified"], reverse=True)
    return projects


def load_session(session_path: Path):
    """Load a full session conversation"""
    if not session_path.exists():
        return []
    messages = []
    with open(session_path) as f:
        for line in f:
            try:
                messages.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return messages


def load_commits(session_path: Path):
    """Load commits for a session"""
    commits_path = session_path.with_suffix(".commits.json")
    if not commits_path.exists():
        return []
    with open(commits_path) as f:
        return json.load(f)


# ============ Formatting ============

def format_date(iso_string):
    """Format ISO date string"""
    try:
        dt = datetime.fromisoformat(iso_string.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d %H:%M")
    except:
        return iso_string[:16] if iso_string else "unknown"


def format_timestamp(ts):
    """Format millisecond timestamp"""
    try:
        return datetime.fromtimestamp(ts / 1000).strftime("%Y-%m-%d %H:%M")
    except:
        return "unknown"


def truncate(text, length=80):
    """Truncate text to length"""
    if not text:
        return ""
    text = text.replace("\n", " ").strip()
    return text[:length] + "..." if len(text) > length else text


def print_table(headers, rows, widths=None):
    """Print a simple table"""
    if not widths:
        widths = [max(len(str(row[i])) for row in [headers] + rows) for i in range(len(headers))]

    # Header
    header_line = "  ".join(h.ljust(w) for h, w in zip(headers, widths))
    print(f"\n  {header_line}")
    print(f"  {'-' * len(header_line)}")

    # Rows
    for row in rows:
        row_line = "  ".join(str(c).ljust(w)[:w] for c, w in zip(row, widths))
        print(f"  {row_line}")
    print()


# ============ Commands ============

def cmd_stats(args):
    """Show overview statistics"""
    stats = load_stats()
    projects = get_projects()
    history = load_history()

    print("\n  Claude Code Sessions")
    print("  " + "=" * 40)

    if stats:
        print(f"\n  Sessions:     {stats.get('totalSessions', 0)}")
        print(f"  Messages:     {stats.get('totalMessages', 0):,}")

        # Token usage
        model_usage = stats.get("modelUsage", {})
        total_input = sum(m.get("inputTokens", 0) for m in model_usage.values())
        total_output = sum(m.get("outputTokens", 0) for m in model_usage.values())
        print(f"  Tokens:       {total_input + total_output:,} ({total_input:,} in / {total_output:,} out)")

        if stats.get("firstSessionDate"):
            print(f"  First:        {format_date(stats['firstSessionDate'])}")

    print(f"  Projects:     {len(projects)}")
    print(f"  Prompts:      {len(history)}")
    print()


def cmd_projects(args):
    """List all projects"""
    projects = get_projects()

    if not projects:
        print("\n  No projects found.\n")
        return

    rows = []
    for p in projects:
        rows.append([
            p["name"],
            str(p["session_count"]),
            format_date(p["last_modified"]),
            p["id"][:12] + "..."
        ])

    print_table(
        ["Project", "Sessions", "Last Active", "ID"],
        rows,
        [30, 10, 18, 15]
    )


def cmd_sessions(args):
    """List sessions, optionally filtered by project"""
    projects = get_projects()

    if args.project:
        # Filter by project name
        query = args.project.lower()
        projects = [p for p in projects if query in p["name"].lower() or query in p["path"].lower()]

    if not projects:
        print(f"\n  No projects found matching '{args.project}'.\n" if args.project else "\n  No projects found.\n")
        return

    limit = args.limit or 20

    for p in projects[:5]:  # Show max 5 projects
        print(f"\n  {p['name']} ({p['session_count']} sessions)")
        print("  " + "-" * 50)

        sessions = sorted(p["sessions"], key=lambda s: s.get("modified", ""), reverse=True)

        for s in sessions[:limit]:
            date = format_date(s.get("modified", ""))
            prompt = truncate(s.get("firstPrompt", "No prompt"), 50)
            msgs = s.get("messageCount", 0)
            branch = s.get("gitBranch", "")

            branch_str = f" [{branch}]" if branch else ""
            print(f"  {date}  {msgs:3d} msgs  {prompt}{branch_str}")

    print()


def cmd_search(args):
    """Search prompts and sessions"""
    query = args.query.lower()
    history = load_history()

    # Search in history
    matches = []
    for entry in history:
        display = entry.get("display", "")
        if query in display.lower():
            matches.append(entry)

    if not matches:
        print(f"\n  No matches found for '{args.query}'.\n")
        return

    print(f"\n  Found {len(matches)} matches for '{args.query}'")
    print("  " + "=" * 50)

    # Show recent matches
    matches.sort(key=lambda e: e.get("timestamp", 0), reverse=True)

    for entry in matches[:args.limit or 20]:
        date = format_timestamp(entry.get("timestamp", 0))
        project = Path(entry.get("project", "unknown")).name
        display = truncate(entry.get("display", ""), 60)

        print(f"\n  [{date}] {project}")
        print(f"    {display}")

    print()


def cmd_show(args):
    """Show a specific session"""
    session_id = args.session_id

    # Find the session
    for project_dir in PROJECTS_DIR.iterdir():
        if not project_dir.is_dir():
            continue

        session_path = project_dir / f"{session_id}.jsonl"
        if session_path.exists():
            messages = load_session(session_path)
            commits = load_commits(session_path)

            # Get session metadata
            index_file = project_dir / "sessions-index.json"
            session_meta = None
            if index_file.exists():
                with open(index_file) as f:
                    data = json.load(f)
                    for entry in data.get("entries", []):
                        if entry.get("sessionId") == session_id:
                            session_meta = entry
                            break

            # Print header
            print(f"\n  Session: {session_id}")
            if session_meta:
                print(f"  Created: {format_date(session_meta.get('created', ''))}")
                print(f"  Messages: {session_meta.get('messageCount', len(messages))}")
                if session_meta.get("gitBranch"):
                    print(f"  Branch: {session_meta['gitBranch']}")

            # Print commits
            if commits:
                print(f"\n  Commits ({len(commits)}):")
                for c in commits:
                    repo = c.get("repoUrl", "").replace("https://github.com/", "").replace(".git", "")
                    print(f"    {c['commitHash']} [{c['branch']}] {repo}")

            # Print messages
            print(f"\n  Conversation:")
            print("  " + "-" * 50)

            for msg in messages:
                if msg.get("isMeta"):
                    continue

                role = msg.get("type", "unknown")
                content = msg.get("message", {}).get("content", "")

                if isinstance(content, list):
                    # Extract text content
                    texts = []
                    tools = []
                    for block in content:
                        if isinstance(block, dict):
                            if block.get("type") == "text":
                                texts.append(block.get("text", ""))
                            elif block.get("type") == "tool_use":
                                tools.append(block.get("name", "tool"))
                    content = " ".join(texts)
                    if tools and not content:
                        content = f"[Tools: {', '.join(tools)}]"

                if not content or not content.strip():
                    continue

                label = "You" if role == "user" else "Claude"
                text = truncate(content, 100) if not args.full else content[:500]

                print(f"\n  {label}:")
                print(f"    {text}")

            print()
            return

    print(f"\n  Session '{session_id}' not found.\n")


def cmd_tools(args):
    """Show tool usage statistics"""
    all_tools = Counter()
    session_count = 0

    for project_dir in PROJECTS_DIR.iterdir():
        if not project_dir.is_dir():
            continue

        for session_file in project_dir.glob("*.jsonl"):
            if session_file.name.startswith("agent-"):
                continue

            session_count += 1
            messages = load_session(session_file)

            for msg in messages:
                content = msg.get("message", {}).get("content", [])
                if isinstance(content, list):
                    for block in content:
                        if isinstance(block, dict) and block.get("type") == "tool_use":
                            all_tools[block.get("name", "unknown")] += 1

    print(f"\n  Tool Usage (across {session_count} sessions)")
    print("  " + "=" * 40)

    rows = [[tool, str(count)] for tool, count in all_tools.most_common(20)]
    print_table(["Tool", "Uses"], rows, [25, 10])


def cmd_commits(args):
    """List all tracked commits"""
    all_commits = []

    for project_dir in PROJECTS_DIR.iterdir():
        if not project_dir.is_dir():
            continue

        for commits_file in project_dir.glob("*.commits.json"):
            session_id = commits_file.stem
            with open(commits_file) as f:
                commits = json.load(f)
                for c in commits:
                    c["session_id"] = session_id
                    all_commits.append(c)

    if not all_commits:
        print("\n  No commits tracked yet.")
        print("  Set up the commit tracking hook to track commits.\n")
        return

    # Sort by timestamp
    all_commits.sort(key=lambda c: c.get("timestamp", ""), reverse=True)

    print(f"\n  Tracked Commits ({len(all_commits)})")
    print("  " + "=" * 50)

    for c in all_commits[:args.limit or 20]:
        date = format_date(c.get("timestamp", ""))
        hash = c.get("commitHash", "???????")
        branch = c.get("branch", "?")
        repo = c.get("repoUrl", "").replace("https://github.com/", "").replace(".git", "")

        print(f"  {date}  {hash}  [{branch}]  {repo or 'local'}")

    print()


def cmd_export(args):
    """Export all data to JSON"""
    data = {
        "exported_at": datetime.now().isoformat(),
        "stats": load_stats(),
        "history": load_history(),
        "projects": []
    }

    for p in get_projects():
        project_data = {
            "id": p["id"],
            "name": p["name"],
            "path": p["path"],
            "sessions": []
        }

        for s in p["sessions"]:
            session_path = Path(s.get("fullPath", ""))
            session_data = {
                "metadata": s,
                "commits": load_commits(session_path) if session_path.exists() else []
            }

            if args.full:
                session_data["messages"] = load_session(session_path)

            project_data["sessions"].append(session_data)

        data["projects"].append(project_data)

    output = Path(args.output)
    with open(output, "w") as f:
        json.dump(data, f, indent=2)

    print(f"\n  Exported to {output}\n")


def cmd_open(args):
    """Open web UI"""
    import webbrowser
    port = args.port or 3000
    url = f"http://localhost:{port}"

    print(f"\n  Opening {url}...")
    print("  Make sure the Next.js server is running: cd next && bun run dev\n")

    webbrowser.open(url)


# ============ Main ============

def main():
    parser = argparse.ArgumentParser(
        description="Claude Sessions Explorer - Browse your Claude Code history",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                      Show stats overview
  %(prog)s projects             List all projects
  %(prog)s sessions             List recent sessions
  %(prog)s sessions -p pixel    Sessions for 'pixel' project
  %(prog)s search "auth"        Search for 'auth' in prompts
  %(prog)s show <session-id>    Show a specific session
  %(prog)s tools                Tool usage statistics
  %(prog)s commits              List tracked commits
  %(prog)s export data.json     Export all data
  %(prog)s open                 Open web UI
"""
    )

    subparsers = parser.add_subparsers(dest="command", help="Command")

    # stats (default)
    subparsers.add_parser("stats", help="Show overview statistics")

    # projects
    subparsers.add_parser("projects", help="List all projects")

    # sessions
    p = subparsers.add_parser("sessions", help="List sessions")
    p.add_argument("-p", "--project", help="Filter by project name")
    p.add_argument("-l", "--limit", type=int, default=20, help="Max sessions to show")

    # search
    p = subparsers.add_parser("search", help="Search prompts")
    p.add_argument("query", help="Search query")
    p.add_argument("-l", "--limit", type=int, default=20, help="Max results")

    # show
    p = subparsers.add_parser("show", help="Show a session")
    p.add_argument("session_id", help="Session ID")
    p.add_argument("-f", "--full", action="store_true", help="Show full content")

    # tools
    subparsers.add_parser("tools", help="Tool usage statistics")

    # commits
    p = subparsers.add_parser("commits", help="List tracked commits")
    p.add_argument("-l", "--limit", type=int, default=20, help="Max commits to show")

    # export
    p = subparsers.add_parser("export", help="Export data to JSON")
    p.add_argument("output", help="Output file path")
    p.add_argument("-f", "--full", action="store_true", help="Include full messages")

    # open
    p = subparsers.add_parser("open", help="Open web UI")
    p.add_argument("-p", "--port", type=int, default=3000, help="Port number")

    args = parser.parse_args()

    commands = {
        "stats": cmd_stats,
        "projects": cmd_projects,
        "sessions": cmd_sessions,
        "search": cmd_search,
        "show": cmd_show,
        "tools": cmd_tools,
        "commits": cmd_commits,
        "export": cmd_export,
        "open": cmd_open,
    }

    if args.command:
        commands[args.command](args)
    else:
        cmd_stats(args)
        parser.print_help()


if __name__ == "__main__":
    main()
