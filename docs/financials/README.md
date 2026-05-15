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
| **TypeScript build** | [`scripts/financial-model/`](../../scripts/financial-model/) | Generates the `.xlsx` artifact via `exceljs`. Entry: `build.ts`. Run: `npm run financials:build`. |
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

## Related docs

- [`../RAV-PRICING-TAXES-ACCOUNTING.md`](../RAV-PRICING-TAXES-ACCOUNTING.md) — fee structure + commission tiers + accounting flow
- [`../OPERATING-MODEL.md`](../OPERATING-MODEL.md) — broader business operating model
- DEC-014 in [`PROJECT-HUB.md`](../PROJECT-HUB.md) — Executive Dashboard standalone-page decision

## Data classification

`.xlsx` outputs in this folder are **CONFIDENTIAL**. Source code in `scripts/financial-model/` is safe to commit (no PII, no real customer data — only model structure and assumed inputs).
