#!/bin/bash
#
# PostToolUse hook for golangci-lint
#
# Runs after Claude edits or creates a file. If the file is a .go file,
# this hook lints the Go package containing that file and reports only
# issues found in the specific file that was modified.
#
# How it works:
#   1. Parse the edited file path from the JSON event on stdin
#   2. Skip early if the file isn't a .go file
#   3. Walk up directories to find the Go module root (go.mod)
#   4. Run golangci-lint on the *entire package* containing the file
#      (golangci-lint needs the full package for type-checking — linting
#      a single .go file in isolation causes "undefined" type errors)
#   5. Use --fix to auto-correct any issues the linter can handle
#   6. Filter the linter output to only show issues from the edited file
#      (issues in sibling files within the same package are ignored)
#   7. If issues remain in the edited file after --fix, block Claude with
#      the lint output so it knows to fix them. "Block" here means Claude
#      receives the error as feedback — the file edit is NOT reverted,
#      since PostToolUse hooks run after the tool has already executed.

# Read the full JSON event from stdin (provided by Claude Code)
# Contains tool_input.file_path (Edit) or tool_input.target_file (MultiEdit)
input=$(cat)

# Extract the absolute file path of the edited file
file_path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.target_file // empty')

# Skip if: no file path, not a .go file, or file doesn't exist on disk
if [[ -z "$file_path" || "$file_path" == "null" || "$file_path" != *.go || ! -f "$file_path" ]]; then
    echo '{}'
    exit 0
fi

# Skip if golangci-lint isn't installed
if ! command -v golangci-lint &> /dev/null; then
    echo '{}'
    exit 0
fi

# Walk up from the file's directory to find the Go module root (go.mod).
# This is needed so we can run golangci-lint from the correct working directory
# and compute the relative package path.
module_root=$(dirname "$file_path")
while [[ "$module_root" != "/" ]]; do
    [[ -f "$module_root/go.mod" ]] && break
    module_root=$(dirname "$module_root")
done

# If we never found a go.mod, this isn't a Go module — skip
if [[ ! -f "$module_root/go.mod" ]]; then
    echo '{}'
    exit 0
fi

# Compute the package path relative to the module root.
# e.g. /Users/me/project/server/api/editor/client.go → ./api/editor
# golangci-lint scopes its analysis to this package only.
rel_pkg="./$(dirname "${file_path#$module_root/}")"

# Just the filename, used to filter lint output to only the edited file.
# e.g. "client.go" — we grep for lines starting with "client.go:"
basename=$(basename "$file_path")

cd "$module_root" || exit 0

# Run golangci-lint on the package containing the edited file.
#   --fix:                    auto-correct issues where possible (writes back to disk)
#   --allow-parallel-runners: don't fail if another golangci-lint instance is running
#   --timeout 30s:            cap execution time
#
# Then filter output: only keep lines that start with the edited filename.
# This means issues in other files within the same package are ignored —
# we only care about the file Claude just touched.
lint_output=$(golangci-lint run --fix --allow-parallel-runners --timeout 30s "$rel_pkg" 2>&1 | grep "^${basename}:")

# No issues in the edited file — suppress output so Claude proceeds silently
if [[ -z "$lint_output" ]]; then
    echo '{"suppressOutput": true}'
else
    # Issues found in the edited file — send them back to Claude as a "block".
    # Claude receives this as feedback and is expected to fix the reported issues.
    reason="golangci-lint found issues in $file_path:\n\n$lint_output\n\nPlease fix these issues before proceeding."
    jq -n --arg reason "$reason" '{"decision": "block", "reason": $reason}'
fi
