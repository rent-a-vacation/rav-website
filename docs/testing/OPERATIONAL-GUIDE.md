# Testing Operational Guide — Rent-A-Vacation

## Quick Reference

| Command | What It Does |
|---------|--------------|
| `npm test` | Run all unit + integration tests (592 tests) |
| `npm run test:p0` | Run P0 critical-path tests only (97 tests, ~2s) |
| `npm run test:watch` | Watch mode (re-run on change) |
| `npm run test:coverage` | Tests + coverage report |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run test:e2e:ui` | Playwright with visual UI debugger |
| `npm run test:visual` | Percy visual regression snapshots (disabled) |
| `npm run test:lighthouse` | Lighthouse CI audit |

## Running Tests Locally

### Unit + Integration Tests
```bash
# Run all tests (592 tests, ~64s)
npm test

# Run P0 critical-path tests only (97 tests, ~2s)
npm run test:p0

# Run specific test file
npx vitest run src/lib/cancellation.test.ts

# Watch mode for development
npm run test:watch

# With coverage
npm run test:coverage
```

### E2E Tests
```bash
# Ensure dev server is running (or let Playwright start it)
npm run test:e2e

# With interactive UI
npm run test:e2e:ui

# Run specific test
npx playwright test e2e/smoke/homepage.spec.ts
```

### Visual Regression (Percy)
```bash
# Requires PERCY_TOKEN env var
PERCY_TOKEN=your_token npm run test:visual
```

### Lighthouse
```bash
# Build first, then audit
npm run build
npm run test:lighthouse
```

## Adding New Tests

### 1. Unit Test (Pure Function)
Create `src/lib/myModule.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "./myModule";

describe("myFunction", () => {
  it("handles normal input", () => {
    expect(myFunction("hello")).toBe("HELLO");
  });

  it("handles edge case", () => {
    expect(myFunction("")).toBe("");
  });
});
```

### 2. Hook Test
Create `src/hooks/useMyHook.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createHookWrapper } from "@/test/helpers/render";

vi.mock("@/lib/supabase", () => ({
  supabase: { from: vi.fn().mockReturnValue(/* chain */) },
  isSupabaseConfigured: () => true,
}));

const { useMyHook } = await import("./useMyHook");

describe("useMyHook", () => {
  it("fetches data", async () => {
    const { result } = renderHook(() => useMyHook(), {
      wrapper: createHookWrapper(),
    });
    await waitFor(() => expect(result.current.data).toBeDefined());
  });
});
```

### 3. E2E Smoke Test
Create `e2e/smoke/myPage.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

test("my page loads correctly", async ({ page }) => {
  await page.goto("/my-page");
  await expect(page.getByRole("heading")).toBeVisible();
});
```

## CI Pipeline Overview

The CI runs on every push to `main` and on all PRs:

```
┌─────────────────────┐
│ lint-and-typecheck   │  ESLint + TypeScript check
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │            │
┌────▼────┐ ┌────▼────┐ ┌──────────┐
│ unit    │ │ e2e     │ │lighthouse│
│ tests   │ │ tests   │ │ audit    │
└─────────┘ └────┬────┘ └──────────┘
                 │
            ┌────▼────┐
            │ visual  │  (PRs only)
            │ regress │
            └─────────┘
```

- **lint-and-typecheck**: Must pass before other jobs run
- **unit-tests**: Runs with coverage, publishes JUnit XML report as a GitHub Check via dorny/test-reporter
- **e2e-tests**: Playwright smoke tests
- **visual-regression**: Percy snapshots (PRs only)
- **lighthouse**: Performance + accessibility audit

## Reviewing Percy Diffs

1. Open a PR — Percy automatically runs
2. Go to the Percy dashboard to review visual diffs
3. Approve changes if they're intentional
4. Percy blocks PR merge if diffs are unapproved (if configured)

## CI Test Reporting (GitHub Native)

Test results are published as a GitHub Check on every CI run using `dorny/test-reporter` + Vitest JUnit XML output.

- View test results: GitHub PR → Checks tab → "Unit & Integration Tests"
- Failed tests are annotated inline on the PR diff with file and line number
- Coverage HTML report is uploaded as a CI artifact (14-day retention)

> **Qase removed (Mar 2026):** Replaced with free GitHub-native reporting. See issue #149 for future QA platform review.

## Pre-Commit Hook

The Husky pre-commit hook runs `lint-staged` which:
1. Lints staged `.ts`/`.tsx` files with ESLint
2. Runs related Vitest tests for changed files

This catches issues before they reach CI.

## Troubleshooting

### Tests fail with "supabase" errors
Ensure `@/lib/supabase` is properly mocked in your test file.

### Timezone-related test failures
Use local-time strings (`"2026-03-10T12:00:00"` without `Z`) or `new Date(year, month, day)` constructors to avoid UTC midnight timezone shifts.

### Playwright tests can't connect
Ensure dev server is running on port 8080, or let Playwright start it automatically.
