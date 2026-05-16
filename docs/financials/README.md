---
last_updated: "2026-05-15T00:00:00"
change_ref: "manual-edit"
change_type: "session-68-financials-readme"
status: "active"
---

# Financials — RAV Financial Model

> **TL;DR:** This folder contains the **generated** financial model artifact (`.xlsx`). The artifact is **gitignored — confidential**. The actual model **source code** lives elsewhere in the repo.

---

## Where the source lives

| Layer | Location | Purpose |
|---|---|---|
| **TypeScript build** | [`scripts/financial-model/`](../../scripts/financial-model/) | Generates the `.xlsx` artifact via `exceljs`. Entry: `build.ts`. Run: `npm run financials:build`. Also hosts dump scripts (`dump-spend-summary.ts`, `dump-platform-facts.ts`) that the `/generate-docs --spend-brief` and `--pitch-brief` Python generators consume — single source of truth shared with .xlsx + web dashboard. |
| **Web dashboard** | [`src/pages/FinancialModelDashboard.tsx`](../../src/pages/FinancialModelDashboard.tsx) | Live web view of the model — route `/executive-dashboard/financial-model` (rav_owner only). Shipped in Session ~67. |
| **Shared calc** | [`src/lib/financial-model/`](../../src/lib/financial-model/) | `data.ts` (typed inputs, scenarios, milestones), `calc.ts` (calculation logic). Shared between Excel generator and React dashboard. |
| **Operational financials** | [`src/components/admin/AdminFinancials.tsx`](../../src/components/admin/AdminFinancials.tsx) | NOT the same as the model dashboard. Shows live revenue/payouts/commissions in `/admin-dashboard?tab=financials`. |

## What's in this folder

| File | Status | Notes |
|---|---|---|
| `RAV_Financial_Model_YYYY-MM-DD_HHMM.xlsx` | Gitignored | Latest generated artifact. Regenerate with `npm run financials:build`. |
| `*.xls`, `*.csv` | Gitignored | Future variants. Same gitignore rule (`docs/financials/*.xlsx`, `*.xls`, `*.csv`). |

The `.xlsx` outputs contain real revenue projections, funding-ask numbers, and unit-economics scenarios — they must never be committed. Distribution channel: copy to `OneDrive/Rent-A-Vacation/Business/Financials/` and share with co-founders.

## How to regenerate

```bash
npm run financials:build
# Output: docs/financials/RAV_Financial_Model_<today>_<HHMM>.xlsx
```

Tabs (7): Cover, INPUTS (incl. Section F: Tax/Cash/Reserves), EXPENSES (~47 rows), REVENUE MODEL (24-month with Stripe fee netting), BREAK-EVEN, FUNDING ASK, INSTRUCTIONS. ~41 named ranges drive all formulas.

## Generated briefs (companion artifacts)

Three `/generate-docs` sub-commands produce founder-facing briefs that compose from this model's data:

- **`/generate-docs --pitch-brief`** → `docs/exports/RAV-pitch-brief-YYYY-MM-DD.md` — 1-2 page elevator brief ("what is RAV") for advisor / mentor / warm-intro conversations. Pulls `PLATFORM_FACTS` + `MILESTONES` from `src/lib/financial-model/data.ts` + live test/migration/edge-fn counts.
- **`/generate-docs --spend-brief`** → `docs/exports/RAV-spend-brief-YYYY-MM-DD.md` — 1 page burn-rate brief ("what we expect to spend"). Pulls live monthly spend curve from `EXPENSES` rows via `dump-spend-summary.ts`.
- **`/generate-docs --investor-faq`** → `docs/exports/RAV-investor-faq-YYYY-MM-DD.md` — Q&A markdown answering 10 questions investors actually ask (commission, tiers, burn, break-even per scenario, GMV/revenue at 24mo, revenue mix, funding ask, growth projections, cost structure, unit economics). Pulls live from `dump-investor-faq.ts` which calls `project()` for all scenarios. **Auto-bundled with `npm run financials:build`** — one CLI command produces both the `.xlsx` AND this `.md` so they're always in sync.

These are the conversational primers; the rich `.xlsx` model + web dashboard remain the deep-dive sources. See [`.claude/skills/generate-docs/SKILL.md`](../../.claude/skills/generate-docs/SKILL.md) for the full sub-command list.

## Upcoming stages (`/executive-dashboard/financial-model` roadmap)

Current state: Stage 2a (view-only MVP) shipped. Stages 2b/2c/2d **resequenced 2026-05-16** to maximize pre-launch value — see DEC-042 in `PROJECT-HUB.md` for full rationale.

| Stage | Issue | Scope | When |
|---|---|---|---|
| **2c** | [#550](https://github.com/rent-a-vacation/rav-website/issues/550) | Interactive editing + per-user scenarios + sparse overrides in Supabase + drift banner + reset-to-baseline + live commission read from DB (closes the small build-time-vs-runtime drift) | **Next pre-launch** |
| **2d** | [#551](https://github.com/rent-a-vacation/rav-website/issues/551) | Functional .xlsx download from web — refactor `build.ts` to pure function shared with browser; two download buttons (baseline + active scenario); CLI behavior unchanged | After 2c, pre-launch |
| **2b** | [#545](https://github.com/rent-a-vacation/rav-website/issues/545) | Live actuals overlay on monthly trajectory (forecast vs reality) | **Post-launch** (resequenced — needs real bookings to validate) |

Once 2c + 2d ship, the web tool functionally replaces the `.xlsx` for day-to-day editing while the CLI `.xlsx` remains canonical for offline / sharing use.

### CLI behavior (`npm run financials:build`)

```
✓ Wrote docs/financials/RAV_Financial_Model_<stamp>.xlsx
Generated: docs/exports/RAV-investor-faq-<date>.md
```

Both artifacts produced from the same model in one command. The `.xlsx` build is the canonical step — FAQ generation is failure-isolated (if the Python generator can't run, the `.xlsx` still writes and a warning is logged).

## Related docs

- [`../RAV-PRICING-TAXES-ACCOUNTING.md`](../RAV-PRICING-TAXES-ACCOUNTING.md) — fee structure + commission tiers + accounting flow
- [`../OPERATING-MODEL.md`](../OPERATING-MODEL.md) — broader business operating model
- DEC-014 in [`PROJECT-HUB.md`](../PROJECT-HUB.md) — Executive Dashboard standalone-page decision

## Data classification

`.xlsx` outputs in this folder are **CONFIDENTIAL**. Source code in `scripts/financial-model/` is safe to commit (no PII, no real customer data — only model structure and assumed inputs).
