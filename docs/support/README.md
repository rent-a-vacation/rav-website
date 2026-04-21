---
last_updated: "2026-04-21T12:24:25"
change_ref: "e51b76d"
change_type: "session-57-phase22-A1"
status: "active"
title: "Support Docs Index"
doc_type: "guide"
audience: ["internal"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["meta", "schema", "index"]
---

# Rent-A-Vacation Support Documentation

Canonical home for all customer-support-facing documentation. These docs are **source of truth in git** and are ingested into the Supabase `support_docs` table at build time for runtime retrieval by the RAVIO support agent.

## Why this folder exists

The RAVIO support agent needs a single, consistent, retrievable knowledge base. Having authoritative content in markdown (not scattered across UI components, edge functions, or admin tools) gives us:

- **Git-audited policy changes** — every rule edit goes through PR review; lawyers review diffs
- **AI-agent-friendly source** — structured frontmatter + predictable body sections means cheap extraction
- **DB index for runtime** — markdown is canonical; `support_docs` is a build-time cache for fast agent queries (keyword + vector search)
- **One schema, 20 docs** — consistency across policies, FAQs, and internal processes

See [`docs/PROJECT-HUB.md` → DEC-036](../PROJECT-HUB.md) for the full architectural rationale.

## Folder layout

```
docs/support/
├── README.md                    ← this file
├── GAP-ANALYSIS.md              ← 20-doc authoritative-source mapping
├── CS-OVERVIEW.md               ← (planned) VC-ready capability one-pager
├── policies/                    ← cancellation, refund, T&C, privacy, etc.
├── faqs/                        ← booking, billing, owner, traveler, platform, account-security
├── processes/                   ← booking-workflow, bidding-process, escalation, dispute-resolution, SLA
├── guides/                      ← (reserved for future how-to content)
└── diagrams/                    ← Mermaid architecture + sequence diagrams
```

## Frontmatter schema

Every `docs/support/**/*.md` file MUST begin with this YAML frontmatter block. Missing or malformed frontmatter fails `npm run docs:sync-check`.

```yaml
---
last_updated: "2026-04-21T12:24:25"
change_ref: "e51b76d"
change_type: "session-NN" | "PR #NNN"     # manual — what triggered the edit
status: "active" | "draft" | "archived"   # manual — lifecycle state

title: "Human-Readable Title"             # displayed in agent responses + admin UI
doc_type: "policy" | "faq" | "process" | "guide"
audience: ["renter", "owner", "admin", "internal"]
version: "1.0.0"                          # semver — bump on material change
legal_review_required: true | false
reviewed_by: null | "Lawyer Name / Firm"  # null if unreviewed or not required
reviewed_date: null | "2026-NN-NN"        # null until review completed
tags: ["cancellation", "refund", …]       # retrieval keywords
---
```

### Field semantics

| Field | Required | Controlled vocabulary | Notes |
|---|---|---|---|
| `last_updated` | ✅ | ISO 8601 datetime | Auto-stamped. Never edit manually. |
| `change_ref` | ✅ | git short SHA | Auto-stamped. |
| `change_type` | ✅ | `session-NN`, `PR #NNN`, or free text | Manual — informs session attribution. |
| `status` | ✅ | `active`, `draft`, `archived` | `draft` → legal-blocked or in-progress; not surfaced to users. `archived` → kept for history, skipped in staleness checks. |
| `title` | ✅ | — | Used by agent in response rendering. |
| `doc_type` | ✅ | `policy`, `faq`, `process`, `guide` | Determines retrieval priority + agent routing. |
| `audience` | ✅ | array of `renter`, `owner`, `admin`, `internal` | Filters agent responses by caller role. `internal` = never shown to end users. |
| `version` | ✅ | semver | Bump MAJOR on breaking semantics; MINOR on new sections; PATCH on wording. |
| `legal_review_required` | ✅ | bool | Public-facing policies that need lawyer sign-off. |
| `reviewed_by` | ⚠️ | string or `null` | Required if `legal_review_required: true` and `status: 'active'`. |
| `reviewed_date` | ⚠️ | ISO date or `null` | Required if `legal_review_required: true` and `status: 'active'`. |
| `tags` | ✅ | array of lowercase keywords | Drives retrieval. Include synonyms users might type. |

## Body structure

Every doc body follows this four-section skeleton, in this order:

```markdown
# Title

## Summary
1–2 sentence plain-English answer. This is what the agent quotes when a user asks a direct question.

## Details
Full rules, tables, timelines, decision logic. This is what the agent reads when a user asks a follow-up or edge-case question.

## Examples
Concrete scenarios with real numbers. Agent uses these to ground responses in specifics.

## Related
Bulleted links to adjacent docs. Agent uses these for "see also" routing.
```

The ingest pipeline parses these section headers into discrete fields in `support_docs.sections`:

- `sections.summary` → embedded for short-form responses
- `sections.details` → retrieved for deep queries
- `sections.examples` → surfaced when the query matches an example scenario
- `sections.related` → used for multi-hop retrieval

Sections are optional — a short doc may only have Summary + Details — but the agent performs best when all four are present.

## Sync pipeline

```
author edits .md
       ↓
    git commit
       ↓
    PR review
       ↓
    merge to main
       ↓
  GitHub Action runs ingest-support-docs edge function
       ↓
  support_docs table upserted by slug
       ↓
  agent retrieves via query_support_docs tool
```

**Git is source of truth. The DB is a cache.** Never edit `support_docs` directly; always edit the markdown.

## Authoring workflow

1. Check [`GAP-ANALYSIS.md`](./GAP-ANALYSIS.md) to see if the doc is already tracked and what its authoritative source is.
2. Draft in the appropriate sub-folder following the frontmatter schema + body structure above.
3. If the doc is legal-review-required, start with `status: 'draft'` and leave `reviewed_by` and `reviewed_date` as `null`.
4. Run `npm run docs:sync-check` to validate frontmatter.
5. PR into `dev`; CI runs the same check.
6. Merge to `main` — GitHub Action syncs the new/updated doc to Supabase.

## When the agent answers a question

The RAVIO support agent invokes `query_support_docs(query, doc_type?)` which:

1. Runs tsvector keyword search against `support_docs.search_tsv`
2. (Optional) re-ranks with vector similarity if embeddings are populated
3. Filters by `audience` against the caller's role
4. Returns up to N matching docs with `summary` + `details` excerpts

The agent is instructed: **never fabricate a rule. Either quote the retrieved doc, or escalate.**

## Archival

When a doc is superseded:

1. Set `status: "archived"`
2. Add a `superseded_by:` field in frontmatter pointing to the new slug
3. Keep the file in place (don't delete) for audit trail
4. The ingest pipeline removes archived docs from the agent's retrievable set
