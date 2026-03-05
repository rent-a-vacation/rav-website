# Testing Status

> Current state of the RAV test suite. Updated each session.
> **Last Updated:** March 4, 2026 (Session 36)

---

## Quick Stats

| Metric | Value |
|--------|-------|
| **Total tests** | 627 |
| **Test files** | 86 |
| **P0 critical-path tests** | 97 (tagged `@p0`) |
| **E2E smoke tests** | 3 (Playwright) |
| **Local run time** | ~65s |
| **CI run time** | <3 min |
| **TypeScript errors** | 0 |
| **Lint errors** | 0 |
| **Build** | Clean |

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
| `src/lib/*.test.ts` | ~20 | ~180 |
| `src/hooks/*.test.ts` | ~35 | ~280 |
| `src/components/**/*.test.tsx` | ~25 | ~140 |
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
