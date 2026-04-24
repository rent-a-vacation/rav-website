---
last_updated: "2026-04-24T22:04:34"
change_ref: "6397d67"
change_type: "session-59"
status: "active"
---

# Platform Inventory

> **A one-page mental model of everything RAV has built — product features, infrastructure, dev tooling, and governance layers.**
>
> Read this when you need to understand *what exists* before deciding what to build next, explaining the platform to someone new, or verifying that a governance rule is actually in place rather than aspirational.

---

## How to use this file

- **For an investor / external pitch:** read §1 Product. Skip the rest.
- **For a new engineer joining the repo:** read top-to-bottom. §2 and §3 are the least-documented elsewhere.
- **Before a launch gate / major decision:** read §4 Governance to verify the guardrails you think are in place actually are.
- **Before building something new:** search this file for the capability. If it's here, extend it. If it isn't, check [PROJECT-HUB.md](PROJECT-HUB.md) Key Decisions Log before designing.

**This is not:** a replacement for PROJECT-HUB (architectural decisions), BRAND-LOCK (terminology), LAUNCH-READINESS (gates), or TESTING-STATUS (test inventory). It's the *index* across all of them.

---

## §1 — Product (what end users see and do)

### Marketplace core — DEC-031 locked vocabulary: **Listing**, **Wish**, **Offer**

| Feature | What it is | Key routes / files | When to touch |
|---|---|---|---|
| **Listing** (Pre-Booked Stay) | Owner posts a resort reservation they already hold. Fixed dates. Instant-book. | `/list-property` · `listings.source_type='pre_booked'` · `supabase/functions/verify-booking-payment` | Owner UX changes, proof flow changes |
| **Listing** (Wish-Matched Stay, auto-created) | Spawned by an accepted Offer on a Wish. Owner confirms resort reservation after acceptance. | `listings.source_type='wish_matched'` · `booking_confirmations` table | Wish acceptance flow, owner confirmation UX |
| **Wish** | Traveler posts desired destination / dates / budget. Owners respond with Offers. | `/marketplace` (Wishes tab) · `travel_requests` table · `match-travel-requests` edge fn | Wish form, matching logic |
| **Offer** | Proposed transaction at a price. Works both directions. | `listing_bids` (renter→Listing) · `travel_proposals` (owner→Wish) · `BidFormDialog`, `ProposalFormDialog` | Offer form, acceptance flow |
| **Pre-Booked proof workflow** | Owner uploads reservation confirmation at list time; admin verifies before listing goes active. | Migration 064 · `ListProperty` Step 2 · `AdminListings` Proof column · `ProofVerifyDialog`, `ReuploadProofDialog` · `listing-proofs` storage bucket | Anti-scam/trust work |
| **Cancel-listing cascade** | Owner cancels → bids bulk-rejected + bookings refunded + notifications. | `supabase/functions/cancel-listing` · Migration 065 · `CancelListingDialog` | Owner cancellation UX |
| **Marketplace flow distinction (DEC-034)** | Pre-Booked vs Wish-Matched type badges + per-flow behavior. | `ListingTypeBadge` · `MyBookings`, `PropertyDetail`, `OwnerListings`, `AdminEscrow` | Any surface that touches listings |

### Booking lifecycle

| Feature | What it is | Key routes / files | When to touch |
|---|---|---|---|
| **Checkout** | Stripe-backed payment collection | `/checkout` · `create-booking-checkout` edge fn · Stripe Tax env-gated via `STRIPE_TAX_ENABLED` | Payment flow, tax, fees |
| **Booking confirmation** | Post-payment success page; owner-confirmation flow for Wish-Matched | `/booking-success` · `verify-booking-payment` edge fn · `booking_confirmations` table · `OwnerConfirmationTimer` | Post-booking UX, escrow |
| **Escrow** | Funds held until check-in + owner confirmation released | `booking_confirmations.escrow_status` enum · `process-escrow-release` edge fn · `AdminEscrow` | Escrow rules, admin tools |
| **Cancellation policies** | Flexible / Moderate / Strict / Super Strict | `src/lib/cancellationPolicy.ts` · `CancellationPolicyDetail` · `process-cancellation` edge fn · `cancellation_requests` table · Migration 005 | Policy calculation, cancel UX |
| **Disputes** | Traveler or owner reports an issue; admin resolves with refund option | `ReportIssueDialog` · `AdminDisputes` (sources: user_filed vs ravio_support) · `disputes`, `dispute_messages` tables · `process-dispute-refund` edge fn | Dispute categories, admin tools |

### Dashboards

| Feature | What it is | Key routes / files | When to touch |
|---|---|---|---|
| **My Trips** (Traveler) | Overview + Bookings + Offers + Favorites + Action Needed | `/my-trips` · `RenterDashboard` · `ActionNeededSection` + `useTravelerPriorityActions` | Traveler UX |
| **My Rentals** (Owner) | Consolidated 4-tab dashboard (4 tabs replacing 11, per Session 33) | `/owner-dashboard` · `OwnerDashboard` · `OwnerHeadlineStats`, `EarningsTimeline`, `PricingIntelligence`, `MaintenanceFeeTracker` | Owner UX |
| **RAV Ops** (Admin/Staff) | 18+ tabs for platform operations | `/admin` · `AdminDashboard` · `AdminOverview` (with ActionNeededSection) · tabs for listings / bookings / escrow / disputes / users / financials / etc. | Admin ops |
| **RAV Insights** (Executive) | Business intelligence — MRR, funnel, BYOK AI analysis | `/executive-dashboard` · `ExecutiveDashboard` · `executive_dashboard_settings` table | Executive analytics |

### Discovery

| Feature | What it is | Key routes / files | When to touch |
|---|---|---|---|
| **Rentals search** | Browse active Pre-Booked listings (Wish-Matched filtered out per DEC-034) | `/rentals` · `ListingCard` · `useActiveListings` · Fair Value Score | Search UX, filters |
| **RAV Deals** | Discounted inventory surface | `/rav-deals` · `RavDeals` page | Deal curation |
| **Destinations** | Curated destination landing pages + SEO | `/destinations`, `/destinations/:slug`, `/destinations/:slug/:city` · `destinations.ts` (10 destinations, 35 cities) | Destination content |
| **Resort Directory (ResortIQ)** | 117 resorts, 351 unit types, 9 brands | `resorts` + `resort_unit_types` tables · `ResortSelector`, `UnitTypeSelector`, `ResortPreview` · MDM migrations `20260415_mdm_schema_hardening.sql` | Resort data quality |
| **Events calendar** | Seasonal / curated events (`/rav-deals` integration) | `seasonal_events`, `event_instances` tables · `useCuratedEvents` · Migrations 055 + 056 | Event data, generator RPC |

### Tools suite (/tools)

| Feature | What it is | Route |
|---|---|---|
| **RAV SmartEarn** | Maintenance fee calculator + yield estimator | `/calculator` |
| **RAV SmartPrice** | Pricing intelligence (inline in Owner dashboard) | Owner dashboard |
| **RAV SmartCompare** | Cost comparator | `/tools/cost-comparator` |
| **RAV SmartMatch** | Resort quiz | `/tools/resort-quiz` |
| **RAV SmartBudget** | Budget planner | `/tools/budget-planner` |

### AI / voice

| Feature | What it is | Key routes / files | When to touch |
|---|---|---|---|
| **RAVIO text chat** | 5-context assistant (rentals / property-detail / bidding / support / general) with tool use | `supabase/functions/text-chat` · `useTextChat` · `TextChatPanel` · `RavioFloatingChat` · `intent-classifier.ts` · `support-tools.ts` (5 tools) | RAVIO behavior, system prompts |
| **VAPI voice search** | Deepgram + GPT-4o-mini + ElevenLabs; discovery-only (never extended to support) | `voice-search` edge fn · `useVoiceSearch` · `VoiceAssistant` · `voice_search_logs` · `voice_user_overrides` · Migration 021 | Voice prompts, quota |
| **Voice quotas** | Per-tier: Free 5/day · Plus/Pro 25/day · Premium/Business + RAV team unlimited | `get_user_voice_quota` RPC · `VoiceTierQuotaManager`, `VoiceUserOverrideManager` | Quota rules |
| **RAVIO Support Tools** (Phase 22) | 5 agent tools: lookup_booking, check_refund_status (DB+Stripe), check_dispute_status, open_dispute, query_support_docs | `support-tools.ts` · `support_docs` table (Migration 060) · `support_conversations` + `support_messages` (Migration 062) · `get_support_metrics` RPC (Migration 063) | Support agent capabilities |
| **Admin Support Interactions** | Transcript browser + metrics + thumbs-up/down | `/admin` → Support tab · `AdminSupportInteractions` · `useSupportConversations` hooks | Support analytics |

### Notifications

| Feature | What it is | Key routes / files |
|---|---|---|
| **Notification Center** | User-facing inbox + preferences | `/notifications` · `/settings/notifications` · `NotificationBell` · `useNotifications` |
| **Notification Catalog** | Authoritative list of notification type_keys (26+) | `notification_catalog` table · Migration 046 + accretive adds in 054, 059, 060, 064, 065 |
| **Dispatcher** | Multi-channel routing: in-app / email / SMS | `notification-dispatcher` edge fn · `sms-scheduler` (blocked on A2P 10DLC) · `twilio-webhook` |
| **Delivery log** | Audit trail per dispatch | `notification_delivery_log` table |

### Pre-booking messaging

| Feature | What it is | Key routes / files |
|---|---|---|
| **Listing Inquiries** | Pre-booking traveler questions | `InquiryDialog` · `InquiryThread` · `listing_inquiries`, `inquiry_messages` tables · Migration 037 |
| **Unified Conversations (Phase 21)** | One inbox across bookings / inquiries / future types | `/messages` · `Messages` page · `conversations`, `conversation_messages` tables · Migration 051 |

### Reviews

| Feature | What it is | Key routes / files |
|---|---|---|
| **Post-stay reviews** | Traveler rates + reviews property + owner | `reviews` table · `BookingReviewPrompt` · `OwnerProfileCard` · Migration 033 |

### Subscriptions (Stripe)

| Feature | What it is | Key routes / files |
|---|---|---|
| **4 product tiers** | Traveler Plus, Traveler Premium, Owner Pro, Owner Business | `membership_tiers`, `subscriptions` tables · `MembershipPlans` · Migration 047 |
| **Checkout** | Stripe Checkout session | `create-subscription-checkout` edge fn |
| **Customer Portal** | Self-service manage | `manage-subscription` edge fn |
| **Webhook (11 events)** | Subscription lifecycle sync | `stripe-webhook` edge fn |
| **Tier-gated features** | Early Access, Exclusive Deals, Priority Placement, Concierge, Account Manager | `tierGating.ts` · 26 unit tests · Migration 057 |

### Onboarding + access

| Feature | What it is | Key routes / files |
|---|---|---|
| **Signup** | Email+password with T&C audit log | `/signup` · `terms_acceptance_log` · Migration 052 |
| **Pending approval** | RAV team approves new accounts | `/pending-approval` · `PendingApprovals` admin component |
| **Post-approval onboarding** | `/welcome` gate with T&C reconfirm | `useOnboarding` hook |
| **Role upgrade** | Renter → property_owner upgrade request | `role_upgrade_requests` table · `RoleUpgradeDialog` |
| **RAV team roles** | rav_admin, rav_staff, rav_owner | `user_roles` table · `isRavTeam()`, `isRavAdmin()` |

### Referrals + engagement

| Feature | What it is | Key routes / files |
|---|---|---|
| **Referral program** | Unique codes + reward tracking | `referral_codes`, `referrals` tables · Migration 043 · `ReferralDashboard` |
| **Saved searches** | Named search queries + price alerts | `saved_searches` table · Migration 038 + 054 · `SavedSearchesList` · `price-drop-checker` edge fn |
| **iCal export** | Owner calendar feed | `src/lib/icalendar.ts` · `useOwnerCalendarExport` · Session 35 |
| **Favorites** | Traveler-saved listings | `favorites` table · `useFavoriteIds` |

### Public API

| Feature | What it is | Key routes / files |
|---|---|---|
| **API Gateway** | 5 read-only + future write endpoints | `api-gateway` edge fn · `api_keys`, `api_request_log` tables · Migrations 044 + 045 |
| **API key management** | Admin creates keys with optional CIDR IP allowlisting | `AdminApiKeys` admin tab |
| **Developer portal** | Public OpenAPI Swagger UI | `/developers` · `public-api.yaml` |

---

## §2 — Platform (infrastructure + integrations)

### Hosting

| Layer | Provider | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploy on push to `main` · Preview deploys on `dev` |
| Backend | Supabase | **DEV:** `oukbxqnlxnkainnligfz` · **PROD:** `xzfllqndrlmhclqfybew` |
| Secrets | Vercel env + Supabase Secrets | Per-env; PROD deploys require human confirmation per CLAUDE.md |

### Database

- **Migrations:** 065 numbered + 3 date-based MDM ones (`supabase/migrations/`). Always additive; never mutate shipped migrations.
- **Key conventions:**
  - All user-id FK columns reference `profiles(id)` directly (not `auth.users(id)`) — PostgREST traversal requirement.
  - RLS enabled on every user-facing table; service-role pattern for edge functions needing to bypass.
  - `is_rav_team(auth.uid())` helper for RAV staff read policies.
  - `updated_at` trigger via shared `update_updated_at_column()` function.
- **Storage buckets:** `property-images` (public), `listing-proofs` (private, 10 MB, PDF/JPEG/PNG), others.

### Edge functions (37 total, service-role pattern)

| Group | Functions |
|---|---|
| **Payments / Stripe** | `create-booking-checkout`, `verify-booking-payment`, `stripe-webhook`, `create-stripe-payout`, `create-connect-account`, `process-cancellation`, `process-dispute-refund`, `process-escrow-release` |
| **Subscription** | `create-subscription-checkout`, `manage-subscription`, `update-subscription` |
| **Email / SMS** | `send-email`, `send-approval-email`, `send-booking-confirmation-reminder`, `send-cancellation-email`, `send-verification-notification`, `send-contact-form`, `twilio-webhook`, `sms-scheduler` (blocked on A2P 10DLC) |
| **AI / chat** | `text-chat` (5 contexts + tool use), `voice-search` |
| **Marketplace** | `match-travel-requests`, `idle-listing-alerts`, `price-drop-checker`, `cancel-listing` |
| **Notifications** | `notification-dispatcher`, `process-deadline-reminders` |
| **Admin / data** | `seed-manager`, `api-gateway`, `ingest-support-docs` |
| **Account** | `delete-user-account`, `export-user-data` |
| **External feeds** | `fetch-airdna-data`, `fetch-str-data`, `fetch-industry-news`, `fetch-macro-indicators` |

**Deploy flags:**
- `--no-verify-jwt` required for `create-booking-checkout` + `verify-booking-payment` (explicit in `supabase/config.toml`).
- Supabase CLI is linked to DEV by default; every PROD deploy requires an explicit relink.

### Stripe

| Capability | State |
|---|---|
| **Sandbox** | Configured (4 subscription products, webhook w/ 11 events, Customer Portal) |
| **Live** | **Blocked on #127** (LLC/EIN required for live account) |
| **Stripe Tax** | Env-gated via `STRIPE_TAX_ENABLED` — default off on both envs until live setup post-#127 |
| **Connect (payouts)** | Express accounts; `create-connect-account` + `create-stripe-payout` edge fns |
| **Idempotency** | Stripe webhook checks for already-confirmed bookings; skips duplicates |

### Email (Resend)

- **Transactional sender:** `Rent-A-Vacation <notifications@updates.rent-a-vacation.com>`
- **Support sender:** `Rent-A-Vacation Support <support@updates.rent-a-vacation.com>`
- **Support inbox:** `support@rent-a-vacation.com` (Cloudflare catch-all)
- **Template convention:** `buildEmailHtml()` + `detailRow()` + `infoBox()` from `supabase/functions/_shared/email-template.ts` — never inline HTML.

### SMS (Twilio)

- Regular account + phone number purchased. Secrets set.
- `SMS_TEST_MODE=true` pre-launch. Flip to live after **#127 LLC/EIN + A2P 10DLC registration**.

### Observability

- **Sentry.io** — org `rent-a-vacation-org`, project `rav-website`. Source maps uploaded, 5% browser tracing, error-only session replay, MCP integration for `claude` queries. **Server-side instrumentation pending (#227, post-launch).**
- **GA4** — Measurement ID `G-G2YCVHNS25`, gated behind cookie consent.
- **Supabase logs** — via dashboard + CLI.
- **Checkly synthetic uptime (DEC-033)** — **planned post-launch** (#370).

### Secrets required per environment

| Service | Secret | Purpose |
|---|---|---|
| Supabase | `SUPABASE_SERVICE_ROLE_KEY` | Edge function service-role writes |
| Stripe | `STRIPE_SECRET_KEY` | Payments + refunds (used by text-chat classifier-reconcile + cancellation + webhook) |
| Stripe | `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| Stripe Tax | `STRIPE_TAX_ENABLED` | Env flag (off pre-launch) |
| Resend | `RESEND_API_KEY` | Email delivery |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | SMS (test mode) |
| OpenRouter | `OPENROUTER_API_KEY` | RAVIO text chat (Gemini 3 Flash) |
| VAPI | `VAPI_API_KEY` | Voice assistant |
| Ingest | `INGEST_SUPPORT_DOCS_SECRET` | `ingest-support-docs` function auth (used by GitHub Action) |
| Sentry | `SENTRY_AUTH_TOKEN` | Source-map upload |

---

## §3 — Development tooling (meta-capabilities)

### Claude Code skills

- **`/sdlc`** (`.claude/skills/sdlc/SKILL.md`) — Full SDLC workflow. `status` → prints current Tier A + recent commits + doc-sync health. Issue number → Phase 1 (context) → Phase 2 (plan mode) → Phase 3 (implement) → Phase 4 (verify) → Phase 5 (deploy) → Phase 6 (13-item doc-update checklist). Used at session start + issue pickup.

### Scripts

| Script | Purpose | When to run |
|---|---|---|
| `npm run docs:audit` | Validate every `docs/**/*.md` has frontmatter, status is set, `last_updated` is within drift tolerance | Local sanity or CI |
| `npm run docs:audit:ci` | Exits 1 on errors (for CI) | Automated |
| `npm run docs:sync-check` | Verifies the 4 docs `/sdlc status` depends on are current vs git | Pre-commit + pre-PR |
| `npm run docs:stamp` | Pre-commit hook auto-stamps `last_updated` + `change_ref` on modified docs | husky auto |
| `npm run docs:migrate` | One-shot migrator to bring legacy docs into the new frontmatter schema | Rare |
| `scripts/create-phase22-issues.sh` | Idempotent issue creator — skips titles already in milestone | When scoping a new epic |
| `scripts/audit-resort-data-quality.ts` | MDM resort data quality scorer (DEC-032) | Before/after data imports |
| `scripts/generate-resort-descriptions.ts` | RAV-branded description generator from structured data | One-off |
| `scripts/normalise-resort-data.ts` | ISO country codes, state abbreviations, 24h times | One-off |
| `scripts/generate-sitemap.ts` | Post-build sitemap | Automated `postbuild` |
| `seed-manager` edge fn | DEV-only test-data generator — foundation users, listings, bookings, memberships | Every DEV reset |

### CI workflows (`.github/workflows/`)

| Workflow | What it does |
|---|---|
| **CI** | Lint + Type Check + Unit & Integration Tests + E2E (Playwright) + Lighthouse + Percy (visual) |
| **Documentation Audit** | Runs `docs:audit:ci` + `docs:sync-check` — fails PR on drift |
| **sync-support-docs** | On push to main touching `docs/support/**`, POSTs to `ingest-support-docs` edge fn |

### Pre-commit hooks (husky + lint-staged)

- `eslint --fix` on staged `*.{ts,tsx}`
- `vitest related --run` on affected test files
- Frontmatter auto-stamp on staged `docs/**/*.md` (via `docs:stamp`)

### Testing infrastructure

| Tool | Use |
|---|---|
| **Vitest** | Unit + integration — 1311+ tests across 141 files |
| **Playwright** | E2E smoke (`e2e/smoke/`) |
| **Percy** | Visual regression (`e2e/visual/`) — currently disabled pre-launch (private-repo limitation) |
| **@p0 tag** | P0 critical-path subset — `npm run test:p0` runs in ~2s |
| **Coverage thresholds** (enforced in CI) | Statements 25%, Branches 25%, Functions 30%, Lines 25% |

### Memory system (`~/.claude-max/projects/.../memory/`)

- **MEMORY.md** — index, ≤200 lines, one-line per entry.
- **Per-topic files** — `feedback_*.md` (rules / preferences), `project_*.md` / `session*.md` (transient state), `reference_*.md` (external systems), `stripe_products.md` (config), etc.
- **Auto-memory conventions** — see `CLAUDE.md` system-prompt block.

### Key memory entries (as of Session 59)

| Memory | What it reminds future sessions |
|---|---|
| `feedback_cs_ux_differentiator.md` | Pick robust over cheap for CS / UX flows |
| `feedback_avoid_churning_locked_terminology.md` | Mid-session rename ideas get deferred |
| `feedback_guiding_help_text_everywhere.md` | Every new control gets muted help text |
| `feedback_incremental_shipping.md` | Break foundational changes into small PRs |
| `feedback_simplicity_principle.md` | Rooted-in-simplicity UX north star |
| `feedback_explicit_decision_points.md` | Present A/B/C options + recommendation before scope creep |
| `phase22_customer_support_architecture.md` | DEC-036 architecture — extend text chat, don't CrewAI |
| `session56_dec034_flow_distinction.md` | Pre-Booked vs Wish-Matched flow model |
| `brand_rebrand_session47.md` | Brand vocabulary history |
| `stripe_products.md` | Sandbox product + price IDs |

---

## §4 — Governance & guardrails (rules, not code)

### CLAUDE.md — project (`./CLAUDE.md`)

Mandatory conventions for every session:

- **Session start:** read PRIORITY-ROADMAP + open issues + PROJECT-HUB decisions.
- **Session end:** 13-item doc-update checklist (PROJECT-HUB, PRIORITY-ROADMAP, TESTING-STATUS, LAUNCH-READINESS, ARCHITECTURE + flow manifests, USER-GUIDE + FAQ, QA-PLAYBOOK, BRAND-LOCK, COMPLETED-PHASES, memory).
- **Automated safety net:** `npm run docs:sync-check` + CI gate.
- **Git strategy:** `dev` → PR → `main`. Never push directly to main.
- **Tests-With-Features policy:** every new function in `src/lib`, every new hook, every financial calculation gets tests before merge.
- **Flow manifest rule:** any new route → update `src/flows/*-lifecycle.ts` → `/architecture` page auto-regenerates.
- **Email template rule:** always `buildEmailHtml()` — never inline HTML.
- **Seed manager rule:** every new table → seed manager extended before PR.
- **Admin safeguards:** destructive / financial / role-change / tier-override actions require AlertDialog confirmation — never bare `window.confirm`.
- **Content accuracy:** 15% commission · 117 resorts · tier-based voice quotas · v0.9.0.

### CLAUDE.md — root (`/Repos/CLAUDE.md`)

Workflow orchestration across all Claude Code projects:

- Plan mode default for non-trivial work
- Subagent liberal use for context window protection
- `tasks/lessons.md` after corrections
- Verification before marking done
- Demand elegance (balanced — skip for trivial fixes)
- Autonomous bug fixing

### BRAND-LOCK.md (`docs/brand-assets/BRAND-LOCK.md`)

- **Locked marketplace nouns:** Listing · Wish · Offer (DEC-031)
- **Flow types:** Pre-Booked Stay · Wish-Matched Stay (DEC-034)
- **Locked nav labels:** Marketplace · Browse Rentals · My Trips · My Rentals · RAV Ops · RAV Insights (DEC-031 + DEC-035 Path 3)
- **CTA rules:** transactional CTAs use plain language (Make an Offer, Post a Wish, List Your Property). Platform-branded surfaces keep RAV prefix (RAV Deals, RAV SmartX, RAVIO).
- **Don't-say lists:** "proprietary database", "verified resort data" (use "curated from official sources"), AI language that implies more than structured lookup.

### Key Decisions Log (PROJECT-HUB.md)

36+ entries (DEC-004 through DEC-036). Highlights:
- **DEC-011** Capacitor (not React Native) for mobile
- **DEC-020** Text Chat Agent — superseded for support by DEC-036
- **DEC-022** Puzzle.io as accounting ledger (blocked on #127)
- **DEC-024** Public API architecture
- **DEC-031** Marketplace terminology lock
- **DEC-033** Checkly SaaS for monitoring
- **DEC-034** Pre-Booked vs Wish-Matched flow distinction
- **DEC-035** Path 3 hybrid dashboard naming
- **DEC-036** RAVIO support architecture (extend text-chat, not CrewAI)

### Tiered roadmap (PRIORITY-ROADMAP.md)

- **Tier A** — build next (code-ready, high impact)
- **Tier B** — pre-launch important (needs human input)
- **Tier C** — tier feature differentiation (complete as of Session 53)
- **Tier D** — marketing + social (non-code)
- **Tier E** — post-launch / deferred

### Blocked chain (`#127` LLC/EIN)

```
#127 LLC/EIN formation ─┬─→ #63 Accounting (Puzzle.io)
                        ├─→ #65 Automated Tax Filing
                        ├─→ Stripe Tax live activation
                        ├─→ Bank account
                        ├─→ A2P 10DLC registration (unblocks SMS)
                        └─→ #80 Legal — Terms of Service
```

These unblock together when the LLC is formed. Not code-dependent.

### Pre-launch launch-readiness (LAUNCH-READINESS.md)

- Auth-flow, booking-flow, payment-flow, escrow-release, dispute-refund, cancellation, tax, subscription, monitoring, legal, marketing gates
- Manual-walkthrough items (`#187`)
- `STRIPE_TAX_ENABLED` flip criteria post-#127

---

## Cross-references

| Want to know... | Go to |
|---|---|
| Why we chose X architecture | [PROJECT-HUB.md — Key Decisions Log](PROJECT-HUB.md) |
| What user-facing text is locked | [BRAND-LOCK.md](brand-assets/BRAND-LOCK.md) |
| What's gated before public launch | [LAUNCH-READINESS.md](LAUNCH-READINESS.md) |
| Current test count + coverage | [testing/TESTING-STATUS.md](testing/TESTING-STATUS.md) |
| What to work on next | [PRIORITY-ROADMAP.md](PRIORITY-ROADMAP.md) |
| How RAV is architected (diagrams + flows) | [ARCHITECTURE.md](ARCHITECTURE.md) + `src/flows/*.ts` → `/architecture` page |
| Owner / traveler / admin workflows | [UserGuide.tsx](../src/pages/UserGuide.tsx) · [FAQ.tsx](../src/pages/FAQ.tsx) |
| Support agent + 20 support docs | [docs/support/](support/) · [CS-OVERVIEW.md](support/CS-OVERVIEW.md) |
| Previous sessions' technical history | [COMPLETED-PHASES.md](COMPLETED-PHASES.md) |
