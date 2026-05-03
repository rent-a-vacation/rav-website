---
last_updated: "2026-04-28T10:04:52"
change_ref: "dfba76b"
change_type: "session-61-paysafe-spec-v1"
status: "active"
---

# PaySafe Flow Specification

> **Purpose:** Authoritative internal specification of how money moves through the Rent-A-Vacation marketplace — from traveler payment, through escrow hold, to owner payout (or refund / dispute resolution).
>
> **Audience:** Engineering, RAV admins / staff, legal counsel reviewing the platform under #80, and future contributors implementing payment-related features.
>
> **Scope:** Internal system spec. **Not** the public-facing customer policy — that lives in `docs/support/policies/payment-policy.md` (currently `status: draft`, pending lawyer review under #80) and `docs/support/policies/cancellation-policy.md`.
>
> **Source of truth:** the implementation. When this doc and the code disagree, the code wins — open a PR to update this doc.
>
> **Migration paths note:** RAV's earliest schema migrations (001–006, 022–023) are archived in `docs/supabase-migrations/` because they were inherited from the Lovable starter and never re-played as numbered files in `supabase/migrations/`. Newer migrations (007+) live in `supabase/migrations/`. References below use the full path so it is unambiguous which directory the file is in.

---

## 1. Overview

**PaySafe** is the brand name for the RAV escrow-and-release flow. It exists because:

- Travelers pay weeks or months before their stay; an unprotected payment leaves them exposed if the owner cancels, the property is misrepresented, or check-in fails.
- Owners need predictable payout timing and protection against renter no-shows, damage, and rule violations.
- A two-sided marketplace cannot operate at scale on trust alone — escrow plus a dispute process is the trust substrate.

PaySafe is **not** a separate licensed money-services entity. RAV does not custody customer funds in its own bank account. Funds flow through **Stripe Connect (destination charges)**; Stripe is the licensed money transmitter. RAV's role is to:

1. Decide *when* funds are captured, held, released, or refunded.
2. Mediate disputes between the two marketplace parties.
3. Provide the user-facing UX that surfaces the underlying state.

This document specifies (1) and (2). Implementation details for (3) are in `docs/ARCHITECTURE.md` and the relevant edge-function source.

---

## 2. Money-flow lifecycle

The booking lifecycle has six payment states, tracked in `booking_confirmations.escrow_status` (enum defined in `docs/supabase-migrations/006_owner_verification.sql:37–44`):

```
pending_confirmation
    │
    ▼ (owner submits resort confirmation #)
confirmation_submitted
    │
    ▼ (RAV staff verifies the resort booking)
verified
    │
    ▼ (auto-release: checkout date + 5 days, no open dispute, no admin hold)
released ─────────────────────► owner Stripe Connect account
    │
    │ (cancellation OR dispute OR check-in issue)
    ▼
refunded ─────────────────────► back to traveler card / bank
    │
    │ (dispute filed at any prior state)
    ▼
disputed → resolved_full_refund | resolved_partial_refund | resolved_no_refund
```

**Pre-states** (before escrow exists):
- Traveler completes Stripe Checkout → `verify-booking-payment` edge function inserts the `booking_confirmations` row in state `pending_confirmation` (`supabase/functions/verify-booking-payment/handler.ts:236–266`).
- For *Pre-Booked Stays* (owner already holds an active resort confirmation) the row is inserted with `owner_confirmation_status='owner_confirmed'` and skips the owner-confirmation timer (handler.ts:236–249).
- For *Wish-Matched Stays* (owner must still book the resort) the owner-confirmation timer starts at 60 minutes (default), with up to 2× 30-minute extensions allowed before the booking auto-cancels and refunds. Timer values come from `system_settings` keys `owner_confirmation_window_minutes`, `owner_confirmation_extension_minutes`, `owner_confirmation_max_extensions` (defaults set in `supabase/migrations/012_phase13_core_business.sql:133–137`).

**Implementation references**

| Concern | File | Lines |
|---|---|---|
| `escrow_status` enum | `docs/supabase-migrations/006_owner_verification.sql` | 37–44 |
| `booking_confirmations` table | `docs/supabase-migrations/006_owner_verification.sql` | 131–162 |
| `checkin_confirmations` table | `docs/supabase-migrations/006_owner_verification.sql` | 190–204+ |
| Owner-confirmation timer columns | `supabase/migrations/012_phase13_core_business.sql` | 65–127 |
| Owner-confirmation timer defaults | `supabase/migrations/012_phase13_core_business.sql` | 133–137 |
| Owner-confirmation deadline extension RPC | `supabase/migrations/012_phase13_core_business.sql` | 143–end |
| Admin payout-hold columns | `supabase/migrations/024_escrow_automation.sql` | 4–14 |
| Confirmation-row insert (Stripe success) | `supabase/functions/verify-booking-payment/handler.ts` | 236–266 |
| Auto-release cron logic | `supabase/functions/process-escrow-release/index.ts` | 7, 85–130, 181–188 |
| Stripe transfer to owner | `supabase/functions/process-escrow-release/index.ts` | 191–207 |
| Admin-initiated payout | `supabase/functions/create-stripe-payout/handler.ts` | (entry) |
| Cancellation refund logic | `supabase/functions/process-cancellation/handler.ts` | 20–39, 122–180 |
| Dispute refund | `supabase/functions/process-dispute-refund/` | (entry) |
| Cancellation policy rules (canonical) | `src/lib/cancellationPolicy.ts` | (entry) |

---

## 3. Check-in confirmation trigger

### 3.1 Intended flow (target state)

1. RAV sends a check-in reminder (push, email, optional SMS) approximately 24 h before the check-in date and again at 09:00 local on the check-in day.
2. Renter confirms arrival from `/my-trips/<bookingId>` → server action updates `checkin_confirmations.confirmed_arrival = true` and `confirmed_at = NOW()`.
3. If the renter reports a problem instead, the same UI captures `issue_reported = true`, `issue_type` (e.g. `property_not_found`, `different_from_listing`, `access_denied`), `issue_description`, and an optional `verification_photo_path`. Reporting an issue **opens a dispute automatically**, mapped to the renter dispute categories in §5.1.
4. If neither confirmation nor issue arrives by `checkin_confirmations.confirmation_deadline` (set at booking creation to `check_in_date + 24h`; column declared NOT NULL in `docs/supabase-migrations/006_owner_verification.sql:198`), a cron marks `confirmed_arrival = true` with an `auto_confirmed_at` flag so escrow can proceed to release with a clear audit trail.

### 3.2 Current state (as of this doc revision)

- The `checkin_confirmations` table exists with the columns above.
- `process-deadline-reminders` and `send-booking-confirmation-reminder` edge functions reference the table.
- ~~**Gap A — no dedicated `confirm-checkin` server action.**~~ **CLOSED Session 63** — `supabase/functions/confirm-checkin/{handler,index}.ts` now handles both confirm and report-issue paths server-side: auth-gated (only the booking's renter), idempotent on re-tap, dispatches owner notification on confirm + RAV-team alert on issue. Optional verification photo upload to private `checkin-photos` bucket (migration 066) on the issue path. New `confirmed_at_source` enum tracks renter / auto / rav_admin distinction.
- ~~**Gap B — no auto-confirmation cron.**~~ **CLOSED Session 63** — `auto-confirm-checkins` edge fn (scheduled hourly) selects rows past `confirmation_deadline` with `confirmed_arrival IS NULL` AND `issue_reported = false`, bulk-updates them to `confirmed_arrival = true` with `confirmed_at_source = 'auto'`. Renter-confirmed vs auto-confirmed vs admin-confirmed is now distinguishable for fraud + dispute analytics via the new enum.
- ~~**Gap C — issue → dispute auto-link is partial.**~~ **CLOSED Session 63** — `ReportIssueDialog` now accepts a `prefill` prop with `category` + `description` + `photoNote`. After a check-in issue is recorded at `/checkin`, the issues card shows a "File a formal dispute" CTA that opens the dispute form with the relevant category pre-mapped (via `mapCheckinIssueToDisputeCategory`) and description pre-filled. Renter doesn't retype.

These gaps do not block today's escrow auto-release because release is gated on `check_out_date + 5d`, no open dispute, and no admin hold — not on `confirmed_arrival`. They do block accurate post-stay analytics and the renter-facing trust signal that "we know your stay went well."

---

## 4. Escrow auto-release rules

### 4.1 Hold period

- **Default:** 5 days after the booking's `check_out_date`.
- **Source:** `system_settings.escrow_hold_period_days` (`{"days": 5}` JSONB) — **closed Gap D in Session 63 / migration 068**. Resolved by `resolveHoldPeriodDays()` in `supabase/functions/process-escrow-release/handler.ts`. Falls back to default 5 if the setting row is missing or malformed (out-of-range / non-numeric values are rejected with fallback).
- **Configurability:** runtime — ops can change the value without a code change or redeploy. Admin UI for the setting is a fast-follow.

### 4.2 Eligibility (all must be true)

1. `booking_confirmations.escrow_status = 'verified'` (RAV staff has confirmed the resort booking is valid).
2. `listings.check_out_date <= NOW() − HOLD_PERIOD_DAYS`.
3. `booking_confirmations.payout_held = false` (no admin hold).
4. `bookings.status` is `confirmed` or `completed`.
5. `bookings.payout_status` is not already `paid` or `processing` (idempotency guard).
6. No `disputes` row for this booking with status in `('open', 'investigating', 'awaiting_response')`.
7. Owner has a complete Stripe Connect account (`profiles.stripe_account_id IS NOT NULL` and `profiles.stripe_payouts_enabled = true`); otherwise the escrow row is still released, but `bookings.payout_status` is set to `pending` with note "Manual payout required (no Stripe Connect)" (`process-escrow-release/index.ts:181–188`).

### 4.3 Execution

- `process-escrow-release/index.ts:191–207` calls `stripe.transfers.create()` against the owner's connected account, in USD, for `bookings.owner_payout` (computed at booking time as gross less platform commission).
- Commission is **15% default**, with **−2% for Pro owners** and **−5% for Business owners**, sourced from `system_settings` (`commission_rate_default`, `commission_pro_discount`, `commission_business_discount`).
- On success: `escrow_status='released'`, `escrow_released_at=NOW()`, `auto_released=true`, `bookings.payout_status='processing'`, `bookings.stripe_transfer_id=<id>`. The owner receives an email via Resend (lines 224–251).
- On Stripe failure: status stays `verified`, `bookings.payout_status='failed'`, error logged. Cron retries on the next run; admin can clear and retry from the Escrow tab.

### 4.4 Admin hold

Any RAV admin or staff member can set `booking_confirmations.payout_held = true` with a `payout_hold_reason` and the acting user's `payout_held_by`. This blocks auto-release indefinitely until cleared. Used when a dispute is suspected but not yet filed, when a regulatory query is open, or while waiting on owner KYC.

---

## 5. Dispute system

### 5.1 Categories

The `dispute_category` enum has **13 values** total: 8 declared in `supabase/migrations/026_dispute_resolution.sql:6–14` and 5 added in `supabase/migrations/041_expand_disputes.sql:5–9`.

**Renter-filed (typical):**
- `property_not_as_described`
- `access_issues`
- `safety_concerns`
- `cleanliness`
- `owner_no_show`

**Owner-filed (typical):**
- `renter_damage`
- `renter_no_show`
- `unauthorized_guests`
- `rule_violation`
- `late_checkout`

**Either party may file:**
- `cancellation_dispute`
- `payment_dispute`
- `other`

The schema does not enforce who can file which category — that is policy, surfaced in the UI gating (`ReportIssueDialog` shows different category lists based on role) and reinforced in the operational SOP.

### 5.2 Status flow

```
open → investigating → awaiting_response →
  resolved_full_refund | resolved_partial_refund | resolved_no_refund → closed
```

Defined in `supabase/migrations/026_dispute_resolution.sql:21–30`. A dispute can move forward or backward between `investigating` and `awaiting_response` as evidence is exchanged. Only `resolved_*` and `closed` are terminal.

### 5.3 Resolution authority

- **`rav_admin`** — full authority on all categories, including financial decisions and cross-party penalties.
- **`rav_staff`** — operational categories only: `cleanliness`, `late_checkout`, `rule_violation`, `unauthorized_guests`, `owner_no_show`, `renter_no_show`. **Must escalate to `rav_admin`** for `safety_concerns`, `payment_dispute`, `cancellation_dispute`, `renter_damage` over $500, any case with prior dispute history on either party, or anything legal counsel has flagged.
- **`rav_owner`** — RLS allows it (`supabase/migrations/026_dispute_resolution.sql:116, 129, 169`) but in practice this role does not handle individual disputes; access is reserved for governance / legal sign-off.

~~The role-to-category mapping above is **policy enforced in `AdminDisputes.tsx`**, not in the schema or RLS.~~ **Closed Session 63 / migration 069** — the role-to-category mapping is now enforced at the schema layer via the `can_resolve_dispute(category, user_id)` SECURITY DEFINER function and the new `"RAV team can update disputes by category"` UPDATE policy on `disputes`. The old catch-all RAV-team UPDATE policy is dropped. UI gating in `AdminDisputes.tsx` becomes defense-in-depth rather than the only enforcement.

### 5.4 Resolution actions

The system supports refund-amount decisions only:

- Full refund → `refund_amount = total_booking_amount`
- Partial refund → admin sets any value `0 < x < total`
- No refund → `refund_amount = 0`

The following are **not** natively supported and require manual workarounds (separate Stripe action plus admin note on the dispute):

- Split refunds (renter and owner both partially compensated from a single dispute).
- Holdbacks (release escrow minus a damage estimate that is later trued up).
- Rebooking credits in lieu of cash refund.
- Platform-fee waivers as part of resolution.

Tracked as **Gap F** (§9).

### 5.5 Evidence

- Up to 10 files per dispute, ≤10 MB each, stored in the `verification-documents` bucket.
- URLs persisted in `disputes.evidence_urls text[]` (`supabase/migrations/041_expand_disputes.sql:12`).
- Visible only to disputants and the RAV team (RLS).

---

## 6. SLAs by dispute type

These are **target SLAs for the operations team**. They are not enforced in code and there is no SLA-violation alerting today. Tracked as **Gap G** (§9).

"Business hours" until §9 Gap G is closed means **09:00–18:00 ET, Monday–Friday, excluding US federal holidays**.

| Category | Triage (admin sees) | First response to filer | Resolution target |
|---|---|---|---|
| `safety_concerns` | **2 h** business hours / **6 h** off-hours | 4 h | 24 h |
| `owner_no_show` (renter on-site) | **2 h** | 4 h | 24 h |
| `access_issues` (renter on-site) | **2 h** | 4 h | 24 h |
| `property_not_as_described` (renter on-site) | 4 h | 12 h | 48 h |
| `cleanliness` | 8 h | 24 h | 5 days |
| `renter_damage` | 8 h | 24 h | 10 days (allow owner evidence window) |
| `cancellation_dispute` | 8 h | 24 h | 5 days |
| `payment_dispute` | 8 h | 24 h | 5 days (sync with Stripe chargeback timeline if applicable) |
| `unauthorized_guests` | 24 h | 48 h | 7 days |
| `rule_violation` | 24 h | 48 h | 7 days |
| `late_checkout` | 24 h | 48 h | 7 days |
| `renter_no_show` | 24 h | 48 h | 7 days |
| `other` | 24 h | 48 h | 10 days |

**Definitions**

- *Triage* — time until a dispute is read by a human and assigned (`disputes.assigned_to`).
- *First response* — time until the filer receives a substantive (non-auto) message acknowledging the dispute.
- *Resolution* — time until `status` is set to one of `resolved_full_refund | resolved_partial_refund | resolved_no_refund`.

**On-site categories** (`safety_concerns`, `owner_no_show`, `access_issues`, on-site `property_not_as_described`) override normal business hours — the renter is currently at the resort and cannot wait until Monday.

---

## 7. State-specific regulatory considerations

> **Disclaimer:** This section is **informational, not legal advice**. It captures RAV's current understanding of the regulatory landscape so engineering and operations have a shared mental model. Every claim below must be validated by counsel under #80 before public launch. Where this section disagrees with counsel's guidance, counsel wins.
>
> **Current state:** the platform has **no jurisdiction-aware logic in code today**. The rules below describe what we currently rely on Stripe for and the gaps that #80 (lawyer review) and #127 (business formation) need to close.

### 7.1 Money transmission

RAV does not hold or transmit customer funds itself. Stripe Connect, with a destination-charge model, handles:

- Card acquiring and PCI scope (RAV is SAQ A).
- Money-transmitter licensing in all US states (Stripe is licensed; RAV does not need parallel licenses as long as funds never leave Stripe's custody).
- Owner KYC via Stripe Connect Express onboarding.
- 1099-K issuance to owners exceeding the IRS threshold.

**Implication:** the 5-day escrow hold (§4.1) is a **product feature** — RAV-controlled timing of the Stripe transfer — not a custodial action. We never break the "funds stay in Stripe" invariant.

### 7.2 Timeshare-specific rules

The 117 resorts in the directory are vacation-club inventory. State timeshare statutes generally regulate the *sale* of timeshare interests, not the *rental* of an owner's unused week. However, several states have enacted rental-related rules that affect platforms:

- **Florida (Ch. 721 F.S.)** — owner-to-owner rental is permitted; platforms facilitating rental of timeshare weeks must avoid representations that could be construed as the *sale* of a timeshare interest. **Implication:** RAV listing copy must not use language like "buy a week," "ownership transfer," or "deed."
- **Hawaii** — transient accommodations tax (TAT) applies to stays under 180 days. Stripe Tax (when activated under #127) handles the calculation; RAV does not currently file the returns.
- **Tennessee** — short-term-rental ordinances vary by city (e.g. Nashville Metro Code 17.16.250.E, Memphis short-term-rental permit). Compliance falls to the host, not the platform; the public payment-policy disclosure should make this explicit.

**Required for launch (per #80 lawyer pass):**

1. Per-jurisdiction *display copy* — surface local cancellation rights, transient occupancy taxes, and disclosure language at checkout.
2. A `jurisdiction` field on `bookings` (derived from resort country / state) so display logic can branch.
3. Documented carve-outs where timeshare rules differ from general short-term-rental rules.

### 7.3 Consumer-protection cancellation overrides

A handful of states (e.g. **California Civil Code §1689**, **New York General Business Law**) impose statutory cancellation rights that may override the chosen contract policy tier. Today, RAV applies the chosen policy (`flexible | moderate | strict | super_strict`) uniformly. Counsel to confirm whether any state requires forced flexibility for short-notice cancellations in a vacation-rental context. Tracked as part of **Gap I** (§9).

### 7.4 Sales tax and TOT

`docs/supabase-migrations/023_fee_breakdown_stripe_tax.sql` contains the `fee_breakdown_stripe_tax` scaffolding but is **not active** until #127 closes (LLC + EIN required for Stripe Tax registration). Until then, every booking line item shows pre-tax pricing. Once Stripe Tax is on, jurisdiction-resolved tax appears as a separate `tax_amount` field already present in the cart UI.

### 7.5 Dispute and chargeback handling

A renter who files a credit-card chargeback bypasses the RAV dispute system. Stripe routes the dispute to RAV; RAV must respond within Stripe's chargeback-evidence window (typically 7–21 days depending on card network).

~~The internal `disputes` row should be created automatically when a Stripe `charge.dispute.created` webhook fires, with category `payment_dispute` and `priority='high'`. Auto-creation from the Stripe webhook is **Gap H** (§9).~~ **CLOSED Session 63** — `handleChargeDisputeCreated` in `supabase/functions/stripe-webhook/handler.ts` mirrors every Stripe chargeback to a `disputes` row with `category='payment_dispute'`, `priority='high'`, evidence_urls populated with the Stripe dashboard URL, and `stripe_dispute_id` set so re-firing the webhook is idempotent (UNIQUE index on the column via migration 070). Orphan chargebacks (no matching booking) trigger a RAV team alert for manual investigation.

---

## 8. Currency and locale

- **Single currency (USD) today.** The schema has currency columns (`bookings.currency`) but no FX logic. Owner payouts are USD-only. Cross-border travelers pay USD via Stripe; their card issuer handles the FX.
- Multi-currency support is out of scope for launch and not on the active roadmap.
- Locale (date, currency formatting) follows the renter's browser, not the resort's location.

---

## 9. Open gaps and tracking

Each gap is tracked as a discrete GitHub issue. Tier assignment and ordering live in `docs/PRIORITY-ROADMAP.md`; this doc only enumerates and links.

| ID | Gap | Priority | Issue |
|---|---|---|---|
| ~~A~~ | ✅ **Closed Session 63** — `confirm-checkin` edge fn shipped with photo upload + idempotency + notifications | — | [#461](https://github.com/rent-a-vacation/rav-website/issues/461) |
| ~~B~~ | ✅ **Closed Session 63** — `auto-confirm-checkins` scheduled edge fn (hourly batch) flips deadline-elapsed rows with `confirmed_at_source='auto'` | — | [#462](https://github.com/rent-a-vacation/rav-website/issues/462) |
| ~~C~~ | ✅ **Closed Session 63** — `ReportIssueDialog` accepts `prefill` prop; check-in issue surfaces a "File a formal dispute" CTA | — | [#467](https://github.com/rent-a-vacation/rav-website/issues/467) |
| ~~D~~ | ✅ **Closed Session 63** — moved to `system_settings.escrow_hold_period_days`; `process-escrow-release` refactored to handler.ts split (DEC-037) | — | [#468](https://github.com/rent-a-vacation/rav-website/issues/468) |
| ~~E~~ | ✅ **Closed Session 63** — `can_resolve_dispute(category, user_id)` helper + new category-aware UPDATE policy on disputes (migration 069) | — | [#463](https://github.com/rent-a-vacation/rav-website/issues/463) |
| F | No native support for split refunds, holdbacks, rebooking credits, or platform-fee waivers | Post-launch | [#469](https://github.com/rent-a-vacation/rav-website/issues/469) |
| G | SLAs are documented here but not enforced in code (no alerting, no business-hours definition in `system_settings`) | Pre-launch (operational) | [#464](https://github.com/rent-a-vacation/rav-website/issues/464) |
| ~~H~~ | ✅ **Closed Session 63** — `handleChargeDisputeCreated` mirrors Stripe chargebacks to `disputes` (idempotent via `stripe_dispute_id` UNIQUE in migration 070) | — | [#465](https://github.com/rent-a-vacation/rav-website/issues/465) |
| I | No `jurisdiction` field on bookings; no per-state disclosure logic; no per-state cancellation-override rules | Pre-launch | [#466](https://github.com/rent-a-vacation/rav-website/issues/466) (linked to #80) |

---

## 10. Cross-references

- `docs/support/processes/dispute-resolution.md` — admin-facing dispute workflow (operational SOP, complementary to §5 here).
- `docs/support/policies/cancellation-policy.md` — public-facing cancellation tiers (renter-readable).
- `docs/support/policies/payment-policy.md` — public-facing payment policy (currently draft, blocked on #80).
- `docs/RAV-PRICING-TAXES-ACCOUNTING.md` — fee structure, commission tiers, accounting flow (DEC-022).
- `docs/ARCHITECTURE.md` §"Booking confirmation + escrow" — system-architecture summary.
- `src/lib/cancellationPolicy.ts` — canonical refund-tier rules (mirrored in `process-cancellation/handler.ts`).
- Migrations referenced: `docs/supabase-migrations/006_owner_verification.sql`, `docs/supabase-migrations/023_fee_breakdown_stripe_tax.sql`, `supabase/migrations/012_phase13_core_business.sql`, `supabase/migrations/024_escrow_automation.sql`, `supabase/migrations/026_dispute_resolution.sql`, `supabase/migrations/041_expand_disputes.sql`.

---

## 11. Revision history

| Date | Change | Author |
|---|---|---|
| 2026-04-27 | Initial draft. Captures current implementation, the nine open gaps (A–I), and the regulatory landscape RAV must address before #80 lawyer pass. | Session 60+ |
| 2026-04-27 | Tightening pass. Corrected migration paths (006 / 023 archived in `docs/supabase-migrations/`), fixed line-number citations (`booking_confirmations` 131–162; confirmation insert at handler.ts:236–266; eligibility uses `stripe_payouts_enabled`). Added six-state lifecycle diagram, owner-confirmation timer details, Pre-Booked vs Wish-Matched distinction, complete eligibility list (7 conditions), commission-tier note, restructured §5.1 dispute categories by typical filer, regulatory disclaimer at §7, business-hours definition for §6 SLAs. | Session 61 |
| 2026-04-28 | All nine gaps filed as discrete GitHub issues #461–#469. §9 table updated with issue links + dependency notes. Spec is now self-referential — clicking any gap leads to its tracking issue. | Session 61 (follow-up) |
