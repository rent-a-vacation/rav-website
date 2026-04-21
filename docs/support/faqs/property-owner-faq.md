---
last_updated: "2026-04-21T22:35:57"
change_ref: "1d0c62c"
change_type: "session-57-phase22-B3"
status: "active"
title: "Property Owner FAQ"
doc_type: "faq"
audience: ["owner"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["faq", "owner", "listing", "verification", "payout", "stripe-connect", "bidding", "offers"]
---

# Property Owner FAQ

## Summary

Answers to the most common questions property owners ask about listing timeshare weeks, managing Offers and bookings, getting paid, and operating on Rent-A-Vacation.

## Details

### Getting started

#### How do I list a property?

1. Sign up and wait for RAV team approval (manual review — typically 1 business day)
2. Complete the Welcome onboarding (T&C reconfirm + role selection)
3. Request the `property_owner` role upgrade
4. Upload verification documents (deed, certificate, or ID)
5. Once verified, create a listing from `/owner-dashboard` → My Listings → Create Listing

#### What documents do I need for verification?

One of: your membership deed, a certificate from the resort, or government-issued ID matching the property owner name. Upload from `/owner-dashboard` → Account → Verification. Review typically completes in 1-2 business days.

#### Can I list a week I don't yet own?

No. Verification requires proof of ownership. If you're in the process of acquiring, wait until you have the documents.

### Pricing

#### How do I set the right price?

Use the built-in **RAV SmartEarn** calculator and the pricing suggestions during listing creation. They compare to other brands/destinations. You'll also see a Fair Value badge that tells travelers how your price compares to market — aim for "Great" or better to increase bookings.

#### What's the 15% commission?

RAV takes 15% of every booking (included in the displayed total, so travelers see one price). Tier discounts: Owner Pro gets 13%, Owner Business gets 10%.

#### Can I change my price after listing?

Yes. Edit from `/owner-dashboard` → My Listings → Edit. Already-submitted Offers and completed bookings are not affected.

### Two listing types (Pre-Booked vs Wish-Matched)

#### What's the difference between Pre-Booked and Wish-Matched?

- **Pre-Booked Stay** — you already have the resort reservation. Listing goes live on `/rentals`. Traveler books instantly.
- **Wish-Matched Stay** — a traveler posts a Wish, you submit an Offer with a listing you can secure. If the traveler accepts, a wish-matched listing is auto-created. After the traveler pays, you have a deadline to go confirm the reservation.

Most owners do both: proactively list Pre-Booked weeks AND watch Wishes for Offer opportunities.

#### Why don't my wish-matched listings appear in public search?

By design. Wish-matched listings are reserved for the specific traveler whose Wish matched. They never show up in `/rentals` or other travelers' searches. This prevents cross-contamination between a Wish you were matched to and public inventory.

### Managing Offers (bidding)

#### How do I enable bidding on my listing?

Toggle `Allow Offers` during listing creation or edit. Travelers can then submit Offers below your listed price, which you review and accept/reject.

#### Can I set a minimum Offer?

Yes. Set `Minimum Offer Amount` on the listing. Offers below the floor are auto-rejected.

#### Where do I see Offers?

`/owner-dashboard` → Bookings & Earnings → Bids tab. Each Offer shows the traveler's profile, amount, proposed dates (if applicable), and any note.

#### What happens when I accept an Offer?

The traveler is prompted to pay via Stripe Checkout at the accepted amount. Once payment completes, it becomes a normal booking.

#### Can I counter-offer?

Not as a first-class feature. Reject with a note ("I can't do below $850"), and the traveler can re-Offer. You can also negotiate via the messaging thread.

### Responding to Wishes

#### How do I find Wishes to Offer on?

`/owner-dashboard` → Bookings & Earnings → Opportunities tab. Filtered to Wishes matching your portfolio (your brands, destinations, date ranges).

#### Do I have to secure the reservation before Offering?

No. Submit your Offer based on what you can deliver. **Once the traveler accepts and pays, you have a confirmation deadline** (typically 72 hours) to actually secure the resort reservation. Miss the deadline → booking auto-cancels + full refund to traveler + impacts your cancellation metrics.

#### What if I can't confirm in time?

Don't Offer if you're not sure you can deliver. If a true emergency prevents confirmation, cancel proactively — 100% refund to traveler, and you avoid the automated failure mark.

### Bookings & check-ins

#### Where do I see my upcoming bookings?

`/owner-dashboard` → Bookings & Earnings → All Bookings. Shows upcoming, active, past, and cancelled, with filtering + iCal calendar export.

#### Can I export my bookings to my calendar?

Yes. Use the "Export Calendar" button — downloads an `.ics` file compatible with Google Calendar, Apple Calendar, Outlook, etc.

#### How do I message a confirmed renter?

Open the booking from the dashboard, use the Messages tab. Unified messaging thread — same inbox as pre-booking inquiries, owner Offers, etc.

#### What if the renter is a no-show?

No-shows don't automatically refund. The revenue stays with you (per policy). If the renter claims a legitimate reason, they can file a dispute.

### Getting paid

#### How do I set up payouts?

`/owner-dashboard` → Earnings → Connect Stripe. Completes Stripe Connect (Express account) onboarding in 5-10 minutes. Once onboarded, payouts flow automatically.

#### When do payouts release?

After each booking's stay completes and with no open dispute, the transfer posts to your Stripe account. From Stripe it lands in your bank per your payout schedule (usually 2-3 business days).

#### What's "escrow"?

Funds are held from the booking date until after the stay ends. This protects both sides from disputes. See [`billing-faq.md`](./billing-faq.md).

### Cancellations on your side

#### What if I have to cancel a confirmed booking?

Use the Cancel Booking dialog from the booking detail. **Owner cancellations always issue a full refund to the traveler**, regardless of the cancellation policy. Your `cancellation_count` increments — repeated cancellations may trigger listing suspension or account review.

### Tier features (Free / Pro / Business)

- **Free:** standard listing + Offer management
- **Pro:** priority listing placement + lower commission (13%)
- **Business:** dedicated account manager + lowest commission (10%)

See [`subscription-terms.md`](../policies/subscription-terms.md).

### Disputes against your listing

#### A renter filed a dispute against me — what happens?

Admin reviews evidence from both sides. You can upload your own evidence from the dispute thread. Admin decision determines refund amount (if any). Open disputes pause escrow release until resolved.

#### Can I appeal a dispute decision?

Open a follow-up dispute with new evidence and request admin review. Decisions are not strictly final, but repeated appeals without new information are closed quickly.

## Examples

**Example 1 — Owner asks how to accept an Offer**

"I got an Offer for $750 on my $900 listing." → `/owner-dashboard` → Bookings & Earnings → Bids tab. Click Accept. Traveler gets prompted to pay $750. Booking is created on payment completion.

**Example 2 — Owner worried about a Wish deadline**

"I accepted a Wish-Match but can't confirm the reservation." → If time allows, cancel proactively from the booking detail — full refund + no automated failure mark. If you silently miss the deadline, the booking auto-cancels AND your owner record shows a failure, which affects your listing visibility.

**Example 3 — Owner wants to offer a discount during slow season**

"Can I temporarily drop my prices?" → Yes. Edit your listings to the new rate. Already-submitted Offers and confirmed bookings are not affected, but new travelers will see the new price.

## Related

- [`bidding-process.md`](../processes/bidding-process.md) — Offer lifecycle in both directions
- [`booking-workflow.md`](../processes/booking-workflow.md) — traveler-side flow
- [`cancellation-policy.md`](../policies/cancellation-policy.md) — policy tiers
- [`refund-policy.md`](../policies/refund-policy.md) — refund rules + owner payout impact
- [`billing-faq.md`](./billing-faq.md) — payout timing + 1099-K + Stripe Connect
- [`subscription-terms.md`](../policies/subscription-terms.md) — owner tier benefits (legal-blocked)
