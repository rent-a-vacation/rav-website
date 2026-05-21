# Phase 2 Stage 2c — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/executive-dashboard/financial-model` functionally equivalent to editing amber cells in the RAV Financial Model `.xlsx` — with per-user, sparse-override scenarios persisted in Supabase and a drift indicator that highlights every value differing from canonical baseline.

**Architecture:** New Supabase table `financial_model_scenarios` (sparse override JSON, RLS-gated to RAV team); React Query hooks for scenario CRUD + active selection + localStorage drafts; `calc.ts` refactored to accept optional merged inputs + commission rate; inline accordions below KPIs render `EditableInputRow` cells; drift banner + per-section + per-input reset; read-only share semantics (author is sole editor; non-owners get "Duplicate to my scenarios").

**Tech Stack:** Vite + React 18 + TypeScript, Supabase (Postgres + RLS + Edge functions), shadcn/ui + Tailwind, React Query (`@tanstack/react-query`), Vitest + React Testing Library, lucide-react icons.

**Spec:** [`docs/superpowers/specs/2026-05-20-financial-model-stage-2c-design.md`](../specs/2026-05-20-financial-model-stage-2c-design.md) @ commit `8d0c1f6`.
**Issue:** [#550](https://github.com/rent-a-vacation/rav-website/issues/550).
**Branch:** `feature/stage-2c-financial-model` off `dev`. 5 PRs into the feature branch, then one release PR `dev → main`.

---

## Prep: Create the feature branch

- [ ] **Step 0.1: Verify clean tree, on `dev`, up to date**

```bash
git status
git rev-parse --abbrev-ref HEAD
git pull --ff-only origin dev
```

Expected: clean tree, `dev`, "Already up to date" or fast-forward applied.

- [ ] **Step 0.2: Create + checkout feature branch**

```bash
git checkout -b feature/stage-2c-financial-model
```

Expected: `Switched to a new branch 'feature/stage-2c-financial-model'`.

- [ ] **Step 0.3: Push and set upstream**

```bash
git push -u origin feature/stage-2c-financial-model
```

---

## PR1 — Schema + hooks + commission DB switch

Migration 081, two hooks (`useFinancialModelScenarios`, `useActiveScenario`), `calc.ts` refactored to take optional `inputs` + `commissionRate`, and `FinancialModelDashboard.tsx` wired to read commission live from DB. No visible UI change — the existing Conservative/Base/Optimistic toggle still drives projection. `useCommissionRate` data flows into `project(...)` so the financial model uses the live DB value instead of the build-time fallback. Tests verify backwards-compat and hook behavior.

**Files:**
- Create: `supabase/migrations/081_financial_model_scenarios.sql`
- Create: `src/lib/financial-model/system-scenarios.ts`
- Create: `src/hooks/useFinancialModelScenarios.ts`
- Create: `src/hooks/useFinancialModelScenarios.test.ts`
- Create: `src/hooks/useActiveScenario.ts`
- Create: `src/hooks/useActiveScenario.test.ts`
- Modify: `src/lib/financial-model/calc.ts` (refactor signature, backwards-compatible)
- Modify: `src/lib/financial-model/calc.test.ts` if exists; otherwise create
- Modify: `src/pages/FinancialModelDashboard.tsx` (call `useCommissionRate`, pass into `project`)
- Modify: `src/types/database.ts` (add `financial_model_scenarios` row type)

### Task 1.1: Migration 081 — `financial_model_scenarios` table

- [ ] **Step 1.1.1: Verify pre-existing helpers**

```bash
grep -rn "update_updated_at_column" supabase/migrations | head -5
grep -rn "is_rav_team" supabase/migrations | head -5
```

Expected: `update_updated_at_column()` defined in `20260211_resort_master_data.sql`. `is_rav_team(uuid)` used in 010, 008, 007, 066, 071, 075, 077, 080 — assumed defined in the live DB (provisioned outside this migrations folder). If migrating to a fresh DB, the function must already exist via an earlier provisioning step.

- [ ] **Step 1.1.2: Create the migration file**

Path: `supabase/migrations/081_financial_model_scenarios.sql`

```sql
-- 081_financial_model_scenarios.sql
-- Phase 2 Stage 2c (#550): per-user financial-model scenarios with sparse JSON overrides.
-- RLS-gated to RAV team. Read-only share semantics (author is sole editor).

CREATE TABLE IF NOT EXISTS public.financial_model_scenarios (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              text NOT NULL,
  multiplier        text NOT NULL DEFAULT 'Base',
  overrides         jsonb NOT NULL DEFAULT '{}'::jsonb,
  expense_overrides jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_shared         boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fms_multiplier_chk
    CHECK (multiplier IN ('Conservative', 'Base', 'Optimistic')),
  CONSTRAINT fms_name_len
    CHECK (char_length(name) BETWEEN 1 AND 80),
  CONSTRAINT fms_name_unique_per_owner
    UNIQUE (owner_id, name)
);

CREATE INDEX IF NOT EXISTS idx_fms_owner
  ON public.financial_model_scenarios(owner_id);

CREATE INDEX IF NOT EXISTS idx_fms_shared
  ON public.financial_model_scenarios(is_shared)
  WHERE is_shared = true;

ALTER TABLE public.financial_model_scenarios ENABLE ROW LEVEL SECURITY;

-- SELECT: RAV team can see their own + any shared
DROP POLICY IF EXISTS fms_select ON public.financial_model_scenarios;
CREATE POLICY fms_select ON public.financial_model_scenarios
  FOR SELECT
  USING (
    public.is_rav_team(auth.uid())
    AND (owner_id = auth.uid() OR is_shared = true)
  );

-- INSERT: RAV team can insert rows owned by themselves
DROP POLICY IF EXISTS fms_insert ON public.financial_model_scenarios;
CREATE POLICY fms_insert ON public.financial_model_scenarios
  FOR INSERT
  WITH CHECK (
    public.is_rav_team(auth.uid())
    AND owner_id = auth.uid()
  );

-- UPDATE: only the owner can edit; cannot reassign ownership
DROP POLICY IF EXISTS fms_update ON public.financial_model_scenarios;
CREATE POLICY fms_update ON public.financial_model_scenarios
  FOR UPDATE
  USING (
    public.is_rav_team(auth.uid())
    AND owner_id = auth.uid()
  )
  WITH CHECK (owner_id = auth.uid());

-- DELETE: only the owner
DROP POLICY IF EXISTS fms_delete ON public.financial_model_scenarios;
CREATE POLICY fms_delete ON public.financial_model_scenarios
  FOR DELETE
  USING (
    public.is_rav_team(auth.uid())
    AND owner_id = auth.uid()
  );

-- Auto-bump updated_at
DROP TRIGGER IF EXISTS set_financial_model_scenarios_updated_at
  ON public.financial_model_scenarios;
CREATE TRIGGER set_financial_model_scenarios_updated_at
  BEFORE UPDATE ON public.financial_model_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.financial_model_scenarios IS
  'Phase 2 Stage 2c (#550): per-user scenarios for /executive-dashboard/financial-model. Sparse JSON overrides on data.ts baseline. Author is sole editor (read-only share).';
```

- [ ] **Step 1.1.3: Apply migration to DEV (NOT prod)**

```bash
npx supabase db push --include-all --linked --project-ref oukbxqnlxnkainnligfz
```

Expected: `Applying migration 081_financial_model_scenarios.sql ... Done.`

PROD push is held until PR5 lands — release PR `dev → main` is when production gets it.

- [ ] **Step 1.1.4: Generate updated database types**

```bash
npx supabase gen types typescript --linked --project-ref oukbxqnlxnkainnligfz > src/types/supabase.ts
```

Expected: `src/types/supabase.ts` now has `financial_model_scenarios` Row/Insert/Update types. Confirm with:

```bash
grep -n "financial_model_scenarios" src/types/supabase.ts | head -5
```

- [ ] **Step 1.1.5: Commit**

```bash
git add supabase/migrations/081_financial_model_scenarios.sql src/types/supabase.ts
git commit -m "feat(financial-model): migration 081 — financial_model_scenarios table (#550 PR1)

Per-user scenarios with sparse JSON overrides + RLS gated to RAV team.
Read-only share (author is sole editor). Author = owner_id; no ownership
reassignment via UPDATE.

DEV applied; PROD held until release PR."
```

### Task 1.2: `system-scenarios.ts` constants

System scenarios (Base / Conservative / Optimistic) are virtual — not seeded as DB rows — to avoid the "what if a user deletes Base?" problem.

- [ ] **Step 1.2.1: Create the file**

Path: `src/lib/financial-model/system-scenarios.ts`

```ts
import type { Scenario } from './calc';

/**
 * Virtual system scenarios — NOT seeded as DB rows.
 * Always available, always selectable, cannot be edited or deleted.
 * "Save As..." on a system scenario creates a brand-new owned scenario.
 */
export interface SystemScenario {
  id: `system:${string}`;
  name: string;
  multiplier: Scenario;
  system: true;
}

export const SYSTEM_SCENARIOS: readonly SystemScenario[] = [
  { id: 'system:base',         name: 'Base',         multiplier: 'Base',         system: true },
  { id: 'system:conservative', name: 'Conservative', multiplier: 'Conservative', system: true },
  { id: 'system:optimistic',   name: 'Optimistic',   multiplier: 'Optimistic',   system: true },
] as const;

export const DEFAULT_SCENARIO_ID = 'system:base';

export function isSystemScenarioId(id: string | null | undefined): id is SystemScenario['id'] {
  return typeof id === 'string' && id.startsWith('system:');
}

export function findSystemScenario(id: string): SystemScenario | undefined {
  return SYSTEM_SCENARIOS.find((s) => s.id === id);
}
```

- [ ] **Step 1.2.2: Commit**

```bash
git add src/lib/financial-model/system-scenarios.ts
git commit -m "feat(financial-model): system-scenarios constants (#550 PR1)

Virtual Base/Conservative/Optimistic scenarios — not seeded as DB rows.
Used by the unified scenario picker alongside user-owned DB scenarios."
```

### Task 1.3: Refactor `calc.ts` — accept optional `inputs` + `commissionRate`

The refactor MUST be backwards-compatible: `project('Base')` with no other args returns byte-identical numbers to current behavior.

- [ ] **Step 1.3.1: Write the regression test FIRST**

Path: `src/lib/financial-model/calc.test.ts` (if not present, create; if present, add cases).

```ts
import { describe, it, expect } from 'vitest';
import { project } from './calc';
import {
  PLATFORM, SUBSCRIPTIONS, GROWTH, SCENARIOS, HORIZON,
  RESERVES, HIRING, UNIT_ECON, EXPENSES,
} from './data';
import { DEFAULT_COMMISSION } from '@/config/commission';

describe('project() — backwards-compatibility (#550 PR1) @p0', () => {
  it('project("Base") returns identical numbers with vs. without inputs arg', () => {
    const noArgs = project('Base');
    const explicitBaseline = project('Base', {
      platform: PLATFORM,
      subscriptions: SUBSCRIPTIONS,
      growth: GROWTH,
      scenarios: SCENARIOS,
      horizon: HORIZON,
      reserves: RESERVES,
      hiring: HIRING,
      unitEcon: UNIT_ECON,
      expenses: EXPENSES,
    });

    expect(explicitBaseline.totals.totalRevenue24mo).toBe(noArgs.totals.totalRevenue24mo);
    expect(explicitBaseline.totals.totalCosts24mo).toBe(noArgs.totals.totalCosts24mo);
    expect(explicitBaseline.totals.totalProfit24mo).toBe(noArgs.totals.totalProfit24mo);
    expect(explicitBaseline.breakEvenMonth).toBe(noArgs.breakEvenMonth);
    expect(explicitBaseline.monthly.length).toBe(noArgs.monthly.length);
    expect(explicitBaseline.monthly[23].cumulativeCash)
      .toBe(noArgs.monthly[23].cumulativeCash);
  });

  it('all three scenarios produce different numbers (Conservative < Base < Optimistic)', () => {
    const c = project('Conservative').totals.totalRevenue24mo;
    const b = project('Base').totals.totalRevenue24mo;
    const o = project('Optimistic').totals.totalRevenue24mo;
    expect(c).toBeLessThan(b);
    expect(b).toBeLessThan(o);
  });

  it('commissionRate arg overrides DEFAULT_COMMISSION', () => {
    const baseline = project('Base');
    const halved = project('Base', undefined, {
      base: DEFAULT_COMMISSION.base / 2,
      proDiscount: DEFAULT_COMMISSION.proDiscount,
      businessDiscount: DEFAULT_COMMISSION.businessDiscount,
    });
    expect(halved.totals.totalCommissionGross24mo).toBeLessThan(baseline.totals.totalCommissionGross24mo);
    expect(halved.totals.blendedCommissionRate).toBeLessThan(baseline.totals.blendedCommissionRate);
  });

  it('input override measurably changes projection', () => {
    const baseline = project('Base');
    const boosted = project('Base', {
      platform: PLATFORM,
      subscriptions: SUBSCRIPTIONS,
      growth: GROWTH.map((row) => row.name === 'gOwnGrowth'
        ? { ...row, value: 0.50 }
        : row),
      scenarios: SCENARIOS,
      horizon: HORIZON,
      reserves: RESERVES,
      hiring: HIRING,
      unitEcon: UNIT_ECON,
      expenses: EXPENSES,
    });
    expect(boosted.totals.totalGBV24mo).toBeGreaterThan(baseline.totals.totalGBV24mo);
  });
});
```

- [ ] **Step 1.3.2: Run the test — expect FAIL**

```bash
npx vitest run src/lib/financial-model/calc.test.ts
```

Expected: failures on the new test cases (signature `project(scenario, inputs, commissionRate)` not yet accepted). The "all three scenarios" test may already pass since the existing `project()` takes a scenario.

- [ ] **Step 1.3.3: Refactor `calc.ts` to accept optional args**

Path: `src/lib/financial-model/calc.ts`. Replace the file with this implementation (preserves existing pure-function structure; adds `ModelInputs` + `CommissionRate` params):

```ts
/**
 * Pure-TypeScript calculation engine for the RAV Financial Model.
 *
 * Inputs default to the canonical baseline imports from data.ts.
 * Stage 2c (#550): accepts an optional `inputs` arg so the merged
 * (baseline ← scenario.overrides ← draft) view-model can flow through;
 * and an optional `commissionRate` so the live DB rate (per DEC-043)
 * replaces the build-time fallback.
 */

import {
  PLATFORM,
  GROWTH,
  RESERVES,
  HIRING,
  UNIT_ECON,
  EXPENSES,
  SUBSCRIPTIONS,
  SCENARIOS,
  HORIZON,
  type InputRow,
  type ExpenseRow,
} from './data';
import { DEFAULT_COMMISSION } from '@/config/commission';

const MONTHS = 24;

function val(rows: { name: string; value: string | number }[], name: string): number {
  const row = rows.find((r) => r.name === name);
  return typeof row?.value === 'number' ? row.value : 0;
}

export type Scenario = 'Conservative' | 'Base' | 'Optimistic';

export interface ModelInputs {
  platform: InputRow[];
  subscriptions: InputRow[];
  growth: InputRow[];
  scenarios: InputRow[];
  horizon: InputRow[];
  reserves: InputRow[];
  hiring: InputRow[];
  unitEcon: InputRow[];
  expenses: ExpenseRow[];
}

export interface CommissionRate {
  base: number;
  proDiscount: number;
  businessDiscount: number;
}

export interface MonthlyProjection {
  month: number;
  activeOwners: number;
  activeTravelers: number;
  bookings: number;
  gbv: number;
  grossCommission: number;
  stripeFees: number;
  netCommission: number;
  subscriptionRev: number;
  voiceOverage: number;
  totalRevenue: number;
  totalCostsExpenses: number;
  hiringCosts: number;
  netPnL: number;
  cumulativeCash: number;
}

export interface ProjectionResult {
  scenario: Scenario;
  monthly: MonthlyProjection[];
  totals: {
    totalRevenue24mo: number;
    totalCosts24mo: number;
    totalProfit24mo: number;
    totalGBV24mo: number;
    totalCommissionGross24mo: number;
    totalCommissionNet24mo: number;
    totalStripeFees24mo: number;
    blendedCommissionRate: number;
  };
  breakEvenMonth: number | null;
  monthlyBurnSteadyState: number;
  oneTimeCostsTotal: number;
}

export const CANONICAL_BASELINE: ModelInputs = {
  platform: PLATFORM,
  subscriptions: SUBSCRIPTIONS,
  growth: GROWTH,
  scenarios: SCENARIOS,
  horizon: HORIZON,
  reserves: RESERVES,
  hiring: HIRING,
  unitEcon: UNIT_ECON,
  expenses: EXPENSES,
};

export function project(
  scenario: Scenario = 'Base',
  inputs: ModelInputs = CANONICAL_BASELINE,
  commissionRate?: CommissionRate,
): ProjectionResult {
  const rate: CommissionRate = commissionRate ?? {
    base: val(inputs.platform, 'pCommBase') || DEFAULT_COMMISSION.base,
    proDiscount: val(inputs.platform, 'pProDisc') || DEFAULT_COMMISSION.proDiscount,
    businessDiscount: val(inputs.platform, 'pBizDisc') || DEFAULT_COMMISSION.businessDiscount,
  };

  const pAvgBooking   = val(inputs.platform, 'pAvgBooking');
  const pStripePct    = val(inputs.platform, 'pStripePct');
  const pStripeFixed  = val(inputs.platform, 'pStripeFixed');

  const gLaunchMo     = val(inputs.growth, 'gLaunchMo');
  const gStartOwn     = val(inputs.growth, 'gStartOwn');
  const gStartTrav    = val(inputs.growth, 'gStartTrav');
  const gOwnGrowth    = val(inputs.growth, 'gOwnGrowth');
  const gTravGrowth   = val(inputs.growth, 'gTravGrowth');
  const gBookPerOwn   = val(inputs.growth, 'gBookPerOwn');
  const gMix0         = val(inputs.growth, 'gMix0');
  const gMix1         = val(inputs.growth, 'gMix1');
  const gMix2         = val(inputs.growth, 'gMix2');
  const gOwn1         = val(inputs.growth, 'gOwn1');
  const gOwn2         = val(inputs.growth, 'gOwn2');
  const gTrav1        = val(inputs.growth, 'gTrav1');
  const gTrav2        = val(inputs.growth, 'gTrav2');

  const gStartCash    = val(inputs.reserves, 'gStartCash');
  const gFundMonth    = val(inputs.reserves, 'gFundMonth');
  const gFundAmt      = val(inputs.reserves, 'gFundAmt');

  const hEngMonth     = val(inputs.hiring, 'hEngMonth');
  const hEngCost      = val(inputs.hiring, 'hEngCost');
  const hSupMonth     = val(inputs.hiring, 'hSupMonth');
  const hSupCost      = val(inputs.hiring, 'hSupCost');
  const hBDMonth      = val(inputs.hiring, 'hBDMonth');
  const hBDCost       = val(inputs.hiring, 'hBDCost');

  const uRampMonths   = val(inputs.unitEcon, 'uRampMonths');
  const uVoiceOverage = val(inputs.unitEcon, 'uVoiceOverage');

  const sOwnerPro     = val(inputs.subscriptions, 'sOwnerPro');
  const sOwnerBiz     = val(inputs.subscriptions, 'sOwnerBiz');
  const sTravPlus     = val(inputs.subscriptions, 'sTravPlus');
  const sTravPrem     = val(inputs.subscriptions, 'sTravPrem');

  const bookMult = scenario === 'Conservative' ? val(inputs.scenarios, 'scConBook')
                  : scenario === 'Optimistic'  ? val(inputs.scenarios, 'scOptBook')
                  : val(inputs.scenarios, 'scBaseBook');
  const growMult = scenario === 'Conservative' ? val(inputs.scenarios, 'scConGrow')
                  : scenario === 'Optimistic'  ? val(inputs.scenarios, 'scOptGrow')
                  : val(inputs.scenarios, 'scBaseGrow');

  const blendedRate =
      gMix0 * rate.base
    + gMix1 * (rate.base - rate.proDiscount)
    + gMix2 * (rate.base - rate.businessDiscount);

  const monthly: MonthlyProjection[] = [];
  let prevOwners = 0;
  let prevTravelers = 0;
  let cumulativeCash = gStartCash;

  for (let m = 1; m <= MONTHS; m++) {
    let activeOwners: number;
    let activeTravelers: number;
    if (m < gLaunchMo) {
      activeOwners = 0;
      activeTravelers = 0;
    } else if (m === gLaunchMo) {
      activeOwners = gStartOwn;
      activeTravelers = gStartTrav;
    } else {
      activeOwners = prevOwners * (1 + gOwnGrowth * growMult);
      activeTravelers = prevTravelers * (1 + gTravGrowth * growMult);
    }

    const rampFactor = m >= gLaunchMo ? Math.min(1, (m - gLaunchMo + 1) / (uRampMonths || 1)) : 0;
    const bookings = m >= gLaunchMo ? activeOwners * gBookPerOwn * rampFactor * bookMult : 0;
    const gbv = bookings * pAvgBooking;

    const grossCommission = gbv * blendedRate;
    const stripeFees = (gbv * (1 + blendedRate) * pStripePct + bookings * pStripeFixed) * -1;
    const netCommission = grossCommission + stripeFees;

    const ownerProSubs = activeOwners * gOwn1 * sOwnerPro;
    const ownerBizSubs = activeOwners * gOwn2 * sOwnerBiz;
    const travPlusSubs = activeTravelers * gTrav1 * sTravPlus;
    const travPremSubs = activeTravelers * gTrav2 * sTravPrem;
    const subscriptionRev = ownerProSubs + ownerBizSubs + travPlusSubs + travPremSubs;

    const voiceOverage = m >= gLaunchMo ? activeTravelers * (1 - gTrav2) * uVoiceOverage : 0;

    const totalRevenue = netCommission + subscriptionRev + voiceOverage;

    let totalCostsExpenses = 0;
    for (const e of inputs.expenses) {
      if (e.type === 'Recurring' && e.startMo <= m && e.endMo >= m) {
        const monthlyEq = e.frequency === 'Monthly'    ? e.amount
                        : e.frequency === 'Annual'     ? e.amount / 12
                        : e.frequency === 'Quarterly'  ? e.amount / 3
                        : 0;
        totalCostsExpenses += monthlyEq;
      } else if (e.type === 'One-Time' && e.startMo === m) {
        totalCostsExpenses += e.amount;
      }
    }

    const hireEng = hEngMonth > 0 && m >= hEngMonth ? hEngCost : 0;
    const hireSup = hSupMonth > 0 && m >= hSupMonth ? hSupCost : 0;
    const hireBD  = hBDMonth  > 0 && m >= hBDMonth  ? hBDCost  : 0;
    const hiringCosts = hireEng + hireSup + hireBD;

    const netPnL = totalRevenue - totalCostsExpenses - hiringCosts;

    const fundingInflow = m === gFundMonth ? gFundAmt : 0;
    cumulativeCash += netPnL + fundingInflow;

    monthly.push({
      month: m, activeOwners, activeTravelers, bookings, gbv,
      grossCommission, stripeFees, netCommission,
      subscriptionRev, voiceOverage, totalRevenue,
      totalCostsExpenses, hiringCosts, netPnL, cumulativeCash,
    });

    prevOwners = activeOwners;
    prevTravelers = activeTravelers;
  }

  const totals = {
    totalRevenue24mo:        monthly.reduce((s, r) => s + r.totalRevenue, 0),
    totalCosts24mo:          monthly.reduce((s, r) => s + r.totalCostsExpenses + r.hiringCosts, 0),
    totalProfit24mo:         monthly.reduce((s, r) => s + r.netPnL, 0),
    totalGBV24mo:            monthly.reduce((s, r) => s + r.gbv, 0),
    totalCommissionGross24mo: monthly.reduce((s, r) => s + r.grossCommission, 0),
    totalCommissionNet24mo:  monthly.reduce((s, r) => s + r.netCommission, 0),
    totalStripeFees24mo:     monthly.reduce((s, r) => s + r.stripeFees, 0),
    blendedCommissionRate:   blendedRate,
  };

  const breakEvenMonth = monthly.find((r) => r.cumulativeCash > 0)?.month ?? null;

  const monthlyBurnSteadyState = inputs.expenses
    .filter((e) => e.type === 'Recurring')
    .reduce((sum, e) => {
      const monthlyEq = e.frequency === 'Monthly'    ? e.amount
                       : e.frequency === 'Annual'    ? e.amount / 12
                       : e.frequency === 'Quarterly' ? e.amount / 3
                       : 0;
      return sum + monthlyEq;
    }, 0);

  const oneTimeCostsTotal = inputs.expenses
    .filter((e) => e.type === 'One-Time')
    .reduce((sum, e) => sum + e.amount, 0);

  return { scenario, monthly, totals, breakEvenMonth, monthlyBurnSteadyState, oneTimeCostsTotal };
}
```

- [ ] **Step 1.3.4: Run the test — expect PASS**

```bash
npx vitest run src/lib/financial-model/calc.test.ts
```

Expected: all 4 cases pass.

- [ ] **Step 1.3.5: Verify no other call sites break**

```bash
grep -rn "from '@/lib/financial-model/calc'" src scripts
grep -rn "project(" src scripts | grep -v node_modules | head -20
npx tsc --noEmit
```

Expected: only `FinancialModelDashboard.tsx` and the CLI generator under `scripts/financial-model/` import from calc.ts. `tsc --noEmit` succeeds.

- [ ] **Step 1.3.6: Commit**

```bash
git add src/lib/financial-model/calc.ts src/lib/financial-model/calc.test.ts
git commit -m "refactor(financial-model): project() accepts optional inputs + commissionRate (#550 PR1)

Backwards-compatible: project('Base') with no other args returns identical
numbers (regression test asserts this). Stage 2c builds on this so merged
(baseline ← scenario overrides ← draft) inputs can flow through, and so the
live commission rate from useCommissionRate() can replace build-time fallback."
```

### Task 1.4: `useFinancialModelScenarios` hook

CRUD over `financial_model_scenarios` via React Query. Returns own + shared in one list.

- [ ] **Step 1.4.1: Write the test FIRST**

Path: `src/hooks/useFinancialModelScenarios.test.ts`

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useFinancialModelScenarios } from './useFinancialModelScenarios';

const mockUserId = 'user-rav-1';
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: mockUserId } } }),
    },
    from: () => ({
      select: () => mockSelect(),
      insert: (rows: unknown) => ({ select: () => ({ single: () => mockInsert(rows) }) }),
      update: (rows: unknown) => ({ eq: () => ({ select: () => ({ single: () => mockUpdate(rows) }) }) }),
      delete: () => ({ eq: () => mockDelete() }),
    }),
  },
}));

function wrap(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useFinancialModelScenarios (#550 PR1) @p0', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockSelect.mockReset();
    mockInsert.mockReset();
    mockUpdate.mockReset();
    mockDelete.mockReset();
  });

  it('list returns the rows the RPC returns (own + shared after RLS filtering)', async () => {
    mockSelect.mockResolvedValue({
      data: [
        { id: 's1', owner_id: mockUserId, name: 'Sujit Q3', multiplier: 'Base', overrides: {}, expense_overrides: [], is_shared: false, created_at: 't', updated_at: 't' },
        { id: 's2', owner_id: 'other-user', name: 'Shared plan', multiplier: 'Optimistic', overrides: { gOwnGrowth: 0.25 }, expense_overrides: [], is_shared: true, created_at: 't', updated_at: 't' },
      ],
      error: null,
    });

    const { result } = renderHook(() => useFinancialModelScenarios(), { wrapper: wrap(queryClient) });
    await waitFor(() => expect(result.current.scenarios).toHaveLength(2));
    expect(result.current.scenarios[0].id).toBe('s1');
    expect(result.current.scenarios[1].is_shared).toBe(true);
  });

  it('create returns the inserted row and invalidates the list', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    mockInsert.mockResolvedValue({
      data: { id: 'new-1', owner_id: mockUserId, name: 'New', multiplier: 'Base', overrides: {}, expense_overrides: [], is_shared: false, created_at: 't', updated_at: 't' },
      error: null,
    });

    const { result } = renderHook(() => useFinancialModelScenarios(), { wrapper: wrap(queryClient) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const inserted = await act(async () =>
      result.current.create({ name: 'New', multiplier: 'Base', overrides: {}, expense_overrides: [], is_shared: false })
    );
    expect(inserted?.id).toBe('new-1');
  });

  it('update sends partial fields', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    mockUpdate.mockResolvedValue({
      data: { id: 's1', owner_id: mockUserId, name: 'renamed', multiplier: 'Base', overrides: {}, expense_overrides: [], is_shared: true, created_at: 't', updated_at: 't' },
      error: null,
    });

    const { result } = renderHook(() => useFinancialModelScenarios(), { wrapper: wrap(queryClient) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const updated = await act(async () => result.current.update('s1', { name: 'renamed', is_shared: true }));
    expect(updated?.name).toBe('renamed');
  });

  it('delete returns success', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    mockDelete.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useFinancialModelScenarios(), { wrapper: wrap(queryClient) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const ok = await act(async () => result.current.remove('s1'));
    expect(ok).toBe(true);
  });

  it('select returning an error surfaces empty list + error', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'rls', code: '42501' } });
    const { result } = renderHook(() => useFinancialModelScenarios(), { wrapper: wrap(queryClient) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.scenarios).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });
});
```

Note: the test file uses JSX; rename to `.tsx` if your `tsconfig` requires it. RAV's existing test convention is `.ts` for non-component tests + `.tsx` for component tests. The hook test uses a tiny JSX wrapper — file extension `.tsx`:

```bash
mv src/hooks/useFinancialModelScenarios.test.ts src/hooks/useFinancialModelScenarios.test.tsx
```

(If you wrote it as `.tsx` to begin with, skip the rename.)

- [ ] **Step 1.4.2: Run the test — expect FAIL**

```bash
npx vitest run src/hooks/useFinancialModelScenarios.test.tsx
```

Expected: "Cannot find module './useFinancialModelScenarios'".

- [ ] **Step 1.4.3: Implement the hook**

Path: `src/hooks/useFinancialModelScenarios.ts`

```ts
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface FinancialModelScenario {
  id: string;
  owner_id: string;
  name: string;
  multiplier: 'Conservative' | 'Base' | 'Optimistic';
  overrides: Record<string, number | string>;
  expense_overrides: ExpenseOverride[];
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseOverride {
  category: string;
  item: string;
  amount?: number;
}

export interface ScenarioInsert {
  name: string;
  multiplier: 'Conservative' | 'Base' | 'Optimistic';
  overrides: Record<string, number | string>;
  expense_overrides: ExpenseOverride[];
  is_shared: boolean;
}

export interface ScenarioUpdate {
  name?: string;
  multiplier?: 'Conservative' | 'Base' | 'Optimistic';
  overrides?: Record<string, number | string>;
  expense_overrides?: ExpenseOverride[];
  is_shared?: boolean;
}

const QUERY_KEY = ['financial-model-scenarios'] as const;
const TABLE = 'financial_model_scenarios';

export function useFinancialModelScenarios() {
  const qc = useQueryClient();

  const list = useQuery<FinancialModelScenario[], Error>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as FinancialModelScenario[];
    },
    staleTime: 30_000,
  });

  const createMut = useMutation<FinancialModelScenario | null, Error, ScenarioInsert>({
    mutationFn: async (insert) => {
      const { data: userResp } = await supabase.auth.getUser();
      const userId = userResp.user?.id;
      if (!userId) throw new Error('not authenticated');
      const { data, error } = await supabase
        .from(TABLE)
        .insert({ ...insert, owner_id: userId })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as FinancialModelScenario;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEY }); },
  });

  const updateMut = useMutation<
    FinancialModelScenario | null,
    Error,
    { id: string; patch: ScenarioUpdate }
  >({
    mutationFn: async ({ id, patch }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as FinancialModelScenario;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEY }); },
  });

  const deleteMut = useMutation<boolean, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEY }); },
  });

  return {
    scenarios: list.data ?? [],
    isLoading: list.isLoading,
    error: list.error,
    create: (insert: ScenarioInsert) => createMut.mutateAsync(insert),
    update: (id: string, patch: ScenarioUpdate) => updateMut.mutateAsync({ id, patch }),
    remove: (id: string) => deleteMut.mutateAsync(id),
  };
}
```

- [ ] **Step 1.4.4: Run test — expect PASS**

```bash
npx vitest run src/hooks/useFinancialModelScenarios.test.tsx
```

Expected: all 5 cases pass.

- [ ] **Step 1.4.5: Commit**

```bash
git add src/hooks/useFinancialModelScenarios.ts src/hooks/useFinancialModelScenarios.test.tsx
git commit -m "feat(financial-model): useFinancialModelScenarios CRUD hook (#550 PR1)"
```

### Task 1.5: `useActiveScenario` hook (localStorage-backed)

- [ ] **Step 1.5.1: Write the test FIRST**

Path: `src/hooks/useActiveScenario.test.ts`

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActiveScenario, ACTIVE_KEY } from './useActiveScenario';
import { DEFAULT_SCENARIO_ID } from '@/lib/financial-model/system-scenarios';

beforeEach(() => {
  localStorage.clear();
});

describe('useActiveScenario (#550 PR1) @p0', () => {
  it('defaults to system Base when no localStorage value exists', () => {
    const { result } = renderHook(() => useActiveScenario());
    expect(result.current.activeId).toBe(DEFAULT_SCENARIO_ID);
    expect(result.current.activeId).toBe('system:base');
  });

  it('persists selection to localStorage', () => {
    const { result } = renderHook(() => useActiveScenario());
    act(() => { result.current.setActiveId('uuid-123'); });
    expect(localStorage.getItem(ACTIVE_KEY)).toBe('uuid-123');
  });

  it('restores selection on remount', () => {
    localStorage.setItem(ACTIVE_KEY, 'uuid-restored');
    const { result } = renderHook(() => useActiveScenario());
    expect(result.current.activeId).toBe('uuid-restored');
  });

  it('setActiveId(null) clears storage and resets to default', () => {
    localStorage.setItem(ACTIVE_KEY, 'uuid-x');
    const { result } = renderHook(() => useActiveScenario());
    act(() => { result.current.setActiveId(null); });
    expect(result.current.activeId).toBe(DEFAULT_SCENARIO_ID);
    expect(localStorage.getItem(ACTIVE_KEY)).toBeNull();
  });

  it('handles localStorage throw on read (privacy mode)', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    const { result } = renderHook(() => useActiveScenario());
    expect(result.current.activeId).toBe(DEFAULT_SCENARIO_ID);
    spy.mockRestore();
  });
});
```

- [ ] **Step 1.5.2: Run — expect FAIL**

```bash
npx vitest run src/hooks/useActiveScenario.test.ts
```

- [ ] **Step 1.5.3: Implement**

Path: `src/hooks/useActiveScenario.ts`

```ts
import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SCENARIO_ID } from '@/lib/financial-model/system-scenarios';

export const ACTIVE_KEY = 'fms-active-scenario';

function readStored(): string {
  try {
    const v = localStorage.getItem(ACTIVE_KEY);
    return v && v.length > 0 ? v : DEFAULT_SCENARIO_ID;
  } catch {
    return DEFAULT_SCENARIO_ID;
  }
}

export function useActiveScenario() {
  const [activeId, setActiveIdState] = useState<string>(() => readStored());

  // re-read on mount in case SSR-initialised default differs
  useEffect(() => {
    const v = readStored();
    if (v !== activeId) setActiveIdState(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setActiveId = useCallback((id: string | null) => {
    try {
      if (id === null || id === '') {
        localStorage.removeItem(ACTIVE_KEY);
        setActiveIdState(DEFAULT_SCENARIO_ID);
      } else {
        localStorage.setItem(ACTIVE_KEY, id);
        setActiveIdState(id);
      }
    } catch {
      // localStorage denied — still update in-memory state
      setActiveIdState(id ?? DEFAULT_SCENARIO_ID);
    }
  }, []);

  return { activeId, setActiveId };
}
```

- [ ] **Step 1.5.4: Run — expect PASS**

```bash
npx vitest run src/hooks/useActiveScenario.test.ts
```

- [ ] **Step 1.5.5: Commit**

```bash
git add src/hooks/useActiveScenario.ts src/hooks/useActiveScenario.test.ts
git commit -m "feat(financial-model): useActiveScenario hook (localStorage-backed) (#550 PR1)"
```

### Task 1.6: Wire `useCommissionRate` into `FinancialModelDashboard.tsx`

- [ ] **Step 1.6.1: Modify the dashboard to read commission live**

Edit `src/pages/FinancialModelDashboard.tsx`:

1. Add import:

```ts
import { useEffectiveCommissionRate, useCommissionRate } from '@/hooks/useCommissionRate';
```

2. Replace the `project(scenario)` call:

```ts
const { data: rate } = useCommissionRate();
const result = project(scenario, undefined, rate);
```

3. In the Commission Rates card, switch the `EFFECTIVE_RATES` reads to use the live rate. Replace the `<RateTile ... />` block with:

```tsx
{rate ? (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <RateTile label="Free Owner" rate={rate.base} sub={`Base rate, no discount`} />
    <RateTile label="Pro Owner" rate={Math.max(0, rate.base - rate.proDiscount)} sub={`Base ${formatRate(rate.base)} − ${formatRate(rate.proDiscount)} Pro discount`} />
    <RateTile label="Business Owner" rate={Math.max(0, rate.base - rate.businessDiscount)} sub={`Base ${formatRate(rate.base)} − ${formatRate(rate.businessDiscount)} Business discount`} />
  </div>
) : null}
```

4. Update the "To change rates" caption:

```tsx
<div className="mt-3 text-xs text-slate-500">
  Rates are live from <code className="rounded bg-slate-900 px-1 py-0.5">system_settings.platform_commission_rate</code> (per DEC-043). Edit via System Settings — admin audit log captures changes.
</div>
```

- [ ] **Step 1.6.2: Run type check + tests**

```bash
npx tsc --noEmit
npx vitest run src/lib/financial-model
```

Expected: tsc clean, all calc tests still pass.

- [ ] **Step 1.6.3: Smoke-test the page**

```bash
npm run dev
```

Open http://localhost:8080/executive-dashboard/financial-model — KPIs and trajectory render. Commission rate tiles show the live DEV values from `system_settings`. Toggle scenarios — numbers change. No regressions vs. before.

Stop the dev server with Ctrl-C when done.

- [ ] **Step 1.6.4: Commit**

```bash
git add src/pages/FinancialModelDashboard.tsx
git commit -m "feat(financial-model): live commission DB read on /financial-model (#550 PR1)

Replaces build-time DEFAULT_COMMISSION fallback with useCommissionRate()
flowing into project(). Closes the small drift surface between the
financial model and live pricing. Per DEC-043."
```

### Task 1.7: Open PR1

- [ ] **Step 1.7.1: Push branch**

```bash
git push origin feature/stage-2c-financial-model
```

- [ ] **Step 1.7.2: Open PR to feature branch base — but PR1 lands on `dev` (feature branch is dev)**

Per the design: each PR targets `dev` directly via the feature branch. The 5 PRs accumulate on the feature branch, then one release PR `dev → main` ships the lot.

Open PR `feature/stage-2c-financial-model → dev`:

```bash
gh pr create --repo rent-a-vacation/rav-website --base dev --head feature/stage-2c-financial-model --title "feat(financial-model): #550 PR1 — schema + hooks + commission DB switch" --body "$(cat <<'EOF'
## Summary

- Migration 081: `financial_model_scenarios` table with RLS gated to RAV team (`is_rav_team`). Read-only share semantics (author is sole editor; ownership reassignment blocked by RLS WITH CHECK).
- New `system-scenarios.ts` constants (virtual Base/Conservative/Optimistic — NOT seeded as DB rows).
- New `useFinancialModelScenarios` hook (list/create/update/delete with React Query optimistic invalidation).
- New `useActiveScenario` hook (localStorage-backed selection).
- `calc.ts` refactored to accept optional `inputs: ModelInputs` + `commissionRate: CommissionRate` args. Backwards-compatible (regression test covers).
- `FinancialModelDashboard.tsx` now reads commission live from DB via `useCommissionRate()` — closes the drift surface where financial-model used build-time DEFAULT_COMMISSION and live pricing used DB.

**No visible UI change.** Scenario picker still shows the Conservative/Base/Optimistic toggle from Stage 2a. Editable inputs + drift indicator land in subsequent PRs.

## Spec
- [`docs/superpowers/specs/2026-05-20-financial-model-stage-2c-design.md`](../blob/feature/stage-2c-financial-model/docs/superpowers/specs/2026-05-20-financial-model-stage-2c-design.md) @ `8d0c1f6`
- Sequencing decision: brainstorm Q5 → 5 vertical PRs.

## Test plan
- [x] Migration 081 applied to DEV
- [x] `useFinancialModelScenarios` — list, create, update, delete, RLS error path
- [x] `useActiveScenario` — default, persist, restore, clear, privacy-mode
- [x] `calc.ts` regression: `project('Base')` returns identical numbers with vs. without inputs arg
- [x] `calc.ts` commission override applies
- [x] `tsc --noEmit` clean
- [x] Smoke test on `/executive-dashboard/financial-model` — KPIs render, scenarios toggle works, commission tiles show live DEV values

## Migration deploy plan
- DEV: applied in this PR
- PROD: held until PR5 release PR (`dev → main`)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 1.7.3: After CI passes, await explicit user approval before merging**

Per RAV `/sdlc` Phase 5: "Wait for 'go ahead' / 'merge it' / 'ship it' / 'release it' before running `gh pr merge`. Green CI is necessary but NOT sufficient. Approval is per-merge."

Once approved:

```bash
gh pr merge <pr-number> --repo rent-a-vacation/rav-website --merge
git checkout feature/stage-2c-financial-model
git pull --ff-only origin feature/stage-2c-financial-model
```

---

## PR2 — Picker + accordions (read-only)

Replace the 3-toggle with `ScenarioPicker`. Render 8 + 1 accordion sections below the trajectory table — collapsed by default, read-only display of each input. No editing yet; KPIs/table recompute only when the picker switches between system scenarios.

**Files:**
- Create: `src/components/financial-model/ScenarioPicker.tsx`
- Create: `src/components/financial-model/ScenarioPicker.test.tsx`
- Create: `src/components/financial-model/InputSectionAccordion.tsx`
- Create: `src/components/financial-model/InputSectionAccordion.test.tsx`
- Create: `src/components/financial-model/ReadOnlyInputRow.tsx`
- Create: `src/components/financial-model/ExpenseSection.tsx`
- Create: `src/components/financial-model/sectionMeta.ts` (titles, helper for keys-by-section)
- Modify: `src/pages/FinancialModelDashboard.tsx` (swap picker + add accordions)

### Task 2.1: Section metadata

- [ ] **Step 2.1.1: Create `sectionMeta.ts`**

Path: `src/components/financial-model/sectionMeta.ts`

```ts
import type { InputRow } from '@/lib/financial-model/data';
import {
  PLATFORM, SUBSCRIPTIONS, GROWTH, SCENARIOS, HORIZON,
  RESERVES, HIRING, UNIT_ECON,
} from '@/lib/financial-model/data';

export interface InputSectionMeta {
  id: 'platform' | 'subscriptions' | 'growth' | 'scenarios' | 'horizon' | 'reserves' | 'hiring' | 'unitEcon';
  title: string;
  description: string;
  baseline: InputRow[];
  /** Category-A (live-config) rows that should render read-only with a System Settings link. */
  liveConfigKeys?: string[];
}

export const INPUT_SECTIONS: InputSectionMeta[] = [
  {
    id: 'platform',
    title: 'Platform Parameters',
    description: 'Booking economics + Stripe fees. Commission rate is live from System Settings.',
    baseline: PLATFORM,
    liveConfigKeys: ['pCommBase', 'pProDisc', 'pBizDisc'],
  },
  { id: 'subscriptions', title: 'Subscription Pricing',  description: 'Owner + traveler monthly tier prices.', baseline: SUBSCRIPTIONS },
  { id: 'growth',        title: 'Growth Assumptions',    description: 'Launch, starting counts, MoM growth, booking mix.', baseline: GROWTH },
  { id: 'scenarios',     title: 'Scenario Multipliers',  description: 'Conservative/Base/Optimistic booking & growth multipliers.', baseline: SCENARIOS },
  { id: 'horizon',       title: 'Planning Horizon',      description: 'Model length + Month 1 label.', baseline: HORIZON },
  { id: 'reserves',      title: 'Tax, Cash & Reserves',  description: 'Starting cash, funding inflow, founder comp.', baseline: RESERVES },
  { id: 'hiring',        title: 'Hiring Plan',           description: 'Engineer / support / BD hire months + burdened cost.', baseline: HIRING },
  { id: 'unitEcon',      title: 'Unit Economics',        description: 'Cohort ramp, lifetimes, voice overage.', baseline: UNIT_ECON },
];

/** All editable Category-B input keys across the 8 sections (excludes liveConfigKeys). */
export function allEditableKeys(): Set<string> {
  const out = new Set<string>();
  for (const section of INPUT_SECTIONS) {
    const live = new Set(section.liveConfigKeys ?? []);
    for (const row of section.baseline) {
      if (!live.has(row.name)) out.add(row.name);
    }
  }
  return out;
}

/** All input keys belonging to a section (used for "Reset section" + dirty-count). */
export function sectionKeys(sectionId: InputSectionMeta['id']): string[] {
  const section = INPUT_SECTIONS.find((s) => s.id === sectionId);
  return section ? section.baseline.map((r) => r.name) : [];
}
```

- [ ] **Step 2.1.2: Commit**

```bash
git add src/components/financial-model/sectionMeta.ts
git commit -m "feat(financial-model): section metadata for accordions (#550 PR2)"
```

### Task 2.2: `ReadOnlyInputRow` component

- [ ] **Step 2.2.1: Create it**

Path: `src/components/financial-model/ReadOnlyInputRow.tsx`

```tsx
import { Link } from 'react-router-dom';
import type { InputRow } from '@/lib/financial-model/data';

interface Props {
  row: InputRow;
  liveConfig?: boolean;
}

function formatValue(row: InputRow): string {
  if (typeof row.value !== 'number') return String(row.value);
  if (row.fmt.includes('%')) return `${(row.value * 100).toFixed(2)}%`;
  if (row.fmt.startsWith('$')) return `$${row.value.toLocaleString('en-US')}`;
  if (row.fmt.includes('"x"')) return `${row.value.toFixed(2)}x`;
  return row.value.toString();
}

export function ReadOnlyInputRow({ row, liveConfig }: Props) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 items-center py-1.5 text-sm">
      <div className="flex items-center gap-2 text-slate-300">
        <span>{row.label}</span>
        {liveConfig ? (
          <Link
            to="/admin/system-settings"
            className="text-[10px] uppercase tracking-wider text-teal-400 hover:text-teal-300"
            title="Live config — managed by admin"
          >
            Live · System Settings
          </Link>
        ) : null}
      </div>
      <div className="font-mono tabular-nums text-slate-100">{formatValue(row)}</div>
    </div>
  );
}
```

- [ ] **Step 2.2.2: Commit**

```bash
git add src/components/financial-model/ReadOnlyInputRow.tsx
git commit -m "feat(financial-model): ReadOnlyInputRow component (#550 PR2)"
```

### Task 2.3: `InputSectionAccordion`

- [ ] **Step 2.3.1: Write the test FIRST**

Path: `src/components/financial-model/InputSectionAccordion.test.tsx`

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { InputSectionAccordion } from './InputSectionAccordion';
import { INPUT_SECTIONS } from './sectionMeta';

const growth = INPUT_SECTIONS.find((s) => s.id === 'growth')!;

function renderInRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('InputSectionAccordion (#550 PR2)', () => {
  it('renders title + description with rows collapsed by default', () => {
    renderInRouter(
      <InputSectionAccordion section={growth} dirtyKeys={new Set()}>
        {growth.baseline.map((row) => <div key={row.name}>{row.label}</div>)}
      </InputSectionAccordion>
    );
    expect(screen.getByText(growth.title)).toBeInTheDocument();
    expect(screen.queryByText('Launch Month (1 = first model month)')).not.toBeVisible();
  });

  it('expands rows when clicked', () => {
    renderInRouter(
      <InputSectionAccordion section={growth} dirtyKeys={new Set()}>
        {growth.baseline.map((row) => <div key={row.name}>{row.label}</div>)}
      </InputSectionAccordion>
    );
    fireEvent.click(screen.getByText(growth.title));
    expect(screen.getByText('Launch Month (1 = first model month)')).toBeVisible();
  });

  it('shows dirty count when dirtyKeys intersects section keys', () => {
    renderInRouter(
      <InputSectionAccordion
        section={growth}
        dirtyKeys={new Set(['gOwnGrowth', 'gMix0', 'unrelated'])}
      >
        <div />
      </InputSectionAccordion>
    );
    expect(screen.getByText(/2 differ/i)).toBeInTheDocument();
  });

  it('does not show "Reset section" when no dirty keys', () => {
    renderInRouter(
      <InputSectionAccordion section={growth} dirtyKeys={new Set()}>
        <div />
      </InputSectionAccordion>
    );
    expect(screen.queryByRole('button', { name: /reset section/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2.3.2: Run — expect FAIL**

```bash
npx vitest run src/components/financial-model/InputSectionAccordion.test.tsx
```

- [ ] **Step 2.3.3: Implement**

Path: `src/components/financial-model/InputSectionAccordion.tsx`

```tsx
import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InputSectionMeta } from './sectionMeta';
import { sectionKeys } from './sectionMeta';

interface Props {
  section: InputSectionMeta;
  dirtyKeys: Set<string>;
  onResetSection?: () => void;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function InputSectionAccordion({ section, dirtyKeys, onResetSection, defaultOpen, children }: Props) {
  const [open, setOpen] = useState(!!defaultOpen);
  const keys = sectionKeys(section.id);
  const sectionDirty = keys.filter((k) => dirtyKeys.has(k)).length;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/30 mb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-800/50 rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          <span className="font-medium text-slate-100">{section.title}</span>
          {sectionDirty > 0 ? (
            <span className="text-xs text-amber-400">{sectionDirty} differ ●</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {sectionDirty > 0 && onResetSection ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onResetSection(); }}
            >
              Reset section
            </Button>
          ) : null}
        </div>
      </button>
      {open ? (
        <div className="px-4 pb-4 pt-1 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-3">{section.description}</p>
          <div hidden={false}>{children}</div>
        </div>
      ) : (
        // Render children but hidden via aria; tests check visibility via toBeVisible()
        <div style={{ display: 'none' }} aria-hidden>{children}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 2.3.4: Run — expect PASS**

```bash
npx vitest run src/components/financial-model/InputSectionAccordion.test.tsx
```

- [ ] **Step 2.3.5: Commit**

```bash
git add src/components/financial-model/InputSectionAccordion.tsx src/components/financial-model/InputSectionAccordion.test.tsx
git commit -m "feat(financial-model): InputSectionAccordion (#550 PR2)"
```

### Task 2.4: `ScenarioPicker`

- [ ] **Step 2.4.1: Write the test FIRST**

Path: `src/components/financial-model/ScenarioPicker.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScenarioPicker } from './ScenarioPicker';

const ownScenarios = [
  { id: 'uuid-own-1', owner_id: 'me', name: 'Sujit Q3 plan', multiplier: 'Base' as const, overrides: {}, expense_overrides: [], is_shared: false, created_at: 't', updated_at: 't' },
];
const sharedScenarios = [
  { id: 'uuid-shared-1', owner_id: 'someone', name: 'Team plan v2', multiplier: 'Optimistic' as const, overrides: {}, expense_overrides: [], is_shared: true, created_at: 't', updated_at: 't' },
];

describe('ScenarioPicker (#550 PR2) @p0', () => {
  it('groups system, own, and shared scenarios', () => {
    render(
      <ScenarioPicker
        scenarios={[...ownScenarios, ...sharedScenarios]}
        currentUserId="me"
        activeId="system:base"
        onChange={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Base/i }));
    expect(screen.getByText(/System/i)).toBeInTheDocument();
    expect(screen.getByText(/Mine/i)).toBeInTheDocument();
    expect(screen.getByText(/Shared/i)).toBeInTheDocument();
    expect(screen.getByText('Sujit Q3 plan')).toBeInTheDocument();
    expect(screen.getByText('Team plan v2')).toBeInTheDocument();
  });

  it('calls onChange with selected id', () => {
    const onChange = vi.fn();
    render(
      <ScenarioPicker
        scenarios={ownScenarios}
        currentUserId="me"
        activeId="system:base"
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Base/i }));
    fireEvent.click(screen.getByText('Sujit Q3 plan'));
    expect(onChange).toHaveBeenCalledWith('uuid-own-1');
  });

  it('shows "[shared]" badge on shared scenarios', () => {
    render(
      <ScenarioPicker
        scenarios={sharedScenarios}
        currentUserId="me"
        activeId="system:base"
        onChange={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Base/i }));
    expect(screen.getByText(/shared/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2.4.2: Run — expect FAIL**

```bash
npx vitest run src/components/financial-model/ScenarioPicker.test.tsx
```

- [ ] **Step 2.4.3: Implement**

Path: `src/components/financial-model/ScenarioPicker.tsx`

```tsx
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SYSTEM_SCENARIOS, isSystemScenarioId, findSystemScenario } from '@/lib/financial-model/system-scenarios';
import type { FinancialModelScenario } from '@/hooks/useFinancialModelScenarios';

interface Props {
  scenarios: FinancialModelScenario[];
  currentUserId: string | null | undefined;
  activeId: string;
  onChange: (id: string) => void;
}

export function ScenarioPicker({ scenarios, currentUserId, activeId, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const ownScenarios = scenarios.filter((s) => s.owner_id === currentUserId);
  const sharedScenarios = scenarios.filter((s) => s.owner_id !== currentUserId && s.is_shared);

  const activeLabel = isSystemScenarioId(activeId)
    ? findSystemScenario(activeId)?.name ?? 'Base'
    : scenarios.find((s) => s.id === activeId)?.name ?? 'Base';

  const pick = (id: string) => {
    setOpen(false);
    onChange(id);
  };

  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setOpen((v) => !v)} aria-haspopup="listbox">
        Scenario: <span className="ml-2 font-semibold">{activeLabel}</span>
        <ChevronDown className="ml-2 h-4 w-4" />
      </Button>
      {open ? (
        <div role="listbox" className="absolute z-30 top-full mt-1 left-0 w-72 rounded-md border border-slate-700 bg-slate-900 shadow-lg py-2">
          <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-500">System</div>
          {SYSTEM_SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pick(s.id)}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-800 ${activeId === s.id ? 'bg-slate-800 text-teal-300' : 'text-slate-200'}`}
            >
              {s.name}
            </button>
          ))}
          {ownScenarios.length > 0 ? (
            <>
              <div className="px-3 py-1 mt-1 text-[10px] uppercase tracking-wider text-slate-500 border-t border-slate-800">Mine</div>
              {ownScenarios.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pick(s.id)}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-800 ${activeId === s.id ? 'bg-slate-800 text-teal-300' : 'text-slate-200'}`}
                >
                  {s.name}
                </button>
              ))}
            </>
          ) : null}
          {sharedScenarios.length > 0 ? (
            <>
              <div className="px-3 py-1 mt-1 text-[10px] uppercase tracking-wider text-slate-500 border-t border-slate-800">Shared</div>
              {sharedScenarios.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pick(s.id)}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-800 ${activeId === s.id ? 'bg-slate-800 text-teal-300' : 'text-slate-200'}`}
                >
                  <span className="flex items-center justify-between">
                    <span>{s.name}</span>
                    <span className="text-[10px] uppercase text-coral-400">shared</span>
                  </span>
                </button>
              ))}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2.4.4: Run — expect PASS**

```bash
npx vitest run src/components/financial-model/ScenarioPicker.test.tsx
```

- [ ] **Step 2.4.5: Commit**

```bash
git add src/components/financial-model/ScenarioPicker.tsx src/components/financial-model/ScenarioPicker.test.tsx
git commit -m "feat(financial-model): ScenarioPicker (#550 PR2)"
```

### Task 2.5: `ExpenseSection` (read-only Stage 2c PR2 — editing comes in PR3)

- [ ] **Step 2.5.1: Create read-only expense section**

Path: `src/components/financial-model/ExpenseSection.tsx`

```tsx
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { EXPENSES } from '@/lib/financial-model/data';

interface Props {
  /** When set, indicates which (category, item) pairs are dirty for the section dot count. */
  dirtyExpenseKeys?: Set<string>;
}

export function ExpenseSection({ dirtyExpenseKeys }: Props) {
  const [open, setOpen] = useState(false);
  const dirtyCount = dirtyExpenseKeys?.size ?? 0;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/30 mb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-800/50 rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          <span className="font-medium text-slate-100">Expenses</span>
          {dirtyCount > 0 ? <span className="text-xs text-amber-400">{dirtyCount} differ ●</span> : null}
        </div>
      </button>
      {open ? (
        <div className="px-4 pb-4 pt-1 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-3">{EXPENSES.length} line items across {new Set(EXPENSES.map((e) => e.category)).size} categories. Editing of expense amounts ships in PR3.</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400">
                <th className="text-left py-1">Category</th>
                <th className="text-left py-1">Item</th>
                <th className="text-right py-1">Amount</th>
                <th className="text-left py-1 pl-3">Freq</th>
                <th className="text-right py-1">Start</th>
                <th className="text-right py-1">End</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {EXPENSES.map((e) => (
                <tr key={`${e.category}|${e.item}`} className="border-t border-slate-800">
                  <td className="py-1 pr-2 text-slate-400">{e.category}</td>
                  <td className="py-1 pr-2">{e.item}</td>
                  <td className="py-1 text-right tabular-nums">${e.amount.toLocaleString()}</td>
                  <td className="py-1 pl-3">{e.frequency}</td>
                  <td className="py-1 text-right tabular-nums">{e.startMo}</td>
                  <td className="py-1 text-right tabular-nums">{e.endMo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2.5.2: Commit**

```bash
git add src/components/financial-model/ExpenseSection.tsx
git commit -m "feat(financial-model): ExpenseSection read-only display (#550 PR2)"
```

### Task 2.6: Wire it all into `FinancialModelDashboard.tsx`

- [ ] **Step 2.6.1: Replace the Stage-2a 3-toggle with `ScenarioPicker`**

In `src/pages/FinancialModelDashboard.tsx`:

1. Add imports:

```ts
import { ScenarioPicker } from '@/components/financial-model/ScenarioPicker';
import { InputSectionAccordion } from '@/components/financial-model/InputSectionAccordion';
import { ReadOnlyInputRow } from '@/components/financial-model/ReadOnlyInputRow';
import { ExpenseSection } from '@/components/financial-model/ExpenseSection';
import { INPUT_SECTIONS } from '@/components/financial-model/sectionMeta';
import { useFinancialModelScenarios } from '@/hooks/useFinancialModelScenarios';
import { useActiveScenario } from '@/hooks/useActiveScenario';
import { isSystemScenarioId, findSystemScenario } from '@/lib/financial-model/system-scenarios';
```

2. In the component body, replace `const [scenario, setScenario] = useState<Scenario>('Base');` with:

```ts
const { activeId, setActiveId } = useActiveScenario();
const { scenarios } = useFinancialModelScenarios();
const active = isSystemScenarioId(activeId)
  ? findSystemScenario(activeId)
  : scenarios.find((s) => s.id === activeId);
const scenario: Scenario = (active?.multiplier ?? 'Base') as Scenario;
```

3. Replace the 3-toggle block with the picker:

```tsx
<ScenarioPicker
  scenarios={scenarios}
  currentUserId={user?.id ?? null}
  activeId={activeId}
  onChange={setActiveId}
/>
```

4. Add accordion sections below the existing trajectory table (before the `Excel export` card):

```tsx
{/* Editable inputs (PR2 = read-only; PR3 makes them editable) */}
<div className="mt-8">
  <h2 className="text-lg font-semibold text-white mb-4">Model Inputs</h2>
  {INPUT_SECTIONS.map((section) => (
    <InputSectionAccordion key={section.id} section={section} dirtyKeys={new Set()}>
      {section.baseline.map((row) => (
        <ReadOnlyInputRow
          key={row.name}
          row={row}
          liveConfig={section.liveConfigKeys?.includes(row.name)}
        />
      ))}
    </InputSectionAccordion>
  ))}
  <ExpenseSection />
</div>
```

- [ ] **Step 2.6.2: Type check + smoke test**

```bash
npx tsc --noEmit
npm run dev
```

Open the page. Verify: picker dropdown shows "System" group with Base/Conservative/Optimistic. KPIs + trajectory still recompute when you pick a system scenario. Below trajectory, 9 collapsible sections render (8 input + 1 expense). Click each header — rows expand/collapse smoothly. All values displayed read-only. Live commission rows in the Platform section show a "Live · System Settings" link.

Ctrl-C dev server.

- [ ] **Step 2.6.3: Commit**

```bash
git add src/pages/FinancialModelDashboard.tsx
git commit -m "feat(financial-model): wire ScenarioPicker + 9 accordion sections (#550 PR2)

Stage-2a 3-toggle replaced with unified scenario picker. Read-only inputs
rendered below the trajectory table in collapsible accordions per section.
Editable inputs + drift indicator land in PR3+PR4."
```

### Task 2.7: Open PR2

- [ ] **Step 2.7.1: Push + open**

```bash
git push origin feature/stage-2c-financial-model
gh pr create --repo rent-a-vacation/rav-website --base dev --head feature/stage-2c-financial-model --title "feat(financial-model): #550 PR2 — picker + read-only accordions" --body "Replaces Stage-2a 3-toggle with unified ScenarioPicker (system + own + shared in one dropdown). Adds 9 read-only accordion sections below trajectory. No edits yet — editable inputs in PR3.

Test plan:
- [x] tsc clean
- [x] All new tests pass
- [x] Smoke test: picker switches scenarios, accordions expand, live commission link works"
```

- [ ] **Step 2.7.2: Await user approval before merge**

```bash
gh pr merge <number> --repo rent-a-vacation/rav-website --merge
```

---

## PR3 — Editable inputs + draft + merge logic + per-input dot

Drop in `EditableInputRow`, `useScenarioDraft`, `useActiveScenarioInputs`. Add `overrides.ts` pure-merge module. Wire dirty-key memo into the dashboard. EXPENSES editor (amount column only).

**Files:**
- Create: `src/lib/financial-model/overrides.ts`
- Create: `src/lib/financial-model/overrides.test.ts`
- Create: `src/hooks/useScenarioDraft.ts`
- Create: `src/hooks/useScenarioDraft.test.ts`
- Create: `src/hooks/useActiveScenarioInputs.ts`
- Create: `src/hooks/useActiveScenarioInputs.test.tsx`
- Create: `src/components/financial-model/EditableInputRow.tsx`
- Create: `src/components/financial-model/EditableInputRow.test.tsx`
- Modify: `src/components/financial-model/ExpenseSection.tsx` (add editable amount column)
- Modify: `src/pages/FinancialModelDashboard.tsx` (swap ReadOnly→Editable, pass dirtyKeys)

### Task 3.1: `overrides.ts` pure-merge module

- [ ] **Step 3.1.1: Write the test FIRST**

Path: `src/lib/financial-model/overrides.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { applyOverrides, mergeOverrideLayers, computeDirtyKeys } from './overrides';
import { PLATFORM, GROWTH, type InputRow } from './data';

describe('applyOverrides (#550 PR3) @p0', () => {
  it('returns baseline untouched when overrides empty', () => {
    const result = applyOverrides(GROWTH, {});
    expect(result).toHaveLength(GROWTH.length);
    GROWTH.forEach((row, i) => expect(result[i].value).toBe(row.value));
  });

  it('replaces only matching keys (sparse)', () => {
    const result = applyOverrides(GROWTH, { gOwnGrowth: 0.50 });
    const baseline = GROWTH.find((r) => r.name === 'gOwnGrowth')!.value;
    const overridden = result.find((r) => r.name === 'gOwnGrowth')!.value;
    expect(baseline).not.toBe(overridden);
    expect(overridden).toBe(0.50);
    // other keys unchanged
    expect(result.find((r) => r.name === 'gMix0')!.value).toBe(GROWTH.find((r) => r.name === 'gMix0')!.value);
  });

  it('preserves row order, fmt, name, note metadata', () => {
    const result = applyOverrides(GROWTH, { gOwnGrowth: 0.50 });
    GROWTH.forEach((row, i) => {
      expect(result[i].name).toBe(row.name);
      expect(result[i].fmt).toBe(row.fmt);
      expect(result[i].label).toBe(row.label);
      expect(result[i].note).toBe(row.note);
    });
  });

  it('does not mutate the input baseline array', () => {
    const snapshot = GROWTH.map((r) => ({ ...r }));
    applyOverrides(GROWTH, { gOwnGrowth: 0.99 });
    GROWTH.forEach((row, i) => expect(row.value).toBe(snapshot[i].value));
  });

  it('ignores keys not present in baseline', () => {
    const result = applyOverrides(GROWTH, { madeUpKey: 9999 });
    expect(result).toHaveLength(GROWTH.length);
    GROWTH.forEach((row, i) => expect(result[i].value).toBe(row.value));
  });
});

describe('mergeOverrideLayers (#550 PR3) @p0', () => {
  it('returns empty when both layers empty', () => {
    expect(mergeOverrideLayers({}, null)).toEqual({});
  });
  it('scenario overrides win when no draft', () => {
    expect(mergeOverrideLayers({ a: 1 }, null)).toEqual({ a: 1 });
  });
  it('draft wins over scenario for same key', () => {
    expect(mergeOverrideLayers({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
  });
  it('keys present only in draft are kept', () => {
    expect(mergeOverrideLayers({ a: 1 }, { b: 3 })).toEqual({ a: 1, b: 3 });
  });
});

describe('computeDirtyKeys (#550 PR3) @p0', () => {
  it('returns empty when override layer is empty', () => {
    expect(computeDirtyKeys(GROWTH, {}).size).toBe(0);
  });

  it('flags keys whose merged value differs from baseline', () => {
    const dirty = computeDirtyKeys(GROWTH, { gOwnGrowth: 0.50 });
    expect(dirty.has('gOwnGrowth')).toBe(true);
    expect(dirty.size).toBe(1);
  });

  it('does NOT flag a key whose override value equals baseline', () => {
    const baseline = GROWTH.find((r) => r.name === 'gOwnGrowth')!.value;
    const dirty = computeDirtyKeys(GROWTH, { gOwnGrowth: baseline });
    expect(dirty.has('gOwnGrowth')).toBe(false);
  });

  it('flags multiple keys across a section', () => {
    const dirty = computeDirtyKeys(GROWTH, { gOwnGrowth: 0.50, gMix0: 0.40 });
    expect(dirty.size).toBe(2);
  });
});
```

- [ ] **Step 3.1.2: Run — expect FAIL**

```bash
npx vitest run src/lib/financial-model/overrides.test.ts
```

- [ ] **Step 3.1.3: Implement**

Path: `src/lib/financial-model/overrides.ts`

```ts
import type { InputRow } from './data';

export type Overrides = Record<string, number | string>;

/**
 * Returns a new array where any baseline row whose `name` is present in `overrides`
 * has its `value` replaced. Metadata (label, fmt, note) preserved. Baseline NOT mutated.
 * Sparse: keys not in baseline are ignored.
 */
export function applyOverrides(baseline: InputRow[], overrides: Overrides): InputRow[] {
  if (!overrides || Object.keys(overrides).length === 0) {
    // Still return a fresh array to keep callers honest about identity.
    return baseline.map((r) => ({ ...r }));
  }
  return baseline.map((r) =>
    Object.prototype.hasOwnProperty.call(overrides, r.name)
      ? { ...r, value: overrides[r.name] }
      : { ...r }
  );
}

/**
 * Merge scenario overrides with localStorage draft overrides.
 * Draft wins over scenario for same key.
 */
export function mergeOverrideLayers(
  scenarioOverrides: Overrides,
  draftOverrides: Overrides | null | undefined
): Overrides {
  if (!draftOverrides || Object.keys(draftOverrides).length === 0) {
    return { ...scenarioOverrides };
  }
  return { ...scenarioOverrides, ...draftOverrides };
}

/**
 * Compare merged overrides against baseline. A key is dirty when its override
 * value differs from baseline. An override value identical to baseline is NOT dirty.
 */
export function computeDirtyKeys(baseline: InputRow[], merged: Overrides): Set<string> {
  const out = new Set<string>();
  for (const row of baseline) {
    if (Object.prototype.hasOwnProperty.call(merged, row.name)) {
      if (merged[row.name] !== row.value) {
        out.add(row.name);
      }
    }
  }
  return out;
}
```

- [ ] **Step 3.1.4: Run — expect PASS**

```bash
npx vitest run src/lib/financial-model/overrides.test.ts
```

- [ ] **Step 3.1.5: Commit**

```bash
git add src/lib/financial-model/overrides.ts src/lib/financial-model/overrides.test.ts
git commit -m "feat(financial-model): pure-merge applyOverrides/mergeOverrideLayers/computeDirtyKeys (#550 PR3)"
```

### Task 3.2: `useScenarioDraft` hook

- [ ] **Step 3.2.1: Write the test FIRST**

Path: `src/hooks/useScenarioDraft.test.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScenarioDraft, draftKey } from './useScenarioDraft';

beforeEach(() => { localStorage.clear(); });

describe('useScenarioDraft (#550 PR3) @p0', () => {
  it('starts with empty draft when no localStorage value', () => {
    const { result } = renderHook(() => useScenarioDraft('system:base'));
    expect(result.current.draft.overrides).toEqual({});
    expect(result.current.isDirty).toBe(false);
  });

  it('setField adds to draft + persists to localStorage', () => {
    const { result } = renderHook(() => useScenarioDraft('system:base'));
    act(() => result.current.setField('gOwnGrowth', 0.40));
    expect(result.current.draft.overrides).toEqual({ gOwnGrowth: 0.40 });
    expect(JSON.parse(localStorage.getItem(draftKey('system:base'))!).overrides).toEqual({ gOwnGrowth: 0.40 });
  });

  it('resetField removes one key', () => {
    const { result } = renderHook(() => useScenarioDraft('system:base'));
    act(() => {
      result.current.setField('gOwnGrowth', 0.40);
      result.current.setField('gMix0', 0.60);
    });
    act(() => result.current.resetField('gOwnGrowth'));
    expect(result.current.draft.overrides).toEqual({ gMix0: 0.60 });
  });

  it('resetSection removes all keys in a section', () => {
    const { result } = renderHook(() => useScenarioDraft('system:base'));
    act(() => {
      result.current.setField('gOwnGrowth', 0.40);
      result.current.setField('gMix0', 0.60);
      result.current.setField('pAvgBooking', 2500);
    });
    act(() => result.current.resetSection(['gOwnGrowth', 'gMix0']));
    expect(result.current.draft.overrides).toEqual({ pAvgBooking: 2500 });
  });

  it('clear empties the draft', () => {
    const { result } = renderHook(() => useScenarioDraft('system:base'));
    act(() => result.current.setField('gOwnGrowth', 0.40));
    act(() => result.current.clear());
    expect(result.current.draft.overrides).toEqual({});
    expect(localStorage.getItem(draftKey('system:base'))).toBeNull();
  });

  it('survives remount on the same scenario id', () => {
    {
      const { result } = renderHook(() => useScenarioDraft('uuid-1'));
      act(() => result.current.setField('gOwnGrowth', 0.99));
    }
    const { result } = renderHook(() => useScenarioDraft('uuid-1'));
    expect(result.current.draft.overrides).toEqual({ gOwnGrowth: 0.99 });
  });

  it('drafts for different scenario ids are isolated', () => {
    const a = renderHook(() => useScenarioDraft('uuid-a'));
    act(() => a.result.current.setField('x', 1));
    const b = renderHook(() => useScenarioDraft('uuid-b'));
    expect(b.result.current.draft.overrides).toEqual({});
  });

  it('isDirty true when any override or expenseOverride present', () => {
    const { result } = renderHook(() => useScenarioDraft('s1'));
    expect(result.current.isDirty).toBe(false);
    act(() => result.current.setField('x', 1));
    expect(result.current.isDirty).toBe(true);
  });
});
```

- [ ] **Step 3.2.2: Run — FAIL**

```bash
npx vitest run src/hooks/useScenarioDraft.test.ts
```

- [ ] **Step 3.2.3: Implement**

Path: `src/hooks/useScenarioDraft.ts`

```ts
import { useCallback, useEffect, useState } from 'react';
import type { ExpenseOverride } from './useFinancialModelScenarios';
import type { Overrides } from '@/lib/financial-model/overrides';

export interface DraftState {
  overrides: Overrides;
  expenseOverrides: ExpenseOverride[];
}

export function draftKey(scenarioId: string): string {
  return `fms-draft:${scenarioId}`;
}

function readDraft(scenarioId: string): DraftState {
  try {
    const raw = localStorage.getItem(draftKey(scenarioId));
    if (!raw) return { overrides: {}, expenseOverrides: [] };
    const parsed = JSON.parse(raw);
    return {
      overrides: parsed?.overrides ?? {},
      expenseOverrides: parsed?.expenseOverrides ?? [],
    };
  } catch {
    return { overrides: {}, expenseOverrides: [] };
  }
}

function writeDraft(scenarioId: string, state: DraftState) {
  try {
    const isEmpty = Object.keys(state.overrides).length === 0 && state.expenseOverrides.length === 0;
    if (isEmpty) {
      localStorage.removeItem(draftKey(scenarioId));
    } else {
      localStorage.setItem(draftKey(scenarioId), JSON.stringify(state));
    }
  } catch {
    // ignore — in-memory still updates
  }
}

export function useScenarioDraft(scenarioId: string) {
  const [draft, setDraft] = useState<DraftState>(() => readDraft(scenarioId));

  // Resync when scenarioId changes
  useEffect(() => {
    setDraft(readDraft(scenarioId));
  }, [scenarioId]);

  const persist = useCallback(
    (next: DraftState) => {
      setDraft(next);
      writeDraft(scenarioId, next);
    },
    [scenarioId]
  );

  const setField = useCallback(
    (name: string, value: number | string) => {
      persist({ ...draft, overrides: { ...draft.overrides, [name]: value } });
    },
    [draft, persist]
  );

  const resetField = useCallback(
    (name: string) => {
      const next = { ...draft.overrides };
      delete next[name];
      persist({ ...draft, overrides: next });
    },
    [draft, persist]
  );

  const resetSection = useCallback(
    (names: string[]) => {
      const next = { ...draft.overrides };
      for (const n of names) delete next[n];
      persist({ ...draft, overrides: next });
    },
    [draft, persist]
  );

  const setExpenseAmount = useCallback(
    (category: string, item: string, amount: number) => {
      const idx = draft.expenseOverrides.findIndex(
        (e) => e.category === category && e.item === item
      );
      const next = idx >= 0
        ? draft.expenseOverrides.map((e, i) => (i === idx ? { ...e, amount } : e))
        : [...draft.expenseOverrides, { category, item, amount }];
      persist({ ...draft, expenseOverrides: next });
    },
    [draft, persist]
  );

  const resetExpense = useCallback(
    (category: string, item: string) => {
      const next = draft.expenseOverrides.filter(
        (e) => !(e.category === category && e.item === item)
      );
      persist({ ...draft, expenseOverrides: next });
    },
    [draft, persist]
  );

  const clear = useCallback(() => {
    persist({ overrides: {}, expenseOverrides: [] });
  }, [persist]);

  const isDirty = Object.keys(draft.overrides).length > 0 || draft.expenseOverrides.length > 0;

  return {
    draft,
    setField,
    resetField,
    resetSection,
    setExpenseAmount,
    resetExpense,
    clear,
    isDirty,
  };
}
```

- [ ] **Step 3.2.4: Run — PASS**

```bash
npx vitest run src/hooks/useScenarioDraft.test.ts
```

- [ ] **Step 3.2.5: Commit**

```bash
git add src/hooks/useScenarioDraft.ts src/hooks/useScenarioDraft.test.ts
git commit -m "feat(financial-model): useScenarioDraft localStorage-backed draft (#550 PR3)"
```

### Task 3.3: `useActiveScenarioInputs` — composed view-model

- [ ] **Step 3.3.1: Write the test FIRST**

Path: `src/hooks/useActiveScenarioInputs.test.tsx`

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useActiveScenarioInputs } from './useActiveScenarioInputs';
import { GROWTH } from '@/lib/financial-model/data';

const wrap = (qc: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: 'me' } } }) },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
    }),
  },
}));

beforeEach(() => { localStorage.clear(); });

describe('useActiveScenarioInputs (#550 PR3) @p0', () => {
  it('returns canonical baseline when no scenario, no draft', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useActiveScenarioInputs(), { wrapper: wrap(qc) });
    expect(result.current.dirtyKeys.size).toBe(0);
    expect(result.current.growth.find((r) => r.name === 'gOwnGrowth')!.value)
      .toBe(GROWTH.find((r) => r.name === 'gOwnGrowth')!.value);
  });

  it('localStorage draft overrides baseline + flags dirtyKeys', () => {
    localStorage.setItem('fms-draft:system:base', JSON.stringify({ overrides: { gOwnGrowth: 0.50 }, expenseOverrides: [] }));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useActiveScenarioInputs(), { wrapper: wrap(qc) });
    expect(result.current.dirtyKeys.has('gOwnGrowth')).toBe(true);
    expect(result.current.growth.find((r) => r.name === 'gOwnGrowth')!.value).toBe(0.50);
  });

  it('identical-to-baseline override does NOT appear in dirtyKeys', () => {
    const baselineVal = GROWTH.find((r) => r.name === 'gOwnGrowth')!.value;
    localStorage.setItem('fms-draft:system:base', JSON.stringify({ overrides: { gOwnGrowth: baselineVal }, expenseOverrides: [] }));
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useActiveScenarioInputs(), { wrapper: wrap(qc) });
    expect(result.current.dirtyKeys.has('gOwnGrowth')).toBe(false);
  });
});
```

- [ ] **Step 3.3.2: Run — FAIL**

```bash
npx vitest run src/hooks/useActiveScenarioInputs.test.tsx
```

- [ ] **Step 3.3.3: Implement**

Path: `src/hooks/useActiveScenarioInputs.ts`

```ts
import { useMemo } from 'react';
import {
  PLATFORM, SUBSCRIPTIONS, GROWTH, SCENARIOS, HORIZON,
  RESERVES, HIRING, UNIT_ECON, EXPENSES,
} from '@/lib/financial-model/data';
import { applyOverrides, mergeOverrideLayers, computeDirtyKeys, type Overrides } from '@/lib/financial-model/overrides';
import { useActiveScenario } from './useActiveScenario';
import { useFinancialModelScenarios, type ExpenseOverride, type FinancialModelScenario } from './useFinancialModelScenarios';
import { useScenarioDraft } from './useScenarioDraft';
import { isSystemScenarioId } from '@/lib/financial-model/system-scenarios';
import type { ModelInputs, Scenario } from '@/lib/financial-model/calc';

export interface ActiveScenarioInputs extends ModelInputs {
  multiplier: Scenario;
  active: FinancialModelScenario | null;
  isSystem: boolean;
  expenseOverrides: ExpenseOverride[];
  dirtyKeys: Set<string>;
  dirtyExpenseKeys: Set<string>;
  isDirty: boolean;
}

const ALL_BASELINES = [
  ['platform', PLATFORM],
  ['subscriptions', SUBSCRIPTIONS],
  ['growth', GROWTH],
  ['scenarios', SCENARIOS],
  ['horizon', HORIZON],
  ['reserves', RESERVES],
  ['hiring', HIRING],
  ['unitEcon', UNIT_ECON],
] as const;

export function useActiveScenarioInputs(): ActiveScenarioInputs {
  const { activeId } = useActiveScenario();
  const { scenarios } = useFinancialModelScenarios();
  const { draft } = useScenarioDraft(activeId);

  const isSystem = isSystemScenarioId(activeId);
  const active = scenarios.find((s) => s.id === activeId) ?? null;

  return useMemo(() => {
    const scenarioOverrides: Overrides = active?.overrides ?? {};
    const merged = mergeOverrideLayers(scenarioOverrides, draft.overrides);

    const platformRows = applyOverrides(PLATFORM, merged);
    const subscriptionsRows = applyOverrides(SUBSCRIPTIONS, merged);
    const growthRows = applyOverrides(GROWTH, merged);
    const scenariosRows = applyOverrides(SCENARIOS, merged);
    const horizonRows = applyOverrides(HORIZON, merged);
    const reservesRows = applyOverrides(RESERVES, merged);
    const hiringRows = applyOverrides(HIRING, merged);
    const unitEconRows = applyOverrides(UNIT_ECON, merged);

    // Expense overrides: merge scenario + draft (draft wins per (category,item))
    const expenseScenarioMap = new Map(
      (active?.expense_overrides ?? []).map((e) => [`${e.category}|${e.item}`, e])
    );
    const expenseDraftMap = new Map(
      draft.expenseOverrides.map((e) => [`${e.category}|${e.item}`, e])
    );
    const mergedExpenseMap = new Map([...expenseScenarioMap, ...expenseDraftMap]);
    const expenseOverrides = Array.from(mergedExpenseMap.values());

    // Apply expense overrides to baseline EXPENSES
    const expensesRows = EXPENSES.map((e) => {
      const key = `${e.category}|${e.item}`;
      const override = mergedExpenseMap.get(key);
      return override?.amount !== undefined ? { ...e, amount: override.amount } : { ...e };
    });

    // Dirty keys across all 8 input sections
    const dirtyKeys = new Set<string>();
    for (const [, baseline] of ALL_BASELINES) {
      const sectionDirty = computeDirtyKeys(baseline as InstanceType<typeof Array>, merged);
      for (const k of sectionDirty) dirtyKeys.add(k);
    }

    const dirtyExpenseKeys = new Set<string>();
    for (const ov of expenseOverrides) {
      const baseline = EXPENSES.find((e) => e.category === ov.category && e.item === ov.item);
      if (baseline && ov.amount !== undefined && ov.amount !== baseline.amount) {
        dirtyExpenseKeys.add(`${ov.category}|${ov.item}`);
      }
    }

    const multiplier: Scenario = (active?.multiplier ?? 'Base') as Scenario;

    return {
      platform: platformRows,
      subscriptions: subscriptionsRows,
      growth: growthRows,
      scenarios: scenariosRows,
      horizon: horizonRows,
      reserves: reservesRows,
      hiring: hiringRows,
      unitEcon: unitEconRows,
      expenses: expensesRows,
      multiplier,
      active,
      isSystem,
      expenseOverrides,
      dirtyKeys,
      dirtyExpenseKeys,
      isDirty: dirtyKeys.size > 0 || dirtyExpenseKeys.size > 0,
    };
  }, [active, draft, isSystem]);
}
```

- [ ] **Step 3.3.4: Run — PASS**

```bash
npx vitest run src/hooks/useActiveScenarioInputs.test.tsx
```

- [ ] **Step 3.3.5: Commit**

```bash
git add src/hooks/useActiveScenarioInputs.ts src/hooks/useActiveScenarioInputs.test.tsx
git commit -m "feat(financial-model): useActiveScenarioInputs composed view-model (#550 PR3)"
```

### Task 3.4: `EditableInputRow` component

- [ ] **Step 3.4.1: Write the test FIRST**

Path: `src/components/financial-model/EditableInputRow.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EditableInputRow } from './EditableInputRow';
import { GROWTH } from '@/lib/financial-model/data';

const ownGrowth = GROWTH.find((r) => r.name === 'gOwnGrowth')!;

const wrap = (ui: React.ReactElement) => <MemoryRouter>{ui}</MemoryRouter>;

describe('EditableInputRow (#550 PR3) @p0', () => {
  it('renders label and current value', () => {
    render(wrap(<EditableInputRow row={ownGrowth} baselineValue={ownGrowth.value as number} dirty={false} readOnly={false} onChange={() => {}} onReset={() => {}} />));
    expect(screen.getByText(ownGrowth.label)).toBeInTheDocument();
  });

  it('shows dot when dirty', () => {
    render(wrap(<EditableInputRow row={ownGrowth} baselineValue={0.20} dirty={true} readOnly={false} onChange={() => {}} onReset={() => {}} />));
    expect(screen.getByLabelText(/differs from baseline/i)).toBeInTheDocument();
  });

  it('does NOT show dot when not dirty', () => {
    render(wrap(<EditableInputRow row={ownGrowth} baselineValue={ownGrowth.value as number} dirty={false} readOnly={false} onChange={() => {}} onReset={() => {}} />));
    expect(screen.queryByLabelText(/differs from baseline/i)).not.toBeInTheDocument();
  });

  it('shows [×] reset button only when dirty', () => {
    const onReset = vi.fn();
    render(wrap(<EditableInputRow row={ownGrowth} baselineValue={ownGrowth.value as number} dirty={false} readOnly={false} onChange={() => {}} onReset={onReset} />));
    expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument();
  });

  it('clicks the [×] when dirty and calls onReset', () => {
    const onReset = vi.fn();
    render(wrap(<EditableInputRow row={ownGrowth} baselineValue={0.20} dirty={true} readOnly={false} onChange={() => {}} onReset={onReset} />));
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(onReset).toHaveBeenCalled();
  });

  it('calls onChange with parsed numeric value on blur', () => {
    const onChange = vi.fn();
    render(wrap(<EditableInputRow row={ownGrowth} baselineValue={ownGrowth.value as number} dirty={false} readOnly={false} onChange={onChange} onReset={() => {}} />));
    const input = screen.getByLabelText(ownGrowth.label) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '0.40' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(0.40);
  });

  it('readOnly mode renders no input, displays value', () => {
    render(wrap(<EditableInputRow row={ownGrowth} baselineValue={ownGrowth.value as number} dirty={false} readOnly={true} onChange={() => {}} onReset={() => {}} />));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3.4.2: Run — FAIL**

```bash
npx vitest run src/components/financial-model/EditableInputRow.test.tsx
```

- [ ] **Step 3.4.3: Implement**

Path: `src/components/financial-model/EditableInputRow.tsx`

```tsx
import { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import type { InputRow } from '@/lib/financial-model/data';

interface Props {
  row: InputRow;
  baselineValue: number | string;
  dirty: boolean;
  readOnly?: boolean;
  onChange: (value: number | string) => void;
  onReset: () => void;
}

function inputStep(fmt: string): string {
  if (fmt.includes('%')) return '0.001';
  if (fmt.startsWith('$0.00')) return '0.01';
  if (fmt.startsWith('$')) return '1';
  if (fmt.includes('"x"')) return '0.01';
  return 'any';
}

function displayValue(row: InputRow): string {
  return typeof row.value === 'number' ? String(row.value) : String(row.value);
}

export function EditableInputRow({ row, baselineValue, dirty, readOnly, onChange, onReset }: Props) {
  const id = useId();
  const [local, setLocal] = useState(displayValue(row));

  // Resync if external row value changes (e.g., reset, scenario switch)
  useEffect(() => { setLocal(displayValue(row)); }, [row.value]);

  if (readOnly) {
    return (
      <div className="grid grid-cols-[1fr_auto] gap-3 items-center py-1.5 text-sm">
        <label htmlFor={id} className="text-slate-300">{row.label}</label>
        <div className="font-mono tabular-nums text-slate-100">{displayValue(row)}</div>
      </div>
    );
  }

  const commit = () => {
    if (typeof row.value === 'number') {
      const parsed = parseFloat(local);
      if (Number.isFinite(parsed)) onChange(parsed);
      else setLocal(displayValue(row));
    } else {
      onChange(local);
    }
  };

  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center py-1.5 text-sm">
      <label htmlFor={id} className="text-slate-300 flex items-center gap-1.5">
        {row.label}
        {dirty ? (
          <span
            aria-label={`differs from baseline (was ${baselineValue})`}
            title={`Baseline: ${baselineValue}`}
            className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400"
          />
        ) : null}
      </label>
      <input
        id={id}
        type={typeof row.value === 'number' ? 'number' : 'text'}
        step={inputStep(row.fmt)}
        className="font-mono tabular-nums text-right text-slate-100 bg-slate-900 border border-slate-700 rounded px-2 py-1 w-32"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
      />
      {dirty ? (
        <button
          type="button"
          onClick={onReset}
          aria-label={`Reset ${row.label}`}
          className="text-slate-500 hover:text-slate-200 p-1"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        <span className="w-5" />
      )}
    </div>
  );
}
```

- [ ] **Step 3.4.4: Run — PASS**

```bash
npx vitest run src/components/financial-model/EditableInputRow.test.tsx
```

- [ ] **Step 3.4.5: Commit**

```bash
git add src/components/financial-model/EditableInputRow.tsx src/components/financial-model/EditableInputRow.test.tsx
git commit -m "feat(financial-model): EditableInputRow with dirty dot + per-input reset (#550 PR3)"
```

### Task 3.5: Editable expense amounts in `ExpenseSection`

- [ ] **Step 3.5.1: Extend `ExpenseSection` to accept handlers**

Replace `src/components/financial-model/ExpenseSection.tsx`:

```tsx
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import { EXPENSES } from '@/lib/financial-model/data';
import type { ExpenseRow } from '@/lib/financial-model/data';

interface Props {
  expenses: ExpenseRow[];
  dirtyExpenseKeys: Set<string>;
  readOnly?: boolean;
  onAmountChange?: (category: string, item: string, amount: number) => void;
  onResetAmount?: (category: string, item: string) => void;
}

export function ExpenseSection({ expenses, dirtyExpenseKeys, readOnly, onAmountChange, onResetAmount }: Props) {
  const [open, setOpen] = useState(false);
  const dirtyCount = dirtyExpenseKeys.size;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/30 mb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-800/50 rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          <span className="font-medium text-slate-100">Expenses</span>
          {dirtyCount > 0 ? <span className="text-xs text-amber-400">{dirtyCount} differ ●</span> : null}
        </div>
      </button>
      {open ? (
        <div className="px-4 pb-4 pt-1 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-3">
            {EXPENSES.length} line items across {new Set(EXPENSES.map((e) => e.category)).size} categories. Amount is editable; category/item/frequency/timing are not.
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400">
                <th className="text-left py-1">Category</th>
                <th className="text-left py-1">Item</th>
                <th className="text-right py-1">Amount</th>
                <th className="text-left py-1 pl-3">Freq</th>
                <th className="text-right py-1">Start</th>
                <th className="text-right py-1">End</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {expenses.map((e) => {
                const key = `${e.category}|${e.item}`;
                const baseline = EXPENSES.find((b) => b.category === e.category && b.item === e.item);
                const dirty = dirtyExpenseKeys.has(key);
                return (
                  <tr key={key} className="border-t border-slate-800">
                    <td className="py-1 pr-2 text-slate-400">{e.category}</td>
                    <td className="py-1 pr-2">
                      <span className="flex items-center gap-1.5">
                        {e.item}
                        {dirty ? <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" /> : null}
                      </span>
                    </td>
                    <td className="py-1 text-right tabular-nums">
                      {readOnly ? (
                        <span>${e.amount.toLocaleString()}</span>
                      ) : (
                        <input
                          type="number"
                          className="font-mono tabular-nums text-right text-slate-100 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 w-24"
                          defaultValue={e.amount}
                          onBlur={(ev) => {
                            const v = parseFloat(ev.target.value);
                            if (Number.isFinite(v)) onAmountChange?.(e.category, e.item, v);
                          }}
                        />
                      )}
                    </td>
                    <td className="py-1 pl-3">{e.frequency}</td>
                    <td className="py-1 text-right tabular-nums">{e.startMo}</td>
                    <td className="py-1 text-right tabular-nums">{e.endMo}</td>
                    <td className="py-1 pl-1">
                      {!readOnly && dirty ? (
                        <button
                          type="button"
                          onClick={() => onResetAmount?.(e.category, e.item)}
                          aria-label={`Reset ${e.item}`}
                          className="text-slate-500 hover:text-slate-200 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {baselineNote(expenses)}
        </div>
      ) : null}
    </div>
  );
}

function baselineNote(expenses: ExpenseRow[]) {
  // Display nothing — left as a future hook for explanatory copy.
  return null;
}
```

- [ ] **Step 3.5.2: Commit**

```bash
git add src/components/financial-model/ExpenseSection.tsx
git commit -m "feat(financial-model): ExpenseSection editable amount column (#550 PR3)"
```

### Task 3.6: Wire it all into the dashboard

- [ ] **Step 3.6.1: Modify `FinancialModelDashboard.tsx`**

Replace the Section 2.6 block that mounted accordions + read-only rows. New block:

```tsx
import { useActiveScenarioInputs } from '@/hooks/useActiveScenarioInputs';
import { useScenarioDraft } from '@/hooks/useScenarioDraft';
import { EditableInputRow } from '@/components/financial-model/EditableInputRow';

// ... inside component:
const inputs = useActiveScenarioInputs();
const draft = useScenarioDraft(activeId);
const readOnly = !inputs.isSystem && inputs.active && inputs.active.owner_id !== user?.id;
// project() now takes merged inputs
const { data: rate } = useCommissionRate();
const result = project(inputs.multiplier, inputs, rate);

// ... in JSX, replace the "Model Inputs" accordion block:
<div className="mt-8">
  <h2 className="text-lg font-semibold text-white mb-4">Model Inputs</h2>
  {INPUT_SECTIONS.map((section) => {
    const sectionInputs =
      section.id === 'platform'      ? inputs.platform
      : section.id === 'subscriptions' ? inputs.subscriptions
      : section.id === 'growth'      ? inputs.growth
      : section.id === 'scenarios'   ? inputs.scenarios
      : section.id === 'horizon'     ? inputs.horizon
      : section.id === 'reserves'    ? inputs.reserves
      : section.id === 'hiring'      ? inputs.hiring
      :                                  inputs.unitEcon;
    const liveSet = new Set(section.liveConfigKeys ?? []);
    return (
      <InputSectionAccordion
        key={section.id}
        section={section}
        dirtyKeys={inputs.dirtyKeys}
        onResetSection={() => draft.resetSection(section.baseline.map((r) => r.name))}
      >
        {sectionInputs.map((row) => {
          const baseline = section.baseline.find((b) => b.name === row.name)!.value;
          if (liveSet.has(row.name)) {
            return <ReadOnlyInputRow key={row.name} row={row} liveConfig />;
          }
          return (
            <EditableInputRow
              key={row.name}
              row={row}
              baselineValue={baseline}
              dirty={inputs.dirtyKeys.has(row.name)}
              readOnly={!!readOnly}
              onChange={(v) => draft.setField(row.name, v)}
              onReset={() => draft.resetField(row.name)}
            />
          );
        })}
      </InputSectionAccordion>
    );
  })}
  <ExpenseSection
    expenses={inputs.expenses}
    dirtyExpenseKeys={inputs.dirtyExpenseKeys}
    readOnly={!!readOnly}
    onAmountChange={draft.setExpenseAmount}
    onResetAmount={draft.resetExpense}
  />
</div>
```

- [ ] **Step 3.6.2: Type check + smoke test**

```bash
npx tsc --noEmit
npm run dev
```

- Pick the Base scenario; edit `gOwnGrowth` from `0.20` to `0.40`. KPIs above recompute. Yellow dot appears next to the label. `[×]` appears.
- Click `[×]` — value reverts, dot disappears.
- Refresh the page — your edit (if you didn't reset) persists.
- Reset section button appears at the Growth header when any growth field is dirty.
- Toggle to Conservative — values update; Conservative's draft is separate (no cross-contamination).

Ctrl-C.

- [ ] **Step 3.6.3: Commit**

```bash
git add src/pages/FinancialModelDashboard.tsx
git commit -m "feat(financial-model): wire EditableInputRow + draft (#550 PR3)"
```

### Task 3.7: Open PR3

- [ ] **Step 3.7.1: Push + open**

```bash
git push origin feature/stage-2c-financial-model
gh pr create --repo rent-a-vacation/rav-website --base dev --head feature/stage-2c-financial-model --title "feat(financial-model): #550 PR3 — editable inputs + draft + per-input dot" --body "Wires EditableInputRow + useScenarioDraft (localStorage) + useActiveScenarioInputs into the dashboard. KPIs/trajectory recompute on every edit. Per-input dot + [×] reset appear when value differs from baseline. Expense amounts editable.

Test plan:
- [x] Override merge tests (sparse, identical-to-baseline = not dirty)
- [x] Draft hook tests (set/reset/section/clear/persist)
- [x] EditableInputRow tests (dot, reset, commit on blur)
- [x] Smoke: edit gOwnGrowth → KPIs update → refresh persists → [×] reverts"
```

- [ ] **Step 3.7.2: Merge on approval**

---

## PR4 — Drift banner + reset all + diff dialog

Add `DriftBanner` and `DiffDialog`. Banner only renders when `inputs.isDirty`. "Reset all" clears draft. "Show diff" opens dialog listing each dirty field with per-field reset.

**Files:**
- Create: `src/components/financial-model/DriftBanner.tsx`
- Create: `src/components/financial-model/DriftBanner.test.tsx`
- Create: `src/components/financial-model/DiffDialog.tsx`
- Create: `src/components/financial-model/DiffDialog.test.tsx`
- Modify: `src/pages/FinancialModelDashboard.tsx` (mount banner + dialog)

### Task 4.1: `DriftBanner`

- [ ] **Step 4.1.1: Write the test FIRST**

Path: `src/components/financial-model/DriftBanner.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DriftBanner } from './DriftBanner';

describe('DriftBanner (#550 PR4) @p0', () => {
  it('hides when no dirty keys', () => {
    const { container } = render(
      <DriftBanner dirtyCount={0} scenarioName="Base" onShowDiff={() => {}} onResetAll={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows count and scenario name when dirty', () => {
    render(<DriftBanner dirtyCount={6} scenarioName="Sujit Q3 plan" onShowDiff={() => {}} onResetAll={() => {}} />);
    expect(screen.getByText(/Sujit Q3 plan/)).toBeInTheDocument();
    expect(screen.getByText(/6/)).toBeInTheDocument();
  });

  it('calls onShowDiff when Show diff clicked', () => {
    const onShowDiff = vi.fn();
    render(<DriftBanner dirtyCount={2} scenarioName="X" onShowDiff={onShowDiff} onResetAll={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /show diff/i }));
    expect(onShowDiff).toHaveBeenCalled();
  });

  it('calls onResetAll when Reset all clicked', () => {
    const onResetAll = vi.fn();
    render(<DriftBanner dirtyCount={2} scenarioName="X" onShowDiff={() => {}} onResetAll={onResetAll} />);
    fireEvent.click(screen.getByRole('button', { name: /reset all/i }));
    expect(onResetAll).toHaveBeenCalled();
  });
});
```

- [ ] **Step 4.1.2: Run — FAIL**

```bash
npx vitest run src/components/financial-model/DriftBanner.test.tsx
```

- [ ] **Step 4.1.3: Implement**

Path: `src/components/financial-model/DriftBanner.tsx`

```tsx
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  dirtyCount: number;
  scenarioName: string;
  onShowDiff: () => void;
  onResetAll: () => void;
}

export function DriftBanner({ dirtyCount, scenarioName, onShowDiff, onResetAll }: Props) {
  if (dirtyCount === 0) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2 mb-4">
      <div className="flex items-center gap-2 text-sm text-amber-100">
        <AlertCircle className="h-4 w-4 text-amber-300" />
        Editing <strong className="font-semibold">{scenarioName}</strong> — {dirtyCount} input{dirtyCount === 1 ? '' : 's'} differ from baseline.
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onShowDiff}>Show diff</Button>
        <Button variant="outline" size="sm" onClick={onResetAll}>Reset all</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4.1.4: Run — PASS**

```bash
npx vitest run src/components/financial-model/DriftBanner.test.tsx
```

- [ ] **Step 4.1.5: Commit**

```bash
git add src/components/financial-model/DriftBanner.tsx src/components/financial-model/DriftBanner.test.tsx
git commit -m "feat(financial-model): DriftBanner (#550 PR4)"
```

### Task 4.2: `DiffDialog`

- [ ] **Step 4.2.1: Write the test FIRST**

Path: `src/components/financial-model/DiffDialog.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiffDialog } from './DiffDialog';

const diffs = [
  { key: 'gOwnGrowth', label: 'Monthly Owner Growth Rate (%)', baseline: 0.20, current: 0.40 },
  { key: 'gMix0',      label: 'Booking Mix — Free Owner %',     baseline: 0.65, current: 0.55 },
];

describe('DiffDialog (#550 PR4) @p0', () => {
  it('renders each dirty field with baseline + current values', () => {
    render(<DiffDialog open diffs={diffs} expenseDiffs={[]} onClose={() => {}} onResetField={() => {}} onResetExpense={() => {}} />);
    expect(screen.getByText('Monthly Owner Growth Rate (%)')).toBeInTheDocument();
    expect(screen.getAllByText(/0\.20/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/0\.40/).length).toBeGreaterThan(0);
  });

  it('per-field reset triggers callback with key', () => {
    const onResetField = vi.fn();
    render(<DiffDialog open diffs={diffs} expenseDiffs={[]} onClose={() => {}} onResetField={onResetField} onResetExpense={() => {}} />);
    const buttons = screen.getAllByRole('button', { name: /reset/i });
    fireEvent.click(buttons[0]);
    expect(onResetField).toHaveBeenCalledWith('gOwnGrowth');
  });

  it('does not render when open=false', () => {
    const { container } = render(<DiffDialog open={false} diffs={diffs} expenseDiffs={[]} onClose={() => {}} onResetField={() => {}} onResetExpense={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 4.2.2: Run — FAIL**

```bash
npx vitest run src/components/financial-model/DiffDialog.test.tsx
```

- [ ] **Step 4.2.3: Implement**

Path: `src/components/financial-model/DiffDialog.tsx`

```tsx
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface DiffEntry {
  key: string;
  label: string;
  baseline: number | string;
  current: number | string;
}

export interface ExpenseDiffEntry {
  category: string;
  item: string;
  baseline: number;
  current: number;
}

interface Props {
  open: boolean;
  diffs: DiffEntry[];
  expenseDiffs: ExpenseDiffEntry[];
  onClose: () => void;
  onResetField: (key: string) => void;
  onResetExpense: (category: string, item: string) => void;
}

export function DiffDialog({ open, diffs, expenseDiffs, onClose, onResetField, onResetExpense }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-lg border border-slate-700 bg-slate-900 p-6"
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Differences from baseline</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>

        {diffs.length === 0 && expenseDiffs.length === 0 ? (
          <p className="text-slate-400 text-sm">No differences.</p>
        ) : null}

        {diffs.length > 0 ? (
          <table className="w-full text-sm mb-4">
            <thead className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <tr>
                <th className="text-left py-2 pr-3">Input</th>
                <th className="text-right py-2 px-3">Baseline</th>
                <th className="text-right py-2 px-3">Current</th>
                <th className="text-right py-2 pl-3 w-12"> </th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {diffs.map((d) => (
                <tr key={d.key} className="border-b border-slate-800">
                  <td className="py-2 pr-3">{d.label}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-400">{String(d.baseline)}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-amber-300">{String(d.current)}</td>
                  <td className="py-2 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => onResetField(d.key)}
                      aria-label={`Reset ${d.label}`}
                      className="text-slate-500 hover:text-slate-200 p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {expenseDiffs.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <tr>
                <th className="text-left py-2 pr-3">Expense</th>
                <th className="text-right py-2 px-3">Baseline</th>
                <th className="text-right py-2 px-3">Current</th>
                <th className="text-right py-2 pl-3 w-12"> </th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {expenseDiffs.map((d) => (
                <tr key={`${d.category}|${d.item}`} className="border-b border-slate-800">
                  <td className="py-2 pr-3">{d.category} — {d.item}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-400">${d.baseline.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-amber-300">${d.current.toLocaleString()}</td>
                  <td className="py-2 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => onResetExpense(d.category, d.item)}
                      aria-label={`Reset ${d.item}`}
                      className="text-slate-500 hover:text-slate-200 p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 4.2.4: Run — PASS**

```bash
npx vitest run src/components/financial-model/DiffDialog.test.tsx
```

- [ ] **Step 4.2.5: Commit**

```bash
git add src/components/financial-model/DiffDialog.tsx src/components/financial-model/DiffDialog.test.tsx
git commit -m "feat(financial-model): DiffDialog with per-field reset (#550 PR4)"
```

### Task 4.3: Mount banner + dialog in the dashboard

- [ ] **Step 4.3.1: Modify `FinancialModelDashboard.tsx`**

Add state + mount the components:

```tsx
import { useState } from 'react';
import { DriftBanner } from '@/components/financial-model/DriftBanner';
import { DiffDialog, type DiffEntry, type ExpenseDiffEntry } from '@/components/financial-model/DiffDialog';

// ... inside component, after `inputs = useActiveScenarioInputs()`:
const [showDiff, setShowDiff] = useState(false);

// Build diff entries from dirtyKeys for the dialog
const diffEntries: DiffEntry[] = [];
for (const section of INPUT_SECTIONS) {
  for (const row of section.baseline) {
    if (inputs.dirtyKeys.has(row.name)) {
      const current = (
        section.id === 'platform' ? inputs.platform
        : section.id === 'subscriptions' ? inputs.subscriptions
        : section.id === 'growth' ? inputs.growth
        : section.id === 'scenarios' ? inputs.scenarios
        : section.id === 'horizon' ? inputs.horizon
        : section.id === 'reserves' ? inputs.reserves
        : section.id === 'hiring' ? inputs.hiring
        : inputs.unitEcon
      ).find((r) => r.name === row.name)!.value;
      diffEntries.push({ key: row.name, label: row.label, baseline: row.value, current });
    }
  }
}
const expenseDiffEntries: ExpenseDiffEntry[] = inputs.expenses
  .filter((e) => inputs.dirtyExpenseKeys.has(`${e.category}|${e.item}`))
  .map((e) => {
    const baseline = EXPENSES.find((b) => b.category === e.category && b.item === e.item)!;
    return { category: e.category, item: e.item, baseline: baseline.amount, current: e.amount };
  });

const scenarioName = isSystemScenarioId(activeId)
  ? findSystemScenario(activeId)?.name ?? 'Base'
  : inputs.active?.name ?? 'Base';
```

Mount the banner above the KPI block:

```tsx
<DriftBanner
  dirtyCount={inputs.dirtyKeys.size + inputs.dirtyExpenseKeys.size}
  scenarioName={scenarioName}
  onShowDiff={() => setShowDiff(true)}
  onResetAll={() => draft.clear()}
/>

<DiffDialog
  open={showDiff}
  diffs={diffEntries}
  expenseDiffs={expenseDiffEntries}
  onClose={() => setShowDiff(false)}
  onResetField={(key) => draft.resetField(key)}
  onResetExpense={(c, i) => draft.resetExpense(c, i)}
/>
```

Add `import { EXPENSES } from '@/lib/financial-model/data';` if not already.

- [ ] **Step 4.3.2: Type check + smoke**

```bash
npx tsc --noEmit
npm run dev
```

- Edit a few inputs → banner appears at top with count.
- Click "Show diff" → dialog lists every dirty input with baseline + current.
- Per-field `[×]` in dialog reverts only that field.
- "Reset all" in banner clears every dirty input.
- Banner disappears when last dirty input is reset.

Ctrl-C.

- [ ] **Step 4.3.3: Commit**

```bash
git add src/pages/FinancialModelDashboard.tsx
git commit -m "feat(financial-model): mount DriftBanner + DiffDialog (#550 PR4)"
```

### Task 4.4: Open PR4

- [ ] **Step 4.4.1: Push + open + await merge approval**

```bash
git push origin feature/stage-2c-financial-model
gh pr create --repo rent-a-vacation/rav-website --base dev --head feature/stage-2c-financial-model --title "feat(financial-model): #550 PR4 — drift banner + reset (all 3 granularities) + diff dialog" --body "Adds the user-facing surface for the override system. Banner shows count when dirty; Show diff opens a modal with per-field reset; Reset all clears the draft.

Test plan:
- [x] Banner hides when no dirty keys, shows when dirty
- [x] DiffDialog lists each dirty entry + supports per-field reset
- [x] Smoke: edit inputs → banner appears → reset all clears"
```

---

## PR5 — Save / Save As / Duplicate / Share + polish

The persistence story. Adds `SaveScenarioDialog`, the header action-button state machine, share toggle, and "Duplicate to my scenarios" for shared scenarios. Push migration 081 to PROD as part of the release PR after this lands on `dev`.

**Files:**
- Create: `src/components/financial-model/SaveScenarioDialog.tsx`
- Create: `src/components/financial-model/SaveScenarioDialog.test.tsx`
- Create: `src/components/financial-model/ScenarioActions.tsx` (button row state machine)
- Create: `src/components/financial-model/ScenarioActions.test.tsx`
- Create: `src/pages/FinancialModelDashboard.test.tsx` (integration test)
- Modify: `src/pages/FinancialModelDashboard.tsx` (mount actions)

### Task 5.1: `SaveScenarioDialog`

- [ ] **Step 5.1.1: Write the test FIRST**

Path: `src/components/financial-model/SaveScenarioDialog.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SaveScenarioDialog } from './SaveScenarioDialog';

describe('SaveScenarioDialog (#550 PR5) @p0', () => {
  it('hidden when open=false', () => {
    const { container } = render(
      <SaveScenarioDialog open={false} initialName="" initialShared={false}
        title="Save scenario as…" onSubmit={() => {}} onCancel={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('submits name + share flag', () => {
    const onSubmit = vi.fn();
    render(
      <SaveScenarioDialog open initialName="" initialShared={false}
        title="Save scenario as…" onSubmit={onSubmit} onCancel={() => {}} />
    );
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Sujit Q3' } });
    fireEvent.click(screen.getByLabelText(/share/i));
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Sujit Q3', isShared: true });
  });

  it('Save button disabled when name is empty', () => {
    render(
      <SaveScenarioDialog open initialName="" initialShared={false}
        title="Save scenario as…" onSubmit={() => {}} onCancel={() => {}} />
    );
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('Cancel button fires onCancel', () => {
    const onCancel = vi.fn();
    render(
      <SaveScenarioDialog open initialName="X" initialShared={false}
        title="Save scenario as…" onSubmit={() => {}} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
```

- [ ] **Step 5.1.2: Run — FAIL**

```bash
npx vitest run src/components/financial-model/SaveScenarioDialog.test.tsx
```

- [ ] **Step 5.1.3: Implement**

Path: `src/components/financial-model/SaveScenarioDialog.tsx`

```tsx
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  title: string;
  initialName: string;
  initialShared: boolean;
  onSubmit: (payload: { name: string; isShared: boolean }) => void;
  onCancel: () => void;
}

export function SaveScenarioDialog({ open, title, initialName, initialShared, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initialName);
  const [isShared, setShared] = useState(initialShared);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setShared(initialShared);
    }
  }, [open, initialName, initialShared]);

  if (!open) return null;

  const canSubmit = name.trim().length > 0 && name.trim().length <= 80;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
        <label htmlFor="scenario-name" className="block text-sm text-slate-300 mb-1">Name</label>
        <input
          id="scenario-name"
          autoFocus
          maxLength={80}
          className="w-full text-slate-100 bg-slate-800 border border-slate-700 rounded px-2 py-1 mb-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-slate-300 mb-6">
          <input
            type="checkbox"
            aria-label="Share with RAV team"
            checked={isShared}
            onChange={(e) => setShared(e.target.checked)}
          />
          Share read-only with RAV team
        </label>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button disabled={!canSubmit} onClick={() => onSubmit({ name: name.trim(), isShared })}>Save</Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5.1.4: PASS + commit**

```bash
npx vitest run src/components/financial-model/SaveScenarioDialog.test.tsx
git add src/components/financial-model/SaveScenarioDialog.tsx src/components/financial-model/SaveScenarioDialog.test.tsx
git commit -m "feat(financial-model): SaveScenarioDialog (#550 PR5)"
```

### Task 5.2: `ScenarioActions` state machine

- [ ] **Step 5.2.1: Write the test FIRST**

Path: `src/components/financial-model/ScenarioActions.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScenarioActions } from './ScenarioActions';

const ownScenario = {
  id: 'uuid-own-1',
  owner_id: 'me',
  name: 'My plan',
  multiplier: 'Base' as const,
  overrides: {},
  expense_overrides: [],
  is_shared: false,
  created_at: 't',
  updated_at: 't',
};

const sharedOther = { ...ownScenario, id: 'uuid-shared', owner_id: 'other', is_shared: true };

describe('ScenarioActions (#550 PR5) @p0', () => {
  it('system + no draft: shows only Save As', () => {
    render(
      <ScenarioActions isSystem activeId="system:base" scenario={null} currentUserId="me" isDirty={false}
        onSaveAs={() => {}} onSave={() => {}} onDuplicate={() => {}} onDiscard={() => {}} onToggleShare={() => {}} onDelete={() => {}} />
    );
    expect(screen.getByRole('button', { name: /save as/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /discard/i })).not.toBeInTheDocument();
  });

  it('system + draft: Save As + Discard', () => {
    render(
      <ScenarioActions isSystem activeId="system:base" scenario={null} currentUserId="me" isDirty
        onSaveAs={() => {}} onSave={() => {}} onDuplicate={() => {}} onDiscard={() => {}} onToggleShare={() => {}} onDelete={() => {}} />
    );
    expect(screen.getByRole('button', { name: /save as/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
  });

  it('own + no draft: Duplicate + Share toggle + Delete', () => {
    render(
      <ScenarioActions isSystem={false} activeId="uuid-own-1" scenario={ownScenario} currentUserId="me" isDirty={false}
        onSaveAs={() => {}} onSave={() => {}} onDuplicate={() => {}} onDiscard={() => {}} onToggleShare={() => {}} onDelete={() => {}} />
    );
    expect(screen.getByRole('button', { name: /duplicate/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/share/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('own + draft: Save + Save As + Discard', () => {
    render(
      <ScenarioActions isSystem={false} activeId="uuid-own-1" scenario={ownScenario} currentUserId="me" isDirty
        onSaveAs={() => {}} onSave={() => {}} onDuplicate={() => {}} onDiscard={() => {}} onToggleShare={() => {}} onDelete={() => {}} />
    );
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save as/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
  });

  it('shared by other: Duplicate to my scenarios; no Save, Share, or Delete', () => {
    render(
      <ScenarioActions isSystem={false} activeId="uuid-shared" scenario={sharedOther} currentUserId="me" isDirty={false}
        onSaveAs={() => {}} onSave={() => {}} onDuplicate={() => {}} onDiscard={() => {}} onToggleShare={() => {}} onDelete={() => {}} />
    );
    expect(screen.getByRole('button', { name: /duplicate to my scenarios/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/share/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('Save click fires onSave', () => {
    const onSave = vi.fn();
    render(
      <ScenarioActions isSystem={false} activeId="uuid-own-1" scenario={ownScenario} currentUserId="me" isDirty
        onSaveAs={() => {}} onSave={onSave} onDuplicate={() => {}} onDiscard={() => {}} onToggleShare={() => {}} onDelete={() => {}} />
    );
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSave).toHaveBeenCalled();
  });
});
```

- [ ] **Step 5.2.2: Run — FAIL**

```bash
npx vitest run src/components/financial-model/ScenarioActions.test.tsx
```

- [ ] **Step 5.2.3: Implement**

Path: `src/components/financial-model/ScenarioActions.tsx`

```tsx
import { Button } from '@/components/ui/button';
import type { FinancialModelScenario } from '@/hooks/useFinancialModelScenarios';

interface Props {
  isSystem: boolean;
  activeId: string;
  scenario: FinancialModelScenario | null;
  currentUserId: string | null | undefined;
  isDirty: boolean;
  onSave: () => void;
  onSaveAs: () => void;
  onDuplicate: () => void;
  onDiscard: () => void;
  onToggleShare: (next: boolean) => void;
  onDelete: () => void;
}

export function ScenarioActions(props: Props) {
  const { isSystem, scenario, currentUserId, isDirty } = props;
  const isOwn = !isSystem && scenario && scenario.owner_id === currentUserId;
  const isSharedByOther = !isSystem && scenario && scenario.owner_id !== currentUserId;

  return (
    <div className="flex items-center gap-2">
      {/* System scenario */}
      {isSystem && (
        <>
          <Button size="sm" variant="outline" onClick={props.onSaveAs}>Save as…</Button>
          {isDirty && <Button size="sm" variant="ghost" onClick={props.onDiscard}>Discard</Button>}
        </>
      )}

      {/* Own scenario */}
      {isOwn && (
        <>
          {isDirty && <Button size="sm" onClick={props.onSave}>Save</Button>}
          <Button size="sm" variant="outline" onClick={props.onSaveAs}>Save as…</Button>
          {isDirty && <Button size="sm" variant="ghost" onClick={props.onDiscard}>Discard</Button>}
          {!isDirty && <Button size="sm" variant="outline" onClick={props.onDuplicate}>Duplicate</Button>}
          {!isDirty && (
            <label className="flex items-center gap-1.5 text-xs text-slate-300">
              <input
                type="checkbox"
                aria-label="Share read-only with RAV team"
                checked={scenario?.is_shared ?? false}
                onChange={(e) => props.onToggleShare(e.target.checked)}
              />
              Share
            </label>
          )}
          {!isDirty && <Button size="sm" variant="ghost" onClick={props.onDelete}>Delete</Button>}
        </>
      )}

      {/* Shared by someone else */}
      {isSharedByOther && (
        <Button size="sm" variant="outline" onClick={props.onDuplicate}>Duplicate to my scenarios</Button>
      )}
    </div>
  );
}
```

- [ ] **Step 5.2.4: PASS + commit**

```bash
npx vitest run src/components/financial-model/ScenarioActions.test.tsx
git add src/components/financial-model/ScenarioActions.tsx src/components/financial-model/ScenarioActions.test.tsx
git commit -m "feat(financial-model): ScenarioActions state machine (#550 PR5)"
```

### Task 5.3: Wire everything into the dashboard + integration test

- [ ] **Step 5.3.1: Modify `FinancialModelDashboard.tsx`**

Add state for the save dialog + handlers:

```tsx
import { ScenarioActions } from '@/components/financial-model/ScenarioActions';
import { SaveScenarioDialog } from '@/components/financial-model/SaveScenarioDialog';
import { useToast } from '@/hooks/use-toast';

// in component:
const { create, update, remove } = useFinancialModelScenarios();
const { toast } = useToast();
const [saveDialog, setSaveDialog] = useState<{ open: boolean; mode: 'save-as' | 'duplicate' }>({ open: false, mode: 'save-as' });

const handleSave = async () => {
  if (!inputs.active) return;
  try {
    await update(inputs.active.id, {
      overrides: { ...inputs.active.overrides, ...draft.draft.overrides },
      expense_overrides: dedupeExpenseOverrides([...(inputs.active.expense_overrides ?? []), ...draft.draft.expenseOverrides]),
    });
    draft.clear();
    toast({ title: 'Scenario saved' });
  } catch (err) {
    toast({ title: 'Failed to save', description: (err as Error).message, variant: 'destructive' });
  }
};

const handleSaveAs = async ({ name, isShared }: { name: string; isShared: boolean }) => {
  try {
    const inserted = await create({
      name,
      multiplier: inputs.multiplier,
      overrides: { ...(inputs.active?.overrides ?? {}), ...draft.draft.overrides },
      expense_overrides: dedupeExpenseOverrides([...(inputs.active?.expense_overrides ?? []), ...draft.draft.expenseOverrides]),
      is_shared: isShared,
    });
    if (inserted) {
      setActiveId(inserted.id);
      draft.clear();
      toast({ title: 'Scenario created' });
    }
  } catch (err) {
    toast({ title: 'Failed to create', description: (err as Error).message, variant: 'destructive' });
  } finally {
    setSaveDialog({ open: false, mode: 'save-as' });
  }
};

const handleDuplicate = async () => {
  setSaveDialog({ open: true, mode: 'duplicate' });
};

const handleToggleShare = async (next: boolean) => {
  if (!inputs.active) return;
  try {
    await update(inputs.active.id, { is_shared: next });
    toast({ title: next ? 'Shared with RAV team' : 'Sharing turned off' });
  } catch (err) {
    toast({ title: 'Failed to update sharing', description: (err as Error).message, variant: 'destructive' });
  }
};

const handleDelete = async () => {
  if (!inputs.active) return;
  if (!confirm(`Delete scenario "${inputs.active.name}"? This cannot be undone.`)) return;
  try {
    await remove(inputs.active.id);
    setActiveId(null);
    toast({ title: 'Scenario deleted' });
  } catch (err) {
    toast({ title: 'Failed to delete', description: (err as Error).message, variant: 'destructive' });
  }
};

function dedupeExpenseOverrides(arr: { category: string; item: string; amount?: number }[]) {
  const map = new Map<string, { category: string; item: string; amount?: number }>();
  for (const e of arr) map.set(`${e.category}|${e.item}`, e);
  return Array.from(map.values());
}
```

Mount the buttons + dialog (replace the existing header layout for the picker section):

```tsx
<div className="flex items-center gap-3">
  <ScenarioPicker
    scenarios={scenarios}
    currentUserId={user?.id ?? null}
    activeId={activeId}
    onChange={setActiveId}
  />
  <ScenarioActions
    isSystem={inputs.isSystem}
    activeId={activeId}
    scenario={inputs.active}
    currentUserId={user?.id ?? null}
    isDirty={inputs.isDirty}
    onSave={handleSave}
    onSaveAs={() => setSaveDialog({ open: true, mode: 'save-as' })}
    onDuplicate={handleDuplicate}
    onDiscard={() => draft.clear()}
    onToggleShare={handleToggleShare}
    onDelete={handleDelete}
  />
</div>

<SaveScenarioDialog
  open={saveDialog.open}
  title={saveDialog.mode === 'duplicate' ? 'Duplicate scenario' : 'Save scenario as…'}
  initialName={saveDialog.mode === 'duplicate' ? `${inputs.active?.name ?? 'Base'} (copy)` : ''}
  initialShared={false}
  onSubmit={handleSaveAs}
  onCancel={() => setSaveDialog({ open: false, mode: 'save-as' })}
/>
```

- [ ] **Step 5.3.2: Integration test**

Path: `src/pages/FinancialModelDashboard.test.tsx`

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FinancialModelDashboard from './FinancialModelDashboard';

vi.mock('@/hooks/usePageMeta', () => ({ usePageMeta: () => {} }));
vi.mock('@/components/Header', () => ({ default: () => <header /> }));
vi.mock('@/components/Footer', () => ({ default: () => <footer /> }));
vi.mock('@/components/executive/DashboardTabs', () => ({ DashboardTabs: () => <nav /> }));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'me' }, isRavTeam: () => true, isLoading: false }),
}));

const mockScenarios = [
  { id: 'uuid-own', owner_id: 'me', name: 'My plan', multiplier: 'Base', overrides: { gOwnGrowth: 0.35 }, expense_overrides: [], is_shared: false, created_at: 't', updated_at: 't' },
];

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: 'me' } } }) },
    rpc: () => Promise.resolve({ data: { rate: 12, pro_discount: 2, business_discount: 4 }, error: null }),
    from: () => ({
      select: () => ({ order: () => Promise.resolve({ data: mockScenarios, error: null }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: mockScenarios[0], error: null }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: mockScenarios[0], error: null }) }) }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
  },
}));

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <FinancialModelDashboard />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

beforeEach(() => { localStorage.clear(); });

describe('FinancialModelDashboard integration (#550 PR5) @p0', () => {
  it('switching to a user scenario triggers projection with that scenario overrides', async () => {
    renderPage();
    // Open picker
    fireEvent.click(await screen.findByRole('button', { name: /Base/i }));
    fireEvent.click(await screen.findByText('My plan'));
    await waitFor(() => expect(screen.getByText(/Editing/i)).toBeInTheDocument());
  });

  it('editing a field shows drift banner', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Base/i }));
    fireEvent.click(await screen.findByText('My plan'));
    // gOwnGrowth = 0.35 vs baseline 0.20 — banner should appear
    await waitFor(() => expect(screen.getByText(/differ from baseline/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 5.3.3: Type check + run all tests**

```bash
npx tsc --noEmit
npm run test -- --run
```

Expected: all pass. New test count delta in the +50-60 range. P0 tests all green.

- [ ] **Step 5.3.4: Smoke test full flow**

```bash
npm run dev
```

End-to-end check:
1. Sign in as a RAV team user.
2. Picker shows Base (selected) + Conservative + Optimistic.
3. Edit `gOwnGrowth` → banner appears → "Save as…" → name "Test PR5" → uncheck share → Save. New scenario appears in picker under "Mine".
4. Edit another input. Click "Save" → toast → reload → values persisted.
5. Toggle "Share" → reload in another tab as a second RAV user (or simulate) → scenario visible under "Shared".
6. Click "Duplicate to my scenarios" on a shared one → new owned copy appears.
7. "Delete" prompts confirm → scenario removed.

Ctrl-C.

- [ ] **Step 5.3.5: Commit**

```bash
git add src/pages/FinancialModelDashboard.tsx src/pages/FinancialModelDashboard.test.tsx
git commit -m "feat(financial-model): Save/Save As/Duplicate/Share + integration test (#550 PR5)"
```

### Task 5.4: Open PR5

- [ ] **Step 5.4.1: Push + open**

```bash
git push origin feature/stage-2c-financial-model
gh pr create --repo rent-a-vacation/rav-website --base dev --head feature/stage-2c-financial-model --title "feat(financial-model): #550 PR5 — Save / Save As / Duplicate / Share + polish" --body "Last vertical slice for Stage 2c. Adds full persistence flow:

- ScenarioActions state machine (system / own clean / own dirty / shared-by-other)
- SaveScenarioDialog (name + share toggle)
- Save / Save As / Duplicate / Share toggle / Delete handlers
- Integration test for the page

After this lands on dev, open the release PR (dev → main) which pushes migration 081 to PROD.

Test plan:
- [x] All ScenarioActions state branches covered
- [x] SaveScenarioDialog submit + cancel + disabled-on-empty
- [x] Integration test passes (mocked supabase)
- [x] Smoke: create → save → reload → persisted; share toggle; duplicate from shared; delete"
```

- [ ] **Step 5.4.2: After all 5 PRs merged, open the release PR**

```bash
git checkout dev
git pull --ff-only origin dev
gh pr create --repo rent-a-vacation/rav-website --base main --head dev --title "release: #550 Stage 2c — financial-model interactive editing + scenarios" --body "$(cat <<'EOF'
## Summary

Phase 2 Stage 2c — `/executive-dashboard/financial-model` is now interactive. Founders can edit Category B inputs (growth, expenses, hiring, unit econ, etc.) per-user, save scenarios to Supabase, optionally share read-only with RAV team. Drift indicator + reset at all three granularities. Live commission read from DB (Category A).

5 PRs accumulated on `feature/stage-2c-financial-model`:
- PR1: schema + hooks + commission DB switch
- PR2: picker + read-only accordions
- PR3: editable inputs + draft + per-input dot
- PR4: drift banner + reset + diff dialog
- PR5: Save / Save As / Duplicate / Share + polish

## Migration deploy plan

This release PR pushes migration `081_financial_model_scenarios.sql` to PROD via:

```bash
npx supabase db push --include-all --linked --project-ref xzfllqndrlmhclqfybew
```

(Run after merge; see /sdlc Phase 5.)

## Test plan

- [x] All ~50 new unit/integration tests pass
- [x] `npx tsc --noEmit` clean
- [x] `npm run build` clean
- [x] Smoke test on Vercel preview (`dev` branch): create scenario → edit → save → reload → persist; share + duplicate; delete; reset all
- [x] Migration 081 verified applied on DEV with correct RLS policies

## Spec
- `docs/superpowers/specs/2026-05-20-financial-model-stage-2c-design.md`
- `docs/superpowers/plans/2026-05-20-financial-model-stage-2c.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5.4.3: After user approves release PR + CI green, merge + apply prod migration**

```bash
gh pr merge <release-pr-number> --repo rent-a-vacation/rav-website --merge
npx supabase db push --include-all --linked --project-ref xzfllqndrlmhclqfybew
```

---

## Post-release: session-close checklist (`/sdlc` Phase 6)

- [ ] **Step 6.1: Close issue #550 with business-language summary**

```bash
gh issue close 550 --repo rent-a-vacation/rav-website --comment "Completed: Financial model dashboard is now fully interactive. RAV team members can edit growth assumptions, expenses, hiring plans, and unit-economics inputs directly in the browser without opening the .xlsx. Save personal scenarios to Supabase, optionally share read-only with the team. Drift indicator + reset (per-input / per-section / all) makes recovering from a bad tweak easy. Commission rate is now read live from the DB so the financial model and the live booking engine can never disagree.

Technical: migration 081_financial_model_scenarios (RLS gated to RAV team, read-only share semantics). New components in src/components/financial-model/ + new hooks in src/hooks/. calc.ts refactored backwards-compatibly to accept ModelInputs + CommissionRate args. ~55 new tests across 5 PRs."
```

- [ ] **Step 6.2: Update `docs/PRIORITY-ROADMAP.md`** — remove Stage 2c from Tier A, add revision row "May DD, 2026 — Session NN: Stage 2c (#550) shipped end-to-end (5 PRs, ~55 tests, migration 081 to DEV+PROD). Next-session pickup: Stage 2d (#551)."

- [ ] **Step 6.3: Update `docs/PROJECT-HUB.md`** — extend Session handoff; bump test count + migration count in Platform Status.

- [ ] **Step 6.4: Update `docs/testing/TESTING-STATUS.md`** — new total test count.

- [ ] **Step 6.5: Update `docs/financials/README.md`** — note that the web is now the primary editing surface for Category B inputs; CLI baseline regen still works.

- [ ] **Step 6.6: Run docs-sync check**

```bash
npm run docs:sync-check
```

Expected: 6 OK.

- [ ] **Step 6.7: Auto-memory updates** — none required unless a surprising convention came up during implementation.

- [ ] **Step 6.8: Commit doc updates + push to dev**

```bash
git add docs/
git commit -m "docs: session close for Stage 2c (#550) — PRIORITY-ROADMAP + PROJECT-HUB + TESTING-STATUS + financials README"
git push origin dev
```

---

## Verification — full test suite + build

After PR5 merges to dev and before opening the release PR:

```bash
npm run test -- --run
npm run test:p0
npx tsc --noEmit
npm run build
```

Expected: all green, build clean. If any failures, fix on `dev` before opening release PR.

---

## Self-review checklist

- [x] **Spec coverage:** every section of [the spec](../specs/2026-05-20-financial-model-stage-2c-design.md) traced to one or more tasks:
  - §3 Architecture → PR1 calc refactor + PR2 wiring
  - §4 Data model → PR1 Task 1.1 migration
  - §5 Hooks → PR1 1.4, 1.5 + PR3 3.2, 3.3
  - §6 Components → PR2 2.2-2.5 + PR3 3.4 + PR4 4.1-4.2 + PR5 5.1-5.2
  - §7 calc refactor → PR1 1.3
  - §8 Drift behavior → PR3 (dots + section reset) + PR4 (banner + diff + reset all)
  - §9 Save/Save As/Duplicate/Share → PR5
  - §10 Out of scope → not implemented (explicit deferral)
  - §11 Testing → tests in every task; integration test in PR5
  - §12 PR breakdown → matched 1:1 with the 5 PRs above
  - §13 Error handling → toasts on mutation failures in PR5; useCommissionRate fallback already wired; orphan scenario id resolves to Base
  - §14 Docs to update → session-close steps 6.1-6.6
  - §15 Risks → calc regression test guards #1; PR3 hook tests cover #2; RLS migration policies cover #3-4; applyOverrides returns new array (#5)
- [x] **Placeholder scan:** no TBD / TODO / "fill in" / "add validation" — every step shows the actual code or command.
- [x] **Type consistency:** `ModelInputs`, `CommissionRate`, `FinancialModelScenario`, `Overrides`, `DraftState` defined once and referenced consistently across hooks + components. `setActiveId` signature matches between `useActiveScenario` and `ScenarioPicker`. `applyOverrides` / `mergeOverrideLayers` / `computeDirtyKeys` consistently named throughout.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-20-financial-model-stage-2c.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session using `executing-plans`, batch execution with checkpoints.

Which approach?
