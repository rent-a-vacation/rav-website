---
last_updated: "2026-04-20T12:58:39"
change_ref: "0a2ec90"
change_type: "session-54"
status: "active"
---
# Testing Status

> Current state of the RAV test suite. Updated each session.
> **Last Updated:** April 20, 2026 (Session 56)

---

## Quick Stats

| Metric | Value |
|--------|-------|
| **Total tests** | 1146 |
| **Test files** | 134 |
| **P0 critical-path tests** | 97 (tagged `@p0`) + 4 subscription P0s |
| **E2E smoke tests** | 3 (Playwright) |
| **Local run time** | ~2.5 min (full), ~2s (P0 only) |
| **CI run time** | <3 min |
| **TypeScript errors** | 0 |
| **Lint errors** | 0 |
| **Build** | Clean |
| **QA manual scenarios** | 30 total — S-01 through S-05 in progress (Apr 19). 3 bugs fixed via PR #373, retest pending |

## Coverage Thresholds (enforced in CI)

| Metric | Threshold |
|--------|-----------|
| Statements | 25% |
| Branches | 25% |
| Functions | 30% |
| Lines | 25% |

## Commands

```bash
npm run test              # Vitest unit + integration (watch mode)
npm run test:p0           # P0 critical-path tests only (~2s)
npm run test:coverage     # With coverage report
npm run test:e2e          # Playwright E2E
npm run test:e2e:headed   # Playwright with browser visible
```

## Test Distribution

| Category | Files | Approx Tests |
|----------|-------|-------------|
| `src/lib/*.test.ts` | ~22 | ~210 |
| `src/hooks/*.test.ts` | ~38 | ~320 |
| `src/components/**/*.test.tsx` | ~29 | ~165 |
| `src/contexts/*.test.tsx` | ~4 | ~20 |
| `e2e/smoke/` | 2 | 3 |

## Stack

- **Unit/Integration:** Vitest + React Testing Library
- **E2E:** Playwright
- **Visual Regression:** Percy (disabled — requires paid plan for private repos)
- **CI:** GitHub Actions + dorny/test-reporter (JUnit XML → PR annotations)
- **Pre-commit:** Husky + lint-staged (lint + run related tests)

## Growth Log

| Session | Tests | Files | Notes |
|---------|-------|-------|-------|
| 44 | 848 | 108 | +23 tests (subscription, listing limits, admin MRR) |
| 39 | 771 | 99 | Brand rebrand (SmartFee→SmartEarn, etc.), no new test files |
| 38 | 771 | 99 | Public API, RAV Smart Suite, IP Allowlisting, OpenAPI validation |
| 37 | 676 | 90 | Dynamic pricing, referral program |
| 36 | 627 | 86 | Admin tools, disputes expansion |
| 35 | 592 | 81 | OpenAPI, P0 library, iCal |
| 34 | 574 | 78 | Realtime, destinations, saved searches |
| 33 | 507 | 74 | Cancellation, timeline, compare, pricing |
| 32 | 462 | 69 | Staff permissions |
| 31 | 451 | 63 | P0 UX, onboarding |
| 30 | 451 | 63 | Code splitting, CI fix |
| 27 | 451 | 63 | Reviews, messaging, portfolio |
| 26 | 409 | — | GA4, tax reporting |
| 25 | 402 | — | Role-based UX overhaul |
| 24 | 387 | — | Disputes, GDPR, security |

## Archived

- `docs/testing/archive/TEST-SETUP-CHECKLIST.md` — historical setup checklist (completed, all phases done)
