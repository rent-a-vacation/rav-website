#!/usr/bin/env bash
# Fetch every open Discussion (and its comments) via the GitHub GraphQL API.
# Saves to docs/exports/gh-issues/_discussions-raw.json
set -euo pipefail

OUT="$(dirname "$0")/_discussions-raw.json"

gh api graphql --paginate \
  -f query='
    query($endCursor: String) {
      repository(owner: "rent-a-vacation", name: "rav-website") {
        discussions(first: 50, after: $endCursor, states: OPEN, orderBy: {field: UPDATED_AT, direction: DESC}) {
          pageInfo { hasNextPage endCursor }
          nodes {
            number
            title
            url
            createdAt
            updatedAt
            locked
            closed
            category { name emoji }
            author { login }
            body
            labels(first: 20) { nodes { name } }
            comments(first: 100) {
              nodes {
                author { login }
                createdAt
                body
                replies(first: 50) {
                  nodes { author { login } createdAt body }
                }
              }
            }
          }
        }
      }
    }' \
  --jq '.data.repository.discussions.nodes' > "$OUT"

echo "Wrote $OUT"
node -e "const d=require('$OUT'); console.log('discussions:', d.length); console.log('categories:', [...new Set(d.map(x=>x.category.name))].sort());"
