---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Owner Dashboard — Project Brief

**Feature Name:** Owner Dashboard  
**Phase:** 17  
**Route:** `/owner-dashboard`  
**Status:** 🟡 Planning  
**Created:** February 20, 2026  
**Migration:** 015  
**Docs:** `docs/features/owner-dashboard/`

---

## Overview

A dedicated dashboard for property owners — their personal business view of their
RAV listings. Separate from the admin dashboard, separate from the executive
dashboard. This is the owner's P&L, their listings, their earnings, their
pricing guidance.

The central insight: **treat owners as business partners, not supply to manage.**
Every metric on this page answers the question owners actually care about:
"Is renting my timeshare worth it?"

**Access:** `property_owner` role only. Shows only data belonging to the logged-in owner.

---

## Why This Matters

No timeshare rental platform today gives owners a real business view of their
performance. RedWeek shows a basic listing status. Airbnb shows bookings.
Nobody shows:
- Whether you're covering your maintenance fees
- How your pricing compares to similar units that actually booked
- Which weeks you're leaving money on the table
- What travelers are actually bidding on your listings

RAV does all of this. This dashboard is the proof.

---

## Dashboard Sections

### Section 1 — Headline Stats (top of page)

Four KPI cards:

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Total Earned │ │ Fees Covered │ │ Active Bids  │ │  Avg Rating  │
│   $4,980     │ │    178%      │ │      3       │ │    4.8 ★     │
│  this year   │ │  of your fees│ │  this week   │ │  (8 reviews) │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

"Fees Covered" is the killer metric — it directly answers the owner's #1 question.
Calculated as: (total owner_payout this year / annual maintenance fees input) × 100
Annual maintenance fees: stored in owner's profile (see schema changes below).

### Section 2 — Earnings Timeline

Line chart showing owner_payout by month for the past 12 months.
Toggle: Monthly / Quarterly.
Overlaid: a dotted horizontal line at monthly maintenance fee cost.
When the earnings line crosses above the maintenance fee line → that's the moment
the owner has "paid off" their fees for the year. Label this crossing point.

### Section 3 — My Listings

Table of all owner's listings with:
- Property name + check-in/out dates
- Status badge (draft / active / booked / completed)
- Listed price
- **Fair Value Score badge** (reuse FairValueBadge from Phase 15)
- Active bid count + highest bid amount
- Days until check-in (urgency signal)
- Quick actions: Edit Price / View Bids / Mark Unavailable

**Idle week alert:** If a listing is active, check-in is <60 days away, and zero
bids have been placed — show an amber alert row:
"⚠ No bids yet — 47 days until check-in. Consider lowering your ask or
activating bidding."

### Section 4 — Bid Activity Feed

Chronological feed of all bid events on owner's listings:
- New bid received (amount, traveler's first name initial, timestamp)
- Bid accepted
- Bid rejected
- Counter offer sent
- Booking confirmed

Show last 20 events. Link each to the relevant listing.

### Section 5 — Pricing Intelligence

Pulls Fair Value Score data for each active listing and presents it as an
actionable summary:

```
┌─────────────────────────────────────────────────────────┐
│ 📊 Pricing Intelligence                                  │
│                                                          │
│ Maui HGV — Week of Mar 10                               │
│ 🔴 Above Market — Market range: $2,400–$2,900            │
│ Your price: $3,200  |  Avg accepted bid: $2,650          │
│ [Adjust Price ↓]                                         │
│                                                          │
│ Orlando Marriott — Week of Apr 5                        │
│ 🟢 Fair Value — Market range: $1,600–$2,000              │
│ Your price: $1,725  |  Well positioned                   │
└─────────────────────────────────────────────────────────┘
```

Each listing gets one row. "Adjust Price" button opens an inline price editor.

### Section 6 — Maintenance Fee Tracker

Owner enters their annual maintenance fees (stored in profile).
Dashboard shows the running tally for the year:

```
Annual maintenance fees:        $2,800
Earned so far this year:        $4,980  ✓ Fees fully covered
Net earnings after fees:        +$2,180

Breakdown:
  Week of Feb 15 — $1,665 net ✓
  Week of Mar 10 — $1,890 net ✓
  Week of Apr 5  — $1,425 net ✓
```

If fees not entered yet: prompt card "Enter your annual maintenance fees
to track your break-even progress →" with input field inline.

---

## Database Changes

**New migration: `015_owner_dashboard.sql`**

### Add to `profiles` table:
```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS annual_maintenance_fees NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS maintenance_fee_updated_at TIMESTAMPTZ;
```

### New RPC function:
```sql
CREATE OR REPLACE FUNCTION public.get_owner_dashboard_stats(p_owner_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_total_earned NUMERIC;
  v_active_listings INTEGER;
  v_active_bids INTEGER;
  v_maintenance_fees NUMERIC;
  v_year_start DATE;
BEGIN
  v_year_start := DATE_TRUNC('year', CURRENT_DATE);

  -- Total earned this year (owner_payout from confirmed bookings)
  SELECT COALESCE(SUM(b.owner_payout), 0)
  INTO v_total_earned
  FROM bookings b
  JOIN listings l ON b.listing_id = l.id
  WHERE l.owner_id = p_owner_id
    AND b.status = 'confirmed'
    AND b.paid_at >= v_year_start;

  -- Active listings count
  SELECT COUNT(*) INTO v_active_listings
  FROM listings
  WHERE owner_id = p_owner_id AND status = 'active';

  -- Active bids count (pending bids across all owner's active listings)
  SELECT COUNT(*) INTO v_active_bids
  FROM listing_bids lb
  JOIN listings l ON lb.listing_id = l.id
  WHERE l.owner_id = p_owner_id AND lb.status = 'pending';

  -- Maintenance fees from profile
  SELECT annual_maintenance_fees INTO v_maintenance_fees
  FROM profiles WHERE id = p_owner_id;

  RETURN jsonb_build_object(
    'total_earned_ytd', v_total_earned,
    'active_listings', v_active_listings,
    'active_bids', v_active_bids,
    'annual_maintenance_fees', v_maintenance_fees,
    'fees_covered_percent',
      CASE WHEN v_maintenance_fees > 0
        THEN ROUND((v_total_earned / v_maintenance_fees) * 100)
        ELSE NULL
      END
  );
END;
$$;
```

---

## File Structure

```
src/
├── pages/
│   └── OwnerDashboard.tsx
├── components/
│   └── owner-dashboard/
│       ├── OwnerHeadlineStats.tsx
│       ├── EarningsTimeline.tsx
│       ├── MyListingsTable.tsx
│       ├── IdleWeekAlert.tsx
│       ├── BidActivityFeed.tsx
│       ├── PricingIntelligence.tsx
│       └── MaintenanceFeeTracker.tsx
├── hooks/
│   └── owner/
│       ├── useOwnerDashboardStats.ts
│       ├── useOwnerListings.ts
│       ├── useOwnerBidActivity.ts
│       └── useOwnerEarnings.ts
docs/supabase-migrations/
└── 015_owner_dashboard.sql
```

---

## Implementation Plan — 2 Sessions

### Session 1: Foundation + Data (~3 hours)
Migration, RPC functions, all hooks, route + page shell, Headline Stats, Earnings Timeline

### Session 2: Listings, Bids, Pricing Intelligence, Tracker (~3 hours)
MyListingsTable with idle alerts, BidActivityFeed, PricingIntelligence panel,
MaintenanceFeeTracker, nav link, tests

---

## Success Criteria

- [ ] `/owner-dashboard` accessible only to `property_owner` role
- [ ] Shows only data belonging to the logged-in owner (RLS enforced)
- [ ] Headline stats: all 4 KPIs show correct values
- [ ] "Fees Covered %" shows when maintenance fees are entered
- [ ] Earnings timeline chart renders with monthly data
- [ ] Maintenance fee line overlaid on earnings chart
- [ ] My Listings table shows all owner listings with Fair Value badges
- [ ] Idle week alert shows for listings <60 days out with zero bids
- [ ] Bid activity feed shows last 20 events
- [ ] Pricing Intelligence shows actionable row per listing
- [ ] "Adjust Price" opens inline editor and saves to DB
- [ ] Maintenance Fee Tracker shows correct year-to-date breakdown
- [ ] Prompt to enter fees if not set
- [ ] Nav link in header visible to `property_owner` role
- [ ] All existing tests still passing
- [ ] 10+ new tests
- [ ] `npm run build` passes

---

## Key Decisions

### DEC-023: Owner Dashboard vs Admin Dashboard
**Decision:** Separate route `/owner-dashboard` for owners, keeps `/admin-dashboard`
for RAV team only  
**Reasoning:** Different audiences, different data, different purpose. Mixing them
creates confusion and potential data exposure risk.  
**Status:** ✅ Final

### DEC-024: Annual Maintenance Fees Stored in Profile
**Decision:** Add `annual_maintenance_fees` to `profiles` table, editable by owner  
**Reasoning:** Needed for the Fees Covered % calculation and Maintenance Fee Tracker.
Owners enter once, persists across sessions. Optional — all fee-related features
degrade gracefully if not entered.  
**Status:** ✅ Final
