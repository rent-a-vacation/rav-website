# Test Strategy - Rent-A-Vacation Platform

**Version:** 1.0  
**Created:** February 13, 2026  
**Author:** Testing Architecture Team  
**Status:** Ready for Implementation

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

## 📊 Testing Pyramid (Target Coverage)

```
        /\
       /E2E\        10-15 critical user flows (Playwright)
      /-----\       Example: Complete booking flow end-to-end
     /  INT  \      20-30 integration tests (Vitest)
    /---------\     Example: Stripe checkout creation + DB update
   /   UNIT    \    40-60 unit tests (Vitest)
  /-------------\   Example: Cancellation refund calculation
```

**Total Target:** ~80-100 tests (achievable in 2-3 weeks)

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

### 6. Bidding System (P2)
| Test | Type | Priority |
|------|------|----------|
| Place bid on listing | Integration | P2 |
| Accept/reject bid | Integration | P2 |
| Create travel request | Integration | P2 |
| Submit proposal to travel request | Integration | P2 |

### 7. Cancellation Flow (P2)
| Test | Type | Priority |
|------|------|----------|
| Calculate refund based on policy | Unit | P1 |
| Request cancellation | Integration | P2 |
| Approve/deny cancellation | Integration | P2 |
| Process refund | Integration | P0 |

### 8. Email Notifications (P2)
| Test | Type | Priority |
|------|------|----------|
| Booking confirmation email | Integration | P0 |
| Owner reminder email (CRON) | Integration | P2 |
| Cancellation notification | Integration | P2 |

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
| Tool | Purpose | Why |
|------|---------|-----|
| **Vitest** | Unit + Integration | Fast, native Vite support, better DX than Jest |
| **Playwright** | E2E testing | Industry standard, great debugging, cross-browser |
| **Percy.io** | Visual regression | Catch UI bugs automatically (free tier) |
| **GitHub Actions** | CI/CD | Already using it, 2000 free min/month |
| **dorny/test-reporter** | PR test annotations | Free, no subscription — annotates failed tests inline on PRs using JUnit XML output from Vitest |

> **Note on test management platforms:** Qase was evaluated and removed (Mar 2026) — the free plan does not support the TestOps API and no tests had been tagged with case IDs. A future QA enhancement issue (#149) tracks selecting and properly integrating a test management platform with a curated P0 test case library. Until then, GitHub native reporting covers CI visibility needs.

### Test Data Strategy
- **Unit tests:** Mock data in test files
- **Integration tests:** Supabase local database (via Docker)
- **E2E tests:** Dedicated test database (separate Supabase project)

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

## 🎯 IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1)
**Goal:** Setup infrastructure + critical P0 tests

**Tasks:**
1. Install Vitest + Playwright
2. Configure test environment
3. Setup GitHub Actions workflow
4. Write 5 critical E2E tests (auth + booking)
5. Write 10 integration tests (payment flow)

**Deliverable:** CI/CD pipeline blocks deployment if tests fail

---

### Phase 2: Coverage Expansion (Week 2)
**Goal:** Add P1 tests + integration tests

**Tasks:**
1. Add 20 integration tests (hooks, edge functions)
2. Add 5 more E2E tests (owner dashboard, admin)
3. Setup Percy for visual regression
4. Write unit tests for business logic

**Deliverable:** 50+ tests, 60% integration coverage

---

### Phase 3: Polish & Automation (Week 3)
**Goal:** Complete secondary features + visual regression

**Tasks:**
1. Add P2 tests (bidding, cancellation)
2. Setup visual regression for key pages
3. Add test coverage reporting
4. Document testing guidelines for future development

**Deliverable:** 80+ tests, full CI/CD automation

---

## 🚀 SUCCESS METRICS

### Quantitative
- **Test Execution Time:** <5 minutes (CI/CD)
- **Test Coverage:** 60% integration, 70% unit
- **E2E Tests:** 15 critical flows
- **CI/CD Pass Rate:** >95%

### Qualitative
- Zero production incidents from untested code
- Developers confident to ship features
- Tests don't slow down development
- Easy for AI agents to add new tests

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
Will be stored in:
- `tests/fixtures/users.ts` - Sample user data
- `tests/fixtures/properties.ts` - Sample property data
- `tests/fixtures/bookings.ts` - Sample booking data

---

**Next Steps:**
1. Review this strategy with team
2. Approve priorities
3. Move to implementation (see CLAUDE-CODE-PROMPTS.md)
