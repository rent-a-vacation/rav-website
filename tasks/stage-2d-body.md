## Context

After Stage 2c ships (interactive editing + scenarios on `/executive-dashboard/financial-model`), founders will want to **download the active scenario as a functional .xlsx** — formulas, amber input cells, brand styling — not just a flat-value snapshot.

Today, the only way to get the .xlsx is to run `npm run financials:build` from a terminal. Stage 2d brings that to the browser.

**Constraint (locked in Session 68 discussion):** the downloaded .xlsx MUST be **as close as possible to the CLI output, with CLI being absolute truth.** Same formulas. Same amber cells. Same brand styling. Same 9 sheets. The only difference: if downloading the active scenario (vs. baseline), amber cells reflect the scenario's overrides and a banner cell at the top of the workbook says so.

## Locked design

### Two download buttons on the financial model page

1. **"Download baseline"** — produces identical .xlsx to what `npm run financials:build` produces today. Uses baseline values from `src/lib/financial-model/data.ts` (plus live commission from `system_settings`).
2. **"Download active scenario"** — same .xlsx structure, but amber cells reflect the active scenario's overrides. New banner cell at top of workbook: `Scenario: <Name> — N inputs differ from baseline. Generated <date>.`

### Implementation pattern: pure workbook-construction function

The current builder (`scripts/financial-model/build.ts` + `tabs/*.ts`) runs in Node and writes to disk. To enable browser use:

- **Refactor:** extract the workbook-construction logic into a pure async function `buildWorkbook(scenarioInputs, opts) → ExcelJS.Workbook`. Takes inputs (baseline OR scenario-merged), returns a workbook object. Doesn't write to disk.
- **Node entry point (unchanged behavior):** `scripts/financial-model/build.ts` calls `buildWorkbook(baseline)`, then writes the resulting workbook to `docs/financials/RAV_Financial_Model_<stamp>.xlsx`. **CLI behavior is unchanged.**
- **Browser entry point (new):** `src/lib/financial-model/download.ts` calls `buildWorkbook(activeScenarioInputs, { scenarioBanner: '...' })`, generates a blob (`exceljs` has `workbook.xlsx.writeBuffer()`), triggers a download via `URL.createObjectURL` + `<a download>`.
- **Scenario banner cell:** if `opts.scenarioBanner` is set, the cover tab gets a prepended banner row before generation.

### Failure modes

- Browser doesn't have `exceljs` bundled? — `exceljs` is already a runtime dependency for the financial-model build; needs to verify it tree-shakes / runs in browser. Likely a tiny bundle but check.
- Large workbook causes browser memory issues? — current .xlsx is small (~50KB). Not a concern at this volume.
- Scenario overrides have invalid types? — pure function validates; if invalid, throws → web shows error toast rather than producing corrupt .xlsx.

## Scope (this issue)

- [ ] Refactor `scripts/financial-model/build.ts` → pure `buildWorkbook()` function in `src/lib/financial-model/build-workbook.ts` (shared with browser)
- [ ] Update `tabs/*.ts` to accept inputs as parameters (not import directly) so the same tabs work for baseline OR scenario inputs
- [ ] Update `scripts/financial-model/build.ts` to be a thin Node wrapper: `buildWorkbook(baseline) → write to disk`
- [ ] Verify CLI behavior unchanged: `npm run financials:build` produces byte-identical .xlsx (or at minimum, structurally identical with all formulas/cells/styling)
- [ ] New browser-side `src/lib/financial-model/download.ts` — calls `buildWorkbook()`, generates blob, triggers download
- [ ] Two download buttons in `FinancialModelDashboard.tsx`: "Download baseline" + "Download active scenario"
- [ ] Scenario banner cell injection on cover tab (only when `opts.scenarioBanner` is set)
- [ ] Tests: pure function returns consistent output for same inputs; scenario banner injects correctly

## Out of scope

- **PDF export** — markdown-to-PDF is a separate enhancement. Browser-side PDF generation is more complex (needs different lib).
- **Edit history / revision log** for downloaded scenarios — out of scope for v1
- **Email-the-xlsx-from-web** — if needed, manual download + email is fine

## Dependencies

- **Stage 2c (#550)** must ship first — without an active scenario in the browser, "Download active scenario" has nothing to download.
- Both 2c and 2d must ship before #545 (Stage 2b) per the Session 68 resequence.

## References

- DEC-042 — Financial Model as Distinct Web Tool from Executive Dashboard
- `scripts/financial-model/build.ts` — current Node-only builder
- `scripts/financial-model/tabs/*.ts` — per-tab builders to refactor for parameterized inputs
- `exceljs` — already in dependencies; verify browser compatibility
- Stage 2c (#550) — sibling, must ship first
- #545 (Stage 2b) — resequenced after 2c+2d

## Estimated effort

3-5 days. The refactor to pure function is the bulk of the work; the UI is small (2 buttons + download trigger).

---

**Filed Session 68 close. Pre-launch tier (Tier A — sequenced after 2c).**
