---
last_updated: "2026-04-10T11:02:46"
change_ref: "2a9cb39"
change_type: "session-43"
status: "active"
---
# End-to-End Scenario Test Suite — Rent-A-Vacation

**Purpose:** Complete cross-role, multi-step scenario tests covering every major RAV business capability.
Unlike the QA Playbook (individual test cases per function), this document tests **complete workflows** that span multiple users, roles, and pages — simulating real usage patterns.

**How to use:** Each scenario is self-contained. Pick a scenario, follow every step in order, switching between user accounts as directed. Mark each checkpoint Pass/Fail. After completing a run, record the date and outcome in your tracking sheet.

**Password for all accounts:** `SeedTest2026!`

**Environment:** DEV only (`https://dev.rent-a-vacation.com`)

---

## Account Quick Reference

| Account | Email | Role | Tier | Notes |
|---------|-------|------|------|-------|
| **RAV Owner** | `dev-owner@rent-a-vacation.com` | rav_owner | — | Full admin, all tabs |
| **RAV Admin** | `dev-admin@rent-a-vacation.com` | rav_admin | — | Admin, all tabs |
| **RAV Staff** | `dev-staff@rent-a-vacation.com` | rav_staff | — | 10 operational tabs only |
| **Owner 1** | `owner1@rent-a-vacation.com` | property_owner | Pro | Alex Rivera, Hilton, 10 listing limit |
| **Owner 2** | `owner2@rent-a-vacation.com` | property_owner | Business | Maria Chen, Marriott, 25 listing limit |
| **Owner 3** | `owner3@rent-a-vacation.com` | property_owner | Free | James Thompson, Disney, 3 listing limit |
| **Renter 1** | `renter001@rent-a-vacation.com` | renter | Plus | Sophia Martinez |
| **Renter 2** | `renter002@rent-a-vacation.com` | renter | Plus | Liam Johnson |
| **Renter 3** | `renter003@rent-a-vacation.com` | renter | Premium | Olivia Williams |
| **Renter 4** | `renter004@rent-a-vacation.com` | renter | Free | — |

**Stripe test card (success):** `4242 4242 4242 4242` / any future expiry / CVC `123` / ZIP `32256`

---

## Scenario Index

| # | Scenario | Roles Involved | Capability Tested | Est. Time |
|---|----------|---------------|-------------------|-----------|
| S-01 | [New User Onboarding & Approval](#s-01-new-user-onboarding--approval) | New User, Admin | Signup → Approval → Access | 10 min |
| S-02 | [Owner Role Upgrade & Verification](#s-02-owner-role-upgrade--verification) | Renter→Owner, Admin | Role upgrade → Doc upload → Admin verify | 10 min |
| S-03 | [Property Listing Creation & Approval](#s-03-property-listing-creation--approval) | Owner, Admin | List property → Admin review → Goes live | 12 min |
| S-04 | [Direct Booking — Happy Path](#s-04-direct-booking--happy-path) | Renter, Owner, Admin | Browse → Book → Pay → Owner confirm → Escrow | 15 min |
| S-05 | [Bidding & Counter-Offer Workflow](#s-05-bidding--counter-offer-workflow) | Renter, Owner | Bid → Counter → Accept → Booking | 15 min |
| S-06 | [Travel Request & Owner Proposal](#s-06-travel-request--owner-proposal) | Renter, Owner | Post request → Owner proposes → Accept → Book | 15 min |
| S-07 | [Pre-Booking Inquiry & Messaging](#s-07-pre-booking-inquiry--messaging) | Renter, Owner | Ask question → Owner replies → Conversation | 8 min |
| S-08 | [Booking Messaging & Realtime](#s-08-booking-messaging--realtime) | Renter, Owner | Post-booking thread → Realtime delivery | 8 min |
| S-09 | [Renter Cancellation Flow](#s-09-renter-cancellation-flow) | Renter, Owner, Admin | Cancel → Policy refund → Status updates | 10 min |
| S-10 | [Owner Cancellation Flow](#s-10-owner-cancellation-flow) | Owner, Renter, Admin | Owner cancels → Full refund → Penalty | 10 min |
| S-11 | [Dispute Resolution — Check-In Issue](#s-11-dispute-resolution--check-in-issue) | Renter, Admin | Report issue → Evidence → Admin resolves | 12 min |
| S-12 | [Owner Earnings & Payout Cycle](#s-12-owner-earnings--payout-cycle) | Owner, Admin | Booking complete → Escrow release → Payout | 10 min |
| S-13 | [Membership Upgrade — Owner](#s-13-membership-upgrade--owner) | Owner | Free → Pro → Listing limit increase | 8 min |
| S-14 | [Membership Upgrade — Renter](#s-14-membership-upgrade--renter) | Renter | Free → Plus → Perks visible | 8 min |
| S-15 | [Referral Program End-to-End](#s-15-referral-program-end-to-end) | Owner, New User, Admin | Generate code → Signup with ref → Track | 10 min |
| S-16 | [Search, Filter & Discovery](#s-16-search-filter--discovery) | Renter | Filters → Sort → Compare → Save search | 10 min |
| S-17 | [Notification Delivery & Preferences](#s-17-notification-delivery--preferences) | Renter, Owner | Trigger event → Notification arrives → Preferences | 10 min |
| S-18 | [Admin — Full Operations Cycle](#s-18-admin--full-operations-cycle) | Admin, Staff | All admin tabs, staff boundary check | 15 min |
| S-19 | [Stripe Payment Edge Cases](#s-19-stripe-payment-edge-cases) | Renter | Decline, 3DS, expired card handling | 10 min |
| S-20 | [Public Pages & Unauthenticated Access](#s-20-public-pages--unauthenticated-access) | None (logged out) | All public routes, tool pages, legal | 10 min |
| S-21 | [Owner Multi-Listing Management](#s-21-owner-multi-listing-management) | Owner | Multiple listings, tier limits, drafts | 10 min |
| S-22 | [RAV Smart Tools Suite](#s-22-rav-smart-tools-suite) | Any/None | SmartEarn, SmartCompare, SmartMatch, SmartBudget | 10 min |
| S-23 | [Date Proposal & Flexible Booking](#s-23-date-proposal--flexible-booking) | Renter, Owner | Propose alt dates → Owner reviews → Accept | 12 min |
| S-24 | [Admin Property & Listing Editing](#s-24-admin-property--listing-editing) | Admin | Edit property/listing details, audit trail | 10 min |
| S-25 | [Executive Dashboard & Analytics](#s-25-executive-dashboard--analytics) | RAV Owner | Strategic metrics, market data | 8 min |
| S-26 | [Voice Search & Quota Management](#s-26-voice-search--quota-management) | Renter, Admin | Voice search → Quota tracking → Admin override | 10 min |
| S-27 | [API Key & Developer Portal](#s-27-api-key--developer-portal) | Admin | Create key → Test endpoint → Revoke | 10 min |
| S-28 | [iCal Export & Calendar Integration](#s-28-ical-export--calendar-integration) | Owner | Export bookings → Verify ICS file | 5 min |
| S-29 | [GDPR Data Export & Deletion](#s-29-gdpr-data-export--deletion) | Renter | Request export → Request deletion → Grace period | 8 min |
| S-30 | [Complete Marketplace Cycle](#s-30-complete-marketplace-cycle) | All Roles | Full lifecycle: list → discover → bid → book → confirm → check-in → review → payout | 25 min |

---

## Scenarios

---

### S-01: New User Onboarding & Approval

**Capability:** A brand-new user signs up, waits for admin approval, then gains marketplace access.

**Roles:** New user (incognito browser), RAV Admin

**Preconditions:** Use an email not in the system (e.g., `testuser-[date]@gmail.com` or use `+` alias)

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | New User | Open incognito browser → navigate to `/signup` | /signup | Signup form loads with email + password fields + Google OAuth option |
| 2 | New User | Enter name, email, password → Submit | /signup | Success message shown, redirected to `/pending-approval` |
| 3 | New User | Attempt to navigate to `/rentals` | /rentals | Redirected back to `/pending-approval` — cannot access marketplace |
| 4 | Admin | Log in as `dev-admin@rent-a-vacation.com` | /login | Dashboard loads |
| 5 | Admin | Navigate to `/admin?tab=pending-approvals` | /admin | New user appears in pending list with name and email |
| 6 | Admin | Click "Approve" on the new user | /admin | User status changes to approved, confirmation shown |
| 7 | New User | Refresh `/pending-approval` page (or log out and back in) | — | Redirected to marketplace `/rentals` — full access granted |
| 8 | New User | Browse `/rentals`, click on a listing | /rentals, /property/:id | Property details page loads with full content |

**Pass criteria:** New user blocked until approved, then has full renter access after approval.

---

### S-02: Owner Role Upgrade & Verification

**Capability:** An existing renter requests owner role, uploads verification docs, admin reviews and grants owner access.

**Roles:** Renter 4 (Free tier), RAV Admin

**Preconditions:** Renter 4 has approved renter account but no owner role

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Renter 4 | Log in → navigate to `/owner-dashboard` | /owner-dashboard | RoleUpgradeDialog appears — "Request Owner Access" prompt |
| 2 | Renter 4 | Submit role upgrade request | /owner-dashboard | Confirmation toast: "Request submitted" |
| 3 | Admin | Log in → `/admin?tab=pending-approvals` | /admin | Role upgrade request from Renter 4 visible |
| 4 | Admin | Approve role upgrade | /admin | Renter 4 now has property_owner role |
| 5 | Renter 4 | Refresh page or re-login | /owner-dashboard | Owner dashboard loads (no more upgrade dialog) |
| 6 | Renter 4 | Navigate to Account tab → Verification section | /owner-dashboard?tab=account | Upload fields visible for deed/certificate/ID |
| 7 | Renter 4 | Upload verification documents | /owner-dashboard?tab=account | Docs uploaded, status shows "Pending verification" |
| 8 | Admin | Navigate to `/admin?tab=verifications` | /admin | Renter 4's docs appear in verification queue |
| 9 | Admin | Review and approve verification | /admin | Verification status updated to "Verified" |
| 10 | Renter 4 | Refresh Account tab | /owner-dashboard?tab=account | Verification badge shows "Verified" |

**Pass criteria:** Smooth role transition from renter to verified owner with admin gates at each step.

---

### S-03: Property Listing Creation & Approval

**Capability:** Owner creates a new property listing through the 3-step form, admin reviews and approves, listing goes live on marketplace.

**Roles:** Owner 1 (Alex Rivera, Pro tier), RAV Admin

**Preconditions:** Owner 1 logged in, has not hit listing limit (Pro = 10)

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Owner 1 | Navigate to `/list-property` | /list-property | 3-step form loads: Property Details → Dates & Pricing → Review |
| 2 | Owner 1 | **Step 1:** Fill property details — name, location (Las Vegas, NV), brand (Hilton Grand Vacations), bedrooms: 2, bathrooms: 2, sleeps: 6, description, select amenities | /list-property | All fields accept input, amenity checkboxes work |
| 3 | Owner 1 | Click "Next" | /list-property | Advances to Step 2: Dates & Pricing |
| 4 | Owner 1 | **Step 2:** Set check-in date (60 days out), check-out (67 days out = 7 nights), nightly rate: $200, cancellation policy: Moderate, enable "Open for Bidding" | /list-property | Price summary shows: nightly $200 × 7 nights = $1,400 owner price, $1,610 with 15% RAV markup. PricingSuggestion component shows market comparison if similar listings exist |
| 5 | Owner 1 | Click "Next" | /list-property | Advances to Step 3: Review & Submit |
| 6 | Owner 1 | **Step 3:** Review all details → Click "Submit for Review" | /list-property | Success toast, redirected to `/owner-dashboard?tab=my-listings` |
| 7 | Owner 1 | Check listing in My Listings tab | /owner-dashboard?tab=my-listings | New listing visible with status "Pending Approval" |
| 8 | Admin | Log in → `/admin?tab=listings` | /admin | New listing from Owner 1 visible in pending queue |
| 9 | Admin | Click listing → Review details → Click "Approve" | /admin | Status changes to "Active", confirmation shown |
| 10 | Owner 1 | Refresh My Listings | /owner-dashboard?tab=my-listings | Listing status now "Active" |
| 11 | Renter 1 | Log in → `/rentals` → search for Las Vegas or Hilton | /rentals | New listing appears in search results |
| 12 | Renter 1 | Click listing → view `/property/:id` | /property/:id | Full listing details visible: price, dates, amenities, owner profile, "Open for Bidding" badge |

**Pass criteria:** Listing flows from creation through approval to live marketplace visibility. Price calculations correct at every step.

---

### S-04: Direct Booking — Happy Path

**Capability:** Renter finds a listing, books directly, pays via Stripe, owner confirms, escrow is managed.

**Roles:** Renter 1 (Plus tier), Owner 1 (Alex Rivera), RAV Admin

**Preconditions:** Active listing from Owner 1 with direct booking enabled (not bidding-only)

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Renter 1 | Log in → `/rentals` → find an active Owner 1 listing (fixed-price, not bidding) | /rentals | Listing visible with price and dates |
| 2 | Renter 1 | Click listing → view details | /property/:id | Price breakdown visible (nightly rate × nights + RAV fee), cancellation policy shown, CancellationPolicyDetail component renders with color-coded refund schedule |
| 3 | Renter 1 | Click "Book Now" | /checkout | Checkout page loads with booking summary, fee breakdown, Stripe payment form |
| 4 | Renter 1 | Enter Stripe test card `4242 4242 4242 4242`, expiry `12/28`, CVC `123`, ZIP `32256` → Submit | /checkout | Payment processing spinner, then redirect to `/booking-success` |
| 5 | Renter 1 | View booking confirmation | /booking-success | BookingTimeline shows: Payment ✅ → Owner Confirmation (active, 60-min countdown) → Details → Check-in → Review |
| 6 | Owner 1 | Log in → check notification bell (top nav) | Any page | Notification: "New booking for [property name]" with link |
| 7 | Owner 1 | Navigate to `/owner-dashboard?tab=bookings-earnings` | /owner-dashboard | New booking visible with "Confirm" button and countdown timer |
| 8 | Owner 1 | Click "Confirm" → enter resort confirmation number (e.g., RST123456) | /owner-dashboard | Booking status changes to "Confirmed", timer stops |
| 9 | Renter 1 | Navigate to `/my-trips?tab=bookings` | /my-trips | Booking shows "Confirmed" status, BookingTimeline updates |
| 10 | Admin | Log in → `/admin?tab=escrow` | /admin | Booking appears with escrow status "Pending Verification" |
| 11 | Admin | Verify resort confirmation → Release escrow | /admin | Escrow status: "Released", funds available for payout |
| 12 | Owner 1 | Check `/owner-dashboard?tab=bookings-earnings` | /owner-dashboard | Earnings updated, payout status visible |

**Pass criteria:** Complete happy-path from discovery through payment to confirmed booking with escrow management. All parties see correct status at each stage.

---

### S-05: Bidding & Counter-Offer Workflow

**Capability:** Renter places a bid on a listing, owner reviews and counter-offers, renter negotiates, deal is reached.

**Roles:** Renter 1, Owner 1

**Preconditions:** Active listing from Owner 1 with `open_for_bidding = true`

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Renter 1 | Log in → `/rentals` → find Owner 1 listing with "Open for Bidding" badge | /rentals | Bidding badge visible on listing card |
| 2 | Renter 1 | Click listing → click "Place Bid" (or "Make an Offer") | /property/:id | BidFormDialog opens with amount field, guest count, message |
| 3 | Renter 1 | Enter bid at 80% of listed price (e.g., if listed at $1,610, bid $1,288), guests: 4, message: "Family vacation, any flexibility?" → Submit | /property/:id | Toast: "Bid submitted", dialog closes |
| 4 | Renter 1 | Navigate to `/my-trips?tab=offers` | /my-trips | Bid visible with status "Pending", amount and property name shown |
| 5 | Owner 1 | Log in → check notification bell | Any page | Notification: "New bid received on [property]" |
| 6 | Owner 1 | Navigate to `/owner-dashboard?tab=my-listings` → open listing → click "View Bids" (BidsManagerDialog) | /owner-dashboard | Renter 1's bid visible with amount, message, guest count |
| 7 | Owner 1 | Click "Counter" → enter counter amount at 90% of listed price (e.g., $1,449), add message: "I can do 90%, final offer" → Submit | /owner-dashboard | Counter-offer sent, bid status updates |
| 8 | Renter 1 | Check notification bell → navigate to `/my-trips?tab=offers` | /my-trips | Bid now shows "Counter-offer: $1,449" with owner's message |
| 9 | Renter 1 | Click "Accept" on the counter-offer | /my-trips | Redirected to `/checkout` with counter-offer amount |
| 10 | Renter 1 | Complete Stripe payment | /checkout → /booking-success | Booking created at agreed counter-offer price |
| 11 | Owner 1 | Check `/owner-dashboard?tab=bookings-earnings` | /owner-dashboard | New booking from accepted bid visible |

**Pass criteria:** Full negotiation cycle works — bid → counter → accept → payment. Amounts are consistent throughout. Both parties see the same figures.

---

### S-06: Travel Request & Owner Proposal

**Capability:** Renter posts a travel request (reverse auction), owner sees matching request and submits a proposal, renter reviews and accepts.

**Roles:** Renter 2 (Liam Johnson), Owner 2 (Maria Chen, Marriott)

**Preconditions:** Owner 2 has active Marriott listings in Orlando, FL

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Renter 2 | Log in → navigate to `/bidding` | /bidding | TravelRequestForm loads |
| 2 | Renter 2 | Fill request: Destination: Orlando FL, Check-in: 45 days out, Nights: 5, Guests: 4, Budget: $1,000–$2,000, Flexible dates: Yes (±3 days), Message: "Anniversary trip, prefer resort with pool" → Submit | /bidding | Toast: "Travel request posted", request appears in list |
| 3 | Owner 2 | Log in → navigate to `/owner-dashboard?tab=my-listings` | /owner-dashboard | Matched travel request notification or "Travel Requests" section shows Renter 2's request |
| 4 | Owner 2 | View request details → Click "Submit Proposal" | /owner-dashboard | Proposal form opens: select listing, propose price, dates, message |
| 5 | Owner 2 | Select Marriott Grande Vista listing, propose $1,500, check-in in 45 days, 5 nights, message: "Our Grande Vista unit has a pool and is perfect for anniversaries" → Submit | /owner-dashboard | Toast: "Proposal sent", proposal appears as pending |
| 6 | Renter 2 | Check notification bell | Any page | Notification: "Owner proposal received for your travel request" |
| 7 | Renter 2 | Navigate to `/my-trips?tab=offers` | /my-trips | Proposal from Owner 2 visible with property details, price, dates |
| 8 | Renter 2 | Click "Accept Proposal" | /my-trips | Redirected to `/checkout` with proposal details |
| 9 | Renter 2 | Complete Stripe payment → view booking success | /checkout → /booking-success | Booking created for Marriott Grande Vista at $1,500 |
| 10 | Owner 2 | Check bookings | /owner-dashboard?tab=bookings-earnings | New booking from travel request visible |

**Pass criteria:** Reverse auction flow works end-to-end. Request matching surfaces relevant owners. Proposal amounts flow correctly to checkout.

---

### S-07: Pre-Booking Inquiry & Messaging

**Capability:** Renter asks owner a question before booking, owner responds, conversation continues.

**Roles:** Renter 3 (Olivia, Premium), Owner 3 (James Thompson, Disney)

**Preconditions:** Owner 3 has active Disney listing

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Renter 3 | Log in → find a Disney listing → view `/property/:id` | /property/:id | "Ask the Owner" button visible |
| 2 | Renter 3 | Click "Ask the Owner" → InquiryDialog opens → type "Does this unit have a view of the savanna? Also, is early check-in possible?" → Send | /property/:id | Toast: "Message sent", dialog closes or shows conversation thread |
| 3 | Owner 3 | Log in → check notification bell | Any page | Notification: "New inquiry about [property]" |
| 4 | Owner 3 | Click notification or navigate to inquiry | InquiryThread | Renter 3's message visible with property context |
| 5 | Owner 3 | Reply: "Yes, it's a savanna view unit! Early check-in at 1pm is usually available, just call the resort. Would you like to book?" → Send | InquiryThread | Reply sent, thread updated |
| 6 | Renter 3 | Check notification → view thread | InquiryThread | Owner's reply visible in conversation |
| 7 | Renter 3 | Reply: "That sounds perfect, I'll book now!" → Send | InquiryThread | Message sent, conversation continues |

**Pass criteria:** Two-way messaging works. Notifications deliver for both parties. Conversation persists and is readable.

---

### S-08: Booking Messaging & Realtime

**Capability:** After a booking is made, renter and owner can exchange messages in real-time about booking details.

**Roles:** Renter 1, Owner 1

**Preconditions:** Existing confirmed booking between Renter 1 and Owner 1 (from S-04 or seed data)

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Renter 1 | Log in → `/my-trips?tab=bookings` → select confirmed booking → open message thread | /my-trips | BookingMessageThread loads with booking context |
| 2 | Renter 1 | Type "Hi, what's the WiFi password for the unit?" → Send | /my-trips | Message appears in thread immediately |
| 3 | Owner 1 | Log in (open in separate browser) → check notification bell | Any page | Notification: "New message about booking #[id]" (realtime, no page refresh needed) |
| 4 | Owner 1 | Navigate to booking → open message thread | /owner-dashboard | Renter's message visible |
| 5 | Owner 1 | Reply: "Welcome! WiFi: ResortGuest2026, password: vacation123. Let me know if you need anything else!" → Send | /owner-dashboard | Message appears in thread |
| 6 | Renter 1 | Check thread (WITHOUT refreshing page) | /my-trips | Owner's reply appears in real-time via Realtime subscription |

**Pass criteria:** Messages deliver in real-time without page refresh. Both parties see the complete thread. Notification bell updates without polling.

---

### S-09: Renter Cancellation Flow

**Capability:** Renter cancels a booking, refund is calculated per cancellation policy, all parties see correct status.

**Roles:** Renter 1, Owner 1, RAV Admin

**Preconditions:** Confirmed booking between Renter 1 and Owner 1

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Renter 1 | Log in → `/my-trips?tab=bookings` → select confirmed booking | /my-trips | Booking details visible with "Cancel Booking" option |
| 2 | Renter 1 | Click "Cancel Booking" | /my-trips | CancelBookingDialog opens showing cancellation policy, refund estimate based on policy (flexible/moderate/strict/super_strict), and days until check-in |
| 3 | Renter 1 | Select reason: "Change of travel plans" → Confirm cancellation | /my-trips | Toast: "Cancellation requested", booking status updates |
| 4 | Renter 1 | View booking in My Trips | /my-trips | Status: "Cancellation Pending" or "Cancelled" with refund amount shown |
| 5 | Owner 1 | Log in → check notification bell | Any page | Notification: "Booking cancelled by renter" |
| 6 | Owner 1 | Navigate to `/owner-dashboard?tab=bookings-earnings` | /owner-dashboard | Booking shows "Cancelled" status, listing availability restored |
| 7 | Admin | Log in → `/admin?tab=bookings` | /admin | Cancellation visible with refund details |
| 8 | Admin | Verify refund was processed (check cancellation_requests record) | /admin | Refund amount matches policy calculation, Stripe refund initiated |

**Pass criteria:** Policy-based refund calculation is correct. Listing becomes available again. All three parties see consistent cancellation status.

---

### S-10: Owner Cancellation Flow

**Capability:** Owner cancels a confirmed booking, renter gets full refund, owner incurs penalty.

**Roles:** Owner 1, Renter 1, RAV Admin

**Preconditions:** Confirmed booking between Owner 1 and Renter 1

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Owner 1 | Log in → `/owner-dashboard?tab=bookings-earnings` → select confirmed booking | /owner-dashboard | Booking details with "Cancel Booking" option |
| 2 | Owner 1 | Click "Cancel" → CancelBookingDialog shows warning about penalties | /owner-dashboard | Dialog warns: full refund to renter, cancellation count increment, trust score impact |
| 3 | Owner 1 | Select reason → Confirm cancellation | /owner-dashboard | Cancellation processed, status updated |
| 4 | Renter 1 | Log in → `/my-trips?tab=bookings` | /my-trips | Booking shows "Cancelled by Owner", full refund amount displayed |
| 5 | Renter 1 | Check notification bell | Any page | Notification: "Your booking was cancelled by the owner — full refund issued" |
| 6 | Admin | Log in → `/admin?tab=bookings` | /admin | Owner cancellation logged with reason, refund amount = 100% |
| 7 | Owner 1 | Check profile/dashboard | /owner-dashboard | Cancellation count incremented |

**Pass criteria:** Owner cancellation triggers full renter refund (not policy-based). Owner penalty recorded.

---

### S-11: Dispute Resolution — Check-In Issue

**Capability:** Renter reports a check-in issue, uploads evidence, admin investigates and resolves.

**Roles:** Renter 1, RAV Admin

**Preconditions:** Confirmed booking for Renter 1 (on or past check-in date)

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Renter 1 | Log in → `/checkin` or `/my-trips?tab=bookings` → select booking | /checkin or /my-trips | Check-in form or "Report Issue" button visible |
| 2 | Renter 1 | Click "Report Issue" → ReportIssueDialog opens | — | Category selection (room not as described, amenities missing, etc.), description field, evidence upload |
| 3 | Renter 1 | Select category: "Room not as described", write description, upload photo evidence → Submit | — | Toast: "Issue reported", dispute created |
| 4 | Renter 1 | Check `/my-trips?tab=bookings` → booking detail | /my-trips | Dispute status visible: "Under Review" |
| 5 | Admin | Log in → `/admin?tab=disputes` | /admin | New dispute from Renter 1 visible with category, description |
| 6 | Admin | Click dispute → view evidence (uploaded photos/thumbnails) | /admin | Evidence attachments render, description readable |
| 7 | Admin | Add admin notes, select resolution (full refund / partial refund / no refund) → Resolve | /admin | Dispute status: "Resolved", refund processed if applicable |
| 8 | Renter 1 | Check `/my-trips` and notification bell | /my-trips | Notification: "Your dispute has been resolved", refund details shown |

**Pass criteria:** Evidence upload works. Admin can view evidence. Resolution refund calculates correctly. Both parties notified.

---

### S-12: Owner Earnings & Payout Cycle

**Capability:** After a completed booking, owner can see earnings, admin can verify and release payout.

**Roles:** Owner 2 (Maria Chen, Business), RAV Admin

**Preconditions:** Completed booking for Owner 2's listing with escrow released

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Owner 2 | Log in → `/owner-dashboard` (Dashboard tab) | /owner-dashboard | Earnings summary card shows total, pending, and paid amounts |
| 2 | Owner 2 | Navigate to Bookings & Earnings tab | /owner-dashboard?tab=bookings-earnings | Completed bookings list with individual earning amounts |
| 3 | Owner 2 | Verify commission calculation on a completed booking | /owner-dashboard | Owner earning = total amount − 10% commission (Business tier gets 10%, not 15%) |
| 4 | Owner 2 | Check Stripe Connect status (StripeConnectBanner) | /owner-dashboard | If not connected: "Connect Stripe" banner. If connected: "Payouts enabled" |
| 5 | Admin | Log in → `/admin?tab=payouts` | /admin | Owner 2's pending payout visible |
| 6 | Admin | Click "Pay via Stripe" (or initiate manual payout) → Confirm in AlertDialog | /admin | Payout initiated, status changes to "Processing" or "Paid" |
| 7 | Owner 2 | Refresh Bookings & Earnings | /owner-dashboard | Payout status updated to "Paid" |

**Pass criteria:** Commission rates match tier (Business = 10%). Payout amount = booking − commission. Stripe Connect flow works.

---

### S-13: Membership Upgrade — Owner

**Capability:** Free-tier owner upgrades to Pro, gaining increased listing limit and reduced commission.

**Roles:** Owner 3 (James Thompson, Free tier — 3 listing limit)

**Preconditions:** Owner 3 has Free tier membership

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Owner 3 | Log in → `/owner-dashboard?tab=account` | /owner-dashboard | Current tier shown: "Free", listing limit: 3 |
| 2 | Owner 3 | Click "Upgrade Plan" → MembershipPlans component loads | /owner-dashboard | Tier comparison: Free (3 listings, 15%) vs Pro (10 listings, 13%) vs Business (25 listings, 10%) |
| 3 | Owner 3 | Select "Pro" tier → Redirected to Stripe Checkout | Stripe Checkout | Stripe payment page shows Pro plan at $10/month |
| 4 | Owner 3 | Complete payment with test card | Stripe → /subscription-success | Subscription confirmed |
| 5 | Owner 3 | Navigate back to `/owner-dashboard?tab=account` | /owner-dashboard | Tier now shows "Pro", listing limit: 10 |
| 6 | Owner 3 | Navigate to `/list-property` | /list-property | Can create new listing (was at limit before, now has headroom) |
| 7 | Owner 3 | Navigate to `/owner-dashboard?tab=my-listings` | /owner-dashboard | Listing limit indicator shows updated count (e.g., "2/10 listings") |

**Pass criteria:** Tier upgrade reflects immediately. Listing limit increases. Commission rate should reflect Pro rate on future bookings.

---

### S-14: Membership Upgrade — Renter

**Capability:** Free-tier renter upgrades to Plus for enhanced marketplace features.

**Roles:** Renter 4 (Free tier)

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Renter 4 | Log in → `/my-trips` (Overview tab) | /my-trips | Current tier shown, upgrade prompt visible |
| 2 | Renter 4 | Click upgrade → MembershipPlans shows | /my-trips | Tier comparison: Free vs Plus ($5/mo) vs Premium ($15/mo) |
| 3 | Renter 4 | Select "Plus" → Stripe Checkout | Stripe Checkout | Plus plan at $5/month |
| 4 | Renter 4 | Complete payment | Stripe → /subscription-success | Subscription confirmed |
| 5 | Renter 4 | Return to `/my-trips` | /my-trips | Tier now "Plus", early access and exclusive deal badges visible |

**Pass criteria:** Renter tier upgrade works. UI reflects new tier perks.

---

### S-15: Referral Program End-to-End

**Capability:** Owner generates a referral code, new user signs up with it, referral is tracked.

**Roles:** Owner 1 (Alex Rivera), New User (incognito), RAV Admin

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Owner 1 | Log in → `/owner-dashboard?tab=account` → Referral section | /owner-dashboard | ReferralDashboard shows referral code (e.g., REF1a2b3c) and share link |
| 2 | Owner 1 | Copy referral link (e.g., `https://dev.rent-a-vacation.com/signup?ref=REF1a2b3c`) | /owner-dashboard | Link copied to clipboard |
| 3 | New User | Open incognito → paste referral link → navigate to it | /signup?ref=REF1a2b3c | Signup form loads with `ref` parameter captured |
| 4 | New User | Complete signup with new email | /signup | Account created, referral code recorded |
| 5 | Admin | Approve new user at `/admin?tab=pending-approvals` | /admin | User approved |
| 6 | Owner 1 | Check ReferralDashboard | /owner-dashboard?tab=account | Referral count incremented, new referral visible in list |

**Pass criteria:** Referral code captured at signup. Referral tracked to referring owner. Dashboard reflects the new referral.

---

### S-16: Search, Filter & Discovery

**Capability:** Renter uses all search and discovery features — filters, sort, compare, save search.

**Roles:** Renter 1 (Plus tier)

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Renter 1 | Log in → `/rentals` | /rentals | Full listing grid loads with filter bar |
| 2 | Renter 1 | Apply filters: Destination: Orlando, Bedrooms: 2+, Price: $100–$300/night | /rentals | Results narrow to matching listings, count updates |
| 3 | Renter 1 | Change sort: "Price: Low to High" | /rentals | Listings reorder by price ascending |
| 4 | Renter 1 | Change sort: "Price: High to Low" | /rentals | Order reverses |
| 5 | Renter 1 | Click "Save Search" (SaveSearchButton) | /rentals | Toast: "Search saved", saved to profile |
| 6 | Renter 1 | Enable Compare mode (toggle) | /rentals | Selection checkboxes appear on listing cards |
| 7 | Renter 1 | Select 2–3 listings → click "Compare" | /rentals | CompareListingsDialog opens with side-by-side comparison, "Best Value" badges |
| 8 | Renter 1 | Close compare → navigate to `/my-trips?tab=favorites` | /my-trips | Saved search visible with criteria, price tracking badge |
| 9 | Renter 1 | Navigate to `/destinations` | /destinations | 10 destinations with city counts |
| 10 | Renter 1 | Click a destination → drill into city → view listings | /destinations/:slug/:city | Filtered listings for that city |

**Pass criteria:** All filter combinations work. Sort order correct. Compare shows accurate data. Saved search persists.

---

### S-17: Notification Delivery & Preferences

**Capability:** Verify notifications are delivered for key events and that preferences control delivery.

**Roles:** Renter 1, Owner 1

**Preconditions:** Active interactions between the two (bids, bookings, or messages)

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Renter 1 | Log in → click notification bell (top nav) | Any page | NotificationBell shows unread count (if any) |
| 2 | Renter 1 | Click bell → dropdown shows recent notifications | Any page | Notifications listed with timestamps, icons, links |
| 3 | Renter 1 | Click "View All" | /notifications | Full notification feed with category filters (All, Bookings, Offers, System) |
| 4 | Renter 1 | Filter by "Bookings" | /notifications | Only booking-related notifications shown |
| 5 | Renter 1 | Navigate to `/settings/notifications` | /settings/notifications | Per-type per-channel toggles (in-app, email, SMS) |
| 6 | Renter 1 | Toggle OFF email notifications for "Booking updates" | /settings/notifications | Preference saved |
| 7 | — | Trigger a booking update (e.g., owner confirms a booking) | — | — |
| 8 | Renter 1 | Check: in-app notification arrives but NO email sent | /notifications + email | In-app ✅, Email ❌ (respects preference) |
| 9 | Owner 1 | Log in → `/settings/notifications` | /settings/notifications | Owner-specific notification types visible (bids, booking confirmations, etc.) |

**Pass criteria:** Notifications deliver per channel preferences. Toggling off a channel actually stops delivery. Bell count updates in realtime.

---

### S-18: Admin — Full Operations Cycle

**Capability:** Verify all admin tabs function, and staff role boundaries are enforced.

**Roles:** RAV Admin, RAV Staff

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Admin | Log in → `/admin` | /admin?tab=overview | Overview loads: KPI cards, pending counts, charts |
| 2 | Admin | Click through each tab (19 total): | /admin | Each tab loads without errors |
| | | → Properties | /admin?tab=properties | Property list with search, edit button |
| | | → Listings | /admin?tab=listings | Listing queue with approve/reject |
| | | → Bookings | /admin?tab=bookings | Booking list with status filters |
| | | → Escrow | /admin?tab=escrow | Escrow management with verify/release |
| | | → Issues | /admin?tab=issues | Check-in issues list |
| | | → Disputes | /admin?tab=disputes | Dispute queue with evidence viewer |
| | | → Verifications | /admin?tab=verifications | Document review queue |
| | | → Users | /admin?tab=users | User search, role display |
| | | → Approvals | /admin?tab=pending-approvals | Pending users + role upgrades |
| | | → Financials | /admin?tab=financials | Revenue charts, commission data |
| | | → Tax | /admin?tab=tax | 1099-K tracking, owner earnings |
| | | → Payouts | /admin?tab=payouts | Payout queue |
| | | → Memberships | /admin?tab=memberships | MRR metrics, tier distribution |
| | | → Settings | /admin?tab=settings | Commission rate, Staff-Only Mode |
| | | → Voice | /admin?tab=voice | Quota config, usage charts |
| | | → Resorts | /admin?tab=resorts | 117 resorts, import tool |
| | | → Notifications | /admin?tab=notifications | Catalog, events, delivery log |
| | | → API Keys | /admin?tab=api-keys | Key management |
| | | → Dev Tools | /admin?tab=dev-tools | Seed manager (DEV only) |
| 3 | Staff | Log in as `dev-staff@rent-a-vacation.com` → `/admin` | /admin | Overview loads |
| 4 | Staff | Verify can access: overview, properties, listings, bookings, escrow, issues, disputes, verifications, users, approvals | /admin | All 10 operational tabs load |
| 5 | Staff | Attempt to access admin-only tabs (financials, tax, payouts, memberships, settings, voice, resorts, notifications, api-keys, dev-tools) | /admin | Tabs NOT visible in navigation OR access denied if URL-hacked |
| 6 | Staff | Try direct URL: `/admin?tab=financials` | /admin | Redirected to overview or access denied — NOT shown financial data |

**Pass criteria:** All 19 tabs functional for admin. Staff sees only 10 tabs. Admin-only tabs are not accessible to staff even via direct URL.

---

### S-19: Stripe Payment Edge Cases

**Capability:** Verify proper handling of payment failures, 3D Secure, and card declines.

**Roles:** Renter 1

**Preconditions:** Active listing available for booking

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Renter 1 | Start checkout for a listing | /checkout | Payment form loads |
| 2 | Renter 1 | Enter **insufficient funds** card: `4000 0000 0000 9995` → Submit | /checkout | Error: "Insufficient funds" — booking NOT created |
| 3 | Renter 1 | Enter **generic decline** card: `4000 0000 0000 0002` → Submit | /checkout | Error: "Card declined" — booking NOT created |
| 4 | Renter 1 | Enter **expired card**: `4000 0000 0000 0069` → Submit | /checkout | Error: "Card expired" — booking NOT created |
| 5 | Renter 1 | Enter **3D Secure** card: `4000 0027 6000 3184` → Submit | /checkout | 3DS authentication popup appears |
| 6 | Renter 1 | Complete 3DS authentication | /checkout | Payment succeeds, redirect to `/booking-success` |
| 7 | Renter 1 | Start new checkout → enter **3DS fail** card: `4000 0084 0000 1629` → Submit | /checkout | 3DS popup → authentication fails → payment declined |

**Pass criteria:** All decline scenarios show user-friendly error messages. No booking created on failure. 3DS flow works. No stuck states.

---

### S-20: Public Pages & Unauthenticated Access

**Capability:** Verify all public pages load and protected routes redirect to login.

**Roles:** None (logged out / incognito)

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Guest | Navigate to `/` | / | Landing page loads: hero, value props, featured properties |
| 2 | Guest | Navigate to `/how-it-works` | /how-it-works | How It Works page loads with owner/renter/platform sections |
| 3 | Guest | Navigate to `/destinations` | /destinations | 10 destinations render with city counts |
| 4 | Guest | Navigate to `/faq` | /faq | FAQ accordion loads |
| 5 | Guest | Navigate to `/terms` | /terms | Terms of Service renders |
| 6 | Guest | Navigate to `/privacy` | /privacy | Privacy Policy renders |
| 7 | Guest | Navigate to `/contact` | /contact | Contact form loads |
| 8 | Guest | Navigate to `/tools` | /tools | RAV Smart Tools hub — 5 tools listed |
| 9 | Guest | Navigate to `/calculator` | /calculator | SmartEarn calculator works without login |
| 10 | Guest | Navigate to `/developers` | /developers | Public API docs / Swagger UI loads |
| 11 | Guest | Navigate to `/user-guide` | /user-guide | User guide renders |
| 12 | Guest | Navigate to `/login` | /login | Login form with email + Google OAuth |
| 13 | Guest | Navigate to `/signup` | /signup | Signup form loads |
| 14 | Guest | **Protected route test:** Navigate to `/rentals` | /login (redirect) | Redirected to login — cannot access marketplace |
| 15 | Guest | **Protected route test:** Navigate to `/admin` | /login (redirect) | Redirected to login |
| 16 | Guest | **Protected route test:** Navigate to `/my-trips` | /login (redirect) | Redirected to login |
| 17 | Guest | Navigate to `/nonexistent-page` | 404 page | Custom 404 page renders |

**Pass criteria:** All public pages load. All protected routes redirect. No broken links on public pages.

---

### S-21: Owner Multi-Listing Management

**Capability:** Owner manages multiple listings, encounters tier limits, handles drafts.

**Roles:** Owner 3 (James Thompson, Free tier — 3 listing limit)

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Owner 3 | Log in → `/owner-dashboard?tab=my-listings` | /owner-dashboard | Current listings shown with count (e.g., "2/3 listings") |
| 2 | Owner 3 | Navigate to `/list-property` → start filling form → do NOT submit (navigate away) | /list-property | Form data auto-saved to localStorage |
| 3 | Owner 3 | Return to `/list-property` | /list-property | Draft restored from localStorage — fields populated |
| 4 | Owner 3 | Complete and submit the listing | /list-property | Listing submitted (now at 3/3 limit) |
| 5 | Owner 3 | Try to create another listing → `/list-property` | /list-property | Warning: "You've reached your listing limit (3). Upgrade to Pro for up to 10 listings" |
| 6 | Owner 3 | Navigate to My Listings → try editing an existing listing | /owner-dashboard?tab=my-listings | Edit dialog opens, can modify nightly rate, dates, cancel policy |
| 7 | Owner 3 | Check listing statuses across all listings | /owner-dashboard?tab=my-listings | Each listing shows correct status (active, draft, pending, etc.) |

**Pass criteria:** Tier limits enforced. Draft persistence works. Edit functionality works. Limit warning is clear and links to upgrade.

---

### S-22: RAV Smart Tools Suite

**Capability:** All 5 RAV Smart Tools work correctly for any user (including unauthenticated).

**Roles:** Any user or guest

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Guest | Navigate to `/tools` | /tools | Hub page shows 5 tools with descriptions |
| 2 | Guest | **SmartEarn:** Navigate to `/calculator` → select brand (Hilton), enter annual maintenance $2,400, weeks owned: 1 → Calculate | /calculator | Breakeven analysis renders: nightly rate needed, annual vs rental comparison, bar chart |
| 3 | Guest | Toggle "Yield Estimator" mode in SmartEarn | /calculator | Yield calculation shows ROI percentage and projected earnings |
| 4 | Guest | **SmartCompare:** Navigate to `/tools/cost-comparator` → enter hotel nightly rate $300, nights: 7 → Calculate | /tools/cost-comparator | Comparison table: hotel vs timeshare vs RAV, savings percentage |
| 5 | Guest | **SmartMatch:** Navigate to `/tools/resort-quiz` → answer preference questions | /tools/resort-quiz | Quiz progresses, results show matched resorts with scores |
| 6 | Guest | **SmartBudget:** Navigate to `/tools/budget-planner` → enter destination, dates, guests, budget | /tools/budget-planner | Budget breakdown: accommodation, flights estimate, activities, meals |
| 7 | Guest | Verify breadcrumbs on each tool page navigate back to `/tools` | All tool pages | Breadcrumb "← RAV Smart Tools" works |

**Pass criteria:** All 5 tools calculate correctly. No login required. Responsive on mobile viewport.

---

### S-23: Date Proposal & Flexible Booking

**Capability:** Renter proposes alternative dates on a listing, owner reviews the date proposal.

**Roles:** Renter 1, Owner 1

**Preconditions:** Active listing from Owner 1 with bidding enabled

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Renter 1 | Log in → find Owner 1's bidding listing → click "Make an Offer" | /property/:id | BidFormDialog opens in 'bid' mode |
| 2 | Renter 1 | Switch to "Propose Different Dates" mode (date-proposal) | /property/:id | Dialog switches: date pickers appear, bid auto-computes from nightly rate × nights |
| 3 | Renter 1 | Select new check-in/check-out dates (different from listing), verify auto-calculated bid | /property/:id | Bid amount = nightly_rate × proposed nights. Price summary visible |
| 4 | Renter 1 | Add message: "These dates work better for our schedule" → Submit | /property/:id | Toast: "Date proposal submitted" |
| 5 | Owner 1 | Log in → `/owner-dashboard?tab=my-listings` → open BidsManagerDialog | /owner-dashboard | Date proposal visible with proposed dates, computed amount, message |
| 6 | Owner 1 | Accept or counter the date proposal | /owner-dashboard | Response sent to renter |
| 7 | Renter 1 | Check `/my-trips?tab=offers` | /my-trips | Date proposal response visible |

**Pass criteria:** Date proposal mode calculates correctly from nightly rate. Owner sees proposed dates clearly. Auto-computed amounts match.

---

### S-24: Admin Property & Listing Editing

**Capability:** Admin can edit property and listing details with audit trail.

**Roles:** RAV Admin

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Admin | Log in → `/admin?tab=properties` → select a property | /admin | Property details visible |
| 2 | Admin | Click "Edit" → AdminPropertyEditDialog opens | /admin | Fields: brand, resort, location, bedrooms, bathrooms, sleeps, description, amenities |
| 3 | Admin | Change bedrooms from 2 to 3 → Save | /admin | Success toast, property updated |
| 4 | Admin | Verify audit trail shows: "Edited by [admin email] at [timestamp]" | /admin | `last_edited_by` and `last_edited_at` populated |
| 5 | Admin | Navigate to `/admin?tab=listings` → select an active listing | /admin | Listing details with pricing |
| 6 | Admin | Click "Edit" → AdminListingEditDialog opens | /admin | Live price calculation via `computeListingPricing()` |
| 7 | Admin | Change nightly rate → observe price recalculation | /admin | Owner price, RAV markup, and final price update in real-time |
| 8 | Admin | Save changes | /admin | Listing updated, price change reflected |
| 9 | Admin | Try to edit a listing with status "booked" or "completed" | /admin | Edit button disabled or dialog shows "Cannot edit booked listing" |

**Pass criteria:** Edit dialogs work. Audit trail captured. Price calc is live. Booked listings cannot be edited.

---

### S-25: Executive Dashboard & Analytics

**Capability:** RAV Owner views strategic business metrics.

**Roles:** RAV Owner (`dev-owner@rent-a-vacation.com`)

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | RAV Owner | Log in → navigate to `/executive-dashboard` | /executive-dashboard | Dashboard loads with data |
| 2 | RAV Owner | Verify KPI cards: GMV, active listings, active users, conversion rate | /executive-dashboard | Numbers render (from seed data) |
| 3 | RAV Owner | Check liquidity score visualization | /executive-dashboard | Score renders with explanation |
| 4 | RAV Owner | Verify unit economics section | /executive-dashboard | Commission revenue, avg booking value, CAC metrics |
| 5 | RAV Owner | Check market benchmarks / industry news | /executive-dashboard | Section renders without errors |
| 6 | Staff | Log in as `dev-staff@rent-a-vacation.com` → try `/executive-dashboard` | /executive-dashboard | Access denied or redirected — staff cannot view executive dashboard |

**Pass criteria:** Dashboard renders with seed data. Staff role excluded. All chart/metric components load.

---

### S-26: Voice Search & Quota Management

**Capability:** Renter uses voice search, quota is tracked, admin can override quotas.

**Roles:** Renter 1 (Plus — 25/day quota), RAV Admin

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Renter 1 | Log in → `/rentals` → click voice search icon | /rentals | Voice search UI activates (microphone icon, waveform) |
| 2 | Renter 1 | Speak or type: "Beach vacation in Orlando" | /rentals | Results filter based on query, voice search logged |
| 3 | Admin | Log in → `/admin?tab=voice` → VoiceUsageDashboard | /admin | Usage chart shows Renter 1's recent search |
| 4 | Admin | Navigate to VoiceUserOverrideManager | /admin | Can search for Renter 1 by email |
| 5 | Admin | Set custom quota override for Renter 1: 50/day (instead of 25) | /admin | Override saved |
| 6 | Admin | Alternatively: disable voice for a specific user | /admin | User disabled flag saved |
| 7 | Renter 1 | If disabled: try voice search → see "Voice search has been disabled" message | /rentals | Disabled message shown (if admin disabled) |
| 8 | Admin | Check VoiceObservability tab — log viewer | /admin | Recent voice search logs with query, duration, result count |

**Pass criteria:** Voice search logs correctly. Admin override takes effect. Disabled users see clear message.

---

### S-27: API Key & Developer Portal

**Capability:** Admin creates API key, tests endpoint, manages key lifecycle.

**Roles:** RAV Admin

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Admin | Log in → `/admin?tab=api-keys` | /admin | API key management interface loads |
| 2 | Admin | Click "Create Key" → fill: name "Test Key", tier "partner", optional IP allowlist | /admin | Key created, full key shown ONCE (copy it) |
| 3 | Admin | Verify key appears in list with masked display | /admin | Key listed with `rav_...` prefix, creation date, tier |
| 4 | Guest | Navigate to `/developers` (public API docs) | /developers | Swagger UI loads with available endpoints |
| 5 | Admin | Test API endpoint via curl or Swagger: GET `/api/listings` with API key header | — | Returns listing data (JSON), rate limit headers present |
| 6 | Admin | Back to `/admin?tab=api-keys` → click "Revoke" on the test key → confirm in AlertDialog | /admin | Key revoked, status changes |
| 7 | Admin | Test same API call with revoked key | — | Returns 401 Unauthorized |

**Pass criteria:** Key creation shows key once. API returns data with valid key. Revoked key is rejected. Rate limits in response headers.

---

### S-28: iCal Export & Calendar Integration

**Capability:** Owner exports bookings as an ICS calendar file.

**Roles:** Owner 1 (Alex Rivera)

**Preconditions:** Owner 1 has bookings (from seed data)

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Owner 1 | Log in → `/owner-dashboard?tab=bookings-earnings` | /owner-dashboard | Booking list visible |
| 2 | Owner 1 | Click "Export Calendar" button | /owner-dashboard | ICS file downloads |
| 3 | Owner 1 | Open ICS file in text editor or calendar app | Local | Valid iCalendar format: BEGIN:VCALENDAR, events for each booking with check-in/out dates, property name, guest info |
| 4 | Owner 1 | Verify: event dates match booking dates, summary includes property name | Local | Data accuracy confirmed |

**Pass criteria:** ICS file downloads. Valid RFC 5545 format. Booking data accurate.

---

### S-29: GDPR Data Export & Deletion

**Capability:** User requests data export and account deletion with grace period.

**Roles:** Renter (use a renter account you can afford to lose, e.g., `renter050@rent-a-vacation.com`)

#### Steps

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Renter 50 | Log in → `/account` | /account | Account settings page loads |
| 2 | Renter 50 | Click "Export My Data" | /account | Data export generated (JSON or download) — includes profile, bookings, preferences |
| 3 | Renter 50 | Click "Delete My Account" | /account | Confirmation dialog: warns about 14-day grace period, irreversibility |
| 4 | Renter 50 | Confirm deletion | /account | Account marked for deletion, logged out |
| 5 | Renter 50 | Try to log back in within grace period | /login | Either: can log in and cancel deletion, OR shown "Account scheduled for deletion" message |

**Pass criteria:** Data export contains user's data. Deletion has clear warning. Grace period functions.

---

### S-30: Complete Marketplace Cycle

**Capability:** THE FULL LIFECYCLE — from listing to payout, touching every major feature.

**Roles:** Owner 1 (Alex), Renter 1 (Sophia), RAV Admin

**Duration:** ~25 minutes. This is the master scenario.

#### Phase A: Owner Lists Property

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 1 | Owner 1 | Log in → `/list-property` | /list-property | Form loads |
| 2 | Owner 1 | Create listing: Hilton property in Las Vegas, 2BR, 7 nights starting 60 days out, $250/night, Moderate cancellation, Open for Bidding | /list-property | Submitted, status "Pending Approval" |

#### Phase B: Admin Approves

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 3 | Admin | Log in → `/admin?tab=listings` → approve Owner 1's new listing | /admin | Listing status: "Active" |

#### Phase C: Renter Discovers & Bids

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 4 | Renter 1 | Log in → `/rentals` → search Las Vegas → find new listing | /rentals | Listing visible with "Open for Bidding" badge |
| 5 | Renter 1 | View property → "Ask the Owner" → send inquiry: "Is parking included?" | /property/:id | Inquiry sent |
| 6 | Owner 1 | Check notification → reply: "Yes, free self-parking!" | InquiryThread | Reply sent |
| 7 | Renter 1 | View reply → "Place Bid" → bid at $1,500 (vs listed ~$2,012) with message | /property/:id | Bid submitted |

#### Phase D: Negotiation & Booking

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 8 | Owner 1 | Open BidsManagerDialog → counter-offer at $1,750 | /owner-dashboard | Counter sent |
| 9 | Renter 1 | View counter in My Trips → Accept | /my-trips | Redirected to checkout at $1,750 |
| 10 | Renter 1 | Pay with Stripe test card | /checkout | Payment succeeds → `/booking-success` |
| 11 | Renter 1 | View BookingTimeline | /booking-success | Payment ✅, Owner Confirmation ⏳ |

#### Phase E: Owner Confirms

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 12 | Owner 1 | Check notification → go to Bookings & Earnings → Confirm booking → enter RST confirmation number | /owner-dashboard | Booking confirmed |
| 13 | Renter 1 | Check My Trips → booking "Confirmed" | /my-trips | Timeline updated |

#### Phase F: Admin Verifies Escrow

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 14 | Admin | `/admin?tab=escrow` → verify confirmation → release escrow | /admin | Escrow released |

#### Phase G: Booking Messages

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 15 | Renter 1 | Open booking message thread → "What time is check-in?" | /my-trips | Message sent |
| 16 | Owner 1 | View message → reply: "Check-in is at 4pm, front desk will have your key" | /owner-dashboard | Reply delivered in realtime |

#### Phase H: Post-Stay

| # | As | Action | Page | Checkpoint |
|---|-----|--------|------|------------|
| 17 | Renter 1 | After stay: submit review (5 stars, "Amazing property!") | /my-trips | Review submitted |
| 18 | Owner 1 | Check Bookings & Earnings → payout status | /owner-dashboard | Payout = $1,750 − 13% commission (Pro tier) = $1,522.50 |
| 19 | Admin | `/admin?tab=payouts` → verify payout amount → initiate | /admin | Payout processed |
| 20 | Owner 1 | Verify earnings updated | /owner-dashboard | Payout status: "Paid" |

**Pass criteria:** Every phase transitions correctly to the next. Amounts are consistent throughout (bid → counter → payment → commission → payout). All notifications deliver. Realtime messaging works. Review persists.

---

## Scenario Dependencies & Suggested Execution Order

For a fresh test run against reseeded data, execute in this order:

### Tier 1: Foundation (run first — these create data for later scenarios)
1. **S-20** — Public pages (no data dependency)
2. **S-22** — Smart Tools (no data dependency)
3. **S-01** — New user onboarding
4. **S-03** — Listing creation & approval

### Tier 2: Core Marketplace (the money flows)
5. **S-04** — Direct booking happy path
6. **S-05** — Bidding & counter-offer
7. **S-06** — Travel request & proposal
8. **S-23** — Date proposal & flexible booking
9. **S-19** — Stripe edge cases

### Tier 3: Communication & Lifecycle
10. **S-07** — Pre-booking inquiry
11. **S-08** — Booking messaging & realtime
12. **S-17** — Notifications & preferences
13. **S-09** — Renter cancellation
14. **S-10** — Owner cancellation
15. **S-11** — Dispute resolution

### Tier 4: Business Operations
16. **S-12** — Owner earnings & payout
17. **S-13** — Membership upgrade (owner)
18. **S-14** — Membership upgrade (renter)
19. **S-15** — Referral program
20. **S-16** — Search, filter & discovery

### Tier 5: Admin & Platform
21. **S-18** — Admin full operations
22. **S-24** — Admin editing
23. **S-25** — Executive dashboard
24. **S-26** — Voice search & quotas
25. **S-27** — API key & developer portal
26. **S-28** — iCal export
27. **S-02** — Owner role upgrade

### Tier 6: Edge Cases & Cleanup
28. **S-29** — GDPR export & deletion
29. **S-21** — Multi-listing & tier limits

### Tier 7: Master Validation
30. **S-30** — Complete marketplace cycle (run last as final validation)

---

## Google Sheets Template Structure

When transferring to Google Sheets for tracking, use this structure:

### Sheet 1: "Run Log"
| Run # | Date | Tester | Environment | Seed Version | Scenarios Run | Pass | Fail | Blocked | Notes |
|-------|------|--------|-------------|-------------|--------------|------|------|---------|-------|

### Sheet 2: "Scenario Results" (one row per scenario per run)
| Run # | Scenario | Status (Pass/Fail/Blocked/Skip) | Failed Step # | Bug Issue # | Time Taken | Notes |
|-------|----------|------|--------------|------------|------------|-------|

### Sheet 3-32: One sheet per scenario (S-01 through S-30)
Copy the step table from this document into each sheet, adding columns:
| # | As | Action | Page | Checkpoint | Run 1 (date) | Run 2 (date) | Run 3 (date) | Notes |
Each run column gets ✅/❌/⏭️ per step.

### Sheet 33: "Coverage Matrix"
| Feature Area | Scenarios Covering It | Last Tested | Status |
|---|---|---|---|

---

## Maintenance Notes

- **After adding a new feature:** Create a new scenario (S-31+) or extend an existing one
- **After schema changes:** Check if affected scenarios need step updates
- **Before each release:** Run Tier 1 + Tier 2 + S-30 at minimum
- **Full regression:** Run all 30 scenarios (~4-5 hours)
- **Reseed before testing:** Always reseed DEV data before a full run to ensure clean state
