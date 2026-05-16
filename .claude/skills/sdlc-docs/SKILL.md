---
name: sdlc-docs
description: Documentation sync watchdog. PR-aware diff check that flags drift between code and docs (source-doc-map + heuristic rules). Warn-mode on dev push; gate-mode on PR to main. Complements /sdlc; never edits docs without confirmation.
argument-hint: "audit [--gate|--warn] | report"
allowed-tools: Bash(npm run sdlc-docs:*) Bash(npx tsx scripts/sdlc-docs.ts:*) Bash(git diff:*) Bash(git log:*) Read Grep
---

# `/sdlc-docs` — Documentation Sync Watchdog

> Diff-aware doc-sync checker. Cross-references PR-wide file changes against `scripts/source-doc-map.json` + applies heuristic rules. **Companion to** [`/sdlc`](../sdlc/SKILL.md) — `/sdlc` orchestrates a full workflow; `/sdlc-docs` is the focused doc-sync layer that `/sdlc` (and CI) calls.

**Top-priority constraint** ([feedback-no-doc-duplication](../../../../.claude-max/projects/C--Repos-personal-gh-tektekgo-rentavacation/memory/feedback_no_doc_duplication.md)): never propose creating a parallel doc when an existing one can be refreshed. `/sdlc-docs` only flags missing/drifting content — it doesn't spawn new docs.

---

## Sub-commands

### `audit [--gate|--warn] [--base <ref>]`

Diff-based drift check. Diffs current branch against base (default `origin/main`) and applies these rules:

| Rule | Severity | What it checks |
|---|---|---|
| **`source-doc-map`** | **GATE** | A source file mapped in `scripts/source-doc-map.json` changed but the mapped doc wasn't touched. |
| `user-guide-drift` | warn | A `src/pages/*.tsx` page changed (excluding admin/owner/settings + tests) but `UserGuide.tsx`/`FAQ.tsx` weren't touched. |
| `flow-manifest-drift` | warn | `src/App.tsx` changed (likely route change) but no `src/flows/<lifecycle>.ts` manifest updated. |
| `seed-manager-drift` | warn | New migration with `CREATE TABLE` but `supabase/functions/seed-manager/index.ts` wasn't updated. |
| `security-risk-log-trigger` | warn | `package.json`/`package-lock.json`/`auth.ts`/CI workflow/RLS-touching migration changed but `SECURITY-RISK-LOG.md` wasn't updated. |

**Modes:**

- `--warn` (default) — Never exits non-zero. Prints all findings. **Use on dev push.**
- `--gate` — Exits 1 if any GATING rule fails. Warnings still print but don't block. **Use on PR to main.**

**Options:**

- `--base <ref>` — Base ref for diff (default `origin/main`)

### `report`

Health snapshot (no diff). Lists:
- Stale docs (>30 days `last_updated`, excluding `status: archived`)
- `docs/features/` subfolders missing `README.md`
- Docs with `status: archived` frontmatter but NOT in `docs/archive/` folder

Useful for periodic doc-health reviews. Doesn't fail or change anything.

---

## How to invoke

### From Claude Code
```
/sdlc-docs audit          # warn-mode (default)
/sdlc-docs audit --gate   # gate-mode (PR-to-main check)
/sdlc-docs report         # health snapshot
```

### From shell
```bash
npm run sdlc-docs:audit       # warn-mode against origin/main
npm run sdlc-docs:audit:gate  # gate-mode against origin/main
npm run sdlc-docs:report      # health snapshot
npx tsx scripts/sdlc-docs.ts audit --base main~5   # custom base
```

### From CI (automatic)
See `.github/workflows/sdlc-docs.yml`:
- **On push to dev:** `--warn` mode (never fails). Posts findings as a PR comment if a PR exists.
- **On PR to main:** `--gate` mode (fails build on GATING findings).

---

## Relationship to existing scripts

| Script | What it does | When run |
|---|---|---|
| `scripts/docs-audit.ts` | Frontmatter validation on all docs + source-doc-map check using `HEAD~1..HEAD` diff | Existing CI on push/PR to dev+main |
| `scripts/docs-sync-check.ts` | Validates 4 bootstrap docs (PROJECT-HUB, PRIORITY-ROADMAP, TESTING-STATUS, LAUNCH-READINESS) + support-docs frontmatter + DEC-040 Phase numbering | Existing CI on push/PR to dev+main |
| **`scripts/sdlc-docs.ts`** (NEW) | **PR-wide** diff check (against merge base, not last commit) + heuristic rules (UserGuide / flow-manifest / seed-manager / SECURITY-RISK-LOG) + explicit warn-vs-gate modes | Push-to-dev (warn) + PR-to-main (gate) |
| `scripts/docs-stamp.sh` | Pre-commit hook — auto-stamps `last_updated`+`change_ref` frontmatter | Pre-commit |

`/sdlc-docs` does NOT duplicate the existing scripts — it composes a different signal (PR-wide diff + heuristic rules) and runs at a different cadence (push vs commit).

---

## What `/sdlc-docs` does NOT do (in v1)

1. **Does not edit any doc.** Reports drift; never auto-fixes. The decision to update a doc stays with the developer (or `/sdlc` orchestrator).
2. **Does not move files.** Auto-archive of unambiguously superseded docs (e.g. `PLATFORM-REVIEW-03022026.md` → `archive/`) is planned for PR4. Today, `report` only LISTS misfiled archive-status docs.
3. **Does not run `npm audit` or pull GH issues.** Those live in `/generate-docs --security-posture` (and run on demand, not per-PR).
4. **Does not validate frontmatter.** That's `scripts/docs-audit.ts`. They run side-by-side in CI.

---

## Known limitations

1. **Heuristic rules have false positives.** A `src/pages/*.tsx` change that's pure CSS/layout doesn't actually need UserGuide update — the rule still flags. Treat warnings as "consider", not "must".
2. **Stub redirects show as misfiled in `report`.** A doc with `status: archived` at its original (non-archive) path is technically misfiled, but it might be an intentional redirect stub (e.g., `docs/PLATFORM-REVIEW-03022026.md` → archive). Manual review needed.
3. **Glob matching is simple.** Patterns like `**/dir/**` work; complex brace expansions don't. Keep `scripts/source-doc-map.json` patterns simple.
4. **Base ref defaults to `origin/main`.** If `origin/main` isn't fetched locally, audit falls back to `HEAD~1..HEAD` (same as docs-audit.ts).

---

## When to add a new source-doc-map entry

Add a mapping when:

- A new feature ships with its own doc (`docs/features/<feature>/README.md`)
- A specific source file is the canonical implementation of a documented concept (e.g. `src/lib/pricing.ts` → `RAV-PRICING-TAXES-ACCOUNTING.md`)
- Refactor moves a code path → corresponding doc paragraph

The mapping file is `scripts/source-doc-map.json` with the structure:
```json
{
  "mappings": [
    { "source": ["glob1", "glob2"], "docs": ["doc1.md", "doc2.md"] }
  ]
}
```

Globs use `**` (any path) and `*` (any segment). Multiple sources OR-match; all docs in the `docs` array are checked individually.

---

## Future enhancements (tracked separately)

- **PR4:** Auto-archive logic for unambiguously superseded docs (same-pattern with newer dates).
- **Future:** Live `gh issue` cross-ref ("doc X was last touched in #123 — is that issue still open?")
- **Future:** Weighted severity (gate vs strong-warn vs weak-warn) so the warnings list stays signal-rich.

---

## Related skills

- [`/sdlc`](../sdlc/SKILL.md) — full SDLC workflow. Calls `/sdlc-docs audit` at session close and at PR creation.
- [`/generate-docs`](../generate-docs/SKILL.md) — snapshot composer. Produces dated artifacts that `/sdlc-docs` audit treats as `doc_kind: "snapshot"` (skipped in canonical-doc rules).

---

## Related infrastructure

- **Source-doc map:** [`scripts/source-doc-map.json`](../../scripts/source-doc-map.json)
- **Runner:** [`scripts/sdlc-docs.ts`](../../scripts/sdlc-docs.ts)
- **Sibling validators:** [`scripts/docs-audit.ts`](../../scripts/docs-audit.ts), [`scripts/docs-sync-check.ts`](../../scripts/docs-sync-check.ts)
- **CI workflow:** [`.github/workflows/sdlc-docs.yml`](../../.github/workflows/sdlc-docs.yml)
- **Doc index:** [`docs/INDEX.md`](../../docs/INDEX.md)
- **No-duplication rule:** [`feedback-no-doc-duplication`](../../../../.claude-max/projects/C--Repos-personal-gh-tektekgo-rentavacation/memory/feedback_no_doc_duplication.md) memory
