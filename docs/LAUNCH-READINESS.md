---
last_updated: "2026-04-25T06:41:23"
change_ref: "2dd6116"
change_type: "session-59"
status: "active"
---
# Launch Readiness Checklist

> Pre-flight checklist for disabling Staff Only Mode and opening the platform to real users.
>
> **Current Status:** Staff Only Mode is **ENABLED** on PROD. Only RAV team members can access the platform.

---

## Quick Access

Admin Dashboard > **Launch** tab — runs automated checks and provides Go Live / Rollback buttons.

---

## Platform Completeness (Sessions 33-59)

The following major features were completed in Sessions 33-59 and are deployed:

| Area | What was built | Session |
|------|---------------|---------|
| UX Polish | Cancellation policy display, booking timeline, pricing suggestions, compare properties | 33 |
| Dashboard Consolidation | Owner dashboard 11 tabs -> 4, Renter dashboard (`/my-trips`) | 33-34 |
| Realtime | `useRealtimeSubscription` replaced all polling (notifications, messages, unread counts) | 34 |
| Owner Profiles | Public owner profile cards with `get_owner_profile_summary` RPC | 34 |
| Destinations | 10 destinations / 35 cities discovery pages | 34 |
| Pre-Booking Messaging | Listing inquiries + inquiry messages ("Ask the Owner") | 34 |
| Saved Searches | Saved search alerts with price drop tracking | 34 |
| Idle Week Alerts | Cron-based alerts for owners with unsold inventory (60d/30d) | 34 |
| OpenAPI Validation | 26 endpoints, all validated with Redocly (0 errors) | 35 |
| P0 Test Library | 97 critical-path tests across 14 files, `npm run test:p0` | 35 |
| iCal Export | RFC 5545 calendar export for owner bookings | 35 |
| Admin Tools | Property/listing editing, resort CSV import, dispute evidence upload | 36 |
| Dynamic Pricing | Urgency/seasonal/demand-based price suggestions | 37 |
| Referral Program | Referral codes, tracking, signup capture | 37 |
| Public API | API key infrastructure (migrations 044-045), `api-gateway` edge function, `/developers` Swagger UI, IP allowlisting with CIDR support | 38 |
| RAV Smart Suite | 5 tools on `/tools` hub (SmartEarn, SmartPrice, SmartCompare, SmartMatch, SmartBudget) | 38-39 |
| Notification Center | Multi-channel routing (in-app/email/SMS), TCPA opt-in, seasonal events, delivery log; 3 SMS edge functions deployed (DEV) — `notification-dispatcher`, `sms-scheduler`, `twilio-webhook`. `SMS_TEST_MODE=true` until A2P 10DLC clears (#127) | 40 |
| Brand Architecture Rebrand | Owner's Edge → **My Rentals**; RAV Command → **RAV Insights**; Admin Dashboard → **RAV Ops**; new **RAV Deals** discovery surface | 47 |
| Multi-Year Event Generation | Curated events unified into DB with admin CRUD UI + multi-year generator | 48 |
| Marketplace Terminology Lock | Three nouns locked: **Listing · Wish · Offer**. "Offer" replaces "Bid" + "Proposal" in all UI. RAV prefix dropped from transactional CTAs (Make an Offer, Post a Wish). Single **Marketplace** nav link replaces "Name Your Price" + "Make a Wish". `/bidding` → `/marketplace` with redirect. Owner dashboard gains top-level **Offers** tab (Sent + Received). Notifications categories renamed (Offers / Wishes). (DEC-031) | 52 |
| Site-wide UI Polish | 30 pages tightened — `Section` + `SectionHeader` layout primitives, standardised vertical rhythm (`py-12 md:py-16`), `tracking-tight` headings, soft border separators, off-brand tool badges unified to brand primary. No brand-color changes. | 52 |
| Tier Feature Differentiation | 5 tier-gated features: early access (Plus), exclusive deals (Premium), priority placement (Owner Pro), concierge support (Premium), dedicated AM (Owner Business). Migration 057 + shared `tierGating.ts`. | 53 |
| Stripe Tax env-flag gate + JWT hardening | `STRIPE_TAX_ENABLED` env flag unblocks dev sandbox + pre-LLC PROD; edge fn JWT verify config hardened via `config.toml`; 3 QA-surfaced bugs fixed (offers crash, owner bid + booking notifications). | 54 |
| Phase A QA Wins | MyTrips booking detail view (#379), Path 3 hybrid dashboard naming (#375). | 55 |
| Marketplace Flow Distinction (DEC-034) | `listing_source_type` enum + Pre-Booked Stay (instant confirm) vs. Wish-Matched Stay (owner-confirmation countdown). Migrations 058 + 059. `ListingTypeBadge` everywhere. Critical search-filter fix prevents wish-matched listings leaking. 3 new notification types. | 56 |
| Phase 22 Customer Support Foundation (Tracks A/B/E) | 22 markdown docs in `docs/support/`, `support_docs` table (migration 060) + `ingest-support-docs` edge fn + GitHub Action `sync-support-docs.yml`. 6 legal-blocked drafts at `status: draft` pending #80. | 57 |
| Phase 22 Customer Support Foundation (Tracks C/D) | RAVIO support agent: `context: 'support'` branch + 5 tools (DB-first with live Stripe reconcile), route detection + `<RavioFloatingChat />` on /my-trips/owner-dashboard/account, intent classifier + "Switched to X — back" chip, `dispute_source` enum (migration 061) with "via RAVIO" badges, `support_conversations` + `support_messages` (migration 062), `get_support_metrics` RPC (migration 063), Admin Support Interactions tab + `RavioChatRating` thumbs UI. **Phase 22 epic #395 COMPLETE — 22/22 tickets.** | 58 |
| Pre-Booked Listing Reservation Proof (#376) + Open-for-Offers badges (#378) | Migration 064 — `listing_proof_status` enum + 9 columns on `listings` + `listing-proofs` private storage bucket (10 MB cap, PDF/JPEG/PNG) + 4 RLS policies + 2 notification_catalog entries. Owner gets proof step in `ListProperty` with file + reservation number + attestation; rejected listings get alert + `ReuploadProofDialog`. Admin gets `ProofVerifyDialog` with embedded preview, phone-verification notes, Approve gating. Consistent Direct / Bidding-Open badges across ListProperty / OwnerListings / AdminListings / ListingCard / PropertyDetail. | 59 |
| Action Needed Sections on Landing Views (#381) | `ActionNeededSection` component + 3 `usePriorityActions` hook variants — travelers see counter-offers + imminent check-ins; owners see proof-rejected + Wish-Matched confirmations + pending Offers + unread inquiries; admins see disputes + escrow + pending approvals + proof verifications. Empty state with role-relevant CTA. | 59 |
| Cancel-Listing Cascade (#377) | Migration 065 (audit cols + notification type) + new `cancel-listing` edge fn — atomic listing cancellation that bulk-rejects pending bids → notifies bidders → cancels confirmed/pending bookings via `process-cancellation` (Stripe refunds) → bumps `cancellation_count`. New `CancelListingDialog` with impact preview (bid count / booking count / refund total). | 59 |
| PLATFORM-INVENTORY.md (#393) | One-page mental model across 4 layers: Product (features by surface), Platform (hosting/DB/edge-fns/Stripe/email/SMS/observability/secrets), Dev Tooling (skills/scripts/CI/hooks/testing/memory), Governance (CLAUDE.md rules, BRAND-LOCK, Key Decisions, tiered roadmap, #127 blocked chain). Linked from README + CLAUDE.md session-start block. | 59 |

### By the Numbers

| Metric | Count |
|--------|-------|
| Automated tests | 1375 (147 test files) |
| P0 critical-path tests | 199 tagged `@p0` (run with `npm run test:p0` — ~2s for filtered subset) |
| SQL migrations | 065 (001-059 deployed to DEV + PROD; 060-065 deployed to DEV only — PROD held per CLAUDE.md human-confirmation rule) |
| Edge functions | 36 total (27 deployed to PROD + 4 subscription fns on DEV + 3 SMS fns blocked on #127 + `ingest-support-docs` + `cancel-listing` deployed to DEV only). `text-chat` extended in Session 58 with `context: 'support'` branch + 5 agent tools + intent classifier — awaiting PROD deploy. |
| Type errors | 0 |
| Lint errors | 0 |
| Build status | Clean |

---

## Pre-Launch Checklist

### Infrastructure
| # | Check | Type | How to Verify | Status |
|---|-------|------|---------------|--------|
| 1 | Supabase connectivity | Auto | Launch tab runs a test query | Ready |
| 2 | Supabase points to PROD | Auto | `VITE_SUPABASE_URL` contains `xzfllqndrlmhclqfybew` | Ready |
| 3 | DNS & SSL valid | Manual | Visit https://rent-a-vacation.com — no certificate errors | Ready |
| 4 | Email sender verified (Resend) | Manual | Resend dashboard: `updates.rent-a-vacation.com` domain verified, `RESEND_API_KEY` set in Supabase secrets | Ready |
| 5 | API key infrastructure | Auto | Migrations 044-045 deployed, `api-gateway` edge function active | Ready |
| 5b | Notification Center | Auto | Migration 046 deployed (DEV + PROD); `notification-dispatcher` deployed; SMS functions deployed to DEV with `SMS_TEST_MODE=true` | Ready (SMS gated on #127) |

### Payments
| # | Check | Type | How to Verify |
|---|-------|------|---------------|
| 6 | Stripe live mode | Manual | Supabase Dashboard > Edge Functions > Secrets: `STRIPE_SECRET_KEY` starts with `sk_live_` |
| 7 | Stripe webhook configured | Manual | Stripe Dashboard > Developers > Webhooks: endpoint points to PROD Supabase `stripe-webhook` function |
| 7b | Stripe Tax enabled on PROD (only if #127 cleared) | Manual | After live Stripe Tax is fully activated (head office address set, registrations added), run `npx supabase secrets set STRIPE_TAX_ENABLED=true --project-ref xzfllqndrlmhclqfybew`. Leave unset on DEV. Default is `false` — bookings succeed without tax collection until this is flipped. |
| 7c | Marketplace flow distinction (DEC-034) | Auto | Migration 058 (source_type enum + bookings/listings columns + travel_proposal_id FK) and Migration 059 (3 wish_owner_* notification_catalog entries) deployed to DEV + PROD. `create-booking-checkout` and `verify-booking-payment` branch per source_type. Public search excludes wish_matched listings. |
| 7d | Pre-Booked Stay E2E | Manual | Book a direct listing → `/booking-success` shows Confirmed immediately; MyBookings shows "Pre-Booked Stay" + "Confirmed" badges; no owner-confirmation countdown. |
| 7e | Wish-Matched Stay E2E | Manual | Renter posts Wish → owner submits Offer → renter accepts + pays → renter receives `wish_owner_confirming` notification; MyBookings shows "Wish-Matched Stay" + "Pending Confirmation" badge + countdown; when owner confirms, renter receives `wish_owner_confirmed` and status flips to Confirmed. |

### Security
| # | Check | Type | How to Verify |
|---|-------|------|---------------|
| 8 | No seed data on PROD | Auto | Launch tab checks for `dev-*@rent-a-vacation.com` accounts |
| 9 | RLS policies reviewed | Manual | Supabase Dashboard > Authentication > Policies: all public tables have RLS enabled |
| 10 | Staff Only Mode status | Auto | Launch tab reads `platform_staff_only` setting |

### Content & Legal
| # | Check | Type | How to Verify |
|---|-------|------|---------------|
| 11 | Terms of Service | Manual | Visit /terms — content reviewed by legal (#80) |
| 12 | Privacy Policy | Manual | Visit /privacy — content reviewed by legal (#80) |

### Monitoring
| # | Check | Type | How to Verify |
|---|-------|------|---------------|
| 13 | Sentry DSN configured | Auto | `VITE_SENTRY_DSN` environment variable is set |
| 14 | GA4 tracking | Auto | Hardcoded `G-G2YCVHNS25` in `src/lib/analytics.ts` |

---

## Go-Live Procedure

### Prerequisites
1. All automated checks pass (no red failures in Launch tab)
2. All manual checks verified by a human
3. Test a complete booking flow on the Vercel preview deploy
4. Confirm with team that you're ready

### Steps
1. Open Admin Dashboard > **Launch** tab
2. Verify all checks are green or blue (manual)
3. Click **Go Live** button
4. Confirm in the dialog
5. Platform is now open — `platform_staff_only` is set to `false`
6. Verify by:
   - Opening an incognito window
   - Signing up as a new user
   - Browsing listings
   - Checking that Stripe checkout loads (don't complete a real payment yet)

### What Happens
- The `platform_staff_only` setting in `system_settings` is set to `{ "enabled": false }`
- Login and Signup pages stop showing "Coming Soon" messages to non-staff users
- All approved users can access the full platform
- Existing data, bookings, and settings are unaffected

---

## Rollback Procedure

If issues are discovered after going live:

1. Open Admin Dashboard > **Launch** tab
2. Click **Emergency Rollback** button
3. Confirm in the dialog
4. Platform is locked again — only RAV team members can access

### What Rollback Does
- Sets `platform_staff_only` back to `{ "enabled": true }`
- Non-staff users see "Coming Soon" on their next page navigation
- In-progress sessions are not forcibly terminated, but new navigations are blocked
- No data is lost — bookings, payments, and user accounts remain intact

### When to Rollback
- Critical payment processing failure
- Security vulnerability discovered
- Stripe webhook not receiving events
- Database connectivity issues
- Any issue that would prevent users from completing bookings safely

---

## Blocked Items

The following checks cannot pass until external blockers are resolved:

| Check | Blocker | Issue |
|-------|---------|-------|
| Stripe live mode | LLC/EIN required for Stripe activation | #127 |
| Stripe Tax activation | LLC/EIN required. Code is env-gated via `STRIPE_TAX_ENABLED` (Session 54). When unset, `automatic_tax` is disabled so checkout works in both DEV sandbox and pre-LLC PROD. Flip to `"true"` on PROD only after live Stripe Tax is fully activated. | #127 |
| Legal pages reviewed | Need legal counsel review | #80 |
| Accounting integration (Puzzle.io) | Blocked on LLC/EIN — onboarding paused at step 7 | #127, #63 |
| SMS production traffic | A2P 10DLC registration pending — flip `SMS_TEST_MODE=false` once cleared | #127 |

---

## Post-Launch Monitoring

After going live, monitor:

1. **Sentry** — error rate spike within first hour
2. **Stripe Dashboard** — webhook delivery success rate
3. **Supabase Dashboard** — database connections, edge function invocations
4. **GA4** — real user traffic appearing
5. **Resend** — email delivery rates for booking confirmations
