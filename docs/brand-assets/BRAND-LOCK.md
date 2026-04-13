---
last_updated: "2026-04-13T03:22:39"
change_ref: "4d55707"
change_type: "session-47-brand-rebrand"
status: "active"
---
# BRAND LOCK — Rent-A-Vacation

> **Purpose:** This is the single source of truth for all brand messaging, claims, and feature positioning. Every other document (brand docs, social media, pitch decks, source code, email templates) MUST align with this file.
>
> **Rule:** If this document and another document disagree, this document wins. Update the other document.
>
> **Last reviewed:** April 12, 2026 (Session 47 — Brand Architecture Rebrand)

---

## 1. MESSAGING HIERARCHY

Features are presented in this order across all materials. Lead with marketplace mechanics — the bidding system is the product. AI is a supporting differentiator.

| Tier | Feature | Role | Lead With |
|------|---------|------|-----------|
| **Primary** | **Name Your Price** (bidding) | Core product — travelers set terms | Always first in any feature list |
| **Primary** | **RAV Wishes** (reverse auction) | Core product — owners compete | Always second |
| **Primary** | **RAV Deals** (distressed inventory) | Discovery — motivated sellers, urgent deals | Third in discovery contexts |
| **Supporting** | **TrustShield + PaySafe** (trust) | Removes risk, enables transactions | After marketplace features — builds confidence |
| **Supporting** | **Ask RAVIO / Chat with RAVIO** (AI) | Discovery tool — voice and text search | Supporting — nice-to-have, not the headline |
| **Supporting** | **RAV Smart Suite** (5 tools) | Owner acquisition + lead generation | Supporting — owner onboarding |
| **Supporting** | **My Rentals** (owner dashboard) | Owner tools — earnings, listings, bookings | Nav: "My Rentals" (mirrors "My Trips") |
| **Infrastructure** | **RAV Insights** (executive dashboard) | Business intelligence for leadership | Formerly "RAV Command" |
| **Infrastructure** | **RAV Ops** (admin operations) | User/listing/verification management | Formerly "Admin Dashboard" |
| **Infrastructure** | **ResortIQ** (resort directory) | Data layer — auto-fill, consistency | Mention when relevant, don't feature-lead |

### Hierarchy rules

- In any bio, headline, or opening sentence: **Name Your Price** or **RAV Wishes** appears first
- RAVIO is mentioned as a feature, not as the brand identity or primary differentiator
- Campaign launches lead with marketplace mechanics; AI campaigns are secondary/later
- The master tagline "Name Your Price. Book Your Paradise." correctly reflects this hierarchy — keep it
- All RAV-prefixed features (RAV Wishes, RAV Deals, RAV Edge, RAV Command, RAV Smart[X]) form a cohesive product family

---

## 2. APPROVED SAVINGS CLAIM

### The claim

**"Save 20-40% compared to resort-direct booking"** [INDUSTRY DATA]

### Approved phrasing

| Form | Text | Use In |
|------|------|--------|
| **Short (bios)** | "Save 20-40% vs booking direct" | Social media bios, ad headlines |
| **Medium** | "Save 20-40% compared to resort-direct rates" | Landing pages, email subject lines |
| **Long** | "Rent directly from verified timeshare owners and save 20-40% compared to booking through the resort. Owners set their own prices — often well below what resorts charge for the same rooms." | Feature pages, FAQ, How It Works |

### Methodology

- **Source:** ARDA industry data shows resort-direct bookings carry a 20-40% markup over owner cost
- **Mechanism:** RAV connects travelers directly with owners who price below resort rates. RAV adds a 15% platform fee (configurable: Pro -2%, Business -5%). The net savings for travelers comes from eliminating the resort markup
- **Label:** [INDUSTRY DATA] — based on published resort markup benchmarks (ARDA, industry pricing analysis)
- **Validation plan:** Once real bookings occur, compare actual RAV transaction prices against published resort rates for the same properties to verify the range

### Retired claims — DO NOT USE

| Retired Claim | Why |
|---------------|-----|
| "Up to 70% off" | Not supported by pricing code or realistic market scenarios |
| "50-70% savings" | Same — the math yields 20-40% in typical scenarios |
| "Save up to 70%" | Same |
| "$1,100 vs $3,200" example | Below our own calculator's income estimates; misleading |
| "On average, our renters save 50-70%" | No data to support "on average" — we are pre-launch |

---

## 3. APPROVED TAGLINES

Ranked by priority. Use the highest-applicable tagline for the context.

| Rank | Tagline | Context |
|------|---------|---------|
| **1** | **Name Your Price. Book Your Paradise.** | Master — use everywhere, default choice |
| **2** | **Luxury Resorts. Owner Prices.** | Traveler acquisition — ads, landing pages |
| **3** | **Your Timeshare. Your Income. Your Terms.** | Owner acquisition — ads, email |
| **4** | **Make a RAV Wish. Owners Make It Happen.** | RAV Wishes feature — specific campaigns |
| **5** | **Just Say Where. RAVIO Does the Rest.** | AI/voice campaigns — secondary, not lead |

### Secondary taglines (approved for specific contexts)

| Tagline | Context |
|---------|---------|
| Stop Paying. Start Earning. | Owner pain point / SmartEarn calculator |
| The Vacation You Want, at the Price You Choose. | Bidding feature highlight |
| Verified Owners. Protected Payments. Guaranteed Stays. | Trust campaign |
| Direct from Owners. No Middlemen. No Markups. | Value proposition |
| 117 Resorts. One Platform. Your Price. | Scale + bidding |
| Where Owners Earn and Travelers Save. | Two-sided value |

### Primary hashtag

| Hashtag | Usage |
|---------|-------|
| **#NameYourPrice** | Primary — marketplace moments, bidding highlights |
| #RAVWishes | Reverse auction stories, owner proposals |
| #RAVDeals | Last-minute deals, distressed inventory |
| #RentAVacation | General brand |
| #AskRAVIO | Voice/text search demos only (not primary) |

---

## 4. FEATURE DICTIONARY

Canonical names and descriptions. Use these exact names in all materials.

| Canonical Name | One-Line Description | Tier | Notes |
|----------------|---------------------|------|-------|
| **Name Your Price** | Travelers bid on any open listing — the first bidding engine in vacation rentals | Primary | Lead feature in all messaging. Master tagline. |
| **RAV Wishes** | Travelers post their dream trip; verified owners compete with proposals | Primary | Formerly "Vacation Wishes." Internal DB name: `travel_requests` |
| **RAV Deals** | Curated distressed inventory — expiring weeks from motivated sellers | Primary | Feeds into Name Your Price (bidding). New feature. |
| **TrustShield** | Multi-step owner verification — identity, ownership, and property confirmation | Supporting | Always pair with PaySafe |
| **PaySafe** | Stripe-powered escrow — funds held until check-in is confirmed | Supporting | Always pair with TrustShield |
| **Ask RAVIO** | Voice-powered AI vacation search — say what you want, get results | Supporting | RAVIO = Rent-A-Vacation Intelligent Operator |
| **Chat with RAVIO** | Text-based AI assistant with streaming responses and property cards | Supporting | Same AI, text interface |
| **RAV SmartEarn** | Maintenance fee calculator + rental income estimator — shows break-even | Supporting | Free, no account required. Lead gen for owners |
| **RAV SmartPrice** | AI-powered pricing recommendations — Fair Value badges on listings | Supporting | Underpriced / Fair / Overpriced labels |
| **RAV SmartCompare** | Side-by-side cost comparison across booking platforms | Supporting | Free tool |
| **RAV SmartMatch** | Quiz to find your ideal vacation club brand | Supporting | Free tool |
| **RAV SmartBudget** | Vacation budget planning tool | Supporting | Free tool |
| **My Rentals** | Owner dashboard — earnings, listings, bookings, tools | Supporting | Formerly "RAV Edge" / "Owner's Edge." Nav label = "My Rentals" (mirrors "My Trips" for renters) |
| **RAV Insights** | Executive dashboard — real-time business intelligence for leadership | Infrastructure | Formerly "RAV Command." Nav label = "RAV Insights" |
| **RAV Ops** | Admin operations — users, listings, verifications, disputes | Infrastructure | Formerly "Admin Dashboard." Nav label = "RAV Ops" |
| **ResortIQ** | Curated resort directory — 117 resorts, 351 unit types from 9 brands. Auto-populates listing details so owners list in minutes and travelers see consistent, accurate resort info | Infrastructure | NOT "proprietary" — data is curated from publicly available resort information |
| **Dynamic Pricing** | Urgency discounts, seasonal factors, demand-based price adjustments | Infrastructure | Transparent to users |

---

## 5. NUMERICAL CLAIMS REGISTRY

Every number we use in marketing, with its source and label.

### Industry data [INDUSTRY DATA]

| Claim | Source | Notes |
|-------|--------|-------|
| 9.9 million U.S. households own timeshares | ARDA 2024 State of the Vacation Timeshare Industry | |
| $10.5 billion vacation ownership industry | ARDA / IBIS World | Total market, not secondary |
| $1,120 average annual maintenance fee | ARDA 2024 | Per-week average |
| Maintenance fees rising 4-8% per year | ARDA historical data | Compound annual growth |
| 50%+ of owners want to sell or reduce commitment | Industry surveys (multiple) | Approximate |
| Resort-direct bookings carry 20-40% markup over owner cost | Industry pricing analysis | Basis for our savings claim |

### Platform facts [BUILT]

| Claim | Source | How to Verify |
|-------|--------|---------------|
| 117 resorts, 351 unit types | Database query | `SELECT count(*) FROM resorts / unit_types` |
| 9 vacation club brands | `calculatorLogic.ts` | Hilton, Marriott, Disney, Wyndham, Hyatt, Bluegreen, Holiday Inn Club, WorldMark, Other |
| 825+ automated tests | `npm run test` | Run anytime — count updates with each session |
| 46 database migrations | `supabase/migrations/` | Count files |
| 30 edge functions | `supabase/functions/` | Count directories (excluding `_shared`) |
| 15% default commission | `src/lib/pricing.ts` line 11 | `RAV_MARKUP_RATE = 0.15` |
| Commission tiers: Pro -2%, Business -5% | Migration 011 | Configurable in admin settings |

### Projected [PROJECTED]

| Claim | Basis | Use With Caution |
|-------|-------|-----------------|
| $2-3 billion secondary rental market | ARDA + IBIS estimates | Serviceable addressable market |
| 1-3% market capture = $20-90M GMV | Business model projection | Investor materials only |
| 85%+ contribution margin | Unit economics model | Investor materials only |
| 12:1 LTV:CAC ratio | Industry benchmark modeling | Investor materials only |

---

## 6. DO NOT SAY

These claims, terms, and framings are retired. Do not use them in any material.

| Retired | Replacement | Reason |
|---------|-------------|--------|
| "Up to 70% off" / "50-70% savings" / "Save 70%" | "Save 20-40% compared to resort-direct booking" | Unsubstantiated — pricing code and market data support 20-40% |
| "$1,100 vs $3,200" savings example | Use calculator-backed examples only | $1,100 is below our own SmartEarn estimates |
| "Proprietary database" (for ResortIQ) | "Curated resort directory" | Data is from public resort information, not proprietary |
| "Proprietary resort data" / "verified resort data" | "Resort data curated from official sources" | Same — honest about data origin |
| Leading with RAVIO as primary differentiator | Lead with Name Your Price / Vacation Wishes | Marketplace mechanics are the product; AI is supporting |
| #AskRAVIO as primary hashtag | #NameYourPrice is primary | Aligns with marketplace-first messaging |
| "The world's first AI vacation concierge" as opening line | Open with marketplace value, mention AI as feature | AI is a differentiator but not the headline |
| "On average, our renters save X%" | "Designed to save you 20-40%" | We are pre-launch — no actual average exists |
| "Proprietary metrics" (for Liquidity Score, etc.) | "Platform metrics" or "marketplace health metrics" | These are calculated from platform data, not proprietary research |
| "Vacation Wishes" | **RAV Wishes** | Rebranded Session 47 for RAV brand family consistency |
| "Owner's Edge" / "RAV Edge" | **My Rentals** | Rebranded Session 47 — nav mirrors "My Trips" for renters |
| "RAV Command" | **RAV Insights** | Rebranded Session 47 — self-descriptive: "I get business insights here" |
| "Admin Dashboard" | **RAV Ops** | Rebranded Session 47 — self-descriptive: "operations management" |
| "Explore" (nav label) | **Browse Rentals** | Generic; replaced with descriptive action |
| "Make an Offer" (as CTA button text) | **Make a RAV Offer** | All transactional CTAs carry RAV identity |
| "Browse Deals" / "Last-Minute Deals" (as CTA) | **Browse RAV Deals** | Discovery CTAs carry RAV identity |
| #VacationWishes (hashtag) | **#RAVWishes** | Aligns with rebrand |

---

## 7. RESORTIQ — HONEST POSITIONING

ResortIQ is a **curated resort directory**, not an AI system or proprietary database.

### What it actually is
- A database of 117 resorts and 351 unit types from 9 vacation club brands
- Data curated from officially published resort information (amenities, unit specs, locations)
- Auto-populates listing forms when owners create listings (saves time, ensures consistency)
- Provides travelers with standardized, accurate resort information

### What the name means
- "IQ" = structured knowledge about resorts, organized for fast retrieval
- It's a **knowledge layer**, not artificial intelligence
- The value is **convenience** (auto-fill) and **consistency** (every listing has complete, accurate resort data)

### Approved descriptions
- Short: "Curated resort directory — 117 resorts, 351 unit types"
- Medium: "Our resort directory covers 117 resorts and 351 unit types across 9 brands. It auto-fills listing details so owners can list in minutes."
- Long: "ResortIQ is our curated resort directory — 117 resorts and 351 unit types from Hilton, Marriott, Disney, Wyndham, and more. When an owner lists a property, ResortIQ auto-populates bedrooms, bathrooms, square footage, and amenities. When a traveler views a listing, they see consistent, accurate resort information. This saves owners time and gives travelers confidence in what they're booking."

### Do NOT describe ResortIQ as
- "Proprietary database" — the data is from public sources
- "AI-powered" — it's a structured data lookup, not AI
- "Verified resort data" — use "curated from official resort sources" instead
- "Professional resort profiles" — implies more than what it is; use "resort directory"

---

## 8. BRAND ARCHITECTURE & NAMING RULES

> Added: Session 47, April 12, 2026

### The RAV Brand Family

Every named feature follows one of three naming patterns. When adding a new feature, use this framework:

| Pattern | When to Use | Examples |
|---------|-------------|---------|
| **RAV [Name]** | Platform features — tools, AI, internal dashboards | RAVIO, RAV Insights, RAV Ops, RAV Wishes, RAV Deals, RAV Smart[X] |
| **[CompoundName]** | Trust & infrastructure — the "serious" layer where gravitas matters | TrustShield, PaySafe, ResortIQ |
| **[Action Phrase]** | Verb-based CTAs — what users DO (all transactional CTAs carry RAV) | Name Your Price, Make a RAV Offer, Make a RAV Wish, Browse RAV Deals |
| **[Plain Language]** | User-facing nav labels — self-explanatory, says what you GET | My Trips, My Rentals, Browse Rentals |

### Nav Labels vs Brand Names (CRITICAL)

> **Nav labels = what you DO or what you GET (plain language, self-explanatory)**
> **Page titles = brand name + one-line value promise**

| Nav Label | Page Title | Who sees it |
|---|---|---|
| **Name Your Price** | Name Your Price — The Vacation Bidding Marketplace | Everyone (hero item, accent color) |
| **Make a Wish** | RAV Wishes — Tell us your dream trip. Owners compete. | Everyone |
| **Browse Rentals** | Vacation Rentals | Everyone |
| **My Trips** | My Trips | Renters |
| **My Rentals** | My Rentals | Owners |
| **RAV Insights** | RAV Insights — Business Intelligence | Executives |
| **RAV Ops** | RAV Ops — Operations | Staff/Admin |
| **List Your Property** | List Your Property | Everyone (owner CTA) |

### Naming Rules

1. **Every nav label must pass the test: "does my customer instantly know what they get?"**
2. **RAV prefix for internal/admin tools** (RAV Insights, RAV Ops, RAV Smart[X]) — staff know the brand
3. **Plain language for customer-facing nav** (My Trips, My Rentals, Browse Rentals) — customers need clarity
4. **Tools always use "RAV Smart[X]"** pattern — one compound word after Smart (SmartEarn, not Smart Earn)
5. **Discovery filters are NOT branded** — "Search by Event," "Browse by Activity" are UI labels, not products
6. **"Name Your Price" is the hero nav item** — accent color (coral), bolder weight. It visually dominates.

### CTA Naming Rules

1. **Every transactional CTA (where a user takes a marketplace action) carries "RAV"** in it
2. **The master tagline "Name Your Price" is the exception** — it's above the CTAs as the brand promise
3. **CTAs use verb form:** Make a RAV [X], Browse RAV [X]
4. **Navigation labels use plain language, not CTA form:** "Make a Wish" (nav), "Make a RAV Wish" (button)

### When NOT to Brand

- **UI filters** (date pickers, location dropdowns, price sliders) — these are standard controls
- **Discovery lenses** (Search by Event, Browse by Activity) — they help you find listings, not transact
- **Internal/technical terms** — database table names, hook names, edge function names stay descriptive

### Rebrand History

| Date | Old Name | New Name | Reason |
|------|----------|----------|--------|
| Apr 12, 2026 | Vacation Wishes | **RAV Wishes** | RAV brand family consistency |
| Apr 12, 2026 | Owner's Edge | **RAV Edge** | RAV brand family consistency |
| Apr 12, 2026 | Make an Offer | **Make a RAV Offer** | Transactional CTAs carry RAV identity |
| Apr 12, 2026 | *(new)* | **RAV Deals** | New feature — distressed inventory surface |
| Apr 12, 2026 | *(new)* | **Browse RAV Deals** | CTA for RAV Deals page |
| Apr 12, 2026 | RAV Edge | **My Rentals** | Nav mirrors "My Trips" — self-descriptive |
| Apr 12, 2026 | RAV Command | **RAV Insights** | Self-descriptive: business intelligence |
| Apr 12, 2026 | Admin Dashboard | **RAV Ops** | Self-descriptive: operations management |
| Apr 12, 2026 | Explore (nav) | **Browse Rentals** | Generic → descriptive action |
| Apr 12, 2026 | RAV Wishes (nav) | **Make a Wish** | Nav labels = plain language actions |

---

## 9. TERMINOLOGY CONTEXT MAP

> This is the definitive reference for what words appear on screen in each context. Check this before writing any user-facing text.

### Navigation & Page Titles

| Location | Nav Label | Page Title | Link |
|----------|-----------|------------|------|
| Header nav (everyone) | **Name Your Price** | Name Your Price — The Vacation Bidding Marketplace | /bidding |
| Header nav (everyone) | **Make a Wish** | RAV Wishes | /bidding (wishes tab) |
| Header nav (everyone) | **Browse Rentals** | Vacation Rentals | /rentals |
| Header nav (owner) | **My Rentals** | My Rentals | /owner-dashboard |
| Header nav (renter) | **My Trips** | My Trips | /my-trips |
| Header nav (admin) | **RAV Ops** | RAV Ops — Operations | /admin |
| Header nav (executive) | **RAV Insights** | RAV Insights — Business Intelligence | /executive-dashboard |
| Header nav (tools) | **Free Tools** | RAV Tools | /tools |
| Header nav (owner CTA) | **List Your Property** | List Your Property | /list-property |
| Tab label — listings | Listings | — | Within /bidding |
| Tab label — wishes | RAV Wishes | — | Within /bidding |

### CTA Buttons

| Context | Button Text | Action |
|---------|-------------|--------|
| PropertyDetail / ListingCard | **Make a RAV Offer** | Opens bid form dialog |
| BiddingMarketplace / empty search | **Make a RAV Wish** | Opens wish creation form |
| RAV Deals page | **Browse RAV Deals** | Page entry CTA |
| RAV Deals listing card | **Make a RAV Offer** | Same as any listing bid |
| Homepage hero | **Name Your Price** | Links to /bidding |
| Owner onboarding | **List Your Property** | Links to /list-property |

### Feature References in Copy

| When referring to... | Brand Name | Nav Label |
|---------------------|-----------|-----------|
| The bidding marketplace (umbrella) | **Name Your Price** | Name Your Price |
| The reverse auction feature | **RAV Wishes** | Make a Wish |
| The distressed inventory page | **RAV Deals** | Browse RAV Deals |
| The owner dashboard | **My Rentals** | My Rentals |
| The executive dashboard | **RAV Insights** | RAV Insights |
| The admin operations panel | **RAV Ops** | RAV Ops |
| The AI voice search | **Ask RAVIO** | — |
| The AI text chat | **Chat with RAVIO** | — |
| Owner verification | **TrustShield** | — |
| Payment escrow | **PaySafe** | — |
| Resort data directory | **ResortIQ** | — |
| Any Smart tool | **RAV Smart[Name]** | — |

### Internal vs. External Naming

| Internal (code/DB) | External (UI/marketing) | Nav Label | Notes |
|--------------------|------------------------|-----------|-------|
| `travel_requests` table | RAV Wishes | Make a Wish | DB name stays; nav is plain language |
| `travel_proposals` table | Proposals (within RAV Wishes) | — | Generic is fine for sub-concepts |
| `listing_bids` table | Offers (within Name Your Price) | — | "Bid" internally, "Offer" in UI |
| `owner-dashboard` route | My Rentals | My Rentals | Route can stay; display name changes |
| `executive-dashboard` route | RAV Insights | RAV Insights | Route can stay; display name changes |
| `admin` route | RAV Ops | RAV Ops | Route can stay; display name changes |
| `useLastMinuteDeals` hook | RAV Deals | Browse RAV Deals | Hook names are internal; UI shows branded |
