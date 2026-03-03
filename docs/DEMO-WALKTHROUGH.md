# Rent-A-Vacation Platform Demo Walkthrough

> **Purpose:** A structured script for presenting the Rent-A-Vacation platform to investors, partners, team members, or stakeholders. Follow each section in order for a complete 45-60 minute walkthrough, or pick individual sections for targeted demos.
>
> **Prerequisites:**
> - Access to the DEV environment (dev.rent-a-vacation.com) or local dev server
> - RAV Admin account credentials (for admin/executive dashboard demos)
> - Property Owner test account (for owner journey demos)
> - Renter test account (for renter journey demos)
> - Desktop browser (Chrome recommended) with microphone permissions enabled
>
> **Last Updated:** February 28, 2026

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview) (5-7 minutes)
2. [Tech Stack & Architecture](#2-tech-stack--architecture) (8-10 minutes)
3. [Property Owner Journey](#3-property-owner-journey) (12-15 minutes)
4. [Renter Journey](#4-renter-journey) (12-15 minutes)
5. [RAV Admin & Executive Dashboard](#5-rav-admin--executive-dashboard) (10-12 minutes)

**Appendices:**
- [A: Demo Environment Setup](#appendix-a-demo-environment-setup)
- [B: Key Metrics Summary](#appendix-b-key-metrics-summary)
- [C: Narrative Flow for Different Audiences](#appendix-c-narrative-flow-for-different-audiences)
- [D: Troubleshooting Common Demo Issues](#appendix-d-troubleshooting-common-demo-issues)

### Timing Guide

| Section | Duration | Running Total |
|---------|----------|---------------|
| Opening & Setup | 2 min | 2 min |
| 1. High-Level Overview | 5-7 min | 9 min |
| 2. Tech Stack & Architecture | 8-10 min | 19 min |
| 3. Property Owner Journey | 12-15 min | 34 min |
| 4. Renter Journey | 12-15 min | 49 min |
| 5. Admin & Executive Dashboard | 10-12 min | 61 min |
| Q&A Buffer | 5-10 min | 71 min |

> **Tip:** For a 30-minute version, skip Section 2 (Tech Stack) and only show the highlights of Sections 3 and 4. See [Appendix C](#appendix-c-narrative-flow-for-different-audiences) for audience-specific scripts.

### Demo Flow Transitions

Between each section, use these transition phrases to maintain narrative continuity:

- **Overview to Tech Stack:** "Now that you understand what we are building, let me show you how we built it."
- **Tech Stack to Owner Journey:** "Let me bring this to life by walking through the experience of a property owner."
- **Owner Journey to Renter Journey:** "Now let us flip to the other side of the marketplace and see what the renter experience looks like."
- **Renter Journey to Admin Dashboard:** "Behind the scenes, our admin team keeps everything running smoothly. Let me show you the operational dashboard."

---

## 1. High-Level Overview

**Estimated time:** 5-7 minutes

### Opening (Start at the Homepage)

**Navigate to:** `/` (Homepage)

**What to show:** The homepage hero section with rotating destination imagery (Kerala, Utah, Yellowstone, Jacksonville Beach), the search bar, and the overall visual branding.

> **Talking point:**
> "Rent-A-Vacation is a two-sided marketplace that connects timeshare owners with vacation renters. We solve a real problem on both sides: timeshare owners pay thousands in annual maintenance fees whether they use their weeks or not, and travelers overpay for resort stays through traditional booking channels. Our platform lets owners list their unused weeks and renters book them at 50-70% below retail rates."

### The Value Proposition

**What to show:** Scroll down to the "How It Works" section on the homepage.

> **Talking point:**
> "The business model is straightforward. We charge a 15% service fee on each booking. That fee is configurable by membership tier -- Pro owners pay 13%, Business owners pay 10%. The renter sees the total price inclusive of the service fee, and the owner receives their payout minus the fee. Everyone wins: the owner offsets their maintenance fees, the renter gets a luxury resort stay at a fraction of the cost, and we earn a commission for facilitating the transaction."

### Platform Scale

**What to show:** Scroll to the Trust Badges section showing partner resort counts.

> **Talking point:**
> "We have 117 partner resorts across 9 major vacation club brands:
> - Hilton Grand Vacations (62 resorts)
> - Marriott Vacation Club (40 resorts)
> - Disney Vacation Club (15 resorts)
> - Plus Wyndham, Hyatt, Bluegreen, Holiday Inn Club, WorldMark by Wyndham, and independent resorts
>
> That is 351 unit types across 10+ countries. This is not a concept -- it is a fully built marketplace with real inventory structure."

### Three User Types

> **Talking point:**
> "There are three distinct user types in the platform, each with their own dashboard and workflow:
> 1. **Renters** -- Browse listings, search by voice or text, make offers, book stays, manage reservations
> 2. **Property Owners** -- List their timeshare weeks, manage properties, receive offers, track earnings, get payouts
> 3. **RAV Admins** -- Oversee the entire marketplace: approve listings, manage escrow, resolve disputes, run financials
>
> Every user goes through a verification and approval process before they can transact on the platform."

### Key Metrics to Highlight

- 117 partner resorts, 9 vacation club brands
- 351 unit types across 10+ countries
- 15% base commission rate (tiered discounts for Pro/Business)
- 50-70% savings for renters compared to retail booking
- App version: v0.9.0 (pre-launch)

### Common Questions

| Question | Answer |
|----------|--------|
| "How do you verify the timeshare ownership?" | "Owners go through a multi-step verification process. They submit ownership documentation, and our admin team reviews and approves each property before it can be listed." |
| "What happens if a booking falls through?" | "We hold funds in escrow until the stay is confirmed. We have tiered cancellation policies (flexible, moderate, strict, super strict) and automated refund processing through Stripe." |
| "Why not just use Airbnb or VRBO?" | "Those platforms are not designed for timeshare inventory. Owners cannot easily list specific resort weeks, and renters cannot take advantage of the pre-paid resort infrastructure. We are purpose-built for this niche." |
| "Is this legal?" | "Yes. Timeshare owners have the right to rent their allotted time. We facilitate the transaction and handle the payment processing, escrow, and dispute resolution." |

---

## 2. Tech Stack & Architecture

**Estimated time:** 8-10 minutes

### Frontend Stack

**Navigate to:** Show the application in the browser, then open Chrome DevTools briefly to show the React component tree.

> **Talking point:**
> "The frontend is built with React 18, TypeScript, and Vite for fast development and hot module replacement. We use Tailwind CSS for styling and shadcn/ui for our component library, which gives us a consistent, accessible design system out of the box. The entire codebase is strictly typed with TypeScript."

**Key details to mention:**
- React 18 with hooks and context for state management
- TanStack Query (React Query) for server state, caching, and optimistic updates
- Vite for sub-second hot reload during development
- Tailwind CSS + shadcn/ui for consistent, responsive design
- Mobile-first responsive layout (works on all devices)

### Backend Infrastructure

> **Talking point:**
> "The backend runs entirely on Supabase, which gives us PostgreSQL, authentication, real-time subscriptions, row-level security, and edge functions -- all in one platform. We have 29 database migrations tracking our schema evolution and 25 edge functions handling everything from payment processing to AI-powered chat."

**Key details to mention:**
- Supabase PostgreSQL with Row-Level Security on every table
- 25 edge functions (Deno runtime) for server-side logic
- 29 database migrations tracking schema evolution
- Supabase Auth with email/password and Google OAuth
- Separate DEV and PROD Supabase projects for safe development

### Payments

> **Talking point:**
> "Payments are handled through Stripe. We use Stripe Checkout for secure payment collection, Stripe Connect for automated owner payouts directly to their bank accounts, and we have Stripe Tax integration ready to activate once our business formation is complete. The checkout flow shows itemized fees: base rental, 15% service fee, cleaning fee, and taxes -- full transparency for the renter."

**Key details to mention:**
- Stripe Checkout with itemized line items
- Stripe Connect (Express accounts) for owner payouts
- Stripe Webhooks for reliable payment verification (6 event types handled)
- Stripe Tax integration (code ready, pending business formation)
- Escrow system holds funds until booking is confirmed

### AI Features

> **Talking point:**
> "We have two AI-powered search features. First, voice search powered by VAPI -- you can literally say 'Find me a 2-bedroom in Orlando under $1500' and get instant results. The voice pipeline uses Deepgram for speech-to-text, GPT-4o-mini for intent parsing, and ElevenLabs for text-to-speech responses. Second, we have RAVIO, our text-based chat agent powered by OpenRouter with SSE streaming. RAVIO understands the context of what you are browsing and can make personalized recommendations."

### Analytics & Monitoring

> **Talking point:**
> "For analytics, we use a three-layer approach: GA4 for marketing attribution, PostHog for product analytics and feature flags, and Sentry for error tracking and performance monitoring. All analytics respect the user's cookie consent preferences -- we are GDPR-compliant."

### Security

**Navigate to:** Open `vercel.json` in an editor or mention the security headers.

> **Talking point:**
> "Security is built into every layer. We have Content Security Policy headers restricting script sources and connections. Row-Level Security on every database table ensures users can only access their own data. Rate limiting on all edge functions prevents abuse -- for example, checkout is limited to 5 requests per minute. We have HSTS, X-Frame-Options DENY, and strict referrer policies. For GDPR compliance, users can export all their data or request account deletion with a 14-day grace period."

**Key security headers:**
- Content-Security-Policy (script-src, connect-src, frame-src restrictions)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Strict-Transport-Security (HSTS with 2-year max-age, preload)
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(self), geolocation=(), payment=()

### Development Workflow

> **Talking point:**
> "Our development workflow follows a strict branching strategy. All new code goes into the `dev` branch, which auto-deploys to a Vercel preview environment pointing at our Supabase DEV project. When features are ready, we create a pull request from `dev` to `main`. The PR triggers our CI pipeline: linting, 415 automated tests, and visual regression testing with Percy. The `main` branch requires review and passing CI before merge, and auto-deploys to production."

### Testing

> **Talking point:**
> "We have 415 automated tests across 58 test files, all passing. That includes unit tests for business logic like pricing calculations, integration tests for React hooks and contexts, and end-to-end tests with Playwright. We enforce minimum coverage thresholds in CI: 25% statements, 25% branches, 30% functions. Visual regression testing with Percy catches unintended UI changes. Every new feature ships with tests -- that is a non-negotiable policy."

### Edge Functions Overview

> **Talking point (for technical audiences):**
> "We have 25 edge functions running on Deno, each handling a specific piece of server-side logic. They are organized by domain:"

**Mention these function groups:**

| Domain | Functions | Purpose |
|--------|-----------|---------|
| Payments | `create-booking-checkout`, `verify-booking-payment`, `stripe-webhook` | Stripe Checkout, payment verification, webhook handling |
| Payouts | `create-connect-account`, `create-stripe-payout`, `process-escrow-release` | Owner bank connections, transfers, escrow release |
| Cancellations | `process-cancellation`, `send-cancellation-email` | Policy-based refunds, notifications |
| Disputes | `process-dispute-refund` | Investigation and refund processing |
| Notifications | `send-email`, `send-approval-email`, `send-booking-confirmation-reminder`, `send-verification-notification`, `send-contact-form`, `process-deadline-reminders` | Transactional emails via Resend |
| AI | `voice-search`, `text-chat` | VAPI voice pipeline, OpenRouter chat |
| Data | `fetch-industry-news`, `fetch-airdna-data`, `fetch-str-data`, `fetch-macro-indicators` | Executive dashboard data feeds |
| Marketplace | `match-travel-requests` | Travel request to owner matching |
| GDPR | `export-user-data`, `delete-user-account` | Data export (14 tables), account deletion with anonymization |
| Admin | `seed-manager` | DEV-only seed data management |

> "Every edge function that accepts user input has rate limiting applied. For example, checkout is limited to 5 requests per minute per user, text chat to 20 per minute, and cancellation to 3 per minute. This prevents abuse while allowing normal usage patterns."

### Architecture Documentation

**Navigate to:** `/user-journeys`

> **Talking point:**
> "One thing I am particularly proud of is our architecture documentation. We use declarative flow manifests -- TypeScript objects that describe each user journey step by step. The `/user-journeys` page auto-generates interactive Mermaid diagrams from these manifests. So the documentation is always in sync with the code, because they are generated from the same source."

**What to show:** Click through the three flow tabs (Owner Lifecycle, Traveler Lifecycle, Admin Lifecycle). Point out how each step shows the route, component, database tables, and edge functions involved.

### Common Questions

| Question | Answer |
|----------|--------|
| "Why Supabase instead of a custom backend?" | "Supabase gives us PostgreSQL, auth, real-time, storage, and edge functions in one platform. It reduces operational overhead significantly and lets a small team move fast. Row-Level Security means authorization is enforced at the database level, not just in application code." |
| "How do you handle scaling?" | "Supabase handles database scaling. Vercel handles frontend CDN and serverless scaling. Edge functions run on Deno Deploy, which scales to zero when not in use. The architecture is designed to handle significant growth without re-architecture." |
| "What about mobile?" | "The web app is fully responsive and works on mobile browsers. We have PWA support with install prompts and offline banners. A native mobile app via Capacitor is planned after the PWA validates demand (architectural decision DEC-011)." |
| "How many developers built this?" | "This was built by a small team using AI-assisted development. The codebase has 415 tests, 29 migrations, 25 edge functions, and comprehensive documentation -- all maintained with rigorous quality standards." |

---

## 3. Property Owner Journey

**Estimated time:** 12-15 minutes

### Step 1: Sign Up as a Property Owner

**Navigate to:** `/signup`

**What to show:**
1. Click "Sign Up" in the header navigation
2. Fill in name, email, password
3. Select "Property Owner" as the role
4. Check the terms acceptance and age verification checkboxes
5. Click "Create Account"

> **Talking point:**
> "Every new user starts with the signup flow. Notice the role selection -- choosing 'Property Owner' sets up their account with owner-specific permissions. We require age verification and terms acceptance upfront. After signup, the user receives an email verification link. Until they verify their email, certain actions like checkout are restricted."

**What to show next:**
- After signup, show the "Pending Approval" page at `/pending-approval`
- Explain that an admin must approve the account before the owner can list properties

> **Talking point:**
> "New accounts go into a pending approval state. This is intentional -- we manually vet every user before they can transact on the platform. The admin sees a notification badge on the Approvals tab and can approve or reject with a reason. The user gets an email notification when their account is approved."

### Step 2: The Owner Dashboard

**Navigate to:** `/owner-dashboard` (log in as an approved property owner)

**What to show:**
1. The Overview tab with headline stats (total properties, active listings, pending bookings, total earnings)
2. The Phase 17 analytics components: Earnings Timeline chart, My Listings Table, Offer Activity Feed, Pricing Intelligence, Maintenance Fee Tracker

> **Talking point:**
> "Once approved, the owner lands on their dashboard. The overview tab gives them a complete picture of their portfolio at a glance: how many properties they have registered, active listings, pending bookings, and total earnings. Below that, we have rich analytics -- an earnings timeline showing revenue over time, a table of all their listings with status and pricing, a real-time feed of incoming offers, pricing intelligence comparing their rates to market averages, and a maintenance fee tracker showing how much of their annual fees they have offset through rentals."

### Step 3: Add a Property

**What to show:**
1. Click the "Properties" tab
2. Click "Add Property"
3. Walk through the form: select brand from dropdown, enter resort name, location, unit type, number of bedrooms, bathrooms, max occupancy, amenities, upload images

> **Talking point:**
> "Adding a property is the first step. The owner selects their vacation club brand from the dropdown -- we support all 9 major brands. They enter their resort details, unit specifications, and amenities. The brand selection is required; we do not default to any brand to avoid data quality issues. Images can be uploaded to showcase the property."

### Step 4: Create a Listing

**What to show:**
1. Click the "Listings" tab
2. Click "Create Listing" or "Add Listing"
3. Walk through: select property, set check-in and check-out dates, set nightly rate
4. Point out the auto-calculated pricing summary: base price, 15% RAV service fee, total price
5. Set cleaning fee and cancellation policy (flexible, moderate, strict, super strict)

> **Talking point:**
> "A listing represents a specific date range when the owner's property is available. They set a nightly rate, and the system automatically calculates the total: base price times the number of nights, plus the 15% service fee, plus any cleaning fee. The owner sees exactly what they will earn and what the renter will pay. They also choose a cancellation policy which determines refund percentages if the renter cancels."

**Key detail:** The nightly rate is what drives pricing. For example:
- Nightly rate: $200
- 7 nights: $1,400 base
- 15% service fee: $210
- Cleaning fee: $150
- Total to renter: $1,760
- Owner receives: $1,550 (base + cleaning fee)

### Step 5: Admin Approval

> **Talking point:**
> "After submission, the listing goes into a pending state and appears in the admin's approval queue. The admin reviews the listing details, verifies the pricing is reasonable, and approves or rejects it. The owner receives an email notification of the decision. This manual review step ensures listing quality and prevents fraudulent listings."

### Step 6: Receiving Offers and Proposals

**What to show:**
1. Click the "Proposals" tab in the Owner Dashboard
2. Show how offer notifications appear
3. Walk through the offer details: offered price, proposed dates (if date proposal), renter information

> **Talking point:**
> "Renters can interact with a listing in three ways: book at the listed price, make an offer with a different price, or propose different dates entirely. All of these show up in the owner's Proposals tab. The owner can accept, counter, or decline each proposal. Proposals expire after 24 hours to keep the marketplace moving."

### Step 7: Booking Confirmation

**What to show:**
1. Click the "Bookings" tab
2. Show a confirmed booking
3. Walk through the confirmation details: resort confirmation number, contact information

> **Talking point:**
> "Once a renter pays, the booking is confirmed and the owner needs to provide the resort confirmation details -- the reservation number and any check-in instructions. This is the handoff step that connects our digital booking with the physical resort reservation."

### Step 8: Earnings and Payouts

**What to show:**
1. Click the "Earnings" tab
2. Show the revenue breakdown: gross earnings, commission deducted, net earnings
3. Show the Stripe Connect banner (three states: not connected, onboarding incomplete, connected)
4. Click the "Payouts" tab to show payout history

> **Talking point:**
> "The Earnings tab shows the owner a complete financial picture: gross revenue, the RAV commission that was deducted, and their net earnings. Below that is the Stripe Connect integration. Owners connect their bank account through Stripe's secure onboarding flow, and then payouts go directly to their bank. The Payouts tab shows the history of all transfers."

### Cancellation Policies (Reference for Q&A)

If asked about cancellation policies during the owner section, here is the reference:

| Policy | Refund Amount | Deadline |
|--------|--------------|----------|
| Flexible | Full refund | Up to 24 hours before check-in |
| Moderate | 50% refund | Up to 5 days before check-in |
| Strict | 50% refund | Up to 14 days before check-in |
| Super Strict | Non-refundable | After booking confirmation |

> **Talking point:**
> "Owners choose the cancellation policy when creating a listing. This is clearly displayed to the renter before booking so there are no surprises. When a renter cancels, the system automatically calculates the refund based on the policy and the timing. Owner cancellations always result in a full refund to the renter, and we track the owner's cancellation count -- which can affect their standing if it becomes excessive."

### Step 9: The Breakeven Calculator

**Navigate to:** `/calculator`

**What to show:**
1. Select a brand (e.g., Hilton Grand Vacations)
2. Select a unit type (e.g., 2 Bedroom)
3. Enter annual maintenance fees (e.g., $3,500)
4. Enter weeks owned (e.g., 2)
5. Show the breakeven calculation and scenario table

> **Talking point:**
> "This is one of our most powerful conversion tools. A timeshare owner enters their brand, unit type, and annual maintenance fees, and we show them exactly how many weeks they need to rent out to break even. For a Hilton 2-bedroom with $3,500 in annual fees, renting just 1.5 weeks covers the entire year's fees. We show three scenarios: rent 1 week, 2 weeks, or 3 weeks -- with the gross income, RAV fee, net income, and coverage percentage for each."

### Step 10: Membership Tiers

**What to show:**
1. Click the "Membership" tab in the Owner Dashboard
2. Show the three tier cards: Free, Pro ($10/month), Business ($25/month)
3. Highlight the commission rate differences

> **Talking point:**
> "We offer three membership tiers for owners:
> - **Free** -- 15% commission, basic features
> - **Pro** ($10/month) -- 13% commission, priority support, analytics
> - **Business** ($25/month) -- 10% commission, dedicated account manager, premium analytics
>
> The commission savings at higher tiers quickly pay for themselves. An owner doing $10,000 in annual bookings saves $200 on Pro and $500 on Business compared to the Free tier."

### Common Questions

| Question | Answer |
|----------|--------|
| "How long does approval take?" | "Typically within 24-48 hours. We have SLA tracking and age badges in the admin dashboard to ensure nothing sits too long." |
| "Can an owner list on multiple platforms?" | "Yes. We do not require exclusivity. But our pricing tools and marketplace features make RAV the best channel for timeshare-specific inventory." |
| "What if the owner cannot fulfill the booking?" | "The owner can cancel, but the renter receives a full refund. The owner's cancellation count is tracked, and repeated cancellations may affect their standing on the platform." |
| "How are cleaning fees handled?" | "Cleaning fees are set by the owner and displayed as a separate line item in the checkout. They are passed through to the owner -- RAV does not take a commission on cleaning fees." |

---

## 4. Renter Journey

**Estimated time:** 12-15 minutes

### Step 1: Browse Listings

**Navigate to:** `/rentals`

**What to show:**
1. The search bar at the top with location input
2. Filter options: price range, date range, number of bedrooms, brand
3. Grid view vs. list view toggle
4. Sort options (price, date, popularity)
5. Pagination at the bottom

> **Talking point:**
> "The Rentals page is where renters discover available properties. They can search by location, filter by price range, dates, bedrooms, and brand, and toggle between grid and list views. Each listing card shows the resort name, unit type, dates, nightly rate, total price, and key amenities. We also show social proof indicators -- how recently the listing was added and how many people are viewing it."

**What to show on a listing card:**
- Resort and unit type name
- Location with map pin icon
- Check-in and check-out dates
- Nightly rate and total price
- Fair Value badge (if applicable)
- Favorites heart icon

### Step 2: Voice Search

**What to show:**
1. Click the microphone button on the Rentals page
2. Say: "Find 2-bedrooms in Orlando under $1500"
3. Show the voice status indicator (listening, processing, results)
4. Show the voice quota indicator (usage vs. daily limit)

> **Talking point:**
> "Voice search is one of our differentiating features. The renter clicks the microphone, speaks naturally, and our AI pipeline interprets their intent. The voice pipeline uses Deepgram for speech-to-text, GPT-4o-mini for understanding the query and extracting parameters like location, bedrooms, and price range, and ElevenLabs for speaking the results back. Voice quotas are tier-based: Free users get 5 searches per day, Plus and Pro get 25, and Premium and Business get unlimited."

**If voice is not available in the demo environment:**
> "In production, the voice search connects to VAPI's real-time pipeline. For this demo, I will show you the interface and explain the flow. The user speaks, the system transcribes, extracts search parameters, queries our database, and returns filtered results -- all in about 2-3 seconds."

### Step 3: Text Chat (RAVIO)

**What to show:**
1. Click the "Ask RAVIO" button (text chat button)
2. Show the chat panel sliding in from the right
3. Type a question: "What are the best deals in Hawaii this month?"
4. Show the streaming response with SSE (Server-Sent Events)

> **Talking point:**
> "RAVIO is our AI chat assistant, powered by GPT-4o-mini through OpenRouter. What makes RAVIO special is context awareness -- it knows what page you are on, what you have been browsing, and can make personalized recommendations. The responses stream in real-time using Server-Sent Events, so you see the answer being generated character by character. It is a natural, conversational way to discover properties."

### Step 4: Property Detail Page

**Navigate to:** `/property/:id` (click on any listing)

**What to show:**
1. Image gallery at the top
2. Property specifications: resort name, unit type, bedrooms, bathrooms, max occupancy
3. Amenities list
4. Fair Value badge showing how this listing compares to market rates
5. Cancellation policy details
6. Check-in and check-out dates
7. Pricing breakdown

> **Talking point:**
> "The property detail page gives the renter everything they need to make a decision. The Fair Value badge is powered by our proprietary scoring algorithm that compares the listing price against comparable properties in the same resort, location, and unit type. A 'Great Value' badge means this listing is priced below the market average. The cancellation policy is clearly displayed so there are no surprises."

### Step 5: Book, Make an Offer, or Propose Dates

**What to show:**
1. The "Book Now" button -- explain it goes to Stripe Checkout
2. The "Make an Offer" button -- click to show the offer form dialog
3. The "Propose Different Dates" option -- show the date proposal mode with date pickers

> **Talking point:**
> "Renters have three ways to engage with a listing:
> 1. **Book Now** -- Pay the listed price immediately through Stripe Checkout
> 2. **Make an Offer** -- Offer a different price. The owner can accept, counter, or decline
> 3. **Propose Different Dates** -- Same property, but different dates. The system auto-calculates the price based on the nightly rate and the new date range
>
> This flexibility is key to our marketplace model. It is not just a booking engine -- it is a negotiation platform."

### Step 6: Checkout

**Navigate to:** `/checkout?listing=<id>` (click "Book Now" on a listing)

**What to show:**
1. The listing summary (property name, dates, location)
2. The itemized fee breakdown:
   - Base: $X/night x N nights = $X
   - Service fee (15%): $X
   - Cleaning fee: $X
   - Taxes: $X (or "Calculated at checkout" if Stripe Tax is not yet active)
   - Total: $X
3. Guest count selector
4. Special requests text area
5. Email verification banner (if email not verified)
6. The "Proceed to Payment" button

> **Talking point:**
> "The checkout page shows complete pricing transparency. Every line item is broken out: the base rental cost calculated from the nightly rate, our 15% service fee, cleaning fee if the owner set one, and applicable taxes. The renter sees exactly what they are paying for. If their email is not verified, we show a banner prompting them to verify before payment -- this is a security measure to ensure we can reach them with booking confirmations."

**Key detail:** Clicking "Proceed to Payment" invokes the `create-booking-checkout` edge function, which creates a Stripe Checkout Session with separate line items and redirects the user to Stripe's hosted payment page.

> **Behind the scenes (mention for technical audiences):**
> "When the renter clicks 'Proceed to Payment,' our edge function creates a Stripe Checkout Session with three separate line items: the base rental amount with lodging tax code, the service fee with service tax code, and the cleaning fee. Stripe handles the PCI-compliant payment page. After successful payment, our webhook receives the `checkout.session.completed` event, creates the booking record, allocates funds to escrow, and triggers email confirmations to both the renter and the owner. If the payment session expires without completion, the `checkout.session.expired` event cleans up the pending records."

### Step 7: My Bookings

**Navigate to:** `/my-bookings`

**What to show:**
1. The tabs: All, Upcoming, Past
2. A booking card showing: property name, dates, status badge, total paid
3. The "Cancel Booking" button (explain the cancellation policy applies)
4. The "Report Issue" button for dispute resolution

> **Talking point:**
> "After booking, the renter can manage everything from the My Bookings page. They see all their reservations organized by upcoming and past. Each booking shows the status -- confirmed, checked in, completed, or cancelled. They can cancel a booking, but the refund amount depends on the cancellation policy the owner set: flexible gives a full refund up to 24 hours before check-in, moderate gives 50% up to 5 days before, strict gives 50% up to 14 days before, and super strict is non-refundable after booking."

### Step 8: Travel Requests

**What to show:**
1. On the Rentals page, scroll to show the "Post a Travel Request" CTA
2. Click to open the Travel Request form
3. Walk through: destination, dates, budget, number of guests, special requirements
4. Explain how owners receive matching requests and can submit proposals

> **Talking point:**
> "If a renter cannot find exactly what they want in the current listings, they can post a travel request. This flips the marketplace -- instead of browsing, the renter says 'I want to go to Maui in June for under $2000' and owners with matching inventory can submit proposals. Our matching engine connects requests with relevant property owners automatically."

### Step 9: Name Your Price

**Navigate to:** `/bidding`

**What to show:**
1. The Name Your Price marketplace with active listings with flexible pricing
2. Show how offer status is tracked
3. Navigate to `/my-bids` to show the renter's offer history

> **Talking point:**
> "The Name Your Price marketplace is where the negotiation happens. Renters can browse all listings that have flexible pricing, see the listing price, and place their offer. The My Offers page tracks all their active and past offers with status updates -- pending, accepted, countered, or declined. Real-time notifications keep them informed when an owner responds."

### Step 10: Account Settings

**Navigate to:** `/account`

**What to show:**
1. Profile section: name, email, phone number editing
2. Password change section
3. Role display with role badges
4. Notification preferences with toggle switches for each email category
5. Data & Privacy section: data export and account deletion
6. The GDPR deletion flow: request deletion, 14-day grace period, cancel option

> **Talking point:**
> "Account Settings gives users full control over their profile and data. They can update their contact information, change their password, and manage notification preferences granularly -- choose which types of emails they want to receive. The Data & Privacy section is GDPR-compliant: users can export all their data across 14 database tables as a JSON download, or request account deletion. Deletion has a 14-day grace period where they can change their mind. After 14 days, their data is anonymized and personal information is permanently removed."

### Common Questions

| Question | Answer |
|----------|--------|
| "Is voice search available on mobile?" | "Yes, voice search works on any device with a microphone. The browser requests microphone permission, and the VAPI pipeline handles the rest." |
| "How does the Fair Value score work?" | "We compare the listing's nightly rate against historical pricing data for the same resort, unit type, and season. The score factors in comparable listings and market averages to determine if the price is below, at, or above fair value." |
| "What payment methods are accepted?" | "We use Stripe Checkout, which supports all major credit and debit cards, Apple Pay, Google Pay, and other local payment methods depending on the renter's region." |
| "What if there is a problem with the stay?" | "Renters can report issues through the 'Report Issue' button on their booking. This creates a dispute that our admin team investigates. We can process partial or full refunds depending on the situation." |
| "Can I save listings to view later?" | "Yes, there is a favorites heart icon on each listing card. Favorited listings are saved to your account and can be accessed from the header navigation." |

---

## 5. RAV Admin & Executive Dashboard

**Estimated time:** 10-12 minutes

### Step 1: Admin Dashboard Overview

**Navigate to:** `/admin` (log in as RAV admin)

**What to show:**
1. The admin header with the shield icon and "RAV Admin Dashboard" title
2. The full tab bar showing all 18 tabs (scroll horizontally on smaller screens):
   - Overview, Properties, Listings, Bookings, Escrow, Issues, Disputes, Verifications, Financials, Tax & 1099, Payouts, Users, Approvals, Memberships, Settings, Voice, Dev Tools (DEV only)
3. The Overview tab with platform-wide statistics

> **Talking point:**
> "The Admin Dashboard is the command center for the entire platform. It has 17 operational tabs covering every aspect of marketplace management. The Overview tab gives you real-time stats: total users, properties, active listings, bookings, revenue, and pending approvals. Notice the notification badge on the Approvals tab -- that shows how many users and listings are waiting for review."

### Step 2: Listing Management

**What to show:**
1. Click the "Listings" tab
2. Show the listing table with status badges (pending, approved, active, expired)
3. Show the SLA age badges (green for recent, yellow for aging, red for overdue)
4. Click on a pending listing to show the approval dialog
5. Demonstrate approve and reject flows

> **Talking point:**
> "Listing management is where quality control happens. Every new listing arrives in a pending state. The admin reviews the details -- pricing, dates, property verification status -- and approves or rejects with a reason. We track SLA age, so nothing sits in the queue too long. The admin can filter by owner, status, brand, and date range. Bulk actions are available for efficiency."

### Step 3: Booking Oversight

**What to show:**
1. Click the "Bookings" tab
2. Show the booking table with filters (date range, status, search)
3. Click on a booking to show cross-linked entities (renter, owner, listing, property)
4. Show admin notes capability

> **Talking point:**
> "The Bookings tab gives full visibility into every transaction on the platform. Admins can filter by date range, status, or search for specific bookings. Each booking links to the renter profile, owner profile, listing, and property -- so you can trace the full chain. Admin notes allow internal documentation for any booking-specific issues."

### Step 4: Escrow Tracking

**What to show:**
1. Click the "Escrow" tab
2. Show escrow records with verification status
3. Demonstrate the release and refund action buttons
4. Show the escrow lifecycle states: pending, verified, released, refunded

> **Talking point:**
> "Escrow is how we protect both sides of the transaction. When a renter pays, the funds are held in escrow until the booking is verified and the stay is completed. The admin can see the verification status of each escrow record and take action -- either release the funds to the owner after a successful stay, or process a refund to the renter if there is an issue."

> **Key detail for financial audiences:**
> "The escrow system provides a clear audit trail. Every state transition is timestamped, and the admin who performed the action is recorded. This is essential for financial compliance and dispute resolution. The escrow release triggers the Stripe Transfer to the owner's connected bank account via Stripe Connect."

### Step 5: Dispute Resolution

**What to show:**
1. Click the "Disputes" tab
2. Show the dispute queue with assignment and status tracking
3. Walk through a dispute: renter report, admin investigation, resolution options
4. Show the refund processing flow

> **Talking point:**
> "When a renter reports an issue, it creates a dispute in this queue. The admin can assign it to a team member, investigate by reviewing the booking details and communications, and process a resolution -- which can include a partial or full refund through Stripe. The entire dispute lifecycle is tracked: submitted, investigating, resolved, or rejected."

### Step 6: Financial Reporting

**What to show:**
1. Click the "Financials" tab
2. Show revenue breakdown: total bookings, total revenue, total commissions, total payouts
3. Show monthly revenue trends

> **Talking point:**
> "The Financials tab is the business health dashboard. It shows total booking volume, gross revenue, the commissions we have earned, and the payouts to owners. Monthly trends let you see growth trajectories and seasonal patterns."

### Step 7: Tax & 1099-K Reporting

**What to show:**
1. Click the "Tax & 1099" tab
2. Show the annual summary with total revenue and owner earnings
3. Show the monthly revenue table
4. Explain the $600 threshold for 1099-K reporting and W-9 status tracking

> **Talking point:**
> "Tax reporting is critical for a marketplace. The Tax tab tracks annual revenue, monthly breakdowns, and individual owner earnings. We monitor the $600 IRS threshold for 1099-K reporting -- any owner earning above that amount needs to receive a 1099-K. We also track W-9 status to ensure we have the necessary tax documentation before processing year-end tax forms."

### Step 8: User Management

**What to show:**
1. Click the "Users" tab
2. Show the user table with role badges, approval status, and join dates
3. Click on a user to show their full profile, properties, and booking history
4. Click the "Approvals" tab to show pending user approvals and role upgrade requests

> **Talking point:**
> "User management covers the full lifecycle. We can see every user on the platform, their roles, approval status, and activity. The Approvals tab is the action center -- new user registrations and role upgrade requests land here. When a renter wants to also become an owner, they submit a role upgrade request that goes through the same approval flow."

### Step 9: Voice Controls

**What to show:**
1. Click the "Voice" tab
2. Show Tier Quota Manager (view/edit quotas per membership tier)
3. Show User Override Manager (per-user quota overrides and disable toggles)
4. Show Usage Dashboard with Recharts visualization
5. Show Observability panel (voice search logs, alert thresholds)

> **Talking point:**
> "Voice Controls give us full operational oversight of the AI voice search feature. We can manage quotas per membership tier, override quotas for individual users, disable voice for specific users if needed, and monitor usage analytics in real time. The observability panel shows detailed search logs with timestamps, transcriptions, and extracted parameters -- essential for debugging and improving the AI pipeline."

### Step 10: System Settings

**What to show:**
1. Click the "Settings" tab
2. Show configurable platform settings: commission rate, Staff Only Mode toggle, and other operational settings

> **Talking point:**
> "System Settings is where we control platform-wide configuration. The most important toggle is Staff Only Mode -- right now it is enabled, which means only RAV team members can access the platform. When we are ready to launch, we flip this off and the platform opens to the public. The base commission rate is also configurable here, though tier-specific rates override it."

### Step 11: Executive Dashboard

**Navigate to:** `/executive-dashboard`

**What to show:**
1. The dark-themed boardroom layout
2. The headline bar with key metrics
3. Business Performance section: GMV trends, revenue charts
4. Marketplace Health: offer activity, liquidity score, offer spread index
5. Market Intelligence: competitive benchmarking, market positioning
6. Industry Feed: curated timeshare industry news
7. Unit Economics: per-booking and per-user metrics

> **Talking point:**
> "The Executive Dashboard is the boardroom-ready view. It is separate from the operational Admin Dashboard and designed for strategic decision-making. The dark theme is intentional -- it looks professional in presentations and board meetings. Key metrics include GMV trends, our proprietary Liquidity Score that measures supply-demand balance, the Offer Spread Index showing price negotiation dynamics, market intelligence from industry data sources, and unit economics like average booking value and customer acquisition cost. This page is desktop-optimized at 1024px+ for presentation screens."

### Step 12: Dev Tools (DEV Environment Only)

**What to show (if on DEV environment):**
1. Click the "Dev Tools" tab (only visible on DEV)
2. Show the seed data manager
3. Explain how seed data can populate the platform with test resorts, properties, listings, and users

> **Talking point:**
> "In our development environment, we have a Dev Tools tab that includes a seed data manager. This lets us populate the platform with realistic test data -- resorts, properties, listings, users, and bookings. It is production-guarded; the seed manager checks the environment variable and refuses to run against the production database. This is an architectural decision (DEC-015) to prevent accidental data corruption."

### Step 13: User Journeys & Documentation

**Navigate to:** `/user-journeys`

**What to show:**
1. Click through the three flow tabs: Owner Lifecycle, Traveler Lifecycle, Admin Lifecycle
2. Show how the Mermaid diagrams are interactive -- click on a node to navigate to that route

**Navigate to:** `/documentation`

**What to show:**
1. The sidebar with 23+ sections
2. Click through a few sections to show depth of internal documentation
3. Point out the print/export capability

> **Talking point:**
> "Finally, we have two documentation tools. The User Journeys page auto-generates interactive architecture diagrams from our codebase -- they are never out of date because they are generated from the same flow manifest files that define our routes and components. The Documentation page is a comprehensive 23-section internal manual covering every aspect of the platform: user management, booking flows, payment processing, voice search, dispute resolution, and more. It is accessible only to RAV team members and can be printed for offline reference."

### Admin Tab Quick Reference

For quick navigation during the demo, here is what each admin tab contains:

| Tab | Content | Key Actions |
|-----|---------|-------------|
| Overview | Platform-wide stats, quick links | At-a-glance health check |
| Properties | All registered properties | Search, filter by owner/brand |
| Listings | All listings with status | Approve, reject, filter by status |
| Bookings | All bookings with filters | Date range filter, admin notes |
| Escrow | Payment escrow records | Release funds, process refunds |
| Issues | Check-in problems reported | Assign, investigate, resolve |
| Disputes | Formal dispute cases | Assign, investigate, refund |
| Verifications | Owner/property verification docs | Review and approve documentation |
| Financials | Revenue, commission, trends | Monthly/annual reporting |
| Tax & 1099 | IRS reporting, W-9 tracking | 1099-K threshold monitoring |
| Payouts | Owner payout history | Initiate Stripe transfers |
| Users | All user accounts | Search, view profiles, admin notes |
| Approvals | Pending users + role requests | Approve/reject with reasons |
| Memberships | Tier management | View subscription status |
| Settings | Platform configuration | Commission rate, Staff Only Mode |
| Voice | Voice search operations | Quotas, overrides, analytics, logs |
| Dev Tools | Seed data (DEV only) | Populate test data |

### Common Questions

| Question | Answer |
|----------|--------|
| "How many admin staff are needed to operate?" | "Currently the platform is designed for a small team of 2-3 admins. The approval workflows, SLA tracking, and notification system are designed to keep response times fast without a large team." |
| "Can we white-label this for other timeshare companies?" | "The architecture is modular enough to support white-labeling, but that is not on the current roadmap. The brand, commission rates, and resort data are configurable through the admin settings." |
| "What reporting integrations are available?" | "The Executive Dashboard pulls data from internal analytics and external sources (AirDNA, STR data, macro indicators, industry news). We also have GA4 and PostHog for deeper analytics drilling." |
| "Is there an API for third-party integrations?" | "The Supabase backend exposes a RESTful API through PostgREST, and the edge functions provide custom API endpoints. A formal public API is planned for a future phase." |
| "How do you handle tax reporting?" | "We track all owner earnings and flag owners approaching the $600 IRS threshold for 1099-K reporting. W-9 collection status is tracked per owner. Stripe Tax integration is code-ready but awaiting business formation for activation." |

---

## Appendix A: Demo Environment Setup

### Accounts Needed

| Account Type | Purpose | How to Create |
|-------------|---------|---------------|
| RAV Admin | Full platform access, admin/executive dashboards | Use the existing RAV admin account on DEV |
| Property Owner | Owner dashboard, listings, earnings | Create via `/signup` with "Property Owner" role, approve via admin |
| Renter | Browsing, booking, making offers | Create via `/signup` with "Renter" role, approve via admin |

### Pre-Demo Checklist

- [ ] Verify DEV environment is running (check dev.rent-a-vacation.com or local `npm run dev`)
- [ ] Log in with RAV Admin account and verify Admin Dashboard loads
- [ ] Ensure there are active listings visible on `/rentals` (seed data if needed)
- [ ] Test microphone permissions for voice search demo
- [ ] Have Stripe test card numbers ready (4242 4242 4242 4242)
- [ ] Clear browser cookies/cache for a clean demo experience
- [ ] Close unnecessary browser tabs to avoid distractions
- [ ] Set browser zoom to 100% for consistent UI sizing

### Stripe Test Cards

| Card Number | Result |
|------------|--------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 3220 | Requires 3D Secure |

Use any future expiration date, any 3-digit CVC, and any ZIP code.

### URLs Quick Reference

| Page | URL | Access |
|------|-----|--------|
| Homepage | `/` | Public |
| Rentals | `/rentals` | Authenticated |
| Property Detail | `/property/:id` | Authenticated |
| Calculator | `/calculator` | Public |
| How It Works | `/how-it-works` | Public |
| Destinations | `/destinations` | Public |
| FAQ | `/faq` | Public |
| Owner Dashboard | `/owner-dashboard` | Property Owner |
| Admin Dashboard | `/admin` | RAV Admin |
| Executive Dashboard | `/executive-dashboard` | RAV Admin |
| User Journeys | `/user-journeys` | Public |
| Documentation | `/documentation` | RAV Admin |
| My Bookings | `/my-bookings` | Authenticated |
| My Offers | `/my-bids` | Authenticated |
| Account Settings | `/account` | Authenticated |
| Name Your Price | `/bidding` | Authenticated |
| User Guide | `/user-guide` | Public |
| Contact | `/contact` | Public |

---

## Appendix B: Key Metrics Summary

Keep these numbers handy for when stakeholders ask during the demo.

| Metric | Value | Source |
|--------|-------|--------|
| Partner resorts | 117 | Database (62 Hilton, 40 Marriott, 15 Disney) |
| Vacation club brands | 9 | calculatorLogic.ts `VACATION_CLUB_BRANDS` |
| Unit types | 351 | Database |
| Countries | 10+ | Database |
| Base commission rate | 15% | pricing.ts `RAV_MARKUP_RATE` |
| Pro commission | 13% | Membership tier config |
| Business commission | 10% | Membership tier config |
| Database migrations | 29 | `supabase/migrations/` |
| Edge functions | 25 | `supabase/functions/` |
| Automated tests | 415 | Vitest (58 test files) |
| Coverage thresholds | 25% stmt / 25% branch / 30% func | CI enforced |
| App version | v0.9.0 | Footer |
| Voice quotas (Free) | 5/day | System settings |
| Voice quotas (Plus/Pro) | 25/day | System settings |
| Voice quotas (Premium/Business) | Unlimited | System settings |

---

## Appendix C: Narrative Flow for Different Audiences

### For Investors (30-minute version)
1. High-Level Overview (5 min) -- Focus on market opportunity and business model
2. Renter Journey Steps 1-6 (10 min) -- Show the user experience and conversion funnel
3. Owner Journey Steps 1, 4, 8-10 (5 min) -- Focus on value prop and retention mechanics
4. Executive Dashboard only (5 min) -- Show GMV, unit economics, market intelligence
5. Tech Stack overview (5 min) -- Emphasize scalability, security, and AI features

### For Property Owners (20-minute version)
1. High-Level Overview (3 min) -- Focus on the owner value proposition
2. Owner Journey Steps 2-10 (12 min) -- Full walkthrough of their experience
3. Breakeven Calculator deep dive (5 min) -- Let them input their own numbers

### For Technical Partners (30-minute version)
1. Tech Stack & Architecture (10 min) -- Full deep dive with code-level details
2. Admin Dashboard Steps 1-5 (10 min) -- Show operational depth
3. User Journeys page (5 min) -- Show auto-generated architecture docs
4. Security and GDPR features (5 min) -- CSP, RLS, rate limiting, data export/deletion

### For Potential Renters (15-minute version)
1. High-Level Overview (2 min) -- Focus on savings
2. Renter Journey Steps 1-7 (10 min) -- Browse, search, book flow
3. Voice search and RAVIO demo (3 min) -- Show the AI-powered discovery

---

## Appendix D: Troubleshooting Common Demo Issues

| Issue | Solution |
|-------|----------|
| "Staff Only Mode" blocking access | Log in as RAV admin first, or toggle off in Admin > Settings |
| Voice search not working | Check microphone permissions in browser, verify VAPI API key is set |
| Listings page shows no results | Run the seed manager from Admin > Dev Tools (DEV environment only) |
| Stripe checkout fails | Ensure `STRIPE_SECRET_KEY` is set in edge function secrets, use test card numbers |
| Images not loading | Check Supabase storage bucket permissions, or use Unsplash fallback images |
| Login redirects to pending approval | Use a pre-approved account, or approve the account from Admin > Approvals |
| Executive Dashboard shows mobile-only message | Use a desktop browser at 1024px+ width or zoom out |
| Chat responses are slow | OpenRouter API may be rate-limited; wait 10 seconds and retry |
| Edge function errors | Check Supabase dashboard > Edge Functions > Logs for specific error messages |

---

## Appendix E: Closing the Demo

### Closing Statement

> **Talking point:**
> "To summarize: Rent-A-Vacation is a purpose-built marketplace for timeshare vacation rentals. We have 117 partner resorts across 9 brands, a fully functional two-sided marketplace with payments, escrow, and dispute resolution, AI-powered search with both voice and text, comprehensive admin tooling, and enterprise-grade security. The platform is at v0.9.0 -- feature-complete for launch. We are in the final pre-launch phase, completing business formation, activating Stripe Tax, and onboarding our initial inventory of property owners."

### Call to Action (Customize per Audience)

**For investors:**
> "We are looking for partners who understand the $10.5 billion timeshare industry and see the opportunity in bringing it online. I would love to share our financial projections and growth model in a follow-up conversation."

**For property owners:**
> "If you have timeshare weeks sitting unused, you can start listing them today. The calculator we showed estimates your breakeven, and most owners cover their annual maintenance fees by renting just 1-2 weeks. Sign up and we will get you approved within 48 hours."

**For technical partners:**
> "Our architecture is built for extensibility. Whether you are interested in API integrations, white-label partnerships, or contributing to the platform, we would love to explore how to work together."

### Follow-Up Materials

- **Website:** https://rent-a-vacation.com
- **Calculator:** https://rent-a-vacation.com/calculator
- **How It Works:** https://rent-a-vacation.com/how-it-works
- **Contact:** https://rent-a-vacation.com/contact

---

*This document is a living script. Update it as new features are added to the platform. Last verified against codebase: February 28, 2026.*
