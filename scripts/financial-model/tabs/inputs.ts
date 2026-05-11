import type { Workbook, Worksheet } from 'exceljs';
import { C } from '../colors.ts';
import { banner, styleCell, styleRange, secHead, lbl, inp, calc, note, setColumnPixelWidths } from '../style.ts';
import { PLATFORM, SUBSCRIPTIONS, GROWTH, SCENARIOS, HORIZON, RESERVES, HIRING, UNIT_ECON, type InputRow } from '../data.ts';

function writeInputRow(wb: Workbook, ws: Worksheet, row: number, def: InputRow): void {
  ws.getRow(row).height = 26;
  lbl(ws, row, 3, def.label);
  inp(wb, ws, row, 4, def.value, def.fmt, def.name);
  const noteCell = ws.getCell(row, 6);
  styleCell(noteCell, C.WHITE, C.SLATE, 9, false, 'left', true);
  noteCell.value = def.note;
}

export function buildInputsTab(wb: Workbook): void {
  const ws = wb.addWorksheet('INPUTS', { properties: { tabColor: { argb: C.AMBER } } });

  setColumnPixelWidths(ws, [20, 30, 290, 160, 50, 350]);
  ws.views = [{ state: 'frozen', ySplit: 4 }];

  ws.getRow(1).height = 52;
  banner(ws, 1, 2, 5, 'RAV FINANCIAL MODEL — INPUTS & PARAMETERS', C.NAVY, C.CORAL, 17, true);
  ws.getRow(2).height = 22;
  banner(ws, 2, 2, 5, 'Amber cells = your inputs   ·   Teal cells = calculated   ·   All tabs update automatically', C.AMBER_LIGHT, C.AMBER, 9, false);
  ws.getRow(3).height = 8;
  ws.getRow(4).height = 14;

  let r = 5;

  // ── Section A ──
  secHead(ws, r++, 2, 5, 'A.  PLATFORM PARAMETERS  —  from RAV codebase (src/lib/pricing.ts · system_settings)');
  PLATFORM.forEach((p) => writeInputRow(wb, ws, r++, p));

  ws.getRow(r++).height = 10;
  secHead(ws, r++, 3, 4, '  Effective Commission Rates by Owner Tier  (auto-calculated)');
  const tierRows: [string, string, string][] = [
    ['Free Owner  (no subscription)', 'pCommBase',          'No discount — base rate'],
    ['Pro Owner  ($10/mo)',           'pCommBase-pProDisc', 'Base − Pro Discount'],
    ['Business Owner  ($25/mo)',      'pCommBase-pBizDisc', 'Base − Business Discount'],
  ];
  tierRows.forEach((t) => {
    ws.getRow(r).height = 24;
    const labelCell = ws.getCell(r, 3);
    styleCell(labelCell, C.TEAL_MID, C.NAVY, 10, true, 'left');
    labelCell.value = '      ' + t[0];
    calc(ws, r, 4, t[1], '0.00%');
    const noteCell = ws.getCell(r, 6);
    styleCell(noteCell, C.WHITE, C.SLATE, 9, false, 'left', false);
    noteCell.value = t[2];
    r++;
  });
  r += 2;

  // ── Section B ──
  secHead(ws, r++, 2, 5, 'B.  SUBSCRIPTION PRICING  —  from Stripe sandbox config (migrations 047-048)');
  SUBSCRIPTIONS.forEach((s) => writeInputRow(wb, ws, r++, s));
  r += 2;

  // ── Section C ──
  secHead(ws, r++, 2, 5, 'C.  GROWTH ASSUMPTIONS  —  Base Case');
  note(ws, r++, 3, 4, 'Base Case estimates. Section D multipliers apply for Conservative and Optimistic scenarios.');
  GROWTH.forEach((g) => writeInputRow(wb, ws, r++, g));

  // Mix validation row
  ws.getRow(r).height = 24;
  const mixLbl = ws.getCell(r, 3);
  styleCell(mixLbl, C.CREAM, C.SLATE, 9, false, 'left');
  mixLbl.value = '      v Owner Tier Mix (must = 100%)';
  const mixCell = ws.getCell(r, 4);
  styleCell(mixCell, C.TEAL_LIGHT, C.NAVY, 10, true, 'right');
  mixCell.value = { formula: 'gOwn0+gOwn1+gOwn2' } as never;
  mixCell.numFmt = '0.00%';
  const mixNote = ws.getCell(r, 6);
  styleCell(mixNote, C.WHITE, C.SLATE, 9, false, 'left');
  mixNote.value = 'Green = correct. Red = adjust percentages above.';

  // Conditional format on the mix cell — green when ~100%, red otherwise
  ws.addConditionalFormatting({
    ref: mixCell.address,
    rules: [
      { type: 'cellIs', operator: 'between', formulae: ['0.999', '1.001'], priority: 1,
        style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.EMERALD_LITE } }, font: { color: { argb: C.EMERALD } } } } as never,
      { type: 'cellIs', operator: 'notBetween', formulae: ['0.999', '1.001'], priority: 2,
        style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.RED_LIGHT } }, font: { color: { argb: C.RED } } } } as never,
    ],
  });
  r += 2;

  // ── Section D ──
  secHead(ws, r++, 2, 5, 'D.  SCENARIO MULTIPLIERS  —  Applied to Base Case when scenario is selected');
  SCENARIOS.forEach((s) => writeInputRow(wb, ws, r++, s));
  r += 2;

  // ── Section E ──
  secHead(ws, r++, 2, 5, 'E.  PLANNING HORIZON');
  HORIZON.forEach((h) => writeInputRow(wb, ws, r++, h));
  r += 2;

  // ── Section F (new in v3.1) ──
  secHead(ws, r++, 2, 5, 'F.  TAX, CASH & RESERVE INPUTS  —  Drives cumulative cash, churn, founder comp');
  RESERVES.forEach((res) => writeInputRow(wb, ws, r++, res));
  r += 2;

  // ── Section G (new in v3.2 — Phase 1b) ──
  secHead(ws, r++, 2, 5, 'G.  HIRING PLAN  —  Set month + burdened $/mo per role. Costs auto-add to Revenue Model from hire month forward.');
  HIRING.forEach((h) => writeInputRow(wb, ws, r++, h));
  r += 2;

  // ── Section H (new in v3.2 — Phase 1b) ──
  secHead(ws, r++, 2, 5, 'H.  UNIT ECONOMICS & COHORT RAMP  —  Drives cohort-based booking velocity, LTV, CAC, payback calculations');
  UNIT_ECON.forEach((u) => writeInputRow(wb, ws, r++, u));

  r++;
  note(ws, r, 2, 5, 'Change any amber cell — Revenue Model, Break-Even, and Funding Ask tabs all update automatically.');
}
