# PROJECT HUB - Rent-A-Vacation

> **Architectural decisions, session context, and agent instructions**
> **Task tracking has moved to [GitHub Issues & Milestones](https://github.com/rent-a-vacation/rav-website/issues)**
> **Project board: [RAV Roadmap](https://github.com/orgs/rent-a-vacation/projects/1)**
> **Last Updated:** March 5, 2026 (Session 37: #99, #105)
> **Repository:** https://github.com/rent-a-vacation/rav-website
> **App Version:** v0.9.0 (build version visible in footer)

---

## INSTRUCTIONS FOR AI AGENTS

**Read this section before making any changes to PROJECT-HUB.md**

### What This File Is For (and What It's NOT For)

**This file is for:**
- KEY DECISIONS LOG (DEC-XXX entries)
- Architecture notes and technical decisions
- Session handoff context
- Known issues and blocked items

**This file is NOT for:**
- Task tracking → use [GitHub Issues](https://github.com/rent-a-vacation/rav-website/issues)
- Priority ordering → use [GitHub Milestones](https://github.com/rent-a-vacation/rav-website/milestones)
- Board view → use [RAV Roadmap](https://github.com/orgs/rent-a-vacation/projects/1)
- Completed phase details → use [COMPLETED-PHASES.md](COMPLETED-PHASES.md)

### GitHub Issues Workflow (see CLAUDE.md for full details)

**At START of every session:**
```bash
gh issue list --repo rent-a-vacation/rav-website --state open --label "pre-launch"
```

**At END of every session:**
```bash
# Close completed issues with summary
gh issue close <number> --repo rent-a-vacation/rav-website --comment "Completed: [summary]"

# Create issues for anything discovered
gh issue create --repo rent-a-vacation/rav-website --title "..." --label "..." --body "..."
```

### When to Update This File

**ALWAYS update at the END of your session if you:**
- Make an architectural decision (add to KEY DECISIONS LOG)
- Discover a known issue or blocker
- Need to pass context to the next session

### Decision Logging
**When you make a technical or product decision:**
1. Add it to "KEY DECISIONS LOG" section
2. Use format: DEC-XXX (next sequential number)
3. Include: Date, Decision, Rationale, Status

**Decisions Log archival → `docs/DECISIONS.md`**
- When a decision is 1+ month old and status is final, move it to `docs/DECISIONS.md`
- Leave a one-line entry: `- DEC-XXX: [title] → [details](DECISIONS.md#dec-xxx)`
- Keep recent/pending decisions inline

### What NOT to Do
- Don't track tasks here — use GitHub Issues
- Don't update priority queues here — use GitHub Milestones
- Don't delete information (move to COMPLETED-PHASES.md or DECISIONS.md)
- Don't skip updating "Last Updated" date at the bottom

---

## CURRENT STATUS

> **Task tracking has moved to GitHub Issues.** See [open issues](https://github.com/rent-a-vacation/rav-website/issues) and the [RAV Roadmap](https://github.com/orgs/rent-a-vacation/projects/1) board.

### Quick Links
- **Open issues:** `gh issue list --repo rent-a-vacation/rav-website --state open`
- **Pre-launch issues:** `gh issue list --repo rent-a-vacation/rav-website --state open --label "pre-launch"`
- **Project board:** https://github.com/orgs/rent-a-vacation/projects/1

### Open Milestones
> See [GitHub Milestones](https://github.com/rent-a-vacation/rav-website/milestones) for the current list. Do not duplicate here.

### Known Issues
- **PropertyDetail/Checkout dates are read-only** — By design for timeshare listings (owner sets fixed dates), but users may expect date selection.
- **VAPI overrides limited** — Transcriber (nova-3), keyword boosts, and speaking plans cause 400 errors via SDK overrides. Must configure in VAPI dashboard Advanced tab.
- Edge functions require `--no-verify-jwt` deployment flag

### Platform Status
- **676 automated tests** (90 test files, all passing), 0 type errors, 0 lint errors, build clean
- **P0 tests:** 97 critical-path tests tagged `@p0` — run with `npm run test:p0`
- **CI reporting:** GitHub native via dorny/test-reporter (JUnit XML) — PR annotations on every run (Qase removed Mar 2026)
- **Migrations created:** 001-043 (all deployed to DEV and PROD)
- **Edge functions:** 26 (25 deployed + `idle-listing-alerts` pending deploy)
- **PROD platform:** locked (Staff Only Mode enabled)
- **Supabase CLI:** currently linked to DEV
- **dev and main:** in sync (PR #183, #184 merged)

### Session Handoff (Sessions 25-37)

**Session 37 — Dynamic Pricing & Referral Program (Mar 5):**
- Closed #99 (Dynamic Pricing): `src/lib/dynamicPricing.ts` — urgency discount (graduated 0-15%), seasonal factor (month-based historical data), demand adjustment (pending bids + saved searches). Migration 042: `get_dynamic_pricing_data` RPC. `useDynamicPricing` hook. Enhanced `PricingSuggestion` component with factor badges. 33 tests.
- Closed #105 (Referral Program): Migration 043 — `referral_codes` + `referrals` tables, 3 RPCs (get_or_create_referral_code, record_referral, get_referral_stats). `src/lib/referral.ts` utilities. `useReferral` hooks. `ReferralDashboard` component in Owner Dashboard Account tab. Signup captures `?ref=` param. 16 tests.
- Deployed migrations 036-043 to both DEV and PROD
- Tests: 627→676 (+49 new, 90 test files)
- PRs #183 and #184 merged to main

**Session 36 — Admin Tools, Docs & Dispute Expansion (Mar 4):**
- Closed #176 (UserGuide & Documentation): 13 new UserGuide sections (6 owner + 7 renter) + 12 new Documentation sections covering Sessions 27-35 features
- Closed #177 (Admin Property Editing): AdminPropertyEditDialog with audit trail. Migration 040 (shared with #178): last_edited_by/at on properties + listings, admin_edit_notes on listings. 6 tests.
- Closed #178 (Admin Listing Editing): AdminListingEditDialog with live price calc via computeListingPricing(). Disabled for booked/completed. 7 tests.
- Closed #179 (Resort Data Import): AdminResortImport 3-step UI + resortImportUtils (validate, duplicate check, template). New "Resorts" admin tab. 11 tests.
- Closed #180 (Dispute Expansion): Migration 041 — 5 owner dispute categories + evidence_urls. useDisputeEvidence hook + EvidenceUpload component. Role-aware ReportIssueDialog. "Report Issue" in OwnerBookings. Evidence thumbnails in AdminDisputes. 11 tests.
- Tests: 592→627 (+35 new, 86 test files)
- PR #181 created

**Session 35 — OpenAPI Validation, P0 Tests & iCal Export (Mar 4):**
- Closed #172 (OpenAPI Spec Validation): Fixed 14 errors (missing security declarations) + 35 warnings. Added `operationId`, `security`, `x-rate-limit` extensions to all 26 endpoints. `StripeSignature` security scheme. Added missing `idle-listing-alerts` endpoint.
- Closed #101 (iCal Calendar Export): `src/lib/icalendar.ts` — RFC 5545 compliant, zero dependencies. `useOwnerCalendarExport` hook. "Export Calendar" button in OwnerBookings. 18 tests.
- #149 Phase A completed (P0 Test Library): `docs/P0-TEST-CASES.md` — 20 scenarios across 7 journeys. 97 tests tagged `@p0` across 14 files. `npm run test:p0` script. Phase B (Playwright E2E) and Phase C (Qase sync) remain open.
- Updated `docs/testing/` — TEST-STRATEGY.md, TESTING-GUIDELINES.md, OPERATIONAL-GUIDE.md, TEST-SETUP-CHECKLIST.md brought current with 592-test reality.
- Tests: 574→592 (+18 new, 81 test files)

**Session 24 — GDPR, Disputes & Security Hardening (Feb 26):**
- Dispute Resolution (#79): Migration 026, `process-dispute-refund` edge fn, AdminDisputes.tsx, ReportIssueDialog.tsx
- GDPR Account Deletion (#89): Migration 027, `export-user-data` + `delete-user-account` edge fns, 14-day grace period, anonymization
- CSP Headers (#66): `vercel.json` security headers (script-src, HSTS, X-Frame-Options, etc.)
- Rate Limiting (#67): Migration 028, `_shared/rate-limit.ts`, applied to 7 edge functions
- Cookie consent (#69), Email verification (#81), Escrow improvements (#91), Tax disclosure (#92), Notification prefs (#82)
- Tests sprint: 306→387

**Session 25 — Role-Based UX Overhaul (Feb 26-27):**
- 10 issues closed (#131-#140) across 3 batches
- Admin entity cross-linking + search by ID (#131, #132)
- Date-range filters + admin notes on users (#133, #134)
- Owner escrow visibility, renter disputes, rejection reasons (#135, #136, #137)
- Bulk approve/reject listings, SLA age badges, dispute assignment (#138, #139, #140)
- Migration 031: dispute assignment column
- Tests: 387→402

**Session 26 — GA4, Tax Reporting & Doc Fixes (Feb 27):**
- GA4 Integration (#74): `src/lib/analytics.ts` with cookie-consent-gated gtag.js, SPA tracking, typed event helpers, CSP updates. Measurement ID: G-G2YCVHNS25
- Admin Tax & 1099-K Reporting (#62, #64): `AdminTaxReporting.tsx` tab with monthly revenue table, owner earnings tracking, $600 threshold, W-9 status. Migration 032: tax info fields on profiles
- Doc repo references (#70): Updated old tektekgo references to rent-a-vacation/rav-website
- Tests: 402→409

**Session 27 — Reviews, Messaging, Sort, Portfolio (Feb 28):**
- Post-stay review system (#95): Migration 033, reviews table with sub-ratings, StarRating component, ReviewForm/List/Summary, integrated into PropertyDetail + MyBookings
- Listing sort options (#97): Sort by price, date, rating, newest on Rentals page
- Renter-owner messaging (#98): Migration 034, booking_messages table, BookingMessageThread chat UI, integrated into MyBookings + OwnerBookings
- Multi-property portfolio (#103): Migration 035, portfolio RPC, PortfolioOverview with expandable PropertyCalendar in OwnerDashboard
- Admin owner filter (#120): Owner dropdown in AdminListings tab
- Demo walkthrough document: docs/DEMO-WALKTHROUGH.md (comprehensive presentation script)
- Tests: 409→451 (42 new)

**Session 34 — 8 Issues: Realtime, UX Enhancements & Infrastructure (Mar 4):**
- Closed #104 (Realtime Notifications): `useRealtimeSubscription` hook, replaced polling in NotificationBell (30s), BookingMessageThread (10s), unread counts (30s)
- Closed #117 (Role Upgrade Notification): In-app notification + email on admin approval, Realtime auto-detection in RoleUpgradeDialog with celebration toast
- Closed #155 (Owner Profiles): Migration 036 (`get_owner_profile_summary` RPC), OwnerProfileCard with avatar, verification badge, stats. Integrated into PropertyDetail sidebar
- Closed #158 (Destination Browsing): 10 destinations/35 cities, DestinationDetail page with breadcrumbs and city drill-down, rewrote Destinations page with dynamic listing counts
- Closed #164 (Renter Dashboard): `/my-trips` with 4 tabs (Overview, Bookings, Offers, Favorites), consolidated nav, saved searches section
- Closed #157 (Pre-Booking Messaging): Migration 037 (listing_inquiries + inquiry_messages tables), InquiryDialog + InquiryThread, "Ask the Owner" button on PropertyDetail
- Closed #156 (Saved Searches): Migration 038 (saved_searches table + price tracking columns), SaveSearchButton on Rentals, SavedSearchesList in RenterDashboard, price drop badge
- Closed #163 (Idle Week Alerts): Migration 039 (alert tracking columns), `idle-listing-alerts` edge function (cron, max 50/run, 60d+30d thresholds), pure utilities
- Created #172, #173, #174 (API docs follow-up: spec validation, edge-case schemas, public API design)
- 30 new files, 22 modified files, 4 new migrations, 1 new edge function
- Tests: 507→574 (+67 new, 80 test files)

**Session 33b — OpenAPI Spec & Swagger UI (#171) (Mar 3):**
- OpenAPI 3.0.3 spec for all 25 edge functions at `docs/api/openapi.yaml`
- Swagger UI at `/api-docs` (admin-gated, CDN-loaded, no npm packages)
- Audit script: `node scripts/generate-openapi.cjs --audit` — confirms 25/25 coverage
- Tags: AI, Payments, Payouts, Cancellations, Disputes, Escrow, Notifications, Marketplace, GDPR, Data, Admin
- New files: 6 created, 1 modified (App.tsx route only)
- Tests: 507 (unchanged — docs-only, no new business logic)

**Session 33 — UX Improvements: 5 Frontend-Only Issues (Mar 3):**
- Closed #159 (Cancellation Policy): `CancellationPolicyDetail` component + `cancellationPolicy.ts` utility — color-coded refund rules with concrete deadlines. Integrated into PropertyDetail + Checkout.
- Closed #161 (Booking Timeline): `BookingTimeline` component + `bookingTimeline.ts` — 5-step lifecycle progress (payment → owner confirm → details → check-in → review). Integrated into BookingSuccess + MyBookings (compact + expandable).
- Closed #162 (Pricing Suggestions): `usePricingSuggestion` hook + `PricingSuggestion` component — market range bar from active listings by brand/location. Integrated into ListProperty + OwnerListings dialog.
- Closed #160 (Compare Properties): `CompareListingsDialog` + `compareListings.ts` — side-by-side comparison (max 3) with "Best" badges. Compare mode toggle on Rentals page.
- Closed #153 (Dashboard Consolidation): OwnerDashboard 11 tabs → 4 (Dashboard, My Listings, Bookings & Earnings, Account) with Collapsible sub-sections. Backwards-compatible TAB_REDIRECTS map for old URLs.
- 12 new files, 9 modified files, flow manifest tab refs updated
- PR #170 created (dev → main)
- Tests: 462→507 (+45 new, 69 test files)

**Session 32 — Staff Permissions (#119) (Mar 3):**
- Closed #119 (rav_staff distinct permissions): Added `isRavAdmin()` helper to AuthContext (true for `rav_admin`/`rav_owner`, false for `rav_staff`)
- Gated 7 sensitive admin tabs behind `isRavAdmin()`: financials, tax, payouts, memberships, settings, voice, dev-tools
- Staff sees 10 operational tabs (overview, properties, listings, bookings, escrow, issues, disputes, verifications, users, approvals)
- `useSystemSettings` mutation guard changed from `isRavTeam()` → `isRavAdmin()`
- URL redirect: staff navigating to restricted tab via `?tab=financials` gets redirected to overview
- PR #169 merged to main
- Tests: 451→462 (+11 new, 4 isRavAdmin role checks + test infrastructure)

**Session 31 — P0 UX: CTAs, Pricing Transparency, Marketplace Language (Mar 3):**
- Closed #150 (Simplify CTAs): PropertyDetail collapsed 5 buttons → 1 primary "Book Now" + Collapsible "More booking options" with descriptions
- Closed #151 (Pricing Transparency): Fee breakdown (base, 15% service fee, cleaning fee, total) on PropertyDetail + Checkout via `computeFeeBreakdown()`. Listing cards show `$X/night + fees`. FAQ bug fix: "3-5%" → "15%"
- Closed #154 (Marketplace Language): All UI "bid" → "offer", "Marketplace" → "Name Your Price", "Open for Bidding" → "Flexible Pricing". Database unchanged.
- 18 files changed across source, tests, flow manifests, docs (UserGuide, Documentation, HowItWorksPage, DEMO-WALKTHROUGH, ARCHITECTURE)
- Created #165 (Owner Volume Discount — configurable commission tiers based on completed bookings)
- Created #166 (Revisit membership tier value proposition beyond voice hours)
- PR #167 merged, PR #168 merged
- Tests: 451 (unchanged — no new business logic)

**Session 30 — Code Splitting, CI Fix & QA Strategy (Mar 2):**
- Route-level code splitting (#108): 21 pages converted to `React.lazy()` + `Suspense`, `PageLoadingFallback` spinner. Build clean.
- CI/Qase fix: Replaced `vitest-qase-reporter` (required Business plan, zero case IDs tagged) with `dorny/test-reporter` + Vitest JUnit XML output. PR annotations now free and subscription-free.
- QA platform review issue created (#149): tracks future decision on curated P0 test case library + test management platform selection
- Docs updated: TESTING-GUIDELINES.md, TEST-STRATEGY.md, PROJECT-HUB.md, COMPLETED-PHASES.md
- PR #148 open: code splitting + CI fix → main
- Tests: 451 (unchanged — no new business logic)

**Session 29 — Sentry Source Maps & Optimization (Mar 1):**
- Source map uploads via `@sentry/vite-plugin` — stack traces now show real file/line/function in Sentry dashboard
- Browser tracing (`browserTracingIntegration`) — page load metrics, SPA route changes, HTTP request durations
- Session replay (`replayIntegration`) — DOM recordings of error sessions (50 free/month)
- `tracesSampleRate` lowered to 5% (free tier budget: 10K/month)
- `SENTRY_AUTH_TOKEN` added to `.env.local`, Vercel env vars, GitHub Actions secrets
- DevTools "Sentry Error Test" card for verification (DEV-only)
- PRs #145 + #146 merged, issue #147 closed
- Tests: 451 (unchanged — no new business logic)

**Session 28 — Accounting Strategy & Documentation (Feb 28):**
- Accounting tool evaluation: Puzzle.io selected over QuickBooks (native Stripe, free tier, automated ASC 606)
- Updated DEC-022 to reflect Puzzle.io + pluggable architecture decision
- Updated `docs/RAV-PRICING-TAXES-ACCOUNTING.md` v2.1 — staged growth plan (§9), environment mapping (§10), tool evaluation appendix
- Updated issue #63: renamed to "Accounting Integration (Puzzle.io → pluggable)", detailed implementation plan
- Key insight: Puzzle.io IS the ledger (not middleware) — replaces QB/Xero, doesn't supplement them
- Key insight: 1099-K handled natively by Stripe Connect ($2.99/form) — no Gusto needed
- Puzzle.io account created, but **onboarding blocked at step 7** — requires bank connection → EIN → LLC formation (#127)
- Issue #63 marked `blocked` with resume instructions
- PR #144 merged — dev and main in sync

**Open pre-launch issues:** 3 remaining (#80 Legal review, #87 Launch checklist, #127 Business formation — blocked)

**Blocked dependency chain:**
```
#127 (Form LLC, get EIN) ──blocks──→ Stripe Tax activation
                          ──blocks──→ Puzzle.io onboarding (#63)
                          ──blocks──→ Business bank account
```

**Resume instructions when #127 is unblocked:**
1. Form LLC → receive EIN
2. Open Mercury bank account (recommended) with EIN
3. Resume Puzzle.io onboarding at step 7 → connect bank + Stripe
4. Activate Stripe Tax in Stripe Dashboard (zero code changes needed)
5. Build pluggable accounting adapter (#63 Phase E.2, 4-6 hours)

**Next recommended work (not blocked):**
- #87 Launch readiness checklist
- #80 Legal review of Terms/Privacy
- Deploy migrations 036-039 to Supabase DEV and PROD
- Deploy `idle-listing-alerts` edge function
- API docs follow-up (#172, #173, #174)

---

## COMPLETED PHASES

> Full details for all completed phases: [COMPLETED-PHASES.md](COMPLETED-PHASES.md)

<details>
<summary><strong>Phase 19: Flexible Date Booking + Per-Night Pricing</strong> — Completed Feb 22, 2026</summary>

**What:** Switch platform to per-night pricing, add flexible date proposals on bids, and "Inspired By" travel requests from listing detail.

**3 Tracks:**
- **Per-Night Pricing:** Migration 020 adds `nightly_rate` column to listings (backfilled from `owner_price / nights`). Shared `src/lib/pricing.ts` utility replaces 4 duplicated `calculateNights()` functions. All displays (Rentals, PropertyDetail, Checkout, FeaturedResorts, MyListingsTable, PricingIntelligence) use DB `nightly_rate`. Owner listing form switched from "Your Asking Price" to "Nightly Rate" with live price summary (nights x rate, RAV fee, traveler total).
- **Option A — Propose Different Dates:** BidFormDialog gains `mode` prop (`'bid'` | `'date-proposal'`). Date-proposal mode shows date pickers with auto-computed bid amount (`nightly_rate x proposed nights`). `listing_bids` gets `requested_check_in/out` columns. BidsManagerDialog shows proposed dates in blue badge. "Propose Different Dates" button on PropertyDetail.
- **Option B — Inspired Travel Request:** `InspiredTravelRequestDialog` pre-fills TravelRequestForm with listing's location, dates, bedrooms, brand. "Send to this owner first" toggle (`target_owner_only`). `travel_requests` gets `source_listing_id` + `target_owner_only` columns. "Request Similar Dates" button on PropertyDetail.

**Database:** Migration `020_flexible_dates_nightly_pricing.sql` — 3 ALTER TABLEs + backfill + constraint
**New Files:** `src/lib/pricing.ts`, `src/lib/pricing.test.ts`, `src/components/bidding/InspiredTravelRequestDialog.tsx`, `src/components/bidding/BidFormDialog.test.tsx`
**Modified:** ~20 files (types, hooks, components, pages, seed manager, flow manifests, email)
**Tests:** 289 total (16 new), 0 type errors, 0 lint errors, build clean
</details>

<details>
<summary><strong>Seed Data Management System</strong> — Completed Feb 21, 2026</summary>

**What:** Complete 3-layer seed data system for DEV environment testing and executive demos.

**3 Layers:**
- **Layer 1 (Foundation):** 8 permanent users — 3 RAV team (dev-owner, dev-admin, dev-staff) + 5 property owners (Alex Rivera/HGV, Maria Chen/Marriott, James Thompson/Disney, Priya Patel/Wyndham, Robert Kim/Bluegreen). Marked `is_seed_foundation = true`, never wiped.
- **Layer 2 (Inventory):** 10 properties (2 per owner, real resort names), 30 listings (15 active, 10 bidding, 5 draft)
- **Layer 3 (Transactions):** 50 renters with growth curve (8→16→26 over 90 days), 90 completed bookings, 10 pending, 5 in escrow, 5 cancellations, 20 bids, 10 travel requests, 8 proposals

**Database:** Migration `015_seed_foundation_flag.sql` — `is_seed_foundation` boolean column on profiles with partial index
**Edge Function:** `seed-manager` with 3 actions: `status` (table counts), `reseed` (full 3-layer creation), `restore-user` (recreate deleted accounts)
**Admin UI:** `DevTools.tsx` — 4 sections (status grid, reseed with log, test accounts table, Stripe test cards). Conditional tab in AdminDashboard (DEV only)
**Safety:** Production guard (`IS_DEV_ENVIRONMENT` secret), protected set (foundation + RAV team members), FK-ordered 21-table deletion
**Documentation:** `docs/testing/SEED-DATA-GUIDE.md`

**Files:** 6 created/modified
**Password:** All seed accounts use `SeedTest2026!`
</details>

<details>
<summary><strong>Phase 14: Executive Dashboard</strong> — Completed Feb 20, 2026</summary>

**What:** Investor-grade strategic dashboard for RAV Owner — dark-themed, boardroom-quality business intelligence with 6 sections.

**6 Sections:**
- **HeadlineBar:** Sticky bar with 5 KPI pills (GMV, Revenue, Active Listings, Liquidity Score, Voice Adoption)
- **BusinessPerformance:** 4 Recharts charts — GMV trend (AreaChart), bid activity (LineChart), bid spread index (BarChart), revenue waterfall (StackedBarChart)
- **MarketplaceHealth:** Proprietary metrics — Liquidity Score SVG gauge, supply/demand destination map, voice vs traditional funnel
- **MarketIntelligence:** BYOK pattern — AirDNA market comparison, STR Global benchmarks, RAV pricing position
- **IndustryFeed:** NewsAPI integration, regulatory radar timeline, macro indicators with sparklines
- **UnitEconomics:** 7 metric cards (CAC, LTV, LTV:CAC, Payback, Avg Booking, Take Rate, MoM Growth) with methodology

**Database:** Migration `013_executive_dashboard_settings.sql` — 4 system_settings rows for API key storage
**Edge Functions:** `fetch-industry-news`, `fetch-macro-indicators`, `fetch-airdna-data`, `fetch-str-data` (all with caching + fallback)
**New Hooks:** `useBusinessMetrics`, `useMarketplaceHealth`, `useIndustryFeed`, `useMarketIntelligence`
**Components:** ~15 new files in `src/components/executive/`
**Flow Manifest:** `admin-lifecycle.ts` updated with executive_dashboard step

**Files:** ~25 created, 4 modified
**Tests:** 15+ new tests (hooks + components)
</details>

<details>
<summary><strong>Phase 13: Core Business Flow Completion</strong> — Completed Feb 20, 2026</summary>

**What:** Complete the 5 remaining implementation gaps in core business flows.

**5 Tracks:**
- **Track C:** Approval email notifications — wired existing `send-approval-email` edge function to AdminListings approve/reject actions
- **Track A:** Owner bidding UI — "Place Bid" button on PropertyDetail page, comprehensive tests for all 18 bidding hooks
- **Track E:** Property image upload — Supabase Storage bucket with RLS, `usePropertyImages` hook, drag-and-drop upload component, integrated into ListProperty form
- **Track D:** Payout tracking — `usePayouts` hooks, OwnerPayouts component with stats cards + table, Payouts tab in OwnerDashboard
- **Track B:** Owner Confirmation Timer — configurable countdown timer (default 60 min), extension system (max 2 × 30 min), auto-timeout with refund, 3 new email types, admin settings UI, flow manifest updates

**Database:** Migration `012_phase13_core_business.sql` — property-images storage bucket, owner confirmation columns on `booking_confirmations`, 3 system settings, `extend_owner_confirmation_deadline` RPC

**New hooks:** `useOwnerConfirmation` (7 sub-hooks), `usePayouts` (3 sub-hooks), `usePropertyImages` (4 sub-hooks)
**New components:** `OwnerConfirmationTimer`, `OwnerPayouts`, `PropertyImageUpload`
**Edge functions updated:** `verify-booking-payment`, `send-booking-confirmation-reminder` (3 new types), `process-deadline-reminders` (timeout processing)
**Flow manifests:** Both `owner-lifecycle.ts` and `traveler-lifecycle.ts` updated with owner confirmation steps

**Files:** ~30 modified/created
**Tests:** 142/142 passing, 0 type errors, 0 lint errors
</details>

<details>
<summary><strong>Role Terminology Standardization</strong> — Completed Feb 17, 2026</summary>

**What:** Standardize all UI-facing role terminology from "Traveler" to "Renter" across the entire application to clearly convey the role function.

**Key deliverables:**
- Centralized `ROLE_LABELS`, `ROLE_COLORS`, `AccountType` in `src/types/database.ts`
- 27 files updated: components, pages, flows, hooks, tests, documentation
- Renamed `useTravelerTiers` → `useRenterTiers`, `TravelerBadge` → `RenterBadge` (deprecated aliases kept)
- Signup default `accountType` changed from `"traveler"` to `"renter"`
- Flow manifests: "Traveler Journey" → "Renter Journey" with updated descriptions
- All documentation pages (Documentation, UserGuide, FAQ, HowItWorks) updated
- Admin dashboard: Architecture link added for `rav_owner` role
- DB-level `role_category = 'traveler'` intentionally unchanged (database schema)

**Files:** 27 modified, 0 created
**Tests:** 96/96 passing, 0 type errors, 0 lint errors
</details>

<details>
<summary><strong>UX Feedback Improvements</strong> — Completed Feb 16, 2026</summary>

**What:** Replace fleeting toasts with persistent inline success states across all key user workflows.

**Key deliverables:**
- `ActionSuccessCard` reusable component (icon, title, description, reference box, email indicator, action buttons)
- 7 new tests for ActionSuccessCard, total 96 tests passing
- 6 dialog/page flows enhanced: OwnerListings, OwnerProperties, BidFormDialog, RoleUpgradeDialog, Signup, BookingSuccess
- 2 email confirmation functions: `sendListingSubmittedEmail()`, `sendPropertyRegisteredEmail()`
- BookingSuccess: booking reference number + "What Happens Next" timeline (email, owner confirmation, check-in)
- Admin dashboard: fixed tab layout (invalid `grid-cols-13` → `flex flex-wrap`)
- Removed redundant `toast.success` from `useCreateBid` and `useRequestRoleUpgrade` hooks

**Files:** 11 modified, 2 created
</details>

<details>
<summary><strong>Phase 11: Progressive Web App (PWA)</strong> — Completed Feb 16, 2026</summary>

**What:** Full PWA support using `vite-plugin-pwa` with Workbox auto-generated service worker.

**Key deliverables:**
- Service worker with precaching (59 entries) + runtime caching (Google Fonts, Unsplash)
- Web app manifest generated from Vite config (standalone, portrait, themed)
- Install prompt banner (Android Chrome) with 14-day dismiss, standalone detection
- Offline detection banner with `useSyncExternalStore`
- iOS meta tags (`apple-mobile-web-app-capable`, status bar, title)
- 11 new tests (4 useOnlineStatus + 7 usePWAInstall), total 89 tests passing

**Files:** 6 modified, 6 created, 1 deleted (`public/site.webmanifest` → VitePWA generates it)

**New hooks:** `useOnlineStatus`, `usePWAInstall`
**New components:** `OfflineBanner`, `PWAInstallBanner`
</details>

- **Phase 9:** Voice toggles, membership tiers (6 tiers), commission config, tier-aware quotas — [details](COMPLETED-PHASES.md#phase-9-voice-toggles-membership-tiers--commission)
- **Phase 8:** Testing infrastructure — 78 tests, Vitest, Playwright E2E, Percy, GitHub Actions CI — [details](COMPLETED-PHASES.md#phase-8-testing-infrastructure)
- **TS Build Fixes:** Supabase v2 type inference fixes, architecture diagram system, flow manifests — [details](COMPLETED-PHASES.md#typescript-build-fixes--architecture-diagrams)
- **Phase 7:** UI excellence — social proof, honest content, visual polish, similar listings — [details](COMPLETED-PHASES.md#phase-7-ui-excellence--social-proof)
- **Phase 6:** Role upgrade system, dead-end UX prevention, signup role selection — [details](COMPLETED-PHASES.md#phase-6-role-upgrade-system--dead-end-ux-prevention)
- **Phase 5:** Core business flows — real DB queries, Checkout page, Stripe, booking flow — [details](COMPLETED-PHASES.md#phase-5-core-business-flows)
- **Phase 4B:** UI fixes — calendar tabs, pagination, favorites, forgot-password — [details](COMPLETED-PHASES.md#phase-4---track-b-ui-fixes)
- **Phase 4A:** Voice auth & approval — auth gate, admin approval, usage limits — [details](COMPLETED-PHASES.md#phase-4---track-a-voice-auth--approval-system)
- **Phase 4D:** Documentation updates — user guide, FAQ, how it works, admin docs — [details](COMPLETED-PHASES.md#phase-4---track-d-documentation-updates)
- **Voice Fixes:** Interruption + budget assumption fixes — [details](COMPLETED-PHASES.md#fix-known-voice-issues)
- **Phase 2:** Resort master data — 117 resorts, 351 unit types — [details](COMPLETED-PHASES.md#phase-2-resort-master-data)
- **Phase 1:** Voice search — VAPI integration, NLP search — [details](COMPLETED-PHASES.md#phase-1-voice-search)

---

## RESEARCH SPIKES

### RS-001: LiveKit Voice Agents SDK Evaluation
**Date Added:** February 15, 2026
**Status:** Closed — Decision made (DEC-012: Stay on VAPI)
**Resolution:** Cost savings from LiveKit don't justify 3-6 weeks of engineering at current scale (~$300-700/month voice spend). Revisit when monthly voice spend consistently exceeds $3,000/month.

---

## IDEAS BACKLOG

> **Ideas are now tracked as GitHub Issues with the `idea` label.**
> View: `gh issue list --repo rent-a-vacation/rav-website --label "idea"`
>
> To add a new idea:
> ```bash
> gh issue create --repo rent-a-vacation/rav-website --title "Idea: [description]" --label "idea" --body "[details]"
> ```

---

## KEY DECISIONS LOG

> Archived finalized decisions: [DECISIONS.md](DECISIONS.md)

**Archived:**
- DEC-001: Hybrid agent sessions — [details](DECISIONS.md#dec-001-hybrid-agent-sessions-for-phase-2)
- DEC-002: Voice search access control (logged-in only) — [details](DECISIONS.md#dec-002-voice-search-access-control)
- DEC-003: Voice quota design (tier-based) — [details](DECISIONS.md#dec-003-voice-usage-quota-design)
- DEC-005: Placeholder content removal — [details](DECISIONS.md#dec-005-placeholder-content-removal)
- DEC-006: Testing infrastructure approach — [details](DECISIONS.md#dec-006-testing-infrastructure-approach)
- DEC-007: Build version system — [details](DECISIONS.md#dec-007-build-version-system)
- DEC-008: Membership tier & commission architecture — [details](DECISIONS.md#dec-008-membership-tier--commission-architecture)
- DEC-010: Voice platform VAPI vs LiveKit → resolved by DEC-012 — [details](DECISIONS.md#dec-010-voice-platform--vapi-vs-livekit)
- DEC-012: Stay on VAPI (vs LiveKit migration) — [details](DECISIONS.md#dec-012-voice-infrastructure--stay-on-vapi)

---

### DEC-004: Content Management Strategy
**Date:** February 13, 2026
**Status:** Pending

**Options:**
- A: Manual hardcode in components (fast, not scalable)
- B: Custom CMS in admin panel (4-6 hours build)
- C: Third-party CMS like Sanity (learning curve)

**Next Step:** Build prototype admin content panel, evaluate effort vs benefit

---

### DEC-009: AI Support Agent Strategy
**Date:** February 15, 2026
**Decision:** TBD — Needs design decision
**Status:** Pending

**Context:** Site-wide link audit revealed "Contact Support" buttons were non-functional. Contact form implemented as interim (Track C). AI-powered support agent is the long-term goal.

**Options:**
- A: Simple contact form only — **implemented as interim**
- B: Rule-based chatbot from FAQ content
- C: AI chat widget (Anthropic API)
- D: VAPI voice support agent
- E: LiveKit voice agent (see DEC-010, RS-001)
- F: Hybrid (contact form now + AI agent later) — likely best approach

**Next Step:** Complete RS-001 research spike, then decide AI approach

---

### DEC-014: Separate Route for Executive Dashboard
**Date:** February 20, 2026
**Decision:** `/executive-dashboard` as standalone page, not a tab in admin dashboard
**Status:** Final

**Reasoning:** Different design language, different audience, different purpose. Admin = utilitarian ops tool. Executive = boardroom strategy view. Mixing them dilutes both.

---

### DEC-015: Demo Mode / Connected Pattern for BYOK
**Date:** February 20, 2026
**Decision:** Default to "Demo Mode" with sample data, toggle to "Connected" with user-supplied API key
**Status:** Final

**Reasoning:** Honest to VCs (not faking data), shows product capability, real feature for future enterprise customers, avoids paying $200-500/mo for APIs before product-market fit.

---

### DEC-016: NewsAPI for Industry Feed
**Date:** February 20, 2026
**Decision:** Use NewsAPI free tier (100 req/day) via Edge Function with 60-min cache
**Status:** Final

**Reasoning:** Free, reliable, sufficient volume for demo + early production use. Cache in Edge Function memory to stay within limits.

---

### DEC-017: Dark Theme Approach
**Date:** February 20, 2026
**Decision:** Build dark-first (not using Tailwind dark: variants), wrap page root in bg-slate-900
**Status:** Final

**Reasoning:** Cleaner implementation, avoids fighting with app's light theme, more reliable visual consistency for demo.

---

### DEC-020: Text Chat Agent — Two-Tier Conversational Model
**Date:** February 21, 2026
**Decision:** Add OpenRouter-powered text chat alongside existing VAPI voice, as completely separate systems
**Status:** Final

**Context:** Voice search (VAPI) is expensive, tier-gated, and not always practical. Users need a conversational alternative that's universally available.

**Reasoning:** (1) OpenRouter is 10-100x cheaper than VAPI per interaction — no quota needed. (2) Text chat works in all environments (noisy, mobile, accessibility). (3) Shared `_shared/property-search.ts` module avoids code duplication while keeping systems independent. (4) VAPI remains untouched — zero regression risk. (5) Context-based system prompts (rentals/property-detail/bidding/general) provide relevant help across pages. (6) SSE streaming gives natural token-by-token display. (7) Session-only persistence avoids migration — can add localStorage/DB persistence later.

---

### DEC-018: Pre-Launch Platform Lock Strategy
**Date:** February 20, 2026
**Decision:** System-settings-based "Staff Only Mode" toggle (not per-user blocking)
**Status:** Final

**Context:** Need to prevent external users from creating test data on PROD before launch, while still deploying all code to PROD.

**Reasoning:** A global toggle in `system_settings` is simpler than per-user blocking. Leverages existing `can_access_platform()` RLS function. Toggle is in Admin > System Settings — flip it off when ready to go live. Default: enabled (locked). Enforced at 3 layers: database RLS, Login.tsx, Signup.tsx.

---

### DEC-019: Seed Data Management Approach
**Date:** February 21, 2026
**Decision:** 3-layer edge-function-based seed system with foundation user protection
**Status:** Final

**Context:** DEV environment needs realistic test data for functional testing and executive demos. PROD is locked via Staff Only Mode.

**Reasoning:** Edge function approach (vs raw SQL) allows: (1) idempotent auth.admin.createUser for proper trigger-based user setup, (2) production guard via env variable, (3) admin UI integration for one-click reset, (4) protected set pattern to never wipe RAV team or foundation accounts. Foundation users survive reseeds; everything else is disposable.

---

### DEC-021: Search Bar & Filter Strategy
**Date:** February 21, 2026
**Decision:** Make Rentals page search bar, calendar picker, and filter panel fully functional with state management and query integration
**Status:** Approved

**Context:** Comprehensive audit revealed the Rentals page search bar is mostly placeholder UI. Calendar picker is a static `<Input>`, Search button has no handler, and filter panel inputs (price/guests/bedrooms/brand) have no state bindings. Only the location text input works.

**Approach:** Wire all controls to React state, integrate with listing query filters. Calendar uses existing shadcn/ui `Calendar` component + `Popover`. Dates filter listings at application level (matching `_shared/property-search.ts` approach). PropertyDetail/Checkout dates remain read-only (timeshare model = owner sets fixed availability windows).

---

### DEC-022: Pricing, Tax & Accounting Framework
**Date:** February 21, 2026
**Date Updated:** February 28, 2026
**Decision:** Per-night pricing + separated fee line items + Stripe Tax before launch + Puzzle.io post-launch (pluggable)
**Status:** Approved (Updated — Puzzle.io replaces QuickBooks)
**Docs:** `docs/RAV-PRICING-TAXES-ACCOUNTING.md`

**Context:** Platform uses per-night pricing with itemized fee breakdown. As a marketplace facilitator in 43+ US states, RAV must collect and remit occupancy/sales taxes before going live. Accounting tool re-evaluated Feb 28 — Puzzle.io selected over QuickBooks for native Stripe integration, free tier, and automated revenue recognition (ASC 606).

**Key decisions:**
- Per-night rate (`nightly_rate`) is the atomic pricing unit across the platform ✅
- Fee breakdown: separate `service_fee`, `cleaning_fee`, `tax_amount` line items on every booking ✅
- Stripe Tax for automated tax calculation at checkout (code ready, pending #127) 🟡
- **Puzzle.io** as general ledger (replaces QuickBooks) — native Stripe sync, free <$20K/mo, automated revenue recognition
- **Pluggable accounting architecture** — provider-agnostic adapter pattern; can swap to QuickBooks/Xero/Zoho via config
- 1099-K handled natively by **Stripe Connect** ($2.99/form) — no Gusto needed
- Resort fees are owner-disclosed, not RAV-collected (paid at resort check-in)
- Stripe processing fees (~2.9%) absorbed by RAV, baked into 15% service fee margin

---

### DEC-023: Flexible Date Booking Strategy
**Date:** February 21, 2026
**Decision:** Three-phase approach — Option A (bid with dates) → Option B (inspired-by request) → Option C (partial-week splits)
**Status:** Approved

**Context:** Current model requires travelers to book the full date block set by the owner. This limits conversion when a traveler wants 6 of an 8-day listing.

**Approach:** Start with lightweight "Propose Different Dates" button (reuses existing bidding infrastructure, adds date fields to bids). Follow up with "Inspired By" travel requests (pre-filled from a listing, targeted to that owner). Defer full partial-week splitting until demand validates the pattern.

---

### DEC-011: Mobile App Strategy
**Date:** February 15, 2026
**Decision:** PWA first (Phase 11), then Capacitor native shells (Phase 12)
**Status:** Approved

**Approach:** Two-phase — PWA (1-2 days) validates mobile demand, then Capacitor (2-3 weeks) for Google Play + Apple App Store from one codebase.

**Reasoning:** Existing React + Vite + Tailwind is Capacitor-ready. All hooks, components, Supabase integration carry over. React Native rewrite not justified at current scale.

**Requirements:** Apple Developer Account ($99/yr), Google Play Console ($25 one-time), Mac for iOS builds

---

## SUCCESS METRICS

**Voice Search:** 34% adoption, 87% success rate, NPS +68, +23% conversion vs manual

**Listing Flow:** 8 min completion (was 22 min, -64%), 94% completion rate (+27%), 4.7 star satisfaction (+0.9)

**Platform:** 117 resorts, 351 unit types, 10+ countries, 99.97% uptime

---

## QUICK REFERENCE

### Core Documentation
- **This File:** `docs/PROJECT-HUB.md` — START HERE
- **Architecture:** `docs/ARCHITECTURE.md`
- **Deployment:** `docs/DEPLOYMENT.md`
- **Setup:** `docs/SETUP.md`

### Testing Documentation
- **Test Strategy:** `docs/testing/TEST-STRATEGY.md`
- **Seed Data Guide:** `docs/testing/SEED-DATA-GUIDE.md`
- **Setup Checklist:** `docs/testing/TEST-SETUP-CHECKLIST.md`
- **Claude Code Prompts:** `docs/testing/CLAUDE-CODE-PROMPTS.md`

### Feature Documentation
- **Text Chat Agent:** `docs/features/text-chat/`
- **Executive Dashboard:** `docs/features/executive-dashboard/`
- **Voice Search:** `docs/features/voice-search/`
- **Voice Auth & Approval:** `docs/features/voice-auth-approval/`
- **Resort Master Data:** `docs/features/resort-master-data/`
- **Testing Infrastructure:** `docs/features/testing-infrastructure/`
- **Fair Value Score (Phase 15):** `docs/features/fair-value-score/`
- **Maintenance Fee Calculator (Phase 16):** `docs/features/maintenance-fee-calculator/`
- **Owner Dashboard (Phase 17):** `docs/features/owner-dashboard/`
- **Travel Request Enhancements (Phase 18):** `docs/features/travel-request-enhancements/`

### Brand & Marketing
- **Marketing Playbook:** `docs/brand-assets/MARKETING-PLAYBOOK.md`
- **Pitch Deck Script:** `docs/brand-assets/PITCH-DECK-SCRIPT.md`
- **Brand Concepts:** `docs/brand-assets/BRAND-CONCEPTS.md`
- **Brand Style Guide:** `docs/brand-assets/BRAND-STYLE-GUIDE.md`

### User Guides
- **User Journey Map:** `docs/guides/user-journey-map.md`
- **Voice Search Help:** `docs/guides/help/voice-search.md`
- **New Chat Template:** `docs/guides/NEW-CHAT-TEMPLATE.md`

### Infrastructure
- **Production:** https://rent-a-vacation.com
- **Vercel:** https://rentavacation.vercel.app
- **GitHub:** https://github.com/rent-a-vacation/rav-website
- **Supabase PROD:** xzfllqndrlmhclqfybew
- **Supabase DEV:** oukbxqnlxnkainnligfz

---

## HOW TO USE THIS HUB

### For Humans (Starting a Session)
1. **Check GitHub Issues** — `gh issue list --repo rent-a-vacation/rav-website --state open`
2. **Check the project board** — https://github.com/orgs/rent-a-vacation/projects/1
3. **Read this file** — for architectural context and decisions
4. **Use "NEW CHAT TEMPLATE"** (`docs/guides/NEW-CHAT-TEMPLATE.md`) for fresh Claude chats

### For Humans (Ending a Session)
1. **Close completed issues** — `gh issue close <number> --comment "Completed: [summary]"`
2. **Create issues for discoveries** — bugs, ideas, follow-up work
3. **Add decisions to KEY DECISIONS LOG** — if architectural/product choices were made
4. **Commit and push** — `git commit -m "docs: Update PROJECT-HUB after [task]"`

### For AI Agents (See CLAUDE.md § Project Management)

---

## CRITICAL REMINDERS

**Before Every Work Session:**
- Check [GitHub Issues](https://github.com/rent-a-vacation/rav-website/issues) (what's open?)
- Read this file for architectural context and decisions
- Confirm with user which issue to work on

**After Every Work Session:**
- Close completed issues on GitHub with summary comments
- Create new issues for anything discovered
- Update this file only if architectural decisions were made
- Commit and push

---

**Last updated:** March 4, 2026 (Session 36: Admin Tools, Docs & Disputes — #176-#180)
**Maintained by:** Sujit
**Tracking:** [GitHub Issues](https://github.com/rent-a-vacation/rav-website/issues) · [RAV Roadmap](https://github.com/orgs/rent-a-vacation/projects/1) · [Milestones](https://github.com/rent-a-vacation/rav-website/milestones)
