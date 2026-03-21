---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Claude Code Prompt Templates

**Version:** 1.0  
**Created:** February 13, 2026  
**Purpose:** Exact prompts to give your AI coding agent to generate tests

---

## 📋 HOW TO USE THIS DOCUMENT

1. **Copy a prompt template** from the sections below
2. **Customize the placeholders** (marked with `[BRACKETS]`)
3. **Paste into Claude Code** or your AI agent
4. **Review generated code** - AI writes 80%, you verify 20%
5. **Run tests locally** to ensure they pass

---

## 🚀 PROMPT 1: Initial Test Setup

**When to use:** First time setting up testing infrastructure

**Copy this prompt:**

```
I need to set up a comprehensive testing infrastructure for my React + TypeScript + Vite + Supabase project.

CONTEXT:
- Tech stack: React 18, TypeScript, Vite, Supabase (PostgreSQL + Auth), Stripe, React Query
- Project structure: src/components, src/pages, src/hooks, src/lib, supabase/functions
- Already have: GitHub Actions, Vercel deployment

REQUIREMENTS:
1. Install and configure Vitest for unit + integration tests
2. Install and configure Playwright for E2E tests
3. Setup test environment with proper TypeScript support
4. Configure GitHub Actions workflow to run tests on push
5. Add test scripts to package.json

DELIVERABLES:
- vitest.config.ts with proper settings
- playwright.config.ts with browser configs
- .github/workflows/test.yml for CI/CD
- tests/setup.ts for test utilities
- Example test file showing proper patterns

Please create all necessary config files and explain each step.
```

---

## 🔐 PROMPT 2: Authentication Tests

**When to use:** Testing auth flows (login, signup, RBAC)

**Copy this prompt:**

```
I need comprehensive tests for the authentication system in my vacation rental platform.

CONTEXT:
- Auth provider: Supabase Auth (email/password + Google OAuth)
- Auth context: src/contexts/AuthContext.tsx
- Auth hook: src/hooks/useAuth.ts
- RBAC system with roles: rav_owner, rav_admin, rav_staff, property_owner, renter
- Profile auto-creation via database trigger

FILES TO TEST:
- src/contexts/AuthContext.tsx
- src/hooks/useAuth.ts
- Auth pages: src/pages/Login.tsx, src/pages/Signup.tsx

TEST REQUIREMENTS:
1. Unit tests for AuthContext (mock Supabase client)
2. Integration tests for auth flows:
   - User signup with email/password
   - User login with email/password
   - Google OAuth (mock OAuth flow)
   - Session persistence
   - Sign out
3. RBAC tests:
   - hasRole() returns correct boolean
   - isRavTeam() identifies admin roles
   - isPropertyOwner() identifies owner role
4. E2E tests:
   - Complete signup → login → dashboard flow
   - Protected route redirect when not authenticated
   - Role-based page access (owner dashboard vs admin dashboard)

Create test files with proper mocking patterns and clear test descriptions.
```

---

## 💳 PROMPT 3: Booking & Payment Tests

**When to use:** Testing critical revenue path

**Copy this prompt:**

```
I need tests for the booking and payment flow, which is the most critical part of my platform.

CONTEXT:
- Payment processor: Stripe Checkout
- Edge function: supabase/functions/create-booking-checkout/index.ts
- Webhook handler: supabase/functions/verify-booking-payment/index.ts
- Database tables: bookings, booking_confirmations, listings
- React Query hooks in: src/hooks/ (if any booking-specific hooks exist)

CRITICAL FLOWS TO TEST:
1. Stripe checkout session creation
   - Valid listing + dates → creates session
   - Invalid dates → fails gracefully
   - Sold out listing → shows error
2. Payment webhook processing
   - Valid webhook signature → updates booking status
   - Invalid signature → rejects request
   - Duplicate webhook → idempotent handling
3. Booking confirmation
   - Booking record created with correct data
   - Escrow status set to 'pending_confirmation'
   - Confirmation email sent to traveler
   - booking_confirmation record created
4. E2E booking flow
   - User browses listing
   - Selects dates
   - Clicks "Book Now"
   - Completes Stripe checkout (use test mode)
   - Sees confirmation page
   - Booking appears in dashboard

MOCKING STRATEGY:
- Mock Stripe API calls (use stripe-mock or fixtures)
- Mock email sending (Resend API)
- Use test database for integration tests

Create comprehensive tests with error handling coverage.
```

---

## 🔍 PROMPT 4: Search & Discovery Tests

**When to use:** Testing listing discovery and voice search

**Copy this prompt:**

```
I need tests for the search and discovery features of my vacation rental platform.

CONTEXT:
- Search page: src/pages/Rentals.tsx
- Voice search: Already implemented (VAPI integration)
- Filters: location, dates, guests, price, bedrooms
- Database: Supabase with listings table

TEST SCENARIOS:
1. Manual search
   - Search by location returns correct results
   - Date filters exclude unavailable listings
   - Price range filters work correctly
   - Guest count filters by property capacity
   - Multiple filters combine with AND logic
2. Voice search (if applicable)
   - Voice input transcribes correctly
   - Natural language query maps to filters
   - Results match voice-specified criteria
3. Listing display
   - Listing cards show correct information
   - Images load properly
   - Resort badges display (if available)
   - Click listing → navigates to detail page
4. Edge cases
   - No results found → shows appropriate message
   - Invalid location → suggests corrections
   - Invalid dates (past dates) → shows error

FILES TO TEST:
- src/pages/Rentals.tsx (E2E)
- Any search-related hooks or utilities (Integration)

Create tests with realistic search scenarios travelers would use.
```

---

## 🏠 PROMPT 5: Owner Dashboard Tests

**When to use:** Testing property owner management features

**Copy this prompt:**

```
I need tests for the owner dashboard where property owners manage their listings and bookings.

CONTEXT:
- Dashboard: src/pages/OwnerDashboard.tsx
- Tabs: Properties, Listings, Bookings, Earnings, Verification
- Owner components: src/components/owner/*
- RBAC: Only users with 'property_owner' role can access

TEST REQUIREMENTS:
1. Property management (OwnerProperties component)
   - Create new property
   - Edit existing property
   - Upload property images
   - Delete property (soft delete)
2. Listing management (OwnerListings component)
   - Create listing for property
   - Set availability dates
   - Update pricing
   - Activate/deactivate listing
   - Open listing for bidding
3. Booking management (OwnerBookings component)
   - View all bookings on owned properties
   - Submit resort confirmation number
   - View booking details
4. Verification (OwnerVerification component)
   - Upload verification documents
   - See verification status
5. Access control
   - Non-owner users cannot access /owner-dashboard
   - Redirect to login if not authenticated

Create tests for both happy paths and error scenarios.
```

---

## 🛡️ PROMPT 6: Admin Dashboard Tests

**When to use:** Testing admin operations

**Copy this prompt:**

```
I need tests for the admin dashboard where RAV team manages the platform.

CONTEXT:
- Dashboard: src/pages/AdminDashboard.tsx
- Tabs: Overview, Users, Listings, Bookings, Verifications, Escrow, Payouts, Financials
- Admin components: src/components/admin/*
- RBAC: Only RAV team (rav_owner, rav_admin, rav_staff) can access

TEST REQUIREMENTS:
1. User management (AdminUsers component)
   - View all users
   - Assign/remove roles
   - Filter by role
2. Listing approval (AdminListings component)
   - View pending listings
   - Approve listing → status changes to 'active'
   - Reject listing with reason
3. Verification (AdminVerifications component)
   - View pending verifications
   - Approve owner verification
   - Reject with feedback
4. Escrow management (AdminEscrow component)
   - View all escrow statuses
   - Verify resort confirmation
   - Release escrow
5. Access control
   - Non-admin users cannot access /admin
   - Different admin roles have appropriate permissions

Focus on critical admin actions that affect platform operations.
```

---

## 🎯 PROMPT 7: Bidding System Tests

**When to use:** Testing bidding marketplace features

**Copy this prompt:**

```
I need tests for the bidding system where travelers and owners negotiate prices.

CONTEXT:
- Bidding hook: src/hooks/useBidding.ts (600+ lines)
- Marketplace: src/pages/BiddingMarketplace.tsx
- Dashboard: src/pages/MyBidsDashboard.tsx
- Components: src/components/bidding/*
- Two types: Owner-initiated bidding + Traveler travel requests

TEST REQUIREMENTS:
1. Owner-initiated bidding
   - Owner opens listing for bidding
   - Traveler places bid
   - Owner views bids
   - Owner accepts/rejects/counters bid
   - Accepted bid creates booking
2. Travel requests (reverse auction)
   - Traveler creates travel request
   - Owner views open requests
   - Owner submits proposal
   - Traveler accepts/rejects proposal
   - Accepted proposal creates booking
3. Notifications
   - New bid → notify owner
   - Bid accepted → notify traveler
   - New proposal → notify traveler
   - Real-time updates (WebSocket or polling)
4. Data integrity
   - Can't bid on own listing
   - Can't accept expired bid
   - Bid amount validation

Files: src/hooks/useBidding.ts, src/components/bidding/*, src/pages/BiddingMarketplace.tsx

Create tests covering the complete bidding lifecycle.
```

---

## 📧 PROMPT 8: Email System Tests

**When to use:** Testing transactional emails

**Copy this prompt:**

```
I need tests for the email notification system.

CONTEXT:
- Email provider: Resend API
- Edge functions: supabase/functions/send-email, send-booking-confirmation-reminder, etc.
- Email template: supabase/functions/_shared/email-template.ts
- Client-side emails: src/lib/email.ts

EMAILS TO TEST:
1. Booking confirmation (traveler)
2. Resort confirmation reminder (owner)
3. Cancellation notifications
4. Verification document upload (admin)
5. Welcome email (new user)

TEST STRATEGY:
- Mock Resend API calls
- Verify email content structure
- Check recipient addresses
- Validate email template rendering
- Test CRON-triggered emails (reminders)

CRITICAL TESTS:
1. Booking confirmation email sent after payment
2. Reminder email sent X hours before deadline
3. Email fails gracefully if Resend API is down
4. Email contains correct booking details
5. Unsubscribe link works

Focus on integration tests that verify email dispatch logic.
```

---

## 🧮 PROMPT 9: Business Logic Unit Tests

**When to use:** Testing pure functions and utilities

**Copy this prompt:**

```
I need unit tests for business logic functions that have complex calculations.

CONTEXT:
- Cancellation logic: src/lib/cancellation.ts
- Utilities: src/lib/utils.ts
- These are pure functions with no side effects

TEST FILES:
1. src/lib/cancellation.ts
   - calculateRefund(policy, daysUntilCheckin, bookingAmount)
   - Different policies: flexible, moderate, strict, super_strict
   - Edge cases: same day, 1 day, 7 days, 30+ days
2. src/lib/utils.ts
   - cn() class name merger
   - Any date/time utilities
   - Format helpers

TEST REQUIREMENTS:
- Test all cancellation policies with various time windows
- Test edge cases (0 days, negative days, very large numbers)
- Test boundary conditions (exactly at policy threshold)
- Verify refund amounts are correct to 2 decimal places

Example test structure:
describe('calculateRefund', () => {
  describe('flexible policy', () => {
    it('should return 100% refund when ≥1 day before checkin', () => {
      // test
    });
    it('should return 0% refund on checkin day', () => {
      // test
    });
  });
});

Create comprehensive unit tests with clear expected values.
```

---

## 🎭 PROMPT 10: E2E Critical User Journeys

**When to use:** Testing complete user flows end-to-end

**Copy this prompt:**

```
I need end-to-end tests for the most critical user journeys on my vacation rental platform.

CONTEXT:
- Testing tool: Playwright
- Browser: Chrome (with fallback to Firefox, Safari)
- Test environment: Dedicated Supabase test database

CRITICAL JOURNEYS TO TEST:
1. Happy Path: Browse → Book → Confirm
   - User lands on /rentals
   - Searches for "Orlando"
   - Filters by dates and guests
   - Clicks on a listing
   - Views property details
   - Clicks "Book Now"
   - Completes Stripe checkout (test mode)
   - Sees confirmation page
   - Receives confirmation email

2. Owner Journey: Create Property → Get Approved → Receive Booking
   - Owner logs in
   - Creates new property
   - Uploads photos
   - Creates listing
   - Admin approves listing
   - Listing appears on /rentals
   - Traveler books
   - Owner sees booking in dashboard

3. Admin Approval Flow
   - New listing submitted
   - Admin receives notification
   - Admin reviews listing
   - Admin approves/rejects
   - Owner notified of decision

4. Bidding Flow
   - Owner opens listing for bidding
   - Traveler places bid
   - Owner accepts bid
   - Booking created
   - Both parties notified

TEST REQUIREMENTS:
- Use realistic test data
- Handle asynchronous operations (page loads, API calls)
- Take screenshots on failure
- Clean up test data after each test
- Run in headless mode for CI

Create Playwright tests with proper page objects and helpers.
```

---

## 🎨 PROMPT 11: Visual Regression Tests

**When to use:** After setting up Percy.io for visual testing

**Copy this prompt:**

```
I need visual regression tests using Percy.io to catch UI bugs automatically.

CONTEXT:
- Tool: Percy.io (integrated with Playwright)
- Free tier: 5,000 screenshots/month
- Pages to test: Key user-facing pages

PAGES TO SNAPSHOT:
1. Landing page (/)
2. Search results (/rentals)
3. Listing detail (/property/:id)
4. Owner dashboard (/owner-dashboard)
5. Admin dashboard (/admin)
6. Booking confirmation page (/booking-success)

TEST REQUIREMENTS:
1. Setup Percy with Playwright
2. Capture baseline snapshots
3. Test responsive layouts (mobile, tablet, desktop)
4. Test different states:
   - Logged out vs logged in
   - Different user roles (owner vs admin)
   - Empty states vs populated data
5. Test UI components in isolation:
   - Buttons
   - Cards
   - Modals
   - Forms

CONFIGURATION:
- Viewport sizes: 375px (mobile), 768px (tablet), 1920px (desktop)
- Ignore dynamic content (timestamps, random IDs)
- Set approval workflow in Percy dashboard

Create visual regression test suite that catches UI regressions early.
```

---

## 🔄 PROMPT 12: CI/CD Integration

**When to use:** Setting up automated testing in GitHub Actions

**Copy this prompt:**

```
I need to configure GitHub Actions to run all tests automatically on every push.

CONTEXT:
- Tests: Vitest (unit + integration), Playwright (E2E)
- Deployment: Vercel (auto-deploy on main branch)
- Current workflow: .github/workflows/ (if exists)

CI/CD REQUIREMENTS:
1. Run tests on every push to any branch
2. Run tests on every pull request
3. Block deployment if tests fail
4. Parallel execution for speed
5. Cache dependencies (node_modules)
6. Upload test results as artifacts
7. Comment PR with test results

WORKFLOW STRUCTURE:
- Job 1: Lint & Type Check (~30 sec)
- Job 2: Unit Tests (~1 min)
- Job 3: Integration Tests (~2 min)
- Job 4: E2E Tests (~3 min)
- Job 5: Deploy (only if all tests pass)

ENVIRONMENT:
- Node.js version: 18
- Database: Spin up Supabase local instance or use test project
- Secrets: Stripe test keys, Resend test key

Create .github/workflows/test.yml that runs tests efficiently and provides clear feedback.
```

---

## 📊 PROMPT 13: Test Coverage Reports

**When to use:** Setting up coverage tracking

**Copy this prompt:**

```
I need test coverage reports integrated into my CI/CD pipeline.

REQUIREMENTS:
1. Configure Vitest to generate coverage reports
2. Setup coverage thresholds (fail if below targets)
3. Generate HTML coverage reports
4. Display coverage in GitHub Actions summary
5. Track coverage trends over time

COVERAGE TARGETS:
- Unit tests: 70% coverage
- Integration tests: 60% coverage
- Exclude: node_modules, test files, config files

DELIVERABLES:
- vitest.config.ts with coverage settings
- GitHub Actions step to generate coverage
- HTML report artifact
- Badge showing coverage percentage (optional)

Configure coverage reporting with sensible defaults.
```

---

## 🎯 CUSTOMIZATION GUIDE

### How to Customize These Prompts

**Replace these placeholders:**
- `[YOUR_PROJECT_NAME]` → "Rent-A-Vacation"
- `[YOUR_TECH_STACK]` → Your actual stack
- `[FILE_PATH]` → Actual file path in your project
- `[FEATURE_NAME]` → Specific feature you're testing

**Add project-specific context:**
```
ADDITIONAL CONTEXT:
- Database schema: [paste relevant schema]
- API endpoints: [list your endpoints]
- Third-party services: [Stripe, Resend, VAPI, etc.]
```

---

## ✅ QUALITY CHECKLIST

Before accepting AI-generated tests, verify:

- [ ] Tests have clear, descriptive names
- [ ] Tests follow Arrange-Act-Assert pattern
- [ ] Tests are independent (no shared state)
- [ ] Tests clean up after themselves
- [ ] Tests cover happy path AND error cases
- [ ] Tests use proper mocking (don't call real APIs)
- [ ] Tests run fast (<5 min total)
- [ ] Tests are deterministic (no flaky tests)

---

## 🚀 NEXT STEPS

1. Start with **PROMPT 1** (Initial Setup)
2. Move to **PROMPT 2 & 3** (Auth + Payment - most critical)
3. Add **PROMPT 4 & 5** (Search + Owner Dashboard)
4. Expand with remaining prompts based on priority
5. Setup **PROMPT 12** (CI/CD) after you have 20+ tests

**Remember:** AI writes 80%, you verify 20%. Always review generated tests!

---

**Document maintained by Testing Team**  
**Questions? Add comments in PROJECT-HUB.md**
