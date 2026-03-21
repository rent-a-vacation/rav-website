---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "archived"
---
# Session 1: Owner Dashboard — Foundation & Data Layer

**Feature:** Owner Dashboard  
**Session:** 1 of 2  
**Agent Role:** Full-Stack Engineer  
**Duration:** ~3 hours  
**Prerequisites:** Read `00-PROJECT-BRIEF.md` fully before writing any code.
Confirm `FairValueBadge` exists at `src/components/fair-value/FairValueBadge.tsx`
(built in Phase 15) before starting.

---

## Mission

Build the data foundation and first two dashboard sections:
1. Migration + RPC functions
2. All data hooks
3. Route + page shell with access control
4. Section 1: Headline Stats (4 KPI cards)
5. Section 2: Earnings Timeline (chart)

Sessions 2 will build sections 3–6 using the hooks created here.

---

## Task 1: Database Migration

Create and apply `docs/supabase-migrations/015_owner_dashboard.sql`

```sql
-- Add maintenance fees to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS annual_maintenance_fees NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS maintenance_fee_updated_at TIMESTAMPTZ;

-- Owner dashboard stats RPC
-- (copy full function from 00-PROJECT-BRIEF.md)
CREATE OR REPLACE FUNCTION public.get_owner_dashboard_stats(p_owner_id UUID)
...

-- Monthly earnings for chart (last 12 months)
CREATE OR REPLACE FUNCTION public.get_owner_monthly_earnings(p_owner_id UUID)
RETURNS TABLE(month DATE, earnings NUMERIC, booking_count INTEGER)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('month', b.paid_at)::DATE AS month,
    COALESCE(SUM(b.owner_payout), 0) AS earnings,
    COUNT(*)::INTEGER AS booking_count
  FROM bookings b
  JOIN listings l ON b.listing_id = l.id
  WHERE l.owner_id = p_owner_id
    AND b.status = 'confirmed'
    AND b.paid_at >= NOW() - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', b.paid_at)
  ORDER BY month ASC;
END;
$$;
```

**Test immediately after applying:**
```sql
SELECT get_owner_dashboard_stats('any-real-owner-id-from-your-db');
SELECT * FROM get_owner_monthly_earnings('any-real-owner-id-from-your-db');
```

---

## Task 2: TypeScript Types

Create `src/types/ownerDashboard.ts`

```typescript
export interface OwnerDashboardStats {
  total_earned_ytd: number
  active_listings: number
  active_bids: number
  annual_maintenance_fees: number | null
  fees_covered_percent: number | null
}

export interface MonthlyEarning {
  month: string       // ISO date string
  earnings: number
  booking_count: number
}

export interface OwnerListing {
  id: string
  property_name: string
  check_in_date: string
  check_out_date: string
  status: string
  final_price: number
  bid_count: number
  highest_bid: number | null
  days_until_checkin: number
}

export interface BidEvent {
  id: string
  listing_id: string
  property_name: string
  event_type: 'new_bid' | 'accepted' | 'rejected' | 'counter_offer' | 'booking_confirmed'
  amount: number
  traveler_initial: string
  created_at: string
}
```

---

## Task 3: Data Hooks

### `src/hooks/owner/useOwnerDashboardStats.ts`
```typescript
// Calls get_owner_dashboard_stats(user.id) RPC
// Returns: OwnerDashboardStats | null
// Also returns: updateMaintenanceFees mutation (saves to profiles table)
// staleTime: 5 minutes
```

### `src/hooks/owner/useOwnerEarnings.ts`
```typescript
// Calls get_owner_monthly_earnings(user.id) RPC
// Returns: MonthlyEarning[] for last 12 months
// Fills missing months with { earnings: 0, booking_count: 0 }
// (so chart always shows 12 data points, not just months with bookings)
```

### `src/hooks/owner/useOwnerListings.ts`
```typescript
// Queries listings WHERE owner_id = user.id
// Joins properties for property name
// Includes bid count + highest bid via get_bid_count() and get_highest_bid() RPCs
// Calculates days_until_checkin = check_in_date - today
// Returns: OwnerListing[]
// Ordered by check_in_date ASC (soonest first)
```

### `src/hooks/owner/useOwnerBidActivity.ts`
```typescript
// Queries listing_bids joined to listings where listings.owner_id = user.id
// Maps bid status changes to BidEvent type
// Returns last 20 events, ordered by created_at DESC
// Traveler initial: first letter of bidder's profile full_name
```

---

## Task 4: Route + Page Shell

Add to `App.tsx`:
```tsx
<Route
  path="/owner-dashboard"
  element={
    <ProtectedRoute requiredRole="property_owner">
      <OwnerDashboard />
    </ProtectedRoute>
  }
/>
```

Create `src/pages/OwnerDashboard.tsx` — page shell only for this session:

```tsx
// Page layout:
// - Light theme (matches main site, NOT the dark executive dashboard)
// - max-w-7xl mx-auto px-6 py-8
// - Page header: "My Owner Dashboard" + owner name + date
// - Placeholder sections for 3-6 (will be built in Session 2)
// - Render sections 1 and 2 (built in Tasks 5 and 6)

// Access guard (belt-and-suspenders beyond ProtectedRoute):
const { userRole } = useAuth()
if (userRole !== 'property_owner') return <Navigate to="/" />
```

---

## Task 5: Section 1 — Headline Stats

Create `src/components/owner-dashboard/OwnerHeadlineStats.tsx`

Four KPI cards in a grid (2×2 on mobile, 4×1 on desktop):

**Card 1 — Total Earned (YTD)**
- Value: `$X,XXX` (formatCurrency)
- Label: "earned this year"
- Icon: DollarSign (lucide)
- Color: emerald

**Card 2 — Maintenance Fees Covered**
- Value: `XXX%` — shown only when `annual_maintenance_fees` is set
- If not set: show "Enter fees →" link that scrolls to Section 6
- Label: "of your annual fees"
- Color: green when ≥100%, amber when 50–99%, red when <50%
- Icon: ShieldCheck (lucide)

**Card 3 — Active Bids**
- Value: count of pending bids across all listings
- Label: "bids awaiting response"
- Icon: TrendingUp (lucide)
- Color: blue
- Clicking card scrolls to Bid Activity Feed (Section 4)

**Card 4 — Average Rating**
- Value: `4.8 ★` — placeholder for now (checkin_confirmations ratings not yet built)
- Label: "guest satisfaction"
- Show "Coming soon" if no rating data
- Icon: Star (lucide)
- Color: amber

Loading state: skeleton cards with `animate-pulse`

---

## Task 6: Section 2 — Earnings Timeline

Create `src/components/owner-dashboard/EarningsTimeline.tsx`

Area chart (Recharts) showing monthly owner_payout for last 12 months.

```tsx
// Chart config:
// - X axis: month labels (Jan, Feb, Mar...)
// - Y axis: dollar amounts (formatCurrency)
// - Area: fill="emerald" (earnings)
// - Dotted horizontal line: monthly maintenance fee cost
//   (annual_maintenance_fees / 12 — only show if fees are entered)
// - Tooltip: month + earnings + booking count
// - Toggle buttons: "Monthly" / "Quarterly" (aggregate the monthly data)

// "Break-even crossed" annotation:
// Find the cumulative month where earnings_ytd >= annual_maintenance_fees
// Add a small label at that data point: "✓ Fees covered"
```

---

## Task 7: Tests

```typescript
// Hook tests:
test('useOwnerDashboardStats returns null when no bookings')
test('fees_covered_percent is null when annual_maintenance_fees not set')
test('useOwnerEarnings fills missing months with zero earnings')
test('useOwnerEarnings always returns 12 data points')

// Component tests:
test('OwnerHeadlineStats renders 4 KPI cards')
test('OwnerHeadlineStats shows Enter fees link when maintenance fees not set')
test('OwnerHeadlineStats fees card green when coverage >= 100%')
test('OwnerHeadlineStats fees card red when coverage < 50%')
test('EarningsTimeline renders without crashing with empty data')
test('OwnerDashboard redirects non-property_owner users')
```

---

## Deliverables Checklist

- [ ] `015_owner_dashboard.sql` — created and applied to DEV
- [ ] Both RPC functions tested via SQL
- [ ] `src/types/ownerDashboard.ts` — no TypeScript errors
- [ ] All 4 hooks created — no TypeScript errors
- [ ] `/owner-dashboard` route — accessible to `property_owner`, redirects others
- [ ] `OwnerHeadlineStats` — all 4 KPI cards render correctly
- [ ] Fees card shows "Enter fees →" when `annual_maintenance_fees` is null
- [ ] `EarningsTimeline` — renders with 12 months of data points
- [ ] Maintenance fee line shown on chart when fees are set
- [ ] Loading skeletons on both components
- [ ] 10+ new tests passing
- [ ] All existing tests still passing
- [ ] `npm run build` — no errors
- [ ] Commit: `feat: Owner Dashboard — foundation, data layer, sections 1-2`

## Handoff

Create `docs/features/owner-dashboard/handoffs/session1-handoff.md`:
- SQL function test output (paste results)
- Confirmed: FairValueBadge path for Session 2 agent to use
- Any schema differences found during implementation
- Hook shapes (actual TypeScript interfaces as built)
- Test count
- Known issues for Session 2 to be aware of
