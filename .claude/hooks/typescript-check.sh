#!/bin/bash
#
# PostToolUse hook for TypeScript type-checking
#
# Runs after Claude edits or creates a file. If the file is a .ts/.tsx file,
# this hook runs `tsc -b --noEmit` to check for type errors across the project.
#
# How it works:
#   1. Parse the edited file path from the JSON event on stdin
#   2. Skip early if the file isn't a .ts or .tsx file
#   3. Walk up directories to find the nearest tsconfig.json
#   4. Run tsc --noEmit from that directory (checks the whole project for
#      type errors — TypeScript doesn't support single-file checking since
#      types flow across files)
#   5. Filter the output to only show errors from the edited file
#   6. If type errors remain in the edited file, block Claude with the
#      error output so it knows to fix them. "Block" here means Claude
#      receives the error as feedback — the file edit is NOT reverted,
#      since PostToolUse hooks run after the tool has already executed.

# Read the full JSON event from stdin (provided by Claude Code)
input=$(cat)

# Extract the absolute file path of the edited file
file_path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.target_file // empty')

# Skip if: no file path, not a .ts/.tsx file, or file doesn't exist on disk
if [[ -z "$file_path" || "$file_path" == "null" ]]; then
    echo '{}'
    exit 0
fi
case "$file_path" in
    *.ts|*.tsx) ;; # proceed
    *) echo '{}'; exit 0 ;;
esac
if [[ ! -f "$file_path" ]]; then
    echo '{}'
    exit 0
fi

# Walk up from the file's directory to find the nearest tsconfig.json.
# This is the project root where we'll run tsc from.
tsconfig_dir=$(dirname "$file_path")
while [[ "$tsconfig_dir" != "/" ]]; do
    [[ -f "$tsconfig_dir/tsconfig.json" ]] && break
    tsconfig_dir=$(dirname "$tsconfig_dir")
done

if [[ ! -f "$tsconfig_dir/tsconfig.json" ]]; then
    echo '{}'
    exit 0
fi

# Find tsc — prefer the local node_modules binary
if [[ -x "$tsconfig_dir/node_modules/.bin/tsc" ]]; then
    tsc_cmd="$tsconfig_dir/node_modules/.bin/tsc"
elif command -v tsc &> /dev/null; then
    tsc_cmd="tsc"
else
    echo '{}'
    exit 0
fi

# Compute the file path relative to the tsconfig directory.
# tsc outputs errors as "src/App.tsx(10,5): error TS2345: ..."
# so we need the relative path to filter correctly.
rel_file="${file_path#$tsconfig_dir/}"

cd "$tsconfig_dir" || exit 0

# Run tsc -b --noEmit to type-check without producing output files.
# Uses -b (build mode) to respect project references in tsconfig.json,
# since a bare --noEmit may skip files if the root tsconfig uses "files: []"
# with references to sub-configs (e.g. tsconfig.app.json, tsconfig.node.json).
# Filter to only show errors from the edited file.
tsc_output=$("$tsc_cmd" -b --noEmit 2>&1 | grep "^${rel_file}")

# No type errors in the edited file — suppress output so Claude proceeds silently
if [[ -z "$tsc_output" ]]; then
    echo '{"suppressOutput": true}'
else
    # Type errors found in the edited file — send them back to Claude as a "block".
    reason="TypeScript found type errors in $file_path:\n\n$tsc_output\n\nPlease fix these type errors before proceeding."
    jq -n --arg reason "$reason" '{"decision": "block", "reason": $reason}'
fi
