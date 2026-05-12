---
last_updated: "2026-05-12T03:00:00"
change_ref: "manual-edit"
change_type: "session-66"
status: "active"
---

# RAV Compliance Status — Attorney Meeting Document

**Prepared for:** legal counsel review
**Source documents:** *Legal Research Memorandum v3* (`Legal_Dossier_RentAVacation_v3.pdf`) + *RAV Compliance Development Brief v1.0*
**Audit date:** 2026-05-05 · **Last refreshed:** 2026-05-12 (Session 66 close)
**Scope:** `main` branch as deployed to PROD as of commit `621d751`
**Companion docs:** `counsel-meeting-prep.md` (agenda + 12-decision matrix) · `compliance-gap-analysis.md` (Part 4 priority gaps)
**Implemented bar:** code present + at least one test + functionally correct + (for disclaimers) verbatim from Legal Dossier § VIII. **For disclaimers the bar is met today in code; counsel sign-off (#494) flips them from 🟡 to ✅.**

---

## 1. Executive scoreboard — before and after Session 66

| Domain | Audit start (2026-05-05) | After Session 66 (2026-05-12) | Pending counsel |
|---|---|---|---|
| 3.1 Host Onboarding & Credentialing | 0 / 2 / 2 | 1 / 2 / 2 | host type (C4), licensing per state (C3), Stripe Identity (C2), ownership proof (C6) |
| 3.2 Listing Creation & Display | 0 / 1 / 3 | 3 / 0 / 1 | license number display (C3) |
| 3.3 Payment & Escrow | 3 / 0 / 1 | 3 / 1 / 0 | 8.8 text approval (C9), Pay Safe sign-off (C1) |
| 3.4 Tax Collection & Remittance | 0 / 3 / 1 | 1 / 3 / 0 | Stripe Tax activation (post-LLC), state registrations (C7) |
| 3.5 Disclaimer System (8 + trademark) | 0 / 3 / 5 | 0 / 9 / 1 | every row pending counsel text approval (C9, C10) |
| 3.6 Consumer Protection & Guest Safety | 0 / 0 / 4 | 4 / 0 / 0 | MLA carve-out wording (C11), trust-safety SOP (C8) |
| 3.7 Rental Frequency / Threshold Monitoring | 0 / 0 / 7 | 0 / 0 / 7 | host type + thresholds + gate (C4 / C5) — entire domain awaits counsel |
| **Totals** | **3 / 9 / 23** | **12 / 15 / 14** | counsel sign-off flips 12 of the 15 Partial rows → Implemented |

**Format:** Implemented / Partial / Gap.

**Architectural notes:**
- **Pay Safe = Stripe destination-charge model** is in production code today. Migration 068 made the hold period runtime-configurable. RAV never holds Guest funds in a RAV-controlled bank account. Counsel question **C1** seeks written confirmation this satisfies FL § 721.08 / CA B&P § 10145 / HI § 514E-9.
- **5-business-day escrow hold + check-in confirmation** with auto-release via cron (Migrations 068 + 073).
- **Central disclaimer registry** at `src/lib/disclaimers/registry.ts` — single source of truth for all 8 mandated disclaimers + trademark. Drift-detection test against the edge-function mirror.
- **Stripe Tax integration is wired** end-to-end; `STRIPE_TAX_ENABLED` env flag default OFF; activates with LLC/EIN (#127). No engineering work needed.

---

## 2. Part 5 — Two-column compliance status

> **Legend:**
> ✅ Implemented = code + test + counsel-approved
> 🟡 Deployed, counsel-pending = code + test + verbatim text from Legal Dossier § VIII; awaiting counsel sign-off via #494 (most disclaimers); or awaiting a single text fill-in (CA disclosure via #493)
> ⏳ Pending counsel input = engineering blocked on a counsel decision (C1–C12)
> ❌ Gap = not deployed; future scope

### 2.1 Business model & licensing

| # | Legal Requirement | Applicable Authority | RAV Platform Implementation | Status |
|---|---|---|---|---|
| 1 | Platform must not act as real estate broker | FL § 721.20, CA DRE / B&P § 11003.5, NY RPL § 442 | Marketplace-facilitator posture documented (DEC-034). Disclaimer 8.3 (Non-Broker / Non-Agent) deployed to **Terms § 2** + new **/about page** via central registry. No platform negotiation; direct host-to-guest contracting. | 🟡 (text deployed, awaiting C9) + ⏳ (license-applicability C3) |
| 2 | Platform must not facilitate timeshare sales | FL § 721.11, CA B&P § 11003.5 | **`src/lib/listingValidation/noSales.ts`** blocks 16 sale-language phrases (case-insensitive + NFKC normalization). Wired into `ListProperty.tsx` `handleSubmit`. Disclaimer 8.2 deployed to homepage / listing pages / footer. | ✅ + 🟡 (8.2 text pending C9) |
| 3 | License number collection & display for commercial operators | FL § 721.20, CA DRE, HI § 514E, NV NRS 119A, AZ ARS § 32-2197 | Not deployed. Schema + UI await **C3** (does RAV need this at all?) + **C4** (host-type thresholds). | ⏳ |

### 2.2 Payment, escrow, and tax

| # | Legal Requirement | Applicable Authority | RAV Platform Implementation | Status |
|---|---|---|---|---|
| 4 | Fund segregation (no commingling with operating funds) | FL § 721.08, CA B&P § 10145, HI § 514E-9 | **Stripe Connect destination-charge model** — Guest funds enter Stripe's custody, never a RAV-controlled bank account. Verified at `supabase/functions/process-escrow-release/handler.ts:262-273`. Documented in `docs/payments/PAYSAFE-COMPLIANCE.md` (DEC-038, DEC-039). | ✅ (architecture) + ⏳ (written sign-off — C1) |
| 5 | Disbursement timing (after check-in, not before) | FL § 721.08, escrow-licensing avoidance principle | 5-business-day post-checkout hold via `system_settings.escrow_hold_period_days` (Migration 068, runtime-configurable). `auto-confirm-checkins` cron + `confirm-checkin` edge function (Migrations 073, Session 63). Release gated on (checkout + 5 days) AND no open disputes AND no admin hold. | ✅ |
| 6 | Refund processing within 5 business days | UDAP statutes; Guest Protection Policy | `process-cancellation/handler.ts:130-163` issues full refund immediately on Host cancellation via `stripe.refunds.create`. | ✅ |
| 7 | Tax collection & remittance | South Dakota v. Wayfair (2018); ~40 state marketplace-facilitator statutes | **Stripe Tax wired** (`create-booking-checkout/handler.ts:247` `automatic_tax: { enabled: STRIPE_TAX_ENABLED }`). Default OFF; activates with LLC/EIN (#127). `AdminTaxReporting.tsx` tracks monthly collection. **Migration 075** added `marketplace_registrations` admin tab (51 jurisdictions seeded); counsel question **C7** fills values per state. | 🟡 (engine ready, env-flag OFF) + ⏳ (state-by-state fills via C7) |

### 2.3 Required disclaimers (Legal Dossier Section VIII)

| # | Legal Requirement | Applicable Authority | RAV Platform Implementation | Status |
|---|---|---|---|---|
| 8 | Marketplace Disclaimer (8.1) — homepage, footer, all listing pages | All jurisdictions; UDAP / FTC § 5 | Verbatim text from registry rendered at all three locations via `<DisclaimerBlock id="8.1" />`. | 🟡 — counsel approves text via C9 |
| 9 | No Timeshare Sales (8.2) — homepage, listing pages, header/footer | FL § 721.11, CA B&P § 11003.5; FTC v. Carroll (2026) | Deployed verbatim at all four locations. | 🟡 — C9 |
| 10 | Non-Broker / Non-Agent (8.3) — ToS, About page | FL § 721.20, CA DRE, broker-licensing statutes | Deployed verbatim in `Terms.tsx` § 2 + new `/about` page. The pre-fix Terms had wrong generic intermediary text — replaced. | 🟡 — C9 |
| 11 | Tax Disclosure (8.4) — checkout, booking confirmation | All jurisdictions with applicable taxes | Verbatim text replaces the paraphrased pre-audit copy. Deployed at Checkout, BookingSuccess, **and** the booking-confirmation email (via edge-function mirror). | 🟡 — C9 |
| 12 | Cancellation & Refund Policy (8.5) — listing pages, checkout, booking confirmation | All jurisdictions | Deployed verbatim alongside the per-listing `<CancellationPolicyDetail />`. Also surfaced via the Guest Protection Policy product surface (page + badge + Checkout banner). | 🟡 — C9 |
| 13 | Limitation of Liability (8.6) — ToS | All jurisdictions | Verbatim text replaces the pre-audit generic "intermediary" language. 12-month-platform-fee cap; consequential / punitive damages excluded. Deployed in `Terms.tsx` § 8. | 🟡 — C9 |
| 14 | Florida-Specific Disclosure (8.7) — all FL listing pages, FL checkout (geo-targeted) | FL § 721.20 | Migration 074 added `listings.state` column (backfilled). `<StateSpecificDisclaimer propertyState={listing.state} />` renders 8.7 verbatim on every FL listing + FL checkout. | 🟡 — C9 (text), then ✅ |
| 15 | California-Specific Disclosure — all CA listing pages (geo-targeted) | CA DRE, CA B&P § 11003.5 + § 17550 | Wiring complete (`STATE_DISCLAIMER_MAP.CA → "8.7-CA"`). Registry entry intentionally omitted; component returns null until counsel returns verbatim text. Tracked in #493. | ⏳ — C10 |
| 16 | Escrow / Fund-Holding Notice (8.8) — payment flow, checkout, booking confirmation | FL § 721.08, CA § 10145, HI § 514E-9 (advisable everywhere) | Verbatim text deployed at Checkout, BookingSuccess, and the booking-confirmation email. Replaced the pre-audit "PaySafe — funds held in escrow until check-in" badge with the full required text. Substitution: `"Stripe (the 'Pay Safe' service)"` for `[Payment Processor Name]`. | 🟡 — C9 |
| 17 | Trademark / Affiliation Disclaimer | Trademark prudence; brand-owner enforcement risk | Migrated from inline `Footer.tsx` (PR #479 anti-pattern) to the central registry. Now rendered via `<DisclaimerBlock id="trademark" variant="minimal" />`. | 🟡 — C9 |

### 2.4 Consumer protection

| # | Legal Requirement | Applicable Authority | RAV Platform Implementation | Status |
|---|---|---|---|---|
| 18 | Guest Protection Policy (full refund within 5 business days for Host cancellation within 30 days of check-in) | UDAP statutes (all jurisdictions); platform-Guest contract | New `/guest-protection` page + `<GuestProtectionBadge />` (badge + banner variants). Badge on PropertyDetail; banner above Pay button on Checkout; FAQ + Footer links. Underlying refund logic was already shipped — this PR added the consumer-facing surface. | ✅ |
| 19 | Listing accuracy reporting mechanism (pre-booking) | Palmer v. FantaSea Resorts (NJ App. Div. 2025) | Migration 077 created `listing_accuracy_reports` table. `<ListingAccuracyReportDialog />` on PropertyDetail accepts anonymous + authenticated submissions. `AdminListingAccuracyReports` admin queue with Triage dialog + AlertDialog confirmation. RLS: anon INSERT (no impersonation), RAV team read+update, no DELETE. | ✅ |
| 20 | Fraud reporting & response | FTC § 5; wire-fraud statutes; FTC v. Carroll (2026) | Migration 078 created `fraud_reports` table. `<FraudReportDialog />` from Footer + PropertyDetail. `AdminFraudReports` senior-admin-only tab with severity + escalation paths (legal / law enforcement separate from resolution states for audit). Internal-notes column separate from reporter-visible resolution_notes. RLS: anon INSERT, **read restricted to rav_admin/rav_owner ONLY** (stricter than accuracy reports — fraud allegations are sensitive). | ✅ |
| 21 | MLA Notice + arbitration carve-out for active-duty servicemembers | Steines v. Westgate Palace (11th Cir. 2024); 10 U.S.C. § 987 | Migration 076 added `profiles.is_active_duty_military` (optional self-disclosure at signup). `<MLANotice />` conditionally rendered at Checkout when self-disclosed. Terms § 9 contains verbatim MLA carve-out paragraph citing 10 U.S.C. § 987, 32 C.F.R. § 232, and *Steines v. Westgate Palace*. **Protection applies regardless of self-disclosure** — the carve-out is universal. | 🟡 — C11 (wording confirmation) |

### 2.5 Host classification & monitoring

| # | Legal Requirement | Applicable Authority | RAV Platform Implementation | Status |
|---|---|---|---|---|
| 22 | Host type classification (Type 1 / 2 / 3) | FL § 721.20, CA DRE, HI § 514E, NV NRS 119A, AZ ARS § 32-2197 | Not deployed. Awaits counsel **C4** (thresholds). Schema design ready (`profiles.host_type` enum + `properties_owned` + `annual_rentals_planned`). | ⏳ — C4 |
| 23 | Rental frequency monitoring (commercial-threshold flagging) | FL/CA/HI/NV/AZ licensing statutes | Not deployed. Cron infrastructure ready (pattern from `auto-confirm-checkins` / `sla-monitor` in Migration 073). Awaits **C4** thresholds. | ⏳ — C4 |
| 24 | State-level licensing gate (block listing creation in FL/CA/HI/NV/AZ for unlicensed Type 3 Hosts) | FL § 721.20 et al. | Not deployed. Awaits counsel **C5** (hard-block vs soft-warn vs manual review). | ⏳ — C5 |

### 2.6 Identity & ownership verification

| # | Legal Requirement | Applicable Authority | RAV Platform Implementation | Status |
|---|---|---|---|---|
| 25 | Host identity verification (government-issued ID) | Fraud prevention; FTC § 5 | Stripe Connect Express KYC for every Host (`profiles.stripe_charges_enabled`). Manual government-ID upload via `OwnerVerification.tsx`. Dedicated Stripe Identity / Persona not integrated. | 🟡 — C2 (whether Connect KYC is sufficient) |
| 26 | Resort ownership verification (deed / membership-cert) | Fraud prevention; consumer protection | Pre-Booked proof workflow (Migration 064, `ProofVerifyDialog`) verifies a *current reservation*, not *ownership* of the underlying timeshare. **NEW: Migration 079 adds CC&R attestation** — owner attests resort/HOA rules permit renting (recorded as `listings.cc_and_r_attested_at`). Required checkbox in ListProperty. | 🟡 (CC&R attestation deployed) + ⏳ (deed / membership-cert flow awaits C6) |

### 2.7 2026-05-04 brand+ops review gaps (additional rows)

| # | Legal Requirement | Applicable Authority | RAV Platform Implementation | Status |
|---|---|---|---|---|
| 27 | Trademark / affiliation disclaimer in Footer | Trademark prudence | Deployed and migrated to central registry. Row 17 above tracks the actual disclaimer. | 🟡 — covered by C9 |
| 28 | CC&R / rental-restriction attestation in owner onboarding | Compliance prudence; owner contract integrity | Row 26 above. | ✅ |
| 29 | `robots.txt` + scraping policy clause in ToS | Trademark / data-use protection; CFAA notice | `public/robots.txt` with explicit allowlist (Googlebot, Bingbot, DuckDuckBot, BraveBot) + restrictive `User-agent: *`. **Terms § 7.1 Automated Access & Scraping** clause citing 18 U.S.C. § 1030. | ✅ |

---

## 3. Where we need your input (the 12 decisions)

See `counsel-meeting-prep.md` § 4 for the full version. Quick reference:

| # | Decision | Affects audit rows | Priority |
|---|---|---|---|
| **C1** | Pay Safe / Stripe Connect satisfies FL § 721.08 / CA § 10145 / HI § 514E-9? | 4, 5 | **P0** |
| **C2** | Stripe Connect KYC sufficient or need dedicated Stripe Identity? | 25 | P2 |
| **C3** | Real estate / rental broker license required in FL, CA, HI, NV, AZ for rental-only? | 1, 3, 22, 23, 24 | **P0** |
| **C4** | Type 1 / 2 / 3 thresholds correct? | 22, 23 | P1 |
| **C5** | State-level gate behavior — hard-block / soft-warn / manual review? | 24 | P2 |
| **C6** | Acceptable timeshare-ownership proof types per state? | 26 | P2 |
| **C7** | Marketplace-facilitator registration order / state list? | 7 | P3 |
| **C8** | Counsel-draft or review-only for 8 policy drafts? | 1, 10–17, 18 | P3 |
| **C9** | Disclaimer 8.1–8.8 + trademark text approved? | 8–17, 27 | **P0** |
| **C10** | CA-Specific Disclosure (8.7-CA) verbatim text? | 15 | P1 |
| **C11** | MLA carve-out paragraph language confirmed? | 21 | P3 |
| **C12** | Recent legislation prioritization (FL HB 1537, CA AB 2992, HI SB 3090, NV SB 440, NY A 8421, TX HB 3821, IL SB 2294, CO HB 24-1175)? | scope-defining | P3 |

---

## 4. Post-meeting mechanics

Counsel sign-off on each item lands in code as follows:

| Counsel input | Code change |
|---|---|
| **C9** approved as-is | One PR (#494) flips `legalReviewRequired: false`, sets `reviewedBy + reviewedDate` across all 9 registry entries |
| **C9** revisions | Same PR bumps version, edits text in source registry + email mirror (drift test passes), flips fields |
| **C10** CA text returned | One PR (#493) adds `"8.7-CA"` registry entry; `<StateSpecificDisclaimer propertyState="CA" />` starts rendering immediately |
| **C11** MLA wording change | One paragraph edit in `Terms.tsx` § 9 + matching test update |
| **C1** written opinion | Paste into `docs/payments/PAYSAFE-COMPLIANCE.md` § 7 placeholder; **no code change** |
| **C3** license requirements | If license required in one or more of FL/CA/HI/NV/AZ: build the license-number column + Type 2/3 conditional UI (~5h per spec in `compliance-gap-analysis.md` P-11) |
| **C4** thresholds | One commit setting threshold constants; depends on schema from P-10 build |
| **C5** gate behavior | One commit configuring behavior; depends on schema from P-10 + license check from C3 |
| **C6** proof types | New schema + admin review queue (~6h) |
| **C7** state values | RAV staff data-entry in admin tab — no engineering |

---

## 5. Documentation lineage

- `_extracted_legal_dossier.txt` — searchable plaintext mirror of `Legal_Dossier_RentAVacation_v3.pdf`
- `_extracted_compliance_brief.txt` — searchable plaintext mirror of `RAV_Compliance_Brief_for_Claude_Agent.pdf`
- `compliance-gap-analysis.md` (companion) — Part 4 priority gaps with build-now / wait-for-counsel / mixed classifications
- `counsel-meeting-prep.md` (companion) — meeting agenda + 12-decision matrix + post-meeting checklist
- `docs/payments/PAYSAFE-COMPLIANCE.md` — Pay Safe architectural compliance posture (DEC-038, DEC-039); landing zone for counsel sign-off on C1

*End of document — Version 2.0 — 2026-05-12 (post Session 66)*
