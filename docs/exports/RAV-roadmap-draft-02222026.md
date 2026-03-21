---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "archived"
---
# Rent-A-Vacation — Product Roadmap & Technical Overview

![RAV Logo](../../public/rav-logo.svg) &nbsp;&nbsp; ![Ask RAVIO](../../public/ravio-the-chat-genie-64px.png) **Ask RAVIO**

**Date:** February 22, 2026
**Version:** v0.9.0
**Status:** Pre-Launch (Staff Only Mode — all features deployed, platform locked for internal testing)
**Tagline:** *Name Your Price. Book Your Paradise.*

---

## 1. Executive Summary

### The Problem

The vacation ownership (timeshare) industry is valued at $10.5 billion, yet owners of unused weeks have no efficient, trusted marketplace to monetize them. Existing options are fragmented — classified ads, Facebook groups, or legacy resale sites — with no pricing transparency, no buyer protection, and no tools for owners to manage their inventory. Meanwhile, travelers looking for vacation club properties have no way to discover available weeks, negotiate pricing, or book with confidence.

### The Solution

Rent-A-Vacation (RAV) is a peer-to-peer vacation rental marketplace purpose-built for vacation club and timeshare owners. The platform creates a two-sided marketplace where owners list unused timeshare weeks and travelers discover, negotiate, and book vacation rentals — with transparent per-night pricing, a bidding engine that lets travelers propose their own terms, and trust infrastructure that protects both sides of every transaction.

The platform is feature-complete for MVP across 19 completed development phases, with 306 automated tests passing, zero type errors, and zero lint errors. All 21 database migrations and 17 edge functions are deployed to both development and production environments.

**Key differentiators:**
- **Two-Sided Marketplace with Real-Time Negotiation:** Travelers can book at listed prices, bid their own price ("Name Your Price"), propose different dates, or post wish lists ("Vacation Wishes") that owners compete to fulfill. Owners see live demand signals — matching travel request count and max budget — while creating listings. Auto-matching connects newly approved listings with open traveler requests.
- **Traveler-Friendly Pricing:** Per-night rate transparency (not lump-sum), flexible date proposals that auto-compute from nightly rate, and AI-powered fair value analysis so travelers know if a price is competitive.
- **Owner-Centric Tools:** Full business intelligence suite ("Owner's Edge") with earnings tracking against maintenance fee targets, pricing recommendations based on comparable accepted bids, bid activity feed, and idle week alerts — giving owners the data they need to maximize returns on their unused weeks.
- **Trust & Payment Protection:** Escrow system holds funds until the traveler physically checks in and confirms the stay. Owner verification with progressive trust levels (New → Verified → Trusted → Premium). Admin-controlled approval workflows for both users and listings. 4 cancellation policy tiers.
- **AI-Enhanced Search (Voice + Text):** Voice concierge and text chat assistant provide natural language property search as an additional discovery channel — complementing the traditional search, filter, and browse experience.

---

## 2. Platform Capabilities — BUILT

### 2.1 Core Marketplace

| Capability | Description | Status |
|-----------|-------------|--------|
| **User Authentication** | Email/password + Google OAuth with admin approval workflow | BUILT |
| **Role-Based Access** | 5 roles: RAV Owner, RAV Admin, RAV Staff, Property Owner, Renter | BUILT |
| **Property Registration** | Multi-step form with resort search (117 resorts, 351 unit types), auto-populate specs, image upload | BUILT |
| **Listing Management** | Draft → Pending → Admin Approval → Active lifecycle, per-night pricing, cancellation policies | BUILT |
| **Booking Flow** | Browse → View → Book Now → Stripe Checkout → Payment Capture → Booking Confirmation | BUILT |
| **Escrow System (PaySafe)** | Funds held until check-in confirmed, released to owner after checkout + 5 days | BUILT |
| **Owner Confirmation Timer** | Configurable countdown (default 60 min), up to 2 extensions of 30 min, auto-cancel on timeout | BUILT |
| **Cancellation Policies** | 4 tiers: Flexible (100% ≥1 day), Moderate (100% ≥5 days), Strict (50% ≥7 days), Super Strict (no refunds) | BUILT |
| **Check-in Confirmation** | Traveler confirms arrival or reports issues; issue resolution workflow for admin | BUILT |

### 2.2 Bidding & Negotiation

| Feature | Description | Status |
|---------|-------------|--------|
| **Place a Bid (Name Your Price)** | Travelers bid on any listing where the owner has opted in. Owners review, accept, reject, or counter-offer | BUILT |
| **Date Proposals** | Travelers propose different dates; bid amount auto-computes from nightly rate × proposed nights. Owners see proposed dates highlighted in bid manager | BUILT |
| **Travel Requests (Vacation Wishes)** | Reverse auction — travelers post dream trips (destination, dates, budget, bedrooms), owners compete with proposals | BUILT |
| **Inspired Requests** | "Request Similar Dates" from any listing detail page — pre-fills destination, dates, bedrooms from listing. Optional "Send to this owner first" targeting | BUILT |
| **Auto-Matching** | Newly approved listings are automatically matched against open travel requests by destination, dates (±30 days), budget, bedrooms, and brand | BUILT |
| **Demand Signals** | Owners see matching travel request count + max disclosed budget while creating listings, helping them price competitively | BUILT |

### 2.3 Pricing & Revenue

| Aspect | Detail |
|--------|--------|
| **Atomic Pricing Unit** | Per-night rate (`nightly_rate`) — all prices computed from this base |
| **Platform Commission** | 15% default (admin-configurable via System Settings) |
| **Pro Owner Discount** | 13% commission (−2%) |
| **Business Owner Discount** | 10% commission (−5%) |
| **Stripe Processing** | ~2.9% absorbed by RAV within service fee margin |
| **Payout Timing** | Owner receives payout after checkout date + 5 days |

### 2.4 Business Intelligence

| Dashboard | Audience | Description |
|-----------|----------|-------------|
| **Owner Dashboard (Owner's Edge)** | Property Owners | 6 BI sections: Headline Stats (earned YTD, fees covered %, active bids), Earnings Timeline (monthly/quarterly chart with maintenance fee target reference line), My Listings Table (status badges, idle week alerts), Bid Activity Feed (color-coded event stream), Pricing Intelligence (per-listing fair value based on comparable accepted bids + market range), Maintenance Fee Tracker (inline editor + coverage progress bar) |
| **Fair Value Score (RAV SmartPrice)** | All users | PostgreSQL analysis of comparable accepted bids using P25-P75 percentile range. Shows whether a listing is priced below market (opportunity), at fair value, or above market. Different messaging for owners ("you could earn more") vs travelers ("this is a good deal") |
| **Maintenance Fee Calculator** | Public (no auth) | Break-even analysis tool covering 9 vacation club brands and 4 unit types — shows owners exactly how many weeks they need to rent to cover their annual maintenance fees. Live progress bars, CTA to owner signup |
| **Executive Dashboard (RAV Command)** | RAV Leadership | Investor-grade strategic dashboard. 6 sections: KPI headline bar, Business Performance (4 charts), Marketplace Health (proprietary Liquidity Score and Bid Spread Index), Market Intelligence (AirDNA + STR benchmarks via Bring-Your-Own-Key), Industry Feed (live news + macro indicators), Unit Economics (CAC, LTV, take rate, MoM growth) |

### 2.5 AI-Enhanced Search

| Feature | Description | Status |
|---------|-------------|--------|
| **Voice Search (Ask RAVIO)** | Voice concierge powered by VAPI + Deepgram Nova-3 transcription. Natural language queries ("show me beachfront condos in Hawaii for next month"), 300ms endpointing, smart denoising. Tier-based daily limits with admin overrides | BUILT |
| **Text Chat (Chat with RAVIO)** | LLM-powered text assistant (OpenRouter / Gemini 3 Flash) with SSE streaming and tool calling for property search. Context-aware across 4 page types (rentals, property detail, bidding, general) | BUILT |
| **Resort Knowledge Base (ResortIQ)** | Database of 117 partner resorts and 351 unit types from 9 vacation club brands. Auto-populates listing specs (bedrooms, bathrooms, max guests, square footage) when owners create listings | BUILT |

### 2.6 Admin & Operations

| Capability | Description |
|-----------|-------------|
| **Admin Dashboard** | 12 tabs: Overview, Users, Listings (approval workflow), Bookings, Properties, Verifications, Escrow, Payouts, Financials, Issues, Voice, Memberships |
| **Voice Admin Controls** | Global config display, tier quota manager, per-user overrides (disable/custom quota), usage dashboard with charts + top users, observability (search log viewer + alert thresholds) |
| **Staff Only Mode** | Pre-launch platform lock — 3-layer enforcement (database RLS, Login page, Signup page). Toggle in Admin > System Settings |
| **Owner Verification (TrustShield)** | Document upload (deed, certificate, government ID), progressive trust levels (New → Verified → Trusted → Premium), admin review workflow |
| **Seed Data System** | DEV-only 3-layer system: 8 foundation users (never wiped), 10 properties + 30 listings, 50 renters + 110 bookings + 20 bids. Production-guarded |

### 2.7 Communication

**17 transactional email types** via Resend API (`notifications@updates.rent-a-vacation.com`):

| Category | Emails |
|----------|--------|
| **Account** | Welcome, User Approved, User Rejected |
| **Listings** | Listing Approved, Listing Rejected, Listing Submitted (to admin) |
| **Bookings** | Booking Confirmed, Check-in Reminder |
| **Owner Confirmation** | Confirmation Request, Extension Notification, Confirmation Timeout |
| **Cancellation** | Submitted, Approved, Denied, Counter-Offer |
| **Verification** | Document Uploaded (to admin) |
| **Support** | Contact Form Submission |

**In-app notifications** with real-time badge count, auto-refresh every 30 seconds.

---

## 3. Membership Tiers

### 3.1 Renter Tiers

| Tier | Monthly Price | Voice Searches/Day | Key Benefits |
|------|--------------|-------------------|--------------|
| **Free** | $0 | 5 | Browse listings, place bids, post travel requests |
| **Plus** | $9.99 | 25 | Priority support, saved searches |
| **Premium** | $24.99 | Unlimited | Early access to new listings, concierge service |

### 3.2 Owner Tiers

| Tier | Monthly Price | Commission Rate | Key Benefits |
|------|--------------|----------------|--------------|
| **Free** | $0 | 15% (default) | List properties, basic dashboard, bid management |
| **Pro** | $19.99 | 13% (−2% discount) | Analytics, priority listing placement |
| **Business** | $49.99 | 10% (−5% discount) | Multi-property management, API access, dedicated support |

> **Source:** Migration 011 (`membership_tiers` table). Commission rate is admin-configurable in System Settings.

---

## 4. Supported Vacation Club Brands (9)

| # | Brand | Resort Coverage |
|---|-------|----------------|
| 1 | Hilton Grand Vacations | 62 resorts |
| 2 | Marriott Vacation Club | 40 resorts |
| 3 | Disney Vacation Club | 15 resorts |
| 4 | Wyndham Destinations | — |
| 5 | Hyatt Residence Club | — |
| 6 | Bluegreen Vacations | — |
| 7 | Holiday Inn Club Vacations | — |
| 8 | WorldMark by Wyndham | — |
| 9 | Other / Independent Resort | — |

> **Source:** `VACATION_CLUB_BRANDS` constant in `calculatorLogic.ts` and `vacation_club_brand` database enum. Total: 117 resorts, 351 unit types across 10+ countries.

---

## 5. Technical Infrastructure

### 5.1 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript + Vite + SWC | Single-page application with strict typing |
| **Styling** | Tailwind CSS + shadcn/ui (Radix primitives) | Utility-first CSS with accessible component library |
| **Routing** | React Router v6 | Client-side routing with protected routes |
| **Data Fetching** | TanStack React Query v5 | Server state management, caching, optimistic updates |
| **Forms** | React Hook Form + Zod | Schema-validated forms |
| **Auth** | Supabase Auth | Email/password, Google OAuth, role-based access |
| **Database** | Supabase PostgreSQL | Row Level Security (RLS), pg_cron, pg_net |
| **Backend** | Supabase Edge Functions (Deno) | 17 serverless functions |
| **Payments** | Stripe Checkout | Payment capture, escrow, webhooks |
| **Email** | Resend API | Transactional emails with branded HTML templates |
| **Voice AI** | VAPI + Deepgram Nova-3 | Voice transcription and natural language processing |
| **Text AI** | OpenRouter (Gemini 3 Flash) | LLM chat with SSE streaming and tool calling |
| **Charts** | Recharts | Dashboard analytics and data visualization |
| **Hosting** | Vercel (frontend) + Supabase (backend) | Auto-deploy from GitHub |
| **CI/CD** | GitHub Actions | Lint, typecheck, unit tests, E2E, Percy visual regression |
| **PWA** | vite-plugin-pwa + Workbox | Service worker, install prompt, offline detection |

### 5.2 Database Migrations (21 total)

| Migration | Purpose |
|-----------|---------|
| 001 | Core schema: profiles, user_roles, properties, listings, bookings, RLS |
| 002 | Seed data (optional) |
| 003 | Bidding system: listing_bids, travel_requests, travel_proposals, notifications |
| 004 | Payout tracking fields on bookings + booking_confirmations |
| 005 | Cancellation policies + refund calculation function |
| 006 | Owner verification + trust levels + platform guarantee fund |
| 007–008 | Voice auth (user approval system, voice usage limits) |
| 010 | Role upgrade requests system |
| 011 | Membership tiers (6 tiers) + voice toggles + commission config |
| 012 | Phase 13: property images, owner confirmation timer, system settings |
| 013 | Executive dashboard settings (API key storage) |
| 014 | Staff Only Mode (pre-launch platform lock) |
| 015 | Seed data foundation flag (is_seed_foundation) |
| 016 | Fair Value Score RPC (P25-P75 percentile analysis) |
| 017 | Owner Dashboard RPCs + maintenance fee columns |
| 018 | Travel request enhancement notification types |
| 019 | PostgREST FK fix (10 tables redirected to profiles) |
| 020 | Per-night pricing (nightly_rate) + date proposals + inspired requests |
| 021 | Voice admin: search logs, user overrides, alert thresholds, 3 RPCs |

### 5.3 Edge Functions (17 total)

| Function | Trigger | Purpose |
|----------|---------|---------|
| `create-booking-checkout` | Client call | Creates Stripe Checkout session with listing details and tier-aware commission |
| `verify-booking-payment` | Stripe webhook | Validates payment, creates booking + booking_confirmation with owner acceptance timer |
| `send-email` | Client call | Generic email dispatch via Resend API |
| `send-approval-email` | Client call | Approval/rejection emails for listings and users (4 variants) |
| `send-booking-confirmation-reminder` | Client/internal | Owner deadline reminders + acceptance notifications |
| `send-cancellation-email` | Internal | Cancellation status notifications (4 variants) |
| `send-contact-form` | Client call | Contact form submission handler |
| `send-verification-notification` | Client call | Admin notification on document upload |
| `process-deadline-reminders` | **CRON (every 30 min)** | Scan deadlines, send reminders, process owner timeouts, travel request expiry warnings |
| `match-travel-requests` | Internal | Auto-match approved listings to open travel requests (budget-aware, deduped) |
| `voice-search` | VAPI webhook | Property search via voice — shared search module, state name expansion |
| `text-chat` | Client call | OpenRouter LLM with SSE streaming, tool calling, 4 context modes |
| `seed-manager` | Client call | DEV-only 3-layer seed data system (production-guarded) |
| `fetch-industry-news` | Client call | NewsAPI + Google News RSS for exec dashboard (60-min cache) |
| `fetch-macro-indicators` | Client call | FRED consumer confidence + travel data |
| `fetch-airdna-data` | Client call | AirDNA market comparisons (BYOK) |
| `fetch-str-data` | Client call | STR hospitality benchmarks (BYOK) |

### 5.4 Quality Metrics

| Metric | Value |
|--------|-------|
| **Automated Tests** | 306 (all passing) |
| **Type Errors** | 0 (strict TypeScript) |
| **Lint Errors** | 0 (ESLint) |
| **Build Status** | Clean (Vite production build) |
| **CI Pipeline** | 5-job: lint+typecheck → unit tests → E2E → visual regression → lighthouse |
| **Coverage Thresholds** | 25% statements, 25% branches, 30% functions, 25% lines |

---

## 6. Completed Development Phases

### Phase 1: Voice Search (Nov 2025)
VAPI voice assistant integration with natural language property search on the Rentals page. Real-time voice transcription and conversational query refinement.

**Impact:** 34% voice adoption rate, 87% search success rate, NPS +68, +23% conversion vs manual search.

### Phase 2: Resort Master Data (Feb 12, 2026)
Imported 117 resorts (Hilton 62, Marriott 40, Disney 15) with 351 unit types. Searchable listing flow with Command component and auto-populate functionality.

**Impact:** Listing completion time reduced from 22 min to 8 min (−64%). Completion rate increased from 67% to 94% (+27%). Owner satisfaction: 4.7 stars (+0.9).

### Phase 3 (Partial): Voice Auth & Approval (Feb 15, 2026)
Three-phase rollout: authentication gate (voice disabled for unauthenticated users), admin-controlled user approval system with email notifications, and daily voice quota with real-time usage indicator.

**Impact:** Estimated $27K/month API cost savings (90% reduction). Voice abuse prevention with enforced quotas. Full admin control over beta access.

### Phase 4: UI Fixes & Documentation (Feb 13–15, 2026)
Calendar tabs, pagination, favorites system, forgot-password flow, user guide updates, FAQ, how-it-works, and admin documentation.

### Phase 5: Core Business Flows (Feb 13, 2026)
Replaced mock data with real Supabase queries. Built complete booking flow: Browse → View → Book → Stripe Checkout → Payment Capture → Confirmation. Build version system in footer.

### Phase 6: Role Upgrade System (Feb 14, 2026)
Self-service role upgrade requests with admin approval. Eliminated dead-end UX flows (non-owners seeing empty dashboards, unauthorized bid attempts). Signup role selection (owner vs renter).

### Phase 7: UI Excellence & Social Proof (Feb 14, 2026)
Social proof indicators (favorites count, freshness badges, popularity badges), honest content replacement (removed fabricated stats), visual polish (gradients, hover effects, trust indicators), and "Similar Properties" recommendations.

### Phase 8: Testing Infrastructure (Feb 14, 2026)
Vitest with v8 coverage, Playwright E2E, Percy visual regression, GitHub Actions CI (5-job pipeline), Husky pre-commit hooks, test helpers and fixtures.

### Phase 9: Voice Toggles & Membership Tiers (Feb 14, 2026)
6 membership tiers (3 renter + 3 owner), admin voice feature toggles (master + per-feature), configurable platform commission with tier discounts, tier-aware voice quotas.

### Phase 10: Additional Improvements (Feb 15–16, 2026)
Contact form, link audit, role terminology standardization ("Traveler" → "Renter"), UX feedback improvements (inline success states replacing toasts).

### Phase 11: Progressive Web App (Feb 16, 2026)
Full PWA support with Workbox service worker (59 precached entries), install prompt, offline detection, iOS meta tags.

### Phase 13: Core Business Flow Completion (Feb 20, 2026)
5 tracks: approval email notifications, owner bidding UI, property image upload with drag-and-drop, payout tracking, and owner confirmation timer with extension system.

### Phase 14: Executive Dashboard (Feb 20, 2026)
Investor-grade dark-themed strategic dashboard with 6 sections, 4 edge functions for external data (NewsAPI, FRED, AirDNA BYOK, STR BYOK), 4 data hooks, proprietary metrics (Liquidity Score, Bid Spread Index).

### Phase 15: Fair Value Score — RAV SmartPrice (Feb 21, 2026)
PostgreSQL RPC function analyzing comparable accepted bids (P25-P75 percentile range). Frontend components with role-specific messaging. Wired into Rentals cards, PropertyDetail sidebar, and owner listings management.

### Phase 16: Maintenance Fee Calculator — Fee Freedom Calculator (Feb 21, 2026)
Public break-even analysis tool at `/calculator`. Pure calculation logic covering 9 brands and 4 unit types. Color-coded progress bars and CTA to owner signup.

### Phase 17: Owner Dashboard — Owner's Edge (Feb 21, 2026)
6 business intelligence sections replacing placeholder Overview tab. 2 new PostgreSQL RPCs, 4 data hooks, 6 analytics components including earnings timeline chart and maintenance fee tracker.

### Phase 18: Travel Request Enhancements — Vacation Wishes (Feb 21, 2026)
Auto-match engine on listing approval, demand signal display on listing form, "Post a Travel Request" CTA on empty search results, and expiry warning system.

### Phase 19: Flexible Date Booking + Per-Night Pricing (Feb 22, 2026)
Switched from lump-sum to per-night pricing. Added "Propose Different Dates" bidding mode and "Request Similar Dates" inspired travel requests from listing detail. Shared pricing utility replacing 4 duplicated functions.

### Voice Tracks C-D: Admin Controls + Observability (Feb 22, 2026)
Voice admin dashboard with 5 sections: config info, tier quota manager, per-user overrides, usage dashboard (charts + top users), observability (search log viewer + alert thresholds). Auto-logging of all voice searches.

### Content Accuracy Audit (Feb 22, 2026)
Fixed commission rate (10% → 15%) across 7 code files + 3 tests. Corrected brand list (Westgate → WorldMark). Fixed voice quota display (flat → tier-based). Added 9 missing admin documentation sections. Established Content Accuracy policy in CLAUDE.md.

---

## 7. Upcoming Priorities

| # | Phase | Est. Time | Pre-Launch? |
|---|-------|-----------|-------------|
| 1 | Phase 20A-C: Accounting, Tax & Fee Framework | 14–20h | **A+B Required** |
| 2 | SEO Optimization | 8–12h | Recommended |
| 3 | Security Hardening (CSP, rate limiting, error monitoring) | 6–10h | Recommended |
| 4 | Phase 20D-F: QuickBooks, 1099-K, Tax Filing | 20–36h | Post-launch |
| 5 | Phase 3: Voice Everywhere | 3–4 weeks | No |
| 6 | Phase 12: Native Mobile (Capacitor) | 2–3 weeks | No |
| 7 | Phase 21: Partial-Week Booking | 20–30h | No (future) |
| 8 | Phase 6: Advanced Features | TBD | No (Q3 2026) |

---

## 8. Current Roadmap — Planned (Detail)

### 8.1 Phase 20: Accounting, Tax & Fee Framework

**Priority:** Required before public launch (Phases A + B). As a marketplace facilitator in 43+ US states, RAV must collect and remit occupancy/sales taxes before processing real transactions.

**Reference:** `docs/RAV-PRICING-TAXES-ACCOUNTING.md`

| Sub-Phase | Scope | Est. Time | Timeline |
|-----------|-------|-----------|----------|
| **A: Fee Breakdown** | Separate fee line items on bookings: nightly rate, service fee, cleaning fee, tax. Price breakdown display on PropertyDetail and Checkout pages. | 4–6h | Pre-launch |
| **B: Stripe Tax Integration** | Auto-calculated occupancy + sales tax at checkout based on property location. Tax line item stored on booking records. | 6–8h | Pre-launch |
| **C: Admin Tax Reporting** | Tax collected report by jurisdiction and month. Owner payout summary. Platform revenue report (service fees only). | 4–6h | Pre-launch |
| **D: QuickBooks Integration** | Sync Stripe transactions → QuickBooks Online via API. Automated revenue recognition and owner payout reconciliation. | 8–12h | Post-launch |
| **E: 1099-K Compliance** | Track owner earnings (>$600/year threshold). Generate 1099-K forms. Owner tax info collection (W-9). | 4–8h | Before Jan 2027 |
| **F: Automated Tax Filing** | Avalara or TaxJar integration for auto-filing per jurisdiction. Quarterly remittance reports. | 8–16h | When volume justifies |

> **Context:** Stripe processing fees (~2.9%) are absorbed by RAV within the 15% service fee margin. The platform commission rate (15% default) is admin-configurable. Pro owners pay 13% (−2%), Business owners pay 10% (−5%).

### 8.2 SEO Optimization

**Priority:** Recommended before public launch for organic discovery.

| Task | Description | Est. Time | Status |
|------|-------------|-----------|--------|
| **Per-page meta tags** | Install `react-helmet-async`, create `SEOHead` component, add unique title/description to all 15+ public routes | 3–4h | Planned |
| **Sitemap.xml** | Static sitemap with all public routes, add reference in robots.txt | 30min | Planned |
| **Page-level JSON-LD** | FAQPage on `/faq`, WebApplication on `/calculator`, Product/Offer on `/property/:id`, BreadcrumbList on all pages, SearchAction for site search | 2–3h | Planned |
| **Image optimization** | Add `loading="lazy"` + `decoding="async"` to all images, WebP format with fallbacks, responsive `srcset` | 2–3h | Planned |
| **Route-based code splitting** | Convert static imports to `React.lazy()` in App.tsx for smaller initial bundle and faster FCP | 1–2h | Planned |
| **Dynamic og:image** | Property-specific Open Graph images when sharing `/property/:id` on social media | 1h | Planned |
| **404 noindex** | Add `<meta name="robots" content="noindex">` to NotFound.tsx | 5min | Planned |

**What's already built (SEO):**

| Feature | Status | Details |
|---------|--------|---------|
| Homepage meta tags | BUILT | Title, description, og:*, twitter:* in `index.html` |
| Organization JSON-LD | BUILT | Schema.org markup with social links in `index.html` |
| robots.txt | BUILT | Permissive — allows Googlebot, Bingbot, social crawlers |
| PWA manifest | BUILT | Full manifest in `vite.config.ts` — name, icons, categories |
| Favicons | BUILT | ico + png icons for all platforms |
| Alt text on images | BUILT | ~95% coverage across 23 images |
| Semantic HTML | BUILT | h1, h2, main, section, nav used throughout |
| Clean URLs | BUILT | RESTful structure with 301 redirects for legacy routes |
| Calculator page title | BUILT | Dynamic `document.title` on `/calculator` (only page with per-page SEO) |
| Lighthouse CI | BUILT | lighthouserc.json config — currently audits 2 URLs |

> **SEO docs:** Planning documentation exists at `docs/features/seo-optimization/00-PROJECT-BRIEF.md` and `docs/features/seo-optimization/01-SESSION1-TASK.md` with implementation checklists and code examples.

### 8.3 Security Hardening

**Priority:** Recommended before public launch.

| Task | Description | Est. Time | Status |
|------|-------------|-----------|--------|
| **Content Security Policy** | Add CSP, X-Content-Type-Options, X-Frame-Options, HSTS headers via `vercel.json` | 2h | Planned |
| **Rate limiting (payment)** | Add per-IP rate limiting to `create-booking-checkout` and `send-email` edge functions (same pattern as voice/text-chat) | 2–3h | Planned |
| **Tighten CORS** | Checkout endpoint currently uses `Access-Control-Allow-Origin: *` — restrict to production domain whitelist | 30min | Planned |
| **Error monitoring** | Sentry integration for frontend + edge function error tracking, source map uploads | 2–3h | Planned |
| **Analytics** | Google Analytics 4 or Plausible for page views, events, conversion tracking | 1–2h | Planned |
| **Cookie consent** | GDPR/CCPA consent banner, preference center, conditional analytics loading | 2–3h | Planned |

**What's already built (Security):**

| Feature | Status |
|---------|--------|
| Voice search rate limiting (30 req/min per IP) | BUILT |
| Text chat rate limiting (60 req/min per IP) | BUILT |
| CORS whitelist (voice + text-chat) | BUILT |
| SSL/HTTPS (Vercel + Supabase) | BUILT |
| Row Level Security (all database tables) | BUILT |
| Admin approval workflow (user + listing) | BUILT |
| Staff Only Mode (3-layer enforcement) | BUILT |
| Terms of Service + Privacy Policy pages | BUILT |

### 8.4 Phase 21: Partial-Week Booking

**Priority:** Backlog — consider after date proposals validate demand

Enables travelers to book a subset of an owner's listed dates (e.g., 6 of 8 days). Requires per-night pricing (Phase 19 ✅), listing splits, per-split escrow, and handling of cleaning gaps and minimum stay rules. Estimated 20–30 hours. Deferred until demand validates the pattern through Phase 19's flexible date negotiation.

- Owner "flexible dates" flag on listings
- Calendar subset selection for travelers
- Listing splits (booked portion + remaining days become new listing)
- Per-segment escrow, confirmation, and payout
- Edge cases: cleaning gaps, minimum stay, resort check-in days

### 8.5 Voice & Mobile Roadmap

| Phase | Scope | Prerequisites | Est. Time |
|-------|-------|---------------|-----------|
| **Voice Everywhere (Phase 3)** | Voice-assisted listing creation, booking flows, and bidding negotiations | Voice Tracks C-D ✅ | 3–4 weeks |
| **Native Mobile — Track A** | Capacitor setup + build pipeline | PWA validates demand | ~2 days |
| **Native Mobile — Track B** | Push notifications, camera access, biometric auth | Track A | ~1 week |
| **Native Mobile — Track C** | App Store publishing (Google Play + Apple App Store) | Track B | ~1 week |
| **Native Mobile — Track D** | CI/CD for mobile builds | Track C | ~2–3 days |

### 8.6 Phase 6: Advanced Features (Q3 2026)

- Saved searches & search alerts
- Advanced filtering (map view, amenity search)
- Owner analytics and performance insights
- Calendar integration (Google Calendar, iCal)

---

## 9. Ideas Backlog (Unscheduled)

**Marketing & Growth:** Blog/content marketing, email campaigns, referral program, social media integration

**Platform Enhancements:** Instant booking, dynamic pricing, multi-property management tools, review/rating system

**Technical:** Performance optimization, A/B testing framework, CDN for property images, database read replicas

**Integrations:** Google Calendar sync, Stripe Connect for payouts, SMS notifications, social login (Facebook, Apple)

---

## 10. Key Architectural Decisions

| ID | Decision | Rationale | Status |
|----|----------|-----------|--------|
| DEC-008 | Membership tier & commission architecture | 6 tiers (3 renter, 3 owner) with tier-aware quotas and commission discounts | Final |
| DEC-011 | PWA first, then Capacitor native shells | Validate mobile demand before investing in native apps. Existing React codebase carries over — no rewrite needed | Approved |
| DEC-014 | Separate route for Executive Dashboard | Different design language (dark-themed) and audience (RAV Owner) from admin dashboard | Final |
| DEC-015 | BYOK demo/connected pattern for market data | Honest to investors (no fake data), shows product capability with real integrations | Final |
| DEC-018 | Staff Only Mode for pre-launch lock | Global system settings toggle. 3-layer enforcement (DB + Login + Signup). Flip off in admin to go live — no code deploy needed | Final |
| DEC-019 | Seed Data System | 3-layer edge function approach with foundation user protection. Idempotent, admin UI for one-click reset, production guard via env variable | Final |
| DEC-020 | Two-tier AI: VAPI voice + OpenRouter text | Text chat 10–100x cheaper per interaction, works in all environments. Shared search module avoids duplication | Final |
| DEC-022 | Pricing & Tax Framework | Per-night pricing + separated fee line items + Stripe Tax before launch + QuickBooks post-launch. Stripe processing fees (~2.9%) absorbed by RAV within the 15% service fee margin | Approved |
| DEC-023 | Flexible dates: 3-phase approach | Bid with dates (reuses bidding) → inspired-by requests → partial-week splits. Start lightweight, validate demand, then build full flexibility | Approved |

---

## 11. Launch Readiness Checklist

| Item | Status | Notes |
|------|--------|-------|
| Core booking flow (Browse → Search → Book → Pay → Confirm → Check-in) | **Ready** | Full Stripe integration with escrow |
| Voice search (Ask RAVIO) | **Ready** | Auth-gated, tier-based quotas, rate-limited, VAPI + Deepgram Nova-3 |
| Text chat (Chat with RAVIO) | **Ready** | Deployed on DEV + PROD, OpenRouter key configured |
| Bidding system (Name Your Price) | **Ready** | Full lifecycle: bid → counter → accept → checkout, date proposals |
| Travel requests (Vacation Wishes) | **Ready** | Auto-matching, demand signals, expiry warnings, inspired requests |
| Owner tools (Owner's Edge) | **Ready** | Dashboard, earnings, pricing intel, fee tracker, bid activity |
| Admin suite | **Ready** | 12 tabs: approvals, escrow, payouts, voice admin, executive BI |
| Per-night pricing | **Ready** | Phase 19 complete — nightly_rate as atomic pricing unit |
| Voice admin & observability | **Ready** | Voice Tracks C-D complete — admin controls, logging, alerts |
| Fee breakdown display | **In Progress** | Phase 20A — separate service_fee, cleaning_fee, tax line items |
| Stripe Tax integration | **Planned** | Phase 20B — **REQUIRED** before real transactions |
| SEO optimization | **Planned** | Per-page meta tags, sitemap, JSON-LD, image optimization |
| Error monitoring (Sentry) | **Planned** | Frontend + edge function error tracking |
| Analytics (GA4) | **Planned** | Page views, events, conversion tracking |
| Security headers (CSP) | **Planned** | Content Security Policy, HSTS, X-Frame-Options |
| Cookie consent (GDPR) | **Planned** | Consent banner, conditional analytics loading |
| Staff Only Mode OFF | **Pending** | Single toggle flip in Admin > System Settings when ready |

---

## 12. Deployment Status

| Environment | Status | URL | Database |
|-------------|--------|-----|----------|
| **Production** | Staff Only Mode (locked) | rent-a-vacation.com | Supabase PROD |
| **Staging/Preview** | Active development | Vercel preview URLs | Supabase DEV |

- **21 migrations** deployed to both DEV and PROD
- **17 edge functions** deployed to PROD (seed-manager DEV-only by design)
- **CI/CD:** GitHub Actions on push to `main` and PRs targeting `main`
- **Secrets configured:** RESEND_API_KEY, STRIPE_SECRET_KEY, NEWSAPI_KEY, OPENROUTER_API_KEY (both environments)

---

## 13. Performance Metrics — INDUSTRY DATA + PROJECTED

| Metric | Value | Label |
|--------|-------|-------|
| Voice Search Adoption | 34% of all searches | PROJECTED |
| Voice Search Success Rate | 87% | PROJECTED |
| Voice Search NPS | +68 | PROJECTED |
| Voice vs Manual Conversion Boost | +23% | PROJECTED |
| Listing Completion Time | 8 min (was 22 min, −64%) | PROJECTED |
| Listing Completion Rate | 94% (was 67%, +27%) | PROJECTED |
| Owner Satisfaction | 4.7 stars (was 3.8, +0.9) | PROJECTED |
| Resort Coverage | 117 resorts, 351 unit types, 10+ countries | BUILT |
| Automated Test Count | 306 | BUILT |

> **Honesty Framework:** BUILT = deployed and demonstrable in the codebase. INDUSTRY DATA = published research from third-party sources. PROJECTED = forward-looking estimates based on industry benchmarks and internal modeling. Never present projections as actuals.

---

## Glossary

All branded terms below are **RAV-coined names** — proprietary marketing terms created by Rent-A-Vacation to describe platform features. They are not industry-standard terms.

| Term | Type | Definition |
|------|------|------------|
| **RAV** | Brand abbreviation | Short for Rent-A-Vacation. Used in informal contexts, internal docs, and UI where space is limited |
| **RAVIO** | RAV-coined | **R**ent-**A**-**V**acation **I**ntelligent **O**perator. The AI assistant brand identity used for both voice search ("Ask RAVIO") and text chat ("Chat with RAVIO") |
| **Ask RAVIO** | RAV-coined | The voice search feature — travelers speak natural language queries to find properties. Powered by VAPI + Deepgram Nova-3 |
| **Chat with RAVIO** | RAV-coined | The text chat feature — travelers type questions to find properties. Powered by OpenRouter LLM |
| **Name Your Price** | RAV-coined | The bidding feature — travelers submit their own price offer on any listing where the owner has opted in to receiving bids |
| **Vacation Wishes** | RAV-coined | The travel request feature — a reverse auction where travelers post their dream trip (destination, dates, budget) and owners compete with proposals |
| **RAV SmartPrice** | RAV-coined | The fair value scoring system — uses P25-P75 percentile analysis of comparable accepted bids to tell users whether a listing is priced below market, at fair value, or above market |
| **Fee Freedom Calculator** | RAV-coined | The public break-even calculator — shows timeshare owners how many weeks they need to rent to cover their annual maintenance fees, across 9 vacation club brands |
| **TrustShield** | RAV-coined | The owner verification program — multi-step identity and property ownership verification with progressive trust levels (New → Verified → Trusted → Premium). Includes document upload and admin review |
| **PaySafe** | RAV-coined | The escrow payment system — holds traveler funds from booking until check-in is confirmed. Owners receive payout after checkout + 5 days. If issues arise, funds are held for resolution |
| **ResortIQ** | RAV-coined | The resort knowledge base — a curated database of 117 resorts and 351 unit types from 9 vacation club brands. Auto-populates listing specs when owners create listings |
| **RAV Command** | RAV-coined | The executive dashboard — investor-grade business intelligence with proprietary metrics, market data integrations, and live industry feed. For RAV leadership only |
| **Owner's Edge** | RAV-coined | The owner dashboard suite — 6 business intelligence sections giving property owners earnings tracking, pricing recommendations, bid activity, and maintenance fee coverage progress |
| **Liquidity Score** | RAV-coined | A proprietary marketplace health metric displayed on the executive dashboard — measures how efficiently supply (listings) is being matched with demand (bookings + bids) |
| **Bid Spread Index** | RAV-coined | A proprietary price discovery metric displayed on the executive dashboard — measures how closely bid amounts track listed prices, indicating pricing efficiency |
| **Demand Signals** | RAV-coined | Real-time indicators shown to owners while creating listings — displays matching travel request count and maximum disclosed budget to help owners price competitively |

### Industry Terms Used

| Term | Definition |
|------|------------|
| **Timeshare / Vacation Ownership** | A property ownership model where multiple buyers share rights to use a vacation property, typically in one-week intervals |
| **Maintenance Fees** | Annual fees charged by vacation clubs to owners for property upkeep, regardless of whether the owner uses their allotted time |
| **Escrow** | A financial arrangement where a third party holds funds on behalf of two transacting parties until conditions are met |
| **Per-Night Rate** | Industry-standard pricing model charging per night of stay (as opposed to lump-sum per-week pricing) |
| **P2P Marketplace** | Peer-to-peer marketplace — a platform connecting individual sellers directly with individual buyers |
| **BYOK** | Bring Your Own Key — a pattern where users supply their own API keys for third-party data integrations |
| **RLS** | Row Level Security — a PostgreSQL feature that restricts database access based on user identity at the row level |

---

*Prepared for RAV Partners — Confidential — Draft*
*Generated February 22, 2026. All statistics verified against source code and database schema.*
*Rent-A-Vacation | rent-a-vacation.com | Name Your Price. Book Your Paradise.*
*Questions: support@rent-a-vacation.com*
