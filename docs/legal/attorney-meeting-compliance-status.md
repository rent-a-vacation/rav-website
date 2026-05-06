---
last_updated: "2026-05-05T00:00:00"
change_ref: "manual-edit"
change_type: "compliance-audit-2026-05-05"
status: "active"
---

# RAV Compliance Status — Attorney Meeting Document

**Prepared for:** legal counsel review
**Source documents:** *Legal Research Memorandum v3* (`Legal_Dossier_RentAVacation_v3.pdf`) + *RAV Compliance Development Brief v1.0* (`RAV_Compliance_Brief_for_Claude_Agent.pdf`)
**Audit date:** 2026-05-05
**Audit scope:** `dev` branch (the branch we ship from), Sessions 33–63
**Audit method:** Seven parallel codebase subagents — one per Part 3 domain — cross-referenced against `docs/PROJECT-HUB.md`, `docs/COMPLETED-PHASES.md`, `docs/PRIORITY-ROADMAP.md`, `docs/LAUNCH-READINESS.md`, `docs/PLATFORM-INVENTORY.md`, `docs/payments/PAYSAFE-COMPLIANCE.md`, `docs/payments/PAYSAFE-FLOW-SPEC.md`, and current GitHub Issues
**Implemented bar:** code present + at least one test + functionally correct + (for disclaimer text) verbatim from Legal Dossier Section VIII. Anything weaker = **Partial**. Anything missing = **Gap**.

---

## 1. Executive scoreboard

| Domain | Implemented | Partial | Gap |
|---|---|---|---|
| 3.1 Host Onboarding & Credentialing | 0 | 2 | 2 |
| 3.2 Listing Creation & Display | 0 | 1 | 3 |
| 3.3 Payment & Escrow | 3 | 0 | 1 |
| 3.4 Tax Collection & Remittance | 0 | 3 | 1 |
| 3.5 Disclaimer System (8 disclaimers) | 0 | 3 | 5 |
| 3.6 Consumer Protection & Guest Safety | 0 | 0 | 4 |
| 3.7 Rental Frequency / Threshold Monitoring | 0 | 0 | 7 |
| **Totals** | **3** | **9** | **23** |

**Architectural strengths counsel should note:**
- **Pay Safe = Stripe destination-charge model** is already in production code (`process-escrow-release/handler.ts:262–273`, `create-stripe-payout/handler.ts:156`). RAV never holds Guest funds in a RAV-controlled bank account — funds sit in Stripe's custody from charge through transfer-to-Host. This is the architecture explicitly designed to avoid the trust-account licensing burden in FL § 721.08, CA B&P § 10145, and HI § 514E-9. Documented in `docs/payments/PAYSAFE-COMPLIANCE.md` and `docs/payments/PAYSAFE-FLOW-SPEC.md` (DEC-038, DEC-039).
- **5-day post-checkout escrow hold + check-in confirmation** is implemented via configurable `system_settings.escrow_hold_period_days` (Migration 068) plus the `auto-confirm-checkins` cron (Session 63 closed 7 of 9 PaySafe gaps).
- **Stripe Tax integration is wired** end-to-end behind the `STRIPE_TAX_ENABLED` env flag (`create-booking-checkout/handler.ts:247`); activation is gated only on issue #127 (LLC/EIN formation), not on engineering work.
- **Stripe Connect Express KYC** runs for every Host (`owner_verifications.kyc_verified`), but counsel should advise whether this satisfies the platform-level identity-verification requirement or whether dedicated Stripe Identity / Persona is needed in addition.

**Highest-risk findings counsel should address first:**
1. **0 of 8 mandated disclaimers** are Implemented. 5 are entirely missing from UI; 3 are present but non-verbatim or incomplete. There is no central disclaimer registry — current disclaimers (e.g., trademark/affiliation in `Footer.tsx`, PR #479) are inline.
2. **No "no timeshare sales" enforcement** on listing creation — no keyword validation on title/description, no server-side check.
3. **No state field on the `listings` table**, so geo-targeted FL/CA disclosures (Disclaimers 8.7 + CA equivalent) are architecturally impossible today.
4. **No MLA notice or arbitration carve-out** for active-duty servicemembers (zero matches for "Military Lending"/"servicemember"/"active duty"/"10 U.S.C. § 987" anywhere in the codebase, including Terms of Service).
5. **Limitation-of-liability text in Terms of Service is wrong** — current `Terms.tsx:115–122` says "we are not responsible…" generic intermediary language. Legal Dossier 8.6 requires a 12-month-platform-fee cap with no consequential/punitive damages.
6. **No host-type classification** (Type 1 Casual / Type 2 Multi-Property / Type 3 Commercial) — the architecture for differentiating casual owners from commercial operators does not exist; therefore no license-collection workflow, no commercial-threshold flagging, no state-level licensing gate for FL/CA/HI/NV/AZ.

---

## 2. Part 5 — Two-column compliance status

> **Legend:**
> ✅ Implemented = code + test + correct + (for disclaimers) verbatim
> 🟡 Partial = code present but missing tests, partial coverage, paraphrased text, or inline (not centrally managed)
> ❌ Gap = absent

### 2.1 Business model & licensing

| # | Legal Requirement | Applicable Authority | RAV Platform Implementation | Status |
|---|---|---|---|---|
| 1 | Platform must not act as real estate broker | FL § 721.20, CA DRE / B&P § 11003.5, NY RPL § 442, most state broker-licensing statutes | DEC-034 establishes "marketplace facilitator" posture in code/docs. Platform never negotiates terms; Hosts and Guests contract directly. **However**, current `Terms.tsx:115–122` (Section 8) does not contain the verbatim Disclaimer 8.3 non-broker / non-agent language; the language present is a generic "intermediary" line. No `About.tsx` page exists in the codebase. | 🟡 Partial — posture is correct in architecture but **not in disclaimer text**; needs Disclaimer 8.3 placed verbatim in ToS + new About page. |
| 2 | Platform must not facilitate timeshare sales | FL § 721.11, CA B&P § 11003.5 | No validation on `ListProperty.tsx` or any listing-creation edge function rejecting sale-language listings. No keyword filter for "for sale" / "deed transfer" / "ownership transfer" / "buy my timeshare". Disclaimer 8.2 ("No Timeshare Sales") is **absent everywhere** (homepage, listing pages, header/footer). | ❌ Gap |
| 3 | License number collection & display for commercial operators | FL § 721.20, CA DRE, HI § 514E, NV NRS 119A, AZ ARS § 32-2197 | No `host_type`, `license_number`, `license_state`, or `license_verified_at` columns on `profiles` table. No conditional UI in `ListProperty.tsx` for license collection. No display of license on `PropertyDetail.tsx` or `OwnerProfileCard.tsx`. | ❌ Gap (depends on host-type classification — row 13) |

### 2.2 Payment, escrow, and tax

| # | Legal Requirement | Applicable Authority | RAV Platform Implementation | Status |
|---|---|---|---|---|
| 4 | Fund segregation (no commingling with operating funds) | FL § 721.08, CA B&P § 10145, HI § 514E-9 | **Stripe Connect destination-charge model** — Guest funds enter Stripe's custody and never land in a RAV-controlled bank account. Verified in `process-escrow-release/handler.ts:262–273` and `create-stripe-payout/handler.ts:156`. Architecture documented in `docs/payments/PAYSAFE-FLOW-SPEC.md` (DEC-038) and defended in `docs/payments/PAYSAFE-COMPLIANCE.md` (DEC-039). Test coverage: `process-escrow-release/handler.test.ts:199–228`, `verify-booking-payment/handler.test.ts:69–83`. | ✅ Implemented (counsel should confirm this satisfies FL § 721.08 / CA § 10145 / HI § 514E-9 in writing) |
| 5 | Disbursement timing (after check-in, not before) | FL § 721.08, escrow-licensing avoidance principle | 5-business-day post-checkout hold via `system_settings.escrow_hold_period_days = 5` (Migration 068, configurable). `auto-confirm-checkins` cron + `confirm-checkin` edge function (Session 63, Gaps A & B closed). Release gated on (checkout + 5 days) AND no open disputes AND no admin hold. Tests: `process-escrow-release/handler.test.ts:70–117, 167–197, 262–299`. | ✅ Implemented |
| 6 | Refund processing within 5 business days | Guest Protection Policy commitment + UDAP statutes | `process-cancellation/handler.ts:130–163` (full refund issued immediately on Host cancellation) and `process-dispute-refund/index.ts:101–120` (Stripe `refunds.create` on dispute resolution). Stripe processes within 5–10 business days per card-network rules. | ✅ Implemented |
| 7 | Tax collection & remittance | South Dakota v. Wayfair (2018); ~40+ state marketplace-facilitator statutes | Stripe Tax integration wired (`create-booking-checkout/handler.ts:247` `automatic_tax: { enabled: STRIPE_TAX_ENABLED }`), tax codes set (`txcd_99999999` lodging, `txcd_10000000` service), `tax_amount` line item per DEC-022. **Default OFF** in DEV+PROD, blocked on issue #127 (LLC/EIN). `AdminTaxReporting.tsx` tracks monthly collection. | 🟡 Partial — engine ready, activation blocked on business formation; **no admin field tracking marketplace-facilitator state-by-state registration status**; no automated remittance (manual until Avalara/Puzzle.io integration, #63 / #65, both blocked on #127) |

### 2.3 Required disclaimers (Legal Dossier Section VIII)

| # | Legal Requirement | Applicable Authority | RAV Platform Implementation | Status |
|---|---|---|---|---|
| 8 | Marketplace Disclaimer (8.1) — homepage, footer, all listing pages | All jurisdictions; UDAP / FTC § 5 | **Not present in any of the three required locations.** No central disclaimer registry exists. | ❌ Gap |
| 9 | No Timeshare Sales Disclaimer (8.2) — homepage, all listing pages, header/footer | FL § 721.11, CA B&P § 11003.5; FTC v. Carroll (2026) enforcement context | **Not present in any of the four required locations.** | ❌ Gap |
| 10 | Non-Broker / Non-Agent Disclaimer (8.3) — ToS, About page | FL § 721.20, CA DRE, broker-licensing statutes | `Terms.tsx:115–122` Section 8 contains generic "intermediary" wording — not the verbatim non-broker / non-agent text from Section VIII. No `About.tsx` page exists. | ❌ Gap (text is wrong, About page doesn't exist) |
| 11 | Tax Disclosure (8.4) — checkout, booking confirmation | All jurisdictions with applicable taxes | `Checkout.tsx:366–384` displays a paraphrased disclosure: *"Applicable occupancy taxes and transient lodging taxes for [state] will be calculated and collected at payment. Rent-A-Vacation collects and remits taxes as a marketplace facilitator where required by law."* — missing "included in the total price" and "on behalf of Hosts". Not in `BookingSuccess.tsx` or booking-confirmation email. | 🟡 Partial — present in 1 of 3 locations and **not verbatim** |
| 12 | Cancellation & Refund Policy (8.5) — listing pages, checkout, booking confirmation | All jurisdictions | `<CancellationPolicyDetail />` renders **per-listing** policy on `PropertyDetail.tsx` and `Checkout.tsx:417–422`. **Platform-level disclaimer text** (the Section VIII 8.5 paragraph stating policies vary, RAV fee is non-refundable except for Host cancellation/fraud, and full refund within 5 business days for Host cancellation) is **not present** anywhere. Not in `BookingSuccess.tsx` or booking-confirmation email. | 🟡 Partial — per-listing policy yes, **platform-level policy text no** |
| 13 | Limitation of Liability (8.6) — ToS | All jurisdictions | `Terms.tsx:115–122` text is **wrong** — it's generic intermediary language, not the 12-month platform-fee cap with exclusion of indirect/incidental/special/consequential/punitive damages required by Section VIII 8.6. | ❌ Gap (wrong text) |
| 14 | Florida-Specific Disclosure (8.7) — all FL listing pages, FL checkout (geo-targeted) | FL § 721.20 | **Not present.** The `listings` table has no `state` / `jurisdiction` column, so geo-targeted rendering is architecturally impossible today. Issue #466 ("PaySafe Gap I — jurisdiction field on bookings + per-state disclosure logic") tracks this work but is Tier B and blocked on #80. | ❌ Gap |
| 15 | California-Specific Disclosure — all CA listing pages (geo-targeted) | CA DRE, CA B&P § 11003.5 | Same as 8.7 — no state field on listings; no CA-specific text drafted; same blockers (#466, #80). | ❌ Gap |
| 16 | Escrow / Fund-Holding Notice (8.8) — payment flow, checkout, booking confirmation | FL § 721.08, CA § 10145, HI § 514E-9 (advisable everywhere) | `Checkout.tsx:317` shows only a trust badge: *"PaySafe — funds held in escrow until check-in"*. The required Section VIII 8.8 paragraph ("…processed by Stripe, a licensed payment processor… segregated account… not commingled… does not act as an escrow agent…") is **not present anywhere**. Not in `BookingSuccess.tsx` or booking-confirmation email. | 🟡 Partial — concept gestured at, full text absent |
| 17 | Trademark / Affiliation Disclaimer (RAV-specific, 9th disclaimer beyond Legal Dossier) | Trademark prudence; brand-owner enforcement risk | Present in `Footer.tsx` per PR #479 (commit `97bee70`) — names Hilton/Marriott/Disney/Wyndham/Bluegreen/Hyatt/Holiday Inn Club/WorldMark and declares "independent secondary marketplace, not affiliated with…". **Inline, not centrally managed.** | 🟡 Partial — text correct, but architecturally an anti-pattern (inline) |

### 2.4 Consumer protection

| # | Legal Requirement | Applicable Authority | RAV Platform Implementation | Status |
|---|---|---|---|---|
| 18 | Guest Protection Policy (full refund within 5 business days for Host cancellation within 30 days of check-in) — displayed on listing + checkout | UDAP statutes (all jurisdictions); platform-Guest contract | `docs/support/policies/refund-policy.md` documents the policy (lines 20–30, 109–116) and the underlying refund logic exists in `process-cancellation/handler.ts`. **No Guest-Protection-Policy product surface** (no badge / banner / dedicated page) on `PropertyDetail.tsx` or `Checkout.tsx`. The protection is real in code; the consumer-facing promise is not surfaced. | ❌ Gap (logic Implemented, surface absent) |
| 19 | Listing accuracy reporting mechanism (pre-booking) | Palmer v. FantaSea Resorts (NJ App. Div. 2025) | **No "Report Inaccuracy" / "Report Listing" CTA on `PropertyDetail.tsx`.** The existing `ReportIssueDialog` requires a `bookingId` (post-booking only). Pre-booking accuracy complaints have no intake. | ❌ Gap |
| 20 | Fraud reporting & response | FTC § 5; wire-fraud statutes; FTC v. Carroll (2026) | No "Report Fraud" CTA. No `suspected_fraud` or `fraud` value in `dispute_category` enum (`database.ts:2405–2413`). No fraud-specific admin queue or escalation path documented in code. | ❌ Gap |
| 21 | MLA Notice + arbitration carve-out for active-duty servicemembers | Steines v. Westgate Palace (11th Cir. 2024); 10 U.S.C. § 987 | Zero matches across the codebase for "Military Lending" / "MLA" / "active duty" / "servicemember" / "10 U.S.C. § 987". `Terms.tsx:131` mentions "binding arbitration" with **no MLA carve-out**. No checkbox at signup or checkout. | ❌ Gap |

### 2.5 Host classification & monitoring

| # | Legal Requirement | Applicable Authority | RAV Platform Implementation | Status |
|---|---|---|---|---|
| 22 | Host type classification (Type 1 Casual / Type 2 Multi-Property / Type 3 Commercial) | FL § 721.20, CA DRE, HI § 514E, NV NRS 119A, AZ ARS § 32-2197 — drives whether a Host needs a real estate / rental license | No `host_type` column on `profiles`. Onboarding (`SignUp.tsx`) only distinguishes `property_owner` vs `renter` role; no questions about properties owned or rental frequency. `owner_verifications.trust_level` is trust-based, not host-type-based. Membership tiers (Owner Pro / Owner Business) are subscription products, not host-type classifications. | ❌ Gap |
| 23 | Rental frequency monitoring (commercial-threshold flagging — Type 1 > 6 listings/yr; Type 2 > 12 units/yr; Type 3 in FL/CA/HI/NV/AZ blocked without license) | FL/CA/HI/NV/AZ licensing statutes | No `compliance_status` field on `profiles`. No nightly cron flagging Hosts at thresholds. Cron infrastructure exists (Migration 073: `auto-confirm-checkins`, `sla-monitor`) — pattern is reusable. `successful_stays` / `total_bookings` exist on `owner_verifications` (trust system), not disaggregated by 12-month window. | ❌ Gap (entire domain absent; building blocks present) |
| 24 | State-level licensing gate (block listing creation in FL/CA/HI/NV/AZ for unlicensed Type 3 Hosts) | FL § 721.20, CA DRE, HI § 514E, NV NRS 119A, AZ ARS § 32-2197 | No state-based blocking logic in `ListProperty.tsx`. No state field on listings (depends on row 14 fix). | ❌ Gap |

### 2.6 Identity & ownership verification

| # | Legal Requirement | Applicable Authority | RAV Platform Implementation | Status |
|---|---|---|---|---|
| 25 | Host identity verification (government-issued ID) | Fraud prevention; FTC § 5 | Stripe Connect Express KYC runs for every Host (`create-connect-account/handler.ts:79–89`). `owner_verifications.kyc_verified`, `kyc_provider`, `kyc_reference_id` columns exist (`src/types/database.ts:1126–1187`). `OwnerVerification.tsx` allows manual government-ID upload (line 56). **No dedicated Stripe Identity / Persona integration**; manual upload has no automated verification or listing-creation gate. Counsel should advise whether Stripe Connect KYC alone satisfies the platform-level identity-verification requirement. | 🟡 Partial — Stripe Connect KYC yes; dedicated Identity provider no; listing-creation gate no |
| 26 | Resort ownership verification (proves Host actually owns the timeshare interest) | Fraud prevention; consumer protection | The **Pre-Booked proof workflow** (Migration 064, `ProofVerifyDialog`, `listing-proofs` bucket) verifies a *current reservation/booking confirmation* — **not** ownership of the underlying timeshare interest. No deed / membership-cert / points-statement upload. No resort-API integration. | 🟡 Partial — reservation proof yes; **timeshare-ownership proof no** |

---

## 3. Architectural recommendations folded into the audit

### 3.1 Disclaimer registry (architecture is itself a compliance requirement)

Compliance Brief Section 3.5 requires disclaimers to be "centrally managed so that when legal counsel recommends changes to disclaimer language, a single update propagates to all locations." Today, the only deployed disclaimer (PR #479 trademark/affiliation) is hardcoded inline in `Footer.tsx`. The proposed architecture:

- `src/lib/disclaimers/registry.ts` exporting versioned constants for all 8 (+1 trademark) disclaimers, each with `text`, `version`, `lastUpdated`, `legalReviewRequired`, `reviewedBy`, `reviewedDate`, `requiredLocations[]`
- `<DisclaimerBlock id="8.X" variant="full|compact|minimal" />` React component pulling from the registry
- Optional `<FloridaDisclaimerBlock propertyState={...} />` wrapper that renders 8.7 only when `propertyState === 'FL'`
- Mirror in `supabase/functions/_shared/disclaimers.ts` for booking-confirmation emails
- Once counsel sign-off is in hand on the `legal_review_required` policy docs (`docs/support/policies/*.md`, blocked on #80), promote the registry from "self-authored verbatim from Legal Dossier v3" to "counsel-reviewed v1.0"

This architecture must exist before any of disclaimer rows 8–17 above can be marked Implemented.

### 3.2 Stripe Pay Safe — counsel sign-off needed in writing

The Pay Safe / Stripe destination-charge architecture (rows 4 + 5 above) is the single most consequential compliance choice in the platform. RAV truthfully does not hold consumer funds. **Counsel should provide a written opinion** that this architecture satisfies FL § 721.08, CA B&P § 10145, and HI § 514E-9 escrow / trust-account requirements — and that no separate escrow license is required for RAV. This opinion belongs in the `docs/payments/PAYSAFE-COMPLIANCE.md` "Counsel Sign-off" section (currently a structured placeholder).

### 3.3 Marketplace facilitator registration

A separate operational workstream (not pure code): RAV must register as a marketplace facilitator in 40+ states with applicable lodging/sales taxes. Pre-launch admin work; engineering deliverable is a small admin tab tracking registration status per jurisdiction. Counsel + tax-pro should confirm the list and the order.

---

## 4. What we will build before counsel meeting (build-now)

The following items are **unambiguous code work** based on verbatim Legal Dossier Section VIII text and the founder's go-ahead. They are scheduled to ship with tests on the `dev` branch this week so the next revision of this dossier shows them as Implemented:

1. Central disclaimer registry (`src/lib/disclaimers/registry.ts`) + `<DisclaimerBlock />` component with all 8 + trademark disclaimers seeded from Legal Dossier Section VIII verbatim text (substituting "Stripe" for `[Payment Processor Name]` in 8.8). Footer #479 trademark disclaimer migrated to the registry.
2. Disclaimers placed in their required locations: 8.1 (homepage / footer / listings), 8.2 (homepage / listings / header-footer), 8.3 (ToS — replacing the wrong text in `Terms.tsx:115–122`; About page deferred until About page exists or copy lands inside another always-on page), 8.4 (Checkout / BookingSuccess / booking-confirmation email — replacing the paraphrased text), 8.5 (listings / Checkout / BookingSuccess / email — alongside the per-listing `CancellationPolicyDetail`), 8.6 (ToS — replacing the wrong text in `Terms.tsx:115–122` with the 12-month-fee-cap text), 8.8 (payment flow / Checkout / BookingSuccess / email — replacing the "PaySafe" badge).
3. **State field on `listings` table** (migration) — derived from `resort.location.state` for resort-linked listings, freeform input otherwise — so 8.7 geo-targeting becomes possible.
4. **Florida-Specific Disclosure (8.7)** rendered conditionally on `listing.state === 'FL'` in `PropertyDetail.tsx` and `Checkout.tsx`.
5. **California-Specific Disclosure** placeholder in the registry (text to be written by counsel; rendering wired identically to 8.7).
6. **"No Timeshare Sales" listing-form validation** — keyword filter on title/description in `ListProperty.tsx` plus server-side check in the listing-creation edge function.
7. **MLA Notice + arbitration carve-out** — checkbox at signup ("Are you active-duty military?"), conditional MLA notice text at checkout, and the verbatim carve-out paragraph added to `Terms.tsx:131` arbitration clause.
8. **Listing-accuracy reporting CTA** on `PropertyDetail.tsx` — new `ListingAccuracyReportDialog` distinct from the post-booking `ReportIssueDialog`, plus admin queue.
9. **Fraud reporting CTA** — adds `suspected_fraud` to `dispute_category` enum and surfaces a dedicated "Report Fraud" entry point.
10. **Guest Protection Policy product surface** — dedicated page + badge on `PropertyDetail.tsx` and `Checkout.tsx` referencing the verbatim 8.5 protection language.
11. Each item ships with at least one Vitest unit / integration test, per the project's tests-with-features policy.

After these ship, the scoreboard above is expected to move from 3 / 9 / 23 (Implemented / Partial / Gap) to roughly 14 / 6 / 15. Items remaining in the Gap column will be host-type classification (row 22), commercial-threshold monitoring (row 23), state-level licensing gate (row 24), license-number collection & display (row 3), dedicated Stripe Identity (row 25), timeshare-ownership verification (row 26), and the marketplace-facilitator state-by-state registration tracker (row 7) — all of which need counsel input on **scope and threshold** before implementation begins.

---

## 5. Where we need counsel input

| # | Question for counsel | Affects audit row(s) |
|---|---|---|
| C1 | Does the Pay Safe / Stripe destination-charge architecture (RAV never holds funds) satisfy FL § 721.08, CA B&P § 10145, and HI § 514E-9 escrow / trust-account requirements without RAV obtaining a separate escrow license? Written opinion requested. | 4, 5 |
| C2 | Does Stripe Connect Express KYC alone satisfy platform-level identity verification, or is dedicated Stripe Identity / Persona required? | 25 |
| C3 | Does RAV need to register as a "timeshare resale broker" under FL § 721.20 for **rental-only** listings, or qualify for an exemption? Same question for CA DRE oversight (B&P § 11003.5 + § 17550 Seller-of-Travel), HI Chapter 514E, NV NRS 119A, AZ ARS § 32-2197. | 1, 3, 22, 23, 24 |
| C4 | For Type 1 / 2 / 3 Host classification thresholds: are 6 listings/year (Type 1 → Type 2 trigger), 12 units/year (Type 2 → Type 3 trigger), and "6+ units = Type 3" the right thresholds? Should they be calibrated per state? | 22, 23 |
| C5 | For the FL/CA/HI/NV/AZ state-level licensing gate on Type 3 Hosts: should listing-creation be hard-blocked, soft-warned, or routed to manual admin review? What's the legal exposure of each? | 24 |
| C6 | What proof of timeshare-ownership is acceptable: deed copy, membership certificate, points statement, resort confirmation letter, or a combination? Same for each restricted state? | 26 |
| C7 | What is the correct state-by-state list for marketplace-facilitator tax registration, and what's the priority order? Should an admin field track this in-app? | 7 |
| C8 | The 8 policy drafts at `docs/support/policies/*.md` (privacy-policy, booking-terms, payment-policy, trust-safety-policy, insurance-liability-policy, subscription-terms, refund, cancellation) are at `status: draft` blocked on #80. Will counsel draft these or review founder drafts? | 1, 10–17, 18 |
| C9 | Does the verbatim disclaimer text in Section VIII of Legal Dossier v3 remain counsel-approved, or are revisions expected? (We are shipping verbatim text now under the founder's "build-now" go-ahead; the central registry is designed for one-line text updates.) | 8–17 |
| C10 | The CA-specific disclosure equivalent to FL Disclaimer 8.7 — what verbatim text should we render on California listings? | 15 |
| C11 | MLA carve-out paragraph language — is the verbatim language we'll add to the arbitration clause (e.g., "For active-duty servicemembers and their dependents, disputes arising from any consumer credit transaction are not subject to mandatory arbitration; 10 U.S.C. § 987 governs.") sufficient, or does counsel want to draft? | 21 |
| C12 | Recent legislative items in Legal Dossier Section V (FL HB 1537 effective 2026-01-01, CA AB 2992 effective 2026-07-01, HI SB 3090 effective 2026-01-01, NV SB 440 effective 2025-10-01 *registry safe harbor*, NY A 8421 effective 2026-01-01, TX HB 3821 effective 2025-09-01, IL SB 2294 effective 2026-03-01, CO HB 24-1175 effective 2026-01-01) — which are already in effect and what compliance moves does counsel recommend? | scope-defining |

---

## 6. Two compliance gaps from the 2026-05-04 internal review still open

The PR #479 commit body referenced "three pre-launch compliance gaps surfaced in the 2026-05-04 operating-model + brand review." Only the trademark/affiliation footer disclaimer (#479) has been closed. The other two — **CC&R / rental-restriction attestation in owner onboarding** and **`robots.txt` / scraping policy** — are mentioned in the #479 body as "tracked separately" but **do not appear to have been filed as standalone GitHub Issues yet** (search of open issues returned only #257 "Audit scraped resort data for compliance," which is a related but different concern). Recommend filing both before counsel meeting so they are visible.

---

## 7. References & supporting documents

- Legal research: `docs/legal/_extracted_legal_dossier.txt` (extracted from `Legal_Dossier_RentAVacation_v3.pdf`)
- Compliance brief: `docs/legal/_extracted_compliance_brief.txt` (extracted from `RAV_Compliance_Brief_for_Claude_Agent.pdf`)
- Pay Safe / Stripe architecture: `docs/payments/PAYSAFE-COMPLIANCE.md`, `docs/payments/PAYSAFE-FLOW-SPEC.md`
- Pricing / tax framework: `docs/RAV-PRICING-TAXES-ACCOUNTING.md`
- Brand language lock: `docs/brand-assets/BRAND-LOCK.md`
- Decisions log: `docs/PROJECT-HUB.md` § Key Decisions Log (DEC-022, DEC-029, DEC-031, DEC-032, DEC-034, DEC-036, DEC-037, DEC-038, DEC-039)
- Companion gap-analysis & priority plan: `docs/legal/compliance-gap-analysis.md`

*End of document — Version 1.0 — 2026-05-05*
