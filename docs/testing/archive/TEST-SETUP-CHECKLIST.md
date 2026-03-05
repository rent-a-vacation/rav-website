# Test Setup Checklist - Implementation Guide

**Version:** 2.0
**Created:** February 13, 2026
**Completed:** March 4, 2026
**Status:** ✅ ALL PHASES COMPLETE — 592 tests, 81 test files

> This checklist is historical reference. All phases were completed between Feb 13 - Mar 4, 2026.
> For current testing guidance, see `TESTING-GUIDELINES.md` and `OPERATIONAL-GUIDE.md`.

---

## 🎯 OVERVIEW

This checklist guides you through setting up a complete testing infrastructure for Rent-A-Vacation. Follow in order - each step builds on the previous.

**Progress Tracking:** Mark items as you complete them.

---

## ⚙️ PHASE 0: Pre-Setup (30 minutes)

**Goal:** Create accounts and gather credentials

### Step 1: Percy.io Account
- [ ] Go to https://percy.io
- [ ] Click "Sign in with Google"
- [ ] Connect to GitHub repository: `rent-a-vacation/rav-website`
- [ ] Copy Percy token from Project Settings
- [ ] Note: Private repos ARE supported on free tier

### Step 2: GitHub Repository Prep
- [ ] Ensure you have push access to `rent-a-vacation/rav-website`
- [ ] Verify GitHub Actions is enabled (Settings → Actions)
- [ ] Check current workflow files in `.github/workflows/`

### Step 3: Local Development Setup
- [ ] Clone repo: `git clone https://github.com/rent-a-vacation/rav-website.git`
- [ ] Verify local setup works: `npm install && npm run dev`
- [ ] Confirm Supabase connection (check console for errors)

---

## 📦 PHASE 1: Install Testing Tools (45 minutes)

**Goal:** Add Vitest, Playwright, and supporting libraries

### Step 4: Install Vitest (Unit + Integration)
```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jsdom
```

**Verification:**
- [ ] Run `npx vitest --version` → Should show version number
- [ ] Check `package.json` has vitest in devDependencies

### Step 5: Install Playwright (E2E)
```bash
npm install -D @playwright/test
npx playwright install # Downloads browser binaries
```

**Verification:**
- [ ] Run `npx playwright --version` → Should show version number
- [ ] Confirm browsers installed (Chrome, Firefox, Safari)

### Step 6: Install Percy for Visual Regression
```bash
npm install -D @percy/cli @percy/playwright
```

**Verification:**
- [ ] Run `npx percy --version` → Should show version number

### Step 7: Update package.json Scripts
Add these to `package.json` scripts section:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:ui": "playwright test --ui",
    "test:visual": "percy exec -- playwright test"
  }
}
```

**Verification:**
- [ ] Run `npm run test` → Should start Vitest (will fail, no tests yet)
- [ ] Run `npm run test:e2e` → Should start Playwright (will fail, no tests yet)

---

## 🛠️ PHASE 2: Configure Testing Tools (1 hour)

**Goal:** Setup configuration files for optimal testing

### Step 8: Create vitest.config.ts
```bash
# Use Claude Code with PROMPT 1 from CLAUDE-CODE-PROMPTS.md
```

**What to create:**
- [ ] `vitest.config.ts` in project root
- [ ] Configure test environment: jsdom
- [ ] Setup coverage settings (60% threshold)
- [ ] Configure test globals
- [ ] Add path aliases (@/ → src/)

**Verification:**
- [ ] Run `npm run test` → Should not error (just "no tests found")
- [ ] Config file has proper TypeScript types

### Step 9: Create playwright.config.ts
```bash
# Use Claude Code with PROMPT 1 from CLAUDE-CODE-PROMPTS.md
```

**What to create:**
- [ ] `playwright.config.ts` in project root
- [ ] Configure browsers: Chrome, Firefox, Safari
- [ ] Set base URL: http://localhost:5173 (dev server)
- [ ] Configure test directory: tests/e2e/
- [ ] Set timeout: 30 seconds
- [ ] Enable screenshots on failure
- [ ] Enable video on retry

**Verification:**
- [ ] Run `npm run test:e2e` → Should not error (just "no tests found")
- [ ] Config file has proper TypeScript types

### Step 10: Create Test Setup Files
Create directory structure:
```
tests/
├── setup.ts           # Global test setup (Vitest)
├── fixtures/          # Test data
│   ├── users.ts
│   ├── properties.ts
│   └── bookings.ts
├── helpers/           # Test utilities
│   ├── supabase.ts   # Supabase test client
│   └── auth.ts       # Auth helpers
├── unit/              # Unit tests
├── integration/       # Integration tests
└── e2e/               # E2E tests
```

**Verification:**
- [ ] Directory structure created
- [ ] setup.ts exports proper test utilities

### Step 11: Setup Test Environment Variables
Create `.env.test` file:
```env
VITE_SUPABASE_URL=https://oukbxqnlxnkainnligfz.supabase.co
VITE_SUPABASE_ANON_KEY=[DEV_ANON_KEY]
STRIPE_SECRET_KEY=sk_test_[YOUR_TEST_KEY]
RESEND_API_KEY=re_test_[YOUR_TEST_KEY]
```

**Verification:**
- [ ] `.env.test` exists
- [ ] Added to `.gitignore` (don't commit secrets!)
- [ ] Test keys are Stripe TEST mode (not live)

---

## ✅ PHASE 3: Write First Tests (2-3 hours)

**Goal:** Validate setup with working tests

### Step 12: Write First Unit Test
```bash
# Use Claude Code with PROMPT 9 (Business Logic Unit Tests)
# Target: src/lib/cancellation.ts
```

**Create:**
- [ ] `tests/unit/cancellation.test.ts`
- [ ] Test all cancellation policies
- [ ] Test edge cases (0 days, negative, boundary)

**Verification:**
- [ ] Run `npm run test` → All tests pass
- [ ] Coverage report shows 70%+ for cancellation.ts

### Step 13: Write First Integration Test
```bash
# Use Claude Code with PROMPT 2 (Authentication Tests)
# Target: src/contexts/AuthContext.tsx
```

**Create:**
- [ ] `tests/integration/auth.test.ts`
- [ ] Mock Supabase client
- [ ] Test signup, login, logout flows
- [ ] Test RBAC functions

**Verification:**
- [ ] Run `npm run test` → All tests pass
- [ ] Tests complete in <5 seconds

### Step 14: Write First E2E Test
```bash
# Use Claude Code with PROMPT 10 (E2E Critical Journeys)
# Target: Login flow
```

**Create:**
- [ ] `tests/e2e/auth.spec.ts`
- [ ] Test user can sign up
- [ ] Test user can log in
- [ ] Test user sees dashboard after login

**Verification:**
- [ ] Run `npm run test:e2e` → Test passes
- [ ] Screenshots saved on failure
- [ ] Test completes in <30 seconds

---

## 🚀 PHASE 4: Setup CI/CD (1 hour)

**Goal:** Automate testing on every push

### Step 15: Create GitHub Actions Workflow
```bash
# Use Claude Code with PROMPT 12 (CI/CD Integration)
```

**Create:**
- [ ] `.github/workflows/test.yml`
- [ ] Jobs: Lint → Unit → Integration → E2E → Deploy
- [ ] Cache node_modules for speed
- [ ] Upload test results as artifacts
- [ ] Block deployment if tests fail

**Workflow Structure:**
```yaml
name: Test & Deploy
on: [push, pull_request]
jobs:
  test-unit:
    # Run unit tests
  test-integration:
    # Run integration tests
  test-e2e:
    # Run E2E tests
  deploy:
    needs: [test-unit, test-integration, test-e2e]
    # Deploy only if all tests pass
```

**Verification:**
- [ ] Push to GitHub → Workflow runs automatically
- [ ] All jobs complete successfully
- [ ] Green checkmark on commit in GitHub

### Step 16: Add GitHub Secrets
Go to GitHub: Settings → Secrets and variables → Actions

Add these secrets:
- [ ] `PERCY_TOKEN` (from Percy.io)
- [ ] `SUPABASE_URL` (test database)
- [ ] `SUPABASE_ANON_KEY` (test database)
- [ ] `STRIPE_SECRET_KEY` (test mode)
- [ ] `RESEND_API_KEY` (test mode)

**Verification:**
- [ ] Secrets show as "encrypted" in GitHub
- [ ] Workflow can access secrets (check logs)

---

## 📝 PHASE 5: Write Critical Tests (Week 1)

**Goal:** Cover P0 features (auth, payment, search)

### Step 17: Authentication Tests (P0)
```bash
# Use PROMPT 2 from CLAUDE-CODE-PROMPTS.md
```

**Tests to write:**
- [ ] Unit: AuthContext state management
- [ ] Integration: signUp(), signIn(), signOut()
- [ ] Integration: RBAC (hasRole, isRavTeam, etc.)
- [ ] E2E: Signup → Login → Dashboard flow
- [ ] E2E: Protected route redirect

**Target:** 10-15 tests  
**Time:** 2-3 hours

### Step 18: Booking & Payment Tests (P0)
```bash
# Use PROMPT 3 from CLAUDE-CODE-PROMPTS.md
```

**Tests to write:**
- [ ] Integration: Create Stripe checkout session
- [ ] Integration: Process payment webhook (mocked)
- [ ] Integration: Update booking status
- [ ] Integration: Send confirmation email
- [ ] E2E: Complete booking flow (with Stripe test mode)

**Target:** 8-10 tests  
**Time:** 3-4 hours

### Step 19: Search & Discovery Tests (P0)
```bash
# Use PROMPT 4 from CLAUDE-CODE-PROMPTS.md
```

**Tests to write:**
- [ ] Integration: Search by location
- [ ] Integration: Filter by dates, guests, price
- [ ] E2E: Browse listings
- [ ] E2E: View listing detail
- [ ] E2E: Voice search (if applicable)

**Target:** 6-8 tests  
**Time:** 2 hours

**Week 1 Checkpoint:**
- [ ] Total tests: 25-35
- [ ] CI/CD passing on every commit
- [ ] Coverage: ~40% integration, ~70% unit

---

## 🏗️ PHASE 6: Expand Coverage (Week 2)

**Goal:** Cover P1 features (owner dashboard, admin, bidding)

### Step 20: Owner Dashboard Tests (P1)
```bash
# Use PROMPT 5 from CLAUDE-CODE-PROMPTS.md
```

**Tests to write:**
- [ ] Integration: Create property
- [ ] Integration: Create listing
- [ ] Integration: Upload images
- [ ] Integration: Submit resort confirmation
- [ ] E2E: Owner creates property → admin approves → goes live

**Target:** 10-12 tests  
**Time:** 3 hours

### Step 21: Admin Dashboard Tests (P1)
```bash
# Use PROMPT 6 from CLAUDE-CODE-PROMPTS.md
```

**Tests to write:**
- [ ] Integration: Approve/reject listings
- [ ] Integration: Manage user roles
- [ ] Integration: Verify owner documents
- [ ] E2E: Admin approval workflow

**Target:** 8-10 tests  
**Time:** 2-3 hours

### Step 22: Bidding System Tests (P2)
```bash
# Use PROMPT 7 from CLAUDE-CODE-PROMPTS.md
```

**Tests to write:**
- [ ] Integration: Place bid
- [ ] Integration: Accept/reject bid
- [ ] Integration: Create travel request
- [ ] Integration: Submit proposal
- [ ] E2E: Complete bidding flow

**Target:** 10-15 tests  
**Time:** 3-4 hours

### Step 23: Email System Tests (P2)
```bash
# Use PROMPT 8 from CLAUDE-CODE-PROMPTS.md
```

**Tests to write:**
- [ ] Integration: Send booking confirmation
- [ ] Integration: Send reminder emails
- [ ] Integration: CRON job triggers emails
- [ ] Mock Resend API

**Target:** 6-8 tests  
**Time:** 2 hours

**Week 2 Checkpoint:**
- [ ] Total tests: 60-80
- [ ] Coverage: ~60% integration, ~70% unit
- [ ] All critical paths tested

---

## 🎨 PHASE 7: Visual Regression (Week 3)

**Goal:** Add visual testing for UI confidence

### Step 24: Setup Percy Visual Tests
```bash
# Use PROMPT 11 from CLAUDE-CODE-PROMPTS.md
```

**Steps:**
- [ ] Configure Percy in playwright.config.ts
- [ ] Add PERCY_TOKEN to GitHub secrets
- [ ] Create visual regression tests

**Pages to snapshot:**
- [ ] Landing page (/)
- [ ] Search results (/rentals)
- [ ] Listing detail (/property/:id)
- [ ] Owner dashboard (/owner-dashboard)
- [ ] Admin dashboard (/admin)
- [ ] Booking confirmation

**Verification:**
- [ ] Run `npm run test:visual` → Uploads to Percy
- [ ] Visit Percy.io dashboard → See snapshots
- [ ] Approve baseline snapshots

### Step 25: Test Responsive Layouts
**Viewport sizes:**
- [ ] Mobile: 375px
- [ ] Tablet: 768px
- [ ] Desktop: 1920px

**Verification:**
- [ ] Percy shows snapshots for all viewports
- [ ] No layout breaks across devices

---

## 📊 PHASE 8: Coverage & Reporting (Week 3)

**Goal:** Track testing progress and quality

### Step 26: Setup Coverage Reports
```bash
# Use PROMPT 13 from CLAUDE-CODE-PROMPTS.md
```

**Configure:**
- [ ] Enable coverage in vitest.config.ts
- [ ] Set thresholds (60% integration, 70% unit)
- [ ] Generate HTML reports
- [ ] Add coverage badge to README

**Verification:**
- [ ] Run `npm run test:coverage` → Generates report
- [ ] Open `coverage/index.html` → See detailed coverage
- [ ] Coverage meets thresholds

### Step 27: Add Test Documentation
**Create:**
- [ ] `docs/TESTING.md` - Testing guidelines for developers
- [ ] Document how to run tests locally
- [ ] Document how to write new tests
- [ ] Link to this checklist

**Content:**
```markdown
# Testing Guide

## Running Tests
- Unit: `npm run test`
- E2E: `npm run test:e2e`
- Coverage: `npm run test:coverage`
- Visual: `npm run test:visual`

## Writing Tests
See CLAUDE-CODE-PROMPTS.md for prompt templates.

## CI/CD
Tests run automatically on every push.
```

---

## ✅ PHASE 9: Process Integration (Ongoing)

**Goal:** Make testing part of daily development

### Step 28: Setup Feature Development Process
**For every new feature, developers must:**
- [ ] Identify critical path (what breaks?)
- [ ] Write tests FIRST (or alongside code)
- [ ] Use Claude Code prompts for boilerplate
- [ ] Review tests in PR
- [ ] Ensure CI passes before merge

**Add to PROJECT-HUB.md:**
```markdown
## Feature Development Checklist
- [ ] Feature code written
- [ ] Tests written (unit + integration + E2E if needed)
- [ ] Tests pass locally
- [ ] CI/CD passes
- [ ] Code reviewed
- [ ] Merged to main
```

### Step 29: Setup Test Maintenance Schedule
**Monthly tasks:**
- [ ] Review flaky tests (fix or delete)
- [ ] Check test execution time (keep <5 min)
- [ ] Update test data fixtures
- [ ] Review coverage gaps
- [ ] Update test documentation

---

## 🎉 COMPLETION CHECKLIST

### Infrastructure ✅
- [x] Vitest installed and configured
- [x] Playwright installed and configured
- [x] Percy.io setup for visual regression (disabled — private repo)
- [x] GitHub Actions workflow running tests
- [x] All secrets configured
- [x] Husky + lint-staged pre-commit hooks
- [x] Lighthouse CI audit

### Tests Written ✅
- [x] ~240 Unit tests (lib functions)
- [x] ~350 Integration tests (hooks, components, contexts)
- [x] 3 E2E smoke tests (Playwright)
- [x] 97 P0 critical-path tests tagged (`npm run test:p0`)
- [x] **Total: 592 tests across 81 files**

### Coverage ✅
- [x] Coverage thresholds enforced in CI (25/25/30/25%)
- [x] Critical paths covered (auth, pricing, bidding, cancellation, messaging)
- [x] P0 test case library documented (docs/P0-TEST-CASES.md)

### Automation ✅
- [x] Tests run on every push to main + PRs
- [x] Tests block deployment if failing
- [x] Coverage reports generated (HTML artifact, 14-day retention)
- [x] Test results annotated inline on PRs (dorny/test-reporter)
- [x] Pre-commit hook runs lint + related tests

### Process ✅
- [x] Testing guide documented (TESTING-GUIDELINES.md)
- [x] Tests-With-Features policy enforced (CLAUDE.md)
- [x] Operational guide for developers (OPERATIONAL-GUIDE.md)
- [x] P0 test case library for pre-release validation

---

## 🚨 TROUBLESHOOTING

### "Tests are slow" (>5 min)
**Fix:**
- Run tests in parallel (default in Vitest/Playwright)
- Use GitHub Actions caching for node_modules
- Split E2E tests into smaller suites

### "Tests are flaky"
**Fix:**
- Add proper wait conditions (waitForSelector, etc.)
- Don't rely on exact timing (setTimeout)
- Clean up test data properly

### "Coverage is dropping"
**Fix:**
- Enable pre-commit hooks to check coverage
- Add tests for new code before merging
- Review untested code paths

### "CI is failing but local tests pass"
**Fix:**
- Check environment variables match
- Ensure database state is clean between tests
- Verify browser versions match locally vs CI

---

## 📞 SUPPORT

**Questions?** Document in PROJECT-HUB.md:
```markdown
## Testing Questions
- Issue: [describe issue]
- Attempted solutions: [what you tried]
- Next steps: [what you need]
```

---

**🎯 Goal:** By end of Week 3, you have a world-class testing infrastructure that runs automatically and catches bugs before production.

**Next Step:** Go to CLAUDE-CODE-PROMPTS.md and start with PROMPT 1 (Initial Setup).
