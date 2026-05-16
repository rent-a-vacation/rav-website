---
last_updated: "2026-05-15T17:42:29"
change_ref: "3a9993d"
change_type: "snapshot-financials-2026-05-15"
status: "active"
doc_kind: "snapshot"
---

# RAV Financial Model Snapshot — May 15, 2026

> Snapshot of the **shape + inputs + verification refs** of the financial model as of `3a9993d` (May 15, 2026). Projection numbers themselves are confidential — the `.xlsx` artifact is gitignored.

> **Composite snapshot — read-only.** This file links and quotes from the canonical sources above. It is regenerated on demand by `/generate-docs` and is **not** a source of truth itself. To change anything in this snapshot, edit the canonical source. To refresh, run the relevant `npm run docs:gen:*` script.

---

## 1. Source documents (canonical)

| Source (canonical) | Path | Last commit |
|---|---|---|
| Financial model index | [`docs/financials/README.md`](../../docs/financials/README.md) | `3a9993d` (2026-05-15) — docs: refresh accounting + add INDEX + features cleanup (Session 68 Part 4 PR1/4) |
| Pricing inputs (canonical) | [`docs/RAV-PRICING-TAXES-ACCOUNTING.md`](../../docs/RAV-PRICING-TAXES-ACCOUNTING.md) | `3a9993d` (2026-05-15) — docs: refresh accounting + add INDEX + features cleanup (Session 68 Part 4 PR1/4) |
| Commission constants | [`src/config/commission.ts`](../../src/config/commission.ts) | `86e178d` (2026-05-11) — feat(commission): platform rate 15% → 12%, Business discount 5% → 4% |
| Build entry | [`scripts/financial-model/build.ts`](../../scripts/financial-model/build.ts) | `476b305` (2026-05-11) — fix(financials): enlarge hover-note boxes + readable font (Calibri 10pt navy) |
| Typed inputs | [`scripts/financial-model/data.ts`](../../scripts/financial-model/data.ts) | `ec5cb14` (2026-05-11) — feat(executive): Phase 2 Stage 2a — Financial Model dashboard at /executive-dashboard/financial-model |
| Web dashboard | [`src/pages/FinancialModelDashboard.tsx`](../../src/pages/FinancialModelDashboard.tsx) | `50c8c0f` (2026-05-11) — feat(executive): shared tab navigation between Live Metrics and Financial Model |
| Shared calc lib | [`src/lib/financial-model/calc.ts`](../../src/lib/financial-model/calc.ts) | `ec5cb14` (2026-05-11) — feat(executive): Phase 2 Stage 2a — Financial Model dashboard at /executive-dashboard/financial-model |
| Shared data lib | [`src/lib/financial-model/data.ts`](../../src/lib/financial-model/data.ts) | `ec5cb14` (2026-05-11) — feat(executive): Phase 2 Stage 2a — Financial Model dashboard at /executive-dashboard/financial-model |

## 2. Snapshot of model index

- **`docs/financials/README.md` last_updated:** 2026-05-15T00:00:00
- **change_type:** session-68-financials-readme
- **Build command:** `npm run financials:build`
- **Web dashboard route:** `/executive-dashboard/financial-model` (`rav_owner` only) — see [`src/pages/FinancialModelDashboard.tsx`](../../src/pages/FinancialModelDashboard.tsx)
- **Latest local `.xlsx` artifact:** `RAV_Financial_Model_2026-05-12_0113.xlsx` (modified 2026-05-11T22:43:25) — _gitignored, confidential_

## 3. Model input shape (from `scripts/financial-model/data.ts`)

**Exported types:**


**Exported constants (input groupings):**


## 4. Generator inventory

**TypeScript build (`scripts/financial-model/`):**

- [`scripts/financial-model/build.ts`](../../scripts/financial-model/build.ts)
- [`scripts/financial-model/colors.ts`](../../scripts/financial-model/colors.ts)
- [`scripts/financial-model/data.ts`](../../scripts/financial-model/data.ts)
- [`scripts/financial-model/style.ts`](../../scripts/financial-model/style.ts)
- [`scripts/financial-model/tabs/breakeven.ts`](../../scripts/financial-model/tabs/breakeven.ts)
- [`scripts/financial-model/tabs/cover.ts`](../../scripts/financial-model/tabs/cover.ts)
- [`scripts/financial-model/tabs/expenses.ts`](../../scripts/financial-model/tabs/expenses.ts)
- [`scripts/financial-model/tabs/funding.ts`](../../scripts/financial-model/tabs/funding.ts)
- [`scripts/financial-model/tabs/inputs.ts`](../../scripts/financial-model/tabs/inputs.ts)
- [`scripts/financial-model/tabs/instructions.ts`](../../scripts/financial-model/tabs/instructions.ts)
- [`scripts/financial-model/tabs/revenue.ts`](../../scripts/financial-model/tabs/revenue.ts)
- [`scripts/financial-model/tabs/sensitivity.ts`](../../scripts/financial-model/tabs/sensitivity.ts)
- [`scripts/financial-model/tabs/unit-econ.ts`](../../scripts/financial-model/tabs/unit-econ.ts)

**Shared with web dashboard (`src/lib/financial-model/`):**

- [`src/lib/financial-model/calc.ts`](../../src/lib/financial-model/calc.ts)
- [`src/lib/financial-model/data.ts`](../../src/lib/financial-model/data.ts)

## 5. Decision excerpts (filtered to financial-model topics)

<details><summary><b>DEC-014</b> — extracted from PROJECT-HUB.md</summary>


### DEC-014: Separate Route for Executive Dashboard
**Date:** February 20, 2026
**Decision:** `/executive-dashboard` as standalone page, not a tab in admin dashboard
**Status:** Final

**Reasoning:** Different design language, different audience, different purpose. Admin = utilitarian ops tool. Executive = boardroom strategy view. Mixing them dilutes both.


</details>

<details><summary><b>DEC-041</b> — extracted from PROJECT-HUB.md</summary>


### DEC-041: Platform Commission Rate Repositioned to 12% (was 15%); Tier Discounts Recalibrated
**Date:** May 11-12, 2026 (Session 65, PR #514)
**Decision:** The base platform commission rate is changed from **15% to 12%**. Tier discounts are recalibrated accordingly so the highest-volume Business tier doesn't drop to an aggressive 7%:

| Tier | Effective rate before | Effective rate after |
|------|------------------------|------------------------|
| Free Owner | 15% | **12%** |
| Pro Owner ($10/mo) | 13% (15% − 2pp) | **10%** (12% − 2pp) |
| Business Owner ($25/mo) | 10% (15% − 5pp) | **8%** (12% − 4pp) — business discount tightened 5pp → 4pp |

**Rationale — competitor anchoring:**
- **RedWeek "Verified Rental"** charges 15-20% to owners — RAV's most direct full-service competitor
- **Koala** charges 10% to owners — lighter-feature competitor, RAV beats on escrow + AI + bid mechanics
- **12% positions RAV as "premium over Koala, below RedWeek"** — defensible by the extra service stack
- 10% would match Koala exactly, removing price as friction but failing to capture RAV's incremental service value
- 15% was harder to explain in head-to-head: travelers/owners see "+50% over Koala" before they hear about extra features

**Why 4pp Business discount (not 5pp):**
- At 12% base, 5pp discount → Business effective 7% — materially below Koala (10%) for no clear strategic gain. Hard to walk back if market doesn't reward it.
- 8% still rewards high-volume Business owners while preserving sustainable RAV margin.

**Implementation:**
- One-file edit: `src/config/commission.ts` (single source of truth via DEC-041's prerequisite — central commission config, #510 MVP).
- Live booking pricing (`src/lib/pricing.ts` → `RAV_MARKUP_RATE`) and the financial model (`src/lib/financial-model/data.ts` PLATFORM rows) both pull from the central config — no code drift possible.
- Tests updated: `src/lib/pricing.test.ts` (4 hardcoded value assertions) + `src/components/admin/AdminListingEditDialog.test.tsx` (one rendered-text assertion). 1669/1669 pass.

**Status:** Active. Replaces prior 15% rate locked in DEC-022 (Pricing, Tax & Accounting Framework). Outstanding doc updates: BRAND-LOCK.md § 5 numerical claims registry (still says 15%); `docs/RAV-PRICING-TAXES-ACCOUNTING.md` prose. Both pending separate doc-PR follow-up.

**Modeled impact:**
- At current scenario assumptions, dropping base 15% → 12% reduces 24-month Net Commission Revenue by roughly 20% (base scenario). Sensitivity tab on the financial model shows the full curve. Subscription + voice overage revenue unaffected.
- The decision is anchored to long-term competitive positioning, not short-term forecast optimization. If the strategic positioning works, the modest revenue compression is recovered through faster owner acquisition.


</details>

<details><summary><b>DEC-043</b> — extracted from PROJECT-HUB.md</summary>


### DEC-043: Commission Rate Runtime Architecture — DB-First with Per-Booking Persistence
**Date:** May 13, 2026 (Session 67, issue #510)
**Decision:** The platform commission rate is now read at **runtime** from `system_settings.platform_commission_rate` (DB) by every consumer that creates or displays priced inventory. The build-time constant in `src/config/commission.ts` (DEC-041 values) is a **fallback only**, used when the DB read fails or the row is absent.

**Architecture:**
- **DB authoritative source:** `system_settings.platform_commission_rate` JSONB row, seeded to `{rate:12, pro_discount:2, business_discount:4}` by Migration 080.
- **Public accessor:** `public.get_platform_commission_rate()` — SECURITY DEFINER function granted to `anon`, `authenticated`, and `service_role`. Lets anonymous browsers read the rate without exposing the rest of `system_settings`.
- **Frontend consumption:** `useCommissionRate()` hook (`src/hooks/useCommissionRate.ts`) returns rates as DECIMALS, with `useEffectiveCommissionRate(tier?)` for callers that need a single number ready to pass to `computeListingPricing(...)` / `computeFeeBreakdown(...)`. React Query cache (5 min). Used by Checkout, PropertyDetail, BidFormDialog, AdminListingEditDialog, OwnerListings, useBidding (proposal-accept auto-create-listing), and usePublishDraft.
- **Edge-function consumption:** `getCommissionRate(supabase)` in `supabase/functions/_shared/commission.ts`. Async-fetches the live rate; same DEFAULT fallback.
- **Per-booking persistence:** new column `bookings.commission_rate_applied` (NUMERIC(5,4), nullable for back-fill). `create-booking-checkout` writes the resolved rate (decimal) on every new booking. Refunds/payment-verify/webhook handlers read from this column so post-creation rate changes never retroactively distort historical accounting.
- **Audit trail:** new generic `admin_audit_log` table (Migration 080) records actor, before/after value, and optional notes on every `system_settings` change. RLS gates reads + writes to RAV team. Surfaced in the admin System Settings tab as a "Recent changes" list.

**Why generic `admin_audit_log` instead of `commission_rate_changes`:**
Future admin-edited settings (escrow hold period, voice quotas, fee schedules) need the same audit-log pattern. A single ledger keyed by `(entity_type, entity_key)` keeps `system_settings.updateSetting` as the only write path and avoids per-setting audit tables.

**Drift bug fixed in same change:**
`useSystemSettings.ts` and `useOwnerCommission.ts` previously had stale `{rate:15, pro_discount:2, business_discount:5}` fallback defaults. Both now source from `DEFAULT_COMMISSION` so DEC-041 values flow through automatically; future rate changes only require editing `src/config/commission.ts` (build-time) AND the DB row (runtime).

**Unblocks:** #509 (promotional rate overrides) can now layer per-rule overrides on top of this resolution chain without touching pricing math or display code.

**Status:** Active.


</details>

## 6. Verification trail

- **Snapshot generated by:** `docs/exports/generate_financials.py`
- **HEAD at snapshot time:** `3a9993d`
- **Snapshot date:** May 15, 2026
- **Confidential outputs not embedded** — `.xlsx` artifacts are gitignored. This snapshot only describes the model's shape, inputs, and where to regenerate it.

---

*Composite snapshot. RAV Financial Model. Generated May 15, 2026. See `docs/INDEX.md` for navigation.*
