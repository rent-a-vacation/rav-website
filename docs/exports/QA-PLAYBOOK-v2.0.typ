// ============================================================================
// Rent-A-Vacation — QA Testing Playbook (Typst Document)
// Compile: typst compile docs/exports/QA-PLAYBOOK.typ docs/exports/QA-PLAYBOOK.pdf
// ============================================================================

#import "rav-brand-template.typ": *

// --- Cover Page -------------------------------------------------------------
#rav-cover(
  logo-path: "../../public/rav-logo.png",
  mascot-path: "../../public/ravio-v2.png",
  title: "QA Testing Playbook",
  subtitle: "Version 2.0 — Manual Testing Reference for Team Testers",
  date: "April 5, 2026",
  tagline: "Your Timeshare. Their Dream Vacation.",
  about: "Rent-A-Vacation (RAV) is a peer-to-peer marketplace connecting timeshare owners with travelers seeking premium vacation rentals at below-market rates. This playbook provides step-by-step manual test scenarios organized by role.",
)

// --- Document Body ----------------------------------------------------------
#show: body => rav-setup(
  logo-path: "../../public/rav-logo.png",
  classification: "For Authorized Team Members",
  body,
)

// --- Table of Contents ------------------------------------------------------
#outline(title: "Table of Contents", indent: 1.5em, depth: 2)
#pagebreak()

// ============================================================================
= Quick Reference Card
// ============================================================================

== Environment

#rav-table(
  ("Item", "Value"),
  widths: (1fr, 2fr),
  [DEV URL], [#raw("https://dev.rent-a-vacation.com")],
  [PROD URL], [#raw("https://rent-a-vacation.com") *(DO NOT test here)*],
  [Stripe Dashboard], [#raw("https://dashboard.stripe.com") (toggle to Test mode)],
  [GitHub Issues], [#raw("https://github.com/rent-a-vacation/rav-website/issues")],
)

== Foundation Accounts

*Universal password for all accounts:* #raw("SeedTest2026!")

=== RAV Team

#rav-table(
  ("Email", "Role", "Access Level"),
  widths: (2fr, 1fr, 2fr),
  [#raw("dev-owner@rent-a-vacation.com")], [RAV Owner], [Full admin — all tabs],
  [#raw("dev-admin@rent-a-vacation.com")], [RAV Admin], [Admin — all tabs],
  [#raw("dev-staff@rent-a-vacation.com")], [RAV Staff], [Staff — 10 operational tabs only],
)

=== Property Owners

#rav-table(
  ("Email", "Name", "Brand", "Tier"),
  widths: (2fr, 1fr, 1.5fr, 1fr),
  [#raw("owner1@rent-a-vacation.com")], [Alex Rivera], [Hilton Grand Vacations], [*Pro* (#raw("$10/mo"))],
  [#raw("owner2@rent-a-vacation.com")], [Maria Chen], [Marriott Vacation Club], [*Business* (#raw("$25/mo"))],
  [#raw("owner3@rent-a-vacation.com")], [James Thompson], [Disney Vacation Club], [Free],
  [#raw("owner4@rent-a-vacation.com")], [Priya Patel], [Wyndham Destinations], [Free],
  [#raw("owner5@rent-a-vacation.com")], [Robert Kim], [Bluegreen Vacations], [Free],
)

=== Renters

50 accounts: #raw("renter001@rent-a-vacation.com") through #raw("renter050@rent-a-vacation.com") \
Password: #raw("SeedTest2026!")

*Tier assignments (after seed):*
- renter001–002: *Plus* (#raw("$5/mo")) — 25 voice searches/day
- renter003: *Premium* (#raw("$15/mo")) — unlimited voice, concierge support
- renter004–050: Free — 5 voice searches/day

== Stripe Test Cards

#rav-table(
  ("Scenario", "Card Number", "Expected"),
  widths: (1.5fr, 2fr, 1.5fr),
  [*Success (default)*], [#raw("4242 4242 4242 4242")], [Payment completes],
  [Visa debit], [#raw("4000 0566 5566 5556")], [Payment completes],
  [Mastercard], [#raw("5555 5555 5555 4444")], [Payment completes],
  [Amex (4-digit CVC)], [#raw("3782 822463 10005")], [Payment completes],
  [Insufficient funds], [#raw("4000 0000 0000 9995")], [Decline — error shown],
  [Generic decline], [#raw("4000 0000 0000 0002")], [Decline — error shown],
  [Expired card], [#raw("4000 0000 0000 0069")], [Decline — error shown],
  [3D Secure], [#raw("4000 0027 6000 3184")], [Auth popup — complete it],
  [3DS fails], [#raw("4000 0084 0000 1629")], [Auth popup — declined],
)

For all test cards: any future expiry (e.g., `12/28`), any 3-digit CVC (e.g., `123`), any ZIP (e.g., `32256`).

== How to Manage DEV Data

Two options in Admin Dashboard → Dev Tools tab:

*Reset & Reseed DEV* — Wipes all test data and recreates from scratch. Use when you want a clean slate.
+ Log in as any RAV team account on DEV
+ Navigate to Admin Dashboard → Dev Tools tab
+ Click "Reset & Reseed DEV" and confirm
+ Wait 30–60 seconds for completion

*Update Seed Data* — Adds new feature data without deleting anything. Use after code updates to get new test data while keeping your manual testing intact.
+ Navigate to Admin Dashboard → Dev Tools tab
+ Click "Update Seed Data" and confirm
+ Completes in ~10 seconds

== How to Report Bugs

Create a GitHub Issue with: Title ("Bug: ..."), labels (bug + area), steps to reproduce, expected vs actual behavior, screenshot, account used, and browser/device.

#pagebreak()

// ============================================================================
= Role 1: Traveler (Renter)
// ============================================================================

#rav-info[Log in as: #raw("renter001@rent-a-vacation.com") / #raw("SeedTest2026!")]

== Discovery & Search

#test-case("TC-T-001", "Browse the Landing Page",
  page: "/",
  steps: (
    "Navigate to dev.rent-a-vacation.com",
    "Observe the hero section, featured resorts, and CTA buttons",
    "Click \"Browse Rentals\" CTA",
  ),
  expected: "Landing page loads with header, hero, featured listings, and footer. CTA navigates to /rentals.",
)

#test-case("TC-T-002", "How It Works Page",
  page: "/how-it-works",
  steps: (
    "Navigate to /how-it-works",
    "Review the traveler and owner sections",
    "Check the pricing section",
  ),
  expected: "Page explains the platform for both travelers and owners. Commission rate shown as 15%.",
)

#test-case("TC-T-003", "Browse Vacation Rentals",
  page: "/rentals",
  steps: (
    "Navigate to /rentals",
    "Observe the listing grid",
    "Verify each listing card shows: resort name, location, dates, nightly rate, total price",
  ),
  expected: "Listings load with property cards. Prices show nightly rate with RAV markup.",
)

#test-case("TC-T-004", "Search by Location",
  page: "/rentals",
  steps: (
    "On /rentals, type \"Orlando\" in the search bar",
    "Press Enter or click search",
    "Observe filtered results",
  ),
  expected: "Only listings in Orlando (or with Orlando in resort name) appear.",
)

#test-case("TC-T-005", "Filter and Sort Listings",
  page: "/rentals",
  steps: (
    "Use brand/location/date/price filters",
    "Change sort order (price low→high, high→low, newest)",
    "Clear all filters",
  ),
  expected: "Listings update immediately. Sort order changes. Clearing shows all listings.",
)

#test-case("TC-T-006", "Voice Search",
  page: "/rentals",
  steps: (
    "Click the microphone/voice search button",
    "Say \"I want a 2-bedroom in Orlando for next month\"",
    "Wait for results",
  ),
  expected: "Voice assistant processes the query and filters listings accordingly.",
)

#test-case("TC-T-007", "Text Chat with RAVIO",
  page: "Any page (floating chat widget)",
  steps: (
    "Click the RAVIO chat icon (bottom-right)",
    "Type \"What timeshare resorts do you have in Hawaii?\"",
    "Wait for response",
  ),
  expected: "RAVIO responds with relevant resort information. Chat is conversational.",
)

#test-case("TC-T-008", "Explore Destinations",
  page: "/destinations",
  steps: (
    "Navigate to /destinations",
    "Browse the 10 destination cards",
    "Click a destination (e.g., Orlando)",
    "Click a specific city within that destination",
  ),
  expected: "Destination grid loads. Clicking shows detail with cities and related listings.",
)

== Property Detail & Comparison

#test-case("TC-T-009", "View Property Detail",
  page: "/property/:id",
  steps: (
    "From /rentals, click on any listing card",
    "Review: photos, description, amenities, pricing breakdown, cancellation policy",
    "Check the Fair Value badge/score",
    "Check the \"Ask the Owner\" button",
  ),
  expected: "Full detail loads. Price breakdown shows nightly rate, nights, RAV fee, total. Cancellation policy with color-coded refund tiers.",
)

#test-case("TC-T-010", "Compare Properties",
  page: "/rentals",
  steps: (
    "Toggle \"Compare\" mode on /rentals",
    "Select 2–3 listings using checkboxes",
    "Click \"Compare Selected\" in the floating bar",
    "Review the comparison dialog",
  ),
  expected: "Side-by-side comparison with price, location, bedrooms, amenities. \"Best\" badges highlight best values. Max 3 listings.",
)

#test-case("TC-T-011", "Save a Search",
  page: "/rentals",
  steps: (
    "Apply filters (e.g., Orlando, 2 bedrooms)",
    "Click \"Save Search\"",
    "Navigate to /my-trips → Favorites tab",
  ),
  expected: "Search saved. Appears in saved searches with option to re-run or delete. Price drop badges when applicable.",
)

#test-case("TC-T-012", "Add to Favorites",
  page: "/property/:id",
  steps: (
    "Click the heart/favorite icon",
    "Navigate to /my-trips → Favorites tab",
  ),
  expected: "Property appears in favorites. Can be removed by clicking heart again.",
)

== Bidding & Offers

#test-case("TC-T-013", "Place a Bid on a Listing",
  page: "/property/:id (bidding-enabled)",
  steps: (
    "Find a listing with \"Open for Bidding\" badge",
    "Click \"Place Bid\"",
    "Enter a bid amount",
    "Submit the bid",
  ),
  expected: "Bid submitted. Confirmation toast shown. Bid appears in /my-trips → Offers tab.",
)

#test-case("TC-T-014", "Submit a Date Proposal",
  page: "/property/:id",
  steps: (
    "Click \"Propose Different Dates\"",
    "Select check-in and check-out dates",
    "Observe auto-computed bid (nightly rate × nights + 15%)",
    "Submit the date proposal",
  ),
  expected: "Date proposal sent. Auto-computed price reflects nightly rate × nights with markup.",
)

#test-case("TC-T-015", "Create a Travel Request",
  page: "/bidding",
  steps: (
    "Navigate to /bidding",
    "Click \"Post Travel Request\"",
    "Fill in destination, dates, guests, budget",
    "Submit",
  ),
  expected: "Travel request created. Appears in the marketplace for owners.",
)

#test-case("TC-T-016", "Inspired Travel Request from Listing",
  page: "/property/:id",
  steps: (
    "Click \"Request Similar\" or \"Send to this Owner\"",
    "Review pre-filled form (destination, dates from listing)",
    "Toggle \"Send to this owner first\"",
    "Submit",
  ),
  expected: "Travel request created with pre-filled data. If toggled, request is targeted to owner.",
)

#test-case("TC-T-017", "View My Offers",
  page: "/my-trips?tab=offers",
  steps: (
    "Navigate to /my-trips → Offers tab",
    "Review submitted bids and statuses",
  ),
  expected: "All bids listed with status (pending, accepted, rejected, expired).",
)

== Booking & Payment

#test-case("TC-T-018", "Checkout — Successful Payment",
  page: "/checkout",
  steps: (
    "Click \"Book Now\" from listing detail",
    "Review booking summary and fee breakdown",
    "Enter card: 4242 4242 4242 4242, expiry 12/28, CVC 123",
    "Complete payment",
  ),
  expected: "Payment succeeds. Redirect to /booking-success with confirmation and timeline.",
)

#test-case("TC-T-019", "Checkout — Declined Card",
  page: "/checkout",
  steps: (
    "Enter card 4000 0000 0000 9995 (insufficient funds)",
    "Attempt payment",
  ),
  expected: "Payment fails. Error message displayed. No booking created.",
)

#test-case("TC-T-020", "Checkout — 3D Secure Card",
  page: "/checkout",
  steps: (
    "Enter card 4000 0027 6000 3184",
    "Complete the 3DS authentication popup",
  ),
  expected: "3DS popup appears. After authentication, booking succeeds normally.",
)

#test-case("TC-T-021", "Booking Success Page",
  page: "/booking-success",
  steps: (
    "After successful checkout, observe the success page",
    "Check booking timeline (Booked → Confirmed → Check-in → Stay → Complete)",
    "Verify confirmation details",
  ),
  expected: "Timeline shows \"Booked\" as complete, remaining steps upcoming. Confirmation number displayed.",
)

== Renter Dashboard

#test-case("TC-T-022", "My Trips — Overview Tab",
  page: "/my-trips",
  steps: (
    "Navigate to /my-trips",
    "Review: upcoming trips, check-in countdown, quick stats",
  ),
  expected: "Overview shows upcoming bookings with countdown. Stats include total trips and money saved.",
)

#test-case("TC-T-023", "My Trips — Bookings Tab",
  page: "/my-trips?tab=bookings",
  steps: (
    "Click Bookings tab",
    "Review past and upcoming bookings",
    "Click a booking to view details",
  ),
  expected: "All bookings listed with status badges. Can view details, timeline, and messaging.",
)

#test-case("TC-T-024", "My Trips — Offers Tab",
  page: "/my-trips?tab=offers",
  steps: (
    "Click Offers tab",
    "Review submitted bids and travel requests",
  ),
  expected: "Bids and proposals listed with current status.",
)

#test-case("TC-T-025", "My Trips — Favorites Tab",
  page: "/my-trips?tab=favorites",
  steps: (
    "Click Favorites tab",
    "Review saved properties and saved searches",
  ),
  expected: "Favorited properties and saved searches displayed. Price drop badges if applicable.",
)

== Post-Booking Actions

#test-case("TC-T-026", "Cancel a Booking (Renter)",
  page: "/my-trips?tab=bookings",
  steps: (
    "Find an active booking",
    "Click \"Cancel Booking\"",
    "Review cancellation policy and refund amount",
    "Confirm cancellation",
  ),
  expected: "Dialog shows policy-based refund. After confirming, status changes and Stripe refund processed.",
)

#test-case("TC-T-027", "Report an Issue (Renter)",
  page: "/my-trips?tab=bookings",
  steps: (
    "Find a booking and click \"Report Issue\"",
    "Select issue category",
    "Describe the problem, optionally upload evidence",
    "Submit",
  ),
  expected: "Issue/dispute created. Appears in admin disputes queue.",
)

#test-case("TC-T-028", "Traveler Check-In",
  page: "/checkin",
  steps: (
    "Navigate to /checkin",
    "Find an upcoming eligible booking",
    "Complete the check-in process",
  ),
  expected: "Check-in status updated. Booking timeline reflects completion.",
)

#test-case("TC-T-029", "Pre-Booking Inquiry",
  page: "/property/:id",
  steps: (
    "Click \"Ask the Owner\"",
    "Type a question",
    "Send the message",
  ),
  expected: "Inquiry created. Owner receives notification. Reply thread works.",
)

#test-case("TC-T-030", "Booking Message Thread",
  page: "/my-trips?tab=bookings → detail",
  steps: (
    "Open a booking detail",
    "Send a message in the thread",
    "Observe realtime updates (no refresh)",
  ),
  expected: "Message sends instantly. Realtime subscription shows new messages.",
)

== Account & Tools

#test-case("TC-T-031", "Account Settings",
  page: "/account",
  steps: (
    "Navigate to /account",
    "Update profile info (name, phone)",
    "Change password",
    "Review membership tier and notification preferences",
  ),
  expected: "Profile updates save. Password change works. Tier displayed correctly.",
)

#test-case("TC-T-032", "RAV SmartEarn (Calculator)",
  page: "/calculator",
  steps: (
    "Navigate to /calculator",
    "Select a brand (e.g., Hilton Grand Vacations)",
    "Enter maintenance fee amount",
    "Toggle yield estimator mode",
    "Review breakeven analysis",
  ),
  expected: "Calculator shows breakeven point, listing price, yield estimate. 9 brands available.",
)

#test-case("TC-T-033", "RAV SmartCompare",
  page: "/tools/cost-comparator",
  steps: (
    "Navigate to /tools/cost-comparator",
    "Enter comparison parameters",
    "Review results",
  ),
  expected: "Side-by-side cost comparison of timeshare rental vs hotel/other options.",
)

#test-case("TC-T-034", "RAV SmartMatch (Resort Quiz)",
  page: "/tools/resort-quiz",
  steps: (
    "Navigate to /tools/resort-quiz",
    "Answer quiz questions about preferences",
    "Review matched resorts",
  ),
  expected: "Quiz recommends resorts based on answers. Results link to listings.",
)

#test-case("TC-T-035", "RAV SmartBudget",
  page: "/tools/budget-planner",
  steps: (
    "Navigate to /tools/budget-planner",
    "Enter budget parameters",
    "Review vacation budget plan",
  ),
  expected: "Budget breakdown showing affordability within given budget.",
)

#test-case("TC-T-036", "RAV Smart Suite Hub",
  page: "/tools",
  steps: (
    "Navigate to /tools",
    "Verify 5 tools listed: SmartEarn, SmartPrice, SmartCompare, SmartMatch, SmartBudget",
    "Click each tool card",
  ),
  expected: "Hub shows all tools with descriptions. Each links to correct tool page.",
)

#test-case("TC-T-037", "FAQ Page",
  page: "/faq",
  steps: (
    "Navigate to /faq",
    "Expand/collapse FAQ sections",
  ),
  expected: "FAQs organized by category. Accordion works.",
)

#test-case("TC-T-038", "Contact Page",
  page: "/contact",
  steps: (
    "Navigate to /contact",
    "Fill in the contact form",
    "Submit",
  ),
  expected: "Form submits. Confirmation message shown.",
)

#pagebreak()

// ============================================================================
= Role 2: Property Owner
// ============================================================================

#rav-info[Log in as: #raw("owner1@rent-a-vacation.com") (Alex Rivera) / #raw("SeedTest2026!")]

== Listing a Property

#test-case("TC-O-001", "List Property — Step 1 (Details)",
  page: "/list-property",
  steps: (
    "Navigate to /list-property",
    "Select brand (e.g., Hilton Grand Vacations)",
    "Enter resort name, unit details (bedrooms, bathrooms, sleeps)",
    "Add location, description, amenities",
    "Proceed to Step 2",
  ),
  expected: "Form validates required fields. Draft auto-saved. Brand shows relevant resorts.",
)

#test-case("TC-O-002", "List Property — Step 2 (Pricing)",
  page: "/list-property (step 2)",
  steps: (
    "Enter nightly rate",
    "Observe live price summary (nightly × nights + 15% markup = total)",
    "Check pricing suggestion from market data",
    "Set check-in/check-out dates",
    "Choose cancellation policy",
  ),
  expected: "Price updates in real-time. Pricing suggestion shows market range. Cancellation options clear.",
)

#test-case("TC-O-003", "List Property — Step 3 (Submit)",
  page: "/list-property (step 3)",
  steps: (
    "Review all property and listing details",
    "Submit for approval",
    "Check listing in Owner Dashboard as \"pending\"",
  ),
  expected: "Summary shows all data. Status = pending_approval. Redirects to Owner Dashboard.",
)

#test-case("TC-O-004", "Save Draft and Resume",
  page: "/list-property",
  steps: (
    "Start listing, fill in some fields",
    "Navigate away",
    "Return to /list-property",
  ),
  expected: "Draft preserved. Previously entered data loads on return.",
)

#test-case("TC-O-005", "Enable Bidding",
  page: "/owner-dashboard → My Listings",
  steps: (
    "Find an approved listing",
    "Toggle \"Open for Bidding\"",
    "Set bidding duration (7–14 days)",
  ),
  expected: "Listing appears in /bidding marketplace. Bidding badge shown.",
)

== Owner Dashboard

#test-case("TC-O-006", "Dashboard — Overview Tab",
  page: "/owner-dashboard",
  steps: (
    "Navigate to /owner-dashboard",
    "Review KPI cards: listings, bookings, earnings, fees coverage",
    "Check earnings timeline chart",
    "Review maintenance fee tracker",
  ),
  expected: "KPI cards show correct counts. Chart displays monthly data. Fees coverage calculated.",
)

#test-case("TC-O-007", "Dashboard — My Listings Tab",
  page: "/owner-dashboard?tab=my-listings",
  steps: (
    "Click \"My Listings\" tab",
    "Review properties and listings",
    "Edit a listing's nightly rate",
    "Observe price recalculation",
  ),
  expected: "All owned items displayed. Editing rate recalculates total with 15% markup.",
)

#test-case("TC-O-008", "Dashboard — Bookings & Earnings Tab",
  page: "/owner-dashboard?tab=bookings-earnings",
  steps: (
    "Click \"Bookings & Earnings\" tab",
    "Review booking list with statuses",
    "Expand earnings section",
    "Check payout history",
  ),
  expected: "Bookings listed with badges. Earnings show gross, commission, net.",
)

#test-case("TC-O-009", "Dashboard — Account Tab",
  page: "/owner-dashboard?tab=account",
  steps: (
    "Click \"Account\" tab",
    "Review profile, referral dashboard, membership tier",
  ),
  expected: "Profile info displayed. Referral code and stats visible. Tier shown.",
)

== Booking Management

#test-case("TC-O-010", "Respond to a Bid",
  page: "/owner-dashboard?tab=bookings-earnings",
  steps: (
    "Find a pending bid notification",
    "Review bid details (amount, dates, traveler)",
    "Accept or reject",
  ),
  expected: "Accepting creates bookable offer. Rejecting notifies renter.",
)

#test-case("TC-O-011", "Confirm a Booking",
  page: "/owner-dashboard?tab=bookings-earnings",
  steps: (
    "Find booking in \"pending_confirmation\" status",
    "Review details",
    "Click \"Confirm Booking\"",
  ),
  expected: "Booking moves to \"confirmed\". Renter notified. Escrow released on schedule.",
)

#test-case("TC-O-012", "Cancel a Booking (Owner)",
  page: "/owner-dashboard?tab=bookings-earnings",
  steps: (
    "Find an active booking",
    "Click \"Cancel Booking\"",
    "Review terms (owner cancel = full refund to renter)",
    "Confirm",
  ),
  expected: "Booking cancelled. Renter gets full refund. Owner cancellation count increments.",
)

#test-case("TC-O-013", "Report an Issue (Owner)",
  page: "/owner-dashboard?tab=bookings-earnings",
  steps: (
    "Find a booking, click \"Report Issue\"",
    "Select owner category (5 types)",
    "Upload evidence photos",
    "Submit",
  ),
  expected: "Dispute created with evidence. Appears in admin queue.",
)

#test-case("TC-O-014", "Reply to Inquiry",
  page: "/owner-dashboard (notifications)",
  steps: (
    "Find a pre-booking inquiry from renter",
    "Open inquiry thread",
    "Type and send a reply",
  ),
  expected: "Reply sends. Renter sees response. Realtime updates.",
)

#test-case("TC-O-015", "Booking Message Thread",
  page: "/owner-dashboard?tab=bookings-earnings",
  steps: (
    "Open a booking detail",
    "Send a message in the thread",
  ),
  expected: "Message appears instantly via realtime.",
)

== Earnings & Payouts

#test-case("TC-O-016", "iCal Calendar Export",
  page: "/owner-dashboard?tab=bookings-earnings",
  steps: (
    "Click \"Export Calendar\"",
    "Save the .ics file",
    "Import into Google Calendar or Outlook",
  ),
  expected: "Downloads valid .ics file (RFC 5545). Events match booked dates.",
)

#test-case("TC-O-017", "Stripe Connect Onboarding",
  page: "/owner-dashboard?tab=bookings-earnings",
  steps: (
    "Find Stripe Connect banner",
    "Click \"Connect with Stripe\"",
    "Complete Stripe onboarding (Express account)",
    "Return to RAV",
  ),
  expected: "Banner shows 3 states: not connected, incomplete, connected. After completion, payouts enabled.",
)

#test-case("TC-O-018", "Earnings and Dynamic Pricing",
  page: "/owner-dashboard?tab=bookings-earnings",
  steps: (
    "Review earnings breakdown",
    "Check pricing intelligence",
    "Observe dynamic pricing factors (urgency, season, demand)",
  ),
  expected: "Earnings show gross, commission (15%), net. Dynamic pricing shows factor badges.",
)

== Referral & Profile

#test-case("TC-O-019", "Referral Dashboard",
  page: "/owner-dashboard?tab=account",
  steps: (
    "Find Referral Dashboard in Account tab",
    "Copy referral code",
    "Review stats (total, successful, pending)",
  ),
  expected: "Unique code displayed. Stats show referral funnel.",
)

#test-case("TC-O-020", "Referral Signup Flow",
  page: "/signup?ref=CODE",
  steps: (
    "Copy owner's referral code",
    "Open incognito, navigate to /signup?ref=CODE",
    "Complete signup",
  ),
  expected: "Referral code captured. Both referrer and referee tracked.",
)

#test-case("TC-O-021", "Pricing Suggestion",
  page: "/list-property (step 2)",
  steps: (
    "While setting nightly rate, observe suggestion",
    "Check market range bar and competitive label",
  ),
  expected: "Shows min/median/max from similar listings. Label shows competitive position.",
)

#test-case("TC-O-022", "Identity Verification",
  page: "/owner-dashboard?tab=account",
  steps: (
    "Check verification status",
    "If unverified, initiate verification",
  ),
  expected: "Status clearly shown. Age verification gate functions.",
)

#test-case("TC-O-023", "Membership Tier Display",
  page: "/owner-dashboard?tab=account",
  steps: (
    "Review current tier (Free/Pro/Business)",
    "Check tier benefits",
  ),
  expected: "Correct tier displayed. Benefits match (Pro: −2%, Business: −5%).",
)

#test-case("TC-O-024", "Role Upgrade Request",
  page: "/account",
  steps: (
    "As a renter, request upgrade to owner",
    "Observe role upgrade dialog",
    "Submit request",
  ),
  expected: "Request sent. Renter sees pending state. On approval, notification + email + auto-detect via realtime.",
)

#test-case("TC-O-025", "Respond to Travel Request",
  page: "/owner-dashboard",
  steps: (
    "Find matching travel request",
    "Submit proposal with listing",
    "Observe proposal in marketplace",
  ),
  expected: "Proposal links to listing. Traveler notified.",
)

#test-case("TC-O-026", "Owner Profile Card",
  page: "/property/:id",
  steps: (
    "As renter, view a listing by owner1",
    "Check Owner Profile Card",
  ),
  expected: "Shows name, member since, listing count, response time, verification badge.",
)

#test-case("TC-O-027", "Notification Bell",
  page: "Any page (header)",
  steps: (
    "Check notification bell",
    "Observe unread count",
    "Click to view, mark as read",
  ),
  expected: "Bell shows unread count. Updates in realtime. Clicking marks as read.",
)

#test-case("TC-O-028", "Portfolio Analytics",
  page: "/owner-dashboard",
  steps: (
    "Review portfolio analytics in overview",
    "Check property performance metrics",
  ),
  expected: "Portfolio summary across all owned properties.",
)

== Subscription & Listing Limits

#test-case("TC-O-029", "Listing Limit Enforcement (Free Tier)",
  page: "/owner-dashboard?tab=my-listings",
  steps: (
    "Log in as owner3 (Free tier, 3 listing max)",
    "Create listings until at limit (3)",
    "Observe listing count badge next to Create Listing button",
    "Attempt to create a 4th listing",
  ),
  expected: "Badge shows \"3/3 listings\". Clicking Create Listing opens upgrade upsell dialog showing Pro (10 listings, $10/mo) and Business (unlimited, $25/mo). Cannot create listing.",
)

#test-case("TC-O-030", "Subscribe to Pro Tier",
  page: "/owner-dashboard?tab=account",
  steps: (
    "Log in as owner3 (Free tier)",
    "Go to Owner Dashboard → Account tab",
    "Click upgrade to Pro (10 dollars/mo)",
    "Complete Stripe Checkout with test card 4242 4242 4242 4242",
    "Use any future expiry (12/28), any CVC (123), any ZIP (32256)",
  ),
  expected: "Redirected to Stripe Checkout → payment succeeds → redirected to /subscription/success. Tier badge shows Pro. Listing limit now 10. Commission discount 2% applied.",
)

#test-case("TC-O-031", "Manage Billing via Stripe Portal",
  page: "/owner-dashboard?tab=account",
  steps: (
    "Log in as owner with active paid subscription",
    "Go to Account tab → Subscription section",
    "Click \"Manage Billing\"",
  ),
  expected: "Redirects to Stripe Customer Portal. Can view invoices, update payment method. Cancel option shows \"at end of billing period\".",
)

#test-case("TC-O-032", "Cancel Subscription",
  page: "Stripe Customer Portal",
  steps: (
    "From Manage Billing, click Cancel plan",
    "Confirm cancellation",
    "Return to RAV site",
  ),
  expected: "Subscription shows \"Cancelling\" with end date. Access continues until billing period ends. Then auto-downgrades to Free tier.",
)

#test-case("TC-O-033", "Upgrade Between Paid Tiers",
  page: "/owner-dashboard?tab=account",
  steps: (
    "Log in as owner1 (Pro tier)",
    "Click upgrade to Business (25 dollars/mo)",
    "Complete Stripe Checkout",
  ),
  expected: "Immediate upgrade with proration (pays difference for remaining cycle). Listing limit now unlimited. Commission discount now 5%.",
)

#test-case("TC-O-034", "Commission Discount Verification",
  page: "/owner-dashboard?tab=bookings-earnings",
  steps: (
    "Log in as owner1 (Pro tier, 2% discount)",
    "Check earnings breakdown",
    "Verify commission shows 13% (not 15%)",
  ),
  expected: "Service fee shows 13% for Pro tier. Owner2 (Business) would show 10%.",
)

#pagebreak()

// ============================================================================
= Role 3: RAV Staff
// ============================================================================

#rav-info[Log in as: #raw("dev-staff@rent-a-vacation.com") / #raw("SeedTest2026!")]

#test-case("TC-S-001", "Verify Staff Tab Access",
  page: "/admin",
  steps: (
    "Log in as RAV Staff",
    "Navigate to /admin",
    "Count visible tabs",
  ),
  expected: "10 operational tabs: Overview, Properties, Listings, Bookings, Escrow, Check-In Issues, Disputes, Verifications, Users, Pending Approvals. Admin-only tabs NOT visible.",
)

#test-case("TC-S-002", "Admin Overview Tab",
  page: "/admin (Overview)",
  steps: (
    "Review overview dashboard",
    "Check metrics: total users, listings, bookings, revenue",
  ),
  expected: "Summary cards with platform-wide metrics. Trend charts displayed.",
)

#test-case("TC-S-003", "Properties Management",
  page: "/admin → Properties",
  steps: (
    "Browse property list",
    "Search/filter for a specific property",
    "View details",
  ),
  expected: "All properties listed. Search works. Details accessible.",
)

#test-case("TC-S-004", "Listings Management",
  page: "/admin → Listings",
  steps: (
    "Browse with status filters (active, pending, draft, expired)",
    "Click a listing for details",
  ),
  expected: "All listings shown. Filter works. Details accessible.",
)

#test-case("TC-S-005", "Bookings Management",
  page: "/admin → Bookings",
  steps: (
    "Review bookings with date filters",
    "Check statuses and SLA badges",
  ),
  expected: "All bookings listed. Date filter works. SLA badges show time-to-action.",
)

#test-case("TC-S-006", "Escrow Management",
  page: "/admin → Escrow",
  steps: (
    "Review escrow balances",
    "Check pending releases",
  ),
  expected: "Escrow entries with amounts and release dates. Pending items highlighted.",
)

#test-case("TC-S-007", "Check-In Issues",
  page: "/admin → Check-In Issues",
  steps: (
    "Review reported issues",
    "Check details and timeline",
  ),
  expected: "Issues listed with severity, status, and booking reference.",
)

#test-case("TC-S-008", "Disputes Management",
  page: "/admin → Disputes",
  steps: (
    "Review disputes with category filters",
    "View details and evidence photos",
    "Check both renter and owner categories",
  ),
  expected: "Disputes listed (5 renter + 5 owner types). Evidence thumbnails visible.",
)

#test-case("TC-S-009", "Verifications Queue",
  page: "/admin → Verifications",
  steps: (
    "Review pending identity verifications",
    "Process a verification",
  ),
  expected: "Pending verifications listed. Can review submitted documents.",
)

#test-case("TC-S-010", "User Management",
  page: "/admin → Users",
  steps: (
    "Search for a user by email or name",
    "View profile details",
    "Check cross-links to bookings/listings",
  ),
  expected: "Search works. Profile shows role, status, tier, join date. Cross-links work.",
)

#test-case("TC-S-011", "Pending Approvals",
  page: "/admin → Pending Approvals",
  steps: (
    "Review pending listings and role upgrades",
    "Approve or reject an item",
  ),
  expected: "Pending items listed. Approve/reject works. Notifications sent.",
)

#test-case("TC-S-012", "Bulk Actions",
  page: "/admin → Listings or Bookings",
  steps: (
    "Select multiple items with checkboxes",
    "Apply a bulk action",
  ),
  expected: "Multi-select works. Bulk action applies to all selected.",
)

#test-case("TC-S-013", "Executive Dashboard Access",
  page: "/executive-dashboard",
  steps: (
    "Navigate to /executive-dashboard",
    "Review platform KPIs and charts",
  ),
  expected: "Executive dashboard loads. Accessible to all RAV team roles.",
)

#test-case("TC-S-014", "Verify Admin-Only Tabs Hidden",
  page: "/admin",
  steps: (
    "While logged in as Staff, verify these tabs are NOT visible: Financials, Tax & 1099, Payouts, Memberships, Launch Readiness, Settings, Voice Controls, Resorts, API Keys, Dev Tools",
  ),
  expected: "None of the admin-only tabs appear. No errors.",
)

#pagebreak()

// ============================================================================
= Role 4: RAV Admin / Owner
// ============================================================================

#rav-info[Log in as: #raw("dev-owner@rent-a-vacation.com") or #raw("dev-admin@rent-a-vacation.com") / #raw("SeedTest2026!")]

== Admin-Only Tabs

#test-case("TC-A-001", "Verify Full Tab Access",
  page: "/admin",
  steps: (
    "Log in as RAV Owner or Admin",
    "Navigate to /admin",
    "Count all visible tabs",
  ),
  expected: "All tabs visible — 10 staff tabs + admin-only: Financials, Tax & 1099, Payouts, Memberships, Launch Readiness, Settings, Voice Controls, Resorts, API Keys, Dev Tools.",
)

#test-case("TC-A-002", "Financials Tab",
  page: "/admin → Financials",
  steps: (
    "Review revenue, commission, payout summaries",
    "Check date range filters",
  ),
  expected: "Financial overview with total revenue, 15% commission, owner payouts. Filterable by date.",
)

#test-case("TC-A-003", "Tax & 1099 Tab",
  page: "/admin → Tax & 1099",
  steps: (
    "Review owner earnings for 1099 thresholds",
    "Check tax report generation",
  ),
  expected: "Owner earnings summary with $600 IRS 1099-K threshold tracking.",
)

#test-case("TC-A-004", "Payouts Tab (Stripe)",
  page: "/admin → Payouts",
  steps: (
    "Review pending payouts",
    "Click \"Pay via Stripe\" on a payout",
    "Verify Stripe Transfer creation",
  ),
  expected: "Pending payouts listed. Transfer initiated to owner's connected account. Transfer ID recorded.",
)

#test-case("TC-A-005", "Memberships Tab",
  page: "/admin → Memberships",
  steps: (
    "Review tier distribution",
    "Change a user's tier",
  ),
  expected: "Tier breakdown shown (Free/Plus/Premium renters, Free/Pro/Business owners). Changes save.",
)

#test-case("TC-A-006", "Launch Readiness Tab",
  page: "/admin → Launch Readiness",
  steps: (
    "Review launch checklist items",
    "Check pass/fail status",
  ),
  expected: "Checklist with status for each criterion.",
)

#test-case("TC-A-007", "Settings Tab",
  page: "/admin → Settings",
  steps: (
    "Review system settings (commission rate, platform mode)",
    "Toggle Staff Only Mode",
  ),
  expected: "Settings editable. Commission = 15%. Staff Only Mode locks platform for non-team.",
)

#test-case("TC-A-008", "Voice Controls Tab",
  page: "/admin → Voice Controls",
  steps: (
    "Review VAPI config",
    "Check tier quotas (Free: 5/day, Plus/Pro: 25/day, Premium/Business: unlimited)",
    "Review user overrides",
    "Check usage dashboard and logs",
  ),
  expected: "Config displayed. Quotas editable. Overrides per-user. Usage charts and logs visible.",
)

#test-case("TC-A-009", "Resorts Tab",
  page: "/admin → Resorts",
  steps: (
    "Browse resort list (117 total)",
    "Search for a resort",
    "Test CSV import (upload, validate, confirm)",
    "Download template CSV",
  ),
  expected: "List browsable/searchable. Import validates data, shows duplicates, allows selective import.",
)

#test-case("TC-A-010", "API Keys Tab",
  page: "/admin → API Keys",
  steps: (
    "Create a new API key",
    "Set IP allowlist (optional, CIDR supported)",
    "Copy the generated key",
    "Revoke a key",
  ),
  expected: "Key shown once. IP allowlist with CIDR. Revocation immediate.",
)

#test-case("TC-A-011", "Dev Tools Tab (DEV Only)",
  page: "/admin → Dev Tools",
  steps: (
    "Click Refresh for seed data status",
    "Click \"Reset & Reseed DEV\"",
    "Wait for completion log",
  ),
  expected: "Data counts shown. Reseed runs 30–60s with step log. DEV only.",
)

== Admin Editing

#test-case("TC-A-012", "Edit a Property (Admin)",
  page: "/admin → Properties",
  steps: (
    "Find a property, click Edit",
    "Modify brand, resort, location, or unit details",
    "Save changes",
  ),
  expected: "Edit dialog with current values. Changes save with audit trail (last_edited_by/at).",
)

#test-case("TC-A-013", "Edit a Listing (Admin)",
  page: "/admin → Listings",
  steps: (
    "Find an active listing, click Edit",
    "Modify nightly rate, observe price recalculation",
    "Try editing a completed/booked listing (should be disabled)",
  ),
  expected: "Rate changes recalculate total. Booked/completed listings cannot be edited.",
)

#test-case("TC-A-014", "Approve a Listing",
  page: "/admin → Pending Approvals",
  steps: (
    "Find a pending listing",
    "Review details",
    "Click Approve",
  ),
  expected: "Listing moves to active. Owner notified. Appears on /rentals.",
)

#test-case("TC-A-015", "Reject a Listing",
  page: "/admin → Pending Approvals",
  steps: (
    "Find a pending listing",
    "Click Reject with reason",
  ),
  expected: "Listing rejected. Owner notified with reason.",
)

#test-case("TC-A-016", "Approve a Role Upgrade",
  page: "/admin → Pending Approvals",
  steps: (
    "Find pending role upgrade",
    "Approve",
  ),
  expected: "User role updates. Notification + email. Auto-detect via realtime.",
)

== Developer Tools

#test-case("TC-A-017", "Public API — Developers Page",
  page: "/developers",
  steps: (
    "Navigate to /developers",
    "Browse Swagger UI",
    "Review 5 read-only endpoints",
  ),
  expected: "Swagger UI loads. No auth required to view docs.",
)

#test-case("TC-A-018", "Internal API Docs",
  page: "/api-docs",
  steps: (
    "Navigate to /api-docs (must be admin)",
    "Review full OpenAPI spec",
  ),
  expected: "Full Swagger UI with 26+ endpoints. Admin-gated.",
)

#test-case("TC-A-019", "API Gateway Test",
  page: "N/A (curl/Postman)",
  steps: (
    "Create an API key via Admin → API Keys",
    "Call API gateway with the key (see curl command in QA-PLAYBOOK.md)",
    "Test rate limiting with rapid requests",
  ),
  expected: "API returns data. Rate limits enforced. IP allowlist blocks unauthorized.",
)

#test-case("TC-A-020", "Executive Dashboard",
  page: "/executive-dashboard",
  steps: (
    "Navigate to /executive-dashboard",
    "Review platform KPIs, revenue charts, user growth, booking trends",
  ),
  expected: "High-level dashboard. Data matches admin tab totals.",
)

#test-case("TC-A-021", "Dispute Resolution with Evidence",
  page: "/admin → Disputes",
  steps: (
    "Find a dispute with evidence",
    "View photos",
    "Resolve (approve refund, deny, or partial)",
  ),
  expected: "Evidence viewable. Resolution updates booking and triggers refund if applicable.",
)

#test-case("TC-A-022", "GA4 Analytics Verification",
  page: "Any page",
  steps: (
    "Accept cookie consent",
    "Navigate between pages",
    "Check GA4 real-time view",
  ),
  expected: "Page views tracked (G-G2YCVHNS25) only after consent.",
)

== Subscription Management

#test-case("TC-A-023", "MRR Metrics Dashboard",
  page: "/admin → Memberships",
  steps: (
    "Navigate to Admin Dashboard → Memberships tab",
    "Review 4 KPI cards at top",
    "Check tier distribution cards (6 tiers)",
    "Review membership table",
    "Test status filter (Active / Cancelled / Pending)",
    "Test role filter (Owners / Travelers)",
  ),
  expected: "MRR shows total monthly revenue. Active Subscribers shows paid count. ARPU = MRR / paid. Churn shows cancellation rate. Tier cards show user counts. Filters narrow the table.",
)

#test-case("TC-A-024", "Manual Tier Override",
  page: "/admin → Memberships",
  steps: (
    "Find a user in the membership table",
    "Click the settings icon (Actions column)",
    "In the override dialog: select a different tier",
    "Enter admin notes (required): e.g., \"VIP promotional override\"",
    "Click \"Apply Override\"",
  ),
  expected: "Tier changes immediately. \"Admin Override\" badge appears on the row. Warning explains Stripe webhooks won't auto-update this user. Override count increments in summary.",
)

#test-case("TC-A-025", "Clear Admin Override",
  page: "/admin → Memberships",
  steps: (
    "Find a user with \"Admin Override\" badge",
    "Click settings icon to open override dialog",
    "Click \"Clear Override\"",
  ),
  expected: "Override removed. Badge disappears. Stripe webhooks resume control of this user's tier.",
)

#test-case("TC-A-026", "Admin Safeguard — Staff-Only Toggle",
  page: "/admin → Settings",
  steps: (
    "Find Staff-Only Mode switch",
    "Toggle it",
  ),
  expected: "AlertDialog appears asking confirmation with impact description. Change only applies after explicit confirm.",
)

#test-case("TC-A-027", "Admin Safeguard — Commission Rate",
  page: "/admin → Settings",
  steps: (
    "Find commission rate input",
    "Change the value",
    "Click Save",
  ),
  expected: "Save button enables on change. AlertDialog shows \"Change from X% to Y%?\" on click. Only applies after confirm.",
)

#test-case("TC-A-028", "Update Seed Data (Incremental)",
  page: "/admin → Dev Tools",
  steps: (
    "Click \"Update Seed Data\" (not Reset & Reseed)",
    "Confirm in dialog",
    "Review log output",
  ),
  expected: "Adds missing data only (tier upgrades, referral codes, API keys, voice logs). Existing bookings and manual test data preserved.",
)

#pagebreak()

// ============================================================================
= Cross-Role Scenarios
// ============================================================================

#rav-info[These require switching between accounts. Use incognito windows or different browsers.]

#test-case("TC-X-001", "Full Booking Lifecycle",
  page: "Multiple pages",
  steps: (
    "Owner: List a new property ($150/night, 7 nights)",
    "Admin: Approve the listing",
    "Renter: Find and book the listing (card 4242...)",
    "Owner: Confirm the booking",
    "Renter: Complete check-in at /checkin",
    "Admin: Verify booking in Bookings tab as confirmed",
    "Admin: Process payout in Payouts tab",
  ),
  expected: "Full lifecycle completes. Status updates at each step. Emails sent at transitions.",
)

#test-case("TC-X-002", "Bid Negotiation Flow",
  page: "Multiple pages",
  steps: (
    "Owner: Enable bidding on a listing",
    "Renter: Place a bid below asking price",
    "Owner: Accept the bid",
    "Renter: Pay at accepted bid price",
    "Owner: Confirm booking",
  ),
  expected: "Bid visible in both dashboards. Accepted bid creates booking at bid price.",
)

#test-case("TC-X-003", "Travel Request → Proposal → Booking",
  page: "Multiple pages",
  steps: (
    "Renter: Post travel request (Orlando, 2BR, next month)",
    "Owner: Submit proposal with listing",
    "Renter: Accept and book",
  ),
  expected: "Request-to-booking pipeline completes. Owner listing matched.",
)

#test-case("TC-X-004", "Cancellation with Refund",
  page: "Multiple pages",
  steps: (
    "Renter: Cancel an existing booking",
    "Renter: Verify policy terms in dialog",
    "Renter: Confirm cancellation",
    "Admin: Verify refund in Stripe Dashboard (Test mode)",
    "Admin: Check escrow and booking status",
  ),
  expected: "Refund matches policy. Stripe shows refund. Status = cancelled.",
)

#test-case("TC-X-005", "Owner Cancellation → Full Refund",
  page: "Multiple pages",
  steps: (
    "Owner: Cancel a confirmed booking",
    "Renter: Verify full refund received",
    "Admin: Verify owner cancellation count incremented",
  ),
  expected: "Renter gets full refund. Owner cancellation count increases.",
)

#test-case("TC-X-006", "Dispute Resolution",
  page: "Multiple pages",
  steps: (
    "Renter: Report issue on booking",
    "Owner: Report counter-issue with evidence",
    "Admin: Review both sides in Disputes tab",
    "Admin: Resolve with partial refund",
  ),
  expected: "Both disputes linked. Admin sees evidence from both. Resolution triggers refund.",
)

#test-case("TC-X-007", "Referral End-to-End",
  page: "Multiple pages",
  steps: (
    "Owner: Copy referral code from Account tab",
    "New User: Sign up at /signup?ref=CODE",
    "Owner: Verify referral in dashboard",
  ),
  expected: "Signup captured with code. Owner stats update.",
)

#test-case("TC-X-008", "Realtime Notifications",
  page: "Multiple pages (two browser windows)",
  steps: (
    "Open Owner Dashboard (Window A) and property detail (Window B)",
    "Renter (B): Send inquiry via \"Ask the Owner\"",
    "Owner (A): Watch notification bell update (no refresh)",
    "Owner (A): Reply to inquiry",
    "Renter (B): Watch reply appear in thread",
  ),
  expected: "Both sides see updates in real-time via Supabase realtime. No manual refresh.",
)

#test-case("TC-X-009", "Date Proposal Workflow",
  page: "Multiple pages",
  steps: (
    "Renter: Propose different dates on a listing",
    "Verify auto-computed price (nightly × proposed nights)",
    "Owner: Review and accept/counter",
  ),
  expected: "Date proposal computes correct total. Owner can accept/reject.",
)

#test-case("TC-X-010", "Staff vs Admin Access Boundary",
  page: "/admin",
  steps: (
    "Staff: Log in, go to /admin, note visible tabs",
    "Admin: Log in (different browser), go to /admin, note tabs",
    "Compare tab counts",
  ),
  expected: "Staff sees 10 tabs. Admin sees 10 + admin-only. No overlap or missing.",
)

#test-case("TC-X-011", "Subscription Upgrade → Listing Limit Increase",
  page: "Multiple pages",
  steps: (
    "Owner (Free tier): Create 3 listings (hit limit)",
    "Verify upsell dialog appears on 4th attempt",
    "Go to Account tab → upgrade to Pro via Stripe Checkout",
    "Return to My Listings → Create Listing again",
    "Verify it now works (limit raised to 10)",
    "Admin: Go to Memberships tab → verify user shows Pro tier",
  ),
  expected: "Full lifecycle: limit enforced → upgrade → limit raised → new listing created. Admin sees tier change.",
)

#test-case("TC-X-012", "Admin Override → Commission Impact",
  page: "Multiple pages",
  steps: (
    "Admin: Override owner3 from Free to Business tier (admin notes: \"testing\")",
    "Owner3: Log in → check commission in earnings (should show 10%)",
    "Admin: Go to Memberships → verify \"Admin Override\" badge on owner3",
    "Admin: Clear override → verify badge removed",
  ),
  expected: "Override changes tier immediately. Commission discount applied. Admin badge visible. Clear restores normal state.",
)

#pagebreak()

// ============================================================================
= Public & Unauthenticated Pages
// ============================================================================

#rav-info[Test without logging in — use an incognito window.]

#test-case("TC-P-001", "Landing Page (Unauthenticated)",
  page: "/",
  steps: (
    "Open dev.rent-a-vacation.com in incognito",
    "Verify page loads (header, hero, featured listings)",
    "Click \"Browse Rentals\" — should redirect to login",
  ),
  expected: "Landing page is public. Protected routes redirect to /login.",
)

#test-case("TC-P-002", "Login Flow",
  page: "/login",
  steps: (
    "Navigate to /login",
    "Enter renter001@rent-a-vacation.com / SeedTest2026!",
    "Submit",
  ),
  expected: "Successful login. Redirect to /rentals.",
)

#test-case("TC-P-003", "Signup Flow",
  page: "/signup",
  steps: (
    "Navigate to /signup",
    "Enter new email, password, name",
    "Submit",
  ),
  expected: "Account created. Redirect to /pending-approval. Verification email sent.",
)

#test-case("TC-P-004", "Forgot Password",
  page: "/forgot-password",
  steps: (
    "Enter a registered email",
    "Submit",
  ),
  expected: "Reset email sent. Confirmation shown.",
)

#test-case("TC-P-005", "Reset Password",
  page: "/reset-password",
  steps: (
    "Click reset link from email",
    "Enter new password",
    "Submit",
  ),
  expected: "Password changed. Can log in with new password.",
)

#test-case("TC-P-006", "Terms of Service",
  page: "/terms",
  steps: ("Navigate to /terms", "Read content"),
  expected: "Terms page loads.",
)

#test-case("TC-P-007", "Privacy Policy",
  page: "/privacy",
  steps: ("Navigate to /privacy", "Read content"),
  expected: "Privacy policy loads.",
)

#test-case("TC-P-008", "Documentation Page",
  page: "/documentation",
  steps: ("Navigate to /documentation", "Browse sections"),
  expected: "Documentation loads with structured content.",
)

#test-case("TC-P-009", "User Guide",
  page: "/user-guide",
  steps: ("Navigate to /user-guide", "Browse 13 guide sections (6 owner + 7 renter)"),
  expected: "User guide loads with categorized help.",
)

#test-case("TC-P-010", "Cookie Consent Banner",
  page: "/ (first visit)",
  steps: (
    "Open site in incognito",
    "Observe cookie consent banner",
    "Accept cookies",
    "Verify GA4 tracking begins (network tab)",
  ),
  expected: "Banner on first visit. Accepting enables GA4 + PostHog. Declining prevents analytics.",
)

#test-case("TC-P-011", "PWA Install Banner",
  page: "Any page (mobile)",
  steps: (
    "Visit site on mobile or DevTools mobile emulation",
    "Look for PWA install prompt",
  ),
  expected: "Install banner appears on eligible browsers.",
)

#test-case("TC-P-012", "Offline Banner",
  page: "Any page",
  steps: (
    "Load a page",
    "Disconnect internet (airplane mode or DevTools offline)",
    "Observe offline banner",
  ),
  expected: "Offline banner appears. Disappears when restored.",
)

#test-case("TC-P-013", "404 Page",
  page: "/this-does-not-exist",
  steps: (
    "Navigate to a non-existent URL",
    "Observe 404 page",
  ),
  expected: "Custom 404 page with navigation back to home.",
)

#test-case("TC-P-014", "Pending Approval Page",
  page: "/pending-approval",
  steps: (
    "Log in with a newly registered (unapproved) account",
    "Observe the pending approval page",
  ),
  expected: "Shows message that account is pending admin approval.",
)

#test-case("TC-P-015", "DEV Environment Banner",
  page: "Any page on DEV",
  steps: (
    "Verify yellow \"DEV ENVIRONMENT\" banner at top",
  ),
  expected: "Yellow banner visible on DEV. Not present on production.",
)

#pagebreak()

// ============================================================================
= Test Summary
// ============================================================================

#rav-table(
  ("Section", "Total", "Pass", "Fail", "Blocked"),
  widths: (2fr, 1fr, 1fr, 1fr, 1fr),
  [Traveler (Renter)], [38], [], [], [],
  [Property Owner], [34], [], [], [],
  [RAV Staff], [14], [], [], [],
  [RAV Admin/Owner], [28], [], [], [],
  [Cross-Role], [12], [], [], [],
  [Public/Unauth], [15], [], [], [],
  [*Total*], [*141*], [], [], [],
)

#v(1cm)

#grid(
  columns: (auto, 1fr),
  gutter: 0.5cm,
  [*Tested by:*], [#box(width: 100%, stroke: (bottom: 0.5pt + rav-gray), inset: (bottom: 0.4em))[]],
  [*Date:*], [#box(width: 100%, stroke: (bottom: 0.5pt + rav-gray), inset: (bottom: 0.4em))[]],
  [*Build/Commit:*], [#box(width: 100%, stroke: (bottom: 0.5pt + rav-gray), inset: (bottom: 0.4em))[]],
  [*Environment:*], [DEV / PROD _(circle one)_],
)

#v(2cm)
#align(center)[
  #text(size: 9pt, fill: rav-gray, style: "italic")[
    © 2026 Rent-A-Vacation. All rights reserved. \
    For Authorized Team Members Only.
  ]
]
