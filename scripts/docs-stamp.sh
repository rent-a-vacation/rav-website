#!/usr/bin/env bash
# Pre-commit hook: auto-stamp last_updated and change_ref on modified docs/*.md files
# Runs before lint-staged — sub-second overhead (only processes staged files)

set -euo pipefail

STAGED_DOCS=$(git diff --cached --name-only --diff-filter=ACM | grep -E '^(docs|handoffs)/.*\.md$' || true)

if [ -z "$STAGED_DOCS" ]; then
  exit 0
fi

NOW=$(date -u +"%Y-%m-%dT%H:%M:%S")
# Use HEAD SHA if available (amend/normal commit), otherwise use empty tree for initial commit
SHORT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "0000000")

for file in $STAGED_DOCS; do
  # Skip if file doesn't exist (deleted)
  [ -f "$file" ] || continue

  # Check if file already has frontmatter (starts with ---)
  if head -1 "$file" | grep -q '^---$'; then
    # Update existing frontmatter: replace last_updated and change_ref lines
    sed -i "s/^last_updated:.*$/last_updated: \"$NOW\"/" "$file"
    sed -i "s/^change_ref:.*$/change_ref: \"$SHORT_SHA\"/" "$file"
  else
    # Inject new frontmatter at top of file
    TEMP=$(mktemp)
    cat > "$TEMP" << EOF
---
last_updated: "$NOW"
change_ref: "$SHORT_SHA"
change_type: "manual-edit"
status: "active"
---

EOF
    cat "$file" >> "$TEMP"
    mv "$TEMP" "$file"
  fi

  # Re-stage the modified file
  git add "$file"
done
