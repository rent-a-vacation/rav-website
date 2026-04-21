---
last_updated: "2026-04-21T22:35:57"
change_ref: "1d0c62c"
change_type: "session-57-phase22-B3"
status: "active"
title: "Booking FAQ"
doc_type: "faq"
audience: ["renter"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["faq", "booking", "renter", "traveler", "dates", "check-in", "confirmation"]
---

# Booking FAQ

## Summary

Answers to the most common questions travelers ask about making, managing, and completing a booking on Rent-A-Vacation.

## Details

### How do I book a property?

Find a listing you like on `/rentals` or through search, click **Book Now**, and complete payment via Stripe Checkout. Pre-Booked listings confirm instantly; Wish-Matched listings confirm after the owner verifies their resort reservation (see [`booking-workflow.md`](../processes/booking-workflow.md)).

### Can I change my dates after booking?

No. Because timeshare listings are for specific resort weeks the owner already holds (or must hold), the dates are fixed. If your plans change, cancel per the listing's cancellation policy and book another listing.

### When will I get my confirmation number?

- **Pre-Booked Stays:** Immediately after payment, visible in `/my-trips` → booking detail view.
- **Wish-Matched Stays:** After the owner confirms their resort reservation (they have a deadline). You'll receive a `wish_owner_confirmed` notification.

### What is a Pre-Booked Stay vs a Wish-Matched Stay?

- **Pre-Booked Stay** — the owner already holds a resort reservation for those specific dates. You book it, you're confirmed instantly.
- **Wish-Matched Stay** — you posted a Wish describing what you wanted; an owner submitted an Offer; you accepted. The owner has a short window after your payment to verify the reservation is still held.

See the `Pre-Booked` / `Wish-Matched` badge on every booking to know which you're in.

### What if my booking doesn't confirm (Wish-Matched)?

If the owner can't confirm the reservation within their deadline, the booking is automatically cancelled and you receive a **full refund**. Your Wish is returned to active state so other owners can Offer. You'll be notified via `wish_owner_failed_to_confirm`.

### Can I message the owner before I book?

Yes. On any listing page, use **Ask the Owner** to open a pre-booking inquiry. Messages are threaded and appear in your unified inbox.

### What fees are included in the price?

- Nightly rate × nights (set by the owner)
- 15% RAV commission (already included in the displayed total)
- Stripe processing fee (included)
- Taxes (if the owner's region requires and `STRIPE_TAX_ENABLED` is on)

No surprise fees at checkout. The total you see is the total you pay.

### Can I bring extra guests?

The listing shows a maximum guest count. Exceeding it without informing the owner can be grounds for the owner to deny check-in. If you need to adjust guests, message the owner first.

### What happens if I need to cancel?

Your refund depends on the listing's cancellation policy (flexible, moderate, strict, or super_strict). Each has its own refund schedule based on how far in advance you cancel. See [`cancellation-policy.md`](../policies/cancellation-policy.md).

### I think something is wrong with the booking / property — what do I do?

Open **Report Issue** from the booking detail view. Pick the category that best matches your situation (property_not_as_described, access_issues, safety_concerns, cleanliness, owner_no_show, cancellation_dispute, payment_dispute, other), attach photos if relevant, and submit. See [`dispute-resolution.md`](../processes/dispute-resolution.md).

### Can I leave a review?

Yes, after your stay. Reviews help other travelers evaluate listings and help the best owners stand out.

### Can I save a listing to look at later?

Yes — use the heart icon on any listing card or detail page to add to **Favorites** in `/my-trips` → Favorites.

### Can I get notified about new listings matching my criteria?

Yes. Save a search from `/rentals` and we'll notify you when new listings match. Price drops on saved searches also trigger alerts.

## Examples

**Example 1 — Traveler wants to move a booking by one week**

Answer: not supported. Dates are fixed to the owner's resort reservation. Cancel this booking per its policy, then book a matching listing on the new dates.

**Example 2 — Wish-Matched booking goes past the confirm deadline**

Answer: full refund issued automatically. The Wish is reactivated so other owners can Offer. The traveler did nothing wrong and pays nothing.

**Example 3 — Traveler wants to add a guest post-booking**

Answer: possible if within the listing's maximum. Message the owner through the booking thread to update guest count (informational). No platform-side change needed unless total exceeds the listing's max.

## Related

- [`booking-workflow.md`](../processes/booking-workflow.md) — full booking lifecycle
- [`cancellation-policy.md`](../policies/cancellation-policy.md) — refund rules per policy tier
- [`refund-policy.md`](../policies/refund-policy.md) — how and when refunds settle
- [`dispute-resolution.md`](../processes/dispute-resolution.md) — filing an issue
- [`billing-faq.md`](./billing-faq.md) — payment-specific questions
- [`traveler-faq.md`](./traveler-faq.md) — general traveler questions
