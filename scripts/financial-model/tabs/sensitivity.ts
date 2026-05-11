import type { Workbook } from 'exceljs';
import { C } from '../colors.ts';
import { banner, styleCell, secHead, note, addNote, setColumnPixelWidths } from '../style.ts';

/**
 * SENSITIVITY tab — shows ±10% / ±20% impact on 24-month outputs for
 * 3 key drivers: commission rate, average booking value, booking volume.
 *
 * IMPLEMENTATION NOTE: Excel doesn't have a clean way to vary a named input
 * just for one calculation while leaving others alone. So instead of "what
 * if pCommBase were 12% instead of 15%?" we use the linear property of the
 * model: commission revenue scales linearly with commission rate, linearly
 * with booking volume, and linearly with avg booking value (since GBV =
 * bookings × avg_value).
 *
 * For drivers that scale non-linearly (e.g., growth rate over time has
 * compounding effects), the user can use the Scenario dropdown on REVENUE
 * MODEL to switch Conservative / Base / Optimistic — those use real
 * recomputation rather than a linear approximation.
 */

const sumRow = (label: string) =>
  `SUM(INDEX('REVENUE MODEL'!D:AA,MATCH("${label}",'REVENUE MODEL'!C:C,0),0))`;

export function buildSensitivityTab(wb: Workbook): void {
  const ws = wb.addWorksheet('SENSITIVITY', { properties: { tabColor: { argb: C.NAVY_LIGHT } } });

  setColumnPixelWidths(ws, [20, 30, 290, 130, 130, 130, 130, 130, 280]);

  ws.getRow(1).height = 52;
  banner(ws, 1, 2, 8, 'RAV SENSITIVITY ANALYSIS — Top 3 Drivers', C.NAVY, C.AMBER, 16, true);
  ws.getRow(2).height = 22;
  banner(ws, 2, 2, 8, '24-month total impact of varying each driver ±10% and ±20% (linear approximation)', C.AMBER_LIGHT, C.AMBER, 9, false);
  ws.getRow(3).height = 8;

  let r = 4;

  // ─── Section 1: Sensitivity matrix ───────────────────────────────────────
  secHead(ws, r++, 2, 8, '  COMMISSION-LINKED 24-MONTH REVENUE  —  Varying each driver, holding others at Base');

  // Header row
  const hdrs = ['Driver', '−20%', '−10%', 'Base', '+10%', '+20%', 'Behaviour'];
  ws.getRow(r).height = 28;
  hdrs.forEach((h, i) => {
    const cell = ws.getCell(r, i + 3);
    styleCell(cell, C.NAVY, C.WHITE, 10, true, i === 0 || i === 6 ? 'left' : 'center');
    cell.value = h;
  });
  r++;

  // Reference: base 24-mo Net Commission revenue
  const baseCommSum = sumRow('Net Commission Revenue');

  const drivers: [string, string, string][] = [
    [
      'Commission Rate (pCommBase)',
      baseCommSum,
      'Commission scales linearly with rate. ±20% rate → ±20% commission revenue. Subscription rev unchanged.',
    ],
    [
      'Average Booking Value (pAvgBooking)',
      baseCommSum,
      'GBV is bookings × avg value, so commission scales linearly with avg value.',
    ],
    [
      'Booking Volume',
      baseCommSum,
      'Total bookings × avg value × rate — linear in volume. Use Scenario dropdown for compounding volume + growth effects.',
    ],
  ];

  const multipliers = [0.8, 0.9, 1.0, 1.1, 1.2];

  drivers.forEach((d, idx) => {
    ws.getRow(r).height = 28;
    const alt = idx % 2 === 0 ? C.WHITE : C.CREAM;

    const lblCell = ws.getCell(r, 3);
    styleCell(lblCell, C.SAND, C.NAVY, 10, true, 'left');
    lblCell.value = d[0];
    addNote(lblCell, d[2]);

    multipliers.forEach((mult, i) => {
      const cell = ws.getCell(r, 4 + i);
      const isBase = mult === 1.0;
      styleCell(cell, isBase ? C.EMERALD : alt, isBase ? C.WHITE : C.NAVY, 10, isBase, 'right');
      cell.value = { formula: `${d[1]}*${mult}` } as never;
      cell.numFmt = '$#,##0';
      const pct = mult === 1.0 ? 'Base case' : `${mult > 1 ? '+' : ''}${Math.round((mult - 1) * 100)}%`;
      addNote(cell, `${pct} on ${d[0]}. Base 24-month Net Commission × ${mult}. Holds all other drivers at base.`);
    });

    const noteCell = ws.getCell(r, 9);
    styleCell(noteCell, alt, C.SLATE, 9, false, 'left', true);
    noteCell.value = d[2];
    r++;
  });

  r += 2;

  // ─── Section 2: Profitability impact ─────────────────────────────────────
  secHead(ws, r++, 2, 8, '  24-MONTH PROFIT IMPACT  —  How each driver moves the bottom line');

  ws.getRow(r).height = 28;
  hdrs.forEach((h, i) => {
    const cell = ws.getCell(r, i + 3);
    styleCell(cell, C.NAVY, C.WHITE, 10, true, i === 0 || i === 6 ? 'left' : 'center');
    cell.value = h;
  });
  r++;

  // 24-mo base totals
  const baseTotRev = sumRow('TOTAL MONTHLY REVENUE');
  const baseTotCost = `${sumRow('TOTAL MONTHLY COSTS (Expenses)')}+${sumRow('    Hiring Costs (Eng + Support + BD)')}`;
  // Base profit = total rev - total cost
  // For sensitivities, only commission portion changes; subscriptions + voice stay fixed

  const profitDrivers: [string, string, string][] = [
    [
      'Commission Rate sensitivity',
      `(${baseTotRev}-${baseCommSum})+(${baseCommSum})*MULT-(${baseTotCost})`,
      '24-mo profit = (non-commission rev) + (commission × multiplier) − (total costs)',
    ],
    [
      'Avg Booking Value sensitivity',
      `(${baseTotRev}-${baseCommSum})+(${baseCommSum})*MULT-(${baseTotCost})`,
      'Linear: avg value changes scale commission directly. Same formula as commission rate variation.',
    ],
    [
      'Booking Volume sensitivity',
      `(${baseTotRev}-${baseCommSum})+(${baseCommSum})*MULT-(${baseTotCost})`,
      'Linear assumption — for compounding volume + growth combined, switch Scenario dropdown.',
    ],
  ];

  profitDrivers.forEach((d, idx) => {
    ws.getRow(r).height = 28;
    const alt = idx % 2 === 0 ? C.WHITE : C.CREAM;

    const lblCell = ws.getCell(r, 3);
    styleCell(lblCell, C.SAND, C.NAVY, 10, true, 'left');
    lblCell.value = d[0];

    multipliers.forEach((mult, i) => {
      const cell = ws.getCell(r, 4 + i);
      const isBase = mult === 1.0;
      // Substitute the literal multiplier into the formula template
      const formula = d[1].replace(/MULT/g, String(mult));
      const isLoss = mult < 1.0;
      styleCell(cell, isBase ? C.AMBER : (isLoss ? C.RED_LIGHT : alt), isBase ? C.NAVY : (isLoss ? C.RED : C.NAVY), 10, isBase, 'right');
      cell.value = { formula } as never;
      cell.numFmt = '$#,##0';
    });

    const noteCell = ws.getCell(r, 9);
    styleCell(noteCell, alt, C.SLATE, 9, false, 'left', true);
    noteCell.value = d[2];
    r++;
  });

  r += 2;

  // ─── Section 3: Read-this-first ──────────────────────────────────────────
  secHead(ws, r++, 2, 8, '  HOW TO USE THIS TAB');

  const guidance = [
    'Use the linear sensitivities above to estimate impact of single-variable changes. They assume only one driver moves at a time.',
    'For combined scenarios (e.g., low volume AND low growth AND high churn), use the Scenario dropdown on REVENUE MODEL!D4 — Conservative/Base/Optimistic recompute the full 24-month trajectory using the multipliers in INPUTS Section D.',
    'For permanent assumption changes, edit the relevant cell in INPUTS (Section A for commission/booking value, Section C for growth rates). The whole model recomputes — this Sensitivity tab also updates.',
    'Sensitivities here vary commission-linked revenue. Subscription and voice overage revenue are unaffected by these levers — they depend on user counts, not commission rate.',
    'For investor diligence: pair this with the Conservative scenario in REVENUE MODEL to show the worst plausible case, and Optimistic for the upside case.',
  ];
  guidance.forEach((g, i) => {
    ws.getRow(r).height = 36;
    ws.mergeCells(r, 3, r, 9);
    const cell = ws.getCell(r, 3);
    styleCell(cell, i % 2 === 0 ? C.CREAM : C.WHITE, C.NAVY, 10, false, 'left', true);
    cell.value = `${i + 1}.  ${g}`;
    r++;
  });
}
