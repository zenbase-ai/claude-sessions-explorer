#!/usr/bin/env python3
"""
Claude Sessions Explorer CLI

Browse and search your Claude Code session history.
"""

import asyncio
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


def cmd_extract(args):
    """Extract learnings from a session"""
    from src.claude_sessions_explorer.memory import extract_from_session, save_extraction

    session_id = args.session_id
    print(f"\n  Extracting from session: {session_id}")

    try:
        extraction = asyncio.run(extract_from_session(session_id))
        output_file = save_extraction(extraction)

        print(f"  Summary: {extraction.session_summary}")
        print(f"\n  Extracted:")
        print(f"    Episodic memories: {len(extraction.episodic)}")
        print(f"    Semantic memories: {len(extraction.semantic)}")
        print(f"    Procedural memories: {len(extraction.procedural)}")
        print(f"    Decisions: {len(extraction.decisions)}")
        print(f"    Gotchas: {len(extraction.gotchas)}")
        print(f"\n  Saved to: {output_file}\n")

    except ValueError as e:
        print(f"  Error: {e}\n")
        sys.exit(1)
    except Exception as e:
        print(f"  Error during extraction: {e}\n")
        sys.exit(1)


def cmd_extract_all(args):
    """Extract learnings from all sessions for a project"""
    from src.claude_sessions_explorer.memory import extract_from_session, save_extraction

    project_filter = args.project.lower() if args.project else None
    force = args.force

    # Find matching projects
    projects = get_projects()
    if project_filter:
        projects = [p for p in projects if project_filter in p["name"].lower() or project_filter in p["path"].lower()]

    if not projects:
        print(f"\n  No projects found matching '{args.project}'.\n" if args.project else "\n  No projects found.\n")
        return

    # Collect all sessions
    all_sessions = []
    for p in projects:
        for s in p["sessions"]:
            all_sessions.append({
                "session_id": s.get("sessionId"),
                "project": p["name"],
                "prompt": truncate(s.get("firstPrompt", ""), 50)
            })

    print(f"\n  Found {len(all_sessions)} sessions across {len(projects)} project(s)")

    # Check for existing extractions
    data_dir = Path(".data/extractions")
    existing = set()
    if data_dir.exists() and not force:
        for project_dir in data_dir.iterdir():
            if project_dir.is_dir():
                for f in project_dir.glob("*.json"):
                    existing.add(f.stem)

    # Filter out sub-agent sessions (those starting with "## TASK")
    def is_real_session(s):
        prompt = s.get("prompt", "")
        return not prompt.startswith("## TASK")

    real_sessions = [s for s in all_sessions if is_real_session(s)]
    subagent_count = len(all_sessions) - len(real_sessions)
    if subagent_count > 0:
        print(f"  Skipping {subagent_count} sub-agent sessions")

    sessions_to_process = [s for s in real_sessions if s["session_id"] not in existing]

    if not force and existing:
        print(f"  Skipping {len(existing)} already extracted sessions (use --force to re-extract)")

    if not sessions_to_process:
        print("  No new sessions to extract.\n")
        return

    print(f"  Processing {len(sessions_to_process)} sessions...\n")

    success = 0
    failed = 0
    for i, s in enumerate(sessions_to_process, 1):
        session_id = s["session_id"]
        print(f"  [{i}/{len(sessions_to_process)}] {s['project']}: {s['prompt'][:40]}...")

        try:
            extraction = asyncio.run(extract_from_session(session_id, s["project"]))
            save_extraction(extraction)
            print(f"    -> {len(extraction.episodic)}e {len(extraction.semantic)}s {len(extraction.procedural)}p {len(extraction.decisions)}d {len(extraction.gotchas)}g")
            success += 1
        except Exception as e:
            print(f"    -> Error: {e}")
            failed += 1

    print(f"\n  Done: {success} extracted, {failed} failed\n")


def cmd_consolidate(args):
    """Consolidate extractions into project memory"""
    from src.claude_sessions_explorer.memory import (
        consolidate_project,
        save_project_memory,
        load_extractions,
        get_all_projects,
    )

    project = args.project
    use_llm = not args.simple

    if not project:
        # List available projects
        projects = get_all_projects()
        if not projects:
            print("\n  No extractions found. Run 'extract-all' first.\n")
            return
        print("\n  Available projects with extractions:")
        for p in projects:
            extractions = load_extractions(p)
            print(f"    - {p} ({len(extractions)} sessions)")
        print("\n  Use: consolidate -p <project>\n")
        return

    print(f"\n  Consolidating project: {project}")
    print(f"  Mode: {'LLM-assisted' if use_llm else 'simple aggregation'}")

    try:
        memory = asyncio.run(consolidate_project(project, use_llm=use_llm))
        output_file = save_project_memory(memory)

        print(f"\n  Consolidated from {memory.sessions_analyzed} sessions:")
        print(f"    Episodic memories: {len(memory.episodic)}")
        print(f"    Semantic memories: {len(memory.semantic)}")
        print(f"    Procedural memories: {len(memory.procedural)}")
        print(f"    Decisions: {len(memory.decisions)}")
        print(f"    Gotchas: {len(memory.gotchas)}")
        print(f"\n  Saved to: {output_file}\n")

    except ValueError as e:
        print(f"  Error: {e}\n")
        sys.exit(1)
    except Exception as e:
        print(f"  Error during consolidation: {e}\n")
        sys.exit(1)


def cmd_generate(args):
    """Generate CLAUDE.md and skills from project memory"""
    from src.claude_sessions_explorer.memory import generate_all, load_project_memory

    project = args.project
    use_llm = not args.simple
    skip_verify = args.no_verify if hasattr(args, 'no_verify') else False

    if not project:
        # List available projects
        memory_dir = Path(".data/memory")
        if not memory_dir.exists():
            print("\n  No consolidated memories found. Run 'consolidate' first.\n")
            return
        projects = [d.name for d in memory_dir.iterdir() if d.is_dir()]
        if not projects:
            print("\n  No consolidated memories found. Run 'consolidate' first.\n")
            return
        print("\n  Available projects with consolidated memory:")
        for p in projects:
            memory = load_project_memory(p)
            if memory:
                print(f"    - {p} ({memory.sessions_analyzed} sessions)")
        print("\n  Use: generate -p <project>\n")
        return

    print(f"\n  Generating for project: {project}")
    print(f"  Mode: {'LLM-assisted' if use_llm else 'template-based'}")
    if use_llm and not skip_verify:
        print("  Verification: enabled")

    try:
        result = asyncio.run(generate_all(project, use_llm=use_llm, verify=not skip_verify))

        print(f"\n  Generated:")
        print(f"    CLAUDE.md: {result['claudemd']}")
        print(f"    Skills: {len(result['skills'])} files")
        for skill in result['skills']:
            print(f"      - {skill}")
        tasks = result.get('tasks', [])
        print(f"    Tasks: {len(tasks) - 1 if tasks else 0} generated")  # -1 for tasks.json
        for task in tasks[1:]:  # Skip tasks.json, show individual task files
            print(f"      - {task}")
        print(f"    Knowledge: {result['knowledge']}")

        # Show verification results
        if result.get('verification_result'):
            verification = result['verification_result']
            print(f"\n  Verification:")
            print(f"    Valid: {verification.get('is_valid', 'unknown')}")
            print(f"    Summary: {verification.get('summary', 'N/A')}")

            issues = verification.get('issues', [])
            if issues:
                errors = [i for i in issues if i.get('severity') == 'error']
                warnings = [i for i in issues if i.get('severity') == 'warning']
                infos = [i for i in issues if i.get('severity') == 'info']

                if errors:
                    print(f"    Errors: {len(errors)}")
                    for i in errors[:3]:
                        print(f"      - {i.get('description', 'Unknown')}")
                if warnings:
                    print(f"    Warnings: {len(warnings)}")
                    for i in warnings[:3]:
                        print(f"      - {i.get('description', 'Unknown')}")
                if infos:
                    print(f"    Info: {len(infos)}")

            if result.get('verification'):
                print(f"    Report: {result['verification']}")
        print()

    except ValueError as e:
        print(f"  Error: {e}\n")
        sys.exit(1)
    except Exception as e:
        print(f"  Error during generation: {e}\n")
        sys.exit(1)


def cmd_learn(args):
    """All-in-one: extract + consolidate + generate"""
    from src.claude_sessions_explorer.memory import (
        extract_from_session,
        save_extraction,
        consolidate_project,
        save_project_memory,
        generate_all,
    )

    project_filter = args.project.lower() if args.project else None
    use_llm = not args.simple

    if not project_filter:
        print("\n  Usage: learn -p <project>\n")
        return

    # Find matching projects
    projects = get_projects()
    projects = [p for p in projects if project_filter in p["name"].lower() or project_filter in p["path"].lower()]

    if not projects:
        print(f"\n  No projects found matching '{args.project}'.\n")
        return

    project_name = projects[0]["name"]
    print(f"\n  Learning from project: {project_name}")
    print("  " + "=" * 40)

    # Step 1: Extract
    print("\n  Step 1: Extracting from sessions...")
    all_sessions = []
    for p in projects:
        for s in p["sessions"]:
            all_sessions.append({
                "session_id": s.get("sessionId"),
                "project": project_name,
                "prompt": truncate(s.get("firstPrompt", ""), 50)
            })

    data_dir = Path(".data/extractions")
    existing = set()
    if data_dir.exists():
        for project_dir in data_dir.iterdir():
            if project_dir.is_dir():
                for f in project_dir.glob("*.json"):
                    existing.add(f.stem)

    sessions_to_process = [s for s in all_sessions if s["session_id"] not in existing]

    if sessions_to_process:
        print(f"  Processing {len(sessions_to_process)} new sessions...")
        for i, s in enumerate(sessions_to_process, 1):
            try:
                extraction = asyncio.run(extract_from_session(s["session_id"], project_name))
                save_extraction(extraction)
                print(f"    [{i}/{len(sessions_to_process)}] Extracted")
            except Exception as e:
                print(f"    [{i}/{len(sessions_to_process)}] Failed: {e}")
    else:
        print(f"  All {len(all_sessions)} sessions already extracted.")

    # Step 2: Consolidate
    print("\n  Step 2: Consolidating memories...")
    try:
        memory = asyncio.run(consolidate_project(project_name, use_llm=use_llm))
        save_project_memory(memory)
        print(f"  Consolidated {memory.sessions_analyzed} sessions")
    except Exception as e:
        print(f"  Consolidation failed: {e}")
        sys.exit(1)

    # Step 3: Generate
    print("\n  Step 3: Generating outputs...")
    try:
        result = asyncio.run(generate_all(project_name, use_llm=use_llm))
        print(f"  Generated CLAUDE.md and {len(result['skills'])} skills")
    except Exception as e:
        print(f"  Generation failed: {e}")
        sys.exit(1)

    print("\n  Done! Files saved to .data/generated/{}/".format(project_name))
    print("  Use 'apply -p {}' to copy to your project.\n".format(project_name))


def cmd_apply(args):
    """Apply generated files to project directory"""
    from src.claude_sessions_explorer.memory import apply_to_project

    project = args.project
    target = Path(args.target) if args.target else None

    if not project:
        print("\n  Usage: apply -p <project> [-t <target-path>]\n")
        return

    # Find project path if not specified
    if not target:
        projects = get_projects()
        matching = [p for p in projects if project.lower() in p["name"].lower()]
        if matching:
            target = Path(matching[0]["path"])
        else:
            print(f"\n  Could not determine project path. Use -t <path>\n")
            return

    print(f"\n  Applying to: {target}")

    try:
        result = apply_to_project(project, target)

        if result.get("backup"):
            print(f"  Backed up existing CLAUDE.md to: {result['backup']}")

        print(f"\n  Copied {len(result['copied'])} files:")
        for f in result["copied"]:
            print(f"    - {f}")
        print()

    except ValueError as e:
        print(f"  Error: {e}\n")
        sys.exit(1)
    except Exception as e:
        print(f"  Error during apply: {e}\n")
        sys.exit(1)


def cmd_query(args):
    """Query project memory"""
    from src.claude_sessions_explorer.memory import query_memory

    project = args.project
    question = args.question

    if not project or not question:
        print("\n  Usage: query -p <project> \"your question\"\n")
        return

    print(f"\n  Querying {project} memory...")
    print()

    try:
        answer = asyncio.run(query_memory(project, question))
        print(answer)
        print()

    except ValueError as e:
        print(f"  Error: {e}\n")
        sys.exit(1)
    except Exception as e:
        print(f"  Error during query: {e}\n")
        sys.exit(1)


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

Memory/Learning Commands:
  %(prog)s extract <session-id> Extract learnings from a session
  %(prog)s extract-all -p proj  Extract from all sessions for project
  %(prog)s consolidate -p proj  Consolidate extractions into project memory
  %(prog)s generate -p proj     Generate CLAUDE.md and skills
  %(prog)s learn -p proj        All-in-one: extract + consolidate + generate
  %(prog)s apply -p proj        Apply generated files to project
  %(prog)s query -p proj "?"    Query project memory
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

    # extract
    p = subparsers.add_parser("extract", help="Extract learnings from a session")
    p.add_argument("session_id", help="Session ID to extract from")

    # extract-all
    p = subparsers.add_parser("extract-all", help="Extract learnings from all sessions")
    p.add_argument("-p", "--project", help="Filter by project name")
    p.add_argument("-f", "--force", action="store_true", help="Re-extract existing sessions")

    # consolidate
    p = subparsers.add_parser("consolidate", help="Consolidate extractions into project memory")
    p.add_argument("-p", "--project", help="Project name")
    p.add_argument("-s", "--simple", action="store_true", help="Use simple aggregation (no LLM)")

    # generate
    p = subparsers.add_parser("generate", help="Generate CLAUDE.md and skills from memory")
    p.add_argument("-p", "--project", help="Project name")
    p.add_argument("-s", "--simple", action="store_true", help="Use template-based generation (no LLM)")
    p.add_argument("--no-verify", action="store_true", help="Skip verification step")

    # learn
    p = subparsers.add_parser("learn", help="All-in-one: extract + consolidate + generate")
    p.add_argument("-p", "--project", required=True, help="Project name")
    p.add_argument("-s", "--simple", action="store_true", help="Use simple mode (no LLM)")

    # apply
    p = subparsers.add_parser("apply", help="Apply generated files to project")
    p.add_argument("-p", "--project", help="Project name")
    p.add_argument("-t", "--target", help="Target project path (auto-detected if not specified)")

    # query
    p = subparsers.add_parser("query", help="Query project memory")
    p.add_argument("-p", "--project", required=True, help="Project name")
    p.add_argument("question", help="Question to ask")

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
        "extract": cmd_extract,
        "extract-all": cmd_extract_all,
        "consolidate": cmd_consolidate,
        "generate": cmd_generate,
        "learn": cmd_learn,
        "apply": cmd_apply,
        "query": cmd_query,
    }

    if args.command:
        commands[args.command](args)
    else:
        cmd_stats(args)
        parser.print_help()


if __name__ == "__main__":
    main()
