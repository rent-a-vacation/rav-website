---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "archived"
---
# Session 1: Fair Value Score — Build It

**Feature:** Fair Value Score  
**Session:** 1 of 1  
**Agent Role:** Full-Stack Engineer  
**Duration:** ~2 hours  
**Prerequisites:** Read `00-PROJECT-BRIEF.md` fully before writing any code

---

## Mission

Build the complete Fair Value Score feature end-to-end:
1. Database function
2. React hook
3. Two components (badge + full card)
4. Wire into existing listing card and listing detail page

---

## Task 1: Database Migration

Create and apply `docs/supabase-migrations/014_fair_value_score.sql`

Copy the `calculate_fair_value_score` function exactly from `00-PROJECT-BRIEF.md`.

**Test it immediately after applying:**
```sql
-- Should return a result (even if insufficient_data with demo data)
SELECT calculate_fair_value_score('any-real-listing-id-from-your-db');
```

---

## Task 2: Hook — `useFairValueScore.ts`

Create `src/hooks/useFairValueScore.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface FairValueResult {
  tier: 'below_market' | 'fair_value' | 'above_market' | 'insufficient_data'
  range_low?: number
  range_high?: number
  avg_accepted_bid?: number
  comparable_count: number
  listing_price?: number
}

export function useFairValueScore(listingId: string | undefined) {
  return useQuery({
    queryKey: ['fair-value-score', listingId],
    queryFn: async (): Promise<FairValueResult> => {
      const { data, error } = await supabase
        .rpc('calculate_fair_value_score', { p_listing_id: listingId })

      if (error) throw error
      return data as FairValueResult
    },
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000,  // 5 minutes — bids don't change that fast
    retry: false,
  })
}
```

---

## Task 3: FairValueBadge Component

Create `src/components/fair-value/FairValueBadge.tsx`

Small badge for listing cards. Compact — just color + label.

```tsx
// Props: tier, isLoading
// Loading: small animate-pulse gray pill
// insufficient_data: render nothing (return null)
// 
// below_market:  bg-amber-100 text-amber-800 border border-amber-300
//                label: "Great Deal"
//
// fair_value:    bg-emerald-100 text-emerald-800 border border-emerald-300
//                label: "Fair Price"
//
// above_market:  bg-red-100 text-red-800 border border-red-300
//                label: "Above Market"
//
// Size: text-xs px-2 py-0.5 rounded-full font-medium
// Add a small colored dot before the label (●)
```

---

## Task 4: FairValueCard Component

Create `src/components/fair-value/FairValueCard.tsx`

Full card for listing detail page and owner management view.

```tsx
interface FairValueCardProps {
  listingId: string
  viewerRole: 'owner' | 'traveler'  // Controls messaging
}

// Card structure (bg-white border rounded-xl p-4):
//
// Row 1: "Fair Value Score" label (left) + TooltipIcon (right)
//   TooltipIcon:
//     term: "Fair Value Score"
//     definition: "Calculated from accepted bid prices for comparable 
//                  listings — same destination, bedroom count, and 
//                  similar dates — over the past 90 days."
//     whyItMatters: "Helps owners price competitively and gives 
//                    travelers confidence they're seeing a fair price."
//
// Row 2: Large tier badge (reuse FairValueBadge but larger size variant)
//
// Row 3: Price range display
//   "Market Range: $X,XXX – $X,XXX"
//   Small text: "Based on X comparable bookings"
//
// Row 4: Context sentence (role-specific):
//
//   OWNER messaging:
//     below_market:  "Your price is below the typical range. 
//                     Consider raising your ask to maximize earnings."
//     fair_value:    "Your price is well-aligned with current demand. 
//                     Good positioning for strong bid activity."
//     above_market:  "Your price is above the typical range for similar 
//                     listings. You may receive fewer bids."
//
//   TRAVELER messaging:
//     below_market:  "This listing is priced below comparable properties. 
//                     Strong value at this price."
//     fair_value:    "This listing is priced within the normal range for 
//                     comparable properties."
//     above_market:  "This listing is priced above comparable properties. 
//                     Bids may be accepted below the asking price."
//
// Row 5 (above_market or below_market only):
//   Small stat: "Average accepted bid: $X,XXX"
//
// insufficient_data: Show nothing — return null, don't render the card
// Loading: Skeleton card with animate-pulse
```

---

## Task 5: Wire Into Existing Pages

### 5a: Listing Cards (browse/search results)

Find the existing listing card component (likely `src/components/ListingCard.tsx`
or similar). Add `FairValueBadge` below the price display:

```tsx
import { FairValueBadge } from '@/components/fair-value/FairValueBadge'
import { useFairValueScore } from '@/hooks/useFairValueScore'

// Inside listing card:
const { data: fairValue, isLoading } = useFairValueScore(listing.id)

// Add below price:
<FairValueBadge tier={fairValue?.tier} isLoading={isLoading} />
```

### 5b: Listing Detail Page

Find the existing listing detail page. Add `FairValueCard` in the pricing section:

```tsx
// Determine viewer role from auth context
const { user } = useAuth()
const isOwner = listing.owner_id === user?.id
const viewerRole = isOwner ? 'owner' : 'traveler'

<FairValueCard listingId={listing.id} viewerRole={viewerRole} />
```

---

## Task 6: Tests

Create `src/components/fair-value/__tests__/FairValueBadge.test.tsx`
Create `src/hooks/__tests__/useFairValueScore.test.ts`

Required tests:
```typescript
test('FairValueBadge renders green for fair_value tier')
test('FairValueBadge renders amber for below_market tier')
test('FairValueBadge renders red for above_market tier')
test('FairValueBadge returns null for insufficient_data')
test('FairValueBadge shows loading skeleton when isLoading true')
test('FairValueCard shows owner messaging when viewerRole is owner')
test('FairValueCard shows traveler messaging when viewerRole is traveler')
test('FairValueCard returns null for insufficient_data')
```

---

## Deliverables Checklist

- [ ] `014_fair_value_score.sql` — created and applied to DEV
- [ ] `calculate_fair_value_score()` tested via SQL — returns valid JSONB
- [ ] `useFairValueScore.ts` — no TypeScript errors
- [ ] `FairValueBadge.tsx` — all 3 tiers render correctly
- [ ] `FairValueCard.tsx` — owner and traveler messaging both correct
- [ ] `FairValueBadge` wired into listing cards
- [ ] `FairValueCard` wired into listing detail page
- [ ] `insufficient_data` — no broken UI, components return null cleanly
- [ ] Loading states work on both components
- [ ] 8+ new tests passing
- [ ] All existing tests still passing
- [ ] `npm run build` — no errors
- [ ] Commit to dev branch:
      `feat: Add Fair Value Score to listing cards and detail pages`

## Handoff

Create `docs/features/fair-value-score/handoffs/session1-handoff.md`:
- SQL function test output (paste result)
- List of existing files modified (listing card, detail page)
- Any schema differences discovered
- Test count
- Known issues
