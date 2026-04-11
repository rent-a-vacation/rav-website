---
last_updated: "2026-04-11T04:04:36"
change_ref: "902990b"
change_type: "session-39-docs-update"
status: "active"
---
# Rent-A-Vacation — Architecture & Developer Guide

> **Version:** 2.0 · **Last updated:** March 2026
> **Platform:** Vacation rental marketplace for timeshare & vacation club owners
> **Tagline:** "Name Your Price. Book Your Paradise."
> **Tests:** 771 across 99 files · **Edge Functions:** 27 · **Migrations:** 45

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Routing & Pages](#4-routing--pages)
5. [Authentication & RBAC](#5-authentication--rbac)
6. [Database Schema](#6-database-schema)
7. [Core Business Flows](#7-core-business-flows)
8. [Edge Functions (Backend)](#8-edge-functions-backend)
9. [Email System](#9-email-system)
10. [Name Your Price & Flexible Pricing](#10-name-your-price--flexible-pricing)
11. [Dynamic Pricing](#11-dynamic-pricing)
12. [Referral Program](#12-referral-program)
13. [Public API](#13-public-api)
14. [RAV Smart Suite](#14-rav-smart-suite)
15. [Realtime Subscriptions](#15-realtime-subscriptions)
16. [iCal Export](#16-ical-export)
17. [Design System](#17-design-system)
18. [State Management](#18-state-management)
19. [Environments & Deployment](#19-environments--deployment)
20. [Key Conventions](#20-key-conventions)
21. [SEO & Meta Tags](#21-seo--meta-tags)
22. [Voice Admin & Observability](#22-voice-admin--observability)

---

## 1. High-Level Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        RENT-A-VACATION                               │
├──────────────┬───────────────────┬───────────────────────────────────┤
│   FRONTEND   │   BACKEND (Edge)  │          DATABASE                 │
│              │                   │                                   │
│  React SPA   │  Deno Functions   │  PostgreSQL (Supabase)            │
│  Vite + TS   │  on Supabase      │  + RLS policies                  │
│  Tailwind    │                   │  + pg_cron / pg_net              │
│  shadcn/ui   │  • Stripe checkout│  + Auth (Supabase Auth)          │
│              │  • Email (Resend) │                                   │
│              │  • CRON reminders │  Storage Buckets:                │
│              │                   │  • property-images               │
│              │                   │  • verification-documents        │
└──────────────┴───────────────────┴───────────────────────────────────┘
```

**Three user personas:**
- **Travelers (renters)** — browse listings, make offers, book, check in
- **Property Owners** — list timeshares, manage bookings, verify identity
- **RAV Team (admin/staff)** — approve listings, verify owners, manage escrow & payouts

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 18 + TypeScript | SPA with strict typing |
| **Build** | Vite + SWC | Fast dev server, HMR |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first with component library |
| **Routing** | React Router v6 | Client-side routing |
| **Data Fetching** | TanStack React Query v5 | Server state, caching, mutations |
| **Forms** | React Hook Form + Zod | Validation & form state |
| **Auth** | Supabase Auth | Email/password, Google OAuth |
| **Database** | Supabase PostgreSQL | With Row Level Security (RLS) |
| **Backend** | Supabase Edge Functions (Deno) | Serverless API endpoints |
| **Payments** | Stripe Checkout | Full payment capture at booking |
| **Email** | Resend API | Transactional emails |
| **Charts** | Recharts | Admin dashboard analytics |
| **Voice** | VAPI (Deepgram STT + GPT-4o-mini + ElevenLabs TTS) | Voice search for properties |
| **Text Chat** | OpenRouter (Gemini 3 Flash) | RAVIO text chat with tool calling + SSE |
| **Analytics** | GA4 (G-G2YCVHNS25) + PostHog | Page views, events, cookie-consent gated |
| **Error Tracking** | Sentry.io | Source maps, browser tracing (5%), error-only session replay |
| **Testing** | Vitest + Playwright + Percy | 771 tests across 99 files |

---

## 3. Project Structure

```
src/
├── assets/                    # Static images (imported as ES6 modules)
├── components/
│   ├── ui/                    # shadcn/ui primitives (button, card, dialog, etc.)
│   ├── executive/             # Executive dashboard components
│   │   ├── TooltipIcon.tsx              # Metric tooltip (definition + whyItMatters)
│   │   ├── SectionHeading.tsx           # Consistent section headers
│   │   ├── SectionDivider.tsx           # Full-width dividers
│   │   ├── HeadlineBar.tsx              # Sticky 5 KPI pills
│   │   ├── BusinessPerformance.tsx      # Section 2: GMV trend, bid activity, revenue waterfall
│   │   ├── MarketplaceHealth.tsx        # Section 3: liquidity, supply/demand, voice funnel
│   │   ├── LiquidityGauge.tsx           # SVG gauge for liquidity score
│   │   ├── SupplyDemandMap.tsx          # Destination cards
│   │   ├── VoiceFunnel.tsx              # Voice vs traditional conversion
│   │   ├── MarketIntelligence.tsx       # Section 4: BYOK market data
│   │   ├── BYOKCard.tsx                 # Reusable BYOK wrapper
│   │   ├── IndustryFeed.tsx             # Section 5: news + macro
│   │   ├── UnitEconomics.tsx            # Section 6: investor metrics
│   │   ├── IntegrationSettings.tsx      # API key management drawer
│   │   └── utils.ts                     # formatCurrency, CHART_COLORS
│   ├── admin/                 # Admin dashboard tab components
│   │   ├── AdminOverview.tsx             # KPI cards, charts
│   │   ├── AdminUsers.tsx                # User & role management
│   │   ├── AdminListings.tsx             # Listing approval workflow
│   │   ├── AdminBookings.tsx             # All bookings view
│   │   ├── AdminProperties.tsx           # Property oversight
│   │   ├── AdminVerifications.tsx        # Owner document review
│   │   ├── AdminEscrow.tsx               # Escrow status management + owner confirmation status
│   │   ├── AdminPayouts.tsx              # Owner payout tracking & processing (Stripe Connect)
│   │   ├── AdminFinancials.tsx           # Revenue reports
│   │   ├── AdminCheckinIssues.tsx        # Traveler issue resolution
│   │   ├── AdminDisputes.tsx             # Dispute resolution with evidence viewer
│   │   ├── AdminPropertyEditDialog.tsx   # Admin edit property details with audit trail
│   │   ├── AdminListingEditDialog.tsx    # Admin edit listing with live price calc
│   │   ├── AdminResortImport.tsx         # CSV resort data import (3-step UI)
│   │   └── AdminApiKeys.tsx              # Public API key management + IP allowlisting
│   ├── bidding/               # Bidding marketplace components
│   │   ├── BidFormDialog.tsx       # Place a bid or propose different dates (mode: 'bid' | 'date-proposal')
│   │   ├── BidsManagerDialog.tsx   # Owner manages incoming bids
│   │   ├── OpenForBiddingDialog.tsx # Owner opens listing for bids
│   │   ├── TravelRequestCard.tsx   # Display travel request
│   │   ├── TravelRequestForm.tsx   # Create travel request (supports defaultValues prefill)
│   │   ├── ProposalFormDialog.tsx  # Owner proposes to travel request
│   │   ├── InspiredTravelRequestDialog.tsx # "Request Similar Dates" from listing detail
│   │   ├── DemandSignal.tsx       # Shows matching travel request count on listing form
│   │   ├── PostRequestCTA.tsx     # Empty search results → "Post a Travel Request" CTA
│   │   └── NotificationBell.tsx   # Real-time notification icon (Realtime subscription)
│   ├── booking/               # Booking experience components
│   │   ├── BookingTimeline.tsx       # 5-step timeline (vertical full + horizontal compact)
│   │   ├── BookingMessageThread.tsx  # Buyer-seller messaging (Realtime subscription)
│   │   ├── CancelBookingDialog.tsx   # Shared cancellation dialog (renter + owner)
│   │   ├── EvidenceUpload.tsx        # Dispute evidence upload with thumbnails
│   │   └── ReportIssueDialog.tsx     # Role-aware dispute/issue reporting
│   ├── owner-dashboard/       # Owner dashboard analytics components
│   │   ├── OwnerHeadlineStats.tsx    # 4 KPI cards (earned, listings, bids, fees coverage)
│   │   ├── EarningsTimeline.tsx      # Recharts AreaChart with monthly/quarterly toggle
│   │   ├── MyListingsTable.tsx       # Listing rows with status, fair value, idle alerts
│   │   ├── BidActivityFeed.tsx       # Event stream with color-coded bid events
│   │   ├── PricingIntelligence.tsx   # Per-listing fair value + dynamic pricing factors
│   │   └── MaintenanceFeeTracker.tsx # Fee input prompt or coverage progress bar
│   ├── owner/                 # Owner dashboard components
│   │   ├── OwnerProperties.tsx     # CRUD properties
│   │   ├── OwnerListings.tsx       # Manage listings (nightly_rate input + live pricing)
│   │   ├── OwnerBookings.tsx       # View bookings + iCal export + "Report Issue" button
│   │   ├── OwnerBookingConfirmations.tsx # Submit resort confirmation (2-phase)
│   │   ├── OwnerConfirmationTimer.tsx   # Owner acceptance countdown timer with extensions
│   │   ├── OwnerEarnings.tsx       # Revenue & payout tracking + Stripe Connect banner
│   │   ├── OwnerPayouts.tsx        # Payout history view
│   │   ├── OwnerProposals.tsx      # Sent proposals to travelers
│   │   ├── PropertyImageUpload.tsx # Drag-and-drop image upload
│   │   ├── OwnerVerification.tsx   # Upload verification docs
│   │   ├── StripeConnectBanner.tsx  # 3-state Stripe onboarding banner
│   │   ├── PricingSuggestion.tsx   # Market range gradient bar + competitive label
│   │   └── ReferralDashboard.tsx   # Referral code management + earnings tracker
│   ├── CompareListingsDialog.tsx  # Side-by-side property comparison (max 3)
│   ├── CancellationPolicyDetail.tsx # Badge + color-coded refund breakdown
│   ├── OwnerProfileCard.tsx       # Public owner profile summary
│   ├── Header.tsx             # Main navigation bar
│   ├── Footer.tsx             # Site footer
│   ├── HeroSection.tsx        # Landing page hero
│   ├── FeaturedResorts.tsx    # Landing featured resorts carousel
│   ├── TopDestinations.tsx    # Landing destination cards
│   ├── HowItWorks.tsx         # 3-step explanation
│   ├── Testimonials.tsx       # Social proof section
│   ├── CTASection.tsx         # Call-to-action banner
│   ├── TrustBadges.tsx        # Trust indicators
│   ├── NavLink.tsx            # Active-aware nav link
│   ├── RoleBadge.tsx          # Visual role indicator (crown, shield, etc.)
│   ├── ErrorBoundary.tsx      # Global error boundary
│   ├── PageLoadingFallback.tsx # Suspense loading state
│   ├── PWAInstallBanner.tsx   # Progressive web app install prompt
│   ├── OfflineBanner.tsx      # Offline status indicator
│   └── CookieConsentBanner.tsx # GDPR-compliant cookie consent
├── contexts/
│   └── AuthContext.tsx        # Auth state, session, roles, sign-in/out (+ referral capture)
├── flows/                     # Declarative flow manifests → auto-generated architecture diagrams
│   ├── types.ts               # FlowDefinition, FlowStep, FlowBranch types + flowToMermaid()
│   ├── owner-lifecycle.ts     # Property Owner Journey (signup → payout)
│   ├── traveler-lifecycle.ts  # Traveler Journey (browse → check-in)
│   ├── admin-lifecycle.ts     # RAV Admin Operations (approvals → financials)
│   └── index.ts               # Re-exports all flows + allFlows array
├── hooks/
│   ├── useAuth.ts             # Re-exports from AuthContext
│   ├── useTextChat.ts         # Text chat hook (SSE streaming, AbortController, context-aware)
│   ├── useBidding.ts          # All bidding queries & mutations (~600 lines)
│   ├── useOwnerConfirmation.ts # Owner acceptance timer, extensions, confirm/decline
│   ├── usePayouts.ts          # Owner & admin payout data hooks
│   ├── usePropertyImages.ts   # Upload, list, delete, reorder property images
│   ├── useCancelBooking.ts    # Cancellation hook (renter + owner)
│   ├── useBookingMessages.ts  # Buyer-seller messaging
│   ├── useReviews.ts          # Review CRUD hooks
│   ├── useListings.ts         # Active listings query
│   ├── useListingInquiries.ts # Pre-booking inquiry messaging
│   ├── useSavedSearches.ts    # Saved search + price drop tracking
│   ├── useFavorites.ts        # Listing favorites
│   ├── useRoleUpgrade.ts      # Role upgrade request + Realtime auto-detect
│   ├── useSubmitDispute.ts    # Dispute submission
│   ├── useDisputeEvidence.ts  # Dispute evidence upload
│   ├── useAccountDeletion.ts  # GDPR account deletion
│   ├── useDynamicPricing.ts   # Dynamic pricing factors (urgency, season, demand)
│   ├── useReferral.ts         # Referral code CRUD + signup capture (4 hooks)
│   ├── useOwnerCalendarExport.ts # iCal export for owner bookings
│   ├── useOwnerProfile.ts     # Public owner profile summary
│   ├── usePricingSuggestion.ts # Market-based pricing suggestions
│   ├── useRealtimeSubscription.ts # Generic Supabase Realtime wrapper (replaces polling)
│   ├── useFairValueScore.ts   # Fair value score RPC hook
│   ├── useOwnerCommission.ts  # Commission rate resolution
│   ├── usePublishDraft.ts     # Draft listing publish flow
│   ├── useListingSocialProof.ts # Social proof signals on listings
│   ├── useNotificationPreferences.ts # User notification settings
│   ├── useSystemSettings.ts   # System settings read hook
│   ├── useMembership.ts       # Membership tier hooks
│   ├── useVoiceSearch.ts      # Voice search hook (auto-logs searches)
│   ├── useVoiceQuota.ts       # Voice quota check
│   ├── useVoiceFeatureFlags.ts # Voice feature flags
│   ├── useCookieConsent.ts    # Cookie consent state
│   ├── usePageMeta.ts         # Per-page SEO meta tags
│   ├── useOnlineStatus.ts     # Network connectivity detection
│   ├── usePWAInstall.ts       # PWA install prompt
│   ├── use-mobile.tsx         # Responsive breakpoint hook
│   ├── owner/                 # Owner dashboard data hooks
│   │   ├── useOwnerDashboardStats.ts  # RPC: get_owner_dashboard_stats + useUpdateMaintenanceFees
│   │   ├── useOwnerEarnings.ts        # RPC: get_owner_monthly_earnings + fillMissingMonths
│   │   ├── useOwnerListingsData.ts    # Join query → OwnerListingRow[]
│   │   └── useOwnerBidActivity.ts     # Join query → BidEvent[]
│   ├── admin/                 # Admin dashboard data hooks
│   │   ├── useVoiceAdminData.ts       # 4 voice admin queries
│   │   ├── useVoiceAdminMutations.ts  # 5 voice admin mutations incl. useLogVoiceSearch
│   │   └── useApiKeys.ts             # API key CRUD + IP allowlist management
│   └── executive/             # Executive dashboard data hooks
│       ├── useBusinessMetrics.ts      # Tier 1 metrics from Supabase
│       ├── useMarketplaceHealth.ts    # Liquidity score + supply/demand
│       ├── useIndustryFeed.ts         # Tier 2: news + macro indicators
│       └── useMarketIntelligence.ts   # Tier 3: BYOK + settings
├── lib/
│   ├── supabase.ts            # Supabase client initialization
│   ├── email.ts               # Client-side email helpers (welcome, contact)
│   ├── pricing.ts             # calculateNights() + computeListingPricing() (15% RAV markup)
│   ├── dynamicPricing.ts      # Urgency discount, seasonal factor, demand adjustment
│   ├── cancellation.ts        # Refund calculation logic
│   ├── cancellationPolicy.ts  # Policy rules, deadlines, color-coded display utils
│   ├── bookingTimeline.ts     # computeBookingTimeline() → 5 steps with status
│   ├── compareListings.ts     # buildComparisonRows() with best-value identification
│   ├── destinations.ts        # 10 destinations / 35 cities directory data
│   ├── referral.ts            # Referral code generation + validation utilities
│   ├── icalendar.ts           # RFC 5545 iCal generation (zero dependencies)
│   ├── idleListingAlerts.ts   # Idle listing detection utilities
│   ├── renterDashboard.ts     # computeRenterOverview() + getCheckInCountdown()
│   ├── resortImportUtils.ts   # CSV validation, dedup, template generation
│   ├── listingSort.ts         # Multi-criteria listing sort
│   ├── calculatorLogic.ts     # Break-even calculator (9 brands)
│   ├── costComparator.ts      # RAV SmartCompare logic
│   ├── resortQuiz.ts          # RAV SmartMatch quiz logic
│   ├── budgetPlanner.ts       # RAV SmartBudget planner logic
│   ├── yieldEstimator.ts      # Yield estimation (merged into SmartEarn)
│   ├── launchReadiness.ts     # Launch readiness checks
│   ├── analytics.ts           # GA4 initialization + page view tracking
│   ├── posthog.ts             # PostHog analytics
│   ├── sentry.ts              # Sentry error tracking initialization
│   ├── apiAuth.test.ts        # API auth test utilities
│   └── utils.ts               # cn() class merge utility
├── pages/                     # Route-level page components
│   ├── Index.tsx              # Landing page
│   ├── Rentals.tsx            # Browse listings + compare mode
│   ├── PropertyDetail.tsx     # Single listing view + booking + cancellation policy
│   ├── ListProperty.tsx       # Owner listing creation form + pricing suggestions
│   ├── Checkout.tsx           # Stripe checkout page
│   ├── Login.tsx / Signup.tsx  # Auth pages (signup captures ?ref= referral codes)
│   ├── ForgotPassword.tsx / ResetPassword.tsx # Password recovery
│   ├── OwnerDashboard.tsx     # 4-tab owner management (dashboard, my-listings, bookings-earnings, account)
│   ├── AdminDashboard.tsx     # Tabbed admin: overview, users, listings, bookings, properties, verifications, escrow, payouts, financials, issues, voice, disputes, resorts, API keys
│   ├── ExecutiveDashboard.tsx # Investor-grade strategy dashboard (dark theme, rav_owner only)
│   ├── BiddingMarketplace.tsx # Browse flexible pricing listings & travel requests
│   ├── RenterDashboard.tsx    # /my-trips: 4 tabs (Overview, Bookings, Offers, Favorites)
│   ├── BookingSuccess.tsx     # Post-payment summary + booking timeline
│   ├── TravelerCheckin.tsx    # Check-in confirmation flow
│   ├── Destinations.tsx       # Destination directory
│   ├── DestinationDetail.tsx  # Individual destination + city detail pages
│   ├── HowItWorksPage.tsx     # Full how-it-works
│   ├── Documentation.tsx      # Admin manual (RBAC-protected)
│   ├── UserGuide.tsx          # Public user guide (13 owner + 7 renter sections)
│   ├── UserJourneys.tsx       # Interactive architecture diagrams (auto-generated from flows/)
│   ├── RavTools.tsx           # RAV Smart Suite hub (/tools)
│   ├── MaintenanceFeeCalculator.tsx # RAV SmartEarn (break-even + yield estimator)
│   ├── CostComparator.tsx     # RAV SmartCompare
│   ├── ResortQuiz.tsx         # RAV SmartMatch
│   ├── BudgetPlanner.tsx      # RAV SmartBudget
│   ├── AccountSettings.tsx    # Profile editing, password change
│   ├── PendingApproval.tsx    # Pending user approval notice
│   ├── ApiDocs.tsx            # Admin-gated Swagger UI (OpenAPI 3.0.3)
│   ├── Developers.tsx         # Public API docs (/developers)
│   ├── Contact.tsx            # Contact form
│   ├── FAQ.tsx / Terms.tsx / Privacy.tsx
│   └── NotFound.tsx           # 404 page
├── test/                      # Test infrastructure
│   ├── fixtures/              # Mock data (users, listings, memberships)
│   └── helpers/               # Test utilities (render, supabase-mock)
├── types/
│   ├── database.ts            # Complete DB schema types
│   ├── bidding.ts             # Bidding system types
│   ├── chat.ts                # Text chat types (ChatMessage, ChatStatus, ChatContext)
│   ├── ownerDashboard.ts      # Owner dashboard types
│   └── voice.ts               # Voice search types
├── index.css                  # Design system tokens (HSL)
├── App.tsx                    # Router + providers + lazy loading
└── main.tsx                   # Entry point

supabase/
├── config.toml                # Edge function registration
└── functions/                 # 27 edge functions (Deno)
    ├── _shared/
    │   ├── email-template.ts  # Unified email layout (buildEmailHtml, detailRow, infoBox)
    │   ├── property-search.ts # Shared search query builder (used by voice-search + text-chat)
    │   └── api-auth.ts        # API key validation + IP allowlist (CIDR) checking
    ├── api-gateway/               # Public API: 5 read-only endpoints, dual auth (API key + JWT), tiered rate limits
    ├── create-booking-checkout/   # Stripe checkout session creation
    ├── verify-booking-payment/    # Client-side payment verification → update booking + send confirmation email
    ├── stripe-webhook/            # Stripe webhook handler (6 event types, idempotent)
    ├── create-connect-account/    # Stripe Connect: create Express account + onboarding link
    ├── create-stripe-payout/      # Stripe Connect: initiate transfer to owner's connected account
    ├── process-cancellation/      # Booking cancellation: policy-based refund, Stripe refund, status updates
    ├── process-escrow-release/    # Escrow release automation
    ├── process-dispute-refund/    # Dispute resolution refund processing
    ├── delete-user-account/       # GDPR: full account deletion
    ├── export-user-data/          # GDPR: user data export
    ├── send-email/                # Generic email dispatch via Resend
    ├── send-booking-confirmation-reminder/  # Owner deadline reminders + confirmation notifications
    ├── send-approval-email/       # Admin approval/rejection notifications (listings + users)
    ├── send-cancellation-email/   # Traveler cancellation notifications
    ├── send-contact-form/         # Contact form email dispatch
    ├── send-verification-notification/  # Admin notification on doc upload
    ├── process-deadline-reminders/ # CRON: scan & send overdue reminders + owner confirmation timeouts
    ├── idle-listing-alerts/       # CRON: 60d/30d idle listing notifications to owners
    ├── match-travel-requests/     # Auto-match approved listings to open travel requests
    ├── voice-search/              # VAPI webhook: property search via voice
    ├── text-chat/                 # OpenRouter LLM: text chat with tool calling + SSE streaming
    ├── seed-manager/              # DEV only: 3-layer seed data system
    ├── fetch-industry-news/       # Executive: NewsAPI + Google News RSS (60-min cache)
    ├── fetch-macro-indicators/    # Executive: FRED consumer confidence + travel data
    ├── fetch-airdna-data/         # Executive: AirDNA market comps (BYOK)
    └── fetch-str-data/            # Executive: STR hospitality benchmarks (BYOK)

docs/
├── SETUP.md                   # Local dev setup guide
├── DEPLOYMENT.md              # CI/CD, env vars, CRON setup
├── ARCHITECTURE.md            # This file
├── PROJECT-HUB.md             # Architectural decisions + session handoff context
├── COMPLETED-PHASES.md        # Detailed technical record of completed work
├── api/
│   └── openapi.yaml           # OpenAPI 3.0.3 spec (26 endpoints, Redocly validated)
├── testing/                   # Test strategy, guidelines, operational guide
└── supabase-migrations/       # SQL migration scripts (007-045)
```

---

## 4. Routing & Pages

All routes are defined in `src/App.tsx`. SEO-critical pages are eagerly loaded; authenticated pages use `React.lazy()` with `Suspense`.

| Route | Page Component | Access | Description |
|-------|---------------|--------|-------------|
| `/` | `Index` | Public | Landing page |
| `/how-it-works` | `HowItWorksPage` | Public | Full how-it-works explanation |
| `/rentals` | `Rentals` | Auth | Browse listings + voice/text search + compare mode |
| `/property/:id` | `PropertyDetail` | Auth | Listing detail + book + cancellation policy display |
| `/checkout` | `Checkout` | Auth | Stripe checkout page |
| `/booking-success` | `BookingSuccess` | Auth | Post-payment summary + booking timeline |
| `/list-property` | `ListProperty` | Owner | Create a listing + pricing suggestions |
| `/login` | `Login` | Public | Email/password + Google |
| `/signup` | `Signup` | Public | Registration (captures `?ref=` referral codes) |
| `/forgot-password` | `ForgotPassword` | Public | Password recovery request |
| `/reset-password` | `ResetPassword` | Public | Password reset form |
| `/pending-approval` | `PendingApproval` | Public | Pending user approval notice |
| `/owner-dashboard` | `OwnerDashboard` | Owner | 4 tabs: dashboard, my-listings, bookings-earnings, account (Collapsible sub-sections) |
| `/admin` | `AdminDashboard` | RAV Team | 14 tabs: overview, users, listings, bookings, properties, verifications, escrow, payouts, financials, issues, voice, disputes, resorts, API keys |
| `/executive-dashboard` | `ExecutiveDashboard` | RAV Owner | Investor-grade strategy dashboard (dark theme) |
| `/bidding` | `BiddingMarketplace` | Auth | Browse flexible pricing listings + travel requests |
| `/my-trips` | `RenterDashboard` | Auth | 4 tabs: Overview, Bookings, Offers, Favorites + saved searches |
| `/account` | `AccountSettings` | Auth | Profile editing, password change, account info |
| `/checkin` | `TravelerCheckin` | Auth | Post-arrival confirmation |
| `/destinations` | `Destinations` | Public | Destination directory (10 destinations) |
| `/destinations/:slug` | `DestinationDetail` | Public | Individual destination detail |
| `/destinations/:slug/:city` | `DestinationDetail` | Public | City-level detail |
| `/documentation` | `Documentation` | RAV Team | Admin product manual |
| `/user-guide` | `UserGuide` | Public | Owner/traveler guide (20 sections) |
| `/user-journeys` | `UserJourneys` | Public | Interactive architecture diagrams (auto-generated from flows/) |
| `/tools` | `RavTools` | Public | RAV Smart Suite hub (5 tools) |
| `/calculator` | `MaintenanceFeeCalculator` | Public | RAV SmartEarn: break-even calculator + yield estimator |
| `/tools/cost-comparator` | `CostComparator` | Public | RAV SmartCompare: hotel vs timeshare cost comparison |
| `/tools/resort-quiz` | `ResortQuiz` | Public | RAV SmartMatch: resort recommendation quiz |
| `/tools/budget-planner` | `BudgetPlanner` | Public | RAV SmartBudget: vacation budget planner |
| `/api-docs` | `ApiDocs` | RAV Team | Admin-gated Swagger UI (OpenAPI 3.0.3) |
| `/developers` | `Developers` | Public | Public API documentation |
| `/faq` | `FAQ` | Public | FAQ (with JSON-LD FAQPage schema) |
| `/terms` | `Terms` | Public | Terms of service |
| `/privacy` | `Privacy` | Public | Privacy policy |
| `/contact` | `Contact` | Public | Contact form |

**Legacy redirects:** `/deals` → `/rentals`, `/owner-resources` `/pricing` `/success-stories` → `/how-it-works`, `/owner-faq` → `/faq`, `/my-bids` → `/my-trips?tab=offers`, `/my-bookings` → `/my-trips?tab=bookings`, `/tools/yield-estimator` → `/calculator`

---

## 5. Authentication & RBAC

### Auth Flow (`src/contexts/AuthContext.tsx`)

```
User Action → Supabase Auth → onAuthStateChange listener
                                    ↓
                          Fetch profile + roles in parallel
                                    ↓
                          Set user/session/profile/roles state
```

**Methods provided:**
- `signUp(email, password, fullName)` — creates user, triggers profile auto-creation via DB trigger
- `signIn(email, password)` — email/password login
- `signInWithGoogle()` — OAuth redirect flow
- `signOut()` — clears all state

### Role Hierarchy

| Role | Badge | Capabilities |
|------|-------|-------------|
| `rav_owner` | 👑 Crown | Full access, role management |
| `rav_admin` | 🛡️ Shield | Full access except role management |
| `rav_staff` | 📋 Briefcase | View/manage listings and bookings |
| `property_owner` | ✓ Verified | Manage own properties, listings, bookings |
| `renter` | 🧳 Traveler | Browse, make offers, book (default role) |

**Role checks available:**
- `hasRole(role)` — exact role check
- `isRavTeam()` — any of `rav_owner`, `rav_admin`, `rav_staff`
- `isPropertyOwner()` — `property_owner` role
- `isRenter()` — `renter` role

**DB Functions (security definers to prevent RLS recursion):**
- `has_role(_user_id, _role)` → boolean
- `get_user_roles(_user_id)` → AppRole[]
- `is_rav_team(_user_id)` → boolean
- `calculate_fair_value_score(p_listing_id)` → JSONB (tier, range_low/high, avg_accepted_bid, comparable_count)
- `get_owner_dashboard_stats(p_owner_id)` → JSONB (total_earned_ytd, active_listings, active_bids, maintenance fees, coverage %)
- `get_owner_monthly_earnings(p_owner_id)` → TABLE(month, earnings, booking_count)

---

## 6. Database Schema

### Entity Relationship Diagram

```
auth.users (Supabase managed)
    │
    ├── 1:1 ── profiles (auto-created on signup)
    ├── 1:N ── user_roles (RBAC)
    ├── 1:N ── properties (owner's vacation club units)
    │               │
    │               └── 1:N ── listings (available rental periods)
    │                              │
    │                              ├── 1:N ── listing_bids (traveler bids)
    │                              ├── 1:1 ── bookings (confirmed reservation)
    │                              │              │
    │                              │              ├── 1:1 ── booking_confirmations (resort conf#)
    │                              │              ├── 1:1 ── checkin_confirmations (arrival)
    │                              │              ├── 1:N ── cancellation_requests
    │                              │              └── 1:1 ── platform_guarantee_fund
    │                              └── 1:N ── travel_proposals (owner responses)
    │
    ├── 1:1 ── owner_agreements (commission terms)
    ├── 1:1 ── owner_verifications (trust/KYC)
    │               └── 1:N ── verification_documents
    ├── 1:N ── travel_requests (traveler-initiated)
    └── 1:N ── notifications
```

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `profiles` | User profile data | `id` (FK→auth.users), `email`, `full_name`, `phone`, `avatar_url` |
| `user_roles` | RBAC assignments | `user_id`, `role` (enum) |
| `properties` | Vacation club units | `owner_id`, `brand` (enum), `resort_name`, `location`, `bedrooms`, `amenities[]`, `images[]` |
| `owner_agreements` | Commission contracts | `owner_id`, `commission_rate`, `markup_allowed`, `max_markup_percent`, `status` |
| `listings` | Available rental periods | `property_id`, `owner_id`, `check_in_date`, `check_out_date`, `nightly_rate`, `owner_price`, `rav_markup`, `final_price`, `status`, `cancellation_policy` |
| `bookings` | Confirmed reservations | `listing_id`, `renter_id`, `total_amount`, `rav_commission`, `owner_payout`, `payment_intent_id`, `payout_status` |
| `booking_confirmations` | Resort confirmation + owner acceptance tracking | `booking_id`, `resort_confirmation_number`, `confirmation_deadline`, `escrow_status`, `escrow_amount`, `owner_confirmation_status`, `owner_confirmation_deadline`, `extensions_used` |
| `checkin_confirmations` | Arrival verification | `booking_id`, `traveler_id`, `confirmed_arrival`, `issue_reported`, `issue_type` |
| `cancellation_requests` | Cancellation workflow | `booking_id`, `requester_id`, `status`, `policy_refund_amount`, `final_refund_amount` |
| `owner_verifications` | Trust & KYC | `owner_id`, `trust_level` (new→verified→trusted→premium), `kyc_verified`, `verification_status` |
| `verification_documents` | Uploaded docs | `owner_id`, `doc_type` (deed, certificate, ID, etc.), `file_path`, `status` |
| `platform_guarantee_fund` | Safety fund contributions | `booking_id`, `contribution_amount`, `claim_reason` |

### Bidding Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `listing_bids` | Bids on listings | `listing_id`, `bidder_id`, `bid_amount`, `status`, `counter_offer_amount`, `requested_check_in`, `requested_check_out` |
| `travel_requests` | Traveler reverse-auctions | `traveler_id`, `destination_location`, dates, `budget_preference`, `proposals_deadline`, `source_listing_id`, `target_owner_only` |
| `travel_proposals` | Owner responses to requests | `request_id`, `property_id`, `owner_id`, `proposed_price`, `valid_until` |
| `notifications` | In-app alerts | `user_id`, `type` (enum), `title`, `message`, linked IDs |

### Enums (defined in DB and mirrored in `src/types/database.ts`)

`app_role`, `listing_status`, `booking_status`, `payout_status`, `agreement_status`, `vacation_club_brand`, `cancellation_policy`, `cancellation_status`, `owner_trust_level`, `verification_doc_type`, `verification_status`, `escrow_status`, `owner_confirmation_status`

### Migrations

52 migrations deployed via Supabase CLI (`npx supabase db push`). Migrations 001-050 deployed to DEV; 051 (unified conversations) and 052 (terms acceptance audit) deployed to DEV.

| # | File | What it creates |
|---|------|----------------|
| 001 | `initial_schema.sql` | profiles, user_roles, properties, owner_agreements, listings, bookings, RLS policies, triggers |
| 002 | `seed_data.sql` | Sample properties and listings (optional) |
| 003 | `bidding_system.sql` | listing_bids, travel_requests, travel_proposals, notifications, notification_preferences |
| 004 | `payout_tracking.sql` | Payout fields on bookings, booking_confirmations, checkin_confirmations |
| 005 | `cancellation_policies.sql` | cancellation_requests, policy enum, refund calculation function |
| 006 | `owner_verification.sql` | owner_verifications, verification_documents, trust levels, platform_guarantee_fund |
| 007 | `voice_auth_approval.sql` | Voice search auth + approval system |
| 008 | `voice_usage_limits.sql` | Voice usage tracking + daily limits |
| 009 | `favorites.sql` | User favorites table |
| 010 | `role_upgrade_requests.sql` | Role upgrade request workflow |
| 011 | `voice_toggles_membership_tiers.sql` | Voice feature toggles + membership_tiers table (Free/Plus/Premium renter, Free/Pro/Business owner) |
| 012 | `phase13_core_business.sql` | property-images storage bucket, owner confirmation columns, `extend_owner_confirmation_deadline` RPC |
| 013 | `bookings_fk_constraints.sql` | Booking FK constraint updates |
| 014 | `platform_staff_only.sql` | `platform_staff_only` system setting + `can_access_platform()` RPC for pre-launch lock |
| 015 | `seed_foundation_flag.sql` | `profiles.is_seed_foundation` boolean column + partial index for seed data management |
| 016 | `fair_value_score.sql` | `calculate_fair_value_score(listing_id)` RPC — comparable bid analysis with P25/P75 tiers |
| 017 | `owner_dashboard.sql` | `profiles.annual_maintenance_fees` column, `get_owner_dashboard_stats` + `get_owner_monthly_earnings` RPCs |
| 018 | `travel_request_enhancements.sql` | `notification_type` enum: `travel_request_expiring_soon`, `travel_request_matched` |
| 019 | `profiles_fk_constraints.sql` | Redirects 10 tables' user FK columns from `auth.users(id)` to `profiles(id)` for PostgREST embedding |
| 020 | `flexible_dates_nightly_pricing.sql` | `listings.nightly_rate` column (backfilled), `listing_bids.requested_check_in/out`, `travel_requests.source_listing_id` + `target_owner_only` |
| 021 | `voice_admin_observability.sql` | `voice_search_logs`, `voice_user_overrides` tables, alert threshold settings |
| 024 | `escrow_automation.sql` | Escrow release automation tables + RPC |
| 025 | `notification_preferences_expansion.sql` | Extended notification preference categories |
| 026 | `dispute_resolution.sql` | `disputes` table + resolution workflow |
| 027 | `account_deletion.sql` | GDPR account deletion support |
| 028 | `rate_limiting.sql` | Rate limiting infrastructure |
| 029 | `admin_notes.sql` | Admin notes on users/listings |
| 030 | `rejection_reasons.sql` | Structured rejection reason tracking |
| 031 | `dispute_assignment.sql` | Dispute assignment to staff |
| 032 | `owner_tax_info.sql` | Owner tax info + 1099-K support |
| 033 | `reviews.sql` | Reviews table + rating aggregation |
| 034 | `booking_messages.sql` | Buyer-seller messaging system |
| 035 | `portfolio_summary.sql` | Owner portfolio summary RPC |
| 036 | `owner_profile_summary.sql` | `get_owner_profile_summary` RPC for public owner profiles |
| 037 | `listing_inquiries.sql` | `listing_inquiries` + `inquiry_messages` tables for pre-booking messaging |
| 038 | `saved_searches.sql` | `saved_searches` table + price drop tracking |
| 039 | `idle_listing_alerts.sql` | Idle listing alert tracking |
| 040 | `admin_audit_trail.sql` | Admin edit audit trail (`last_edited_by/at`) |
| 041 | `expand_disputes.sql` | 5 owner dispute categories + `evidence_urls` |
| 042 | `dynamic_pricing_data.sql` | `get_dynamic_pricing_data` RPC (urgency, season, demand factors) |
| 043 | `referral_program.sql` | `referral_codes` + `referrals` tables, 3 referral RPCs |
| 044 | `api_keys.sql` | `api_keys` + `api_request_log` tables, 4 API management RPCs |
| 045 | `api_key_ip_allowlist.sql` | `allowed_ips text[]` on api_keys + CIDR validation |
| 046 | `notification_center.sql` | `notification_catalog`, `user_notification_preferences`, seasonal events, delivery log |
| 047 | `membership_stripe_prices.sql` | Stripe price IDs on membership tiers |
| 048 | `set_stripe_price_ids.sql` | Production Stripe price ID seeding |
| 049 | `listing_limit_trigger.sql` | DB trigger enforcing per-tier listing limits |
| 050 | `subscription_metrics_rpc.sql` | `get_subscription_metrics` RPC for admin MRR dashboard |
| 051 | `unified_conversations.sql` | `conversations`, `conversation_messages`, `conversation_events` + 4 RPCs + 12-step backfill |
| 052 | `terms_acceptance_audit.sql` | `terms_acceptance_log` + 3 profile columns (onboarding_completed_at, current_terms_version, current_privacy_version) + backfill of 60 approved users |

Additional non-numbered migrations:
- `20260211_resort_master_data.sql` — Resort master data seed
- `20260220201325_executive_dashboard_settings.sql` — Executive dashboard settings

---

## 7. Core Business Flows

### 7.1 Listing & Booking Flow

```
Owner creates Property → Owner creates Listing (draft)
        ↓
RAV admin approves → status = 'active'
        ↓
Traveler browses /rentals → views /property/:id
        ↓
Traveler clicks "Book Now" → Edge Function: create-booking-checkout
        ↓
Stripe Checkout → payment captured → verify-booking-payment (client) + stripe-webhook (server)
        ↓
Booking created (status: confirmed) + booking_confirmation created
        ↓
Owner Acceptance (configurable timer, default 60 min, up to 2 extensions of 30 min)
  → Owner confirms → proceed to resort confirmation
  → Owner times out or declines → auto-cancel, full refund
        ↓
Owner submits resort confirmation # before 48h deadline
        ↓
RAV verifies → escrow_status: verified → released after checkout + 5 days
```

### 7.2 Escrow & Payout Flow

```
Payment captured → funds held in escrow (escrow_status: pending_confirmation)
        ↓
Owner submits resort confirmation → escrow_status: confirmation_submitted
        ↓
RAV staff verifies → escrow_status: verified
        ↓
Traveler checks in + confirms arrival → escrow_status: released
        ↓
Payout to owner (checkout_date + 5 days) → payout_status: paid
```

### 7.3 Cancellation Flow

```
Traveler requests cancellation → cancellation_request created
        ↓
System calculates policy_refund_amount (based on cancellation_policy + days_until_checkin)
        ↓
Owner responds: approve / deny / counter_offer
        ↓
If approved → refund processed → escrow refunded
If counter_offer → traveler accepts/rejects → resolve
```

**Cancellation policies** (`src/lib/cancellation.ts`):
- **Flexible:** 100% refund ≥1 day before check-in
- **Moderate:** 100% ≥5 days, 50% 1-4 days
- **Strict:** 50% ≥7 days, 0% after
- **Super Strict:** No refunds

### 7.4 Check-in Flow

```
Traveler arrives → navigates to /checkin
        ↓
Confirms arrival OR reports issue (access problem, safety concern, mismatch)
        ↓
If issue → admin notified → resolution tracked in checkin_confirmations
If OK → booking proceeds → payout released after checkout
```

---

## 8. Edge Functions (Backend)

All 27 edge functions live in `supabase/functions/` and run on Deno. They share common modules from `_shared/` (email template, property search, API auth).

| Function | Trigger | Purpose |
|----------|---------|---------|
| **Payments & Stripe** | | |
| `create-booking-checkout` | Client call | Creates Stripe Checkout session with listing details |
| `verify-booking-payment` | Client call (post-redirect) | Client-side payment verification after Stripe redirect — updates booking status, creates booking_confirmation with owner acceptance timer, sends emails |
| `stripe-webhook` | **Stripe webhook** | Server-side safety net for payment verification, session expiry, refunds, Connect account updates, transfer tracking. 6 event types. Idempotent. |
| `create-connect-account` | Client call (owner) | Creates Stripe Express account for owner + generates onboarding link |
| `create-stripe-payout` | Client call (admin) | Initiates Stripe Transfer to owner's connected account |
| `process-cancellation` | Client call (renter/owner) | Policy-based refund, Stripe refund, cancellation request record, status updates |
| `process-escrow-release` | Client call (admin) | Automated escrow release after checkout + verification |
| `process-dispute-refund` | Client call (admin) | Dispute resolution refund processing |
| **Email** | | |
| `send-email` | Client call | Generic email dispatch via Resend API |
| `send-approval-email` | Client call | Approval/rejection emails for listings and users (4 variants) |
| `send-booking-confirmation-reminder` | Client/internal | Owner resort confirmation reminders + acceptance notifications |
| `send-cancellation-email` | Internal | Cancellation status notifications (submitted, approved, denied, counter_offer) |
| `send-contact-form` | Client call | Contact form email dispatch |
| `send-verification-notification` | Client call | Alerts admin when owner uploads verification docs |
| **CRON & Automation** | | |
| `process-deadline-reminders` | **CRON (every 30 min)** | Deadline scanning, reminder emails, owner confirmation timeouts (auto-cancel + refund), travel request expiry warnings |
| `idle-listing-alerts` | **CRON** | Detects listings idle for 60d/30d, sends notification emails to owners |
| `match-travel-requests` | Internal (listing approval) | Matches approved listings against open travel requests by destination, dates, bedrooms, budget, brand |
| **GDPR & Account** | | |
| `delete-user-account` | Client call | Full GDPR account deletion |
| `export-user-data` | Client call | GDPR data export |
| **AI & Search** | | |
| `voice-search` | VAPI webhook | Property search via voice — shared `_shared/property-search.ts`, state name expansion |
| `text-chat` | Client call | OpenRouter LLM chat with SSE streaming, tool calling, 4 context modes. Model: `google/gemini-3-flash-preview` |
| **Public API** | | |
| `api-gateway` | Client call | Public API: 5 read-only endpoints (listings, properties, destinations, resorts, availability). Dual auth (API key + JWT). Tiered rate limits. IP allowlisting with CIDR support. |
| **Executive Dashboard** | | |
| `fetch-industry-news` | Client call | NewsAPI + Google News RSS (60-min cache) |
| `fetch-macro-indicators` | Client call | FRED consumer confidence + travel data (public API) |
| `fetch-airdna-data` | Client call | AirDNA market comps (BYOK — user-supplied key) |
| `fetch-str-data` | Client call | STR hospitality benchmarks (BYOK — user-supplied key) |
| **Dev Tools** | | |
| `seed-manager` | Client call | DEV only: 3-layer seed data system. Production guard via `IS_DEV_ENVIRONMENT` secret |

### Required Secrets (Supabase Dashboard)

| Secret | Used by |
|--------|---------|
| `RESEND_API_KEY` | All email functions (domain: `updates.rent-a-vacation.com`) |
| `STRIPE_SECRET_KEY` | create-booking-checkout, verify-booking-payment, stripe-webhook, create-connect-account, create-stripe-payout, process-cancellation, process-escrow-release, process-dispute-refund |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook (webhook signature verification) |
| `NEWSAPI_KEY` | fetch-industry-news |
| `OPENROUTER_API_KEY` | text-chat |
| `IS_DEV_ENVIRONMENT` | seed-manager (production guard) |

### Required Secrets (GitHub Repository)

| Secret | Used by |
|--------|---------|
| `RESEND_GITHUB_NOTIFICATIONS_KEY` | `.github/workflows/issue-notifications.yml` — emails RAV team on issue events |
| `PERCY_TOKEN` | Visual regression tests (currently disabled — private repo) |
| `QASE_API_TOKEN` | Qase test management integration |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | CI test environment |

---

## 9. Email System

### Architecture

Two parallel implementations, both using the same visual design:

1. **Edge Functions** (server-side): Import `buildEmailHtml()` from `_shared/email-template.ts`
2. **Client-side** (`src/lib/email.ts`): Has its own `wrapEmail()` function mirroring the same design

### Shared Template API (`_shared/email-template.ts`)

```typescript
buildEmailHtml({
  recipientName?: string,   // "Hi {name},"
  heading: string,          // Displayed in branded header bar
  body: string,             // HTML content
  cta?: { label, url },     // Orange CTA button
  footerNote?: string       // Override default tagline
}): string

detailRow(label, value): string   // "Resort: Hilton Grand"
infoBox(content, variant): string // Colored info/warning/success/error box
```

### Emails Sent

| Email | Trigger | Recipient |
|-------|---------|-----------|
| Welcome | User signup | New user |
| Booking Confirmed | Payment verified | Traveler |
| Confirmation Reminder (standard) | CRON, 6-12h before deadline | Owner |
| Confirmation Reminder (urgent) | CRON, <6h before deadline | Owner |
| Check-in Reminder | CRON, near arrival | Traveler |
| Cancellation Submitted | Request created | Traveler |
| Cancellation Approved | Owner approves | Traveler |
| Cancellation Denied | Owner denies | Traveler |
| Cancellation Counter-Offer | Owner counter-offers | Traveler |
| Owner Confirmation Request | Payment verified | Owner |
| Owner Extension Notification | Owner requests extension | Renter |
| Owner Confirmation Timeout | Owner times out | Owner + Renter |
| Listing Approved | Admin approves listing | Owner |
| Listing Rejected | Admin rejects listing | Owner |
| User Approved | Admin approves user | User |
| User Rejected | Admin rejects user | User |
| Verification Doc Uploaded | Doc upload | RAV admin |
| Contact Form | Form submission | support@rent-a-vacation.com |

---

## 10. Name Your Price & Flexible Pricing

Two-sided marketplace modeled after Priceline:

### Owner-Initiated Flexible Pricing

1. Owner opens a listing for offers (`open_for_bidding = true`)
2. Sets `bidding_ends_at`, optional `min_bid_amount`, `reserve_price`
3. Travelers make offers via `BidFormDialog`
4. Owner reviews in `BidsManagerDialog` → accept / reject / counter-offer

### Traveler-Initiated (Reverse Auction)

1. Traveler posts a `TravelRequest` with destination, dates, budget, requirements
2. Property owners browse open requests on `/bidding`
3. Owners submit `TravelProposal` with property, price, dates
4. Traveler reviews proposals → accept (→ booking) or reject

### Data Hooks (`src/hooks/useBidding.ts`)

| Hook | Returns |
|------|---------|
| `useListingsOpenForBidding()` | Active flexible pricing listings |
| `useBidsForListing(id)` | Offers on a specific listing |
| `useMyBids()` | Current user's offers |
| `useCreateBid()` | Mutation: make an offer |
| `useUpdateBidStatus()` | Mutation: accept/reject/counter |
| `useOpenListingForBidding()` | Mutation: enable flexible pricing |
| `useOpenTravelRequests()` | Active travel requests |
| `useMyTravelRequests()` | Current user's requests |
| `useCreateTravelRequest()` | Mutation: post request |
| `useProposalsForRequest(id)` | Proposals on a request |
| `useMyProposals()` | Current user's proposals |
| `useCreateProposal()` | Mutation: submit proposal |
| `useUpdateProposalStatus()` | Mutation: accept/reject |
| `useNotifications(limit)` | User notifications (auto-refresh 30s) |
| `useUnreadNotificationCount()` | Badge count |
| `useMarkNotificationRead()` | Mutation: mark as read |
| `useMarkAllNotificationsRead()` | Mutation: mark all read |

---

## 11. Dynamic Pricing

### Architecture (`src/lib/dynamicPricing.ts`)

Dynamic pricing adjusts suggested listing prices based on three factors:

| Factor | Logic | Range |
|--------|-------|-------|
| **Urgency Discount** | Graduated discount as check-in approaches (0-15%) | 0% (>30 days) to 15% (<3 days) |
| **Seasonal Factor** | Month-based multiplier | 0.85x (Jan) to 1.15x (Jun/Jul/Dec) |
| **Demand Adjustment** | Based on bid count + search volume for destination | -5% to +10% |

**Database:** Migration 042 adds `get_dynamic_pricing_data` RPC returning bid counts, search volume, and comparable pricing data.

**Hook:** `useDynamicPricing(listingId)` combines RPC data with client-side factor calculation.

**UI Integration:** `PricingSuggestion` component (owner dashboard) shows factor badges alongside market range.

---

## 12. Referral Program

### Architecture

| Layer | Implementation |
|-------|---------------|
| **Database** | Migration 043: `referral_codes` + `referrals` tables, 3 RPCs (`create_referral_code`, `record_referral`, `get_referral_stats`) |
| **Utilities** | `src/lib/referral.ts` — code generation + validation |
| **Hooks** | `src/hooks/useReferral.ts` — 4 hooks (useMyReferralCode, useCreateReferralCode, useReferralStats, useRecordReferral) |
| **UI** | `ReferralDashboard` in Owner Dashboard Account tab |
| **Capture** | `AuthContext.signUp()` reads `?ref=CODE` from URL, records referral on successful signup |

---

## 13. Public API

### Architecture

The public API provides read-only access to marketplace data for third-party integrations.

| Component | Location | Purpose |
|-----------|----------|---------|
| `api-gateway` | `supabase/functions/api-gateway/` | Edge function: 5 read-only endpoints (listings, properties, destinations, resorts, availability) |
| `api-auth.ts` | `supabase/functions/_shared/api-auth.ts` | API key validation + IP allowlist checking (CIDR support) |
| `api_keys` table | Migration 044 | API key storage + request logging |
| `allowed_ips` | Migration 045 | Optional IP allowlist per API key |
| `AdminApiKeys` | `src/components/admin/AdminApiKeys.tsx` | Admin tab: create/revoke keys, edit IP allowlists |
| `Developers` page | `src/pages/Developers.tsx` | Public Swagger UI at `/developers` |
| `ApiDocs` page | `src/pages/ApiDocs.tsx` | Admin-gated Swagger UI at `/api-docs` |
| OpenAPI spec | `docs/api/openapi.yaml` | OpenAPI 3.0.3 spec (26 endpoints, Redocly validated) |

### Unified Conversation Layer (Migration 051)

| Component | Location | Purpose |
|-----------|----------|---------|
| `conversations` table | Migration 051 | One conversation per owner-traveler-property combination |
| `conversation_messages` table | Migration 051 | Human-authored messages (replaces inquiry_messages + booking_messages) |
| `conversation_events` table | Migration 051 | System events (bid_placed, booking_confirmed, etc.) |
| `get_or_create_conversation` RPC | Migration 051 | Idempotent conversation creation |
| `mark_conversation_read` RPC | Migration 051 | Reset unread counts for current user |
| `get_conversation_thread` RPC | Migration 051 | Combined messages + events sorted by timestamp |
| `insert_conversation_event` RPC | Migration 051 | SECURITY DEFINER — clients must not INSERT directly |
| `useConversations.ts` | `src/hooks/useConversations.ts` | 5 queries + 5 mutations with realtime |
| `conversations.ts` | `src/lib/conversations.ts` | Types, badges, event formatting, participant helpers |
| `Messages` page | `src/pages/Messages.tsx` | Two-panel inbox + thread at `/messages` |
| `ConversationInbox` | `src/components/messaging/` | Filter tabs, unread dots, context badges |
| `ConversationThread` | `src/components/messaging/` | Message bubbles, system events, date separators |

**Auth model:** Dual authentication — API key (header `X-API-Key`) or JWT (Supabase session). Tiered rate limits based on membership.

### Terms Acceptance Audit + Post-Approval Onboarding Gate (Migration 052 / WS2)

| Component | Location | Purpose |
|-----------|----------|---------|
| `terms_acceptance_log` table | Migration 052 | Permanent audit trail of every T&C acceptance event (version, method, timestamp, user_agent, ip_address) |
| `profiles.onboarding_completed_at` | Migration 052 | Timestamp when user completed the post-approval onboarding gate |
| `profiles.current_terms_version` | Migration 052 | Latest T&C version accepted by the user |
| `profiles.current_privacy_version` | Migration 052 | Latest Privacy Policy version accepted by the user |
| `termsVersions.ts` | `src/lib/termsVersions.ts` | `CURRENT_TERMS_VERSION` / `CURRENT_PRIVACY_VERSION` constants (bump when legal docs change) |
| `useOnboarding.ts` | `src/hooks/useOnboarding.ts` | Pure `needsOnboarding(profile, isRavTeam)` + `useCompleteOnboarding()` mutation |
| `WelcomePage` | `src/pages/WelcomePage.tsx` | 2-step post-approval gate at `/welcome` — T&C reconfirm + role-specific CTAs |
| `ProtectedRoute` onboarding gate | `src/App.tsx` | Redirects approved users with null `onboarding_completed_at` to `/welcome`; whitelists `/welcome`, `/terms`, `/privacy`; RAV team bypasses entirely |
| `Signup` controlled form | `src/pages/Signup.tsx` | 2 separate checkboxes (age 18+, Terms + Privacy), submit disabled until both checked, writes audit row with `signup_checkbox` method |

**Acceptance methods:** `signup_checkbox` | `post_approval_gate` | `terms_update_prompt` (future, for when T&C versions change and we need re-acceptance).

---

## 14. RAV Smart Suite

Five free tools at `/tools` designed as SEO magnets and lead generation:

| Tool | Route | Logic File | Description |
|------|-------|-----------|-------------|
| **RAV SmartEarn** | `/calculator` | `calculatorLogic.ts` + `yieldEstimator.ts` | Break-even calculator + yield estimator (merged). 9 brands. |
| **RAV SmartPrice** | (integrated) | `dynamicPricing.ts` | Dynamic pricing suggestions (see Section 11) |
| **RAV SmartCompare** | `/tools/cost-comparator` | `costComparator.ts` | Hotel vs timeshare cost comparison |
| **RAV SmartMatch** | `/tools/resort-quiz` | `resortQuiz.ts` | Resort recommendation quiz |
| **RAV SmartBudget** | `/tools/budget-planner` | `budgetPlanner.ts` | Vacation budget planner |

All tool pages include breadcrumbs, `font-display` h1 headings, `usePageMeta()` SEO tags, and JSON-LD structured data (HowTo, ItemList).

The `/tools/yield-estimator` route redirects to `/calculator` (merged into SmartEarn as a toggle).

---

## 15. Realtime Subscriptions

### Architecture (`src/hooks/useRealtimeSubscription.ts`)

Generic wrapper around Supabase `postgres_changes` channel subscriptions. Replaces all polling patterns with push-based updates.

**Usage pattern:**
```typescript
useRealtimeSubscription({
  table: 'notifications',
  filter: `user_id=eq.${userId}`,
  event: 'INSERT',
  onData: (payload) => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
});
```

**Components using Realtime:**
| Component | Previously | Now |
|-----------|-----------|-----|
| `NotificationBell` | 30s polling | Realtime INSERT subscription |
| `BookingMessageThread` | 10s polling | Realtime INSERT subscription |
| Unread notification count | 30s polling | Realtime INSERT subscription |
| `RoleUpgradeDialog` | Manual refresh | Realtime auto-detect on approval |

---

## 16. iCal Export

### Architecture

| Layer | Implementation |
|-------|---------------|
| **Library** | `src/lib/icalendar.ts` — RFC 5545 compliant iCal generation, zero dependencies |
| **Hook** | `src/hooks/useOwnerCalendarExport.ts` — fetches owner bookings, generates `.ics` file, triggers download |
| **UI** | "Export Calendar" button in `OwnerBookings` component |

Generates `VEVENT` entries for each confirmed booking with summary, location, description, and `DTSTART`/`DTEND` in date-value format. Compatible with Google Calendar, Apple Calendar, and Outlook.

---

## 17. Design System

### Tokens (`src/index.css`)

All colors defined as HSL values in CSS custom properties:

| Token | Light Mode | Usage |
|-------|-----------|-------|
| `--primary` | `175 60% 28%` | Deep teal — buttons, links, brand |
| `--accent` | `18 85% 58%` | Warm coral — CTAs, highlights |
| `--background` | `45 25% 97%` | Page background |
| `--foreground` | `200 25% 15%` | Primary text |
| `--secondary` | `40 30% 94%` | Soft sand — secondary surfaces |
| `--muted` | `45 15% 92%` | Subtle backgrounds |
| `--destructive` | `0 84.2% 60.2%` | Error/delete |
| `--success` | `160 60% 40%` | Success states |
| `--warning` | `38 92% 50%` | Warning states |

**Dark mode** is fully themed with inverted token values.

### Typography

- **Font:** Roboto (imported from Google Fonts)
- Used for both display and body text (`--font-display`, `--font-body`)

### Component Library

Built on **shadcn/ui** (Radix primitives + Tailwind). All components in `src/components/ui/`.

**CRITICAL RULE:** Never use hardcoded color classes (`text-white`, `bg-black`). Always use semantic tokens (`text-foreground`, `bg-primary`, etc.).

---

## 18. State Management

| Concern | Solution | Location |
|---------|---------|----------|
| Auth state | React Context | `AuthContext.tsx` |
| Server data | TanStack React Query v5 | Custom hooks (`useBidding.ts`, page-level queries) |
| Form state | React Hook Form + Zod | Inline in page/dialog components |
| UI state | Local `useState` | Component-level |
| Notifications | Toast (sonner + shadcn) | `toast()` / `toast.success()` |

**Query client** instantiated in `App.tsx`, wraps entire app.

---

## 19. Environments & Deployment

### Branch Strategy: `dev` → `main`

| Environment | Branch | Frontend | Database | Purpose |
|-------------|--------|----------|----------|---------|
| **Development** | `dev` | Vercel Preview | Supabase DEV (`oukbxqnlxnkainnligfz`) | Active dev + testing |
| **Preview** | PR branches | Vercel Preview | Supabase DEV | PR reviews |
| **Production** | `main` | Vercel (`rent-a-vacation.com`) | Supabase PROD (`xzfllqndrlmhclqfybew`) | Live users |

### Deployment Pipeline

```
feature/* (optional)
    ↓ PR
  dev   →  Vercel Preview Deploy  →  Supabase DEV
    ↓ PR (release)
  main  →  Vercel Production      →  Supabase PROD
```

- **Never push directly to `main`** — always create a PR from `dev` (or a feature branch)
- Local `.env.local` points to Supabase DEV
- Vercel production points to Supabase PROD
- **Edge functions** deployed manually via Supabase CLI (`npx supabase functions deploy <name> --project-ref <ref>`)
- **Migrations** deployed via `npx supabase db push` (must link to target project first)

### Environment Variables

| Variable | Where Set |
|----------|-----------|
| `VITE_SUPABASE_URL` | Vercel env vars |
| `VITE_SUPABASE_ANON_KEY` | Vercel env vars |
| `RESEND_API_KEY` | Supabase Edge Function secrets |
| `STRIPE_SECRET_KEY` | Supabase Edge Function secrets |
| `STRIPE_WEBHOOK_SECRET` | Supabase Edge Function secrets |
| `NEWSAPI_KEY` | Supabase Edge Function secrets |
| `OPENROUTER_API_KEY` | Supabase Edge Function secrets |
| `IS_DEV_ENVIRONMENT` | Supabase Edge Function secrets (DEV only) |

---

## 20. Key Conventions

### Code Style

- **TypeScript strict mode** — no `any` unless unavoidable (marked with eslint-disable)
- **Functional components only** — no class components
- **Named exports** for hooks and utilities; **default exports** for pages
- **Parallel data fetching** — `Promise.all()` where possible
- **Error handling** — try/catch in async functions, toast on failure

### File Organization

- **One component per file** — keep files focused (<300 lines ideally)
- **Colocate related code** — admin components in `admin/`, bidding in `bidding/`, etc.
- **Types in `src/types/`** — shared across components
- **Hooks in `src/hooks/`** — reusable data logic
- **Libs in `src/lib/`** — pure utility functions (no React)

### Database

- **All tables have RLS** — never bypass
- **Security definer functions** — used for role checks to prevent RLS recursion
- **Triggers** — auto-create profile on signup, auto-assign `renter` role
- **Enums** — defined in DB, mirrored in `src/types/database.ts`
- **FK constraints for PostgREST** — user-related FK columns MUST reference `profiles(id)`, NOT `auth.users(id)`. PostgREST only traverses FKs within the `public` schema (migration 019)

### Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase | `BidFormDialog.tsx` |
| Hooks | camelCase, `use` prefix | `useBidding.ts` |
| Types | PascalCase | `ListingWithBidding` |
| Enums | snake_case (DB) | `pending_confirmation` |
| CSS tokens | kebab-case | `--primary-foreground` |
| DB tables | snake_case | `booking_confirmations` |
| Edge functions | kebab-case dirs | `create-booking-checkout/` |

### Storage Buckets

| Bucket | Access | Structure |
|--------|--------|-----------|
| `property-images` | Public read, owner write | `{owner_id}/{filename}` |
| `verification-documents` | Private | `{owner_id}/{filename}` |

---

## 21. SEO & Meta Tags

### Per-Page Meta (`src/hooks/usePageMeta.ts`)

Lightweight hook that sets `document.title` and meta description on mount, resets on unmount. Used by all public pages + tool pages.

```typescript
usePageMeta('Page Title', 'Meta description for search engines.');
```

### Static SEO Assets

| File | Purpose |
|------|---------|
| `public/sitemap.xml` | 10 public routes, calculator at priority 0.9 |
| `public/robots.txt` | Sitemap ref + disallow rules for admin/private routes |
| `index.html` | OG image, twitter card, canonical URL, Organization JSON-LD |

### Structured Data

- **Organization** (`index.html`) — JSON-LD with name, logo, social links
- **FAQPage** (`FAQ.tsx`) — JSON-LD for all 22 Q&A pairs, injected via useEffect
- **HowTo** (tool pages) — JSON-LD for calculator and tool step-by-step guides
- **ItemList** (`RavTools.tsx`) — JSON-LD listing all 5 RAV Smart Suite tools

### OG Image

Uses `/android-chrome-512x512.png` (absolute URL with domain). The `.svg` logo exists but OG requires a raster image.

---

## 22. Voice Admin & Observability

### Admin Voice Tab (`/admin` → Voice tab)

5 management sections for the RAV team:

| Component | Purpose |
|-----------|---------|
| `VoiceConfigInfo` | Current VAPI config display |
| `VoiceTierQuotaManager` | Edit daily voice quotas per membership tier |
| `VoiceUserOverrideManager` | Per-user disable/custom quota overrides |
| `VoiceUsageDashboard` | Recharts usage charts + top users table |
| `VoiceObservability` | Search log viewer + alert threshold config |

### Quota Resolution Chain

`get_user_voice_quota()` RPC resolves in order:
1. RAV team → unlimited
2. `voice_user_overrides` → custom quota (or disabled if `is_disabled = true`)
3. `membership_tiers.voice_quota_daily` → tier-based (Free 5, Plus/Pro 25, Premium/Business -1=unlimited)
4. Default → 5/day

### Tables (Migration 021)

- `voice_search_logs` — per-search log (user, query, results, latency)
- `voice_user_overrides` — per-user voice controls

---

## Quick Start for New Developers

1. Read `docs/SETUP.md` for local environment setup
2. Read `docs/DEPLOYMENT.md` for deployment & CRON configuration
3. Start with `src/App.tsx` to understand routing
4. Review `src/types/database.ts` for the complete data model
5. Check `src/contexts/AuthContext.tsx` for auth patterns
6. Look at `src/hooks/useBidding.ts` for data fetching patterns
7. Reference this document for architecture decisions and flow understanding

**Questions?** Reach out to the team at support@rent-a-vacation.com | 1-800-RAV-0800
