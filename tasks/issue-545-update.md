## ⚠️ RESEQUENCED — Session 68 close (2026-05-16)

**This issue is no longer next-session pickup.** Per discussion with founder, Stage 2b (live actuals overlay) has been **moved behind Stage 2c (#550) + Stage 2d (#551)** in the implementation order.

### Why resequenced

**Original logic** (DEC-042, Session 65): 2a (view-only) → 2b (live actuals) → 2c (interactive editing) → 2d (Excel download). No documented rationale for 2b-first.

**Founder pushback** (Session 68 close): Stage 2b has nothing to overlay until launch (Month 5+ in the model — around Sep 2026). Building it pre-launch means dev-testing against `actuals = 0 / users = 4 / bookings = 0`, which doesn't validate the feature. Meanwhile, Stages 2c + 2d remove daily friction NOW (founders open `.xlsx` weekly to tweak assumptions; the web tool is currently view-only). Once 2c + 2d ship, the `.xlsx` becomes optional, not primary — which is a real ops win pre-launch.

**Revised ordering:** 2a (shipped) → **2c** (#550) → **2d** (#551) → **2b** (this issue, post-launch positioning).

### Updated positioning

- **Tier:** Post-launch (moved from Tier A pre-launch / next-session pickup)
- **When this becomes valuable:** Month 5+ once real bookings start. Most useful Month 12+ when forecast-vs-actual variance becomes the conversation.
- **Dependencies:** Wait for #550 + #551 to ship. Both Stage 2c (scenarios + interactive editing) and Stage 2d (functional .xlsx download) are higher value pre-launch.
- **Original scope unchanged below.** Architecture (live actuals overlay on monthly trajectory table, second series via `chart` library, pull from Supabase by month bucket) is still valid.

---

## Original context (unchanged)

Phase 2 Stage 2a shipped `/executive-dashboard/financial-model` as a **forecast-only** view (24-month forward projection, scenario toggle, FUNDING ASK + REVENUE MODEL + BREAK-EVEN tabs). DEC-042 logged the separation of forecast (this page) from real-time metrics (`/executive-dashboard` proper).

**Stage 2b** layers **live actuals** on top of the forecast so RAV co-founders can see 'actual vs. plan' month-over-month as the platform accumulates real data.

Tracking has lived in narrative form in `docs/PRIORITY-ROADMAP.md` (Tier A, carried from Session 65). Filed as a discrete issue per repo convention.

## Scope

Pull from Supabase PROD (read-only) the following monthly aggregates and overlay them on the forecast curves:

- **User counts** — `profiles` rows by month (separate counts: travelers / property owners / RAV team)
- **Bookings** — confirmed bookings count + GMV (`bookings.total_amount` sum) by month
- **Net commission revenue** — sum of `bookings.rav_commission` by month (uses `bookings.commission_rate_applied` for historical accuracy per DEC-043)
- **Subscription revenue** — MRR by tier (membership_tiers + active subscriptions)
- **Voice usage** — for the voice-quota narrative (optional, time-permitting)

## UX

Each forecast curve gets a second series rendered alongside it:
- **Forecast** line — dashed, brand teal (`#1C7268`)
- **Actuals (Mo 1-N)** line — solid, brand coral (`#E8703A`)
- Hover tooltip shows both values + variance %
- Chart legend toggles each series independently

Forecast bars/curves stop being editable past month N (actual data takes precedence visually). 'Forward Projection — Not Live Data' amber banner from Stage 2a is updated to read 'Actuals through <month>, projection beyond'.

## Implementation pattern

- **Shared calc lib:** `src/lib/financial-model/` (already exists from Stage 2a). Add an `actuals/` subdirectory with hooks:
  - `useActualUserCounts(monthRange)`
  - `useActualBookings(monthRange)`
  - `useActualCommissionRevenue(monthRange)`
  - `useActualMRR(monthRange)`
- **Edge function** `get-financial-actuals` (or extend the existing exec-dashboard fns) — aggregates queries with proper RLS bypass (RAV team only), returns monthly buckets.
- **Component:** extend `src/pages/FinancialModelDashboard.tsx` to accept actuals data, render the second series.
- **Brand:** dual-color treatment per `docs/brand-assets/BRAND-LOCK.md`.

## Auth

`/executive-dashboard/financial-model` is already gated to `rav_owner` only (auth chain in App.tsx:230). No changes needed.

## Tests

- New hooks: mock Supabase responses; verify monthly bucketing + handling of empty months
- Edge function: SECURITY DEFINER + role check
- Component: rendered with mocked actuals; verify dual-series rendering + variance calc

## Out of scope

- Property owner financial dashboard — separate user story (#546)
- Editable actuals (override from UI) — actuals come from Supabase, not user input
- Multi-currency — single USD per DEC

## References

- DEC-014 (executive dashboard standalone page)
- DEC-042 (financial model as distinct web tool from exec dashboard) — updated Session 68 with resequence note
- DEC-043 (commission rate runtime — historical accuracy via `bookings.commission_rate_applied`)
- Stage 2a PR: see `scripts/financial-model/` + `src/lib/financial-model/` + `src/pages/FinancialModelDashboard.tsx`
- **Stage 2c — #550** (must ship first per resequence)
- **Stage 2d — #551** (must ship first per resequence)
- Narrative tracking: `docs/PRIORITY-ROADMAP.md`

## Estimated effort

3-5 days. Independent of #550 + #551 once those are shipped. **Pickup post-launch (Month 5+)** so the feature can be validated against real data.
