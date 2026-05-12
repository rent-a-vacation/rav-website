---
last_updated: "2026-05-12T03:00:00"
change_ref: "manual-edit"
change_type: "session-66"
status: "active"
---

# RAV Counsel Meeting Preparation

**Prepared:** 2026-05-12
**Meeting purpose:** Walk through deployed compliance state, get counsel sign-off on verbatim disclaimer text + architectural choices, capture decisions on 12 open questions.
**Companion docs:** `attorney-meeting-compliance-status.md` (Part 5 two-column status), `compliance-gap-analysis.md` (Part 4 priority gaps), `_extracted_legal_dossier.txt` (research memorandum).
**Audience:** RAV founders + counsel.

---

## 1. TL;DR — what we did and what we need from you

In the 6 days between the 2026-05-05 audit and this meeting we shipped **all 12 build-now compliance items** from the audit:

- All **8 mandated disclaimers** from Legal Dossier § VIII deployed across the platform via a central registry (homepage, footer, listing pages, Terms of Service, About page, Checkout, Booking Confirmation page, booking-confirmation email).
- **Pay Safe / Stripe destination-charge** architecture documented in code + tests; Disclaimer 8.8 explicitly names both Stripe (the licensed processor) and Pay Safe (RAV's customer-facing brand).
- **9 Postgres migrations** (074–079, plus a Session-63 backlog cleanup) applied to **DEV + PROD**: state column on listings, marketplace-facilitator registration tracker, active-duty-military self-disclosure, listing-accuracy reports, fraud reports, CC&R attestation.
- **Three new product surfaces** with anti-misrepresentation case-law in mind: Guest Protection Policy (full refund within 5 business days of Host cancellation within 30 days of check-in), Listing Accuracy Reporting (Palmer v. FantaSea, 2025), Fraud Reporting (FTC v. Carroll, 2026).
- **MLA arbitration carve-out** in Terms § 9 (Steines v. Westgate Palace, 11th Cir. 2024) — universal, regardless of whether the user self-identifies as active-duty.
- **`robots.txt` + Terms § 7.1 Automated Access clause** — explicit allowlist for major search engines + CFAA citation for unauthorized scrapers.

**What we need from you, ranked by impact on platform launch:**

| Priority | Decision | Why it matters |
|---|---|---|
| **P0** | Written opinion that Pay Safe / Stripe destination-charge satisfies FL § 721.08, CA B&P § 10145, HI § 514E-9 (counsel question **C1**) | If yes, no state escrow license needed → launch unblocked in 50 states. If no, we need to re-architect payments before opening to renters. |
| **P0** | Approve or revise the verbatim text of Disclaimers 8.1–8.8 + trademark (counsel question **C9**) | Triggers `legalReviewRequired: false` flip across the registry (#494). |
| **P0** | Confirm RAV doesn't need a real estate / rental broker license in FL, CA, HI, NV, AZ for rental-only listings (counsel question **C3**) | If license required, materially changes onboarding scope. |
| **P1** | CA-specific disclosure verbatim text (counsel question **C10**) | One registry entry away from rendering live on every CA listing. |
| **P1** | Host-type classification thresholds — Type 1 / 2 / 3 cutoffs by properties + rentals (counsel question **C4**) | Drives the next compliance push: rental-frequency monitoring + commercial-threshold flagging. |
| **P2** | Stripe Identity vs Stripe Connect KYC sufficiency (counsel question **C2**) | Determines a 1-2 day integration scope. |
| **P2** | Acceptable timeshare-ownership proof types per state (counsel question **C6**) | Drives schema for an `owner_timeshare_ownerships` table. |
| **P2** | State-level licensing gate behavior — hard-block vs soft-warn (counsel question **C5**) | Behavioral choice for the (yet-to-be-built) commercial-threshold gate. |
| **P3** | Marketplace-facilitator registration order — which states to register in first (counsel question **C7**) | Fills in values in the admin tab we already deployed. |
| **P3** | MLA carve-out language confirmation (counsel question **C11**) | Currently a single registry / Terms edit if revised. |
| **P3** | Recent-legislation effective-date prioritization — FL HB 1537, CA AB 2992, HI SB 3090, etc. (counsel question **C12**) | Some are already in effect; we need to know which gates are loose. |
| **P3** | 8 policy drafts at `docs/support/policies/*.md` (`status: draft`, blocked on #80) — does counsel draft or review founder drafts? (counsel question **C8**) | Unblocks Privacy Policy + final ToS substantive content. |

---

## 2. Suggested meeting agenda (90 minutes)

| Time | Topic | Doc to display |
|---|---|---|
| **0:00–0:10** | Welcome + framing: this is mostly a review, not a design session — code is shipped, awaiting your sign-off | this doc |
| **0:10–0:25** | Pay Safe architecture walkthrough (C1) — the biggest single decision | `docs/payments/PAYSAFE-COMPLIANCE.md` + Migration 068 + 069 |
| **0:25–0:40** | The 8 mandated disclaimers (C9) — verbatim text vs deployed text | `attorney-meeting-compliance-status.md` § 2.3 |
| **0:40–0:55** | Marketplace-facilitator licensing for rental-only platforms (C3) — FL, CA, HI, NV, AZ | `_extracted_legal_dossier.txt` § II + IV |
| **0:55–1:10** | Host-type classification thresholds (C4) + state licensing gate behavior (C5) | this doc § 6 |
| **1:10–1:20** | Recent legislation effective dates (C12) — FL HB 1537 in effect since 2026-01-01 | `_extracted_legal_dossier.txt` § V |
| **1:20–1:30** | Action items + post-meeting timeline | this doc § 8 |

Items **C2, C6, C7, C8, C10, C11** can be handled async over email if time runs out.

---

## 3. What is deployed today — feature map

> **Status legend:** ✅ Deployed & tested · 🟡 Deployed pending counsel sign-off · ⏳ Counsel-pending (no code yet)

### 3.1 Disclaimer system

| Disclaimer | Required placement (per Legal Dossier § VIII) | Where it lives in code |
|---|---|---|
| 8.1 Marketplace Disclaimer | homepage, footer, listing pages | 🟡 Footer + Index + PropertyDetail (verbatim text from registry; counsel sign-off pending) |
| 8.2 No Timeshare Sales | homepage, listing pages, header/footer | 🟡 Footer + Index + PropertyDetail (verbatim) |
| 8.3 Non-Broker / Non-Agent | Terms of Service, About page | 🟡 Terms.tsx § 2 + new About page |
| 8.4 Tax Disclosure | Checkout, booking confirmation | 🟡 Checkout + BookingSuccess + booking-confirmation email |
| 8.5 Cancellation & Refund | listing pages, Checkout, booking confirmation | 🟡 PropertyDetail + Checkout + BookingSuccess + email |
| 8.6 Limitation of Liability | Terms of Service | 🟡 Terms.tsx § 8 (replaced wrong generic intermediary text) |
| 8.7 Florida-Specific | FL listing pages, FL checkout (geo-targeted) | ✅ Renders live on FL listings via `<StateSpecificDisclaimer />` + `listings.state` column |
| 8.8 Escrow / Fund-Holding | payment flow, checkout, booking confirmation | 🟡 Checkout + BookingSuccess + email; substitution: `Stripe (the "Pay Safe" service)` |
| Trademark / Affiliation | footer | 🟡 Footer (migrated from inline anti-pattern to registry) |
| CA-Specific (8.7-CA) | CA listing pages, CA checkout | ⏳ Wiring complete; registry entry awaits your verbatim text (C10) |

**Architecture:** All disclaimer text lives in **one file** — `src/lib/disclaimers/registry.ts`. Every placement renders via `<DisclaimerBlock id="..." />`. A drift-detection test asserts the edge-function mirror (`supabase/functions/_shared/disclaimers.ts`) is byte-identical. **A counsel-driven text revision is a one-line edit** that propagates to all locations + the booking-confirmation email.

### 3.2 Payment + escrow (Pay Safe)

| Requirement | Where it lives |
|---|---|
| Fund segregation — Guest funds never enter a RAV bank account | ✅ Stripe Connect destination-charge in `supabase/functions/process-escrow-release/handler.ts:262-273`; documented in `docs/payments/PAYSAFE-COMPLIANCE.md` § 2 |
| Disbursement after check-in | ✅ 5-business-day hold via `system_settings.escrow_hold_period_days` (Migration 068); `auto-confirm-checkins` cron (Migration 073) |
| Refund processing — within 5 business days for Host cancellation | ✅ `stripe.refunds.create` called immediately on Host cancellation in `process-cancellation/handler.ts:130-163` |
| Disclaimer 8.8 verbatim | 🟡 Deployed at Checkout / BookingSuccess / email |
| Guest Protection Policy surface | 🟡 `/guest-protection` page + badge on listings + banner above Pay button |

### 3.3 Listing creation safeguards

| Requirement | Where it lives |
|---|---|
| "No Timeshare Sales" validation | ✅ `src/lib/listingValidation/noSales.ts` blocks 16 sale-language phrases; wired into `ListProperty.tsx` submit |
| State field on listings | ✅ Migration 074 + form wiring; backfilled from `resort.location.state` |
| Owner attestation — reservation genuine | ✅ Existing checkbox (pre-Session 66) |
| **CC&R attestation** — resort/HOA permits rental | ✅ Migration 079 + required checkbox in ListProperty (new Session 66 — 2026-05-04 review gap closed) |
| FL-Specific Disclosure on FL listings | ✅ Live |

### 3.4 Consumer protection surfaces

| Requirement | Where it lives |
|---|---|
| Guest Protection Policy | 🟡 `/guest-protection` page + GuestProtectionBadge component on PropertyDetail + Checkout banner |
| Pre-booking listing-accuracy reporting (Palmer v. FantaSea) | 🟡 `<ListingAccuracyReportDialog />` from PropertyDetail; admin queue at `/admin → Accuracy reports` tab; anon submissions allowed; Migration 077 |
| Fraud reporting (FTC v. Carroll) | 🟡 `<FraudReportDialog />` from Footer + PropertyDetail; senior-admin-only queue at `/admin → Fraud reports` tab; Migration 078 |
| MLA arbitration carve-out | 🟡 Terms § 9 carve-out paragraph (universal, applies regardless of self-disclosure); conditional `<MLANotice />` at Checkout for self-identified servicemembers; Migration 076 |
| Automated access / scraping policy | 🟡 `public/robots.txt` explicit allowlist + Terms § 7.1 with CFAA citation |

### 3.5 Tax + jurisdictional

| Requirement | Where it lives |
|---|---|
| Stripe Tax calculation engine | ✅ Wired (`STRIPE_TAX_ENABLED` env flag, default OFF); flips ON when LLC/EIN (#127) lands |
| Tax line item at checkout (8.4 verbatim) | 🟡 Deployed |
| Marketplace-facilitator registration tracker | ✅ Migration 075 + `AdminMarketplaceRegistrations` admin tab seeded with 51 jurisdictions; values fill in per **C7** decision |
| Geo-targeted FL disclosure | ✅ Live |
| Geo-targeted CA disclosure | ⏳ Wiring complete; awaits **C10** text |

### 3.6 Identity, host classification, monitoring

| Requirement | Where it lives |
|---|---|
| Identity verification | 🟡 Stripe Connect Express KYC for every Host (`owner_verifications.kyc_verified`); see **C2** — Stripe Identity needed in addition? |
| Active-duty servicemember self-disclosure | ✅ Migration 076 + signup checkbox; Terms carve-out applies universally |
| Host type classification (Type 1/2/3) | ⏳ Not built — needs **C4** thresholds + **C5** gate behavior first |
| Rental-frequency / commercial-threshold monitoring | ⏳ Not built — depends on host_type column above |
| License-number collection + display | ⏳ Not built — needs **C3** which states require which credentials |
| Resort ownership verification (deed / membership cert) | ⏳ Not built — needs **C6** acceptable proof types |

---

## 4. The 12 counsel questions in detail

### C1 — Does Pay Safe / Stripe destination-charge satisfy FL § 721.08, CA B&P § 10145, HI § 514E-9?

**Why we're asking:** The audit flagged escrow / trust-account requirements as the single highest-risk compliance area. Our architectural answer was the Pay Safe service: RAV never holds Guest funds in a RAV-controlled bank account. Stripe (a licensed payment processor) collects, holds, and disburses on RAV-controlled timing. Documented in `docs/payments/PAYSAFE-COMPLIANCE.md`.

**Code reference:** `supabase/functions/process-escrow-release/handler.ts:262-273` — `stripe.transfers.create({ destination: owner.stripe_account_id, ... })`.

**What we're asking for:** A short written opinion that this architecture (Stripe destination-charge + 5-business-day hold + check-in-confirmation trigger + admin payout-hold capability) satisfies the trust-account requirements in those three states **without RAV obtaining its own escrow license**.

**Risk if "no":** Major re-architecture — RAV would need to obtain escrow licensing in each state or change payment processor.
**Risk if "yes":** None — current architecture continues. We'd land the written opinion into `PAYSAFE-COMPLIANCE.md` as the counsel-handoff record.

**RAV's recommended position:** This satisfies the requirements; RAV is a marketplace facilitator using a licensed third-party processor. The Compliance Brief Part 6 ("What NOT to Over-Engineer") explicitly says the platform should not implement escrow management directly.

---

### C2 — Stripe Identity (dedicated) vs Stripe Connect Express KYC (current)?

**Current state:** Every Host completing Stripe Connect Express onboarding hits Stripe's KYC flow. Government ID is collected by Stripe and surfaced to RAV as `profiles.stripe_charges_enabled = true`. RAV stores this state but does not directly handle ID documents.

**The audit flagged this as Partial:** Stripe Connect KYC is payment-side identity verification, not platform-level identity verification. The Compliance Brief recommends a dedicated provider (Stripe Identity or Persona).

**Decision:** Is Stripe Connect Express KYC sufficient for the compliance posture we want, or do we need to layer Stripe Identity / Persona on top?

**Risk if "Connect is enough":** None today; we close the audit item. If a state regulator later demands more, we add Stripe Identity then.
**Risk if "need dedicated":** 1-2 day integration + new admin surface + listing-creation gate.

**RAV's recommended position:** Stripe Connect Express KYC is sufficient pre-launch; revisit at first regulatory contact.

---

### C3 — Real estate / rental broker license required in FL, CA, HI, NV, AZ for rental-only platforms?

**Statutes named in Legal Dossier § II–IV:**
- FL § 721.20 ("timeshare resale brokers" — rental-only platforms may qualify for an exemption)
- CA B&P § 11003.5 + DRE oversight (if platform "negotiates or solicits on behalf of owners")
- CA B&P § 17550 Seller-of-Travel registration (separate consideration)
- HI Chapter 514E ("timeshare plan operators" — rental platforms may be covered)
- NV NRS 119A.285 (timeshare marketing)
- AZ ARS § 32-2197 (timeshare sales agents)

**RAV's posture:** Marketplace facilitator that does NOT negotiate terms, NOT act as agent, NOT hold out as licensed broker. Direct host-to-guest contracting; RAV's fee is a platform fee, not a transaction commission.

**Code/copy evidence we can point to:**
- Disclaimer 8.3 (Non-Broker / Non-Agent) in Terms + About
- "No Timeshare Sales" validation on listing creation (#485)
- Disclaimer 8.2 across all required locations
- About page positioning (`src/pages/About.tsx`): "we facilitate, do not own, do not negotiate"

**Decision:** Per-state — does RAV need a license for rental facilitation activity?

**RAV's recommended position:** No, based on the marketplace facilitator model. We'd like written confirmation for each of the five Required-tier states.

---

### C4 — Type 1 / Type 2 / Type 3 Host classification thresholds?

**Compliance Brief Part 2 proposed thresholds:**
- Type 1 Casual: 1 property, 1–4 rentals/year
- Type 2 Multi-Property: 2–5 properties
- Type 3 Commercial: 6+ units or operating as a business

**Why this matters:** Type 3 hosts almost certainly require a license in the Required-tier states (per **C3**). RAV's compliance gate behavior depends on knowing where the line falls.

**Decision:**
- Are the proposed thresholds correct?
- Should they vary by state? (FL might use 6 units, NV might use 3 — we don't know without counsel)
- Should we add a "Type 0" (casual single owner) tier with no compliance burden at all?

**Engineering impact:** Trivial — change the threshold constants. The schema (`profiles.host_type` enum + `properties_owned` + `annual_rentals_planned`) is the same regardless.

---

### C5 — State-level licensing gate behavior?

**Once we have C3 + C4 answered**, we need to decide how `ListProperty.tsx` behaves when a Type 3 Host attempts to list in a Required-tier state without license documentation.

**Options:**
1. **Hard block** — refuse the listing submission until license docs uploaded.
2. **Soft warn** — show a yellow banner, allow submission, queue for manual admin review.
3. **Allow + flag** — submit normally, admin queue gets a "needs license verification" flag.

**Trade-offs:**
- Hard block protects RAV but may push users to other platforms.
- Soft warn keeps the funnel intact but exposes RAV if a renter sues.
- Allow + flag is a compromise but inherits the most exposure.

**RAV's recommended position:** Hard block in Required-tier states; allow + flag in Conditional states (AZ, IL, NY); ignore in Monitor states.

---

### C6 — Acceptable timeshare-ownership proof types?

**Current state:** RAV verifies *reservation proof* (Pre-Booked confirmation number + uploaded confirmation email, Migration 064) but **does not verify ownership of the underlying timeshare interest**.

**Compliance Brief Part 3 §3.1 calls this out:** "Resort ownership verification — Does the platform verify the Host actually owns the timeshare interest they are listing? This is the single most important fraud prevention measure."

**Possible proof types:**
- Deed copy (real-estate-deeded timeshares like Marriott legacy weeks)
- Membership certificate (points-based programs like DVC, Wyndham Club Wyndham)
- Annual statement showing points balance
- Resort confirmation letter naming the owner
- Resort API integration (none of the major chains expose one publicly)

**Decision:** Which types of proof should RAV accept, and does the answer differ by state?

**Risk of doing nothing:** If a host lists a stay they don't own, RAV inherits exposure under Palmer v. FantaSea (2025) reasoning even with our new accuracy-reporting flow.

---

### C7 — Marketplace-facilitator registration order?

**We deployed the admin tab** at `/admin → Tax registrations` (Migration 075). The table is seeded with all 50 states + DC, every row at `registration_status = 'not_required'`.

**Decision:** Which states require RAV to register as a marketplace facilitator, in what order, and with what timeline?

The compliance brief notes "40+ states" — we need the actual list to populate the admin tab. RAV staff + a tax pro can fill these in once counsel confirms the legal answer.

**Engineering impact:** Zero — operational data entry only.

---

### C8 — Counsel-drafted vs counsel-reviewed for the 8 policy drafts?

**8 policy documents** sit at `docs/support/policies/*.md` with frontmatter `status: draft`, all blocked on issue #80:

1. `privacy-policy.md`
2. `booking-terms.md`
3. `payment-policy.md`
4. `trust-safety-policy.md`
5. `insurance-liability-policy.md`
6. `subscription-terms.md`
7. `refund-policy.md` (already at `status: active` but counsel should still review)
8. `cancellation-policy.md`

**Decision:** Will you draft these, or review founder drafts? If we draft, will you mark up or rewrite?

**Risk if neither:** These are required pre-launch artifacts. Privacy Policy in particular has CCPA / GDPR implications that need a lawyer's eye.

---

### C9 — Are Disclaimers 8.1 – 8.8 approved as-is?

**Every disclaimer in `src/lib/disclaimers/registry.ts`** carries:
```
legalReviewRequired: true,
reviewedBy: null,
reviewedDate: null,
```

The verbatim text is what's in **Legal Dossier v3 Section VIII**. We assume that text is yours — but the dossier's banner says "memorandum prepared by the Rent-A-Vacation founding team to facilitate legal review." So we want explicit sign-off.

**Decision per disclaimer:** Approve as-is / approve with edits / rewrite.

**Mechanics:** Approval triggers one PR (#494) that flips `legalReviewRequired: false`, sets `reviewedBy: "<your name / firm>"`, `reviewedDate: <meeting date>` across all 9 entries (8 mandated + trademark). Any text revisions: same PR bumps `version`, edits text in both source registry + edge-function mirror, drift test passes.

---

### C10 — CA-Specific Disclosure (8.7-CA) verbatim text?

**Wiring is complete.** `STATE_DISCLAIMER_MAP.CA → "8.7-CA"`. `<StateSpecificDisclaimer />` renders nothing today because the registry intentionally omits the `8.7-CA` entry.

**What's needed:** Verbatim disclosure text appropriate for CA-listed timeshare rentals (parallel to 8.7 for FL). Should it cite CA B&P §§ 11003.5 / 10145 / 17550? Should it disclaim Seller of Travel registration status (or affirm it)?

**Engineering impact:** One registry entry + matching email-mirror entry. Tracked in #493.

---

### C11 — MLA carve-out language confirmation?

**Current Terms § 9 paragraph:**

> **Military Lending Act Carve-Out.** For active-duty servicemembers of the U.S. Armed Forces and their dependents (as defined in 10 U.S.C. § 987 and 32 C.F.R. § 232), the arbitration provision above is not enforceable. Such users retain the right to pursue any dispute arising out of or relating to these Terms in a court of competent jurisdiction. This carve-out reflects the holding of *Steines v. Westgate Palace*, 11th Cir. (2024), and applies regardless of whether the user has self-identified as a servicemember to Rent-A-Vacation.

**Decision:** Approve as-is or rewrite. One-paragraph edit in `Terms.tsx` if revised.

---

### C12 — Recent legislation prioritization?

**Legal Dossier § V lists 8 items effective 2025-09-01 through 2026-07-01:**

| Jurisdiction | Bill | Effective | Status |
|---|---|---|---|
| Florida | HB 1537 — Timeshare Rental Disclosure Act | **2026-01-01 (in effect)** | Display owner license status — needs **C3** answer first |
| California | AB 2992 — Short-Term Rental Marketplace Accountability | **2026-07-01 (upcoming)** | Marketplace facilitator extension + host identity verification |
| Hawaii | SB 3090 — TAT Modernization | **2026-01-01 (in effect)** | TAT to 10.25%; quarterly remittance by marketplace facilitators — feeds **C7** |
| Nevada | SB 440 — Timeshare Rental Registry | **2025-10-01 (in effect)** | Voluntary registry; safe harbor from broker licensing |
| New York | A 8421 — Short-Term Rental Registration | **2026-01-01 (in effect)** | Hosts must register with local municipalities |
| Texas | HB 3821 — Marketplace Facilitator Lodging Tax | **2025-09-01 (in effect)** | Marketplace facilitators must collect + remit hotel tax |
| Illinois | SB 2294 — Chicago STR Ordinance | **2026-03-01 (in effect)** | Increased platform liability for unregistered Chicago listings |
| Colorado | HB 24-1175 — Short-Term Rental Enforcement | **2026-01-01 (in effect)** | Platforms must remove listings lacking local registration numbers |

**Decision:** Which of these does RAV need to act on first? NV SB 440 (registry safe harbor) seems like an easy win. FL HB 1537 ties into C3.

---

## 5. Risk register — open items

| # | Risk | Severity | Mitigation in flight |
|---|---|---|---|
| 1 | Counsel hasn't reviewed verbatim disclaimer text | Medium | Counsel meeting agenda § 2; flip via #494 |
| 2 | No host-type classification → cannot enforce commercial thresholds in FL/CA/HI/NV/AZ | Medium | Awaiting **C4** thresholds; schema + cron infrastructure ready |
| 3 | No timeshare-ownership verification (only reservation proof) | Medium | Awaiting **C6** acceptable proof types |
| 4 | Stripe Tax not actually collecting (env flag OFF) | Low (current); High (at launch) | Activates with LLC/EIN (#127); no engineering work needed |
| 5 | 8 policy drafts unreviewed | Medium | Awaiting **C8** counsel commitment |
| 6 | CA-Specific Disclosure not rendering | Low | Wiring done; one registry entry away (**C10**) |
| 7 | PROD push has Studio-vs-CLI drift on pre-Session 63 migrations | Low (CLI now in sync) | Cleared this session; future migrations always go through CLI |
| 8 | RAV could attract a Palmer-style lawsuit | Medium pre-launch; Low post-launch | Listing-accuracy reporting flow deployed (#491); investigation SOP needed (depends on **C8** trust-safety-policy.md review) |

---

## 6. Where the platform sits in 50-state risk tier

Per Legal Dossier § IV:

- **Required (high-scrutiny) — 5 states:** FL, CA, HI, NV, AZ.
  Current state: deployed the 8.7 FL disclosure live; CA wiring awaits **C10**; HI/NV/AZ need **C3** licensing answer.
- **Conditional — 3 states:** AZ (TPT + ARS § 32-2197), IL (Chicago hotel tax), NY (NYC hotel + RPL § 442 broad-broker-def).
- **Monitor — rest.** No special handling beyond marketplace-facilitator tax obligations (handled via the new admin tab after **C7**).

---

## 7. Pay Safe / Stripe architecture — quick reference for the meeting

```
Renter pays → Stripe (RAV's platform account) → holds for 5 business days
                                                ↓
                                          Check-in occurs
                                                ↓
                                  Auto-confirm cron OR renter confirms
                                                ↓
                                  stripe.transfers.create({
                                      destination: host.stripe_account_id,
                                      amount: owner_payout,
                                      ...
                                  })
                                                ↓
                                  Stripe pays Host's connected account
```

**Key facts to confirm with counsel:**
- RAV never sees the money in a RAV-controlled bank account
- Stripe is the licensed payment processor / money transmitter
- The 5-day hold is RAV-controlled *timing* on a transfer Stripe is otherwise ready to make — it's a product feature, not a custodial action
- Admin can extend the hold (escrow_hold_period_days in system_settings) or hold indefinitely (manual admin hold)
- Disputes pause the auto-release
- Documented in `docs/payments/PAYSAFE-COMPLIANCE.md` (counsel sign-off goes into § 7 placeholder)

---

## 8. Post-meeting checklist

Immediately after the meeting:

- [ ] Capture counsel decisions on C1–C12 into this doc (or a transcribed counsel-notes.md)
- [ ] Update `docs/payments/PAYSAFE-COMPLIANCE.md` § 7 with counsel's written opinion on C1
- [ ] File a focused follow-up PR for #494 (flip `legalReviewRequired: false` + add `reviewedBy` / `reviewedDate` to each of the 9 registry entries; if any text was revised, bump versions and update email-mirror in lock-step)
- [ ] File #493 PR (CA-specific disclosure verbatim text) if C10 returned text
- [ ] If C4 + C5 returned answers: file follow-up issue to build host-type classification + commercial-threshold cron (engineering ~2 days)
- [ ] If C6 returned answers: file follow-up issue to build timeshare-ownership verification flow
- [ ] If C7 returned values: RAV staff + tax pro fill in marketplace-registration admin tab
- [ ] If C8 returned counsel-drafted policies: replace the 8 drafts at `docs/support/policies/*.md`, flip `status: draft → active`, push via `sync-support-docs.yml`
- [ ] Update `docs/legal/attorney-meeting-compliance-status.md` to reflect counsel decisions (flip 🟡 → ✅ where signed off)

---

## 9. Documents to bring to the meeting

| Doc | Why |
|---|---|
| `docs/legal/_extracted_legal_dossier.txt` (or the original PDF) | Reference for the research + verbatim disclaimer text |
| `docs/legal/attorney-meeting-compliance-status.md` (+ PDF) | Part 5 two-column status — quickest visual proof of what's deployed |
| `docs/legal/compliance-gap-analysis.md` (+ PDF) | Priority breakdown by Immediate / Pre-Launch / Post-Launch |
| `docs/legal/counsel-meeting-prep.md` (this doc, + PDF) | Agenda + decision matrix |
| `docs/payments/PAYSAFE-COMPLIANCE.md` | Architectural answer for C1 |
| GitHub Issues — umbrella #480 | Live status of all 12 build-now items |

---

*End of document — Version 1.0 — 2026-05-12*
