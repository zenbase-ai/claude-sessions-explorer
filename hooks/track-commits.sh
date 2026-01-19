#!/bin/bash

# Claude Code PostToolUse hook to track git commits
# Writes commits to a JSON file alongside the session JSONL
# Fail-safe: exits silently on any error

set -o pipefail

# Silently exit on any error - never block Claude Code
trap 'exit 0' ERR

# Check if jq is available
command -v jq >/dev/null 2>&1 || exit 0

# Read the hook input JSON from stdin
INPUT=$(cat 2>/dev/null) || exit 0

# Validate we got input
[ -z "$INPUT" ] && exit 0

# Check if this is a Bash tool use
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null) || exit 0
[ "$TOOL_NAME" != "Bash" ] && exit 0

# Get the stdout from the tool response (note: it's tool_response, not tool_result)
STDOUT=$(echo "$INPUT" | jq -r '.tool_response.stdout // empty' 2>/dev/null) || exit 0
[ -z "$STDOUT" ] && exit 0

# Check if stdout contains a git commit output pattern: [branch hash] message
echo "$STDOUT" | grep -qE '^\[.+ [a-f0-9]{7,}\]' || exit 0

# Extract branch and hash from the first matching line
COMMIT_LINE=$(echo "$STDOUT" | grep -oE '^\[.+ [a-f0-9]{7,}\]' 2>/dev/null | head -1) || exit 0
[ -z "$COMMIT_LINE" ] && exit 0

# Parse: [branch hash]
BRANCH=$(echo "$COMMIT_LINE" | sed -E 's/^\[(.+) [a-f0-9]+\]$/\1/' 2>/dev/null) || exit 0
HASH=$(echo "$COMMIT_LINE" | sed -E 's/^\[.+ ([a-f0-9]+)\]$/\1/' 2>/dev/null) || exit 0

# Validate we got both
[ -z "$BRANCH" ] || [ -z "$HASH" ] && exit 0

# Get session info from hook input
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty' 2>/dev/null) || exit 0
CWD=$(echo "$INPUT" | jq -r '.cwd // empty' 2>/dev/null) || exit 0
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty' 2>/dev/null) || exit 0

# Determine the commits file path
if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
  COMMITS_FILE="${TRANSCRIPT_PATH%.jsonl}.commits.json"
else
  # Fallback: skip if no valid transcript path
  exit 0
fi

# Check the directory is writable
COMMITS_DIR=$(dirname "$COMMITS_FILE")
[ -d "$COMMITS_DIR" ] && [ -w "$COMMITS_DIR" ] || exit 0

# Get the git remote URL (optional, don't fail if it doesn't work)
REPO_URL=""
if [ -n "$CWD" ] && [ -d "$CWD" ]; then
  REPO_URL=$(cd "$CWD" 2>/dev/null && git remote get-url origin 2>/dev/null) || REPO_URL=""
fi

# Create timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null) || exit 0

# Create new commit entry
NEW_COMMIT=$(jq -n -c \
  --arg commit_hash "$HASH" \
  --arg branch "$BRANCH" \
  --arg repo_url "$REPO_URL" \
  --arg cwd "$CWD" \
  --arg timestamp "$TIMESTAMP" \
  '{
    commitHash: $commit_hash,
    branch: $branch,
    repoUrl: $repo_url,
    cwd: $cwd,
    timestamp: $timestamp
  }' 2>/dev/null) || exit 0

[ -z "$NEW_COMMIT" ] && exit 0

# Read existing commits or create empty array
if [ -f "$COMMITS_FILE" ]; then
  EXISTING=$(cat "$COMMITS_FILE" 2>/dev/null) || EXISTING="[]"
  # Validate it's valid JSON array
  echo "$EXISTING" | jq -e 'type == "array"' >/dev/null 2>&1 || EXISTING="[]"
else
  EXISTING="[]"
fi

# Append new commit to array and write back
RESULT=$(echo "$EXISTING" | jq -c ". + [$NEW_COMMIT]" 2>/dev/null) || exit 0
[ -z "$RESULT" ] && exit 0

# Write atomically using temp file
TEMP_FILE="${COMMITS_FILE}.tmp.$$"
echo "$RESULT" > "$TEMP_FILE" 2>/dev/null && mv "$TEMP_FILE" "$COMMITS_FILE" 2>/dev/null || rm -f "$TEMP_FILE" 2>/dev/null

exit 0
