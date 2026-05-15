# Lessons

Recurring corrections and surprises worth not re-learning. One entry per pattern.

---

## L-001 — GitHub silently re-targets open PRs to `main` when their base branch is deleted

**Rule:** Before approving a merge on a `feature → dev` PR, verify the PR's `baseRefName` is still `dev`. Re-creating a deleted `dev` branch does **not** restore the original base on already-open PRs.

**Why:**
Session 67. After PR #527 (`dev → main`) merged with "auto-delete head branches" enabled, `origin/dev` was deleted. Open PR #528 (`feature/issue-510-* → dev`) was silently re-targeted to `main` by GitHub. When `dev` was re-created later (for CI fix PR #529), PR #528's base stayed at `main`. Approving "merge dev to main" shipped the #510 work directly to production main instead of the intended two-stage rollout. No data loss, but bypassed the staging gate.

**How to apply:**
- Before any merge approval, run `gh pr view <num> --json baseRefName,headRefName` and verify the base matches the workflow you intend.
- If `dev` is auto-deleted after a `dev → main` merge, immediately re-create `origin/dev` from `main` **before** any other PR work. Even then, retarget pre-existing PRs manually with `gh pr edit <num> --base dev`.
- Better long-term fix: in repo settings, disable "auto-delete head branches" for `dev` only (PR-level setting is repo-wide on GitHub, so the workaround is to never push a release PR with `dev` as head — release-merge from a release branch instead, or accept the manual re-create).

**Related:** [[feedback_github_pr_auto_retarget]] (auto-memory — broader than this repo)

---

## L-002 — Supabase CLI needs `--include-all` when mixing numeric and timestamp migration prefixes

**Rule:** When this repo's migrations include both legacy `NNN_*.sql` (e.g. `080_*`) and timestamped `YYYYMMDD*.sql` (e.g. `20260211_*`), any new numeric migration version that sorts *before* an already-applied timestamped migration on remote will be refused by `supabase db push` unless you pass `--include-all`.

**Why:**
Session 67. Pushing `080_commission_rate_runtime.sql` to DEV failed with `Found local migration files to be inserted before the last migration on remote database`. Three future-dated migrations (`20260211`, `20260220201325`, `20260415`) were already on remote with lexicographically larger versions than `080`. The CLI's safety check assumes monotonic ordering; mixing conventions breaks that assumption.

**How to apply:**
- For now: every new `NNN_*.sql` migration needs `npx supabase db push --linked --include-all` (after a `--dry-run` pass first).
- Dry-run first to confirm exactly what `--include-all` will apply — the flag widens scope to *all* pending local migrations, not just the one you intend.
- Better long-term fix: pick one convention. Either rename the three `20260*` migrations to `081/082/083_*` and keep going numeric, or commit to `YYYYMMDDHHMMSS_*` for everything new (Supabase's current default).

**Related:** [[reference_supabase_migration_push]] (auto-memory — quick reference for the flag)
