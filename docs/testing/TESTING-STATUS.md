---
last_updated: "2026-05-01T01:38:53"
change_ref: "b70bd7a"
change_type: "session-63"
status: "active"
---
# Testing Status

> Current state of the RAV test suite. Updated each session.
> **Last Updated:** May 6, 2026 (Session 64 — #483 + #484 disclaimer registry + 9 placements + About page; #485 No Timeshare Sales validation; +134 tests, +10 test files)

---

## Quick Stats

| Metric | Value |
|--------|-------|
| **Total tests** | 1626 |
| **Test files** | 167 |
| **P0 critical-path tests** | 290+ tagged `@p0` (Session 64 added @p0 on disclaimer registry, DisclaimerBlock, StateSpecificDisclaimer, Footer registry sourcing, Terms 8.3+8.6, About page, placement audit) |
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
| `supabase/functions/**/*.test.ts` | 12 | 143 (Phase 22 helpers + Session 60 #371 edge-fn harness + #442 Stripe Connect) |
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
