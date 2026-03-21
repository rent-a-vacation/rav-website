---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Travel Request Enhancements — Known Issues & Constraints

**Status:** Pre-implementation — issues are anticipated, not yet confirmed  
**Feature:** Phase 18 — Travel Request Enhancements  
**Last Updated:** February 21, 2026

---

## Hard Constraints

### Read Existing Files Before Modifying

**Issue:** `process-deadline-reminders` is a live Edge Function handling
booking confirmation reminders for real users. Any regression here is
immediately visible in production.  
**Mitigation:** Agent must read the full file before adding the expiry scan
block. The new block should be clearly separated with a comment header and
not touch any existing code paths.  
**Status:** 🔴 Must read before modifying

---

### Confirm Listing Activation Path Before Wiring Trigger

**Issue:** The agent brief identifies `AdminListings.tsx` as the primary
location for listing approval. However, there may be other paths where
a listing becomes 'active' (e.g., an auto-approval flow in `ListProperty.tsx`,
or a direct DB function). Wiring the trigger only in one place will miss
the others.  
**Mitigation:** Agent must search the codebase for all instances of
`status: 'active'` on listings before wiring. Document all locations found
in the handoff.  
**Status:** 🟡 Investigate thoroughly in Task 3

---

## Anticipated Issues

### DemandSignal Field Names May Differ from Brief

**Issue:** The Project Brief assumes destination is stored as `city` and
`state` fields in the `ListProperty` form. The actual form may use different
field names (`destination`, `location`, `resort_location`, etc.).  
**Impact:** DemandSignal wiring won't compile if field names are wrong.  
**Mitigation:** Agent must read `ListProperty.tsx` form fields before wiring.
Document actual field names used in the handoff.  
**Status:** 🟡 Verify during Task 4

---

### TravelRequestForm May Not Accept defaultValues Prop

**Issue:** `TravelRequestForm` was built to be self-contained without
pre-fill support. Adding a `defaultValues` prop requires modifying existing
component and verifying it doesn't break the existing uses of the form.  
**Impact:** Pre-fill from URL params won't work without this change.  
**Mitigation:** Make the prop optional (`defaultValues?: Partial<FormValues>`)
with empty defaults so all existing usage continues to work unchanged.  
**Status:** 🟡 Check during Task 5, add prop if missing

---

### Budget Disclosure Logic — Edge Cases

**Issue:** The `budget_preference` enum has three values: `undisclosed`,
`ceiling`, `range`. The matching and notification logic must handle all
three correctly:
- `undisclosed`: match on all criteria except budget, never reveal price in notification
- `ceiling`: match only if `final_price <= budget_max`, show budget in notification
- `range`: match only if `final_price <= budget_max`, show budget range in notification  
**Impact:** Incorrect handling reveals private budget info or creates false matches.  
**Mitigation:** Test all three budget preference scenarios during implementation.  
**Status:** 🟡 Critical to test — see Task 7 test requirements

---

### Expiry Warning Email From-Address

**Issue:** The expiry email is sent from `requests@rent-a-vacation.com`.
This subdomain may not be configured in Resend as a verified sender.  
**Impact:** Email fails or lands in spam.  
**Mitigation:** Check Resend verified domains. Use existing verified address
(likely `hello@rent-a-vacation.com` or `support@rent-a-vacation.com`)
as fallback. Update once Cloudflare routing is confirmed.  
**Status:** 🟡 Check Resend config in Task 6

---

### DemandSignal RLS Access

**Issue:** `DemandSignal` queries `travel_requests` from the frontend as
a property owner who is creating a listing. The RLS policy must allow owners
to read open travel_requests.  
**Impact:** If RLS blocks the query, DemandSignal will always show 0.  
**Mitigation:** Check existing RLS on `travel_requests`. The existing
`BiddingMarketplace.tsx` already shows owners open requests — if that
works, DemandSignal will work too (same query, same user role).  
**Status:** 🟢 Likely fine — existing `/bidding` page proves RLS allows it

---

## Post-Implementation Issues

*This section will be filled by the agent after Session 1.*

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| | | | |

---

## Resolution Priority Order

1. Any issue blocking `npm run build`
2. Regression in existing booking confirmation reminder (process-deadline-reminders)
3. Budget disclosure breach (undisclosed budget shown to owner)
4. Match trigger not firing on listing activation
5. DemandSignal field name mismatch
6. Email from-address — use fallback if needed
