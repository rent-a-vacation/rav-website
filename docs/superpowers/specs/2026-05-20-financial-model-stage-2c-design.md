---
last_updated: "2026-05-20T00:00:00"
change_ref: "cfab02d"
change_type: "spec-stage-2c"
status: "active"
---
# Design Spec — Phase 2 Stage 2c: Interactive editing + per-user scenarios on `/executive-dashboard/financial-model`

**Issue:** [#550](https://github.com/rent-a-vacation/rav-website/issues/550)
**Sibling:** [#551 (Stage 2d)](https://github.com/rent-a-vacation/rav-website/issues/551), [#545 (Stage 2b — post-launch)](https://github.com/rent-a-vacation/rav-website/issues/545)
**References:** DEC-042 (Financial Model as distinct web tool), DEC-043 (Commission rate runtime architecture)
**Effort:** 4-6 days, 5 vertical-slice PRs on a feature branch
**Status:** Design approved 2026-05-20. Awaiting implementation plan via `writing-plans` skill.

---

## 1. Goal

Make the `/executive-dashboard/financial-model` page **functionally equivalent to editing amber cells in `RAV_Financial_Model.xlsx`** — and persistent (saved scenarios in Supabase). After Stage 2c + 2d ship, founders stop opening the `.xlsx` for weekly tweaks; the web becomes the primary tool.

## 2. Locked decisions

| # | Decision | Source |
|---|----------|--------|
| D1 | **Unified scenario picker** — Conservative / Base / Optimistic are virtual system-owned scenarios alongside user scenarios in one dropdown. They are NOT seeded as DB rows. | Brainstorm Q1 |
| D2 | **Inline accordions below KPIs** for editable inputs. 8 sections + 1 EXPENSES section. KPIs + trajectory table stay always-visible above. | Brainstorm Q2 |
| D3 | **All three reset granularities** — per-input `[×]`, per-section button, scenario-wide "Reset all" in drift banner. | Brainstorm Q3 |
| D4 | **Read-only share** — shared scenarios visible to all RAV team in their picker; only the author can modify. Non-author sees "Duplicate to my scenarios" button. | Brainstorm Q4 |
| D5 | **5 vertical-slice PRs** on `feature/stage-2c-financial-model` off `dev`. Each PR independently demoable. Release to `main` after PR5 lands on dev. | Brainstorm Q5 |
| D6 | **Two categories of input** — Category A (live config, commission rate) reads from DB; Category B (forecast assumptions) editable via sparse Supabase overrides. | DEC-042 revision |
| D7 | **localStorage drafts** survive refresh, do not sync across devices. | DEC-042 revision |
| D8 | **`data.ts` stays canonical baseline.** Web edits NEVER mutate it. CLI `npm run financials:build` always produces baseline `.xlsx` unless given a scenario (Stage 2d work). | DEC-042 revision |
| D9 | **Baseline updates remain code-edit only.** No "promote scenario to baseline" admin button. | DEC-042 revision |

## 3. Architecture

### 3.1 Page composition (top to bottom)

1. Forward-projection amber banner (existing — `Stage 2a`).
2. **NEW: Header row** with scenario picker (left) + drift banner (right, conditional on overrides).
3. KPI cards (existing — recompute live from merged inputs).
4. Commission rate breakdown card (existing — values now sourced from DB via `useCommissionRate`).
5. Monthly trajectory table (existing — recomputes live).
6. **NEW: 8 inline accordion sections** for Category B inputs — PLATFORM (excluding commission rows), SUBSCRIPTIONS, GROWTH, SCENARIOS (multiplier values), HORIZON, RESERVES, HIRING, UNIT_ECON.
7. **NEW: EXPENSES accordion** with table-shaped editor (amount column only in Stage 2c).
8. Excel-export card (existing — Stage 2d will replace the CLI-only note with actual download buttons).

### 3.2 Data flow

```
src/lib/financial-model/data.ts (canonical baseline)
                  ↓
              ┌───┴────────┐
              │             │
         applyOverrides  applyOverrides
              │             │
              ↓             ↓
         scenario.overrides (DB)
                            │
                       applyOverrides
                            │
                            ↓
                  localStorage draft
                            ↓
                  useActiveScenarioInputs()
                            ↓
            project(scenario.multiplier, inputs, commissionRate)
                            ↓
              KPI cards + Trajectory table + Commission tile
```

Merge is **sparse**: only keys present in each override layer replace baseline. Adding a new `InputRow` to `data.ts` requires no migration.

### 3.3 Commission rate switch (Category A)

`FinancialModelDashboard.tsx` calls `useCommissionRate()` (existing — issue #510). The rate is passed into `project(...)` so the financial model uses the **live DB value** instead of the build-time `DEFAULT_COMMISSION` import. This closes the drift surface where the financial model previously could disagree with the live `pricing.ts` engine.

Category A inputs are rendered read-only in the PLATFORM accordion with a "managed by admin → [System Settings](/admin/settings)" link.

## 4. Data model

### 4.1 Migration `081_financial_model_scenarios.sql`

```sql
CREATE TABLE financial_model_scenarios (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              text NOT NULL,                       -- "Sujit Q3 plan"
  multiplier        text NOT NULL DEFAULT 'Base',        -- 'Conservative' | 'Base' | 'Optimistic'
  overrides         jsonb NOT NULL DEFAULT '{}'::jsonb,  -- { gOwnGrowth: 0.25, hEngMonth: 6, ... }
  expense_overrides jsonb NOT NULL DEFAULT '[]'::jsonb,  -- sparse ExpenseRow patches
  is_shared         boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fms_multiplier_chk CHECK (multiplier IN ('Conservative', 'Base', 'Optimistic')),
  CONSTRAINT fms_name_len CHECK (char_length(name) BETWEEN 1 AND 80),
  CONSTRAINT fms_name_unique_per_owner UNIQUE (owner_id, name)
);

CREATE INDEX idx_fms_owner   ON financial_model_scenarios(owner_id);
CREATE INDEX idx_fms_shared  ON financial_model_scenarios(is_shared) WHERE is_shared = true;

ALTER TABLE financial_model_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY fms_select ON financial_model_scenarios FOR SELECT
  USING (is_rav_team(auth.uid()) AND (owner_id = auth.uid() OR is_shared = true));
CREATE POLICY fms_insert ON financial_model_scenarios FOR INSERT
  WITH CHECK (is_rav_team(auth.uid()) AND owner_id = auth.uid());
CREATE POLICY fms_update ON financial_model_scenarios FOR UPDATE
  USING  (is_rav_team(auth.uid()) AND owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY fms_delete ON financial_model_scenarios FOR DELETE
  USING (is_rav_team(auth.uid()) AND owner_id = auth.uid());

CREATE TRIGGER set_financial_model_scenarios_updated_at
  BEFORE UPDATE ON financial_model_scenarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 Override JSON shapes

**`overrides`** — flat key→value map keyed by existing `InputRow.name`:

```json
{
  "gOwnGrowth": 0.25,
  "gBookPerOwn": 0.40,
  "hEngMonth": 6,
  "uRampMonths": 4
}
```

**`expense_overrides`** — array of sparse expense patches keyed by `(category, item)`:

```json
[
  { "category": "Marketing & Launch", "item": "Conference exhibitor / booth fee", "amount": 3000 },
  { "category": "Compliance & Tax", "item": "CPA — annual tax filing (Form 1120 + DE)", "amount": 2500 }
]
```

Stage 2c scopes expense edits to **`amount` field only**. Adding/removing expense rows is out of scope (see §10).

### 4.3 System scenarios

System scenarios are **virtual constants** in `src/lib/financial-model/system-scenarios.ts`, not DB rows:

```ts
export const SYSTEM_SCENARIOS = [
  { id: 'system:base',         name: 'Base',         multiplier: 'Base',         system: true },
  { id: 'system:conservative', name: 'Conservative', multiplier: 'Conservative', system: true },
  { id: 'system:optimistic',   name: 'Optimistic',   multiplier: 'Optimistic',   system: true },
] as const;
```

This avoids seeded DB rows that users could accidentally try to edit, and keeps the migration idempotent.

## 5. Hooks (`src/hooks/`)

| Hook | Returns | Notes |
|------|---------|-------|
| `useFinancialModelScenarios()` | `{ scenarios, isLoading, create, update, delete, duplicate }` | List = own + shared. Mutations use React Query optimistic updates. |
| `useActiveScenario()` | `{ activeId, setActiveId }` | localStorage-backed (`fms-active-scenario`). Falls back to `system:base` if stored id is missing. |
| `useScenarioDraft(scenarioId)` | `{ draft, setField, resetField, resetSection, resetAll, clear, isDirty }` | localStorage-backed per scenario id. Key format: `fms-draft:<id>` (e.g. `fms-draft:system:base` for the Base system scenario, `fms-draft:<uuid>` for user scenarios). |
| `useActiveScenarioInputs()` | `{ platform, subscriptions, growth, scenarios, horizon, reserves, hiring, unitEcon, expenses, expenseOverrides, multiplier, dirtyKeys: Set<string>, isDirty: boolean }` | The composed view-model. Memoized on baseline + scenario.overrides + draft. |

## 6. Components (`src/components/financial-model/`)

| Component | Purpose |
|-----------|---------|
| `ScenarioPicker.tsx` | Single dropdown. Section dividers between system / mine / shared. Shared scenarios show author + `[shared]` badge. |
| `DriftBanner.tsx` | Renders only when `dirtyKeys.size > 0`. "Editing 'X' — N inputs differ from baseline. [Show diff] [Reset all]". |
| `DiffDialog.tsx` | Modal listing every dirty field with baseline → current values + per-field reset `[×]`. |
| `InputSectionAccordion.tsx` | Generic shell — header with title + dirty count + "Reset section" button (conditional); rows visible when expanded. |
| `EditableInputRow.tsx` | Label, input control sized by `fmt`, dot indicator, per-input `[×]` reset, tooltip note. Read-only mode for shared scenarios viewed by non-owner. |
| `ExpenseEditorSection.tsx` | Special accordion with table-shaped editor for EXPENSES amount column. Read-only category/item/frequency/timing. |
| `SaveScenarioDialog.tsx` | Shared by Save As + Duplicate. Name input + share toggle + Cancel/Save. |

## 7. `calc.ts` refactor

```ts
// Before
export function project(scenario: Scenario = 'Base'): ProjectionResult;

// After
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

export function project(
  scenario: Scenario = 'Base',
  inputs?: ModelInputs,                 // defaults to canonical baseline imports
  commissionRate?: CommissionRate       // defaults to DEFAULT_COMMISSION
): ProjectionResult;
```

The `val(rows, name)` lookup pattern is unchanged — it now operates on `inputs.platform` etc. instead of imported `PLATFORM` etc.

**Backwards-compatibility check**: `project('Base')` with no second/third argument returns the exact same numbers as today. Regression test in PR1.

## 8. Drift behavior

A field is dirty when its current merged value differs from canonical baseline. Dirty set is computed once per render in `useActiveScenarioInputs()` and consumed by:

- Drift banner — `dirtyKeys.size > 0` toggles visibility; size displayed.
- Per-section dot count — `dirtyKeys.intersection(sectionKeys).size`.
- Per-input dot — `dirtyKeys.has(row.name)`.
- "Reset section" button — only renders when a section has at least one dirty field.
- `[×]` per-input reset — only renders when that field is dirty.

**Identical-to-baseline edit removes from dirty set** (no "you edited this" history concept — only the diff matters).

**Reset never mutates a saved scenario silently.** All edits start as localStorage draft. To revert the saved scenario itself, user explicitly clicks Save after resetting — that writes empty overrides back to DB.

## 9. Save / Save As / Duplicate / Share state machine

Header action area changes based on what's selected and whether a draft exists:

| Context | Actions |
|---------|---------|
| System scenario (Base/Conservative/Optimistic), no draft | `[Save As…]` |
| System scenario, draft dirty | `[Save As…]` `[Discard]` |
| Own scenario, no draft | `[Edit]` `[Duplicate]` `[Share ▢/☑]` `[Delete]` |
| Own scenario, draft dirty | `[Save]` `[Save As…]` `[Discard]` |
| Shared scenario (someone else's) | `[Duplicate to my scenarios]` (read-only inputs) |

Actions:

- **Save** — UPDATE `scenarios.overrides` + `expense_overrides` + `multiplier`. Clear localStorage draft.
- **Save As…** — open dialog → name + share toggle → INSERT new scenario → clear draft → switch picker to new scenario.
- **Duplicate** — clone overrides + multiplier into a new owned scenario (named "<original> (copy)").
- **Share toggle** — instant UPDATE on `is_shared`. Visible only on owned scenarios.
- **Discard** — clear draft; no DB change.

## 10. Out of scope (file follow-ups if confirmed)

| Item | Defer to |
|------|----------|
| `.xlsx` download from web | Stage 2d (#551) |
| Live actuals overlay | Stage 2b (#545, post-launch) |
| "Promote scenario to baseline" admin button | Until baseline-change frequency observable |
| Adding / removing expense rows | New issue (Stage 2c is amount-only) |
| Audit log for share-toggle flips | New issue |
| Cross-device sync of active-scenario selection | New issue (`user_preferences` row) |
| Scenario comments / annotations | Not scoped |
| Notification when someone duplicates your shared scenario | Not scoped |
| Multiplier-editing inside a scenario (currently fixed at Save As / Duplicate time) | Future enhancement |

## 11. Testing strategy

Per Tests-With-Features policy. Estimated **~50-60 new tests** across the 5 PRs.

### 11.1 Unit / pure logic
- `overrides.test.ts` — `applyOverrides` returns baseline untouched when overrides empty; replaces only matching keys; preserves row order + metadata; sparse overrides don't add new keys.
- `calc.test.ts` extension — `project(scenario, inputs)` returns same numbers as `project(scenario)` when inputs omitted (regression guard); applied overrides measurably change projection; commission-rate parameter wins over build-time default.

### 11.2 Hooks
- `useFinancialModelScenarios.test.ts` — list returns own + shared; create assigns `owner_id`; update only succeeds for owner; non-RAV user gets empty list (mocked RLS).
- `useActiveScenario.test.ts` — defaults to system Base; persists to localStorage; restores on remount; falls back to Base if stored id missing.
- `useActiveScenarioInputs.test.ts` — merge precedence (baseline ← scenario ← draft); dirty-key set accuracy; identical-to-baseline edit removes from dirty; switching scenarios swaps draft surface.
- `useScenarioDraft.test.ts` — set/reset field; reset section; clear; survives remount.

### 11.3 Components
- `ScenarioPicker` — renders system + own + shared with dividers + author labels; "Duplicate" action only shows on shared/non-owned.
- `DriftBanner` — hides when no dirty keys; shows correct count; Reset all clears draft; Show diff opens dialog.
- `DiffDialog` — lists dirty fields; per-field reset.
- `EditableInputRow` — dot appears when dirty; `[×]` only when dirty; typing baseline value clears dot.
- `InputSectionAccordion` — collapses/expands; section dirty count is intersection; "Reset section" only renders when section has dirty fields.

### 11.4 Integration
- `FinancialModelDashboard.test.tsx` — switching scenario in picker recomputes KPIs; editing `gOwnGrowth` recomputes; Save As flow → new scenario appears → reselect shows persisted values.

### 11.5 P0 tags
- Scenario CRUD hook tests + override-merge tests get `@p0` (touch financial-calc paths).

### 11.6 RLS
- Verified via existing `supabase test` scaffolding. No new edge functions in Stage 2c.

## 12. PR breakdown — 5 vertical slices

Feature branch: `feature/stage-2c-financial-model` off `dev`. Each PR independently demoable.

### PR1 — Schema + hooks + commission DB switch (~1 day)
- Migration `081_financial_model_scenarios.sql`
- `useFinancialModelScenarios`, `useActiveScenario` hooks
- `project()` refactored to accept `inputs` + `commissionRate`
- `useCommissionRate()` wired into `FinancialModelDashboard.tsx`
- **No visible UI change** — picker still shows existing 3-toggle.
- Commission rates in breakdown card now match live prod values exactly.
- Migration applied to **DEV only**; PROD held until PR5 release.
- Tests: hook + calc regression.

### PR2 — Picker + accordions (read-only) (~1 day)
- `ScenarioPicker` replaces 3-toggle.
- `system-scenarios.ts` constants.
- 8 + 1 accordion components rendered below trajectory, collapsed by default.
- Each input rendered read-only.
- KPIs/table recompute on scenario change (system scenarios only — no edits).
- Tests: `ScenarioPicker`, `InputSectionAccordion` structure.

### PR3 — Editable inputs + per-input dot (~1 day)
- `EditableInputRow` replaces read-only display.
- `useScenarioDraft` hook (localStorage).
- `useActiveScenarioInputs` merge hook.
- `applyOverrides` + `mergeScenarioInputs` pure functions.
- Per-input dot rendering; dirty-key memo.
- `ExpenseEditorSection` (amount column only).
- Tests: draft hook, merge logic, `EditableInputRow`, `ExpenseEditorSection`.

### PR4 — Drift banner + reset + diff dialog (~1 day)
- `DriftBanner` (count + Show diff + Reset all).
- `DiffDialog` (per-field reset).
- Per-section "Reset section" button on accordion headers.
- Per-input `[×]` reset.
- Tests: banner render, dialog, reset at each scope.

### PR5 — Save / Save As / Duplicate / Share + polish (~1 day)
- `SaveScenarioDialog` (Save As + Duplicate).
- Header action-button state machine.
- Share toggle → `is_shared` UPDATE.
- "Duplicate to my scenarios" for shared scenarios.
- Discard draft button.
- Tests: full save / save-as / duplicate / share integration.
- **Push migration 081 to PROD** in the release PR after this lands on dev.

### Release
After all 5 PRs land on `dev` and Vercel-preview QA passes, open `dev → main` release PR. User approves explicitly before merge (per `/sdlc` Phase 5).

## 13. Error handling

| Failure | Behavior |
|---------|----------|
| DB read failure on `useFinancialModelScenarios` | Empty list + toast; system scenarios still work. |
| `useCommissionRate` RPC failure | Falls back to `DEFAULT_COMMISSION` (already wired in #510). |
| Active scenario id present in localStorage but scenario deleted/unshared | Picker falls back to `system:base` on next render; draft preserved keyed by orphaned id (acceptable; user can clear manually). |
| localStorage write failure (quota / disabled) | Silent failure on persist; in-memory draft still works for the session. |
| Concurrent edits across tabs (one user, two tabs) | Last write wins on Save. No locks. Acceptable for MVP. |
| Stale React Query cache after another user shares/unshares | Eventual consistency on next refetch (5-min default stale). User can manually refresh. |

## 14. Docs to update at session close

Per `/sdlc` Phase 6 checklist:

- `docs/PRIORITY-ROADMAP.md` — remove Stage 2c from Tier A, add revision entry.
- `docs/PROJECT-HUB.md` — extend Session handoff; update Platform Status block (test count, migration 081).
- `docs/testing/TESTING-STATUS.md` — bump test count.
- `docs/LAUNCH-READINESS.md` — if any new env flag introduced (none expected).
- `docs/ARCHITECTURE.md` — narrative line on commission DB read in financial model.
- `src/flows/` — `executive-dashboard` manifest update (new accordion routes — N/A since same route; no manifest change needed).
- `docs/financials/README.md` — describe new web-edit workflow + that CLI remains canonical baseline.
- Close #550 with business-language summary referencing PRs in Phase 6.

## 15. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| `calc.ts` refactor introduces a subtle numeric drift vs. CLI `.xlsx` | PR1 regression test: `project('Base')` numbers byte-identical to current. CI fails if any 24-mo KPI changes. |
| Sparse-override merge has a precedence bug | PR3 hook test covers all 3 layers (baseline ← scenario ← draft) explicitly. |
| Migration 081 RLS allows non-RAV access | Migration test asserts both positive (RAV user can SELECT own + shared) and negative (non-RAV user gets zero rows). |
| Shared scenario edit attempts by non-owner succeed somehow | PR5 integration test: simulate non-owner UPDATE → expect RLS rejection. |
| `data.ts` accidentally mutated by web code | `applyOverrides` returns new array via `.map()`; never assigns into original. Test: assert baseline reference unchanged after merge. |

---

**Approval status:** Design approved by user 2026-05-20 (this brainstorm session). Spec written + self-reviewed inline. Awaiting one final review pass before invoking `writing-plans` skill for the implementation plan.
