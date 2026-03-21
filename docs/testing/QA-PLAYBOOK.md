---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-40"
status: "active"
---
# QA Testing Playbook — Rent-A-Vacation

**Version:** 1.0
**Date:** March 14, 2026
**Classification:** For Authorized Team Members
**Platform:** Rent-A-Vacation — The Timeshare Owner's Marketplace

---

## About Rent-A-Vacation

Rent-A-Vacation (RAV) is a peer-to-peer marketplace connecting timeshare owners with travelers seeking premium vacation rentals at below-market rates. The platform handles property listing, bidding, booking, payment (via Stripe), and post-stay operations with a 15% commission model.

**Purpose of this document:** Step-by-step manual QA reference for team testers. Follow each scenario, mark Pass/Fail, and file bugs via GitHub Issues.

---

## Quick Reference Card

### Environment

| Item | Value |
|------|-------|
| **DEV URL** | `https://dev.rent-a-vacation.com` |
| **PROD URL** | `https://rent-a-vacation.com` (DO NOT test here) |
| **Stripe Dashboard** | `https://dashboard.stripe.com` (toggle to Test mode) |
| **GitHub Issues** | `https://github.com/rent-a-vacation/rav-website/issues` |

### Foundation Accounts (Layer 1 — Never Deleted)

**Universal password for all accounts:** `SeedTest2026!`

#### RAV Team

| Email | Role | Access Level |
|-------|------|-------------|
| `dev-owner@rent-a-vacation.com` | RAV Owner | Full admin — all tabs visible |
| `dev-admin@rent-a-vacation.com` | RAV Admin | Admin — all tabs visible |
| `dev-staff@rent-a-vacation.com` | RAV Staff | Staff — 10 operational tabs only |

#### Property Owners

| Email | Name | Brand |
|-------|------|-------|
| `owner1@rent-a-vacation.com` | Alex Rivera | Hilton Grand Vacations |
| `owner2@rent-a-vacation.com` | Maria Chen | Marriott Vacation Club |
| `owner3@rent-a-vacation.com` | James Thompson | Disney Vacation Club |
| `owner4@rent-a-vacation.com` | Priya Patel | Wyndham Destinations |
| `owner5@rent-a-vacation.com` | Robert Kim | Bluegreen Vacations |

#### Renters (Layer 3 — Recreated on Reseed)

- 50 accounts: `renter001@rent-a-vacation.com` through `renter050@rent-a-vacation.com`
- Password: `SeedTest2026!`

### Stripe Test Cards

| Scenario | Card Number | Expected |
|----------|-------------|----------|
| **Success (default)** | `4242 4242 4242 4242` | Payment completes |
| **Visa debit** | `4000 0566 5566 5556` | Payment completes |
| **Mastercard** | `5555 5555 5555 4444` | Payment completes |
| **Amex** (4-digit CVC) | `3782 822463 10005` | Payment completes |
| **Insufficient funds** | `4000 0000 0000 9995` | Decline — error shown |
| **Generic decline** | `4000 0000 0000 0002` | Decline — error shown |
| **Expired card** | `4000 0000 0000 0069` | Decline — error shown |
| **3D Secure** | `4000 0027 6000 3184` | Auth popup → complete it |
| **3DS fails** | `4000 0084 0000 1629` | Auth popup → payment declined |

For all test cards: use any future expiry (e.g., `12/28`), any 3-digit CVC (e.g., `123`), any ZIP (e.g., `32256`).

### How to Reseed DEV Data

1. Log in as any RAV team account on DEV
2. Navigate to Admin Dashboard → Dev Tools tab
3. Click "Refresh" to see current data counts
4. Click "Reset & Reseed DEV" and confirm
5. Wait 30–60 seconds for completion

### How to Report Bugs

Create a GitHub Issue:
```
Title: Bug: [short description]
Labels: bug, [area: platform/marketplace/experience]
Body:
  - Steps to reproduce
  - Expected behavior
  - Actual behavior
  - Screenshot (if applicable)
  - Account used
  - Browser/device
```

---

## Role 1: Traveler (Renter)

> **Log in as:** `renter001@rent-a-vacation.com` / `SeedTest2026!`

### Discovery & Search

#### TC-T-001: Browse the Landing Page

**Page:** `/`
**Steps:**
1. Navigate to `dev.rent-a-vacation.com`
2. Observe the hero section, featured resorts, and CTA buttons
3. Click "Browse Rentals" or similar CTA

**Expected:** Landing page loads with header, hero, featured listings, and footer. CTA navigates to `/rentals`.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-002: How It Works Page

**Page:** `/how-it-works`
**Steps:**
1. Navigate to `/how-it-works`
2. Review the traveler and owner sections
3. Check the pricing section

**Expected:** Page explains the platform for both travelers and owners. Commission rate shown as 15%.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-003: Browse Vacation Rentals

**Page:** `/rentals`
**Steps:**
1. Navigate to `/rentals`
2. Observe the listing grid
3. Verify each listing card shows: resort name, location, dates, nightly rate, total price

**Expected:** Listings load with property cards. Prices show nightly rate with RAV markup.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-004: Search by Location

**Page:** `/rentals`
**Steps:**
1. On `/rentals`, type "Orlando" in the search bar
2. Press Enter or click search
3. Observe filtered results

**Expected:** Only listings in Orlando (or with Orlando in resort name) appear.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-005: Filter and Sort Listings

**Page:** `/rentals`
**Steps:**
1. On `/rentals`, use brand/location/date/price filters
2. Change sort order (price low→high, price high→low, newest)
3. Clear filters

**Expected:** Listings update immediately. Sort order changes. Clearing filters shows all listings.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-006: Voice Search

**Page:** `/rentals`
**Steps:**
1. On `/rentals`, click the microphone/voice search button
2. Say "I want a 2-bedroom in Orlando for next month"
3. Wait for results

**Expected:** Voice assistant processes the query and filters listings. Results match spoken criteria.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-007: Text Chat with RAVIO

**Page:** Any page (floating chat widget)
**Steps:**
1. Click the RAVIO chat icon (bottom-right)
2. Type "What timeshare resorts do you have in Hawaii?"
3. Wait for response

**Expected:** RAVIO responds with relevant resort information. Chat is conversational and helpful.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-008: Explore Destinations

**Page:** `/destinations`
**Steps:**
1. Navigate to `/destinations`
2. Browse the destination cards (10 destinations)
3. Click on a destination (e.g., Orlando)
4. Click on a specific city within that destination

**Expected:** Destination grid loads. Clicking shows destination detail with cities and related listings.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

### Property Detail & Comparison

#### TC-T-009: View Property Detail

**Page:** `/property/:id`
**Steps:**
1. From `/rentals`, click on any listing card
2. Review: photos, description, amenities, pricing breakdown, cancellation policy
3. Check the Fair Value badge/score
4. Check the "Ask the Owner" button

**Expected:** Full property detail loads. Price breakdown shows nightly rate, number of nights, RAV fee, total. Cancellation policy displayed with color-coded refund tiers.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-010: Compare Properties

**Page:** `/rentals`
**Steps:**
1. On `/rentals`, toggle "Compare" mode
2. Select 2–3 listings using checkboxes
3. Click "Compare Selected" in the floating bar
4. Review the comparison dialog

**Expected:** Side-by-side comparison shows price, location, bedrooms, amenities. "Best" badges highlight best values. Max 3 listings.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-011: Save a Search

**Page:** `/rentals`
**Steps:**
1. Apply filters on `/rentals` (e.g., Orlando, 2 bedrooms)
2. Click "Save Search" button
3. Navigate to `/my-trips` → Favorites tab

**Expected:** Search is saved. Appears in saved searches list with option to re-run or delete. Price drop badges appear when prices change.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-012: Add to Favorites

**Page:** `/property/:id`
**Steps:**
1. On a property detail page, click the heart/favorite icon
2. Navigate to `/my-trips` → Favorites tab

**Expected:** Property appears in favorites. Can be removed by clicking heart again.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

### Bidding & Offers

#### TC-T-013: Place a Bid on a Listing

**Page:** `/property/:id` (bidding-enabled listing)
**Steps:**
1. Find a listing with "Open for Bidding" badge
2. Click "Place Bid"
3. Enter a bid amount
4. Submit the bid

**Expected:** Bid is submitted. Confirmation toast shown. Bid appears in `/my-trips` → Offers tab.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-014: Submit a Date Proposal

**Page:** `/property/:id`
**Steps:**
1. On a listing detail, click "Propose Different Dates"
2. Select check-in and check-out dates
3. Observe auto-computed bid amount based on nightly rate
4. Submit the date proposal

**Expected:** Date proposal sent. Auto-computed price reflects nightly rate × nights with 15% markup.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-015: Create a Travel Request

**Page:** `/bidding`
**Steps:**
1. Navigate to `/bidding`
2. Click "Post Travel Request"
3. Fill in destination, dates, guests, budget
4. Submit

**Expected:** Travel request created. Appears in the marketplace for owners to see.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-016: Create Inspired Travel Request from Listing

**Page:** `/property/:id`
**Steps:**
1. On a listing detail, click "Request Similar" or "Send to this Owner"
2. Review pre-filled form (destination, dates from listing)
3. Toggle "Send to this owner first" option
4. Submit

**Expected:** Travel request created with pre-filled data. If "owner first" toggled, request is targeted.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-017: View My Offers

**Page:** `/my-trips?tab=offers`
**Steps:**
1. Navigate to `/my-trips` → Offers tab
2. Review submitted bids and their statuses

**Expected:** All bids listed with status (pending, accepted, rejected, expired).
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

### Booking & Payment

#### TC-T-018: Checkout — Successful Payment

**Page:** `/checkout`
**Steps:**
1. From a listing detail, click "Book Now" (or have an accepted bid)
2. Review booking summary on checkout page
3. Verify fee breakdown: nightly rate, number of nights, RAV fee, total
4. Enter Stripe test card: `4242 4242 4242 4242`, expiry `12/28`, CVC `123`
5. Complete payment

**Expected:** Payment succeeds. Redirect to `/booking-success` with confirmation details and booking timeline.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-019: Checkout — Declined Card

**Page:** `/checkout`
**Steps:**
1. On checkout, enter card `4000 0000 0000 9995` (insufficient funds)
2. Attempt payment

**Expected:** Payment fails. Error message displayed (e.g., "Your card has insufficient funds"). No booking created.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-020: Checkout — 3D Secure Card

**Page:** `/checkout`
**Steps:**
1. On checkout, enter card `4000 0027 6000 3184`
2. Complete the 3D Secure authentication popup
3. Observe result

**Expected:** 3DS popup appears. After "Complete authentication", booking succeeds normally.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-021: Booking Success Page

**Page:** `/booking-success`
**Steps:**
1. After successful checkout, observe the booking success page
2. Check booking timeline (5 steps: Booked → Confirmed → Check-in → Stay → Complete)
3. Verify confirmation details

**Expected:** Booking timeline shows "Booked" as complete, remaining steps upcoming. Confirmation number displayed.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

### Renter Dashboard

#### TC-T-022: My Trips — Overview Tab

**Page:** `/my-trips`
**Steps:**
1. Navigate to `/my-trips`
2. Review the Overview tab: upcoming trips, check-in countdown, quick stats

**Expected:** Overview shows upcoming bookings with countdown timer. Stats include total trips and money saved.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-023: My Trips — Bookings Tab

**Page:** `/my-trips?tab=bookings`
**Steps:**
1. Click the Bookings tab
2. Review past and upcoming bookings
3. Click on a booking to view details

**Expected:** All bookings listed with status badges. Can view booking details, timeline, and messaging.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-024: My Trips — Offers Tab

**Page:** `/my-trips?tab=offers`
**Steps:**
1. Click the Offers tab
2. Review submitted bids and travel requests

**Expected:** Bids and proposals listed with current status.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-025: My Trips — Favorites Tab

**Page:** `/my-trips?tab=favorites`
**Steps:**
1. Click the Favorites tab
2. Review saved properties and saved searches

**Expected:** Favorited properties and saved searches displayed. Price drop badges if applicable.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

### Post-Booking Actions

#### TC-T-026: Cancel a Booking (Renter)

**Page:** `/my-trips?tab=bookings`
**Steps:**
1. Find an active booking in My Trips → Bookings
2. Click "Cancel Booking"
3. Review cancellation policy and refund amount in the dialog
4. Confirm cancellation

**Expected:** Cancellation dialog shows policy-based refund (flexible/moderate/strict/super_strict). After confirming, booking status changes and Stripe refund is processed.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-027: Report an Issue (Renter)

**Page:** `/my-trips?tab=bookings`
**Steps:**
1. Find a booking and click "Report Issue"
2. Select issue category
3. Describe the problem and optionally upload evidence
4. Submit

**Expected:** Issue/dispute created. Appears in admin disputes queue.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-028: Traveler Check-In

**Page:** `/checkin`
**Steps:**
1. Navigate to `/checkin`
2. Find an upcoming booking eligible for check-in
3. Complete the check-in process

**Expected:** Check-in status updated. Booking timeline reflects check-in completion.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-029: Pre-Booking Inquiry (Ask the Owner)

**Page:** `/property/:id`
**Steps:**
1. On a property detail page, click "Ask the Owner"
2. Type a question in the inquiry dialog
3. Send the message

**Expected:** Inquiry created. Owner receives notification. Reply thread works for back-and-forth.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-030: Booking Message Thread

**Page:** `/my-trips?tab=bookings` → booking detail
**Steps:**
1. Open a booking detail
2. Send a message in the message thread
3. Observe realtime updates (no page refresh needed)

**Expected:** Message sends instantly. Realtime subscription shows new messages without polling.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

### Account & Tools

#### TC-T-031: Account Settings

**Page:** `/account`
**Steps:**
1. Navigate to `/account`
2. Update profile information (name, phone)
3. Change password
4. Review membership tier
5. Check notification preferences

**Expected:** Profile updates save. Password change works. Membership tier displayed correctly.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-032: RAV SmartEarn (Maintenance Fee Calculator)

**Page:** `/calculator`
**Steps:**
1. Navigate to `/calculator` (or `/tools` → SmartEarn)
2. Select a brand (e.g., Hilton Grand Vacations)
3. Enter maintenance fee amount
4. Toggle yield estimator mode
5. Review breakeven analysis and charts

**Expected:** Calculator shows breakeven point, listing price to cover fees, and yield estimate. 9 brands available.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-033: RAV SmartCompare (Cost Comparator)

**Page:** `/tools/cost-comparator`
**Steps:**
1. Navigate to `/tools/cost-comparator`
2. Enter comparison parameters
3. Review cost comparison results

**Expected:** Side-by-side comparison of timeshare rental vs. hotel/other options.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-034: RAV SmartMatch (Resort Quiz)

**Page:** `/tools/resort-quiz`
**Steps:**
1. Navigate to `/tools/resort-quiz`
2. Answer the quiz questions about preferences
3. Review matched resorts

**Expected:** Quiz recommends resorts based on answers. Results link to relevant listings.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-035: RAV SmartBudget (Budget Planner)

**Page:** `/tools/budget-planner`
**Steps:**
1. Navigate to `/tools/budget-planner`
2. Enter budget parameters
3. Review vacation budget plan

**Expected:** Budget breakdown showing what's affordable within the given budget.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-036: RAV Smart Suite Hub

**Page:** `/tools`
**Steps:**
1. Navigate to `/tools`
2. Verify all 5 tools are listed: SmartEarn, SmartPrice, SmartCompare, SmartMatch, SmartBudget
3. Click each tool card

**Expected:** Hub page shows all tools with descriptions. Each card links to the correct tool page.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-037: FAQ Page

**Page:** `/faq`
**Steps:**
1. Navigate to `/faq`
2. Expand/collapse FAQ sections
3. Search within FAQs if search is available

**Expected:** FAQs organized by category. Accordion expand/collapse works.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-T-038: Contact Page

**Page:** `/contact`
**Steps:**
1. Navigate to `/contact`
2. Fill in the contact form
3. Submit

**Expected:** Form submits. Confirmation message shown. Email sent via edge function.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

---

## Role 2: Property Owner

> **Log in as:** `owner1@rent-a-vacation.com` (Alex Rivera) / `SeedTest2026!`

### Listing a Property

#### TC-O-001: List Property — Step 1 (Property Details)

**Page:** `/list-property`
**Steps:**
1. Navigate to `/list-property`
2. Select a brand (e.g., Hilton Grand Vacations)
3. Enter resort name, unit details (bedrooms, bathrooms, sleeps)
4. Add location, description, and amenities
5. Proceed to Step 2

**Expected:** Form validates required fields. Draft is auto-saved. Brand selection shows relevant resorts.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-002: List Property — Step 2 (Pricing)

**Page:** `/list-property` (step 2)
**Steps:**
1. Enter nightly rate
2. Observe live price summary (nightly rate × nights + 15% RAV markup = total)
3. Check pricing suggestion from market data
4. Set check-in/check-out dates
5. Choose cancellation policy (flexible/moderate/strict/super_strict)

**Expected:** Price summary updates in real-time. Pricing suggestion shows market range with competitive label. Cancellation policy options clearly described.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-003: List Property — Step 3 (Review & Submit)

**Page:** `/list-property` (step 3)
**Steps:**
1. Review all property and listing details
2. Submit for approval
3. Check that listing appears in Owner Dashboard as "pending"

**Expected:** Summary shows all entered data. After submission, listing status is "pending_approval". Redirects to Owner Dashboard.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-004: Save Draft and Resume

**Page:** `/list-property`
**Steps:**
1. Start listing a property, fill in some fields
2. Navigate away (e.g., go to `/rentals`)
3. Return to `/list-property`

**Expected:** Draft is preserved. Previously entered data loads when returning.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-005: Enable Bidding on a Listing

**Page:** `/owner-dashboard` → My Listings
**Steps:**
1. Find an approved listing
2. Toggle "Open for Bidding"
3. Set bidding duration (7–14 days)

**Expected:** Listing appears in `/bidding` marketplace. Bidding badge shows on the listing.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

### Owner Dashboard

#### TC-O-006: Owner Dashboard — Overview Tab

**Page:** `/owner-dashboard`
**Steps:**
1. Navigate to `/owner-dashboard`
2. Review headline stats: total listings, active bookings, earnings, fees coverage
3. Check earnings timeline chart
4. Review maintenance fee tracker

**Expected:** KPI cards show correct counts. Earnings chart displays monthly data. Fees coverage percentage calculated from `annual_maintenance_fees`.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-007: Owner Dashboard — My Listings Tab

**Page:** `/owner-dashboard?tab=my-listings`
**Steps:**
1. Click "My Listings" tab
2. Review all properties and their listings
3. Edit a listing's nightly rate
4. Observe live price recalculation

**Expected:** All owned properties and listings displayed. Editing nightly rate recalculates total with 15% markup.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-008: Owner Dashboard — Bookings & Earnings Tab

**Page:** `/owner-dashboard?tab=bookings-earnings`
**Steps:**
1. Click "Bookings & Earnings" tab
2. Review booking list with statuses
3. Expand earnings section
4. Check payout history

**Expected:** Bookings listed with status badges. Earnings breakdown shows gross, RAV commission, net.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-009: Owner Dashboard — Account Tab

**Page:** `/owner-dashboard?tab=account`
**Steps:**
1. Click "Account" tab
2. Review profile summary
3. Check referral dashboard section
4. Review membership tier

**Expected:** Profile info displayed. Referral code and stats visible. Membership tier shown.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

### Booking Management

#### TC-O-010: Respond to a Bid

**Page:** `/owner-dashboard?tab=bookings-earnings`
**Steps:**
1. Find a pending bid notification
2. Review the bid details (amount, dates, traveler)
3. Accept or reject the bid

**Expected:** Accepting creates a booking for the renter to pay. Rejecting notifies the renter.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-011: Confirm a Booking

**Page:** `/owner-dashboard?tab=bookings-earnings`
**Steps:**
1. Find a booking in "pending_confirmation" status
2. Review booking details
3. Click "Confirm Booking"

**Expected:** Booking moves to "confirmed" status. Renter notified. Escrow released on schedule.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-012: Cancel a Booking (Owner)

**Page:** `/owner-dashboard?tab=bookings-earnings`
**Steps:**
1. Find an active booking
2. Click "Cancel Booking"
3. Review the cancellation terms (owner cancellation = full refund to renter)
4. Confirm

**Expected:** Booking cancelled. Renter receives full refund. Owner's cancellation count increments.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-013: Report an Issue (Owner)

**Page:** `/owner-dashboard?tab=bookings-earnings`
**Steps:**
1. Find a booking and click "Report Issue"
2. Select owner-specific issue category (5 categories)
3. Upload evidence (photos)
4. Submit

**Expected:** Dispute created with evidence. Appears in admin disputes queue.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-014: Messaging — Reply to Inquiry

**Page:** `/owner-dashboard` (notifications or bookings)
**Steps:**
1. Find a pre-booking inquiry from a renter
2. Open the inquiry thread
3. Type and send a reply

**Expected:** Reply sends. Renter sees the response. Realtime updates (no refresh needed).
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-015: Messaging — Booking Thread

**Page:** `/owner-dashboard?tab=bookings-earnings`
**Steps:**
1. Open a booking detail
2. Send a message in the booking message thread

**Expected:** Message appears instantly via realtime subscription.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

### Earnings & Payouts

#### TC-O-016: iCal Calendar Export

**Page:** `/owner-dashboard?tab=bookings-earnings`
**Steps:**
1. In bookings section, click "Export Calendar"
2. Save the `.ics` file
3. Import into Google Calendar or Outlook

**Expected:** Downloads valid `.ics` file (RFC 5545). Events match booked dates.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-017: Stripe Connect Onboarding

**Page:** `/owner-dashboard?tab=bookings-earnings`
**Steps:**
1. In earnings section, find the Stripe Connect banner
2. Click "Connect with Stripe"
3. Complete Stripe's onboarding flow (Express account)
4. Return to RAV

**Expected:** Banner shows 3 states: not connected, onboarding incomplete, connected. After completion, payouts are enabled.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-018: View Earnings and Dynamic Pricing

**Page:** `/owner-dashboard?tab=bookings-earnings`
**Steps:**
1. Review earnings breakdown
2. Check pricing intelligence section
3. Observe dynamic pricing factors (urgency, season, demand)

**Expected:** Earnings show gross, commission (15%), and net. Dynamic pricing shows factor badges with percentages.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

### Referral Program

#### TC-O-019: View Referral Dashboard

**Page:** `/owner-dashboard?tab=account`
**Steps:**
1. In Account tab, find the Referral Dashboard section
2. Copy referral code
3. Review referral stats (total referrals, successful, pending)

**Expected:** Unique referral code displayed. Stats show referral funnel.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-020: Test Referral Signup Flow

**Page:** `/signup?ref=CODE`
**Steps:**
1. Copy an owner's referral code
2. Open an incognito window
3. Navigate to `dev.rent-a-vacation.com/signup?ref=CODE`
4. Complete signup

**Expected:** Referral code is captured during signup. Both referrer and referee are tracked.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

### Owner Profile & Settings

#### TC-O-021: Pricing Suggestion on Listing Form

**Page:** `/list-property` (step 2)
**Steps:**
1. While setting a nightly rate, observe the pricing suggestion
2. Check the market range bar and competitive label

**Expected:** Suggestion shows min/median/max from similar listings (same brand/location). Label shows if price is below/at/above market.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-022: Identity Verification

**Page:** `/owner-dashboard?tab=account`
**Steps:**
1. Check verification status in Account tab
2. If unverified, initiate verification process

**Expected:** Verification status clearly shown. Age verification gate functions.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-023: Membership Tier Display

**Page:** `/owner-dashboard?tab=account`
**Steps:**
1. Review current membership tier (Free/Pro/Business)
2. Check tier benefits listed

**Expected:** Correct tier displayed. Benefits match tier (Pro: −2% commission, Business: −5% commission).
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-024: Role Upgrade Request

**Page:** `/account` or `/owner-dashboard`
**Steps:**
1. As a renter account, request upgrade to property owner role
2. Observe the role upgrade dialog
3. Submit request

**Expected:** Request sent to admin. Renter sees "pending approval" state. On approval, notification + email sent, role auto-detected via realtime.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-025: Respond to Travel Request

**Page:** `/owner-dashboard` (or notifications)
**Steps:**
1. Find a travel request matching your property location
2. Submit a proposal with your listing details
3. Observe the proposal in the bidding marketplace

**Expected:** Proposal links to your listing. Traveler is notified. Proposal appears in marketplace.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-026: Owner Profile Card (Public)

**Page:** `/property/:id`
**Steps:**
1. As a renter, view a listing by owner1
2. Check the Owner Profile Card on the property detail page

**Expected:** Shows owner name, member since date, listing count, response time, verification badge.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-027: Notification Bell

**Page:** Any page (header)
**Steps:**
1. As an owner, check the notification bell in the header
2. Observe unread count
3. Click to view notifications
4. Mark notifications as read

**Expected:** Bell shows unread count. Updates in realtime. Clicking marks as read.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-O-028: Portfolio Analytics

**Page:** `/owner-dashboard`
**Steps:**
1. In the dashboard overview, review portfolio analytics
2. Check property performance metrics

**Expected:** Shows portfolio summary across all owned properties.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

---

## Role 3: RAV Staff

> **Log in as:** `dev-staff@rent-a-vacation.com` / `SeedTest2026!`

### Staff Dashboard Access

#### TC-S-001: Verify Staff Tab Access

**Page:** `/admin`
**Steps:**
1. Log in as RAV Staff
2. Navigate to `/admin`
3. Count visible tabs

**Expected:** Exactly 10 operational tabs visible: Overview, Properties, Listings, Bookings, Escrow, Check-In Issues, Disputes, Verifications, Users, Pending Approvals. Admin-only tabs (Financials, Tax, Payouts, Memberships, Launch Readiness, Settings, Voice, Resorts, API Keys, Dev Tools) are NOT visible.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-S-002: Admin Overview Tab

**Page:** `/admin` (Overview)
**Steps:**
1. Review the overview dashboard
2. Check key metrics: total users, listings, bookings, revenue

**Expected:** Summary cards show platform-wide metrics. Charts display trends.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-S-003: Properties Management

**Page:** `/admin` → Properties tab
**Steps:**
1. Click Properties tab
2. Browse property list
3. Use search/filter to find a specific property
4. View property details

**Expected:** All properties listed. Search works. Can view but may have limited edit access as staff.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-S-004: Listings Management

**Page:** `/admin` → Listings tab
**Steps:**
1. Click Listings tab
2. Browse listings with status filters (active, pending, draft, expired)
3. Click a listing to view details

**Expected:** All listings shown. Filter by status works. Details accessible.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-S-005: Bookings Management

**Page:** `/admin` → Bookings tab
**Steps:**
1. Click Bookings tab
2. Review bookings with date filters
3. Check booking statuses and SLA badges

**Expected:** All bookings listed. Date range filter works. SLA badges show time-to-action.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-S-006: Escrow Management

**Page:** `/admin` → Escrow tab
**Steps:**
1. Click Escrow tab
2. Review escrow balances
3. Check pending releases

**Expected:** Escrow entries with amounts and release dates. Pending items highlighted.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-S-007: Check-In Issues

**Page:** `/admin` → Check-In Issues tab
**Steps:**
1. Click Check-In Issues tab
2. Review reported issues
3. Check issue details and timeline

**Expected:** Check-in issues listed with severity, status, and booking reference.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-S-008: Disputes Management

**Page:** `/admin` → Disputes tab
**Steps:**
1. Click Disputes tab
2. Review disputes with category filters
3. View dispute details and evidence (photos)
4. Check both renter and owner dispute categories

**Expected:** Disputes listed with categories (5 renter + 5 owner types). Evidence thumbnails visible. Resolution workflow accessible.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-S-009: Verifications Queue

**Page:** `/admin` → Verifications tab
**Steps:**
1. Click Verifications tab
2. Review pending identity verifications
3. Process a verification (approve or request more info)

**Expected:** Pending verifications listed. Can review submitted documents.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-S-010: User Management

**Page:** `/admin` → Users tab
**Steps:**
1. Click Users tab
2. Search for a user by email or name
3. View user profile details
4. Check cross-links to user's bookings/listings

**Expected:** User search works. Profile shows role, status, tier, join date. Cross-links navigate to related bookings/listings.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-S-011: Pending Approvals

**Page:** `/admin` → Pending Approvals tab
**Steps:**
1. Click Pending Approvals tab
2. Review pending listing approvals
3. Review pending role upgrade requests
4. Approve or reject an item

**Expected:** Pending items listed with type (listing/role upgrade). Approve/reject buttons work. Notifications sent on action.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-S-012: Bulk Actions

**Page:** `/admin` → Listings or Bookings tab
**Steps:**
1. Select multiple items using checkboxes
2. Apply a bulk action (e.g., approve selected)

**Expected:** Multi-select works. Bulk action applies to all selected items.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-S-013: Executive Dashboard Access

**Page:** `/executive-dashboard`
**Steps:**
1. Navigate to `/executive-dashboard`
2. Review platform KPIs and charts

**Expected:** Executive dashboard loads with high-level metrics. Accessible to all RAV team roles.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-S-014: Verify Admin-Only Tabs Hidden

**Page:** `/admin`
**Steps:**
1. While logged in as Staff, verify these tabs are NOT visible:
   - Financials, Tax & 1099, Payouts, Memberships, Launch Readiness, Settings, Voice Controls, Resorts, API Keys, Dev Tools

**Expected:** None of the admin-only tabs are shown. No 403 or error — they simply don't appear in the tab bar.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

---

## Role 4: RAV Admin / Owner

> **Log in as:** `dev-owner@rent-a-vacation.com` or `dev-admin@rent-a-vacation.com` / `SeedTest2026!`

### Admin-Only Tabs

#### TC-A-001: Verify Full Tab Access

**Page:** `/admin`
**Steps:**
1. Log in as RAV Owner or Admin
2. Navigate to `/admin`
3. Count all visible tabs

**Expected:** All tabs visible — the 10 staff tabs PLUS admin-only tabs: Financials, Tax & 1099, Payouts, Memberships, Launch Readiness, Settings, Voice Controls, Resorts, API Keys, Dev Tools.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-002: Financials Tab

**Page:** `/admin` → Financials
**Steps:**
1. Click Financials tab
2. Review revenue, commission, and payout summaries
3. Check date range filters

**Expected:** Financial overview with total revenue, RAV commission (15%), owner payouts. Filterable by date.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-003: Tax & 1099 Tab

**Page:** `/admin` → Tax & 1099
**Steps:**
1. Click Tax & 1099 tab
2. Review owner earnings for 1099 thresholds
3. Check tax report generation

**Expected:** Owner earnings summary with 1099-K threshold tracking ($600 IRS threshold).
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-004: Payouts Tab (Stripe)

**Page:** `/admin` → Payouts
**Steps:**
1. Click Payouts tab
2. Review pending payouts
3. Click "Pay via Stripe" on a payout
4. Verify Stripe Transfer creation

**Expected:** Pending payouts listed. "Pay via Stripe" initiates transfer to owner's connected account. Transfer ID recorded.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-005: Memberships Tab

**Page:** `/admin` → Memberships
**Steps:**
1. Click Memberships tab
2. Review membership tier distribution
3. Change a user's tier

**Expected:** Shows tier breakdown (Free/Plus/Premium for renters, Free/Pro/Business for owners). Tier changes save.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-006: Launch Readiness Tab

**Page:** `/admin` → Launch Readiness
**Steps:**
1. Click Launch Readiness tab
2. Review launch checklist items
3. Check status of each readiness criteria

**Expected:** Launch checklist with pass/fail status for each criterion.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-007: Settings Tab

**Page:** `/admin` → Settings
**Steps:**
1. Click Settings tab
2. Review system settings (commission rate, platform mode, etc.)
3. Toggle Staff Only Mode

**Expected:** Settings editable. Commission rate shows 15% (admin-configurable). Staff Only Mode locks platform for non-team users.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-008: Voice Controls Tab

**Page:** `/admin` → Voice Controls
**Steps:**
1. Click Voice Controls tab
2. Review VAPI configuration info
3. Check tier quota manager (Free: 5/day, Plus/Pro: 25/day, Premium/Business: unlimited)
4. Review user overrides
5. Check voice usage dashboard and observability logs

**Expected:** Voice config displayed. Quota tiers editable. User overrides allow per-user enable/disable/custom quota. Usage charts and search logs visible.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-009: Resorts Tab

**Page:** `/admin` → Resorts
**Steps:**
1. Click Resorts tab
2. Browse resort list (117 total: Hilton 62, Marriott 40, Disney 15)
3. Search for a resort
4. Test CSV import (3-step UI: upload, validate, confirm)
5. Download template CSV

**Expected:** Resort list browsable and searchable. CSV import validates data, shows duplicates, allows selective import.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-010: API Keys Tab

**Page:** `/admin` → API Keys
**Steps:**
1. Click API Keys tab
2. Create a new API key
3. Set IP allowlist (optional)
4. Copy the generated key
5. Revoke a key

**Expected:** API key creation shows key once (cannot be re-shown). IP allowlist supports CIDR notation. Revocation is immediate.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-011: Dev Tools Tab (DEV Only)

**Page:** `/admin` → Dev Tools
**Steps:**
1. Click Dev Tools tab
2. Check seed data status (click Refresh)
3. Click "Reset & Reseed DEV"
4. Wait for completion log

**Expected:** Shows current data counts. Reseed runs in 30–60 seconds with step-by-step log. Only visible on DEV.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

### Admin Editing

#### TC-A-012: Edit a Property (Admin)

**Page:** `/admin` → Properties tab
**Steps:**
1. Find a property and click Edit
2. Modify brand, resort, location, or unit details
3. Save changes

**Expected:** Edit dialog opens with current values. Changes save with audit trail (last_edited_by, last_edited_at).
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-013: Edit a Listing (Admin)

**Page:** `/admin` → Listings tab
**Steps:**
1. Find an active listing and click Edit
2. Modify nightly rate
3. Observe live price recalculation
4. Try editing a completed/booked listing (should be disabled)

**Expected:** Nightly rate changes recalculate total via `computeListingPricing()`. Booked/completed listings cannot be edited.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-014: Approve a Listing

**Page:** `/admin` → Pending Approvals
**Steps:**
1. Find a pending listing
2. Review property details
3. Click Approve

**Expected:** Listing moves to "active" status. Owner receives notification email. Listing appears on `/rentals`.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-015: Reject a Listing

**Page:** `/admin` → Pending Approvals
**Steps:**
1. Find a pending listing
2. Click Reject with reason

**Expected:** Listing marked as rejected. Owner notified with rejection reason.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-016: Approve a Role Upgrade

**Page:** `/admin` → Pending Approvals
**Steps:**
1. Find a pending role upgrade request
2. Approve the upgrade

**Expected:** User's role updates. Notification + email sent. User's dashboard auto-updates via realtime.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

### Developer Tools

#### TC-A-017: Public API — Developers Page

**Page:** `/developers`
**Steps:**
1. Navigate to `/developers`
2. Browse the public Swagger UI
3. Review available API endpoints (5 read-only)

**Expected:** Swagger UI loads with public API documentation. No auth required to view docs.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-018: Internal API Docs

**Page:** `/api-docs`
**Steps:**
1. Navigate to `/api-docs` (must be logged in as admin)
2. Review full OpenAPI spec with all endpoints

**Expected:** Full Swagger UI with all 26+ endpoints. Admin-gated — non-admin users cannot access.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-019: API Gateway Test

**Page:** N/A (curl/Postman)
**Steps:**
1. Create an API key via Admin → API Keys
2. Call the API gateway with the key:
   ```
   curl -H "Authorization: Bearer <API_KEY>" \
     https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/api-gateway/listings
   ```
3. Test rate limiting by making rapid requests

**Expected:** API returns listing data. Rate limits enforced per tier. IP allowlist blocks unauthorized IPs.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-020: Executive Dashboard

**Page:** `/executive-dashboard`
**Steps:**
1. Navigate to `/executive-dashboard`
2. Review platform-wide KPIs
3. Check revenue charts, user growth, booking trends

**Expected:** High-level dashboard with executive metrics. Data matches admin tab totals.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-021: Dispute Resolution with Evidence

**Page:** `/admin` → Disputes
**Steps:**
1. Find a dispute with uploaded evidence
2. View evidence thumbnails/photos
3. Resolve the dispute (approve refund, deny, or partial)

**Expected:** Evidence photos viewable. Resolution updates booking and triggers refund if applicable.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-A-022: GA4 Analytics Verification

**Page:** Any page
**Steps:**
1. Accept cookie consent banner
2. Navigate between several pages
3. Check Google Analytics (GA4) real-time view for events

**Expected:** Page views tracked in GA4 (Measurement ID G-G2YCVHNS25) only after cookie consent.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

---

## Cross-Role Scenarios

> These scenarios require switching between accounts. Use incognito windows or different browsers.

#### TC-X-001: Full Booking Lifecycle

**Accounts:** Owner (`owner1@rent-a-vacation.com`) + Renter (`renter001@rent-a-vacation.com`) + Admin (`dev-admin@rent-a-vacation.com`)

**Steps:**
1. **Owner:** List a new property with nightly rate $150, 7 nights (Step 1→2→3)
2. **Admin:** Approve the listing in Pending Approvals
3. **Renter:** Find the listing on `/rentals`, view details
4. **Renter:** Book the listing — checkout with card `4242 4242 4242 4242`
5. **Owner:** Confirm the booking in Owner Dashboard
6. **Renter:** Complete check-in at `/checkin`
7. **Admin:** Verify booking appears in Bookings tab as "confirmed"
8. **Admin:** Process payout in Payouts tab

**Expected:** Full lifecycle completes. Each role sees appropriate status updates. Emails sent at key transitions.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-X-002: Bid Negotiation Flow

**Accounts:** Owner + Renter

**Steps:**
1. **Owner:** Enable bidding on a listing
2. **Renter:** Place a bid below asking price
3. **Owner:** Review and accept the bid
4. **Renter:** Complete payment at accepted bid price
5. **Owner:** Confirm the booking

**Expected:** Bid appears in both dashboards. Accepted bid creates booking at bid price. Payment processes correctly.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-X-003: Travel Request → Proposal → Booking

**Accounts:** Renter + Owner

**Steps:**
1. **Renter:** Post a travel request for Orlando, 2BR, next month
2. **Owner:** See the request, submit a proposal with their listing
3. **Renter:** Review proposal, accept, and book

**Expected:** Request-to-booking pipeline completes. Owner's listing matched correctly.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-X-004: Cancellation with Refund

**Accounts:** Renter + Admin

**Steps:**
1. **Renter:** Cancel an existing booking
2. **Renter:** Verify cancellation policy terms in the dialog
3. **Renter:** Confirm cancellation
4. **Admin:** Verify refund processed in Stripe Dashboard (Test mode)
5. **Admin:** Check escrow and booking status updates

**Expected:** Refund amount matches cancellation policy. Stripe shows refund in test dashboard. Booking status = "cancelled".
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-X-005: Owner Cancellation → Full Refund

**Accounts:** Owner + Renter + Admin

**Steps:**
1. **Owner:** Cancel a confirmed booking
2. **Renter:** Verify full refund received (owner cancellation = 100% refund)
3. **Admin:** Verify owner's cancellation count incremented

**Expected:** Renter gets full refund. Owner's cancellation count increases.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-X-006: Dispute Resolution

**Accounts:** Renter + Owner + Admin

**Steps:**
1. **Renter:** Report issue on a booking
2. **Owner:** Report counter-issue with evidence photos
3. **Admin:** Review both sides in Disputes tab
4. **Admin:** Resolve with partial refund

**Expected:** Both disputes linked to same booking. Admin sees evidence from both. Resolution triggers appropriate refund.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-X-007: Referral End-to-End

**Accounts:** Owner + New User

**Steps:**
1. **Owner:** Copy referral code from Owner Dashboard → Account tab
2. **New User:** Sign up at `/signup?ref=CODE`
3. **Owner:** Verify referral appears in Referral Dashboard

**Expected:** New user's signup captured with referral code. Owner's referral stats update.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-X-008: Realtime Notifications

**Accounts:** Owner + Renter (two browser windows side-by-side)

**Steps:**
1. Open Owner Dashboard in Window A, Renter's property detail in Window B
2. **Renter (B):** Send an inquiry ("Ask the Owner")
3. **Owner (A):** Watch for notification bell update (no page refresh)
4. **Owner (A):** Reply to the inquiry
5. **Renter (B):** Watch for reply to appear in inquiry thread

**Expected:** Both sides see updates in real-time via Supabase realtime subscriptions. No manual refresh needed.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-X-009: Date Proposal Workflow

**Accounts:** Renter + Owner

**Steps:**
1. **Renter:** On a listing, propose different dates
2. **Renter:** Verify auto-computed price (nightly rate × proposed nights)
3. **Owner:** Review the date proposal
4. **Owner:** Accept or counter

**Expected:** Date proposal computes correct total. Owner can accept/reject. Accepted proposal creates bookable offer.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-X-010: Staff vs Admin Access Boundary

**Accounts:** Staff (`dev-staff@rent-a-vacation.com`) + Admin (`dev-admin@rent-a-vacation.com`)

**Steps:**
1. **Staff:** Log in, navigate to `/admin`, note visible tabs
2. **Admin:** Log in (different browser), navigate to `/admin`, note visible tabs
3. Compare tab counts

**Expected:** Staff sees 10 tabs. Admin sees 10 + admin-only tabs. No overlap or missing tabs.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

---

## Public & Unauthenticated Pages

> **Test without logging in** (incognito window)

#### TC-P-001: Landing Page (Unauthenticated)

**Page:** `/`
**Steps:**
1. Open `dev.rent-a-vacation.com` in incognito
2. Verify page loads with header, hero, featured listings
3. Click "Browse Rentals" — should redirect to login

**Expected:** Landing page is public. Protected routes redirect to `/login`.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-P-002: Login Flow

**Page:** `/login`
**Steps:**
1. Navigate to `/login`
2. Enter `renter001@rent-a-vacation.com` / `SeedTest2026!`
3. Submit

**Expected:** Successful login. Redirect to `/rentals` (or the page they came from).
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-P-003: Signup Flow

**Page:** `/signup`
**Steps:**
1. Navigate to `/signup`
2. Enter a new email, password, and name
3. Submit registration
4. Check for verification email

**Expected:** Account created. Redirect to `/pending-approval`. Verification email sent.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-P-004: Forgot Password

**Page:** `/forgot-password`
**Steps:**
1. Navigate to `/forgot-password`
2. Enter a registered email
3. Submit

**Expected:** Password reset email sent. Confirmation message shown.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-P-005: Reset Password

**Page:** `/reset-password`
**Steps:**
1. Click the reset link from the email
2. Enter new password
3. Submit

**Expected:** Password changed. Can log in with new password.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-P-006: Terms of Service

**Page:** `/terms`
**Steps:**
1. Navigate to `/terms`
2. Read the terms page

**Expected:** Terms page loads with legal content.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-P-007: Privacy Policy

**Page:** `/privacy`
**Steps:**
1. Navigate to `/privacy`
2. Read the privacy policy

**Expected:** Privacy policy page loads.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-P-008: Documentation Page

**Page:** `/documentation`
**Steps:**
1. Navigate to `/documentation`
2. Browse documentation sections

**Expected:** Documentation page loads with structured content.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-P-009: User Guide

**Page:** `/user-guide`
**Steps:**
1. Navigate to `/user-guide`
2. Browse guide sections (6 owner + 7 renter sections)

**Expected:** User guide loads with categorized help content.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-P-010: Cookie Consent Banner

**Page:** `/` (any page, first visit)
**Steps:**
1. Open the site in incognito
2. Observe the cookie consent banner
3. Accept cookies
4. Verify GA4 tracking begins (check network tab for analytics calls)

**Expected:** Banner appears on first visit. Accepting enables GA4 + PostHog. Declining prevents analytics.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-P-011: PWA Install Banner

**Page:** Any page (mobile or desktop)
**Steps:**
1. Visit the site on a mobile device (or use Chrome DevTools mobile emulation)
2. Look for PWA install prompt

**Expected:** Install banner appears on eligible browsers.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-P-012: Offline Banner

**Page:** Any page
**Steps:**
1. Load a page
2. Disconnect from the internet (airplane mode or DevTools offline)
3. Observe the offline banner

**Expected:** Offline banner appears when connectivity is lost. Disappears when restored.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-P-013: 404 Page

**Page:** `/this-does-not-exist`
**Steps:**
1. Navigate to a non-existent URL
2. Observe the 404 page

**Expected:** Custom 404 page with navigation back to home.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-P-014: Pending Approval Page

**Page:** `/pending-approval`
**Steps:**
1. Log in with a newly registered (unapproved) account
2. Observe the pending approval page

**Expected:** Shows message that account is pending admin approval.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

#### TC-P-015: DEV Environment Banner

**Page:** Any page on DEV
**Steps:**
1. Verify yellow "DEV ENVIRONMENT" banner at the top of every page

**Expected:** Yellow banner visible on DEV. Not present on production.
**Status:** [ ] Pass  [ ] Fail
**Notes:** _______________

---

## Route Coverage Checklist

Every route in `App.tsx` should have at least one test case above.

| Route | Test Case(s) |
|-------|-------------|
| `/` | TC-T-001, TC-P-001 |
| `/how-it-works` | TC-T-002 |
| `/property/:id` | TC-T-009, TC-O-026 |
| `/login` | TC-P-002 |
| `/signup` | TC-P-003, TC-O-020 |
| `/forgot-password` | TC-P-004 |
| `/reset-password` | TC-P-005 |
| `/destinations` | TC-T-008 |
| `/destinations/:slug` | TC-T-008 |
| `/destinations/:slug/:city` | TC-T-008 |
| `/faq` | TC-T-037 |
| `/terms` | TC-P-006 |
| `/privacy` | TC-P-007 |
| `/pending-approval` | TC-P-014 |
| `/documentation` | TC-P-008 |
| `/user-guide` | TC-P-009 |
| `/user-journeys` | TC-P-008 |
| `/contact` | TC-T-038 |
| `/calculator` | TC-T-032 |
| `/tools` | TC-T-036 |
| `/tools/cost-comparator` | TC-T-033 |
| `/tools/yield-estimator` | Redirect → `/calculator` (TC-T-032) |
| `/tools/resort-quiz` | TC-T-034 |
| `/tools/budget-planner` | TC-T-035 |
| `/rentals` | TC-T-003, TC-T-004, TC-T-005 |
| `/list-property` | TC-O-001, TC-O-002, TC-O-003 |
| `/owner-dashboard` | TC-O-006 through TC-O-009 |
| `/admin` | TC-S-001 through TC-S-014, TC-A-001 through TC-A-022 |
| `/executive-dashboard` | TC-S-013, TC-A-020 |
| `/checkout` | TC-T-018, TC-T-019, TC-T-020 |
| `/booking-success` | TC-T-021 |
| `/bidding` | TC-T-015 |
| `/my-trips` | TC-T-022 through TC-T-025 |
| `/my-bids` | Redirect → `/my-trips?tab=offers` |
| `/my-bookings` | Redirect → `/my-trips?tab=bookings` |
| `/account` | TC-T-031 |
| `/checkin` | TC-T-028 |
| `/developers` | TC-A-017 |
| `/api-docs` | TC-A-018 |
| `*` (404) | TC-P-013 |

---

## Test Summary Template

| Section | Total | Pass | Fail | Blocked |
|---------|-------|------|------|---------|
| Traveler (Renter) | 38 | | | |
| Property Owner | 28 | | | |
| RAV Staff | 14 | | | |
| RAV Admin/Owner | 22 | | | |
| Cross-Role | 10 | | | |
| Public/Unauth | 15 | | | |
| **Total** | **127** | | | |

**Tested by:** _______________
**Date:** _______________
**Build/Commit:** _______________
**Environment:** DEV / PROD

---

*© 2026 Rent-A-Vacation. For Authorized Team Members.*
