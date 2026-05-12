---
last_updated: "2026-05-12T03:00:00"
change_ref: "manual-edit"
change_type: "session-66"
status: "active"
---

# RAV Compliance Gap Analysis & Priority Plan

**Companion to:** `attorney-meeting-compliance-status.md` + `counsel-meeting-prep.md`
**Audit date:** 2026-05-05 · **Last refreshed:** 2026-05-12 (Session 66 close)
**Status:** **Build-now phase COMPLETE.** All 12 issues that were classified Build-now in the original analysis have shipped end-to-end (code + tests + migrations + PR + merge + DEV+PROD push). Counsel-pending items remain.

---

## Section A — Current state snapshot

### A.1 Tally

| Classification | Original (2026-05-05) | After Session 66 (2026-05-12) |
|---|---|---|
| **Build now** items | 12 (in `*Tier 1 Immediate* through *Tier 2 Pre-Launch*`) | **0 — all shipped** ✅ |
| **Wait for counsel** items | 7 | **7 — unchanged** (need C1, C3, C6, C8 answers before code) |
| **Mixed** items | 5 (build infrastructure, slot in counsel-text later) | **5 — infrastructure shipped**, slots awaiting C4 / C5 / C7 / C9 / C10 / C11 |

### A.2 12 issues filed → 12 issues shipped

| Issue | Subject | Status | PR | Commit |
|---|---|---|---|---|
| #483 | Central disclaimer registry + DisclaimerBlock + 9 placements | ✅ Closed | #495 | `d817eac` |
| #484 | About page (Disclaimer 8.3 placement) | ✅ Closed | #495 | `d817eac` |
| #485 | "No Timeshare Sales" listing validation | ✅ Closed | #496 | `34a8391` |
| #486 | State column on listings (Migration 074) | ✅ Closed | #497 | `c4a1b0d` |
| #487 | FL + CA disclosure rendering | ✅ Closed | #495 (FL wiring) / #497 (state column) | (CA awaits #493) |
| #488 | Marketplace-facilitator registration tracker (Migration 075) | ✅ Closed | #502 | `9386ba8` |
| #489 | Guest Protection Policy product surface | ✅ Closed | #508 | `9259842` |
| #490 | MLA notice + ToS arbitration carve-out (Migration 076) | ✅ Closed | #520 | `53d6a1c` |
| #491 | Listing accuracy reporting (Migration 077) | ✅ Closed | #521 | `ad16f5c` |
| #492 | Fraud reporting (Migration 078) | ✅ Closed | #522 | `a881480` |
| #481 | CC&R attestation (Migration 079) | ✅ Closed | #523 | `6535052` |
| #482 | robots.txt + scraping policy | ✅ Closed | #524 | `621d751` |

Plus PR #500 (`bcce059`) closed the Session-63 migration-CLI-drift cleanup.

### A.3 Counsel-pending follow-up issues (open)

| Issue | Description | Counsel question(s) |
|---|---|---|
| **#493** | Add CA-specific disclosure (8.7-CA) verbatim text | C10 |
| **#494** | Flip disclaimer `reviewedBy` / `reviewedDate` after counsel sign-off across all 9 registry entries | C9 + C11 (if MLA wording revised) |
| **#480** | Umbrella tracker — stays open until #493 + #494 close | — |

### A.4 What remains unbuilt (counsel-input gated)

Per Tier 3 / Wait-for-counsel classification, these items are NOT in the 12-issue build-now scope. They need a counsel answer before scoping.

- **Host-type classification** (Type 1 / 2 / 3 schema + signup capture + thresholds) — awaits **C4**
- **Rental-frequency / commercial-threshold monitoring cron** — depends on host-type schema; awaits **C4** + **C5**
- **State-level licensing gate in FL/CA/HI/NV/AZ** — awaits **C3** + **C5**
- **License-number collection + display** for Type 2 / 3 hosts — awaits **C3**
- **Dedicated Stripe Identity / Persona integration** — awaits **C2**
- **Resort ownership verification** (deed / membership-cert upload + admin review) — awaits **C6**
- **Counsel-drafted full ToS / Privacy / 8 policy docs** at `docs/support/policies/*.md` — awaits **C8**
- **Pay Safe architecture written sign-off** for FL § 721.08 / CA § 10145 / HI § 514E-9 — awaits **C1** (no code change expected)

Engineering scope for each is documented below in Tier 3 (Section D).

---

## Section B — Tier 1 (Immediate) follow-up status

### I-1 — All 8 disclaimers deployed via central registry · **DONE** ✅

**Shipped in:** #495 (PR), commit `d817eac`. Total 9 disclaimers + drift detection + 9 placements + per-disclaimer Vitest tests.

- ✅ `src/lib/disclaimers/registry.ts` — versioned constants for 8.1–8.8 + trademark
- ✅ `<DisclaimerBlock />` component (full / compact / minimal variants)
- ✅ `<StateSpecificDisclaimer />` geo-targeted wrapper
- ✅ `supabase/functions/_shared/disclaimers.ts` email mirror with drift-detection test
- ✅ Placements: homepage, footer, listing pages, Terms § 2 + § 8, About page, Checkout, BookingSuccess, booking-confirmation email
- 🟡 Counsel sign-off pending — #494

### I-2 — Limitation-of-Liability text correction in ToS · **DONE** ✅

**Shipped in:** #495 inside I-1 wave. `Terms.tsx` § 8 replaced with `<DisclaimerBlock id="8.6" />`. The pre-audit generic "intermediary" text is gone (test asserts).

### I-3 — Non-Broker / Non-Agent text in ToS · **DONE** ✅

**Shipped in:** #495 inside I-1 wave. `Terms.tsx` § 2 + new `/about` page both render verbatim Disclaimer 8.3 via the registry.

### I-4 — Pay Safe / Stripe trust-account architecture · **BLOCKED on C1**

**Code state:** ✅ Already deployed. Stripe destination-charge in `process-escrow-release/handler.ts:262-273`. Documented in `docs/payments/PAYSAFE-COMPLIANCE.md`.

**Pending:** Counsel **C1** — written opinion that this satisfies FL § 721.08 / CA § 10145 / HI § 514E-9. No code change expected based on the answer; counsel sign-off pastes into PAYSAFE-COMPLIANCE.md § 7.

### I-5 — "No Timeshare Sales" listing validation · **DONE** ✅

**Shipped in:** #496 (PR), commit `34a8391`.

- ✅ `src/lib/listingValidation/noSales.ts` — 16-phrase block list, case-insensitive, NFKC normalization
- ✅ Wired into `ListProperty.tsx` `handleSubmit`
- ✅ Error message names matched term + field + links to `/about` for context
- 🟡 DB-level enforcement (BEFORE INSERT trigger) deferred — staff approval workflow remains the secondary defense

---

## Section C — Tier 2 (Pre-Launch) follow-up status

### P-1 — State field on `listings` table · **DONE** ✅

**Shipped in:** #497 (PR), commit `c4a1b0d`. Migration 074 + backfill + form wiring.

### P-2 — Florida-Specific Disclosure (8.7) wired · **DONE** ✅

**Shipped in:** #495 (component) + #497 (state field). Renders live on every FL listing + FL checkout.

### P-3 — California-Specific Disclosure · **DONE** (wiring) · **PENDING** (text — C10)

**Shipped in:** #495 (component) + #497 (state field). `STATE_DISCLAIMER_MAP.CA → "8.7-CA"`. Registry entry intentionally absent until counsel returns text. Tracked in #493.

### P-4 — Stripe Tax activation · **BLOCKED on #127 (LLC/EIN)**

**Code state:** ✅ Wired (`create-booking-checkout/handler.ts:247`). Env flag `STRIPE_TAX_ENABLED` default OFF. Flipping to TRUE is a 1-hour ops task once #127 lands.

### P-5 — Marketplace-facilitator registration tracker · **DONE** (schema + admin tab) · **PENDING** (values — C7)

**Shipped in:** #502 (PR), commit `9386ba8`. Migration 075 + `AdminMarketplaceRegistrations` admin tab. 51 jurisdictions seeded. RAV staff + tax-pro fill in `registration_status` per state once **C7** lands.

### P-6, P-7 — Verbatim 8.4 + 8.8 in Checkout + email · **DONE** ✅

Covered by I-1's placement work in #495.

### P-8 — Host identity verification dedicated provider · **BLOCKED on C2**

**Current code state:** Stripe Connect Express KYC for every Host. Dedicated Stripe Identity / Persona not built. Audit recommendation deferred to counsel decision.

### P-9 — Resort ownership verification · **BLOCKED on C6**

**Current code state:** Pre-Booked proof workflow verifies reservation, not ownership. CC&R attestation (P-13's new variant — see #481 below) is shipped; ownership verification (deed / membership cert) awaits **C6**.

### P-10 — Host type classification (Type 1 / 2 / 3) · **BLOCKED on C4**

**Schema design ready.** `profiles.host_type` enum + `properties_owned` + `annual_rentals_planned`. Onboarding question. Self-classification logic. Awaits **C4** thresholds.

### P-11 — License number collection & display · **BLOCKED on C3 + C4**

**Depends on:** Host-type classification (P-10) + the license-applicability answer per state. Mixed scope — build now, slot in state list later.

### P-12 — Guest Protection Policy product surface · **DONE** ✅

**Shipped in:** #508 (PR), commit `9259842`.

- ✅ New `/guest-protection` page with verbatim 8.5 text + Pay Safe / Stripe explainer
- ✅ `<GuestProtectionBadge />` (badge + banner variants) on PropertyDetail + Checkout + Footer + FAQ
- ✅ Underlying refund logic was already shipped; this added the consumer-facing surface

### P-13 — MLA Notice + ToS arbitration carve-out · **DONE** ✅

**Shipped in:** #520 (PR), commit `53d6a1c`. Migration 076 + signup checkbox + `<MLANotice />` + Terms § 9 carve-out paragraph. Universal protection regardless of self-disclosure (Steines v. Westgate Palace).

- 🟡 Counsel wording confirmation pending — **C11**

### P-14 — Listing accuracy reporting · **DONE** ✅

**Shipped in:** #521 (PR), commit `ad16f5c`. Migration 077 + `<ListingAccuracyReportDialog />` + `AdminListingAccuracyReports` admin tab. Anonymous submissions allowed. RLS gates impersonation.

### P-15 — Fraud reporting + response · **DONE** ✅

**Shipped in:** #522 (PR), commit `a881480`. Migration 078 + `<FraudReportDialog />` (Footer + PropertyDetail) + `AdminFraudReports` senior-admin-only tab. Severity + escalation paths separate from resolution states.

### P-16 — 2026-05-04 review gaps · **DONE** ✅

| Gap | Status | PR |
|---|---|---|
| Trademark / affiliation disclaimer in Footer (gap #1 of 3) | ✅ — migrated from inline to registry | Originally #479; restructured in #495 |
| CC&R / rental-restriction attestation in owner onboarding (gap #2 of 3) | ✅ — Migration 079 + required checkbox | #523 |
| `robots.txt` + scraping policy clause in ToS (gap #3 of 3) | ✅ — explicit allowlist + Terms § 7.1 with CFAA citation | #524 |

---

## Section D — Tier 3 (Post-Launch) status

### PL-1 — Rental frequency monitoring cron · **BLOCKED on C4 + C5**

Cron infrastructure pattern proven via `auto-confirm-checkins` + `sla-monitor` in Migration 073. New cron `compliance-threshold-monitor` would run nightly, flagging Hosts who cross thresholds. ~12h engineering once C4 + C5 land.

### PL-2 — State-level licensing gate · **BLOCKED on C5**

Trivial implementation once gate behavior is decided (hard-block vs soft-warn vs route to manual review).

### PL-3 — Automated tax remittance (TaxJar / Avalara / Puzzle.io) · **DEFERRED**

Engineering ~8-16h, deferred until volume exceeds $5K/mo and #127 lands. Manual remittance until then.

### PL-4 — Cyber-liability + fraud insurance · **OUT OF ENGINEERING SCOPE**

Business / insurance-broker engagement.

### PL-5 — State compliance calendar · **PARTIAL** — augments P-5

`marketplace_registrations.next_return_due` column already exists (Migration 075). Daily-summary email integration (~2h) deferred until C7 fills in values worth surfacing.

### PL-6 — ARDA membership / legislative tracking · **OUT OF ENGINEERING SCOPE**

Trade association engagement.

### PL-7 — Formal legal audit of ToS / Privacy / listing agreement · **BLOCKED on C8**

Eight policy drafts at `docs/support/policies/*.md` (`status: draft`, blocked on #80) await counsel.

---

## Section E — Counsel-pending decision matrix

See `counsel-meeting-prep.md` § 4 for the full Q&A version. Quick reference of code dependencies:

| Counsel question | Engineering follow-up | Estimated effort post-decision |
|---|---|---|
| C1 (Pay Safe sign-off) | Paste opinion into `PAYSAFE-COMPLIANCE.md` § 7 | 30 min, no code |
| C2 (Stripe Identity sufficiency) | If "need dedicated": ~1-2 day integration | 0h (default) or 8-16h |
| C3 (license per state) | If license required: build license-number flow | 0h (exempt) or 5h per state-tier |
| C4 (host-type thresholds) | Set threshold constants; build P-10 schema if not yet built | 6h once decided |
| C5 (gate behavior) | Wire gate in ListProperty.tsx | 3h once decided |
| C6 (ownership proof types) | Build ownership-verification flow | 6-12h |
| C7 (state-by-state values) | RAV staff data entry — no engineering | 0h |
| C8 (policy drafting) | Replace drafts; flip status + push via sync-support-docs.yml | 1-2h (mechanical) |
| C9 (disclaimer approval) | Flip `legalReviewRequired` + fill `reviewedBy`/`reviewedDate` in registry | 1h (PR #494) |
| C10 (CA text) | Add `"8.7-CA"` registry entry | 30 min (PR #493) |
| C11 (MLA wording) | Edit Terms § 9 carve-out paragraph + test | 30 min |
| C12 (legislation prioritization) | Schedule follow-up issues per priority | varies |

---

## Section F — Revision history

| Date | Author | Change |
|---|---|---|
| 2026-05-05 | Claude (Session 66 audit) | Initial gap analysis after 7-domain audit |
| 2026-05-12 | Claude (Session 66 close) | Refreshed to reflect all 12 build-now items shipped; counsel-pending items remain |

*End of document — Version 2.0 — 2026-05-12 (post Session 66)*
