---
last_updated: "2026-02-21T19:58:23"
change_ref: "dc07c27"
change_type: "session-39-docs-update"
status: "active"
---
# Travel Request Enhancements

**Phase:** 18–19
**Status:** ✅ Completed (Sessions 18–19)
**Routes:** Enhances existing `/bidding` · `/rentals` · `/list-property`
**Migration:** 016 (enum values) + 020 (flexible dates & nightly pricing)
**Implemented:** Sessions 18–19 (Feb 2026)

### What Was Built

- **Migration 020** (`020_flexible_dates_nightly_pricing.sql`): `nightly_rate` on listings (backfilled), `requested_check_in/out` on `listing_bids`, `source_listing_id` + `target_owner_only` on `travel_requests`
- **InspiredTravelRequestDialog** (`src/components/bidding/InspiredTravelRequestDialog.tsx`): Pre-fills TravelRequestForm from a listing, includes "Send to this owner first" toggle (`target_owner_only`)
- **Dual-mode BidFormDialog** (`src/components/bidding/BidFormDialog.tsx`): Supports `'bid' | 'date-proposal'` modes — date pickers + auto-computed bid in date-proposal mode
- **Shared pricing utility** (`src/lib/pricing.ts`): `calculateNights()` + `computeListingPricing()` (15% RAV markup) — replaced 4 duplicated pricing functions
- **Tests:** `pricing.test.ts` (11 tests), `BidFormDialog.test.tsx` (5 tests)

---

## What This Feature Does

The Travel Request system (reverse auction) already exists with a complete
data model and owner proposal flow. This phase adds the automation layer
that makes it proactive rather than passive:

1. **Automated matching** — when a listing activates, notify travelers with
   matching open requests (the platform finds the match, not just the owner)
2. **Demand signal** — show owners how many open requests match their
   destination/dates while they're creating a listing
3. **"Post a Request" CTA** — surface the existing request flow on empty
   search results so travelers know it exists
4. **Request expiry email** — warn travelers 48h before their request expires

Zero new tables. Zero new pages. Enhances what's already built and tested.

---

## What Already Exists (Do Not Rebuild)

| Existing asset | Location |
|---------------|----------|
| `travel_requests` table | DB migration 003 |
| `travel_proposals` table | DB migration 003 |
| `TravelRequestForm` component | `src/components/bidding/TravelRequestForm.tsx` |
| `TravelRequestCard` component | `src/components/bidding/TravelRequestCard.tsx` |
| `ProposalFormDialog` component | `src/components/bidding/ProposalFormDialog.tsx` |
| `useOpenTravelRequests()` hook | `src/hooks/useBidding.ts` |
| `useCreateTravelRequest()` hook | `src/hooks/useBidding.ts` |
| `useMyTravelRequests()` hook | `src/hooks/useBidding.ts` |
| `new_travel_request_match` notification type | DB enum |
| `/bidding` marketplace page | `src/pages/BiddingMarketplace.tsx` |
| `/my-bids` traveler dashboard | `src/pages/MyBidsDashboard.tsx` |

---

## Files in This Folder

```
docs/features/travel-request-enhancements/
├── README.md                    # This file — start here
├── 00-PROJECT-BRIEF.md          # Full spec: 4 enhancements with exact file targets
├── 01-SESSION1-TASK.md          # Agent task: build all 4 in one session
├── handoffs/                    # Empty — agent fills after session
└── KNOWN-ISSUES.md              # Pre-populated constraints
```

---

## Quick Start for Agent

1. Read `00-PROJECT-BRIEF.md` fully — especially the "What Already Exists" section
2. Read `src/hooks/useBidding.ts` to understand existing hook patterns before adding to it
3. Run `01-SESSION1-TASK.md`
4. Save output to `handoffs/session1-handoff.md`

---

## The 4 Enhancements

| # | Enhancement | Effort | Value |
|---|------------|--------|-------|
| 1 | Automated match notification when listing activates | Medium | High — closes the loop between supply and demand |
| 2 | Demand signal on listing creation form | Small | High — motivates owners to list and price correctly |
| 3 | "Post a Request" CTA on empty search results | Small | Medium — surfaces existing feature to travelers |
| 4 | Request expiry warning email | Small | Medium — reduces silent request abandonment |

---

## Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| New table | None | `travel_requests` already has everything needed |
| New page | None | Enhances `/bidding`, `/rentals`, `/list-property` |
| Matching trigger | On listing status → 'active' | Real-time match at the moment of supply |
| Budget undisclosed | Honor existing enum | Don't expose budget in notification when `budget_preference = 'undisclosed'` |
| Migration # | 016 + 020 | 016: enum values; 020: flexible dates, nightly pricing, `source_listing_id`, `target_owner_only` |

---

## Success Criteria

- [x] Traveler with matching open request receives notification when listing activates
- [x] Budget not revealed in notification when `budget_preference = 'undisclosed'`
- [x] Demand signal shows on `/list-property` after destination + dates entered
- [x] "Post a Request" CTA shows on `/rentals` when search returns 0 results
- [x] Expiry warning email sends 48h before `proposals_deadline`
- [x] No regressions in existing bidding system tests
- [x] `npm run build` passes

---

**Last Updated:** March 13, 2026
