---
last_updated: "2026-04-21T12:43:12"
change_ref: "ed19c48"
change_type: "session-57-phase22-B2"
status: "active"
title: "Refund Policy"
doc_type: "policy"
audience: ["renter", "owner", "admin"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["refund", "cancellation", "stripe", "dispute", "processing-fee", "payout"]
---

# Refund Policy

## Summary

Refunds flow through Stripe using the original payment method and typically settle in 5–10 business days. Refund amounts are determined by the listing's cancellation policy (for renter-initiated cancellations), a mandatory 100% rule (for owner-initiated cancellations), or an admin override (for dispute-driven refunds).

## Details

### Refund triggers

Refunds originate from one of three paths:

1. **Renter-initiated cancellation** — refund percentage driven by the listing's `cancellation_policy` per [`cancellation-policy.md`](./cancellation-policy.md). Executed by the `process-cancellation` edge function.
2. **Owner-initiated cancellation** — 100% refund regardless of policy. Owner's `cancellation_count` is incremented. Executed by the same `process-cancellation` edge function.
3. **Dispute-driven refund** — admin reviews the dispute, decides refund amount (can be any percentage, including full), and executes via `process-dispute-refund` edge function. Policy is not applied.

### Stripe execution

- All refunds go through the Stripe Refunds API against the original `payment_intent_id` stored on the booking.
- Stripe retains its **payment processing fee** on refunds (non-recoverable).
- Refund settlement time is **5–10 business days**, depending on the cardholder's bank. International cards can take up to 14 days.
- Partial refunds are issued as a single Stripe refund operation at the computed amount, not multiple transactions.

### What's refundable

| Component | Renter cancellation | Owner cancellation | Dispute |
|---|---|---|---|
| Nightly rate × nights | Per cancellation policy % | 100% | Per admin decision |
| RAV commission (15%) | Retained by RAV | Refunded | Per admin decision |
| Stripe processing fee | Retained by Stripe | Retained by Stripe | Retained by Stripe |
| Cleaning / other add-ons | Per cancellation policy % | 100% | Per admin decision |

### RAV commission handling

- **Renter cancels (partial refund):** RAV commission is retained on the non-refundable portion of the booking. The refunded portion's commission is waived.
- **Owner cancels:** Commission is fully waived since the booking did not complete.
- **Dispute in renter's favor:** Commission is typically waived; admin notes capture exceptions.

### Owner payout implications

If the booking is in **escrow** (payment received, stay not yet completed):

- A full or partial refund reduces the amount that will release to the owner's Stripe Connect account.
- If the refund happens after owner payout has been initiated, RAV pulls the refund amount from the owner's next pending payout (or issues a reverse transfer).

If the booking is **post-stay** (funds already released):

- Dispute refunds trigger a `stripe_transfer_id` reversal or a direct charge against the owner's Stripe account. This only happens for dispute-driven refunds — never for policy-driven cancellations, which must occur before check-in.

### Notifications

Every refund triggers:

- Renter: `booking_cancelled` or `dispute_resolved` notification (in-app + email)
- Owner: `booking_cancelled_by_renter`, `booking_cancelled_by_owner`, or `dispute_resolved_against_you` notification
- Cancellation reason is captured in `cancellation_requests.reason` and displayed in both users' history

### Dispute override of policy

When a dispute is filed during or after a cancellation window, the standard cancellation policy is **not** automatically applied. The dispute is triaged by an admin who decides:

- Accept renter's version → issue refund beyond what policy would normally allow (commission waived)
- Accept owner's version → no refund beyond policy (renter keeps whatever the policy grants)
- Split decision → partial refund at admin's discretion

See [`dispute-resolution.md`](../processes/dispute-resolution.md) for the full dispute workflow.

### No-refund scenarios

- Super strict policy with any cancellation (barring a dispute ruling)
- Cancellations inside the no-refund window of a given policy
- Completed stays without a dispute
- Bookings where the renter fails to show up without communicating (no refund; owner keeps the revenue)

## Examples

**Example 1 — Renter cancels on a moderate policy**

Booking total: $750 (5 nights × $150 nightly rate). Moderate policy. Renter cancels 6 days before check-in → 100% refund tier.

- Nightly rate refund: $750
- RAV commission ($112.50 at 15%): waived
- Stripe processing fee: retained by Stripe (roughly $22 on $750)
- Renter receives: $750 (gross), settles in 5–10 business days

**Example 2 — Renter cancels on a strict policy, inside the window**

Booking total: $500. Strict policy. Renter cancels 4 days before check-in → 0% refund tier.

- Refund: $0
- Renter may file a dispute if a concrete issue exists

**Example 3 — Owner cancels**

Booking total: $1,200. Any policy. Owner cancels 8 days before check-in.

- Full refund: $1,200 (all components)
- RAV commission: waived
- Owner's `cancellation_count` +1
- Owner notified with `booking_cancelled_by_owner`
- Renter notified and offered an alternative listing recommendation

**Example 4 — Dispute ruling in renter's favor**

Booking: $900. Strict policy. Renter checks in, finds the property in unusable condition, files a dispute with photos. Admin rules for the renter.

- Admin issues 100% refund: $900 via `process-dispute-refund`
- Escrow pull: $900 deducted from owner's pending payout
- Owner notified of dispute outcome

**Example 5 — Late cancellation by renter, Stripe already settled**

Booking: $450. Moderate policy. Renter cancels 6 hours before check-in → 0% refund.

- Refund: $0
- Owner retains full amount on their Stripe Connect account after stay completes

## Related

- [`cancellation-policy.md`](./cancellation-policy.md) — refund percentages per policy tier
- [`dispute-resolution.md`](../processes/dispute-resolution.md) — when a dispute overrides the refund policy
- [`payment-policy.md`](./payment-policy.md) — public-facing fee and processing terms (legal-blocked)
- [`booking-workflow.md`](../processes/booking-workflow.md) — where refunds sit in the traveler lifecycle
- Code: `src/lib/cancellationPolicy.ts` — refund percentage rules
- Code: `supabase/functions/process-cancellation/` — policy-driven refund execution
- Code: `supabase/functions/process-dispute-refund/` — dispute-driven refund execution
