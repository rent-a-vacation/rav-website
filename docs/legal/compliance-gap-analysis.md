---
last_updated: "2026-05-05T00:00:00"
change_ref: "manual-edit"
change_type: "compliance-audit-2026-05-05"
status: "active"
---

# RAV Compliance Gap Analysis & Priority Plan

**Companion to:** `docs/legal/attorney-meeting-compliance-status.md`
**Audit date:** 2026-05-05
**Source:** Legal Research Memorandum v3 (Part 4 Priority Build List) + audit findings from 7 parallel codebase subagents

This document organizes the 23 gaps + 9 partials surfaced by the audit into the three priority tiers from Legal Dossier Part 4 (**Immediate** / **Pre-Launch** / **Post-Launch**), and tags each with a build classification:

- **Build now** = unambiguous code work; will ship before counsel meeting under the founder's "build-then-refine" preference (verbatim Legal Dossier text + obvious sense-checks)
- **Wait for counsel** = requires legal judgment, statutory interpretation, or business decision before any code lands
- **Mixed** = build the infrastructure now, leave specific text or thresholds slot-filled by counsel

---

## Tier 1 — Immediate (legal exposure if not addressed before launch)

### I-1. All 8 disclaimers deployed via central registry — **Build now**
**Authority:** All jurisdictions; explicitly required by Compliance Brief § 3.5 ("centrally managed so that when legal counsel recommends changes to disclaimer language, a single update propagates")
**Current state:** 0 of 8 Implemented; 3 Partial; 5 Gap. Trademark disclaimer (PR #479) is inline anti-pattern.
**Build:**
- `src/lib/disclaimers/registry.ts` exporting versioned constants for 8.1–8.8 + trademark, each `{ text, version, lastUpdated, legalReviewRequired, reviewedBy, reviewedDate, requiredLocations[] }`
- `src/components/legal/DisclaimerBlock.tsx` component (variants: full / compact / minimal) — pulls from registry
- `src/components/legal/FloridaDisclaimerBlock.tsx` geo-targeted wrapper for 8.7
- `supabase/functions/_shared/disclaimers.ts` mirror for booking-confirmation emails
- Place 8.1 (homepage / footer / listings), 8.2 (homepage / listings / header-footer), 8.4 (Checkout / BookingSuccess / email — replaces paraphrased), 8.5 (listings / Checkout / BookingSuccess / email — alongside per-listing policy), 8.8 (Checkout / BookingSuccess / email — replaces "PaySafe" badge)
- Migrate Footer #479 trademark disclaimer from inline to registry
**Tests:** Vitest unit test per disclaimer asserting verbatim text + render in each required location
**Effort:** ~12 hours (registry + component + 8 placements + tests)

### I-2. Limitation-of-Liability text correction in Terms of Service (8.6) — **Build now**
**Authority:** All jurisdictions
**Current state:** `Terms.tsx:115–122` Section 8 contains generic "we are not responsible…" intermediary language. Legal Dossier 8.6 requires verbatim 12-month platform-fee cap with exclusion of indirect/incidental/special/consequential/punitive damages.
**Build:** Replace `Terms.tsx:115–122` with `<DisclaimerBlock id="8.6" />` once registry exists; verbatim text shipped from registry.
**Effort:** ~30 minutes (after I-1 lands)

### I-3. Non-Broker / Non-Agent text in Terms of Service (8.3) — **Build now**
**Authority:** FL § 721.20, CA DRE, broker-licensing statutes
**Current state:** `Terms.tsx` does not contain the 8.3 verbatim text; no `About.tsx` page exists.
**Build:** Insert `<DisclaimerBlock id="8.3" />` in Terms (always-on); defer About-page placement until either an About page is created or the same disclaimer is duplicated on a homepage section
**Effort:** ~30 minutes (after I-1 lands)

### I-4. Pay Safe / Stripe Connect trust-account architecture — **Wait for counsel**
**Authority:** FL § 721.08, CA B&P § 10145, HI § 514E-9
**Current state:** ✅ Implemented in code (`process-escrow-release/handler.ts:262–273`, destination-charge model, never holds funds in RAV bank account). Documented in `docs/payments/PAYSAFE-COMPLIANCE.md` and `docs/payments/PAYSAFE-FLOW-SPEC.md`. **Counsel sign-off needed in writing.**
**Wait for counsel:** Written opinion that this architecture satisfies FL § 721.08, CA § 10145, and HI § 514E-9 — and that no separate escrow license is required.
**Engineering:** None expected; if counsel finds a gap, scope it then.

### I-5. "No Timeshare Sales" listing-creation validation — **Build now**
**Authority:** FL § 721.11, CA B&P § 11003.5
**Current state:** No validation on title/description. Disclaimer 8.2 also missing (covered by I-1).
**Build:**
- Client-side validation in `ListProperty.tsx` step 2 description textarea + title field — block list of phrases: `"for sale"`, `"for-sale"`, `"deed transfer"`, `"ownership transfer"`, `"buy my"`, `"selling my timeshare"`, `"sell my points"`, `"deed"` (when used as verb)
- Server-side check in the listing-creation edge function (defense in depth)
- User-facing error message linking to a one-page "RAV is for rentals only" explainer (with Disclaimer 8.2 verbatim)
**Tests:** Unit test on the validator with positive + negative phrase fixtures
**Effort:** ~3 hours

---

## Tier 2 — Pre-Launch (must be in place before accepting real money)

### P-1. State field on `listings` table — **Build now** (architectural prerequisite for I-1's 8.7 + CA disclosure)
**Authority:** FL § 721.20 (8.7 requirement); CA DRE
**Current state:** `listings` table has no `state` / `jurisdiction` column. `resort.location` is JSON. Issue #466 tracks this work but is Tier B and blocked on #80.
**Build:**
- Migration adding `state` (text, 2-char US state code) to `listings`, NOT NULL with backfill from `resort.location.state` for resort-linked listings; freeform input from owner otherwise
- `ListProperty.tsx` form field for state (auto-filled from selected resort, editable for off-resort listings)
- Type sync to `src/types/database.ts`
**Tests:** Migration backfill test; form-field test
**Effort:** ~3 hours
**Note:** Unblocks I-1's 8.7 placement and the CA disclosure (P-2). Issue #466 can be reframed: the "jurisdiction field" component is build-now; the "per-state disclosure logic / rules table" is partly build-now (8.7 wiring) and partly wait-for-counsel (the rules themselves).

### P-2. Florida-Specific Disclosure (8.7) wired to state field — **Build now** (after P-1)
**Build:** `<FloridaDisclaimerBlock propertyState={listing.state} />` rendering on `PropertyDetail.tsx` and `Checkout.tsx` when state = FL
**Tests:** Vitest assertion: FL listing → 8.7 visible; TX listing → 8.7 hidden
**Effort:** ~1 hour

### P-3. California-Specific Disclosure — **Mixed** (build now wiring; wait for counsel on text)
**Build now:** Component scaffolding + registry slot (`disclaimers["8.7-CA"]` placeholder) so wiring is identical to 8.7
**Wait for counsel:** Verbatim CA-specific text (counsel question C10)
**Effort:** ~1 hour wiring; text drop-in trivial

### P-4. Stripe Tax activation — **Wait for counsel + business action** (engineering blocked on #127)
**Authority:** ~40+ state marketplace-facilitator statutes
**Current state:** Stripe Tax wired (`create-booking-checkout/handler.ts:247`); env flag `STRIPE_TAX_ENABLED` defaults OFF on PROD; blocked on issue #127 (LLC/EIN).
**Wait for:** LLC/EIN formation (#127), marketplace-facilitator state registrations, then flip the env flag (~1 hour ops). Counsel question C7.

### P-5. Marketplace-facilitator registration tracker (admin tab) — **Build now**
**Authority:** Compliance Brief § 3.4 ("the platform should have a state registration status field in its admin dashboard")
**Build:**
- Migration creating `marketplace_registrations` table: `state (PK), registration_status (enum: not_required / pending / registered / exempt), registered_date, first_return_due, last_return_filed, next_return_due, registration_id, notes`
- Seed all 50 + DC with `not_required` default
- Admin tab `AdminMarketplaceRegistrations.tsx` (pattern from `AdminMemberships.tsx`) for staff to update status
**Tests:** RLS test (only `rav_admin` / `rav_owner` can write); migration test
**Effort:** ~5 hours
**Note:** Counsel question C7 fills the `registration_status` values per state; the table + UI is build-now.

### P-6. Verbatim Disclaimer 8.4 (Tax) replacing the paraphrased text — covered by I-1
Counted under I-1 above.

### P-7. Verbatim Disclaimer 8.8 (Escrow) replacing the "PaySafe" badge — covered by I-1
Counted under I-1 above. Specific text uses "Stripe" in place of `[Payment Processor Name]` per the Pay Safe architecture (project memory: Stripe-held escrow, RAV never holds funds).

### P-8. Host identity verification — dedicated provider — **Wait for counsel**
**Current state:** Stripe Connect Express KYC for every Host. Manual government-ID upload via `OwnerVerification.tsx`. No dedicated Stripe Identity / Persona.
**Wait for counsel:** Counsel question C2 — is Stripe Connect KYC sufficient or is dedicated Identity required? Drives whether a 1–2 day Stripe Identity integration is needed.

### P-9. Resort ownership verification (deed / membership-cert) — **Wait for counsel**
**Current state:** Pre-Booked proof workflow (Migration 064) verifies *reservation*, not *ownership*. No deed / membership-cert / points-statement upload.
**Wait for counsel:** Counsel question C6 — what proof types are acceptable per state? Drives the schema for a new `owner_timeshare_ownerships` table and admin review queue.

### P-10. Host type classification (Type 1 / 2 / 3) — **Mixed** (build infrastructure; wait for counsel on thresholds)
**Authority:** FL § 721.20, CA DRE, HI § 514E, NV NRS 119A, AZ ARS § 32-2197
**Current state:** No `host_type` column. No onboarding question.
**Build now:** Migration adding `host_type` enum (`casual` / `multi_property` / `commercial`), `properties_owned` (int), `annual_rentals_planned` (int) to `profiles`. Onboarding wizard step capturing these (post-approval flow). Self-classification logic in `src/lib/hostType.ts`.
**Wait for counsel:** Counsel question C4 — confirm the threshold values (1 / 2–5 / 6+ properties; 1–4 / 12 / 12+ rentals/yr).
**Effort:** ~6 hours infrastructure; thresholds adjust trivially after counsel confirms.

### P-11. License number collection & display for Type 2 / Type 3 Hosts — **Mixed**
**Build now:** Migration adding `license_number`, `license_state`, `license_verified_at` to `profiles`. Conditional UI in `ListProperty.tsx` rendering license input when `host_type` ∈ {`multi_property`, `commercial`}. Conditional display on `OwnerProfileCard.tsx` and `PropertyDetail.tsx` when `listing.state` ∈ FL/CA/HI/NV/AZ.
**Wait for counsel:** Counsel questions C3 + C4 — which states require which credential, and is rental-only platform exempt from any of them?
**Effort:** ~5 hours

### P-12. Guest Protection Policy product surface — **Build now**
**Authority:** UDAP statutes; consumer-protection baseline
**Current state:** Refund logic exists; no consumer-facing surface.
**Build:**
- New page `src/pages/GuestProtection.tsx` with the verbatim 8.5 protection language plus a plain-English explainer of the 5-business-day refund and 30-day-of-check-in trigger
- "RAV Guest Protection" badge on `PropertyDetail.tsx` (next to other trust badges) linking to the page
- Banner on `Checkout.tsx` above the Pay button
- Update `FAQ.tsx:115–117` "satisfaction guarantee" to link to the new page
**Tests:** Page renders; badge renders; banner renders
**Effort:** ~3 hours

### P-13. MLA Notice + Terms-of-Service arbitration carve-out — **Mixed**
**Authority:** Steines v. Westgate Palace (11th Cir. 2024); 10 U.S.C. § 987
**Build now:**
- Migration adding `is_active_duty_military` boolean to `profiles` (nullable, set via signup question)
- Checkbox at signup: "Are you (or a dependent of) an active-duty servicemember? (Optional — affects how disputes are resolved per the Military Lending Act.)"
- Conditional MLA notice in checkout flow when `is_active_duty_military = true`
- Verbatim MLA carve-out paragraph appended to `Terms.tsx:131` arbitration clause
**Wait for counsel:** Counsel question C11 — confirm the carve-out language is sufficient or supply substitute text.
**Effort:** ~4 hours

### P-14. Listing accuracy reporting (pre-booking) — **Build now**
**Authority:** Palmer v. FantaSea Resorts (NJ App. Div. 2025)
**Build:**
- "Report Inaccuracy" button on `PropertyDetail.tsx` (in "more options" menu)
- New `ListingAccuracyReportDialog` component (no `bookingId` required; accepts logged-in or anonymous reports)
- Migration extending `dispute_category` enum with `listing_inaccuracy`
- Admin queue: filter `AdminDisputes` by `category = 'listing_inaccuracy'`
- Documented escalation path: investigate → require correction or delist
**Tests:** Dialog renders; submission persists; admin filter shows reports
**Effort:** ~5 hours

### P-15. Fraud reporting + response protocol — **Build now**
**Authority:** FTC § 5; wire-fraud statutes; FTC v. Carroll (2026)
**Build:**
- Migration extending `dispute_category` enum with `suspected_fraud`
- "Report Suspected Fraud" CTA — Footer link + per-listing menu item
- Dedicated submission flow (auto-routes to senior admin queue)
- Documented fraud-response SOP in `docs/support/policies/trust-safety-policy.md` (currently `status: draft` — counsel review unblocks)
**Tests:** Submission persists; admin queue surfaces
**Effort:** ~4 hours

### P-16. Two open compliance gaps from 2026-05-04 internal review — **Build now**
The PR #479 commit body referenced three pre-launch compliance gaps; only the trademark disclaimer (#479) is closed. The other two are not yet filed as standalone GitHub Issues:
- **CC&R / rental-restriction attestation in owner onboarding** — owner attests that their rental complies with their resort's CC&Rs / use rules. Field on `owner_verifications` table; checkbox in onboarding; copy on `ListProperty.tsx`. ~3 hours.
- **`robots.txt` / scraping policy** — explicit `robots.txt` plus `terms-of-service.md` clause governing automated scraping of listings. ~1 hour.
**Action item:** File both as GitHub Issues before counsel meeting so they're visible in the dossier.

---

## Tier 3 — Post-Launch (first 90 days)

### PL-1. Rental frequency monitoring + commercial-threshold cron — **Mixed**
**Authority:** FL § 721.20, CA DRE, HI § 514E, NV NRS 119A, AZ ARS § 32-2197
**Build now:** Migration adding `compliance_status` enum (`compliant` / `flagged_type_1` / `flagged_type_2` / `blocked_pending_license` / `blocked_state_restricted`) to `profiles`. Edge function `compliance-threshold-monitor` running nightly via cron.schedule (pattern from Migration 073: `auto-confirm-checkins`, `sla-monitor`). Admin tab `AdminCompliance.tsx` (pattern from `AdminMemberships.tsx`).
**Wait for counsel:** Counsel question C4 (thresholds) + C5 (gate behavior — hard block, soft warn, manual review).
**Effort:** ~12 hours infrastructure; ~30 minutes per threshold tweak.

### PL-2. State-level licensing gate on listing creation — **Wait for counsel**
**Authority:** FL § 721.20 et al.
**Wait for:** Counsel question C5 — should `ListProperty.tsx` hard-block, soft-warn, or route to manual review when an unlicensed Type 3 Host attempts to list in FL/CA/HI/NV/AZ? Implementation is straightforward once policy is decided.
**Effort:** ~3 hours after policy decided.

### PL-3. Automated tax remittance (TaxJar / Avalara / Puzzle.io) — **Wait for business**
**Authority:** Marketplace-facilitator statutes
**Current state:** Stripe Tax collects; manual remittance to each state. Issue #65 (Automated Tax Filing) blocked on #127. Issue #63 (Puzzle.io accounting) blocked on #127.
**Wait for:** LLC/EIN formation (#127); volume threshold for Avalara (~$5K/mo justifies cost). Counsel question C7 informs registration order.

### PL-4. Cyber liability + fraud insurance — **Wait for business**
**Authority:** Strategic Recommendations § "Short-Term Actions"
**Wait for:** Insurance broker engagement post-LLC formation; not engineering work.

### PL-5. State compliance calendar (tax remittance deadlines, license renewals) — **Build now** (light)
**Build:** Extend `marketplace_registrations` admin table (P-5) with `next_return_due` reminder cadence; daily-summary email already wired (`daily-summary.yml`) — add a "registrations due in next 30 days" section. ~2 hours after P-5.

### PL-6. ARDA membership / legislative tracking — **Wait for business**
Out of engineering scope; founders engage trade association.

### PL-7. Formal legal audit of ToS + privacy + listing-agreement templates — **Wait for counsel**
The 8 policy drafts at `docs/support/policies/*.md` need counsel drafting or review (C8). Engineering action: once counsel returns approved versions, flip frontmatter `status: draft → active`, push via `sync-support-docs.yml` workflow, and update the `legal_review_required` / `reviewed_by` / `reviewed_date` frontmatter fields per DEC-036.

---

## Implementation order (build-now items only — proposed)

This is the order the engineering work would land, optimized for unblocking dependencies and shipping the disclaimers (highest legal exposure) first:

1. **I-1 disclaimer registry + DisclaimerBlock + 8 placements + trademark migration** (~12h)
2. **I-2 + I-3 + I-1's 8.4 / 8.5 / 8.6 / 8.8 ToS + Checkout + email replacements** (lands inside I-1)
3. **I-5 "No Timeshare Sales" validation + linked Disclaimer 8.2 explainer page** (~3h)
4. **P-1 state field on `listings` table** (~3h) — unblocks P-2 / P-3
5. **P-2 Florida-Specific Disclosure (8.7) wired** (~1h)
6. **P-3 CA-Specific Disclosure scaffolding** (~1h, text from counsel)
7. **P-5 marketplace-facilitator registration admin tab + table** (~5h, status fills from counsel)
8. **P-12 Guest Protection Policy page + badge + banner** (~3h)
9. **P-13 MLA notice + arbitration carve-out** (~4h, language confirmed by counsel)
10. **P-14 Listing accuracy reporting** (~5h)
11. **P-15 Fraud reporting** (~4h)
12. **P-16 CC&R attestation + robots.txt** (~4h, file the issues first)
13. **P-10 host_type infrastructure** (~6h, thresholds from counsel)
14. **P-11 license number collection + display infrastructure** (~5h, state coverage from counsel)
15. **PL-1 nightly compliance-threshold cron** (~12h, thresholds + gate behavior from counsel)
16. **PL-5 compliance calendar augmentation of P-5** (~2h)

**Total build-now engineering before counsel meeting:** ~30 hours (items 1–8) — completable this week per the founder's timeline.
**Total build-now engineering after counsel guidance lands:** ~40 hours (items 9–16) — week after counsel meeting.

After items 1–8 ship, the audit scoreboard moves from **3 / 9 / 23** (Implemented / Partial / Gap) to roughly **14 / 6 / 15**.

---

## What we will not do without counsel input

- Pretend that any disclaimer is "counsel-approved" — registry entries will say `legalReviewRequired: true, reviewedBy: null, reviewedDate: null` until counsel signs off.
- Implement state-level licensing gates (PL-2) — gate behavior is a legal-policy decision.
- Decide whether Stripe Connect Express KYC is sufficient for platform identity verification (P-8) — could trigger a Stripe Identity build that we don't want to scope twice.
- Specify which states require which credential type for Type 2 / Type 3 Hosts (P-11) — partially state-specific, partially exemption-driven.
- Decide what counts as acceptable timeshare-ownership proof (P-9) — varies by resort, by state, and by counsel's risk tolerance.
- Write or modify Terms of Service / Privacy Policy / Listing Agreement substantive content (`docs/support/policies/*.md` at `status: draft`) — counsel must draft or sign off (C8).
- File marketplace-facilitator registrations in any state — operational, not engineering.

---

## Decision request for the founder

Before beginning engineering on the build-now list above, please confirm:

1. **Is the proposed sequence (items 1–8 = ~30h this week) the right order to maximize what counsel sees as Implemented at the meeting?** Specifically: should disclaimers (I-1 to I-3 + P-2 / P-3) come first, or should Guest Protection Policy + listing/fraud reporting (P-12 / P-14 / P-15) come first because they're more visible to a counsel reviewing the live site?
2. **Should I file the two missing 2026-05-04-review issues now (CC&R attestation + robots.txt) so they appear in the GitHub Issues compliance view counsel will see?**
3. **For verbatim disclaimer text in the registry, is "Stripe" the right substitution for `[Payment Processor Name]` in 8.8?** Per the Pay Safe architecture this is correct (Stripe is the licensed processor); confirming because Pay Safe is the customer-facing brand and counsel may want to see the brand referenced too.
4. **About page placement of Disclaimer 8.3** — there is no `About.tsx` today. Options: (a) create a minimal About page in scope of this work; (b) defer to a separate ticket and accept 8.3 placement only in ToS for now; (c) place 8.3 on `HowItWorks.tsx` (closest analogue to an About page).
5. **GitHub Issues** — confirm the original Phase-3 plan (open issues only after counsel meeting) still holds, vs. opening issues now for the build-now items so they show progress in the daily Resend digest.

*End of document — Version 1.0 — 2026-05-05*
