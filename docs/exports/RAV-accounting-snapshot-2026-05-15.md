---
last_updated: "2026-05-15T21:33:30"
change_ref: "3a9993d"
change_type: "snapshot-accounting-2026-05-15"
status: "active"
doc_kind: "snapshot"
---

# RAV Accounting Snapshot — May 15, 2026

> Snapshot of the accounting + tax + escrow framework as of `3a9993d` (May 15, 2026).

> **Composite snapshot — read-only.** This file links and quotes from the canonical sources above. It is regenerated on demand by `/generate-docs` and is **not** a source of truth itself. To change anything in this snapshot, edit the canonical source. To refresh, run the relevant `npm run docs:gen:*` script.

---

## 1. Source documents (canonical)

| Source (canonical) | Path | Last commit |
|---|---|---|
| Pricing, taxes, accounting framework | [`docs/RAV-PRICING-TAXES-ACCOUNTING.md`](../../docs/RAV-PRICING-TAXES-ACCOUNTING.md) | `3a9993d` (2026-05-15) — docs: refresh accounting + add INDEX + features cleanup (Session 68 Part 4 PR1/4) |
| PaySafe compliance posture | [`docs/payments/PAYSAFE-COMPLIANCE.md`](../../docs/payments/PAYSAFE-COMPLIANCE.md) | `81f92df` (2026-05-03) — feat(disputes): #464 Gap G SLA targets + alerting + business-hours config |
| PaySafe flow specification | [`docs/payments/PAYSAFE-FLOW-SPEC.md`](../../docs/payments/PAYSAFE-FLOW-SPEC.md) | `a47f6c1` (2026-05-14) — docs: align 28 docs across /docs and subfolders with DEC-041 commission rates (12/10/8%) and #510 runtime architecture |
| Financial model index | [`docs/financials/README.md`](../../docs/financials/README.md) | `3a9993d` (2026-05-15) — docs: refresh accounting + add INDEX + features cleanup (Session 68 Part 4 PR1/4) |
| Pricing utilities (code) | [`src/lib/pricing.ts`](../../src/lib/pricing.ts) | `74c4730` (2026-05-13) — feat(commission): #510 runtime architecture — DB-first read, admin UI, audit log, async edge helper |
| Commission constants (code) | [`src/config/commission.ts`](../../src/config/commission.ts) | `86e178d` (2026-05-11) — feat(commission): platform rate 15% → 12%, Business discount 5% → 4% |
| Commission rate runtime hook | [`src/hooks/useCommissionRate.ts`](../../src/hooks/useCommissionRate.ts) | `74c4730` (2026-05-13) — feat(commission): #510 runtime architecture — DB-first read, admin UI, audit log, async edge helper |
| Commission edge fn helper | [`supabase/functions/_shared/commission.ts`](../../supabase/functions/_shared/commission.ts) | `5ab5a4a` (2026-05-14) — fix(lint): #510 follow-up — replace `any` in edge commission helper + close useCallback dep gap |
| Cancellation policy refund math | [`src/lib/cancellationPolicy.ts`](../../src/lib/cancellationPolicy.ts) | `19b531f` (2026-03-03) — feat(ux): human-readable cancellation policy with refund details (#159) |

## 2. Snapshot of canonical-doc state

- **Version:** 2.3 — Status corrections (subscription billing live in PROD; financial model web dashboard shipped); content from v2.2 unchanged
- **Frontmatter `last_updated`:** 2026-04-05T03:03:26
- **Frontmatter `change_type`:** session-67
- **See full doc:** [`docs/RAV-PRICING-TAXES-ACCOUNTING.md`](../RAV-PRICING-TAXES-ACCOUNTING.md)

## 3. Live commission constants (extracted from `src/config/commission.ts`)

| Constant | Value (live at snapshot time) | Effective rate |
|---|---|---|
| `DEFAULT_COMMISSION.base` | 12% | Free owner: **12%** |
| `DEFAULT_COMMISSION.proDiscount` | 2% pp off base | Pro owner: derived |
| `DEFAULT_COMMISSION.businessDiscount` | 4% pp off base | Business owner: derived |

_Runtime override: admins can change the live rate via `system_settings.platform_commission_rate` (read by `useCommissionRate()` hook + `getCommissionRate()` edge fn helper). Each booking persists `commission_rate_applied` so historical accounting is preserved (see DEC-043 below)._

## 4. Decision excerpts (filtered to accounting topics)

DEC entries pulled from `docs/PROJECT-HUB.md` at snapshot time.

<details><summary><b>DEC-022</b> — extracted from PROJECT-HUB.md</summary>


### DEC-022: Pricing, Tax & Accounting Framework
**Date:** February 21, 2026
**Date Updated:** February 28, 2026
**Decision:** Per-night pricing + separated fee line items + Stripe Tax before launch + Puzzle.io post-launch (pluggable)
**Status:** Approved (Updated — Puzzle.io replaces QuickBooks)
**Docs:** `docs/RAV-PRICING-TAXES-ACCOUNTING.md`

**Context:** Platform uses per-night pricing with itemized fee breakdown. As a marketplace facilitator in 43+ US states, RAV must collect and remit occupancy/sales taxes before going live. Accounting tool re-evaluated Feb 28 — Puzzle.io selected over QuickBooks for native Stripe integration, free tier, and automated revenue recognition (ASC 606).

**Key decisions:**
- Per-night rate (`nightly_rate`) is the atomic pricing unit across the platform ✅
- Fee breakdown: separate `service_fee`, `cleaning_fee`, `tax_amount` line items on every booking ✅
- Stripe Tax for automated tax calculation at checkout (code ready, pending #127) 🟡
- **Puzzle.io** as general ledger (replaces QuickBooks) — native Stripe sync, free <$20K/mo, automated revenue recognition
- **Pluggable accounting architecture** — provider-agnostic adapter pattern; can swap to QuickBooks/Xero/Zoho via config
- 1099-K handled natively by **Stripe Connect** ($2.99/form) — no Gusto needed
- Resort fees are owner-disclosed, not RAV-collected (paid at resort check-in)
- Stripe processing fees (~2.9%) absorbed by RAV, baked into 15% service fee margin


</details>

<details><summary><b>DEC-038</b> — extracted from PROJECT-HUB.md</summary>


### DEC-038: PaySafe Flow Specification — Authoritative Internal Doc for Money Movement
**Date:** April 27–28, 2026 (Session 61, PR #460)
**Decision:** `docs/payments/PAYSAFE-FLOW-SPEC.md` is the **authoritative internal specification** of how money moves through the marketplace — escrow lifecycle, auto-release rules, dispute system (categories, status, authority, SLAs), check-in confirmation, and the state-specific regulatory landscape. When this spec and the code disagree, **the code wins** — open a PR to update the spec.

**Rationale:**
1. **Onboarding new contributors and counsel.** The escrow + dispute paths cross 5 edge functions, 3 migrations, 2 archived starter migrations, and a Stripe Connect destination-charge model. New engineers (and lawyer doing #80 review) need one document that wires it all together.
2. **Gap inventory + tracking.** The spec catalogues 9 known gaps (A–I) — each filed as a discrete GitHub issue (#461–#469) with priority, dependencies, and acceptance criteria. Future PRs that close a gap update the spec to remove that row.
3. **Regulatory pre-launch surface.** §7 captures the timeshare + state-specific rules RAV operates under (FL Ch. 721, HI TAT, TN STR ordinances, CA / NY consumer-protection overrides). Counsel reviews the spec section, not scattered code comments.
4. **Boundary with public docs.** Internal spec ↔ public-facing policies (`docs/support/policies/payment-policy.md`, `cancellation-policy.md`) are now explicitly distinguished. The public docs stay user-readable; the spec stays implementation-grounded.

**Issue tracking:**
- **Pre-launch (Launch Readiness milestone):** #461 (Gap A — confirm-checkin server action), #462 (Gap B — auto-confirm cron), #464 (Gap G — SLA enforcement), #465 (Gap H — Stripe chargeback auto-mirror), #466 (Gap I — jurisdiction field, linked to #80)
- **Pre-launch (Security Hardening milestone):** #463 (Gap E — per-category role mapping in schema/RLS)
- **Post-launch:** #467 (Gap C — issue → dispute pre-fill), #468 (Gap D — HOLD_PERIOD_DAYS to system_settings), #469 (Gap F — split refunds + holdbacks + credits + fee waivers)

**Cross-links:**
- Spec at `docs/payments/PAYSAFE-FLOW-SPEC.md` — frontmatter `change_type: session-61-paysafe-spec-v1`
- Public-facing payment policy at `docs/support/policies/payment-policy.md` (status: draft, blocked on #80)
- Cancellation policy at `docs/support/policies/cancellation-policy.md`
- Canonical refund-tier rules at `src/lib/cancellationPolicy.ts`

**Status:** Active. Spec is the long-running source of truth. Future revisions land via PR with a revision-history row entry; closing a gap issue requires a corresponding spec update to remove the row from §9.


</details>

<details><summary><b>DEC-039</b> — extracted from PROJECT-HUB.md</summary>


### DEC-039: PaySafe Compliance Posture Doc + Tier B Promotion of Gaps C & D
**Date:** May 2, 2026 (Session 63)
**Decision:** Create a new doc `docs/payments/PAYSAFE-COMPLIANCE.md` that captures *why* the marketplace + Stripe Connect (destination-charge) architecture keeps RAV out of money-transmission compliance scope, what RAV remains accountable for, and a gap-closure register linking each PaySafe gap to its issue + status. The doc is the landing zone for incoming legal/statutory references the user will share separately. Concurrently promote **#467 (Gap C)** and **#468 (Gap D)** from Tier E (post-launch) to Tier B (pre-launch) per user stance: minimal post-launch deferral.

**Rationale:**
1. **Counsel handoff surface.** When #80 lawyer review begins, counsel needs one document that explains the legal model — not a spec full of state machines and migration paths. PAYSAFE-FLOW-SPEC describes *what the system does*; this new doc describes *the legal posture under which it operates*.
2. **Recurring questions deserve a durable answer.** "Are we an MSB?" / "Do we need licenses?" / "What does Stripe own legally?" recur across founder, engineering, and counsel conversations. Captured once in §§3–4 of the new doc.
3. **Future legal references need a home.** The user has indicated they will share specific statutes / regulations. §7 of the new doc is a structured placeholder per-jurisdiction with a per-statute template (citation → what it requires → how RAV is compliant → counsel guidance).
4. **Tier B promotion of C/D.** With incorporation about to unblock and a public-traffic phase imminent, deferring #467 (issue→dispute pre-fill) and #468 (HOLD_PERIOD_DAYS to system_settings) post-launch is no longer worth the operational friction. Both are small (~half-day each).

**What changes:**
- New doc: `docs/payments/PAYSAFE-COMPLIANCE.md`
- `docs/PRIORITY-ROADMAP.md` — #467 + #468 Tier E → Tier B; #463 consolidated under Tier B (was duplicated); revision-history entry
- `scripts/source-doc-map.json` — payment edge fns + cancellation lib mapped to both PAYSAFE-FLOW-SPEC + PAYSAFE-COMPLIANCE
- Session 63 work plan: 7 of 9 PaySafe gaps queued (A, B, C, D, E, G, H) + bug fix #473. F deferred (user-confirmed manual workaround for first ~10 cases). I gated on #80.

**Status:** Active. Compliance doc is now part of the docs-audit + sync-check pipeline. Gap closure register (§6) is updated by every PR that closes a gap; revision history (§9) gets a row per session that touches the doc.


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

## 5. Open follow-up issues (live from GitHub)

| # | Title | Labels | Milestone |
|---|---|---|---|
| [#127](https://github.com/rent-a-vacation/rav-website/issues/127) | Business Formation & Stripe Tax Activation | platform, pre-launch, blocked, needs-decision | _unscheduled_ |
| [#63](https://github.com/rent-a-vacation/rav-website/issues/63) | Phase 20E: Accounting Integration (Puzzle.io → pluggable) | enhancement, platform, post-launch, blocked | Phase 20: Accounting & Tax |
| [#65](https://github.com/rent-a-vacation/rav-website/issues/65) | Phase 20F: Automated Tax Filing | enhancement, platform, post-launch | Phase 20: Accounting & Tax |
| [#509](https://github.com/rent-a-vacation/rav-website/issues/509) | Promotional commission rate overrides — launch specials, seasonal campaigns, owner-tier promos | enhancement, marketplace, platform, pre-launch, needs-decision | Launch Readiness |
| [#531](https://github.com/rent-a-vacation/rav-website/issues/531) | Admin-configurable subscription tier prices (membership_tiers admin UI — Lean MVP) | enhancement, platform, pre-launch | Launch Readiness |
| [#532](https://github.com/rent-a-vacation/rav-website/issues/532) | Subscription pricing — full scope: auto Stripe Price creation + grandfathering + version history + annual | enhancement, platform, post-launch | Launch Readiness |

## 6. Verification trail

- **Snapshot generated by:** `docs/exports/generate_accounting.py` (run via `npm run docs:gen:accounting` or `/generate-docs --accounting`)
- **HEAD at snapshot time:** `3a9993d`
- **Snapshot date:** May 15, 2026
- **No duplication of canonical content** — every fact in this snapshot is either (a) a link to a canonical doc, (b) a quote from a canonical doc, or (c) a value extracted live from code. To change anything, edit the canonical source and regenerate.

---

*Composite snapshot. RAV Accounting framework. Generated May 15, 2026. See `docs/INDEX.md` for navigation.*
