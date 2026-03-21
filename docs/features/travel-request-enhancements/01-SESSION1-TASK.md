---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "archived"
---
# Session 1: Travel Request Enhancements — Build All 4

**Feature:** Travel Request Enhancements  
**Session:** 1 of 1  
**Agent Role:** Full-Stack Engineer  
**Duration:** ~3 hours  
**Prerequisites:**
- Read `00-PROJECT-BRIEF.md` fully before writing any code
- Read `src/hooks/useBidding.ts` to understand existing patterns
- Read `supabase/functions/process-deadline-reminders/index.ts` before modifying it
- Confirm the exact file path where listing status is set to 'active' (likely `src/components/admin/AdminListings.tsx`)

**Critical rule:** Do NOT rebuild anything that already exists.
`TravelRequestForm`, `TravelRequestCard`, `ProposalFormDialog`, and all
hooks in `useBidding.ts` are complete and working. Touch only what's listed
in the "Modified files" section of the Project Brief.

---

## Task 1: Migration

Create `docs/supabase-migrations/016_travel_request_enhancements.sql`

```sql
-- Phase 18: Travel Request Enhancements
-- Adds 2 notification type values used by new automation

ALTER TYPE public.notification_type
ADD VALUE IF NOT EXISTS 'travel_request_expiring_soon';

ALTER TYPE public.notification_type
ADD VALUE IF NOT EXISTS 'travel_request_matched';

-- Note: 'new_travel_request_match' already exists and is used
-- for the listing match notification (Enhancement 1).
```

Apply to DEV via Supabase SQL Editor. Verify:
```sql
SELECT unnest(enum_range(NULL::notification_type));
-- Should include travel_request_expiring_soon and travel_request_matched
```

---

## Task 2: Edge Function — `match-travel-requests`

Create `supabase/functions/match-travel-requests/index.ts`

Copy the full implementation from `00-PROJECT-BRIEF.md` Enhancement 1.

**Important nuances to implement correctly:**

```typescript
// Budget matching logic:
// - budget_preference = 'undisclosed': match on all other criteria,
//   DO NOT check price against budget, DO NOT reveal price in notification
// - budget_preference = 'ceiling': match only if final_price <= budget_max
// - budget_preference = 'range': match only if final_price <= budget_max

// Notification message — budget-aware:
const message = request.budget_preference === 'undisclosed'
  ? `A ${property.bedrooms}BR listing just became available in ${property.city}. View it to see pricing.`
  : `A ${property.bedrooms}BR listing in ${property.city} just listed for $${listing.final_price} — within your budget.`

// Deduplication check before each INSERT:
const { data: alreadyNotified } = await supabase
  .from('notifications')
  .select('id')
  .eq('user_id', request.traveler_id)
  .eq('type', 'new_travel_request_match')
  .eq('listing_id', listing.id)
  .maybeSingle()

if (alreadyNotified) continue
```

Deploy:
```bash
npx supabase functions deploy match-travel-requests --project-ref oukbxqnlxnkainnligfz
```

Test via Supabase dashboard → Edge Functions → match-travel-requests:
```json
{ "listing_id": "any-active-listing-id-from-dev-db" }
```
Expected: `{ "matched_count": 0, "notified_traveler_ids": [] }` with status 200.
Zero matches is correct if no open travel_requests exist in DEV yet — confirms
the function runs without error.

---

## Task 3: Wire Match Trigger on Listing Activation

Find where listing status is set to `'active'` in the codebase.

**Primary location:** `src/components/admin/AdminListings.tsx`
Look for the approve listing action. After the Supabase update call succeeds,
add the fire-and-forget trigger:

```typescript
// After: await supabase.from('listings').update({ status: 'active' })...
// Add immediately after (do not await):
supabase.functions.invoke('match-travel-requests', {
  body: { listing_id: listing.id }
}).catch((err) => console.error('Match trigger failed:', err))
```

**Check also:** `src/pages/ListProperty.tsx` — if there is an auto-approval
path where a listing goes directly to 'active', add the same call there.

Do not add it in any place where status changes to anything other than 'active'.

---

## Task 4: DemandSignal Component

Create `src/components/bidding/DemandSignal.tsx`

Full spec in `00-PROJECT-BRIEF.md` Enhancement 2. Key implementation notes:

```tsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Debounce the query — wait 500ms after last prop change before querying
// Use a useEffect with a setTimeout/clearTimeout pattern

// The query:
const { data } = await supabase
  .from('travel_requests')
  .select('budget_max, budget_preference')
  .eq('status', 'open')
  .gt('proposals_deadline', new Date().toISOString())
  .ilike('destination_location', `%${city}%`)
  .gte('check_in_date', subtractDays(checkInDate, 30))
  .lte('check_in_date', addDays(checkInDate, 30))
  .lte('bedrooms_needed', bedrooms)

// Derive from results:
const count = data?.length ?? 0
const disclosedBudgets = data
  ?.filter(r => r.budget_preference !== 'undisclosed' && r.budget_max)
  .map(r => r.budget_max) ?? []
const maxBudget = disclosedBudgets.length > 0
  ? Math.max(...disclosedBudgets)
  : null

// Render nothing if count === 0
if (count === 0) return null

// Render amber card (use warning semantic token, not hardcoded amber):
// bg-warning/10 border border-warning/30 text-warning-foreground
// (check existing warning token usage in codebase for exact class pattern)
```

**Wire into `src/pages/ListProperty.tsx`:**

Find the section where destination (city/state) and check_in_date are
entered. The exact field names depend on the existing form structure —
read `ListProperty.tsx` before wiring to confirm field names.

```tsx
import { DemandSignal } from '@/components/bidding/DemandSignal'

// Inside the form, after destination + date fields:
{formValues.city && formValues.check_in_date && (
  <DemandSignal
    destination={`${formValues.city}, ${formValues.state}`}
    checkInDate={formValues.check_in_date}
    bedrooms={formValues.bedrooms ?? 1}
  />
)}
```

---

## Task 5: PostRequestCTA Component

Create `src/components/bidding/PostRequestCTA.tsx`

Full spec in `00-PROJECT-BRIEF.md` Enhancement 3.

```tsx
// Build the link with prefill params:
const params = new URLSearchParams()
params.set('tab', 'requests')
if (searchDestination) params.set('destination', searchDestination)
if (searchCheckIn) params.set('checkin', searchCheckIn)
if (searchCheckOut) params.set('checkout', searchCheckOut)
const href = `/bidding?${params.toString()}`

// Card styling — use muted/soft appearance, not alarming:
// bg-muted border border-border rounded-xl p-6 text-center
```

**Wire into `src/pages/Rentals.tsx`:**

Find the existing empty state (when search returns 0 results). Look for
conditions like `listings.length === 0 && !isLoading`. Add below it:

```tsx
import { PostRequestCTA } from '@/components/bidding/PostRequestCTA'

{listings.length === 0 && !isLoading && (
  <>
    {/* existing empty state message */}
    <PostRequestCTA
      searchDestination={filters.destination}
      searchCheckIn={filters.checkIn}
      searchCheckOut={filters.checkOut}
    />
  </>
)}
```

Check the actual filter/state variable names in `Rentals.tsx` before wiring.

**Wire pre-fill into `src/pages/BiddingMarketplace.tsx`:**

```typescript
// Read URL params on mount:
const [searchParams] = useSearchParams()
const prefill = searchParams.get('prefill') === 'true'
const prefillDestination = searchParams.get('destination') ?? ''
const prefillCheckin = searchParams.get('checkin') ?? ''
const prefillCheckout = searchParams.get('checkout') ?? ''

// If prefill=true, default active tab to 'requests' tab
// Pass prefill values as defaultValues to TravelRequestForm
```

**If `TravelRequestForm` does not have a `defaultValues` prop:** add it.
Keep the prop optional with empty defaults so existing usage is unaffected.

---

## Task 6: Expiry Warning in process-deadline-reminders

Modify `supabase/functions/process-deadline-reminders/index.ts`

Read the existing file structure carefully first. The function already
has one scan block for booking confirmations. Add a second scan block
for travel request expiry as a **separate, clearly commented section**
— do not mix with the existing logic.

Copy the full implementation from `00-PROJECT-BRIEF.md` Enhancement 4.

After modifying, redeploy:
```bash
npx supabase functions deploy process-deadline-reminders --project-ref oukbxqnlxnkainnligfz
```

**Verify the existing booking reminder logic is unchanged** by running
the existing CRON tests if any exist, or manually reviewing the function
output in Supabase logs.

---

## Task 7: Tests

```typescript
// DemandSignal:
test('DemandSignal renders nothing when 0 matching requests')
test('DemandSignal renders count when requests found')
test('DemandSignal omits budget line when all budgets are undisclosed')
test('DemandSignal shows highest disclosed budget when available')
test('DemandSignal does not render before destination is entered')

// PostRequestCTA:
test('PostRequestCTA renders on empty search results')
test('PostRequestCTA link includes destination param when provided')
test('PostRequestCTA link includes date params when provided')
test('PostRequestCTA does not render when listings exist')

// Match trigger (integration-style):
test('match-travel-requests returns 200 with matched_count field')
test('notification not duplicated if same listing+traveler already notified')

// Expiry warning:
test('expiry warning not sent twice for same request')
```

---

## Deliverables Checklist

- [ ] `016_travel_request_enhancements.sql` — applied to DEV
- [ ] New enum values confirmed via SQL query
- [ ] `match-travel-requests` Edge Function — deployed and returns 200
- [ ] Match trigger wired into `AdminListings.tsx` (and `ListProperty.tsx` if applicable)
- [ ] `DemandSignal.tsx` — renders nothing on 0 results, amber card on 1+
- [ ] `DemandSignal` wired into `ListProperty.tsx` — confirm exact field names used
- [ ] `DemandSignal` debounces query (no rapid-fire Supabase calls while typing)
- [ ] Budget line omitted from `DemandSignal` when all budgets undisclosed
- [ ] `PostRequestCTA.tsx` — renders on empty search results
- [ ] `PostRequestCTA` wired into `Rentals.tsx`
- [ ] `BiddingMarketplace.tsx` — reads prefill params from URL
- [ ] `TravelRequestForm` — accepts `defaultValues` prop (added or confirmed existing)
- [ ] `process-deadline-reminders` — expiry scan added, existing logic untouched
- [ ] `process-deadline-reminders` redeployed
- [ ] Deduplication confirmed for both match notifications and expiry warnings
- [ ] Budget not revealed when `budget_preference = 'undisclosed'`
- [ ] 10+ new tests passing
- [ ] All existing bidding system tests still passing
- [ ] `npm run build` — no TypeScript errors, no ESLint errors
- [ ] `PROJECT-HUB.md` updated — Phase 18 marked complete, decisions logged
- [ ] Commit: `feat: Travel Request Enhancements — automation, demand signal, expiry warnings`

## Handoff

Create `docs/features/travel-request-enhancements/handoffs/session1-handoff.md`:
- Exact file where listing activation trigger was wired (line number helpful)
- Exact form field names used in `ListProperty.tsx` for the DemandSignal wire
- Whether `TravelRequestForm` had `defaultValues` already or was modified
- Edge Function test output (paste response)
- Expiry warning — did the 47-49h window need adjustment?
- Final test count
- Any deferred items
