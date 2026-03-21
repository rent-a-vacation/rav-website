---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "archived"
---
# Session 2: Owner Dashboard — Sections 3–6 + Polish

**Feature:** Owner Dashboard  
**Session:** 2 of 2  
**Agent Role:** Frontend Engineer  
**Duration:** ~3 hours  
**Prerequisites:**
- Read `00-PROJECT-BRIEF.md` fully
- Read `handoffs/session1-handoff.md` — understand what exists before adding to it
- Confirm `FairValueBadge` exists at `src/components/fair-value/FairValueBadge.tsx`

---

## Mission

Complete the Owner Dashboard by building sections 3–6, adding the nav link,
polishing the full page, and writing tests:
- Section 3: My Listings Table (with Fair Value badges + idle alerts)
- Section 4: Bid Activity Feed
- Section 5: Pricing Intelligence
- Section 6: Maintenance Fee Tracker
- Nav link for property_owner role
- Responsive polish
- Tests

---

## Task 1: Section 3 — My Listings Table

Create `src/components/owner-dashboard/MyListingsTable.tsx`

Uses `useOwnerListings` hook (built in Session 1).

**Table columns:**
| Column | Content |
|--------|---------|
| Property | Name + check-in/out dates |
| Status | Badge: draft / active / booked / completed |
| Price | `final_price` formatted as currency |
| Fair Value | `<FairValueBadge>` from Phase 15 |
| Bids | `X bids · Highest: $X,XXX` (or "No bids yet") |
| Check-in | Days until check-in (e.g. "47 days") |
| Actions | Edit Price · View Bids · Mark Unavailable |

**Idle Week Alert Row:**

For any listing where ALL of the following are true:
- `status === 'active'`
- `days_until_checkin < 60`
- `bid_count === 0`

Render an amber alert row directly below that listing's row:
```
⚠ No bids yet — 47 days until check-in. 
Consider lowering your ask or enabling bidding.
[Lower Price] [Enable Bidding]
```

**"Edit Price" inline editor:**
- Clicking opens an inline input replacing the price cell
- On save: `UPDATE listings SET final_price = $value WHERE id = $id`
- On cancel: reverts to display mode
- Validates: new price must be ≥ owner_price

---

## Task 2: Section 4 — Bid Activity Feed

Create `src/components/owner-dashboard/BidActivityFeed.tsx`

Uses `useOwnerBidActivity` hook (built in Session 1).

Chronological list of the last 20 bid events. Each row:

```
[icon]  New bid received — Maui HGV (Mar 10)
        Traveler J. offered $2,650  ·  3 hours ago

[icon]  Booking confirmed — Orlando Marriott (Apr 5)
        $1,725 · Owner payout: $1,553  ·  2 days ago
```

**Event icons (lucide):**
- `new_bid` → ArrowDownLeft (amber)
- `accepted` → CheckCircle (emerald)
- `rejected` → XCircle (red)
- `counter_offer` → ArrowLeftRight (blue)
- `booking_confirmed` → CalendarCheck (emerald, larger)

Each event links to the relevant listing detail page.

Empty state: "No bid activity yet. Your bid events will appear here."

---

## Task 3: Section 5 — Pricing Intelligence

Create `src/components/owner-dashboard/PricingIntelligence.tsx`

For each active listing, show one row with Fair Value Score data:

```tsx
// For each listing in useOwnerListings():
//   Call useFairValueScore(listing.id) to get tier + range
//   Render one row per listing

// Row layout:
// Left: property name + date
// Middle: FairValueBadge (reuse from Phase 15) + range text
//         "Market range: $X,XXX – $X,XXX · Avg accepted bid: $X,XXX"
// Right: "Adjust Price ↓" button (opens inline editor same as Section 3)

// When tier === 'above_market': highlight the row with red-50 background
// When tier === 'insufficient_data': show "Insufficient data — more bids needed"
// When no active listings: show "List a property to see pricing guidance"
```

---

## Task 4: Section 6 — Maintenance Fee Tracker

Create `src/components/owner-dashboard/MaintenanceFeeTracker.tsx`

**When `annual_maintenance_fees` is NOT set:**

Show a prompt card:
```
📋 Track your break-even progress
Enter your annual maintenance fees to see how your earnings 
compare to your yearly costs.

Annual maintenance fees: [$______] [Save]
```
On save: calls `updateMaintenanceFees` mutation from `useOwnerDashboardStats`.

**When `annual_maintenance_fees` IS set:**

Show the full tracker:
```
Annual maintenance fees:      $2,800
Earned so far this year:      $4,980  ✓ Fees fully covered
Net earnings after fees:      +$2,180

Bookings this year:
  ✓ Week of Feb 15  Maui HGV       $1,665 net
  ✓ Week of Mar 10  Orlando MVC    $1,890 net  
  ✓ Week of Apr 5   Myrtle Beach   $1,425 net
  ─────────────────────────────────────────
  Total                            $4,980
```

Color rules:
- "Fees fully covered" banner: emerald background when earnings ≥ fees
- "X% covered" banner: amber when 50–99%, red when <50%
- Net earnings: emerald when positive, red when negative

Small "Edit" link next to the maintenance fee amount to update it.

---

## Task 5: Add Nav Link

In the main site navigation component, add a link visible only to `property_owner` role:

```tsx
// Pattern: same as existing role-based nav items
const { userRole } = useAuth()

{userRole === 'property_owner' && (
  <NavLink to="/owner-dashboard">
    My Dashboard
  </NavLink>
)}
```

---

## Task 6: Wire All Sections Into Page

Update `src/pages/OwnerDashboard.tsx` to render all 6 sections:

```tsx
// Page layout with section order:
// 1. OwnerHeadlineStats    (built Session 1)
// 2. EarningsTimeline      (built Session 1)
// 3. MyListingsTable       (built this session)
// 4. BidActivityFeed       (built this session)
// 5. PricingIntelligence   (built this session)
// 6. MaintenanceFeeTracker (built this session)

// Section separator: consistent SectionDivider pattern
// (reuse the pattern from executive dashboard if it exists,
//  or create a simple hr with section title)

// Scroll anchors: add id attributes so cards can link to sections
// id="listings" id="bids" id="pricing" id="fees"
```

---

## Task 7: Tests

```typescript
// Section 3:
test('MyListingsTable renders all owner listings')
test('MyListingsTable shows Fair Value badge for each listing')
test('IdleWeekAlert renders for listing with 0 bids and < 60 days to checkin')
test('IdleWeekAlert does NOT render when bid_count > 0')
test('Inline price editor validates new price >= owner_price')

// Section 4:
test('BidActivityFeed renders last 20 events')
test('BidActivityFeed shows empty state when no events')
test('new_bid event shows amber icon')
test('booking_confirmed event shows emerald icon')

// Section 5:
test('PricingIntelligence renders one row per active listing')
test('above_market row has red background highlight')

// Section 6:
test('MaintenanceFeeTracker shows prompt when fees not set')
test('MaintenanceFeeTracker shows tracker when fees are set')
test('Net earnings shows in emerald when positive')
test('Net earnings shows in red when negative')
```

---

## Deliverables Checklist

- [ ] `MyListingsTable.tsx` — all columns render correctly
- [ ] Fair Value badges visible in listings table
- [ ] Idle week alert shows for correct listings only
- [ ] Inline price editor saves to DB correctly
- [ ] `BidActivityFeed.tsx` — last 20 events with correct icons
- [ ] Empty state on bid feed works
- [ ] `PricingIntelligence.tsx` — one row per active listing
- [ ] Above-market rows highlighted red
- [ ] `MaintenanceFeeTracker.tsx` — prompt shown when fees not set
- [ ] Tracker shows correct year-to-date breakdown when fees set
- [ ] "Edit" fees link works inline
- [ ] Nav link visible to `property_owner`, hidden from others
- [ ] All 6 sections wired into `OwnerDashboard.tsx`
- [ ] Section scroll anchors working
- [ ] Responsive — readable on 1024px+
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] `npm run build` — no errors
- [ ] 15+ new tests passing total (sessions 1+2 combined)
- [ ] All existing tests still passing
- [ ] Commit: `feat: Owner Dashboard — sections 3-6, nav link, complete`

## Handoff

Create `docs/features/owner-dashboard/handoffs/session2-handoff.md`:
- Complete list of all files created/modified across both sessions
- Final test count
- Nav link location (which file was modified)
- Any deferred items for future improvement
- Confirmation that `npm run build` passed clean
- Note any data that owners need to enter to see meaningful dashboard content
