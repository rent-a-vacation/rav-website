import type { Workbook } from 'exceljs';
import { C } from '../colors.ts';
import { banner, styleCell, secHead, note, lbl, addNote, setColumnPixelWidths } from '../style.ts';

/**
 * UNIT ECONOMICS tab — directional CAC, LTV, payback metrics derived from
 * the 24-month projection. Uses INDEX/MATCH against row labels in REVENUE
 * MODEL so this tab survives row reordering in revenue.ts.
 *
 * NOTE: this is a "ballpark" view, not investor-grade cohort accounting.
 * For diligence-grade unit econ, cohort-level LTV/CAC tracking would
 * require restructuring the model around cohort vintages. Adequate for
 * pre-revenue planning + first investor conversations.
 */

// INDEX/MATCH wrapper — pulls a whole row from REVENUE MODEL by label,
// returning either SUM of all 24 monthly columns or just one month.
const matchRow = (label: string) =>
  `INDEX('REVENUE MODEL'!D:AA,MATCH("${label}",'REVENUE MODEL'!C:C,0),0)`;

const sumRow = (label: string) => `SUM(${matchRow(label)})`;

export function buildUnitEconTab(wb: Workbook): void {
  const ws = wb.addWorksheet('UNIT ECON', { properties: { tabColor: { argb: C.EMERALD } } });

  setColumnPixelWidths(ws, [20, 30, 320, 160, 320]);

  ws.getRow(1).height = 52;
  banner(ws, 1, 2, 4, 'RAV UNIT ECONOMICS — LTV, CAC, Payback', C.NAVY, C.EMERALD, 16, true);
  ws.getRow(2).height = 22;
  banner(ws, 2, 2, 4, '24-month projection averages. Directional, not cohort-grade — see note at bottom.', C.EMERALD_LITE, C.EMERALD, 9, false);
  ws.getRow(3).height = 8;

  let r = 4;

  // ─── Section 1: Lifetime Value ────────────────────────────────────────────
  secHead(ws, r++, 2, 4, '  1.  LIFETIME VALUE (LTV)  —  derived from 24-month totals × user lifetime');

  // Helper for one metric row: label | value | note
  // Hover note on the value cell surfaces the hint text + extra context
  // (useful when scrolling and the right-side hint column is off-screen).
  const metric = (label: string, formula: string, fmt: string, hint: string, highlight = false) => {
    ws.getRow(r).height = 26;
    const lblCell = ws.getCell(r, 3);
    styleCell(lblCell, highlight ? C.DEEP_TEAL : C.SAND, highlight ? C.WHITE : C.NAVY, 10, highlight, 'left');
    lblCell.value = label;
    const valCell = ws.getCell(r, 4);
    styleCell(valCell, highlight ? C.EMERALD : C.TEAL_LIGHT, highlight ? C.WHITE : C.NAVY, highlight ? 12 : 10, true, 'right');
    valCell.value = { formula } as never;
    valCell.numFmt = fmt;
    addNote(valCell, `${label}\n\n${hint}`);
    const hintCell = ws.getCell(r, 5);
    styleCell(hintCell, C.WHITE, C.SLATE, 9, false, 'left', true);
    hintCell.value = hint;
    r++;
  };

  // Owner LTV
  ws.getRow(r).height = 24;
  ws.mergeCells(r, 3, r, 4);
  const ownHdr = ws.getCell(r, 3);
  styleCell(ownHdr, C.TEAL_MID, C.NAVY, 10, true, 'left');
  ownHdr.value = '  Owner Side';
  r++;

  metric('24-mo Total Net Commission Revenue',     sumRow('Net Commission Revenue'),                                                 '$#,##0',     'Sum of monthly Net Commission across 24 months');
  metric('24-mo Sum of Active Owner-Months',       sumRow('Active Owners'),                                                          '#,##0.0',    'SUM of monthly Active Owners count (proxy for owner exposure)');
  metric('Avg Net Commission per Owner-Month',     `IFERROR(${sumRow('Net Commission Revenue')}/${sumRow('Active Owners')},0)`,      '$#,##0.00',  'Per-owner monthly contribution from booking commission');
  metric('24-mo Total Owner Subscription Rev',     `${sumRow('    Owner Pro subscriptions')}+${sumRow('    Owner Business subscriptions')}`, '$#,##0', 'Owner Pro + Owner Business subscription revenue');
  metric('Avg Owner Subscription Rev / Owner-Month', `IFERROR((${sumRow('    Owner Pro subscriptions')}+${sumRow('    Owner Business subscriptions')})/${sumRow('Active Owners')},0)`, '$#,##0.00', 'Per-owner monthly subscription revenue');
  metric('Owner LTV', `(IFERROR(${sumRow('Net Commission Revenue')}/${sumRow('Active Owners')},0)+IFERROR((${sumRow('    Owner Pro subscriptions')}+${sumRow('    Owner Business subscriptions')})/${sumRow('Active Owners')},0))*uOwnLife`, '$#,##0', '(Avg monthly revenue per owner) × Average Owner Lifetime (uOwnLife)', true);

  r++;

  // Traveler LTV
  ws.getRow(r).height = 24;
  ws.mergeCells(r, 3, r, 4);
  const travHdr = ws.getCell(r, 3);
  styleCell(travHdr, C.TEAL_MID, C.NAVY, 10, true, 'left');
  travHdr.value = '  Traveler Side';
  r++;

  metric('24-mo Total Traveler Subscription Rev',   `${sumRow('    Traveler Plus subscriptions')}+${sumRow('    Traveler Premium subscriptions')}`, '$#,##0', 'Traveler Plus + Premium subscription revenue');
  metric('24-mo Sum of Active Traveler-Months',     sumRow('Active Travelers'),                                                  '#,##0.0',   'SUM of monthly Active Travelers');
  metric('Avg Traveler Sub Rev / Traveler-Month',   `IFERROR((${sumRow('    Traveler Plus subscriptions')}+${sumRow('    Traveler Premium subscriptions')})/${sumRow('Active Travelers')},0)`, '$#,##0.00', 'Per-traveler monthly subscription revenue');
  metric('24-mo Voice Overage Revenue',             sumRow('    Voice Overage Revenue'),                                          '$#,##0',    'Voice/AI overage from non-Premium travelers');
  metric('Avg Voice Rev / Traveler-Month',          `IFERROR(${sumRow('    Voice Overage Revenue')}/${sumRow('Active Travelers')},0)`, '$#,##0.00', 'Per-traveler monthly voice overage');
  metric('Traveler LTV', `(IFERROR((${sumRow('    Traveler Plus subscriptions')}+${sumRow('    Traveler Premium subscriptions')})/${sumRow('Active Travelers')},0)+IFERROR(${sumRow('    Voice Overage Revenue')}/${sumRow('Active Travelers')},0))*uTravLife`, '$#,##0', '(Avg monthly revenue per traveler) × Avg Traveler Lifetime (uTravLife)', true);

  r += 2;

  // ─── Section 2: CAC ───────────────────────────────────────────────────────
  secHead(ws, r++, 2, 4, '  2.  CUSTOMER ACQUISITION COST (CAC)  —  Blended');

  // Marketing spend (one-time + monthly × 24)
  metric('24-mo Total Marketing Spend',
    `SUMIFS(EXPENSES!F:F,EXPENSES!C:C,"Marketing & Launch",EXPENSES!E:E,"One-Time")+SUMIFS(EXPENSES!J:J,EXPENSES!C:C,"Marketing & Launch",EXPENSES!E:E,"Recurring")*24`,
    '$#,##0', 'One-time marketing + (monthly recurring marketing × 24 months)');

  metric('Net New Owners (24mo)',
    `INDEX('REVENUE MODEL'!AA:AA,MATCH("Active Owners",'REVENUE MODEL'!C:C,0))-INDEX('REVENUE MODEL'!D:D,MATCH("Active Owners",'REVENUE MODEL'!C:C,0))`,
    '#,##0.0', 'Active Owners (Mo 24) − Active Owners (Mo 1). Under-counts due to churn.');

  metric('Net New Travelers (24mo)',
    `INDEX('REVENUE MODEL'!AA:AA,MATCH("Active Travelers",'REVENUE MODEL'!C:C,0))-INDEX('REVENUE MODEL'!D:D,MATCH("Active Travelers",'REVENUE MODEL'!C:C,0))`,
    '#,##0.0', 'Active Travelers (Mo 24) − Active Travelers (Mo 1). Under-counts due to churn.');

  // CAC = total marketing / total new users (blended)
  metric('Blended CAC',
    `IFERROR((SUMIFS(EXPENSES!F:F,EXPENSES!C:C,"Marketing & Launch",EXPENSES!E:E,"One-Time")+SUMIFS(EXPENSES!J:J,EXPENSES!C:C,"Marketing & Launch",EXPENSES!E:E,"Recurring")*24)/((INDEX('REVENUE MODEL'!AA:AA,MATCH("Active Owners",'REVENUE MODEL'!C:C,0))-INDEX('REVENUE MODEL'!D:D,MATCH("Active Owners",'REVENUE MODEL'!C:C,0)))+(INDEX('REVENUE MODEL'!AA:AA,MATCH("Active Travelers",'REVENUE MODEL'!C:C,0))-INDEX('REVENUE MODEL'!D:D,MATCH("Active Travelers",'REVENUE MODEL'!C:C,0)))),0)`,
    '$#,##0', 'Total marketing spend ÷ total net new users. Healthy benchmark: < 1/3 of LTV.', true);

  r += 2;

  // ─── Section 3: LTV/CAC + Payback ────────────────────────────────────────
  secHead(ws, r++, 2, 4, '  3.  LTV/CAC RATIO + PAYBACK PERIOD');
  ws.getRow(r).height = 22;
  note(ws, r++, 2, 4, 'Healthy SaaS benchmark: LTV/CAC > 3:1, payback < 12 months. Lower ratios = burn-funded growth.');

  // Row references for cross-section formulas. Use a BOUNDED range ($D$1:$D$30)
  // rather than D:D — Excel treats whole-column references that include the
  // formula's own row as circular, even though INDEX resolves to a specific
  // cell that's not the formula itself. Rows 1-30 cover all the data rows
  // (Owner LTV at 11, Traveler LTV at 23, Blended CAC at 26) while excluding
  // the LTV/CAC + Payback formulas below at rows 32+.
  const lookupRange = '$D$1:$D$30';
  const labelRange  = '$C$1:$C$30';
  const ownerLtvRef = `INDEX(${lookupRange},MATCH("Owner LTV",${labelRange},0))`;
  const travLtvRef  = `INDEX(${lookupRange},MATCH("Traveler LTV",${labelRange},0))`;
  const cacRef      = `INDEX(${lookupRange},MATCH("Blended CAC",${labelRange},0))`;

  metric('Owner LTV / CAC',     `IFERROR(${ownerLtvRef}/${cacRef},0)`,   '0.00"x"', 'Owner LTV ÷ Blended CAC. >3x is healthy.', true);
  metric('Traveler LTV / CAC',  `IFERROR(${travLtvRef}/${cacRef},0)`,    '0.00"x"', 'Traveler LTV ÷ Blended CAC. Travelers churn faster — lower ratio expected.', true);

  // Payback months = CAC / blended monthly revenue per user
  // Blended monthly rev per user = (Total Revenue / Total User-Months)
  const totUserMonths = `(${sumRow('Active Owners')}+${sumRow('Active Travelers')})`;
  const blendedMRPU = `IFERROR(${sumRow('TOTAL MONTHLY REVENUE')}/${totUserMonths},0)`;
  metric('Blended Monthly Revenue per User', blendedMRPU, '$#,##0.00', 'Total 24-mo revenue ÷ total user-months.');
  metric('Payback Period (months)', `IFERROR(${cacRef}/${blendedMRPU},0)`, '0.0" mo"', 'CAC ÷ Monthly Revenue per User. <12mo is healthy seed-stage.', true);

  r += 2;

  // Footer note
  ws.getRow(r).height = 60;
  banner(ws, r, 2, 4, 'Directional metrics — assumes uniform user behavior, ignores cohort vintages. For investor diligence, request cohort retention curves and per-channel CAC. Voice overage revenue is included in Total Monthly Revenue but excluded from Owner LTV (attributed to travelers).', C.AMBER_LIGHT, C.AMBER, 9, false);
}
