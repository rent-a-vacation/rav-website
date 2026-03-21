---
last_updated: "2026-02-21T19:58:23"
change_ref: "dc07c27"
change_type: "session-39-docs-update"
status: "active"
---
# Travel Request Enhancements — Project Brief

**Phase:** 18  
**Feature name:** Travel Request Enhancements  
**Status:** 🟡 Planning  
**Created:** February 21, 2026  
**Migration:** 016  
**Docs:** `docs/features/travel-request-enhancements/`

---

## Background

The Travel Request system was built in Phase 3 (migration 003). It is a
full reverse-auction: travelers post what they want, owners propose matching
properties, travelers accept. The schema, hooks, and UI all exist.

What it lacks is **automation**. Currently:
- An owner must actively browse `/bidding` to discover open requests
- A traveler who posts a request has no guarantee owners will see it
- There is no signal to owners that demand exists for their specific week
- Travelers on `/rentals` who find zero results don't know the request feature exists

These four enhancements close those gaps without adding a single new table
or page. Everything builds on existing infrastructure.

---

## Enhancement 1 — Automated Match Notification on Listing Activation

### What it does

When a listing status changes to `'active'`, the platform automatically
finds all open `travel_requests` that match and notifies those travelers.
Currently this matching never happens — owners must be discovered passively.

### Matching logic

A `travel_request` is a match when ALL of the following are true:
- `status = 'open'`
- `proposals_deadline > NOW()`
- Destination: `travel_requests.destination_location ILIKE '%{property.city}%'`
  OR `property.city ILIKE '%{destination_location}%'`
- Dates: `listings.check_in_date` falls within `[check_in_date - flexibility_days, check_out_date + flexibility_days]` of the request
- Bedrooms: `properties.bedrooms >= travel_requests.bedrooms_needed`
- Budget: if `budget_preference != 'undisclosed'`, `listings.final_price <= budget_max`
  (if budget is undisclosed, match on all other criteria — owner decides whether to propose)
- Brand: if `preferred_brands` is non-empty, `properties.brand` must be in the array

### Notification content

**When budget is disclosed:**
"A listing matching your request just listed in {city} — {X}BR for ${price}.
 View and receive a proposal →"

**When budget is undisclosed:**
"A listing matching your request just listed in {city} — {X}BR available.
 View it to see pricing →"

This honors the traveler's choice to keep their budget private.

### Implementation

**New Edge Function:** `supabase/functions/match-travel-requests/index.ts`

```typescript
// POST { listing_id: string }
// 1. Fetch listing + property details
// 2. Query matching open travel_requests (see logic above)
// 3. For each match:
//    a. INSERT into notifications (type: 'new_travel_request_match')
//       — this type already exists in the enum
//    b. Send email via Resend using buildEmailHtml() from _shared/email-template.ts
// 4. Return { matched_count, notified_traveler_ids }
// 
// Error handling: if email fails, still create in-app notification
// Deduplication: check if notification already exists for this
//   traveler_id + listing_id + type before inserting
```

**Trigger:** Find where listing status is set to `'active'` in the codebase.
Two places to check:
- `src/components/admin/AdminListings.tsx` — admin approves listing
- `src/pages/ListProperty.tsx` — if auto-approval path exists

After status update in both places, add fire-and-forget call:
```typescript
supabase.functions.invoke('match-travel-requests', {
  body: { listing_id: listing.id }
}).catch(console.error)  // don't await, don't block UI
```

**Migration 016 additions:**
```sql
-- Two new notification type values (the match type already exists,
-- these are for the expiry warning added in Enhancement 4)
ALTER TYPE public.notification_type
ADD VALUE IF NOT EXISTS 'travel_request_expiring_soon';

ALTER TYPE public.notification_type  
ADD VALUE IF NOT EXISTS 'travel_request_matched';
```

Note: `new_travel_request_match` already exists in the enum — use it for
the listing match notification. `travel_request_matched` is for when a
proposal is accepted and the request is fulfilled.

---

## Enhancement 2 — Demand Signal on Listing Creation Form

### What it does

While an owner is filling in the listing form (`/list-property`), after
they enter destination and check-in date, show them how many open travel
requests match those details. This motivates completion and smart pricing.

```
┌─────────────────────────────────────────────────────┐
│  📊 3 travelers are looking for this               │
│  Active requests for 2BR+ in Orlando around        │
│  your dates. Highest disclosed budget: $2,400/wk   │
└─────────────────────────────────────────────────────┘
```

### Implementation

**New component:** `src/components/bidding/DemandSignal.tsx`

```tsx
interface DemandSignalProps {
  destination: string     // from listing form, e.g. "Orlando, FL"
  checkInDate: string     // YYYY-MM-DD
  bedrooms: number
}

// Query (500ms debounce — fires after user stops typing):
// SELECT COUNT(*), MAX(budget_max) FROM travel_requests
// WHERE status = 'open'
//   AND proposals_deadline > NOW()
//   AND destination_location ILIKE '%{city}%'
//   AND check_in_date BETWEEN {checkInDate - 30} AND {checkInDate + 30}
//   AND bedrooms_needed <= {bedrooms}
//
// If count === 0: return null (render nothing)
//
// If count >= 1: amber info card
//   "{count} traveler{s} looking for this"
//   "Active requests for {bedrooms}BR+ in {city} around your dates."
//   If any have disclosed budget: "Highest budget: ${maxBudget}/week"
//   If all undisclosed: omit the budget line entirely
```

**Wire into `ListProperty.tsx`:**
Find the form section where destination (`property.city/state`) and
`check_in_date` are entered. Render `<DemandSignal>` below that section,
passing current form values. It's conditional — renders nothing until
destination + date are both filled.

---

## Enhancement 3 — "Post a Request" CTA on Empty Search Results

### What it does

When a traveler searches `/rentals` and gets zero results, show a prompt
that surfaces the existing Travel Request feature. Currently travelers who
find no results just leave. This converts them from bounces to leads.

```
┌──────────────────────────────────────────────┐
│  🔍 No listings match your search            │
│                                              │
│  Post a request and let owners come to you.  │
│  Tell us what you need — owners with         │
│  matching weeks will send you proposals.     │
│                                              │
│  [Post a Travel Request →]                   │
│                                              │
│  Your request will be visible to all         │
│  verified owners on RAV.                     │
└──────────────────────────────────────────────┘
```

### Implementation

**New component:** `src/components/bidding/PostRequestCTA.tsx`

```tsx
interface PostRequestCTAProps {
  searchDestination?: string  // pre-fill destination on the form
  searchCheckIn?: string      // pre-fill check-in date
  searchCheckOut?: string     // pre-fill check-out date
}

// Simple card component — no data fetching
// "Post a Travel Request →" button links to:
//   /bidding?tab=requests&prefill=true
//   &destination={searchDestination}
//   &checkin={searchCheckIn}
//   &checkout={searchCheckOut}
//
// The /bidding page should read these params and:
//   1. Default to the "Post a Request" tab
//   2. Pre-populate TravelRequestForm fields from params
```

**Wire into `Rentals.tsx`:**
Find the empty state rendered when `listings.length === 0 && !isLoading`.
Add `<PostRequestCTA>` passing the current search filter values.

**Wire pre-fill into `BiddingMarketplace.tsx`:**
Read `?prefill=true&destination=...&checkin=...&checkout=...` from URL params.
If present, default the active tab to "requests" and pass the values as
`defaultValues` to `TravelRequestForm`.

`TravelRequestForm` already accepts props — check if it has `defaultValues`
prop. If not, add it.

---

## Enhancement 4 — Request Expiry Warning Email

### What it does

48 hours before a travel request's `proposals_deadline` expires, send the
traveler an email reminding them their request is about to close and showing
any proposals they've received but not yet reviewed.

This directly reduces silent abandonment — the traveler may have forgotten
they posted a request.

### Implementation

**Add to existing CRON Edge Function:**
`supabase/functions/process-deadline-reminders/index.ts`

This function already runs every 30 minutes scanning for booking confirmation
deadlines. Add a second scan block for expiring travel requests:

```typescript
// === TRAVEL REQUEST EXPIRY WARNINGS ===
// Find requests expiring in the next 48-50 hours
// (window avoids duplicate sends: 48h ± 1h check interval)
const { data: expiringRequests } = await supabase
  .from('travel_requests')
  .select(`
    *,
    profiles!traveler_id(email, full_name),
    travel_proposals(count)
  `)
  .eq('status', 'open')
  .gte('proposals_deadline', new Date(Date.now() + 47 * 3600000).toISOString())
  .lte('proposals_deadline', new Date(Date.now() + 49 * 3600000).toISOString())

for (const request of expiringRequests ?? []) {
  // Check not already sent (use notifications table as dedup log)
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', request.traveler_id)
    .eq('type', 'travel_request_expiring_soon')
    .eq('request_id', request.id)
    .single()

  if (existing) continue  // already warned

  const proposalCount = request.travel_proposals[0].count

  // Create in-app notification
  await supabase.from('notifications').insert({
    user_id: request.traveler_id,
    type: 'travel_request_expiring_soon',
    title: 'Your travel request expires in 48 hours',
    message: proposalCount > 0
      ? `You have ${proposalCount} proposal(s) waiting. Review them before your request closes.`
      : `Your request for ${request.destination_location} closes soon. Extend it or it will expire.`,
    request_id: request.id,
  })

  // Send email
  await resend.emails.send({
    from: 'RAV Requests <requests@rent-a-vacation.com>',
    to: request.profiles.email,
    subject: proposalCount > 0
      ? `${proposalCount} proposal(s) waiting — your request expires in 48h`
      : `Your travel request for ${request.destination_location} expires in 48h`,
    html: buildEmailHtml({
      recipientName: request.profiles.full_name,
      heading: 'Your Travel Request Is Expiring',
      body: `
        ${detailRow('Destination', request.destination_location)}
        ${detailRow('Dates', `${request.check_in_date} – ${request.check_out_date}`)}
        ${detailRow('Proposals received', String(proposalCount))}
        ${detailRow('Expires', new Date(request.proposals_deadline).toLocaleDateString())}
        ${proposalCount > 0
          ? infoBox('You have proposals waiting. Review them before your request closes.', 'warning')
          : infoBox('No proposals yet. You can extend your deadline to give owners more time.', 'info')
        }
      `,
      cta: {
        label: proposalCount > 0 ? 'Review Proposals →' : 'View My Request →',
        url: `https://rent-a-vacation.com/my-bids`,
      },
    }),
  })
}
```

---

## File Summary — What Gets Created or Modified

### Created (new files)
```
supabase/functions/match-travel-requests/index.ts   # New Edge Function
src/components/bidding/DemandSignal.tsx              # Enhancement 2
src/components/bidding/PostRequestCTA.tsx            # Enhancement 3
docs/supabase-migrations/016_travel_request_enhancements.sql
```

### Modified (existing files)
```
supabase/functions/process-deadline-reminders/index.ts  # Add expiry scan block
src/components/admin/AdminListings.tsx                   # Trigger match function on approve
src/pages/ListProperty.tsx                               # Wire DemandSignal
src/pages/Rentals.tsx                                    # Wire PostRequestCTA on empty state
src/pages/BiddingMarketplace.tsx                         # Read prefill URL params
src/components/bidding/TravelRequestForm.tsx             # Add defaultValues prop (if missing)
```

### Not touched
```
src/hooks/useBidding.ts          — no changes needed, existing hooks are sufficient
travel_requests table            — no schema changes
travel_proposals table           — no schema changes
TravelRequestCard.tsx            — no changes
ProposalFormDialog.tsx           — no changes
MyBidsDashboard.tsx              — no changes
```

---

## Implementation Plan — 1 Session

Single session, approximately 3 hours. Build in this order:

1. Migration 016 (5 min — 2 enum values)
2. `match-travel-requests` Edge Function + deploy (45 min)
3. Wire trigger into `AdminListings.tsx` (15 min)
4. `DemandSignal.tsx` + wire into `ListProperty.tsx` (30 min)
5. `PostRequestCTA.tsx` + wire into `Rentals.tsx` (20 min)
6. Pre-fill wiring in `BiddingMarketplace.tsx` (20 min)
7. Expiry scan in `process-deadline-reminders` + redeploy (30 min)
8. Tests (15 min)
9. `PROJECT-HUB.md` update (5 min)

---

## Success Criteria

- [ ] Migration 016 applied to DEV
- [ ] `match-travel-requests` Edge Function deployed and tested
- [ ] Activating a listing triggers matching (verified via Supabase logs)
- [ ] Traveler receives in-app notification when match found
- [ ] Budget not shown in notification when `budget_preference = 'undisclosed'`
- [ ] `DemandSignal` appears on `/list-property` when destination + date filled
- [ ] `DemandSignal` shows nothing when 0 matching requests
- [ ] `DemandSignal` debounces query (no query on every keystroke)
- [ ] `PostRequestCTA` appears on `/rentals` when 0 results
- [ ] CTA links to `/bidding` with correct prefill params
- [ ] `TravelRequestForm` pre-fills destination/dates from URL params
- [ ] Expiry warning added to `process-deadline-reminders` Edge Function
- [ ] Expiry warning not sent twice for same request (deduplication works)
- [ ] All existing bidding system tests still pass
- [ ] `npm run build` — no errors
- [ ] `PROJECT-HUB.md` updated — Phase 18 marked complete

---

## Key Decisions

### DEC-025: Enhance Travel Requests, Not Build Wishlist Matching
**Date:** February 21, 2026  
**Decision:** Retire the Wishlist Matching concept. Enhance the existing
Travel Request feature with automation instead of building a parallel system.  
**Reasoning:** `travel_requests` and `travel_proposals` already implement
the core reverse-auction data model completely. The `budget_preference` enum
(undisclosed/ceiling/range) is more sophisticated than the wishlist spec.
Building a second system creates two overlapping concepts, user confusion,
and double the maintenance surface. The missing piece is automation, not data.  
**Alternatives considered:** Keeping both as separate UX concepts (passive
background wishlist vs active marketplace request). Rejected because it adds
product complexity without proportional value at current scale.  
**Status:** ✅ Final

### DEC-026: Fire-and-Forget Match Trigger
**Date:** February 21, 2026  
**Decision:** Match notification is triggered with `.catch(console.error)` —
not awaited, does not block listing approval flow.  
**Reasoning:** Matching is best-effort. If the Edge Function fails, the
listing is still approved correctly. Admin or owner should not see an error
because a background notification job failed.  
**Status:** ✅ Final

### DEC-027: Deduplication via Notifications Table
**Date:** February 21, 2026  
**Decision:** Use the `notifications` table itself as the deduplication log.
Before inserting a match notification, check if one already exists for the
same `user_id + type + request_id`.  
**Reasoning:** Simplest approach, no new table or column needed. The
notifications table is already indexed on `user_id`.  
**Status:** ✅ Final
