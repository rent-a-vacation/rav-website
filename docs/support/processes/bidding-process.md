---
last_updated: "2026-04-21T12:43:12"
change_ref: "ed19c48"
change_type: "session-57-phase22-B2"
status: "active"
title: "Bidding & Offers Process"
doc_type: "process"
audience: ["renter", "owner", "admin"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["bidding", "offer", "wish", "auction", "marketplace", "owner", "travel-request"]
---

# Bidding & Offers Process

## Summary

RAV's marketplace supports two-sided matching: travelers can make an **Offer** on any listing where the owner enabled bidding, and owners can respond to **Wishes** (travel requests) by submitting their own Offers. An accepted Offer creates (or matches) a listing and flows into the normal booking + payment path.

## Details

### Terminology

Per DEC-031 (marketplace terminology lock), RAV uses three nouns consistently:

- **Listing** — a week an owner has made available (Pre-Booked) or will make available (responses to Wishes)
- **Wish** — a traveler's travel request (destination + dates + budget) open to Offers
- **Offer** — a proposed price + terms, from either a traveler on a listing or an owner on a Wish

The word "bid" is legacy; user-facing UI uses "Offer." Code may still reference `listing_bids` and `bid_count` (schema-level).

### Two directions of bidding

#### Traveler makes an Offer on a Listing

Requires `listings.allow_bids = true`. Otherwise the listing is book-now only.

1. Traveler opens `BidFormDialog` on a listing page
2. Enters Offer amount + optional date proposal (supported when listing has flexible dates)
3. Submit → row written to `listing_bids` with `status: 'pending'`
4. Owner sees the Offer in their `OwnerBookings → Bids` tab with a count badge
5. Owner accepts → booking is created at the Offer price (traveler gets prompted to pay via the standard Stripe Checkout)
6. Owner rejects → Offer marked `rejected`. Traveler notified. Can re-submit with a new amount (no hard limit; owner can block repeat bidders if abused).

A traveler can withdraw a pending Offer anytime; an accepted Offer becomes a booking on payment.

#### Owner submits an Offer on a Wish

1. Traveler posts a Wish at `/wishes/new` → row in `travel_requests` (destination, date range, budget, guest count, preferences)
2. Active Wishes appear to owners in `OwnerBookings → Opportunities` (filtered by the owner's portfolio)
3. Owner submits an Offer via `TravelRequestOfferForm` → row in `travel_proposals` with the offered listing details (resort, dates, price)
4. Traveler reviews Offers from multiple owners, accepts one
5. Acceptance auto-generates a **wish-matched listing** (`source_type: 'wish_matched'`) via `useBidding.ts`
6. Traveler pays via standard booking checkout flow
7. Post-payment, the wish-matched flow kicks in: owner has a deadline to confirm the resort reservation before the booking is locked

### Offer lifecycle (either direction)

| Status | Meaning | Next steps |
|---|---|---|
| `pending` | Awaiting other side's response | Accept, reject, counter, or withdraw |
| `accepted` | Both sides agree on terms | Booking created; payment collected |
| `rejected` | One side declined | Other side can submit a new Offer |
| `expired` | Offer exceeded TTL without response | Archived; no action |
| `withdrawn` | Originator pulled the Offer | Archived |

### Counter-offers

Not currently first-class — implemented as reject-then-resubmit. Both parties can negotiate through the unified messaging thread in parallel.

### Constraints

- **Price floor:** Owners can set a minimum Offer amount via the listing's `minimum_bid_amount` field. Offers below the floor are rejected automatically.
- **Booking conflicts:** Two Offers on the same listing for overlapping dates cannot both be accepted. The first accepted locks the dates; subsequent pending Offers for those dates are auto-rejected.
- **Tier gating:** Premium travelers have early-access visibility into new listings before Free tier, giving them a head start on Offers (see `tierGating.ts`).
- **Cancellation:** An accepted Offer that becomes a booking follows the listing's cancellation policy — not a separate Offer-cancellation flow.

### Notifications

- `new_bid_received` → owner when a new Offer arrives on their listing
- `bid_accepted` / `bid_rejected` → traveler when owner responds
- `new_proposal_received` → traveler when a new Offer on their Wish arrives
- `proposal_accepted` / `proposal_expired` → owner when traveler responds
- `wish_owner_confirming` → traveler right after payment on a wish-matched booking
- `wish_owner_confirmed` / `wish_owner_failed_to_confirm` → traveler when owner completes or misses the confirmation window

### Pricing intelligence

Owners see real-time pricing suggestions during listing creation based on comparable listings (brand + destination). The `usePricingSuggestion` hook returns market range; urgency discounts apply as check-in approaches.

### Fair Value score

Every listing gets a Fair Value score that helps travelers evaluate Offers:

- Compares the listing's nightly rate to comparable market data
- Factors in urgency (days-to-check-in), brand, destination
- Score + badge shown on `/property/:id` and listing cards

See `src/lib/fairValue.ts` and the `FairValueBadge` component.

## Examples

**Example 1 — Traveler Offers on a listing, owner accepts**

Listing: $1,400 Marriott week in Orlando with `allow_bids: true`. Traveler Offers $1,100. Owner opens `BidsManagerDialog`, accepts. Traveler is prompted to pay $1,100 via Stripe Checkout. Booking is created at that amount, $165 commission to RAV, $935 to owner post-stay.

**Example 2 — Owner responds to a Wish**

Wish: "Gatlinburg, Feb 14–18, under $800, 4 guests." Three owners submit Offers: $750 at a Westgate, $690 at a Wyndham, $820 at a Hilton. Traveler picks the $690 Wyndham. Wish-matched listing auto-generated; traveler pays $690; owner has 72 hours to confirm resort reservation.

**Example 3 — Owner rejects, traveler re-Offers**

Listing: $950 Hilton. Traveler Offers $700. Owner rejects with note "$700 is below my floor." Traveler re-Offers $850. Owner accepts. Booking at $850.

**Example 4 — Wish expires unmatched**

Wish posted: "Any Disney resort, March 1–7, under $400." No owners have Pre-Booked Disney inventory at that price. Proposals deadline passes with no Offers. Wish marked `expired`. Traveler notified and invited to broaden criteria or extend the deadline.

## Related

- [`booking-workflow.md`](./booking-workflow.md) — what happens after an Offer is accepted
- [`cancellation-policy.md`](../policies/cancellation-policy.md) — policies applied when a booked-via-Offer is cancelled
- [`property-owner-faq.md`](../faqs/property-owner-faq.md) — owner-specific questions about managing Offers
- Code: `src/flows/owner-lifecycle.ts` — owner-side flow definition
- Code: `src/flows/traveler-lifecycle.ts` — traveler-side flow definition
- Code: `src/components/bidding/BidFormDialog.tsx` — traveler Offer entry
- Code: `src/components/bidding/BidsManagerDialog.tsx` — owner Offer review
- Code: `src/hooks/useBidding.ts` — accepted-Offer → listing auto-generation
- Tables: `listing_bids`, `travel_requests`, `travel_proposals`
