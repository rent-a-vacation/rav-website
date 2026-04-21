---
last_updated: "2026-04-21T12:24:25"
change_ref: "e51b76d"
change_type: "session-57-phase22-A1"
status: "active"
title: "Cancellation Policy"
doc_type: "policy"
audience: ["renter", "owner", "admin"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["cancellation", "refund", "booking", "policy", "flexible", "moderate", "strict", "super_strict"]
---

# Cancellation Policy

## Summary

Every listing is assigned one of four cancellation policies by the owner: **flexible**, **moderate**, **strict**, or **super_strict**. Each policy defines refund percentages based on how far in advance of check-in the traveler cancels. Owner-initiated cancellations always result in a full refund to the traveler.

## Details

### Policy tiers

| Policy | Refund rules |
|---|---|
| **Flexible** | 100% refund if cancelled 24+ hours before check-in. 0% refund within 24 hours. |
| **Moderate** | 100% refund if cancelled 5+ days before check-in. 50% refund between 24 hours and 5 days before check-in. 0% refund within 24 hours. |
| **Strict** | 50% refund if cancelled 7+ days before check-in. 0% refund within 7 days. |
| **Super Strict** | Non-refundable under any circumstances. |

The authoritative rule set lives in `src/lib/cancellationPolicy.ts` — specifically `getCancellationPolicyRules()` and `getCancellationDeadlines()`. Any change to refund logic must happen there and be mirrored in this document.

### Deadline calculation

Deadlines are computed from the traveler's **check-in date** (not booking date). The deadline is interpreted as local midnight on the cutoff date. For example, with a moderate policy and a check-in date of 2026-06-15:

- Full-refund deadline: 2026-06-10 (check-in minus 5 days)
- Partial-refund deadline: 2026-06-14 (check-in minus 1 day)
- After 2026-06-14: no refund

### Owner-initiated cancellations

When an owner cancels a confirmed booking, the traveler receives a **100% refund regardless of policy**. Additionally:

- The owner's `cancellation_count` is incremented
- A cancellation record is created in `cancellation_requests`
- The listing is returned to active state (if still within its date window)
- A notification is dispatched to the traveler

Repeated owner cancellations may result in listing suspension or account review. See [`dispute-resolution.md`](../processes/dispute-resolution.md) for the escalation path.

### Non-refundable components

These are always excluded from refund calculation:

- Payment processor fees (Stripe retains its processing fee on refunds)
- RAV commission on already-paid bookings (retained per booking terms)

The refunded amount is the refund percentage applied to the **nightly rate × nights**, not the total paid.

### Dispute override

If a traveler files a dispute (e.g., property not as described, owner no-show), the standard cancellation policy is **not** applied. The dispute follows its own review process — see [`dispute-resolution.md`](../processes/dispute-resolution.md). An admin may override the policy-driven refund and issue a different amount.

## Examples

**Example 1 — Flexible policy, cancelling 2 days before check-in**

Booking: 3 nights × $200 = $600. Check-in: April 30. Cancelled: April 28.

Rule applied: "24+ hours before check-in → 100% refund."
Refund: $600 (minus Stripe processing fee).

**Example 2 — Moderate policy, cancelling 3 days before check-in**

Booking: 5 nights × $150 = $750. Check-in: May 10. Cancelled: May 7.

Rule applied: "1–4 days before check-in → 50% refund."
Refund: $375.

**Example 3 — Strict policy, cancelling the same day as booking (for a trip next week)**

Booking: 2 nights × $250 = $500. Check-in: May 20. Cancelled: May 14 (6 days before).

Rule applied: "Less than 7 days before check-in → 0% refund."
Refund: $0. Traveler may still file a dispute if there is a concrete issue.

**Example 4 — Super strict, any cancellation**

Booking: 7 nights × $300 = $2,100. Any cancellation date.

Rule applied: "Non-refundable."
Refund: $0.

**Example 5 — Owner cancels a confirmed booking**

Booking: 4 nights × $180 = $720. Owner cancels 10 days before check-in.

Rule applied: owner-initiated → 100% refund regardless of policy.
Refund: $720. Owner's `cancellation_count` +1.

## Related

- [`refund-policy.md`](./refund-policy.md) — how refunds are processed, timelines, and Stripe handling
- [`booking-terms.md`](./booking-terms.md) — public-facing terms of service for bookings
- [`dispute-resolution.md`](../processes/dispute-resolution.md) — when a dispute overrides the standard cancellation policy
- [`booking-workflow.md`](../processes/booking-workflow.md) — where cancellation fits in the traveler lifecycle
- Code: `src/lib/cancellationPolicy.ts` — authoritative rule engine
- Code: `supabase/functions/process-cancellation/` — refund execution
