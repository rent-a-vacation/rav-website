# Test Strategy - Rent-A-Vacation Platform

**Version:** 2.0
**Created:** February 13, 2026
**Updated:** March 4, 2026
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

**Current Total:** 676 tests across 90 test files (all passing)
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
| **Vitest** | Unit + Integration | ✅ Active — 676 tests |
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
- **Final: 676 tests, 90 test files, all passing**

---

## 🚀 SUCCESS METRICS

### Quantitative (Actual as of March 2026)
- **Test Execution Time:** ~64s locally, <3 min in CI
- **Total Tests:** 676 (90 test files)
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
- **Run:** `npm run test:p0` — executes 97 `@p0`-tagged tests
- **Coverage:** Auth, Search, Pricing, Bidding, Owner Dashboard, Cancellation, Messaging

---

**Next Steps:**
1. Review this strategy with team
2. Approve priorities
3. Move to implementation (see CLAUDE-CODE-PROMPTS.md)
