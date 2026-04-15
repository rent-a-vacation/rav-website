---
last_updated: "2026-04-15T11:23:27"
change_ref: "df940f9"
change_type: "session-48-platform-overview"
status: "active"
---

# Rent-A-Vacation — Platform Overview

**What's Been Built**

| | |
|---|---|
| **Date** | April 14, 2026 |
| **Version** | v0.9.0 (Pre-Launch) |
| **Website** | https://rent-a-vacation.com |
| **Repository** | github.com/rent-a-vacation/rav-website |

---

## What It Is

An AI-powered marketplace where vacation club owners rent directly to travelers, and travelers name their price. RAV earns a 15% default commission (Pro −2%, Business −5%) on successful bookings. Think Airbnb, but purpose-built for timeshare inventory across Hilton, Marriott, Disney, and 6 other vacation club brands (117 resorts, 351 unit types). Two marketplace primitives no competitor offers: **Name Your Price** (bidding on any listing) and **RAV Wishes** (travelers post dream trips; verified owners compete with proposals).

> Tagline: **"Name Your Price. Book Your Paradise."**

---

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, RLS)
- **Payments:** Stripe (checkout, Connect payouts, webhooks, Tax-ready)
- **Voice:** VAPI (Deepgram Nova-3 STT + GPT-4o-mini + ElevenLabs TTS)
- **Text Chat:** OpenRouter (RAVIO assistant, SSE streaming)
- **Notifications:** Resend (email) + Twilio (SMS, TCPA-compliant)
- **Observability:** Sentry (errors + session replay) + GA4 (consent-gated)
- **Deployment:** Vercel (frontend) + Supabase (backend)

---

## Core User Journeys

### Property Owner Flow
1. Sign up → pending approval by RAV admin
2. Add property (9 brands supported) → create listing with nightly rate
3. Listing goes to `pending_approval` → RAV admin approves/rejects
4. Once booked → owner confirms resort reservation → RAV verifies → escrow holds funds
5. After checkout + 5 days → funds released → Stripe Connect payout

### Traveler Flow
1. Browse/search listings (voice search, text chat, filters) or post a RAV Wish
2. View property details with fair value scoring and cancellation policy
3. Place bids (Name Your Price), propose alternate dates, or book instantly
4. Checkout via Stripe → booking confirmed → 5-step booking timeline
5. Track in My Trips (`/my-trips`), message owner, file disputes if needed

### Admin Flow (RAV Ops)
1. Unified operations dashboard: Users, Listings, Bookings, Escrow, Payouts, Financials, Disputes, Voice, Resorts, API Keys, Notifications, Events
2. Approve/reject listings and users with bulk actions + audit trail
3. Manage escrow lifecycle (verify, hold, release, refund)
4. Dispute resolution queue with assignment + evidence review
5. Voice search monitoring, tier/user quota overrides, usage dashboard
6. Resort CSV import with validation + duplicate detection
7. Notification catalog, seasonal event calendar, delivery log

### Executive Flow (RAV Insights)
1. 6-section BI dashboard at `/executive-dashboard`
2. Headline KPIs, GMV trend, revenue waterfall, bid activity
3. Marketplace health: Liquidity Score, supply/demand map
4. Market intelligence with BYOK pattern (AirDNA, STR)
5. Industry feed + regulatory radar + unit economics

---

## Features Built Across 48+ Sessions

| Area | What's Built |
|------|--------------|
| **Auth** | Email/password + Google OAuth, role-based access (6 roles), email verification, user approval workflow, realtime role upgrade |
| **Listings** | Create/edit, nightly pricing, fair value scoring, photo uploads, dynamic pricing (urgency/seasonal/demand), admin edit with audit trail |
| **Name Your Price (Bidding)** | Bid on any listing, propose alternate dates, 24hr expiry, owner accept/reject/counter, Bid Spread Index |
| **RAV Wishes (Reverse Auction)** | Travelers post dream trips; verified owners send proposals; traveler picks winner. Formerly "Vacation Wishes" (Session 47 rebrand) |
| **RAV Deals** | Curated distressed/expiring-week inventory surface, feeds directly into bidding |
| **Booking** | Stripe Checkout, fee breakdown (base + service + cleaning + tax), 5-step booking timeline, cancellation policy UI |
| **Payments** | Stripe Connect (owner onboarding + payouts), 6 webhook events, escrow lifecycle, Stripe Tax-ready (awaiting #127) |
| **Cancellation** | Policy-based (flexible/moderate/strict/super_strict) renter cancellation, owner cancellation with full refund, automated Stripe refunds |
| **Escrow (PaySafe)** | 6-status lifecycle, owner confirmation timer, RAV verification, auto-release after checkout+5d, hold/unhold, refund |
| **Disputes** | Expanded dispute categories (renter + owner), evidence upload, admin queue with assignment + resolution |
| **Voice Search (Ask RAVIO)** | VAPI integration, Deepgram Nova-3, tier-based quotas, admin overrides, usage dashboard, observability + alert thresholds |
| **Text Chat (Chat with RAVIO)** | Streaming AI assistant via OpenRouter with property cards |
| **RAV Smart Suite** | 5 free public tools at `/tools`: SmartEarn, SmartPrice, SmartCompare, SmartMatch, SmartBudget |
| **TrustShield** | Multi-step owner identity + ownership verification; trust-level progression |
| **ResortIQ** | 117 resorts, 351 unit types, 9 brands; auto-populates listing forms, powers voice search |
| **Renter Dashboard (My Trips)** | `/my-trips` — 4 tabs (Overview, Bookings, Offers, Favorites) with check-in countdown |
| **My Rentals (Owner Dashboard)** | Consolidated 11 tabs → 4: Dashboard, My Listings, Bookings & Earnings, Account. Formerly "Owner's Edge" |
| **RAV Ops (Admin)** | Unified operations: Users, Listings, Bookings, Escrow, Payouts, Financials, Disputes, Voice, Resorts, API Keys, Notifications, Events |
| **RAV Insights (Executive BI)** | 6-section dashboard: KPIs, GMV, marketplace health, market intel (BYOK), industry feed, unit economics. Formerly "RAV Command" |
| **Notification Center** | Multi-channel routing (in-app/email/SMS), per-type preferences, TCPA opt-in, seasonal events, delivery log |
| **SMS Infrastructure** | Twilio integration: `notification-dispatcher`, `sms-scheduler`, `twilio-webhook`. `SMS_TEST_MODE=true` — prod gated on A2P 10DLC (#127) |
| **Public API + Developer Portal** | OpenAPI 3.0 spec, `/developers` Swagger UI, API key management, tiered rate limits, IP allowlisting (CIDR) |
| **Referral Program** | Unique codes, tracking dashboard, signup attribution via `?ref=CODE` |
| **Pre-Booking Messaging** | Inquiry threads between travelers and owners before booking |
| **Saved Searches** | Save criteria + price drop alerts |
| **Destinations Explorer** | 10 destinations, 35 cities — curated discovery pages |
| **Compare Properties** | Up to 3 listings side-by-side with best-value badges |
| **iCal Export** | RFC 5545 calendar export for owner bookings |
| **Realtime** | `useRealtimeSubscription` replaced all polling (notifications, messages, unread counts) |
| **SEO** | Meta tags, sitemap, robots.txt, FAQ JSON-LD, OG images, JSON-LD on `/tools` |
| **Security** | CSP headers, rate limiting, RLS on every table, IP allowlisting for API keys |
| **GDPR** | Data export, account deletion with 14-day grace period, cookie consent |
| **Architecture Docs** | Auto-generated flow diagrams from declarative Flow Manifests at `/architecture` |
| **PWA** | Service worker, installable, offline-capable |
| **Observability** | Sentry (errors + session replay) + GA4 (consent-gated, `G-G2YCVHNS25`) |

---

## Current Numbers

| Metric | Count |
|--------|-------|
| Automated tests | 956 passing (121 test files) |
| P0 critical-path tests | 97 (`@p0` tagged, ~2s run) |
| Database migrations | 046 (all deployed to DEV + PROD) |
| Edge functions | 30 (27 in PROD; 3 SMS functions DEV-only until A2P 10DLC) |
| Resorts / unit types | 117 / 351 across 9 brands |
| Routes (pages) | ~35 (incl. `/developers`, `/tools`, `/destinations`, `/notifications`) |
| Type errors / Lint errors | 0 / 0 |
| Build status | Clean |
| Sessions shipped | 48+ in 19 months |
| Platform uptime (staging) | 99.97% |
| `dev` vs `main` | In sync (PR #239 merged Apr 1) |

---

## Remaining Pre-Launch Items

The platform is feature-complete. Remaining blockers are external (legal, business formation, and third-party verification) rather than engineering work.

| # | Issue | Status |
|---|-------|--------|
| #127 | Business Formation (LLC + EIN) | **BLOCKER** — gates Stripe Tax, Puzzle.io, Mercury bank, A2P 10DLC SMS |
| #80 | Legal review: ToS and Privacy Policy | Awaiting legal counsel review |
| #187 | Manual verification workflow (TrustShield) | Operational process to document |
| #230–234 | Social media account setup | Facebook, Instagram, LinkedIn, Twitter, GBP |
| #87 | Launch readiness checklist | Ready when #127 and #80 close |

Already shipped (previously on this list): GA4 (#74), Admin Tax Reporting (#62), 1099-K Compliance (#64), Stripe Connect webhooks, Sentry, CSP/rate-limits, GDPR.

---

## Current Platform State

- **PROD:** Staff Only Mode enabled — platform locked for pre-launch control
- **Stripe Tax:** Code ready (`automatic_tax` enabled), not activated pending LLC/EIN (#127)
- **SMS:** Deployed to DEV with `SMS_TEST_MODE=true`; production traffic gated on A2P 10DLC
- **Puzzle.io accounting:** Onboarding paused at step 7 pending LLC/EIN (#127)
- **Repository:** Private (changed Mar 4, 2026) — branch protection requires GitHub Team plan
- **Supabase CLI:** Currently linked to DEV project
- **`dev` and `main`:** In sync (PR #239 merged Apr 1, 2026)

---

## Brand Architecture (Session 47 Rebrand — Apr 12, 2026)

The RAV brand family follows three naming patterns: **RAV-prefix** for platform features and internal tools; **CompoundName** for the trust/infrastructure layer; **plain language** for customer-facing navigation.

| Canonical Name | Type | Notes |
|----------------|------|-------|
| **Name Your Price** | Primary — bidding | Hero feature, master tagline |
| **RAV Wishes** | Primary — reverse auction | Formerly "Vacation Wishes" |
| **RAV Deals** | Primary — discovery | New distressed-inventory surface |
| **TrustShield + PaySafe** | Supporting — trust | Verification + escrow |
| **Ask RAVIO / Chat with RAVIO** | Supporting — AI | Voice + text search |
| **RAV Smart[X]** | Supporting — tools | SmartEarn, SmartPrice, SmartCompare, SmartMatch, SmartBudget |
| **My Trips / My Rentals** | Nav — customer | Plain-language dashboards |
| **RAV Insights** | Infrastructure — BI | Formerly "RAV Command" |
| **RAV Ops** | Infrastructure — admin | Formerly "Admin Dashboard" |
| **ResortIQ** | Infrastructure — data | 117 resorts, 351 unit types |

See `docs/brand-assets/BRAND-LOCK.md` for the complete naming framework and retired terms.

---

*Rent-A-Vacation · Confidential · Generated April 14, 2026*
