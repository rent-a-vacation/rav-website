---
name: generate-docs
description: Generate dated composite snapshots of platform topics (accounting, financials, security posture, roadmap, status, operating model) into docs/exports/. Composes from canonical sources — never duplicates content.
argument-hint: "--<topic>  (e.g. --accounting, --financials, --security-posture, --product-roadmap, --status, --operating-model, --all)"
allowed-tools: Bash(npm run docs:gen:*) Bash(python docs/exports/*) Read Glob
---

# `/generate-docs` — Snapshot Composer

> On-demand generation of dated composite snapshots. Each snapshot **links and quotes** the canonical sources — it is never the source of truth. To change anything in a snapshot, edit the canonical doc and regenerate.

**Top-priority constraint** ([feedback-no-doc-duplication](../../../../.claude-max/projects/C--Repos-personal-gh-tektekgo-rentavacation/memory/feedback_no_doc_duplication.md)): no new doc duplicates content already in another doc. Snapshots are read-only composites.

---

## Sub-commands

| Sub-command | Output | Generator | Sources composed |
|---|---|---|---|
| `--accounting` | `docs/exports/RAV-accounting-snapshot-YYYY-MM-DD.md` | `generate_accounting.py` (NEW) | `RAV-PRICING-TAXES-ACCOUNTING.md` + `payments/PAYSAFE-COMPLIANCE.md` + `payments/PAYSAFE-FLOW-SPEC.md` + `financials/README.md` + `src/lib/pricing.ts` + `src/config/commission.ts` + DEC-022/038/039/041/043 + open GH issues #127/#63/#65/#509/#531/#532 |
| `--financials` | `docs/exports/RAV-financials-snapshot-YYYY-MM-DD.md` | `generate_financials.py` (NEW) | `financials/README.md` + `RAV-PRICING-TAXES-ACCOUNTING.md` + `src/config/commission.ts` + `scripts/financial-model/` (file inventory) + `src/lib/financial-model/` + `src/pages/FinancialModelDashboard.tsx` + DEC-014/041/043 |
| `--security-posture` | `docs/exports/RAV-security-posture-YYYY-MM-DD.md` | `generate_security_posture.py` (NEW) | `SECURITY-RISK-LOG.md` (canonical) + `npm audit --json` (live) + `gh dependabot alerts` (live) + last 15 security-tagged git commits |
| `--product-roadmap` | `docs/exports/RAV-roadmap-draft-MMDDYYYY.docx` | `generate_docx.py --roadmap` (existing) | Hand-curated content (uses brand template). Note: dates baked in; refresh manually for current-period content. |
| `--status` | `docs/exports/RAV-Development-Status-Report-MMDDYYYY.docx` | `generate_docx.py --status` (existing) | Same — hand-curated .docx with brand styling. |
| `--operating-model` | `docs/exports/RAV-Platform-Overview-YYYYMMDD.docx` | `generate_platform_overview.py` (existing) | Hand-curated platform inventory + brand terminology table. Uses dynamic date. |
| `--pitch-brief` | `docs/exports/RAV-pitch-brief-YYYY-MM-DD.md` | `generate_pitch_brief.py` (NEW) | Curated "what is RAV" elevator brief (1-2 pages, 60-90 sec read) + live PLATFORM_FACTS + MILESTONES from `src/lib/financial-model/data.ts` + live test/migration/edge-fn counts from canonical sources. For advisor / mentor / warm-intro conversations. |
| `--spend-brief` | `docs/exports/RAV-spend-brief-YYYY-MM-DD.md` | `generate_spend_brief.py` (NEW) | High-level "what we expect to spend" brief (1 page, 60 sec read). Today's run-rate + 12-month curve + top categories + recurring-vs-one-time + "what's NOT in this number". Pulls live from EXPENSES rows via `scripts/financial-model/dump-spend-summary.ts`. Companion to `--pitch-brief`. |
| `--investor-faq` | `docs/exports/RAV-investor-faq-YYYY-MM-DD.md` | `generate_investor_faq.py` (NEW) | Q&A markdown answering 10 questions an investor actually asks: commission structure, subscription tiers, monthly burn, break-even per scenario, 24-month GMV/revenue projections, revenue mix, funding ask, user/booking growth projections, cost structure, unit economics. Pulls live from `dump-investor-faq.ts` which calls `project()` for all scenarios + reads SUBSCRIPTIONS / RESERVES / UNIT_ECON / EXPENSES from data.ts. **Also auto-generated as a companion to the .xlsx by `npm run financials:build`** — one command, both artifacts. |
| `--all` | All nine | runs each in sequence | Combined run (sequential `npm run docs:gen:all`) |

---

## How to invoke

### From Claude Code (preferred)
```
/generate-docs --accounting
/generate-docs --financials
/generate-docs --security-posture
/generate-docs --product-roadmap
/generate-docs --status
/generate-docs --operating-model
/generate-docs --pitch-brief         # 1-2 page founder elevator brief
/generate-docs --spend-brief         # 1 page burn-rate brief
/generate-docs --investor-faq        # Q&A markdown for investor conversations
/generate-docs --all
```

### Direct npm scripts (anyone can run)
```bash
npm run docs:gen:accounting
npm run docs:gen:financials
npm run docs:gen:security-posture
npm run docs:gen:roadmap
npm run docs:gen:status
npm run docs:gen:operating-model
npm run docs:gen:pitch-brief
npm run docs:gen:spend-brief
npm run docs:gen:investor-faq
npm run docs:gen:all

# Bundled with the Excel build (one command, .xlsx + investor-faq.md both):
npm run financials:build
```

### Direct Python (for debugging or CI)
```bash
python docs/exports/generate_accounting.py
python docs/exports/generate_financials.py
python docs/exports/generate_security_posture.py
python docs/exports/generate_docx.py --roadmap
python docs/exports/generate_docx.py --status
python docs/exports/generate_platform_overview.py
```

---

## Output convention

| Convention | Value |
|---|---|
| **Output directory** | `docs/exports/` |
| **Naming pattern (NEW generators)** | `RAV-<topic>-snapshot-YYYY-MM-DD.md` (ISO-style sortable date) |
| **Naming pattern (EXISTING generators)** | `RAV-<topic>-MMDDYYYY.docx` (preserved for backwards compat) |
| **Frontmatter** | `last_updated`, `change_ref` (head SHA), `change_type: "snapshot-<topic>-YYYY-MM-DD"`, `status: "active"`, `doc_kind: "snapshot"` |
| **Disclaimer** | Every snapshot includes a banner that it's a composite, read-only, and must not be edited directly |
| **Source-of-truth table** | Section 1 of every snapshot lists the canonical sources + git refs (short SHA + commit date + subject) |

Older dated artifacts in `docs/exports/` are moved to `docs/exports/archive/` by the `/sdlc-docs` skill (next session) when a newer dated version supersedes them.

---

## Composition rules (enforced by `_compose.py` helpers)

1. **Link, don't duplicate.** Snapshots reference the canonical doc by relative path; they don't embed the canonical body.
2. **Quote with attribution.** When extracting facts (DEC entries, frontmatter, code constants), always show the source path + git ref.
3. **Live values get a verification ref.** Snapshot content extracted from code (e.g. commission rate from `src/config/commission.ts`) shows the file's last commit SHA + date.
4. **Snapshots have `doc_kind: "snapshot"` frontmatter.** This lets `/sdlc-docs` and CI skip them in canonical-doc audits.
5. **Confidential outputs not embedded.** Financial-model `.xlsx` projections are gitignored; the `--financials` snapshot describes the model SHAPE + file inventory, not the projection numbers.

---

## When to use which sub-command

| Use case | Run |
|---|---|
| Stakeholder asks "what's our accounting framework right now?" | `--accounting` |
| Counsel meeting prep on payments/escrow | `--accounting` (covers PaySafe + commission + Stripe Tax + Puzzle.io) |
| Investor / advisor asks about financial model | `--financials` |
| Security review or quarterly posture check | `--security-posture` |
| Board update on roadmap | `--product-roadmap` |
| Internal status standup / weekly | `--status` |
| New collaborator onboarding | `--operating-model` |
| Advisor / mentor / warm-intro conversation: "what is RAV?" | `--pitch-brief` |
| Same conversation: "what does it cost to run?" | `--spend-brief` (pair with `--pitch-brief`) |
| Investor conversation: "answer my financial questions" | `--investor-faq` (pair with `--pitch-brief`) |
| Quarterly archive sweep | `--all` |

---

## Adding a new sub-command

1. Create `docs/exports/generate_<topic>.py` reusing helpers from `_compose.py` (frontmatter, source-table, git-ref, GH issue lookups).
2. Output to `docs/exports/RAV-<topic>-snapshot-YYYY-MM-DD.md` via `write_snapshot()`.
3. Add an `npm run docs:gen:<topic>` script to `package.json`.
4. Update the **Sub-commands** table above.
5. Update `docs:gen:all` to include the new script.
6. Update `docs/INDEX.md` topic table to point at the new generator.

---

## Limitations

1. **Hardcoded dates in `generate_docx.py`** — the existing roadmap + status generators have Feb 22 2026 baked into filenames. They produce a current-content artifact but the date in the filename is stale. **Follow-up:** refactor those two functions to use `today_iso()` from `_compose.py`. Tracked as future work.
2. **`--all` is sequential** — runs scripts one after another. ~2-3 minutes total because `--security-posture` runs `npm audit`. Acceptable for now; parallelize via `concurrently` or similar if it becomes a bottleneck.
3. **`gh` CLI dependency** — `--accounting` and `--security-posture` use `gh issue view` and `gh api dependabot/alerts` for live data. If `gh` is not authenticated or its scope doesn't include `security:read`, those sections degrade gracefully ("unavailable at snapshot time") but the snapshot still generates.
4. **`npm audit` Windows quirk** — on Windows, `npm audit` is invoked with `shell=True` because `npm` is a `.cmd` shim. Cross-platform — works on macOS/Linux too.

---

## Related skills

- [`/sdlc`](../sdlc/SKILL.md) — full SDLC workflow; calls `/generate-docs` for dated snapshots when prepping a status report.
- `/sdlc-docs` — *(coming PR3)* doc-sync watchdog. Cross-references code changes against `scripts/source-doc-map.json` and flags impacted docs. Will auto-archive superseded dated snapshots when newer versions exist.

---

## Related infrastructure

- **Output directory:** `docs/exports/` (older artifacts archived to `docs/exports/archive/`)
- **Shared helpers:** [`docs/exports/_compose.py`](../../docs/exports/_compose.py) — frontmatter, source-table, git-ref, GH issue calls, file IO
- **Brand helpers:** [`docs/exports/generate_docx.py`](../../docs/exports/generate_docx.py) — branded `.docx` infrastructure (used by `--product-roadmap`, `--status`, `--operating-model`, and any future `.docx` generators)
- **Doc index:** [`docs/INDEX.md`](../../docs/INDEX.md) — topic → canonical doc + which generator produces the snapshot
- **No-duplication rule:** [`feedback-no-doc-duplication`](../../../../.claude-max/projects/C--Repos-personal-gh-tektekgo-rentavacation/memory/feedback_no_doc_duplication.md) memory
