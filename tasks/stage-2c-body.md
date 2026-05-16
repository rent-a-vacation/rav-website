## Context

`/executive-dashboard/financial-model` is **view-only** today (Stage 2a, shipped Session ~65). Forecast trajectory + scenario toggle + KPI cards all work, but inputs are read-only — to change assumptions you must edit `src/lib/financial-model/data.ts` and rebuild the .xlsx via `npm run financials:build`.

This issue makes the web tool **functionally equivalent to editing amber cells in the .xlsx** — and persistent (saved scenarios in Supabase).

**Resequenced ahead of Stage 2b (#545) per Session 68 close discussion** because:
- Pre-launch posture means live-actuals overlay (2b) has nothing to overlay until launch (Month 5+)
- 2c removes daily friction NOW (founders open .xlsx weekly to tweak assumptions)
- Building 2b before launch means dev-testing against `actuals = 0` which doesn't validate the feature
- Once 2c + 2d ship, the .xlsx becomes optional, not primary

## Locked design (from Session 68 discussion)

### Two categories of input, governed differently

| Category | Examples | Source of truth | Web edit behavior | Reset |
|---|---|---|---|---|
| **A — Live operational config** | Commission rate (base + Pro/Business discounts) | `system_settings` DB (per DEC-043) | Read-only display; "managed by admin → SystemSettings" link | N/A (always live) |
| **B — Forecast assumptions** | Growth rates, expenses, hiring, scenario multipliers, unit econ | `src/lib/financial-model/data.ts` | Editable; sparse overrides in Supabase | Discard overrides → re-read baseline |

### Scenarios

- **Per-user by default** with optional "share to RAV team" flag
- Sparse overrides in Supabase (only fields differing from baseline → small payloads, schema-additive-safe)
- Unsaved drafts in **localStorage** (survives refresh; doesn't sync across devices)
- **Drift indicator:** persistent banner at top ("Editing 'X' — N inputs differ from baseline. [Show diff] [Reset]") + per-input dot when value differs from baseline

### Architecture details

- **data.ts stays canonical baseline.** Web edits NEVER mutate it. CLI `npm run financials:build` always produces the baseline .xlsx (unless future `--use-scenario` flag is added).
- **Web financial model reads commission from DB** (closes the small drift surface that exists today — financial model uses build-time fallback, live pricing uses DB).
- **Reset = Category B only.** Category A is always live by design; reset has no meaning for it.

## Scope (this issue)

- [ ] **Supabase schema:** new table `financial_model_scenarios` (per-user, sparse override JSON, optional `is_shared` flag, RLS gated to RAV team)
- [ ] **Hooks:** `useFinancialModelScenarios()` (list/create/update/delete user's scenarios), `useActiveScenario()` (current scenario state, baseline-with-overrides merged for calc input)
- [ ] **localStorage draft:** unsaved edits survive refresh; cleared on save or reset
- [ ] **UI changes to FinancialModelDashboard.tsx:**
  - Scenario picker dropdown (replaces or supplements current Conservative/Base/Optimistic toggle — needs UX decision: are the 3 model scenarios saved scenarios too, or separate?)
  - Editable input controls for Category B values (the InputRow rows from data.ts: PLATFORM, SUBSCRIPTIONS, GROWTH, SCENARIOS, HORIZON, RESERVES, HIRING, UNIT_ECON, EXPENSES)
  - Persistent banner with diff count + Reset
  - Per-input dot when value differs from baseline
  - Save / Save As / Load Scenario controls
  - Share-to-team toggle on saved scenarios
- [ ] **Live commission read:** when financial model calculates, fetch commission rate from `system_settings.platform_commission_rate` via the existing `useCommissionRate()` hook + apply to projection. This closes the build-time-vs-runtime drift.
- [ ] **Tests:** scenario CRUD hook tests + drift-indicator render tests + baseline-reset behavior

## Out of scope (deferred to 2d / 2b)

- **Excel download from web** — Stage 2d (issue #pending). The active scenario's data needs to be downloadable as a fully-functional .xlsx.
- **Live actuals overlay (forecast vs reality)** — Stage 2b (#545). Now post-launch positioning since actuals exist only post-launch.
- **Promote scenario to baseline button** — deferred until we see how often baseline actually changes. For now baseline updates = code edit + PR.

## Dependencies

None blocking. Migration 080 (admin_audit_log + commission runtime) is already in PROD.

## References

- DEC-042 (Financial Model as Distinct Web Tool from Executive Dashboard) — sections updated this PR to reflect resequence
- DEC-043 (Commission Rate Runtime Architecture) — Category A architecture for live-config inputs
- `src/lib/financial-model/data.ts` — sparse-override target
- `src/lib/financial-model/calc.ts` — projection logic (takes scenario; will need to take overrides object too)
- `src/pages/FinancialModelDashboard.tsx` — page to extend
- Stage 2d (#551) — sibling
- #545 (Stage 2b) — resequenced after 2c+2d

## Estimated effort

4-6 days. Bigger than Stage 2a because of the Supabase schema + scenario CRUD UI + drift indicator polish.

---

**Filed Session 68 close. Pre-launch tier (Tier A — next after current pipeline clears).**
