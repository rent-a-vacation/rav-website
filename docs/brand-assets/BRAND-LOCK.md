---
last_updated: "2026-04-20T04:52:26"
change_ref: "824263c"
change_type: "session-52-terminology-lock"
status: "active"
---
# BRAND LOCK — Rent-A-Vacation

> **Purpose:** This is the single source of truth for all brand messaging, claims, and feature positioning. Every other document (brand docs, social media, pitch decks, source code, email templates) MUST align with this file.
>
> **Rule:** If this document and another document disagree, this document wins. Update the other document.
>
> **Last reviewed:** April 15, 2026 (Session 52 — Marketplace Terminology Lock: Listing / Wish / Offer)

## 🔒 VOCABULARY LOCK (Session 52)

The user-facing marketplace uses **three nouns only**:

| Noun | Meaning | DB table (internal) |
|---|---|---|
| **Listing** | An owner posts a property + dates for rent | `listings` |
| **Wish** | A renter posts a dream trip (open call — destination, dates, budget) | `travel_requests` |
| **Offer** | A proposed transaction at a price — works in both directions | `listing_bids` (renter→listing) OR `travel_proposals` (owner→Wish) |

**"Offer" replaces "Bid" AND "Proposal" in all UI.** "Bid" and "Proposal" remain only in DB column names, hook names, and internal code.

**"RAV" prefix is dropped from all transactional nouns and CTAs:** "RAV Offer" → Offer, "RAV Wish" → Wish, "Make a RAV Offer" → Make an Offer, "Make a RAV Wish" → Post a Wish.

**Header nav** shows a single **Marketplace** link (not separate "Name Your Price" + "Make a Wish" links). "Name Your Price. Book Your Paradise." remains as the brand tagline/hero slogan but is not a nav label.

See Section 9 for the complete Terminology Context Map.

---

## 1. MESSAGING HIERARCHY

Features are presented in this order across all materials. Lead with the **Marketplace** — a two-sided negotiation platform with Listings, Wishes, and Offers flowing in both directions. AI is a supporting differentiator.

| Tier | Feature | Role | Lead With |
|------|---------|------|-----------|
| **Primary** | **The Marketplace** (Listings · Wishes · Offers) | Core product — two-sided negotiation platform | Always first in any feature list |
| **Primary** | **RAV Deals** (distressed inventory) | Discovery surface — motivated sellers, urgent deals | Third in discovery contexts |
| **Supporting** | **TrustShield + PaySafe** (trust) | Removes risk, enables transactions | After marketplace features — builds confidence |
| **Supporting** | **Ask RAVIO / Chat with RAVIO** (AI) | Discovery tool — voice and text search | Supporting — nice-to-have, not the headline |
| **Supporting** | **RAV Smart Suite** (5 tools) | Owner acquisition + lead generation | Supporting — owner onboarding |
| **Supporting** | **My Rentals** (owner dashboard) | Owner tools — listings, Offers sent/received, bookings, earnings | Nav: "My Rentals" |
| **Infrastructure** | **RAV Insights** (executive dashboard) | Business intelligence for leadership | |
| **Infrastructure** | **RAV Ops** (admin operations) | User/listing/verification management | |
| **Infrastructure** | **ResortIQ** (resort directory) | Data layer — auto-fill, consistency | Mention when relevant, don't feature-lead |

### Hierarchy rules

- In any bio, headline, or opening sentence: **the Marketplace concept (Listings, Wishes, Offers)** appears first
- The brand slogan "**Name Your Price. Book Your Paradise.**" remains the hero tagline and opener — it describes the *mechanic* (you name the price via an Offer) even though the nav says "Marketplace"
- RAVIO is mentioned as a feature, not as the brand identity or primary differentiator
- Campaign launches lead with marketplace mechanics; AI campaigns are secondary/later
- Platform-internal features (RAV Deals, RAV Insights, RAV Ops, RAV Smart[X], RAVIO) retain the RAV prefix — it identifies them as ours
- Transactional nouns and CTAs are NOT RAV-prefixed: Offer, Wish, Make an Offer, Post a Wish

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
| **4** | **Post a Wish. Owners Make It Happen.** | Wishes feature — specific campaigns |
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
| **#NameYourPrice** | Primary — marketplace moments, Offer highlights |
| #PostAWish | Wish-centric stories, owner Offers on Wishes |
| #RAVDeals | Last-minute deals, distressed inventory (platform-branded surface) |
| #RentAVacation | General brand |
| #AskRAVIO | Voice/text search demos only (not primary) |

---

## 4. FEATURE DICTIONARY

Canonical names and descriptions. Use these exact names in all materials.

| Canonical Name | One-Line Description | Tier | Notes |
|----------------|---------------------|------|-------|
| **Marketplace** | Two-sided negotiation platform where renters and owners exchange Offers on Listings and Wishes | Primary | Nav label: "Marketplace". Route: `/marketplace`. Tagline: "Name Your Price. Book Your Paradise." |
| **Listing** | An owner's property + dates posted for rent (direct-book or open-to-Offers) | Primary | DB: `listings`. Users see it as the noun "Listing" everywhere |
| **Wish** | A renter's open call — destination, dates, budget. Owners send Offers on Wishes | Primary | DB: `travel_requests`. UI term is "Wish" — never "Request" or "RAV Wish" in user-facing copy |
| **Offer** | A proposed transaction at a price. Renters send Offers on Listings; owners send Offers on Wishes. Same noun, both directions | Primary | DB: `listing_bids` (renter→listing) OR `travel_proposals` (owner→Wish). UI term is "Offer" — never "Bid" or "Proposal" |
| **RAV Deals** | Curated distressed inventory — expiring weeks from motivated sellers. Each Deal is a Listing with urgency signals | Primary | Feeds into the Marketplace. Platform-branded surface. |
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
| "Vacation Wishes" / "RAV Wishes" / "RAV Wish" | **Wish / Wishes** | Session 52 — user-facing terms drop the RAV prefix |
| "Owner's Edge" / "RAV Edge" | **My Rentals** | Session 47 — nav mirrors "My Trips" for renters |
| "RAV Command" | **RAV Insights** | Session 47 — self-descriptive: "I get business insights here" |
| "Admin Dashboard" | **RAV Ops** | Session 47 — self-descriptive: "operations management" |
| "Explore" (nav label) | **Browse Rentals** | Generic; replaced with descriptive action |
| "Make a RAV Offer" | **Make an Offer** | Session 52 — transactional CTAs drop RAV prefix |
| "Make a RAV Wish" / "Make a Wish" | **Post a Wish** | Session 52 — consistent verb; drops RAV prefix |
| "Bid" / "Bids" (as user-facing UI term) | **Offer / Offers** | Session 52 — single noun for both directions. "Bid" stays in DB only |
| "Proposal" / "Submit Proposal" (as user-facing UI term) | **Offer / Send an Offer** | Session 52 — unified with "Offer" across directions |
| "Name Your Price" / "Make a Wish" (as separate header nav links) | **Marketplace** (single link) | Session 52 — one entry point with role-aware default tab inside |
| "/bidding" (route) | **/marketplace** | Session 52 — /bidding redirects to /marketplace |
| "Browse Deals" / "Last-Minute Deals" (as CTA) | **Browse RAV Deals** | Discovery CTAs retain RAV identity for platform-branded surfaces |
| #VacationWishes (hashtag) | **#PostAWish** | Session 52 — aligns with new CTA verb |
| #RAVWishes (hashtag) | **#PostAWish** | Session 52 — drops RAV prefix from user-facing hashtags |

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
| **RAV [Name]** | Platform-branded surfaces — internal tools, AI, dashboards, curated discovery surfaces | RAVIO, RAV Insights, RAV Ops, RAV Deals, RAV Smart[X] |
| **[CompoundName]** | Trust & infrastructure — the "serious" layer where gravitas matters | TrustShield, PaySafe, ResortIQ |
| **[Plain Noun]** | Marketplace mechanics — user-facing nouns that describe the thing | Listing, Wish, Offer, Marketplace |
| **[Action Phrase]** | Verb-based CTAs — what users DO. **Plain language, NO RAV prefix on transactional CTAs** (Session 52) | Make an Offer, Post a Wish, Browse RAV Deals (platform surface exception), List Your Property |
| **[Plain Language Nav]** | Header/nav labels — self-explanatory, says what you GET or DO | Marketplace, My Trips, My Rentals, Browse Rentals |

### Nav Labels vs Brand Names (CRITICAL)

> **Nav labels = what you DO or what you GET (plain language, self-explanatory)**
> **Page titles = brand name + one-line value promise**

| Nav Label | Page Title | Who sees it |
|---|---|---|
| **Marketplace** | Marketplace — Listings & Wishes | Everyone (hero item, accent color). Role-aware default tab inside. |
| **Browse Rentals** | Vacation Rentals | Everyone |
| **My Trips** | My Trips | Renters |
| **My Rentals** | My Rentals | Owners |
| **RAV Insights** | RAV Insights — Business Intelligence | Executives |
| **RAV Ops** | RAV Ops — Operations | Staff/Admin |
| **List Your Property** | List Your Property | Everyone (owner CTA) |

### Naming Rules

1. **Every nav label must pass the test: "does my customer instantly know what they get?"**
2. **RAV prefix for platform-branded surfaces** (RAV Insights, RAV Ops, RAV Smart[X], RAV Deals, RAVIO) — these are ours
3. **Plain nouns for marketplace mechanics** (Listing, Wish, Offer, Marketplace) — users need clarity, not branding
4. **Plain language for customer-facing nav** (Marketplace, My Trips, My Rentals, Browse Rentals) — customers need clarity
5. **Tools always use "RAV Smart[X]"** pattern — one compound word after Smart (SmartEarn, not Smart Earn)
6. **Discovery filters are NOT branded** — "Search by Event," "Browse by Activity" are UI labels, not products
7. **"Marketplace" is the hero nav item** — accent color (coral), bolder weight. It visually dominates.

### CTA Naming Rules (Session 52 — UPDATED)

1. **Transactional CTAs use plain language, NOT RAV-prefixed.** Session 52 removed the RAV prefix from action verbs to reduce user friction.
   - ✅ Make an Offer · Post a Wish · List Your Property · Open the Marketplace
   - ❌ Make a RAV Offer · Make a RAV Wish
2. **Platform-branded surfaces keep "Browse RAV [X]" for discovery CTAs** when the destination is RAV-branded:
   - ✅ Browse RAV Deals (takes you to the branded RAV Deals surface)
3. **The brand slogan "Name Your Price. Book Your Paradise." is retained** as the master tagline — it lives in the hero, taglines, meta descriptions, pitch materials, emails. It is NOT a nav label.
4. **CTAs use verb form:** Make an Offer, Post a Wish, Open the Marketplace, Browse Rentals.

### When NOT to Brand

- **Marketplace nouns** (Listing, Wish, Offer) — plain nouns win every time
- **Transactional CTAs** (Make an Offer, Post a Wish) — no RAV prefix
- **UI filters** (date pickers, location dropdowns, price sliders) — standard controls
- **Discovery lenses** (Search by Event, Browse by Activity) — they help you find listings, not transact
- **Internal/technical terms** — database table names, hook names, edge function names stay descriptive

### Rebrand History

| Date | Old Name | New Name | Reason |
|------|----------|----------|--------|
| Apr 15, 2026 (S52) | RAV Wishes / RAV Wish | **Wish / Wishes** | User-facing terms drop RAV prefix |
| Apr 15, 2026 (S52) | Make a RAV Offer | **Make an Offer** | Transactional CTAs drop RAV prefix |
| Apr 15, 2026 (S52) | Make a Wish / Make a RAV Wish | **Post a Wish** | Consistent verb; no RAV prefix |
| Apr 15, 2026 (S52) | Bid / Proposal (UI) | **Offer** | One noun for both directions; "Bid"/"Proposal" stay in DB only |
| Apr 15, 2026 (S52) | Name Your Price + Make a Wish (nav links) | **Marketplace** (single link) | One entry point, role-aware default tab |
| Apr 15, 2026 (S52) | /bidding (route) | **/marketplace** | Semantic alignment; /bidding redirects |
| Apr 15, 2026 (S52) | #RAVWishes (hashtag) | **#PostAWish** | Aligns with new CTA verb |
| Apr 12, 2026 (S47) | Vacation Wishes | RAV Wishes | Retired S52 — see above |
| Apr 12, 2026 (S47) | Owner's Edge | RAV Edge | Retired same session — see next row |
| Apr 12, 2026 (S47) | RAV Edge | **My Rentals** | Nav mirrors "My Trips" — self-descriptive |
| Apr 12, 2026 (S47) | Make an Offer | Make a RAV Offer | Retired S52 — see top row |
| Apr 12, 2026 (S47) | *(new)* | **RAV Deals** | New feature — distressed inventory surface |
| Apr 12, 2026 (S47) | *(new)* | **Browse RAV Deals** | CTA for RAV Deals page |
| Apr 12, 2026 (S47) | RAV Command | **RAV Insights** | Self-descriptive: business intelligence |
| Apr 12, 2026 (S47) | Admin Dashboard | **RAV Ops** | Self-descriptive: operations management |
| Apr 12, 2026 (S47) | Explore (nav) | **Browse Rentals** | Generic → descriptive action |

---

## 9. TERMINOLOGY CONTEXT MAP (Session 52 — CANONICAL)

> This is the definitive reference for what words appear on screen in each context. Check this before writing any user-facing text.

### The three marketplace nouns

| Noun | What it means | Who creates it | DB table |
|---|---|---|---|
| **Listing** | Owner posts a property + dates for rent | Owner | `listings` |
| **Wish** | Renter posts a dream trip (destination, dates, budget) | Renter | `travel_requests` |
| **Offer** | Proposed transaction at a price — works both directions | Renter (on a Listing) or Owner (on a Wish) | `listing_bids` (renter→listing) OR `travel_proposals` (owner→Wish) |

**"Offer" replaces both "Bid" (old UI) and "Proposal" (old UI).** In the database, the two mechanics are still stored in separate tables (`listing_bids` vs `travel_proposals`) because they point at different parents — but end users see a single noun: "Offer."

### Navigation & Page Titles — Path 3 Hybrid (Session 55)

**Pattern:** keep the short brand name as the dominant H1 + CTA label, add a small-caps **role-descriptive eyebrow** above it so users instantly understand what they're looking at.

| Location | Nav Label | Page Eyebrow (small caps) | Page H1 | Link |
|----------|-----------|---------------------------|---------|------|
| Header nav (everyone) | **Marketplace** | — | Marketplace — Listings & Wishes | /marketplace |
| Header nav (everyone) | **Browse Rentals** | — | Vacation Rentals | /rentals |
| Header nav (owner) | **My Rentals** | Property Owner Dashboard | My Rentals | /owner-dashboard |
| Header nav (renter) | **My Trips** | Traveler Dashboard | My Trips | /my-trips |
| Header nav (admin) | **RAV Ops** | RAV Admin Dashboard (or RAV Staff Dashboard — dynamic by role) | RAV Ops | /admin |
| Header nav (executive) | **RAV Insights** | Executive Dashboard — Business Intelligence | RAV Insights | /executive-dashboard |
| Header nav (tools) | **Free Tools** | — | RAV Tools | /tools |
| Header nav (owner CTA) | **List Your Property** | — | List Your Property | /list-property |
| Tab label — listings (inside Marketplace) | **Listings** | — | — | /marketplace (default for renter/anon) |
| Tab label — wishes (inside Marketplace) | **Wishes** | — | — | /marketplace?tab=wishes (default for owner) |

**Rationale:** brand names like "My Rentals" / "My Trips" / "RAV Ops" remain the short, scannable CTAs in the header nav — preserving DEC-031. The descriptive eyebrow ("Property Owner Dashboard") tells a first-time user what the page represents in role terms — so the mapping between brand name and function is visually guided.

### User dropdown (role-aware "My Activity")

| Renter sees | Owner sees |
|---|---|
| My Trips | My Rentals |
| My Offers | Offers I Sent |
| My Wishes | Offers on My Listings |
| Account Settings | Account Settings |

**Note:** Owner dropdown previously showed "My Listings" as its top item; this was an inconsistency with the nav label "My Rentals" and was corrected in Session 55. Sub-tab labels inside the dashboard (e.g., the "My Listings" tab within My Rentals) remain as sub-labels — they name a tab, not the dashboard.

### CTA Buttons (plain language — no RAV prefix on transactional CTAs)

| Context | Button Text | Action |
|---------|-------------|--------|
| PropertyDetail / ListingCard | **Make an Offer** | Opens Offer form dialog |
| Marketplace page (renter) | **Post a Wish** | Opens Wish creation form |
| TravelRequestForm / InspiredTravelRequestDialog | **Post a Wish** | Submits a Wish |
| TravelRequestCard (owner viewing a Wish) | **Send Offer** | Opens Offer-on-Wish form |
| BidFormDialog | **Send Offer** | Submits the Offer |
| BidsManagerDialog | **Manage Offers** | Title of dialog; "Pending Offers" / "Past Offers" sections |
| RAV Deals page | **Browse RAV Deals** | Platform-branded surface CTA (keeps RAV) |
| RAV Deals listing card | **Make an Offer** | Same as any Listing Offer |
| Homepage hero | **Name Your Price** (slogan) | The brand tagline — not a button label; the hero CTA routes to /marketplace |
| Homepage secondary CTA | **Open the Marketplace** | Links to /marketplace |
| Owner onboarding | **List Your Property** | Links to /list-property |

### Notification category labels

| Filter | Label shown |
|---|---|
| All | All |
| Bookings | Bookings |
| Bids (DB value) | **Offers** |
| Travel Requests (DB value) | **Wishes** |
| Reminders | Reminders |
| System | System |

### Feature references in copy

| When referring to... | Brand Name | Nav Label |
|---------------------|-----------|-----------|
| The two-sided negotiation platform (umbrella) | **the Marketplace** | Marketplace |
| Renter's open call to the market | **Wish** | — (inside Marketplace) |
| An owner's rentable property/dates | **Listing** | — (inside Marketplace) |
| A proposed deal at a price | **Offer** | — (inside Marketplace) |
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

| Internal (code/DB) | External (UI/marketing) | Notes |
|--------------------|------------------------|-------|
| `travel_requests` table | **Wish / Wishes** | DB name stays; UI drops RAV prefix |
| `travel_proposals` table | **Offer** (when owner sends it on a Wish) | Proposal → Offer in all UI |
| `listing_bids` table | **Offer** (when renter sends it on a Listing) | Bid → Offer in all UI |
| `bidding` DB concept | **Marketplace** | Broader umbrella in UI |
| `/marketplace` route | Marketplace | Route renamed; `/bidding` redirects |
| `owner-dashboard` route | My Rentals | Route can stay; display name is plain |
| `executive-dashboard` route | RAV Insights | Display name branded for platform |
| `admin` route | RAV Ops | Display name branded for platform |
| `useBidding` hook | (internal) | Name unchanged — internal code |
| `useLastMinuteDeals` hook | RAV Deals | Hook names are internal; UI shows branded |

### Marketplace role-aware defaults

When a user lands on `/marketplace`:
- **Renter or anonymous:** default tab = **Listings** (find a deal)
- **Owner:** default tab = **Wishes** (find renters who want their property)
- **?tab=listings** / **?tab=wishes** URL params override the default
- Legacy **?tab=requests** maps to **?tab=wishes**

### Brand slogan usage

"**Name Your Price. Book Your Paradise.**" remains in:
- Homepage hero H1
- Page meta descriptions (default)
- Email footer slogan (src/lib/email.ts)
- Pitch deck / marketing materials
- Documentation + UserGuide cover pages

It does **not** appear as a nav label anymore.
