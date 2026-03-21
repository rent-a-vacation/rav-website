---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Owner Dashboard — Known Issues & Constraints

**Status:** Pre-implementation — issues are anticipated, not yet confirmed  
**Feature:** Phase 17 — Owner Dashboard  
**Last Updated:** February 21, 2026

---

## Hard Dependencies

### Requires Phase 15 (Fair Value Score) to be complete

**Issue:** `MyListingsTable` and `PricingIntelligence` both import `FairValueBadge`
from `src/components/fair-value/FairValueBadge.tsx`.  
**Impact:** Cannot build this feature until Phase 15 is deployed to DEV.  
**Mitigation:** Build Phase 15 first. If Phase 15 is delayed, use a placeholder
badge component temporarily and replace when Phase 15 ships.  
**Status:** 🔴 Blocker — Phase 15 must be complete first

---

## Anticipated Issues

### Average Rating Placeholder (MEDIUM — by design)

**Issue:** Section 1 Headline Stats includes an "Avg Rating" KPI card, but
check-in confirmation ratings are not yet captured in the database.  
**Impact:** Rating card shows "Coming soon" placeholder.  
**Mitigation:** This is acceptable for launch. Rating data will be added when
a guest review system is built.  
**Status:** 🟡 By Design — future feature

---

### Earnings Data Sparse in DEV (HIGH — expected)

**Issue:** DEV Supabase has limited confirmed bookings, so earnings charts
and fee tracker will show mostly zeros.  
**Impact:** Dashboard looks empty during development and demos on DEV.  
**Mitigation:** Run the executive dashboard seed script (`scripts/seed-executive-demo.ts`)
to populate realistic booking history in DEV before building/testing this feature.  
**Status:** 🟡 Expected — use seed data

---

### RLS — Owner Sees Only Their Own Data (MEDIUM — must verify)

**Issue:** All queries must be scoped to `owner_id = auth.uid()`. The RPC
functions use `SECURITY DEFINER` — verify the `p_owner_id` parameter is
being passed as `auth.uid()` from the frontend and not user-controllable.  
**Impact:** If incorrectly implemented, owner could see another owner's data.  
**Mitigation:** Agent must verify RLS in Session 1 by testing with two different
owner accounts.  
**Status:** 🟡 Must verify during implementation

---

### Inline Price Editor — Race Condition Risk (LOW)

**Issue:** If two browser tabs are open simultaneously and the owner edits
price in both, last-write-wins.  
**Impact:** Unexpected price value after concurrent edits.  
**Mitigation:** Acceptable for current scale. Add optimistic locking in future.  
**Status:** 🟢 Acceptable for launch

---

### "Adjust Price" vs Bid Floor (LOW)

**Issue:** When owner reduces listing price via the inline editor, if there are
active bids above the new price, the bid becomes orphaned (bid > new price).  
**Impact:** Minor UI inconsistency — bids may show as "above asking price."  
**Mitigation:** Add validation: warn owner if pending bids exist above the new price.  
**Status:** 🟡 Add warning in Session 2

---

## Post-Implementation Issues

*This section will be filled by agents after Sessions 1 and 2.*

| Issue | Severity | Session Found | Description | Status |
|-------|----------|---------------|-------------|--------|
| | | | | |

---

## Resolution Priority Order

1. Any issue blocking `npm run build`
2. RLS data isolation (owner seeing wrong owner's data)
3. Broken UI (blank sections, crashes)
4. Rating placeholder — acceptable as-is
5. Edge cases in inline editor
