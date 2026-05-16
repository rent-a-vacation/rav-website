---
session: 68
date: 2026-05-15
closed: 2026-05-16
owner: Sujit + Claude
status: complete
---

# Plan — Documentation refresh + doc-management skills (Session 68)

> **REVIEW (Session 68 close, 2026-05-16):** All 4 PRs landed. Framework live in PROD. See [PROJECT-HUB.md](../docs/PROJECT-HUB.md) Session 68 Part 4 handoff for the per-PR summary. Next-session pickup: [#545](https://github.com/rent-a-vacation/rav-website/issues/545) — Phase 2 Stage 2b live actuals overlay on `/executive-dashboard/financial-model`.
>
> **What worked well:**
> - No-doc-duplication rule locked into auto-memory before any new doc was written — prevented the obvious trap (would have created 3 parallel "snapshot" docs alongside canonical sources).
> - 4-PR split kept each PR reviewable. Sequential merge order (#540 → #541 → #543 → #544) meant each PR's CI ran against a known-good base.
> - `/sdlc-docs` self-validated on its own PR (#543) by catching 2 real drift issues. That's the right kind of confidence — the system works because it's been used.
> - Existing scripts (`docs-audit.ts`, `docs-sync-check.ts`) were preserved and extended rather than replaced. No regression in CI.
>
> **What to do differently next session:**
> - Branch from up-to-date `dev` after every PR merge (auto-deletion of `dev` happened twice this session — L-001 still relevant; recovery procedure is solid).
> - When dogfooding a doc-sync watchdog, expect to find drift on the PR itself — budget ~15 min for the follow-up commit.
> - For multi-PR series, write the PR1 description with the full series planned upfront — easier for reviewer to see the arc.
>
> **Follow-ups filed (6):** #535-#539 (5 missing-feature READMEs), #542 (docs-audit gitignore false positive), plus #545 + #546 from session-close review.

> **Top-priority constraint (from user, this session):** No new doc duplicates content already in another doc. Verify uniqueness before creating anything. Default = refresh canonical + dated snapshot, NOT new parallel doc.

---

## Critical findings that shaped the plan

1. **`/generate-docs` is largely already built** as Python in `docs/exports/`. We will **wrap, not rebuild**.
2. **Accounting docs don't live in `docs/features/`** — they live at top-level `docs/` + `docs/payments/` + `docs/financials/`. The "features/ accounting refresh" framing doesn't have a real target.
3. **`PLATFORM-REVIEW-03022026.md` (top-level) and `RAV-Platform-Overview-04142026.md` (exports) overlap** — one should supersede the other.
4. **`/generate-docs` outputs go to `docs/exports/`** (existing convention), not a new `docs/snapshots/` folder.

---

## Phase 1 — Audit + refresh accounting / payment canonical docs (TODAY)

Goal: complete answer to user's task #1.

- [ ] **1.1** Read `docs/RAV-PRICING-TAXES-ACCOUNTING.md` end-to-end; diff against `src/lib/pricing.ts`, escrow + payout edge functions, DEC-043 (commission rate runtime). Refresh sections that drift. *Auto-fix mechanical + content; show end-of-run summary.*
- [ ] **1.2** Audit `docs/payments/PAYSAFE-COMPLIANCE.md` and `PAYSAFE-FLOW-SPEC.md` against current edge functions (`stripe-webhook`, escrow flows, dispute, cancellation). Refresh as needed.
- [ ] **1.3** Audit `docs/financials/` — confirm `.gs` model + README still match current pricing/commission. Note: `.xlsx` is gitignored per memory.
- [ ] **1.4** Walk every entry in `docs/features/` — generate a stale-doc report. Most are not accounting; for non-accounting stale entries, file follow-up GH issues (don't edit this session).
- [ ] **1.5** Decide on **`docs/features/accounting/README.md`**: create as a thin index file linking to canonical accounting docs (no content duplication), or skip. Surface to user.
- [ ] **1.6** Decide on **PLATFORM-REVIEW vs PLATFORM-OVERVIEW** consolidation. Surface to user.

## Phase 2 — Refresh canonical roadmap/status docs + generate dated snapshots

Per your decision: "Refresh canonical + dated snapshots."

- [ ] **2.1** Refresh `docs/PRIORITY-ROADMAP.md` to "as of Session 68 (2026-05-15)" — pull from open GH milestones, recently closed issues, DEC-043.
- [ ] **2.2** Refresh `docs/PROJECT-HUB.md` Platform Status block + add Session 68 handoff entry + add DEC-044 (doc-management framework).
- [ ] **2.3** Refresh `docs/PLATFORM-INVENTORY.md` if drift detected.
- [ ] **2.4** Refresh `docs/OPERATING-MODEL.md` if drift detected (last updated 2026-05-03; likely small refresh needed).
- [ ] **2.5** Run existing exporters with current date:
  - `python docs/exports/generate_docx.py` → produces `RAV-roadmap-draft-2026-05-15.{md,docx}` + `RAV-Development-Status-Report-2026-05-15.{md,docx}`
  - `python docs/exports/generate_platform_overview.py` → produces `RAV-Platform-Overview-2026-05-15.{md,docx}`
- [ ] **2.6** Move prior dated artifacts (Feb/April 2026) to `docs/exports/archive/`.
- [ ] **2.7** If we keep PLATFORM-REVIEW at top-level (per 1.6 decision), archive `docs/PLATFORM-REVIEW-03022026.md` → `docs/archive/PLATFORM-REVIEW-2026-03-02.md` with stub redirect.

> The output of Phase 1 + 2 = the four sources of truth you wanted for "RAV TAX and accounting consideration": `RAV-PRICING-TAXES-ACCOUNTING.md` + `RAV-roadmap-draft-2026-05-15.md` + `RAV-Development-Status-Report-2026-05-15.md` + `RAV-Platform-Overview-2026-05-15.md`.

## Phase 3 — Build `/generate-docs` skill

Per your decision: ship `--financials --operating-model --product-roadmap --security-posture --accounting`.

- [ ] **3.1** Create `.claude/skills/generate-docs/SKILL.md` documenting all sub-commands and their source-doc map.
- [ ] **3.2** Wire existing generators:
  - `--product-roadmap` → `generate_docx.generate_roadmap()`
  - `--status` → `generate_docx.generate_status_report()` *(NB: not in your list but it's already there; surface to user)*
  - `--operating-model` → `generate_platform_overview.generate_platform_overview()` *(or a fresh wrapper if Operating Model is distinct from Platform Overview — to be confirmed)*
- [ ] **3.3** Build NEW Python generators (reusing brand helpers in `generate_docx.py`):
  - `generate_financials.py` — composite from `RAV-PRICING-TAXES-ACCOUNTING.md` + `docs/financials/` + DEC-043
  - `generate_accounting.py` — composite from `RAV-PRICING-TAXES-ACCOUNTING.md` + `docs/payments/PAYSAFE-*.md` + relevant DEC entries
  - `generate_security_posture.py` — composite from `SECURITY-RISK-LOG.md` + `npm audit --json` + dependabot state + recent security commits
- [ ] **3.4** Add `npm` scripts: `docs:gen:roadmap`, `docs:gen:status`, `docs:gen:financials`, `docs:gen:accounting`, `docs:gen:operating-model`, `docs:gen:security-posture`, `docs:gen:all`.
- [ ] **3.5** Update `package.json` and `.claude/settings.local.json` permission allowlist.

## Phase 4 — Build `/sdlc-docs` skill (doc-sync watchdog)

Per your decisions: full auto-fix with end-of-run summary; auto-archive on unambiguous supersession; warn on dev push, gate on main PR.

- [ ] **4.1** Create `.claude/skills/sdlc-docs/SKILL.md`. Sub-commands: `audit`, `sync`, `archive-stale`, `report`.
- [ ] **4.2** Detection logic:
  - Diff code since last sync (commits on branch / PR diff against main)
  - Cross-ref via `scripts/source-doc-map.json` → impacted docs
  - Inspect impacted docs; auto-fix mechanical (frontmatter, version, counts, regenerated mermaid via `flowToMermaid()`); auto-edit content where confident; flag in summary
  - Walk `docs/features/`, `docs/payments/`, `docs/api/` checking for source-doc-map orphans
  - Walk `src/pages/UserGuide.tsx` + FAQ checking against features that changed user-visible behavior
  - Walk `src/flows/` manifests for routes added in `App.tsx` not yet manifested
  - Walk `supabase/functions/seed-manager/index.ts` checking for new tables/columns not seeded
  - SECURITY-RISK-LOG triggers: dependency changes, edge function changes, auth changes, RLS changes
- [ ] **4.3** Auto-archive logic:
  - When two docs share the same name pattern with different dates (`PLATFORM-REVIEW-MMDDYYYY.md`), auto-archive older with stub redirect
  - When a doc has `status: archived` in frontmatter, move to `docs/archive/` with stub
  - Ambiguous cases → ask user
- [ ] **4.4** Extend `scripts/source-doc-map.json` with newly identified mappings from Phase 1.
- [ ] **4.5** CI integration:
  - Extend `.github/workflows/docs-audit.yml` to run `/sdlc-docs audit --warn` on dev push
  - Add new workflow `.github/workflows/docs-sync-pr.yml` that runs `/sdlc-docs audit --gate` on PR-to-main and blocks merge if drift detected
- [ ] **4.6** Update existing `.claude/skills/sdlc/SKILL.md` to call `/sdlc-docs` at the documentation-checklist step (replaces the manual checklist).

## Phase 5 — SECURITY-RISK-LOG.md integration

- [ ] **5.1** Add SECURITY-RISK-LOG.md to `scripts/source-doc-map.json` mapped from: `package.json`, `package-lock.json`, `supabase/functions/_shared/auth.ts`, `supabase/migrations/**` (RLS changes).
- [ ] **5.2** `/sdlc-docs` detects security-relevant changes → auto-adds a triage placeholder entry in SECURITY-RISK-LOG.md → flags for manual triage.
- [ ] **5.3** Add weekly `npm audit --omit=dev` routine via `/schedule` (per existing roadmap mention) that opens an issue when new alerts appear.
- [ ] **5.4** Update `/sdlc` skill: at session-end checklist, ask if security-relevant changes need a SECURITY-RISK-LOG entry.

## Phase 6 — Document the new conventions

- [ ] **6.1** Add CLAUDE.md sections: `/sdlc-docs` convention, `/generate-docs` convention, archive convention.
- [ ] **6.2** Add DEC-044 to PROJECT-HUB.md: "Documentation management framework — sdlc-docs (sync) + generate-docs (snapshot) split."
- [ ] **6.3** Update PROJECT-HUB Session 68 handoff with what was done.
- [ ] **6.4** Update PRIORITY-ROADMAP.md (close out doc-management items, add follow-ups).
- [ ] **6.5** Run `npm run docs:sync-check` to validate end state.

---

## Out-of-scope this session (file as follow-up GH issues)

- `/goal` command research — deferred per your decision.
- Migrating archived `docs/exports/RAV-*` artifacts to a more discoverable home.
- E2E test coverage gates beyond current 70% threshold.
- Non-accounting stale `docs/features/` entries identified in 1.4 — per-feature follow-ups.

---

## Estimated session time

- Phase 1 + 2: ~2–2.5 hours (real edits, real generator runs, requires reading lots of code)
- Phase 3: ~1.5 hours (3 new Python generators + skill docs)
- Phase 4: ~2 hours (detection logic + CI workflows)
- Phase 5: ~30 min
- Phase 6: ~30 min

**Total: ~6.5 hours of focused work.** I recommend committing in phases (separate PRs for Phase 1+2, Phase 3, Phase 4, Phase 5+6) so reviewable chunks ship continuously rather than one mega-PR.

---

## Decisions (locked, 2026-05-15)

1. **`docs/features/accounting/README.md`** → YES (thin index) + ALSO build top-level `docs/INDEX.md` (master doc map).
2. **PLATFORM-REVIEW vs PLATFORM-OVERVIEW** → Same artifact. Consolidate to Platform Overview (in `docs/exports/`). Archive `docs/PLATFORM-REVIEW-03022026.md` → `docs/archive/` with stub.
3. **`/generate-docs` sub-commands (6 total)** → `--product-roadmap` `--status` `--operating-model` `--financials` `--accounting` `--security-posture`.
4. **PR strategy** → 4 sequential PRs:
   - **PR1**: Phase 1+2 (audit + accounting refresh + canonical doc refresh + dated snapshots + INDEX + features/accounting/README)
   - **PR2**: Phase 3 (`/generate-docs` skill + new Python generators)
   - **PR3**: Phase 4 (`/sdlc-docs` skill + CI workflows)
   - **PR4**: Phase 5+6 (SECURITY-RISK-LOG integration + CLAUDE.md updates + DEC-044 + Session 68 close)
