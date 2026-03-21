---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-40"
status: "active"
---

# Automated Documentation Audit System

> Prevents documentation from going stale by enforcing YAML frontmatter audit trails and automated staleness detection in CI.

## Problem

With 90+ documentation files across `docs/` and `handoffs/`, keeping docs current as the codebase evolves is error-prone. Docs silently drift out of sync with code, and there's no way to tell when a doc was last meaningfully updated or whether it reflects the current state of the system.

## Solution

A three-layer system:

1. **YAML Frontmatter** — Every `.md` file carries structured metadata (last updated, commit ref, context, status)
2. **Pre-Commit Auto-Stamping** — Modified docs automatically get their `last_updated` and `change_ref` fields updated
3. **CI Staleness Detection** — GitHub Actions workflow validates frontmatter and cross-references source-to-doc mappings

## Architecture

```
Pre-Commit Hook (docs-stamp.sh)
  └── Staged .md files → inject/update frontmatter → re-stage

CI Workflow (docs-audit.yml)
  └── docs-audit.ts
        ├── Validate frontmatter on all docs
        ├── Check staleness (>30 days warning)
        └── Cross-reference source-doc-map.json
              └── Source changed? → Was mapped doc updated?
```

## Frontmatter Schema

```yaml
---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-40"              # Human context — manual
status: "active"                        # active | archived | draft — manual
---
```

| Field | Auto? | Description |
|-------|-------|-------------|
| `last_updated` | Yes | When this doc was last modified (UTC) |
| `change_ref` | Yes | Git short SHA of the commit that modified it |
| `change_type` | No | Session number, PR number, or descriptive context |
| `status` | No | `active` (checked for staleness), `archived` (skipped), `draft` (in progress) |

## Source-to-Doc Mapping

`scripts/source-doc-map.json` maps source code paths to related documentation files. When source code changes in a commit but its mapped doc isn't updated, CI raises a warning.

Example mappings:
- `src/lib/pricing.ts` → `docs/RAV-PRICING-TAXES-ACCOUNTING.md`, `docs/ARCHITECTURE.md`
- `supabase/functions/api-gateway/**` → `docs/api/README.md`
- `.github/workflows/**` → `docs/DEPLOYMENT.md`

New mappings should be added when new feature documentation is created.

## Coverage

The audit system covers all documentation in the project:

| Directory | Content | Count |
|-----------|---------|-------|
| `docs/` | Architecture, features, testing, API, guides, brand assets | ~88 files |
| `handoffs/` | Phase handoff documents (historical) | 6 files |

This includes user documentation (UserGuide sections in code reference these docs), API documentation (`docs/api/`), testing guides (`docs/testing/`), and feature specs (`docs/features/`).

## Error vs Warning Policy

| Severity | Condition | CI Impact |
|----------|-----------|-----------|
| **ERROR** | Missing frontmatter, missing required fields, invalid status | Blocks merge |
| **WARNING** | Source changed but mapped doc not updated, doc >30 days old | Informational (PR comment) |

Archived docs (`status: "archived"`) skip staleness checks entirely.

## Files

| File | Purpose |
|------|---------|
| `scripts/docs-audit.ts` | Core audit — validates frontmatter, staleness, source-doc cross-reference |
| `scripts/docs-stamp.sh` | Pre-commit hook — auto-stamps `last_updated` and `change_ref` |
| `scripts/source-doc-map.json` | Static source → doc mapping (manually curated) |
| `scripts/docs-migrate-frontmatter.ts` | One-time migration script (adds frontmatter to existing docs) |
| `.github/workflows/docs-audit.yml` | CI workflow — runs on push to `dev`/`main` and PRs to `main` |

## Usage

```bash
# Run audit locally
npm run docs:audit

# Run in CI mode (exits 1 on errors)
npm run docs:audit:ci

# One-time migration (already completed)
npm run docs:migrate

# Pre-commit hook runs automatically — no manual action needed
```

## Maintenance

- **Adding a new doc:** Just create it under `docs/`. The pre-commit hook auto-injects frontmatter on first commit. Set `change_type` to something meaningful.
- **Adding a source-doc mapping:** Edit `scripts/source-doc-map.json` to add the new entry.
- **Archiving a doc:** Set `status: "archived"` in its frontmatter. It will skip staleness checks.
- **Adjusting staleness threshold:** Change `STALENESS_DAYS` in `scripts/docs-audit.ts` (default: 30).
