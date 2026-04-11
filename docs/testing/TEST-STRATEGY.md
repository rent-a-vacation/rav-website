---
last_updated: "2026-04-11T04:04:36"
change_ref: "902990b"
change_type: "session-39-docs-update"
status: "active"
---
# Test Strategy - Rent-A-Vacation Platform

**Version:** 2.0
**Created:** February 13, 2026
**Updated:** March 13, 2026
**Author:** Testing Architecture Team
**Status:** Implemented & Active

---

## 🎯 Executive Summary

This document defines the testing strategy for Rent-A-Vacation, a vacation rental marketplace. Our approach prioritizes **confidence over coverage**, focusing on high-value tests that prevent production incidents.

### Goals
1. **Prevent Revenue Loss** - Never break payment/booking flows
2. **Maintain User Trust** - Catch critical bugs before users do
3. **Enable Fast Shipping** - Tests run in <5 minutes, don't slow development
4. **Sustainable Quality** - Easy to maintain, AI-agent friendly

### Testing Philosophy
- **80/20 Rule** - 20% of tests catch 80% of bugs
- **Test Behavior, Not Implementation** - Focus on user outcomes
- **Integration > Unit** - Test real interactions over isolated functions
- **Automate Everything** - No manual regression testing

---

## 📊 Testing Pyramid (Current State — March 2026)

```
        /\
       /E2E\        3 Playwright smoke tests (homepage, rentals, navigation)
      /-----\       Visual regression via Percy (disabled — private repo)
     /  INT  \      ~350 integration tests (hooks, components, contexts)
    /---------\     Example: Stripe checkout, bidding, cancellation, messaging
   /   UNIT    \    ~240 unit tests (pure functions in src/lib/)
  /-------------\   Example: pricing, sort, cancellation policy, iCal, timeline
```

**Current Total:** 771 tests across 99 test files (all passing)
**P0 Critical Path:** 97 tests tagged `@p0` across 14 files — run with `npm run test:p0`

---

## 🚨 CRITICAL PATHS (Must Have Tests)

These are **non-negotiable** - if ANY of these break, users can't use the platform.

### 1. Authentication & Authorization (P0)
**Why Critical:** No auth = no platform access

| Test | Type | Priority |
|------|------|----------|
| User signup with email/password | E2E | P0 |
| User login with email/password | E2E | P0 |
| Google OAuth login | E2E | P0 |
| Session persistence across page refresh | E2E | P0 |
| Role-based access control (renter vs owner vs admin) | Integration | P0 |
| Redirect to login when accessing protected route | E2E | P0 |
| Profile auto-creation on signup | Integration | P0 |

**Risk if broken:** Users can't log in = 100% revenue loss

---

### 2. Booking & Payment Flow (P0)
**Why Critical:** This is how you make money

| Test | Type | Priority |
|------|------|----------|
| Create Stripe checkout session | Integration | P0 |
| Complete booking payment (mock Stripe webhook) | Integration | P0 |
| Booking confirmation email sent | Integration | P0 |
| Booking appears in traveler dashboard | E2E | P0 |
| Escrow status updates correctly | Integration | P0 |
| Booking with invalid dates fails gracefully | Integration | P0 |
| Payment failure shows clear error message | E2E | P0 |

**Risk if broken:** Users can't book = 100% revenue loss

---

### 3. Listing Discovery (P0)
**Why Critical:** Users must find properties to book

| Test | Type | Priority |
|------|------|----------|
| Search listings by location | E2E | P0 |
| Filter by dates, guests, price | Integration | P0 |
| View listing detail page | E2E | P0 |
| Voice search returns relevant results | Integration | P1 |
| Listing images load correctly | E2E | P1 |

**Risk if broken:** Users can't find properties = no bookings

---

### 4. Owner Property Management (P1)
**Why Critical:** No listings = no inventory

| Test | Type | Priority |
|------|------|----------|
| Create new property | E2E | P1 |
| Create listing for property | E2E | P1 |
| Upload property images | Integration | P1 |
| View bookings on owned properties | E2E | P1 |
| Submit resort confirmation number | Integration | P0 |

**Risk if broken:** Owners can't list = shrinking inventory

---

### 5. Admin Operations (P1)
**Why Critical:** Manual operations fallback

| Test | Type | Priority |
|------|------|----------|
| Approve/reject listings | Integration | P1 |
| Manage user roles | Integration | P1 |
| View escrow statuses | E2E | P1 |
| Process payouts | Integration | P0 |

**Risk if broken:** Manual bottleneck, support overhead

---

## 🎯 SECONDARY FEATURES (Should Have Tests)

### 6. Bidding System (P2) ✅ TESTED
| Test | Type | Priority | Status |
|------|------|----------|--------|
| Place bid on listing | Integration | P2 | ✅ useBidding.test.ts |
| Accept/reject bid | Integration | P2 | ✅ useBidding.test.ts |
| Create travel request | Integration | P2 | ✅ Covered |
| Submit proposal to travel request | Integration | P2 | ✅ Covered |
| Bid form dialog validation | Component | P2 | ✅ BidFormDialog.test.tsx |

### 7. Cancellation Flow (P2) ✅ TESTED
| Test | Type | Priority | Status |
|------|------|----------|--------|
| Calculate refund based on policy | Unit | P1 | ✅ cancellation.test.ts |
| Cancellation policy display | Unit | P1 | ✅ cancellationPolicy.test.ts |
| Request cancellation | Integration | P2 | ✅ useCancelBooking.test.ts |
| Process refund | Integration | P0 | ✅ useCancelBooking.test.ts |

### 8. Email Notifications (P2) ✅ PARTIAL
| Test | Type | Priority | Status |
|------|------|----------|--------|
| Email template rendering | Unit | P2 | ✅ email.test.ts |
| Idle listing alerts (CRON) | Unit | P2 | ✅ idleListingAlerts.test.ts |

### 9. Additional Features Tested (added since v1.0)
| Feature | Test File | Count |
|---------|-----------|-------|
| Messaging (booking) | useBookingMessages.test.ts | 9 |
| Messaging (pre-booking inquiries) | useListingInquiries.test.ts | 8 |
| Reviews | useReviews.test.ts | 8 |
| Disputes | useSubmitDispute.test.ts | 4 |
| GDPR/Account deletion | useAccountDeletion.test.ts | 6 |
| Saved searches | useSavedSearches.test.ts | 12 |
| Realtime subscriptions | useRealtimeSubscription.test.ts | 7 |
| iCal calendar export | icalendar.test.ts | 18 |
| Owner portfolio | PortfolioOverview/PropertyCalendar | 19 |
| Compare listings | compareListings.test.ts | 9 |
| Booking timeline | bookingTimeline.test.ts | 11 |
| Pricing suggestions | usePricingSuggestion.test.ts | 6 |
| Destinations | destinations.test.ts | 6 |
| Renter dashboard | renterDashboard.test.ts | 8 |

---

## 🧪 TEST TYPES EXPLAINED

### Unit Tests (Vitest)
**What:** Test individual functions in isolation  
**When to use:** Pure functions, calculations, utilities  
**Example:** `calculateRefund(policy, daysUntilCheckin) => number`

**Target Files:**
- `src/lib/cancellation.ts` - Refund calculation logic
- `src/lib/utils.ts` - Utility functions
- Any pure business logic functions

**Coverage Target:** 70%

---

### Integration Tests (Vitest)
**What:** Test component + Supabase interactions  
**When to use:** API calls, database operations, edge functions  
**Example:** `useBidding.createBid()` inserts into DB and returns bid

**Target Files:**
- `src/hooks/useBidding.ts` - All bidding queries/mutations
- `src/hooks/useAuth.ts` - Auth state management
- `supabase/functions/` - Edge function logic

**Coverage Target:** 60%

---

### E2E Tests (Playwright)
**What:** Test complete user flows in real browser  
**When to use:** Critical user journeys, multi-step processes  
**Example:** Login → Search → View Property → Book → Confirm

**Target Flows:**
1. Signup → Login → Browse → Book (happy path)
2. Owner creates property → Admin approves → Goes live
3. Traveler places bid → Owner accepts → Creates booking
4. Payment failure → Error handling → Retry

**Coverage Target:** 15 critical flows

---

## 🛠️ TOOLS & INFRASTRUCTURE

### Testing Stack
| Tool | Purpose | Status |
|------|---------|--------|
| **Vitest** | Unit + Integration | ✅ Active — 771 tests |
| **Playwright** | E2E testing | ✅ Active — 3 smoke tests |
| **Percy.io** | Visual regression | ⏸ Disabled (private repo requires paid plan) |
| **GitHub Actions** | CI/CD | ✅ Active — lint → test → e2e → lighthouse |
| **dorny/test-reporter** | PR test annotations | ✅ Active — JUnit XML → inline PR annotations |
| **Lighthouse CI** | Performance audit | ✅ Active |
| **Husky + lint-staged** | Pre-commit | ✅ Active — lint + related tests on staged files |

> **Note on test management platforms:** Qase was evaluated and removed (Mar 2026) — the free plan does not support the TestOps API. P0 test case library (#149 Phase A) completed with `@p0` tagging and `npm run test:p0`. Phase B (Playwright E2E) and Phase C (Qase/platform sync) remain open.

### Test Data Strategy
- **Unit tests:** Mock data in test files + fixtures in `src/test/fixtures/`
- **Integration tests:** Mocked Supabase client (vi.mock pattern)
- **E2E tests:** Against Supabase DEV instance

### CI/CD Pipeline
```
On Push to Main:
1. Run unit tests (~30 sec)
2. Run integration tests (~2 min)
3. Run E2E tests (~3 min)
4. If all pass → Deploy to Vercel
5. If any fail → Block deployment
```

---

## 📝 TESTING BEST PRACTICES

### Writing Good Tests

**DO:**
✅ Test user behavior, not implementation details  
✅ Use descriptive test names: `"should redirect to /pending-approval when user is not approved"`  
✅ Follow Arrange-Act-Assert pattern  
✅ Mock external services (Stripe, Resend)  
✅ Keep tests independent (no shared state)  

**DON'T:**
❌ Test internal component state  
❌ Test third-party libraries  
❌ Write brittle tests that break on UI changes  
❌ Duplicate tests across layers  
❌ Skip error cases  

### Test Naming Convention
```typescript
describe('Authentication', () => {
  describe('signUp', () => {
    it('should create user profile with default renter role', async () => {
      // Test here
    });
    
    it('should send welcome email after successful signup', async () => {
      // Test here
    });
    
    it('should reject signup with invalid email format', async () => {
      // Test here
    });
  });
});
```

---

## 🎯 IMPLEMENTATION PHASES (COMPLETED)

> All phases completed between Feb 13 - Mar 4, 2026. Keeping for historical reference.

### Phase 1: Foundation ✅ (Feb 13)
- Vitest + Playwright installed and configured
- CI/CD pipeline set up (GitHub Actions)
- First unit tests (cancellation, pricing) + integration tests (AuthContext)

### Phase 2: Coverage Expansion ✅ (Feb 14-25)
- Grew from ~30 to ~400 tests across hooks, contexts, components, lib
- Percy visual regression set up (later disabled for private repo)
- Comprehensive business logic coverage

### Phase 3: Polish & Automation ✅ (Feb 25 - Mar 4)
- Pre-commit hooks (Husky + lint-staged)
- P0 test case library with `@p0` tagging (97 tests)
- CI test reporting via dorny/test-reporter (JUnit XML)
- Lighthouse CI audit
- **Final: 771 tests, 99 test files, all passing**

---

## 🚀 SUCCESS METRICS

### Quantitative (Actual as of March 2026)
- **Test Execution Time:** ~64s locally, <3 min in CI
- **Total Tests:** 771 (99 test files)
- **P0 Tests:** 97 tagged `@p0` across 14 files
- **E2E Tests:** 3 smoke tests (homepage, rentals, navigation)
- **CI/CD Pass Rate:** >95%
- **Coverage Thresholds (enforced):** Statements 25%, Branches 25%, Functions 30%, Lines 25%

### Qualitative
- Zero production incidents from untested code
- Every new feature ships with tests (CLAUDE.md enforced)
- Tests run pre-commit (lint-staged) and in CI
- AI agent (Claude Code) generates tests alongside features

---

## 🔄 ONGOING MAINTENANCE

### For Every New Feature
1. **Identify critical path** - What breaks if this fails?
2. **Write tests FIRST** - TDD approach
3. **AI generates boilerplate** - Claude Code writes test structure
4. **Human reviews** - Ensure tests make sense
5. **Run in CI** - Must pass before merge

### Monthly Review
- Check test execution time (keep <5 min)
- Remove flaky tests
- Update test data
- Review coverage gaps

---

## 📚 APPENDIX

### Useful Resources
- Vitest Docs: https://vitest.dev
- Playwright Docs: https://playwright.dev
- Testing Library Best Practices: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

### Test Data Fixtures
Located in `src/test/fixtures/`:
- `users.ts` — `mockUser()`, `mockSession()`, `mockProfile()`, `mockAuthContext()`
- `listings.ts` — Listing and property fixtures
- `memberships.ts` — Membership tier fixtures

### Test Helpers
Located in `src/test/helpers/`:
- `render.tsx` — `createHookWrapper()`, `renderWithProviders()`
- `supabase-mock.ts` — `createSupabaseMock()`, `emptyResponse()`, `errorResponse()`

### P0 Test Case Library
- **Docs:** `docs/P0-TEST-CASES.md` — 20 critical-path scenarios across 7 journeys
- **Run:** `npm run test:p0` — executes 97+ `@p0`-tagged tests
- **Coverage:** Auth, Search, Pricing, Bidding, Owner Dashboard, Cancellation, Messaging, Conversations

### Messaging System (P0) — Session 45

| Test | File | What it validates |
|------|------|------------------|
| Context badge labels | `src/lib/conversations.test.ts` | `getContextBadge()` returns correct label/variant for all 4 types |
| Event formatting | `src/lib/conversations.test.ts` | `formatConversationEvent()` for bids, bookings, proposals |
| Type guards | `src/lib/conversations.test.ts` | `isValidContextType()` and `isValidEventType()` |
| Query key factory | `src/hooks/useConversations.test.ts` | Hierarchical keys for partial invalidation |
| Other participant | `src/hooks/useConversations.test.ts` | `getOtherParticipant()` resolves correct party |
| Inbox rendering | `src/components/messaging/ConversationInbox.test.tsx` | Filter tabs, participant names, context badges, click selection |
| Thread rendering | `src/components/messaging/ConversationThread.test.tsx` | Message bubbles, events, mark-read-on-mount, composer |
| Messages page | `src/pages/Messages.test.tsx` | Two-panel layout, empty state, filter tabs |

### Navigation & Terminology (P0) — WS3

| Test | File | What it validates |
|------|------|------------------|
| Unauthenticated nav | `src/components/Header.test.tsx` | Public nav shows Explore, How It Works, Name Your Price, List Your Property, Free Tools |
| Traveler nav | `src/components/Header.test.tsx` | Traveler sees Explore, Name Your Price, Vacation Wishes, My Trips, Messages |
| Owner nav | `src/components/Header.test.tsx` | Owner sees Owner's Edge, My Listings, Vacation Wishes, Messages |
| Traveler exclusions | `src/components/Header.test.tsx` | Traveler does NOT see How It Works or List Your Property in top nav |
| Owner exclusions | `src/components/Header.test.tsx` | Owner does NOT see Explore or Name Your Price in top nav |
| Owner's Edge route | `src/components/Header.test.tsx` | Link routes to `/owner-dashboard` |
| My Listings route | `src/components/Header.test.tsx` | Link routes to `/owner-dashboard?tab=my-listings` |
| Vacation Wishes route | `src/components/Header.test.tsx` | Link routes to `/bidding?tab=requests` |
| Messages badge visible | `src/components/Header.test.tsx` | Badge shows when `useUnreadConversationCount > 0` |
| Messages badge hidden | `src/components/Header.test.tsx` | Badge hidden when count is 0 |

### Registration & Onboarding (P0) — WS2

| Test | File | What it validates |
|------|------|------------------|
| Terms version constants | `src/lib/termsVersions.test.ts` | `CURRENT_TERMS_VERSION` / `CURRENT_PRIVACY_VERSION` exist and match semver format |
| Signup two checkboxes | `src/pages/Signup.test.tsx` | Both age and terms checkboxes render and are separately toggleable |
| Signup submit disabled | `src/pages/Signup.test.tsx` | Submit stays disabled until both checkboxes are checked |
| Signup partial state | `src/pages/Signup.test.tsx` | Submit stays disabled if only age OR only terms is checked |
| needsOnboarding for RAV team | `src/hooks/useOnboarding.test.ts` | Returns false for RAV team (bypass gate entirely) |
| needsOnboarding for onboarded | `src/hooks/useOnboarding.test.ts` | Returns false for users with non-null `onboarding_completed_at` |
| needsOnboarding for new users | `src/hooks/useOnboarding.test.ts` | Returns true for newly approved users with null `onboarding_completed_at` |
| needsOnboarding for pending | `src/hooks/useOnboarding.test.ts` | Returns false for pending_approval and rejected users |
| WelcomePage Step 1 | `src/pages/WelcomePage.test.tsx` | Renders welcome heading with user first name, T&C checkboxes |
| Continue button gated | `src/pages/WelcomePage.test.tsx` | Continue disabled until both T&C checkboxes checked |
| Continue calls mutation | `src/pages/WelcomePage.test.tsx` | Clicking Continue calls `useCompleteOnboarding` |
| Advances to Step 2 | `src/pages/WelcomePage.test.tsx` | After successful mutation, Step 2 renders |
| Owner-specific CTAs | `src/pages/WelcomePage.test.tsx` | Owner sees List Property, Owner's Edge, Browse Vacation Wishes |
| Traveler-specific CTAs | `src/pages/WelcomePage.test.tsx` | Traveler sees Start Exploring, Name Your Price, Post Vacation Wish |
| Pending user redirect | `src/pages/WelcomePage.test.tsx` | User with pending_approval redirected to `/pending-approval` |
| RAV team redirect | `src/pages/WelcomePage.test.tsx` | RAV team redirected to `/rentals` (bypass gate) |
| Onboarded owner redirect | `src/pages/WelcomePage.test.tsx` | Already-onboarded owner redirected to `/owner-dashboard` |
| Onboarded traveler redirect | `src/pages/WelcomePage.test.tsx` | Already-onboarded traveler redirected to `/my-trips` |

---

**Next Steps:**
1. Review this strategy with team
2. Approve priorities
3. Move to implementation (see CLAUDE-CODE-PROMPTS.md)
