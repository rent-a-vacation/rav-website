---
last_updated: "2026-04-21T12:43:12"
change_ref: "ed19c48"
change_type: "session-57-phase22-B2"
status: "active"
title: "Booking Workflow (Traveler Journey)"
doc_type: "process"
audience: ["renter", "admin"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["booking", "workflow", "renter", "traveler", "journey", "pre-booked", "wish-matched"]
---

# Booking Workflow (Traveler Journey)

## Summary

A traveler browses listings, books a Pre-Booked Stay (instant confirmation) or goes through the Wish-Matched path (owner-confirmation after payment), pays via Stripe Checkout, receives confirmation, and completes their stay. The full flow is modeled declaratively in `src/flows/traveler-lifecycle.ts` and visualised at `/architecture`.

## Details

### Entry points

- **`/` Landing page** — first contact; CTA to search or explore destinations.
- **`/destinations`** — curated browse by region and state with live listing counts.
- **`/rentals`** — search all active listings; supports text chat (RAVIO) + voice search (VAPI). Filters: dates, brand, price, amenities, destination.

### Account setup

1. `/signup` — email/password or Google OAuth (`profiles`, `user_roles`).
2. `/pending-approval` — account awaits RAV team review; new accounts do not self-serve.
3. `/welcome` — post-approval onboarding gate: T&C re-confirmation + role-specific CTAs. Writes to `terms_acceptance_log` with `post_approval_gate` method.

### Two booking paths

The marketplace supports two distinct flow types per DEC-034:

#### Pre-Booked Stay (instant confirmation)

Owner already holds the resort reservation. Listing has `source_type: 'pre_booked'`.

1. Traveler views listing (`/property/:id`)
2. Optional: opens **Inquiry Dialog** to ask the owner a question pre-booking (`listing_inquiries` + `inquiry_messages` tables)
3. Clicks "Book Now" → `/checkout/:listingId`
4. Stripe Checkout via `create-booking-checkout` edge function (15% RAV commission added; Stripe Tax gated by `STRIPE_TAX_ENABLED`)
5. Payment success → `verify-booking-payment` flips `owner_confirmation_status` to `owner_confirmed` immediately (no countdown, no "please confirm at resort" email)
6. `booking_confirmed` notification dispatched (in-app + email)
7. Booking visible at `/my-trips` with `ListingTypeBadge` showing "Pre-Booked"

#### Wish-Matched Stay (post-payment owner confirmation)

Traveler posted a Wish first; owner submitted an Offer in response; traveler accepted. Listing has `source_type: 'wish_matched'`.

1. Traveler posts a Wish (`travel_requests` table)
2. Owner submits an Offer (`travel_proposals` table)
3. Traveler accepts the Offer → auto-generates a wish-matched listing (`useBidding.ts`)
4. Traveler books the wish-matched listing through the same `/checkout` flow
5. Payment success → `verify-booking-payment` sets `owner_confirmation_status: 'pending_owner'` with a deadline
6. **Owner has N days** to confirm the resort reservation is still held
7. Owner confirms → booking active. Dispatches `wish_owner_confirmed` to traveler.
8. Owner fails to confirm before deadline → booking cancelled + full refund. Dispatches `wish_owner_failed_to_confirm`.
9. `wish_owner_confirming` is sent to the traveler right after payment so they know about the countdown.

In either path, **wish-matched listings never appear in public search** (filtered by `useActiveListings` to `source_type='pre_booked'` only).

### Making an Offer on a listing

A traveler can also make a per-listing Offer (treating a listing like an auction):

1. On a listing with `allow_bids = true`, the traveler opens `BidFormDialog`
2. Offer amount + optional date range stored in `listing_bids`
3. Owner reviews in `OwnerBookings` > Bids tab; accepts or rejects
4. Accepted offer: traveler receives `bid_accepted` notification and books at the Offer price
5. Offer rejection can include a reason; traveler can re-submit

### Post-booking

- **`/my-trips`** — Overview (upcoming / past), Bookings (detail view per DEC-035), Offers, Favorites, Saved Searches
- **Booking detail view** — fee breakdown, cancellation policy, resort confirmation number, check-in countdown (`isImminentCheckIn`), itinerary
- **Messaging** — pre-booking (`InquiryDialog`) and post-booking (unified `ConversationThread`) both live in the same inbox
- **Changes** — renter can cancel per policy (see [`cancellation-policy.md`](../policies/cancellation-policy.md)); dates + traveler count cannot be modified post-booking (timeshare listings have fixed dates)

### Dispute filing

- Post-booking or post-stay, the traveler can file a dispute via `ReportIssueDialog`
- Categories: property_not_as_described, access_issues, safety_concerns, cleanliness, owner_no_show, cancellation_dispute, payment_dispute, other
- Evidence upload supported (`useDisputeEvidence` hook)
- See [`dispute-resolution.md`](./dispute-resolution.md)

### Tier differentiation

- **Free:** basic booking
- **Plus:** early access to new listings + exclusive deals
- **Premium:** priority Concierge support

Tier gates are enforced via `src/lib/tierGating.ts`.

## Examples

**Example 1 — Standard Pre-Booked booking**

Traveler finds a Hilton listing, views details, books directly. Pays $600 via Stripe. Receives `booking_confirmed` within seconds. Shows up at the resort on check-in date with confirmation number already provided.

**Example 2 — Wish-Matched booking**

Traveler posts Wish: "Orlando, March 10–15, under $800." Owner submits Offer for $720 at their Marriott. Traveler accepts, books, pays. Owner has 3 days to confirm reservation is still held. Owner confirms day 1. Traveler receives `wish_owner_confirmed` and is locked in.

**Example 3 — Making an Offer on a listing**

Traveler sees a $1,200 Marriott listing with bids enabled. Submits Offer of $950. Owner rejects with reason "$950 is below my floor." Traveler re-submits $1,050. Owner accepts. Traveler books at $1,050.

**Example 4 — Wish-Matched owner fails to confirm**

Traveler's Offer-accept books a wish-matched listing. Owner's 3-day confirmation deadline passes silently. Booking auto-cancels, full refund issued. Traveler notified via `wish_owner_failed_to_confirm`. Wish is returned to active state so other owners can Offer.

## Related

- [`bidding-process.md`](./bidding-process.md) — owner side of the flow: posting listings, reviewing and accepting Offers
- [`cancellation-policy.md`](../policies/cancellation-policy.md) — policies applied when a traveler cancels
- [`dispute-resolution.md`](./dispute-resolution.md) — post-stay issue reporting
- Code: `src/flows/traveler-lifecycle.ts` — authoritative flow definition
- Code: `supabase/functions/create-booking-checkout/` — Stripe checkout initiation
- Code: `supabase/functions/verify-booking-payment/` — post-payment state transitions
- Code: `src/components/messaging/ConversationThread.tsx` — unified messaging
