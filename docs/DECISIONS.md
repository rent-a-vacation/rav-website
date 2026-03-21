---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Archived Decisions Log

> Finalized decisions moved from [PROJECT-HUB.md](PROJECT-HUB.md) to keep the hub concise.
> **Last Archived:** March 13, 2026

---

## DEC-001: Hybrid Agent Sessions for Phase 2
**Date:** February 11, 2026
**Decision:** Use 3 coordinated sessions (Database Engineer → Backend → Frontend)
**Reasoning:** Complex features need specialized expertise per layer
**Result:** Validated - worked perfectly (2.5 hours exactly)
**Status:** Final

---

## DEC-002: Voice Search Access Control
**Date:** February 13, 2026
**Decision:** Option B — Logged-in users only
**Status:** Implemented (Phase 1 deployed Feb 14)

**Options Considered:**
- A: Voice for everyone (high cost risk: $30K/month)
- B: Logged-in users only — **CHOSEN**
- C: Paid users only (limits growth)
- D: Freemium (5/day free, unlimited paid)

**Reasoning:**
- Preserves competitive advantage
- Manageable costs (~$0.10/search)
- Builds user base without payment friction
- Usage quotas deferred to Phase 3

**Trade-offs:**
- Slightly higher friction (must sign up)
- But necessary for cost control

---

## DEC-003: Voice Usage Quota Design
**Date:** February 15, 2026 (Updated Feb 14, 2026 — Phase 9)
**Decision:** Tier-based quotas: Free=5/day, Plus/Pro=25/day, Premium/Business/RAV=unlimited
**Status:** Implemented (Phase 3, upgraded in Phase 9)

**Design Choices:**
- Counter increments only after successful search (not on VAPI call start)
- RAV team returns -1 from `get_user_voice_quota` (unlimited)
- Quota resets at midnight UTC
- Old usage records cleaned up after 90 days
- **Phase 9 upgrade:** Quotas now driven by `membership_tiers.voice_quota_daily` instead of hardcoded 10
- Auto-assigned free tier on signup via `handle_new_user()` trigger

**Reasoning:**
- Tier-based quotas incentivize upgrades
- Free tier (5/day) balances access with cost control
- Paid tiers (25/unlimited) reward commitment

**Trade-offs:**
- No carryover of unused searches
- Billing/subscription not yet implemented (tier assignment is manual for paid tiers)

---

## DEC-005: Placeholder Content Removal
**Date:** February 13, 2026
**Decision:** Replace with realistic content from actual data
**Status:** Approved

**Approach:**
- Use real database counts (resorts, properties, etc.)
- Remove inflated fake numbers (50K+ owners, 100% direct booking)
- Honesty builds trust > fake social proof

---

## DEC-006: Testing Infrastructure Approach
**Date:** February 13, 2026
**Decision:** Option B - Comprehensive foundation (60%+ coverage, 2-3 weeks)
**Status:** Implemented (Phase 8)

**Options:**
- A: Minimal safety net (20% tests, 1 week)
- B: Comprehensive foundation (60%+ coverage, 2-3 weeks) — **CHOSEN**

**Reasoning:**
- Development already underway - need to catch up AND keep up
- Confidence > speed (prevent production breaks)
- AI agents can accelerate test writing
- Investment now saves debugging time later

**Tools:** Vitest (unit + integration), Playwright (E2E), Percy.io (visual regression), GitHub Actions (CI/CD)

---

## DEC-007: Build Version System
**Date:** February 13, 2026
**Decision:** Inject git metadata at build time via Vite `define`, display in footer
**Status:** Implemented

**Format:** `v{semver}.{commitCount} · {shortSHA}`
- Semver from `package.json` (bump manually for milestones)
- Commit count auto-increments with each commit
- Short SHA for instant deploy verification
- Vercel needs `VERCEL_GIT_FETCH_DEPTH=0` env var for full clone

---

## DEC-008: Membership Tier & Commission Architecture
**Date:** February 14, 2026
**Decision:** 6-tier system (3 traveler + 3 owner) with configurable commission and DB-controlled voice toggles
**Status:** Implemented (Phase 9)

**Design Choices:**
- `membership_tiers` as reference table (not hardcoded) — admin can add/modify tiers
- One active membership per user (`user_memberships.user_id` UNIQUE)
- Commission: per-owner agreement override > platform base rate - tier discount
- Voice toggles: master kill switch + per-feature toggles in `system_settings`
- Free tier auto-assigned on signup via trigger
- Billing deferred — tier assignment is manual for paid tiers until Stripe Subscriptions integrated

**Tier Structure:**
| Tier | Voice/day | Commission Discount | Listing Limit |
|------|-----------|--------------------|----|
| Traveler Free | 5 | - | - |
| Traveler Plus ($5/mo) | 25 | - | - |
| Traveler Premium ($15/mo) | unlimited | - | - |
| Owner Free | 5 | 0% | 3 |
| Owner Pro ($10/mo) | 25 | 2% | 10 |
| Owner Business ($25/mo) | unlimited | 5% | unlimited |

**Reasoning:**
- Infrastructure-first approach: build data model before billing
- Configurable commission allows A/B testing and per-owner deals
- DB-controlled toggles eliminate deploy cycles for feature flags

---

## DEC-010: Voice Platform — VAPI vs LiveKit
**Date:** February 15, 2026
**Decision:** Stay on VAPI (see DEC-012)
**Status:** Resolved → DEC-012

**Original Options:**
- A: Stay with VAPI — proven, working, managed, but limited
- B: Migrate fully to LiveKit — more control, lower cost at scale
- C: Hybrid — keep VAPI for search, use LiveKit for new features
- D: LiveKit for everything new — build future voice on LiveKit, sunset VAPI when ready

**Resolution:** DEC-012 decided to stay on VAPI. LiveKit migration not justified at current scale.

---

## DEC-012: Voice Infrastructure — Stay on VAPI
**Date:** February 20, 2026
**Decision:** Remain on VAPI for voice search. Do not migrate to LiveKit.
**Status:** Approved

**Options evaluated:**
- VAPI (current) — managed, turnkey, ~$0.10/search
- LiveKit open source — self-hosted pipeline, ~$0.01/search at scale

**Rationale:**
- Current beta cost is ~$300-700/month with auth gates + 10/day quota in place
- LiveKit migration = 3-6 weeks engineering to solve a sub-$1K/month problem
- Break-even requires 5,000+ searches/month — not at that scale yet
- Acquisition thesis favors best-in-class managed services over self-hosted optimization
- Revisit when monthly voice spend consistently exceeds $3,000/month

**Owner:** Sujit

---

## DEC-014: Separate Route for Executive Dashboard
**Date:** February 20, 2026
**Decision:** `/executive-dashboard` as standalone page, not a tab in admin dashboard
**Status:** Final

**Reasoning:** Different design language, different audience, different purpose. Admin = utilitarian ops tool. Executive = boardroom strategy view. Mixing them dilutes both.

---

## DEC-015: Demo Mode / Connected Pattern for BYOK
**Date:** February 20, 2026
**Decision:** Default to "Demo Mode" with sample data, toggle to "Connected" with user-supplied API key
**Status:** Final

**Reasoning:** Honest to VCs (not faking data), shows product capability, real feature for future enterprise customers, avoids paying $200-500/mo for APIs before product-market fit.

---

## DEC-016: NewsAPI for Industry Feed
**Date:** February 20, 2026
**Decision:** Use NewsAPI free tier (100 req/day) via Edge Function with 60-min cache
**Status:** Final

**Reasoning:** Free, reliable, sufficient volume for demo + early production use. Cache in Edge Function memory to stay within limits.

---

## DEC-017: Dark Theme Approach
**Date:** February 20, 2026
**Decision:** Build dark-first (not using Tailwind dark: variants), wrap page root in bg-slate-900
**Status:** Final

**Reasoning:** Cleaner implementation, avoids fighting with app's light theme, more reliable visual consistency for demo.

---

## DEC-018: Pre-Launch Platform Lock Strategy
**Date:** February 20, 2026
**Decision:** System-settings-based "Staff Only Mode" toggle (not per-user blocking)
**Status:** Final

**Context:** Need to prevent external users from creating test data on PROD before launch, while still deploying all code to PROD.

**Reasoning:** A global toggle in `system_settings` is simpler than per-user blocking. Leverages existing `can_access_platform()` RLS function. Toggle is in Admin > System Settings — flip it off when ready to go live. Default: enabled (locked). Enforced at 3 layers: database RLS, Login.tsx, Signup.tsx.

---

## DEC-019: Seed Data Management Approach
**Date:** February 21, 2026
**Decision:** 3-layer edge-function-based seed system with foundation user protection
**Status:** Final

**Context:** DEV environment needs realistic test data for functional testing and executive demos. PROD is locked via Staff Only Mode.

**Reasoning:** Edge function approach (vs raw SQL) allows: (1) idempotent auth.admin.createUser for proper trigger-based user setup, (2) production guard via env variable, (3) admin UI integration for one-click reset, (4) protected set pattern to never wipe RAV team or foundation accounts. Foundation users survive reseeds; everything else is disposable.

---

## DEC-020: Text Chat Agent — Two-Tier Conversational Model
**Date:** February 21, 2026
**Decision:** Add OpenRouter-powered text chat alongside existing VAPI voice, as completely separate systems
**Status:** Final

**Context:** Voice search (VAPI) is expensive, tier-gated, and not always practical. Users need a conversational alternative that's universally available.

**Reasoning:** (1) OpenRouter is 10-100x cheaper than VAPI per interaction — no quota needed. (2) Text chat works in all environments (noisy, mobile, accessibility). (3) Shared `_shared/property-search.ts` module avoids code duplication while keeping systems independent. (4) VAPI remains untouched — zero regression risk. (5) Context-based system prompts (rentals/property-detail/bidding/general) provide relevant help across pages. (6) SSE streaming gives natural token-by-token display. (7) Session-only persistence avoids migration — can add localStorage/DB persistence later.

---

## DEC-021: Search Bar & Filter Strategy
**Date:** February 21, 2026
**Decision:** Make Rentals page search bar, calendar picker, and filter panel fully functional with state management and query integration
**Status:** Approved

**Context:** Comprehensive audit revealed the Rentals page search bar is mostly placeholder UI. Calendar picker is a static `<Input>`, Search button has no handler, and filter panel inputs (price/guests/bedrooms/brand) have no state bindings. Only the location text input works.

**Approach:** Wire all controls to React state, integrate with listing query filters. Calendar uses existing shadcn/ui `Calendar` component + `Popover`. Dates filter listings at application level (matching `_shared/property-search.ts` approach). PropertyDetail/Checkout dates remain read-only (timeshare model = owner sets fixed availability windows).

---

## DEC-022: Pricing, Tax & Accounting Framework
**Date:** February 21, 2026
**Date Updated:** February 28, 2026
**Decision:** Per-night pricing + separated fee line items + Stripe Tax before launch + Puzzle.io post-launch (pluggable)
**Status:** Approved (Updated — Puzzle.io replaces QuickBooks)
**Docs:** `docs/RAV-PRICING-TAXES-ACCOUNTING.md`

**Context:** Platform uses per-night pricing with itemized fee breakdown. As a marketplace facilitator in 43+ US states, RAV must collect and remit occupancy/sales taxes before going live. Accounting tool re-evaluated Feb 28 — Puzzle.io selected over QuickBooks for native Stripe integration, free tier, and automated revenue recognition (ASC 606).

**Key decisions:**
- Per-night rate (`nightly_rate`) is the atomic pricing unit across the platform
- Fee breakdown: separate `service_fee`, `cleaning_fee`, `tax_amount` line items on every booking
- Stripe Tax for automated tax calculation at checkout (code ready, pending #127)
- **Puzzle.io** as general ledger (replaces QuickBooks) — native Stripe sync, free <$20K/mo, automated revenue recognition
- **Pluggable accounting architecture** — provider-agnostic adapter pattern; can swap to QuickBooks/Xero/Zoho via config
- 1099-K handled natively by **Stripe Connect** ($2.99/form) — no Gusto needed
- Resort fees are owner-disclosed, not RAV-collected (paid at resort check-in)
- Stripe processing fees (~2.9%) absorbed by RAV, baked into 15% service fee margin

---

## DEC-023: Flexible Date Booking Strategy
**Date:** February 21, 2026
**Decision:** Three-phase approach — Option A (bid with dates) → Option B (inspired-by request) → Option C (partial-week splits)
**Status:** Approved

**Context:** Current model requires travelers to book the full date block set by the owner. This limits conversion when a traveler wants 6 of an 8-day listing.

**Approach:** Start with lightweight "Propose Different Dates" button (reuses existing bidding infrastructure, adds date fields to bids). Follow up with "Inspired By" travel requests (pre-filled from a listing, targeted to that owner). Defer full partial-week splitting until demand validates the pattern.

---

## DEC-024: Public API Architecture
**Date:** March 10, 2026
**Decision:** Single API gateway edge function with API key authentication and tiered rate limiting
**Status:** Approved

**Context:** RAV needs a public REST API for the upcoming mobile app (Capacitor), partner integrations (travel agents, aggregators), and developer experience.

**Approach:**
- Single `api-gateway` edge function handling all `/v1/*` routes (deployed with `--no-verify-jwt`)
- Dual auth: API Key (`X-API-Key` header) for partners, JWT (`Authorization: Bearer`) for own apps
- API keys: `rav_pk_<32 hex>` format, SHA-256 hashed at rest, shown once at creation
- Three rate limit tiers: free (100/day), partner (10K/day), premium (100K/day)
- Read-only endpoints only: listings, search, destinations, resorts (no write ops in v1)
- URL-based versioning (`/v1/`), 6-month deprecation notice for breaking changes
- Standard JSON envelope: `{ data, meta: { page, per_page, total_count }, api_version: "v1" }`

**Deferred enhancements (tracked in GitHub Issues):**
- #188 — Write endpoints (bookings, bids, travel requests via API)
- #189 — OAuth2 authentication for partner integrations
- #190 — Webhook delivery to partners (event notifications)
- #191 — Chat endpoint (`/v1/chat`) via gateway
- #192 — SDK packages for partners (npm, Python)

---

## DEC-025: RAV Tools Hub & Brand Naming
**Date:** March 10, 2026
**Decision:** Create `/tools` hub page for all free tools; rename "Fee Freedom Calculator" to "RAV SmartEarn" (merged with Rental Yield Estimator)
**Status:** Approved

**Context:** Brand names were surfaced across the UI (Phase 1). A central hub page groups all free tools for SEO and discoverability.

**Approach:**
- `/tools` route renders `RavTools.tsx` — card grid with 5 built tools
- "Fee Freedom Calculator" renamed to "RAV SmartEarn" in Header, Footer, and brand docs; Rental Yield Estimator merged into RAV SmartEarn
- "Vacation Cost Comparator" renamed to "RAV SmartCompare"
- "Resort Finder Quiz" renamed to "RAV SmartMatch"
- "Trip Budget Planner" renamed to "RAV SmartBudget"
- JSON-LD `ItemList` schema on `/tools`, `HowTo` on `/calculator`, `Organization` on `/`
- `usePageMeta()` added to 7 pages missing it (Index, Rentals, PropertyDetail, BiddingMarketplace, Checkout, ExecutiveDashboard, OwnerDashboard)