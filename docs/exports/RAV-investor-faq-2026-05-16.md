---
last_updated: "2026-05-16T19:25:45"
change_ref: "2e36630"
change_type: "snapshot-investor-faq-2026-05-16"
status: "active"
doc_kind: "snapshot"
---

# RAV — Investor FAQ — May 16, 2026

> 10 questions an investor actually asks, answered from the same live model the .xlsx + `/executive-dashboard/financial-model` use. Pre-launch posture: all projections are forward-looking; actuals not yet live (model month 1 = May 2026; today is **May 2026**, model month **1**).

> **Composite snapshot — read-only.** This file links and quotes from the canonical sources above. It is regenerated on demand by `/generate-docs` and is **not** a source of truth itself. To change anything in this snapshot, edit the canonical source. To refresh, run the relevant `npm run docs:gen:*` script.

---

### Q1. What is RAV's commission structure?

**12% base commission** on every booking, with tier discounts:

- **Free Owner:** 12% effective
- **Owner Pro ($10/mo subscription):** 10% effective (2% discount off base)
- **Owner Business ($25/mo subscription):** 8% effective (4% discount off base)

Live source: `system_settings.platform_commission_rate (DEC-043)`. Admin-editable via the System Settings tab (audit-logged per change). Every booking persists the rate that was in effect at booking time (`bookings.commission_rate_applied`), so historical accounting is preserved when rates change.

### Q2. What are RAV's subscription tiers and pricing?

Four paid tiers + free:

- **Traveler Free:** $0/mo
- **Traveler Plus:** $5/mo
- **Traveler Premium:** $15/mo
- **Owner Pro:** $10/mo
- **Owner Business:** $25/mo

Traveler tiers gate voice-search quota and other discovery features. Owner tiers gate listing limits + commission discount. All managed via Stripe subscriptions (Customer Portal for self-service). Source of truth for prices is the `membership_tiers` DB table — frontend reads via `useMembership` hooks (no hardcoded prices in code).

### Q3. What's RAV's monthly burn right now and going forward?

**Today (May 2026): $2,686/mo.** Front-loaded with one-time legal/formation costs (~$2,500 for Delaware C-Corp via Stripe Atlas + attorney consultation + trademarks).

**Steady-state burn (post-incorporation, recurring only): $1,280/mo.**

Top cost categories this month:
  - Legal & Formation: $2,500 (93%)
  - Operations & Tools: $186 (7%)

What's NOT in this number: founder salaries ($0 until funded), Stripe processing fees (variable, % of GMV), Stripe Tax (0.5% per transaction, variable), hires (none planned pre-funding).

### Q4. When does RAV break even?

Per scenario in the 24-month model:

- **Conservative:** Does not break even in the 24-month horizon (needs more cash or growth).
- **Base:** Month 24 (Apr 2028) — cumulative cash crosses zero.
- **Optimistic:** Month 17 (Sep 2027) — cumulative cash crosses zero.

Break-even is defined as the model month where **cumulative cash on hand crosses zero** (cumulative revenue − cumulative costs >= starting cash + funding inflow). The 24-month horizon means we don't see further out without re-projecting; if a scenario doesn't break even in 24mo, it does require a funding round to extend runway.

### Q5. What's the projected GMV and revenue at 24 months?

All in USD; per scenario over 24 months:

| Scenario | GBV (gross booking value) | Net commission revenue | Total revenue | Total costs | Net profit/(loss) |
|---|---|---|---|---|---|
| Conservative | $63,911 | $5,025 | $8,894 | $35,162 | $-26,268 |
| Base | $334,118 | $26,272 | $41,238 | $35,162 | $6,076 |
| Optimistic | $2,038,172 | $160,264 | $242,809 | $35,162 | $207,647 |

*Total revenue* = net commission + subscription revenue + voice-overage revenue. *GBV* is the gross dollars travelers pay (RAV keeps commission; rest flows to owners as payout). These are forward projections from the model — actuals will be live once launch happens (Month 5, around Sep 2026).

### Q6. What's the revenue mix — commission vs. subscription?

Three revenue streams:

1. **Commission per booking** — 12% base, tier-discounted. Base scenario shows a **blended rate of 11.1%** across all bookings (weighted by Free/Pro/Business owner mix).
2. **Subscription revenue** — recurring MRR from Plus/Premium/Pro/Business tiers ($5-$25/mo).
3. **Voice-overage revenue** — per-traveler/mo for voice usage beyond tier quota (Plus/Free).

Commission is the dominant revenue stream once booking volume scales. Subscriptions are the steady-floor revenue (predictable MRR). Voice-overage is incremental and adoption-dependent.

### Q7. What's RAV's funding ask?

**No funding round currently modeled.** Founders are operating on:

- Starting cash: $0.00 (likely founder loan or self-funded)
- Founder comp: $0.00/founder/mo ($0 = $0 → founders unpaid until funded)
- Founded? **No (toggle in model)**

Funding ask scope: the model has slots for funding inflow + founder comp + 3 hire roles (engineer ~$12K/mo burdened, support ~$6K/mo, BD ~$9K/mo). All dormant pending a raise decision. Edit `src/lib/financial-model/data.ts` Sections F-G to set funding amount + hire months.

### Q8. How many users and bookings does the model project?

Per-scenario snapshots at Month 6, 12, 18, 24:

| Scenario | Month | Active owners | Active travelers | Bookings (that month) |
|---|---|---|---|---|
| Conservative | Mo 6 (Oct 2026) | 3 | 12 | 0.3 |
| Conservative | Mo 12 (Apr 2027) | 7 | 32 | 1.0 |
| Conservative | Mo 18 (Oct 2027) | 13 | 86 | 2.0 |
| Conservative | Mo 24 (Apr 2028) | 26 | 232 | 3.9 |
| Base | Mo 6 (Oct 2026) | 4 | 13 | 0.7 |
| Base | Mo 12 (Apr 2027) | 11 | 63 | 3.2 |
| Base | Mo 18 (Oct 2027) | 32 | 303 | 9.6 |
| Base | Mo 24 (Apr 2028) | 96 | 1462 | 28.8 |
| Optimistic | Mo 6 (Oct 2026) | 4 | 14 | 1.4 |
| Optimistic | Mo 12 (Apr 2027) | 19 | 135 | 10.2 |
| Optimistic | Mo 18 (Oct 2027) | 91 | 1253 | 49.1 |
| Optimistic | Mo 24 (Apr 2028) | 439 | 11641 | 236.8 |

Growth rates are model assumptions — defaults: 20% MoM owners, 30% MoM travelers, 0.3 bookings/owner/month. Edit `src/lib/financial-model/data.ts` Section C to tune these. Each owner is assumed to stay active ~24 months (per Section H unit econ). Each booking is ~7 nights × $2,000 avg booking value.

### Q9. What's RAV's cost structure?

Five expense categories, totaling 2 categories with spend today:

- **Legal & Formation:** $2,500/mo today (93% of current burn)
- **Operations & Tools:** $186/mo today (7% of current burn)

Note: Month 1 (May 2026) is heavily weighted toward Legal & Formation due to one-time incorporation costs (DE C-Corp via Stripe Atlas, attorney, trademarks). Once those clear, the steady-state run-rate is **$1,280/mo** and is dominated by Operations & Tools (Vercel, Supabase, AI APIs, IDE subscriptions). For a per-row breakdown of all ~47 expense items, see `/generate-docs --spend-brief` or the `EXPENSES` section in `scripts/financial-model/data.ts`.

### Q10. What are the unit economics — owner LTV, traveler LTV, cohort ramp?

From the financial model's Section H:

- **Average owner lifetime:** 24 months (~4% monthly churn equivalent)
- **Average traveler lifetime:** 18 months
- **Cohort ramp:** new cohorts hit full booking velocity over 3 month(s) (gradual onboarding curve)
- **Voice-overage revenue:** $0.50 per active non-Premium traveler per month (conservative; scales with adoption post-launch)

**Owner LTV** ≈ owner lifetime × bookings/mo × avg booking value × commission rate. At Base scenario assumptions (24mo lifetime × 0.3 bookings/mo × $2,000/booking × 11.1% blended rate) that's ~$1,598 per owner. **Traveler LTV** is harder to pin pre-launch; we'll know better once we have real cohort data (#545 = live actuals overlay).


---

## What this FAQ does NOT cover

- **Detailed P&L** — see the `.xlsx` (regenerate with `npm run financials:build`)
- **Per-month projections** — see `/executive-dashboard/financial-model` web tool
- **Marketplace mechanics + product** — see `/generate-docs --pitch-brief`
- **Compliance / legal posture** — see `docs/payments/PAYSAFE-COMPLIANCE.md`
- **Burn-only summary** — see `/generate-docs --spend-brief`
- **Live actuals vs. forecast** — pending Stage 2b (issue #545)

## Sources

| Source (canonical) | Path | Last commit |
|---|---|---|
| Financial model — all inputs | [`src/lib/financial-model/data.ts`](../../src/lib/financial-model/data.ts) | `ec5cb14` (2026-05-11) — feat(executive): Phase 2 Stage 2a — Financial Model dashboard at /executive-dashboard/financial-model |
| Projection calculator | [`src/lib/financial-model/calc.ts`](../../src/lib/financial-model/calc.ts) | `ec5cb14` (2026-05-11) — feat(executive): Phase 2 Stage 2a — Financial Model dashboard at /executive-dashboard/financial-model |
| Commission constants | [`src/config/commission.ts`](../../src/config/commission.ts) | `86e178d` (2026-05-11) — feat(commission): platform rate 15% → 12%, Business discount 5% → 4% |
| FAQ dump script | [`scripts/financial-model/dump-investor-faq.ts`](../../scripts/financial-model/dump-investor-faq.ts) | _(not tracked or missing)_ |
| Pricing & accounting framework | [`docs/RAV-PRICING-TAXES-ACCOUNTING.md`](../../docs/RAV-PRICING-TAXES-ACCOUNTING.md) | `3a9993d` (2026-05-15) — docs: refresh accounting + add INDEX + features cleanup (Session 68 Part 4 PR1/4) |

## Verification trail

- **Generated by:** `docs/exports/generate_investor_faq.py` (via `npm run docs:gen:investor-faq`, `/generate-docs --investor-faq`, or bundled with `npm run financials:build`)
- **HEAD at snapshot time:** `2e36630`
- **Snapshot date:** May 16, 2026
- **Data dump timestamp:** 2026-05-16T23:25:45.203Z
- **Pre-launch posture:** model month 1 = May 2026 (today = model month 1); all projection numbers are forward-looking until launch (Month 5).

---

_Founder-facing brief for investor conversations. Companion to `RAV-pitch-brief-2026-05-16.md` (narrative) and `RAV-spend-brief-2026-05-16.md` (cost summary)._
