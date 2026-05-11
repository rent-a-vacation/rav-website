import type { Workbook, BorderStyle } from 'exceljs';
import { C } from '../colors.ts';
import { banner, styleCell, secHead, lbl, drop, colLtr, setColumnPixelWidths } from '../style.ts';

const MONTHS = 24;

export function buildRevenueTab(wb: Workbook): void {
  const ws = wb.addWorksheet('REVENUE MODEL', { properties: { tabColor: { argb: C.DEEP_TEAL } } });

  const widths = [20, 30, 250];
  for (let c = 4; c <= 28; c++) widths.push(82);
  setColumnPixelWidths(ws, widths);

  ws.views = [{ state: 'frozen', xSplit: 3, ySplit: 7 }];

  ws.getRow(1).height = 52;
  banner(ws, 1, 2, 26, 'RAV REVENUE MODEL — 24-Month Projection', C.NAVY, C.CORAL, 16, true);
  ws.getRow(2).height = 22;
  banner(ws, 2, 2, 26, 'All values pull from INPUTS. Change inputs there — this tab updates automatically.', C.TEAL_LIGHT, C.DEEP_TEAL, 9, false);
  ws.getRow(3).height = 8;

  // Scenario selector
  ws.getRow(4).height = 34;
  banner(ws, 4, 2, 2, 'ACTIVE SCENARIO >', C.NAVY, C.WHITE, 11, true);
  const scCell = ws.getCell(4, 4);
  styleCell(scCell, C.AMBER_LIGHT, C.NAVY, 13, true, 'left');
  scCell.value = 'Base';
  scCell.border = {
    top: { style: 'thin' as BorderStyle, color: { argb: C.AMBER } },
    left: { style: 'thin' as BorderStyle, color: { argb: C.AMBER } },
    bottom: { style: 'thin' as BorderStyle, color: { argb: C.AMBER } },
    right: { style: 'thin' as BorderStyle, color: { argb: C.AMBER } },
  };
  drop(scCell, ['Conservative', 'Base', 'Optimistic']);
  scCell.name = 'Scenario';
  ws.mergeCells(4, 5, 4, 9);
  styleCell(ws.getCell(4, 5), C.AMBER_LIGHT, C.AMBER, 9, false, 'left');
  ws.getCell(4, 5).value = '< Change to switch between Conservative / Base / Optimistic';
  ws.getCell(4, 5).font = { ...(ws.getCell(4, 5).font ?? {}), italic: true };
  ws.getRow(5).height = 8;

  // Month headers
  ws.getRow(6).height = 28;
  const metricHdr = ws.getCell(6, 3);
  styleCell(metricHdr, C.NAVY, C.WHITE, 10, true, 'left');
  metricHdr.value = 'METRIC';
  for (let m = 1; m <= MONTHS; m++) {
    const cell = ws.getCell(6, m + 3);
    styleCell(cell, m % 2 === 0 ? C.NAVY_MID : C.NAVY, C.WHITE, 9, true, 'center');
    cell.value = `Mo ${m}`;
  }
  ws.getRow(7).height = 6;

  const sBook = 'IF(Scenario="Conservative",scConBook,IF(Scenario="Optimistic",scOptBook,scBaseBook))';
  const sGrow = 'IF(Scenario="Conservative",scConGrow,IF(Scenario="Optimistic",scOptGrow,scBaseGrow))';
  const blend = '(gMix0*pCommBase+gMix1*(pCommBase-pProDisc)+gMix2*(pCommBase-pBizDisc))';

  let row = 8;

  // 1. USER GROWTH
  secHead(ws, row++, 2, 27, '  1.  USER GROWTH');

  lbl(ws, row, 3, 'Active Owners');
  for (let m = 1; m <= MONTHS; m++) {
    const col = m + 3;
    const cell = ws.getCell(row, col);
    if (m === 1) {
      styleCell(cell, C.TEAL_LIGHT, C.NAVY, 10, false, 'right');
      cell.value = { formula: 'IF(1>=gLaunchMo,gStartOwn,0)' } as never;
    } else {
      styleCell(cell, m % 2 === 0 ? C.WHITE : C.CREAM, C.NAVY, 10, false, 'right');
      cell.value = { formula: `IF(${m}>=gLaunchMo,${colLtr(col - 1)}${row}*(1+gOwnGrowth*${sGrow}),0)` } as never;
    }
    cell.numFmt = '#,##0';
  }
  const ownRow = row++;

  lbl(ws, row, 3, 'Active Travelers');
  for (let m = 1; m <= MONTHS; m++) {
    const col = m + 3;
    const cell = ws.getCell(row, col);
    if (m === 1) {
      styleCell(cell, C.TEAL_LIGHT, C.NAVY, 10, false, 'right');
      cell.value = { formula: 'IF(1>=gLaunchMo,gStartTrav,0)' } as never;
    } else {
      styleCell(cell, m % 2 === 0 ? C.WHITE : C.CREAM, C.NAVY, 10, false, 'right');
      cell.value = { formula: `IF(${m}>=gLaunchMo,${colLtr(col - 1)}${row}*(1+gTravGrowth*${sGrow}),0)` } as never;
    }
    cell.numFmt = '#,##0';
  }
  const travRow = row;
  row += 2;

  // 2. MARKETPLACE ACTIVITY
  secHead(ws, row++, 2, 27, '  2.  MARKETPLACE ACTIVITY  (Listings · Offers · Bookings)');

  // Cohort ramp factor: bookings/owner ramps from 0 to gBookPerOwn over uRampMonths
  // months post-launch. MIN(1, (months_since_launch + 1) / uRampMonths) caps at 1.0.
  // Set uRampMonths = 1 in INPUTS to disable the ramp (immediate full velocity).
  lbl(ws, row, 3, 'Monthly Bookings (confirmed)');
  for (let m = 1; m <= MONTHS; m++) {
    const col = m + 3;
    const cell = ws.getCell(row, col);
    styleCell(cell, m % 2 === 0 ? C.WHITE : C.CREAM, C.NAVY, 10, false, 'right');
    const ramp = `MIN(1,(${m}-gLaunchMo+1)/uRampMonths)`;
    cell.value = { formula: `IF(${m}>=gLaunchMo,${colLtr(col)}${ownRow}*gBookPerOwn*${ramp}*${sBook},0)` } as never;
    cell.numFmt = '#,##0.0';
  }
  const bookRow = row++;

  lbl(ws, row, 3, '    Cumulative Bookings');
  const firstCum = ws.getCell(row, 4);
  styleCell(firstCum, C.TEAL_LIGHT, C.NAVY, 10, false, 'right');
  firstCum.value = { formula: `D${bookRow}` } as never;
  firstCum.numFmt = '#,##0';
  for (let m = 2; m <= MONTHS; m++) {
    const col = m + 3;
    const cell = ws.getCell(row, col);
    styleCell(cell, C.TEAL_LIGHT, C.NAVY, 10, false, 'right');
    cell.value = { formula: `${colLtr(col - 1)}${row}+${colLtr(col)}${bookRow}` } as never;
    cell.numFmt = '#,##0';
  }
  row++;

  lbl(ws, row, 3, '    Gross Booking Value (GBV)');
  for (let m = 1; m <= MONTHS; m++) {
    const col = m + 3;
    const cell = ws.getCell(row, col);
    styleCell(cell, m % 2 === 0 ? C.EMERALD_LITE : C.TEAL_LIGHT, C.NAVY, 10, false, 'right');
    cell.value = { formula: `${colLtr(col)}${bookRow}*pAvgBooking` } as never;
    cell.numFmt = '$#,##0';
  }
  const gbvRow = row;
  row += 2;

  // 3. COMMISSION REVENUE
  secHead(ws, row++, 2, 27, '  3.  COMMISSION REVENUE  (blended across Free / Pro / Business owner tiers)');

  lbl(ws, row, 3, '    Blended Commission Rate');
  for (let m = 1; m <= MONTHS; m++) {
    const col = m + 3;
    const cell = ws.getCell(row, col);
    styleCell(cell, m % 2 === 0 ? C.WHITE : C.CREAM, C.NAVY, 10, false, 'right');
    cell.value = { formula: blend } as never;
    cell.numFmt = '0.00%';
  }
  row++;

  ws.getRow(row).height = 30;
  const grossLbl = ws.getCell(row, 3);
  styleCell(grossLbl, C.DEEP_TEAL, C.WHITE, 11, true, 'left');
  grossLbl.value = 'Gross Commission Revenue';
  for (let m = 1; m <= MONTHS; m++) {
    const col = m + 3;
    const cell = ws.getCell(row, col);
    styleCell(cell, C.DEEP_TEAL, C.WHITE, 11, true, 'right');
    cell.value = { formula: `${colLtr(col)}${gbvRow}*${blend}` } as never;
    cell.numFmt = '$#,##0';
  }
  const grossCommRow = row++;

  // Stripe Fees row (subtractive)
  lbl(ws, row, 3, '    Stripe Processing Fees (absorbed by RAV)');
  for (let m = 1; m <= MONTHS; m++) {
    const col = m + 3;
    const cL = colLtr(col);
    const cell = ws.getCell(row, col);
    styleCell(cell, m % 2 === 0 ? C.RED_LIGHT : C.WHITE, C.RED, 10, false, 'right');
    cell.value = { formula: `-(${cL}${gbvRow}*(1+${blend})*pStripePct + ${cL}${bookRow}*pStripeFixed)` } as never;
    cell.numFmt = '$#,##0';
  }
  const stripeFeeRow = row++;

  ws.getRow(row).height = 30;
  const netLbl = ws.getCell(row, 3);
  styleCell(netLbl, C.DEEP_TEAL, C.WHITE, 11, true, 'left');
  netLbl.value = 'Net Commission Revenue';
  for (let m = 1; m <= MONTHS; m++) {
    const col = m + 3;
    const cL = colLtr(col);
    const cell = ws.getCell(row, col);
    styleCell(cell, C.DEEP_TEAL, C.WHITE, 11, true, 'right');
    cell.value = { formula: `${cL}${grossCommRow}+${cL}${stripeFeeRow}` } as never;
    cell.numFmt = '$#,##0';
  }
  const commRow = row;
  row += 2;

  // 4. SUBSCRIPTION REVENUE
  secHead(ws, row++, 2, 27, '  4.  SUBSCRIPTION REVENUE  (Owner Pro · Owner Business · Traveler Plus · Traveler Premium)');

  const subDefs: [string, number, string, string][] = [
    ['    Owner Pro subscriptions',       ownRow,  'gOwn1',  'sOwnerPro'],
    ['    Owner Business subscriptions',  ownRow,  'gOwn2',  'sOwnerBiz'],
    ['    Traveler Plus subscriptions',   travRow, 'gTrav1', 'sTravPlus'],
    ['    Traveler Premium subscriptions',travRow, 'gTrav2', 'sTravPrem'],
  ];
  const subRowNums: number[] = [];
  subDefs.forEach((sd) => {
    lbl(ws, row, 3, sd[0]);
    for (let m = 1; m <= MONTHS; m++) {
      const col = m + 3;
      const cell = ws.getCell(row, col);
      styleCell(cell, m % 2 === 0 ? C.WHITE : C.CREAM, C.NAVY, 10, false, 'right');
      cell.value = { formula: `${colLtr(col)}${sd[1]}*${sd[2]}*${sd[3]}` } as never;
      cell.numFmt = '$#,##0';
    }
    subRowNums.push(row);
    row++;
  });

  ws.getRow(row).height = 30;
  const subSumLbl = ws.getCell(row, 3);
  styleCell(subSumLbl, C.NAVY_MID, C.WHITE, 11, true, 'left');
  subSumLbl.value = 'Total Subscription Revenue';
  for (let m = 1; m <= MONTHS; m++) {
    const col = m + 3;
    const cL = colLtr(col);
    const cell = ws.getCell(row, col);
    styleCell(cell, C.NAVY_MID, C.WHITE, 11, true, 'right');
    cell.value = { formula: `SUM(${cL}${subRowNums[0]}:${cL}${subRowNums[subRowNums.length - 1]})` } as never;
    cell.numFmt = '$#,##0';
  }
  const subRevRow = row;
  row += 2;

  // 4b. USAGE REVENUE (Voice Overage — new in v3.2 / Phase 1b)
  secHead(ws, row++, 2, 27, '  4b. USAGE REVENUE  (voice / AI overage — non-Premium travelers only)');
  lbl(ws, row, 3, '    Voice Overage Revenue');
  for (let m = 1; m <= MONTHS; m++) {
    const col = m + 3;
    const cL = colLtr(col);
    const cell = ws.getCell(row, col);
    styleCell(cell, m % 2 === 0 ? C.WHITE : C.CREAM, C.NAVY, 10, false, 'right');
    // Premium travelers (gTrav2) have unlimited voice — exclude. Overage = (Free + Plus) × per-traveler $
    cell.value = { formula: `IF(${m}>=gLaunchMo,${cL}${travRow}*(1-gTrav2)*uVoiceOverage,0)` } as never;
    cell.numFmt = '$#,##0';
  }
  const voiceRow = row;
  row += 2;

  // 5. TOTALS
  secHead(ws, row++, 2, 27, '  5.  REVENUE vs COSTS vs PROFIT / (LOSS)');

  ws.getRow(row).height = 34;
  const totRevLbl = ws.getCell(row, 3);
  styleCell(totRevLbl, C.EMERALD, C.WHITE, 12, true, 'left');
  totRevLbl.value = 'TOTAL MONTHLY REVENUE';
  for (let m = 1; m <= MONTHS; m++) {
    const col = m + 3;
    const cL = colLtr(col);
    const cell = ws.getCell(row, col);
    styleCell(cell, C.EMERALD, C.WHITE, 12, true, 'right');
    // v3.2: Total Revenue = Net Commission + Subscription Total + Voice Overage
    cell.value = { formula: `${cL}${commRow}+${cL}${subRevRow}+${cL}${voiceRow}` } as never;
    cell.numFmt = '$#,##0';
  }
  const totRevRow = row++;

  ws.getRow(row).height = 34;
  const totCostLbl = ws.getCell(row, 3);
  styleCell(totCostLbl, C.RED, C.WHITE, 12, true, 'left');
  totCostLbl.value = 'TOTAL MONTHLY COSTS (Expenses)';
  for (let m = 1; m <= MONTHS; m++) {
    const col = m + 3;
    const cell = ws.getCell(row, col);
    styleCell(cell, C.RED, C.WHITE, 12, true, 'right');
    cell.value = {
      formula:
        `SUMPRODUCT((EXPENSES!E7:E500="Recurring")*(EXPENSES!H7:H500<=${m})*(EXPENSES!I7:I500>=${m})*` +
        `IF(EXPENSES!G7:G500="Monthly",EXPENSES!F7:F500,` +
        `IF(EXPENSES!G7:G500="Annual",EXPENSES!F7:F500/12,` +
        `IF(EXPENSES!G7:G500="Quarterly",EXPENSES!F7:F500/3,0))))+` +
        `SUMPRODUCT((EXPENSES!E7:E500="One-Time")*(EXPENSES!H7:H500=${m})*EXPENSES!F7:F500)`,
    } as never;
    cell.numFmt = '$#,##0';
  }
  const totCostRow = row++;

  // Hiring Costs row (new in v3.2 / Phase 1b)
  // Each hire's burdened cost activates from its hire month forward.
  // Hire month = 0 means "no hire planned" (contributes $0).
  ws.getRow(row).height = 28;
  const hireLbl = ws.getCell(row, 3);
  styleCell(hireLbl, C.NAVY_MID, C.WHITE, 10, true, 'left');
  hireLbl.value = '    Hiring Costs (Eng + Support + BD)';
  for (let m = 1; m <= MONTHS; m++) {
    const col = m + 3;
    const cell = ws.getCell(row, col);
    styleCell(cell, m % 2 === 0 ? C.RED_LIGHT : C.WHITE, C.RED, 10, false, 'right');
    cell.value = {
      formula:
        `IF(hEngMonth=0,0,IF(${m}>=hEngMonth,hEngCost,0))+` +
        `IF(hSupMonth=0,0,IF(${m}>=hSupMonth,hSupCost,0))+` +
        `IF(hBDMonth=0,0,IF(${m}>=hBDMonth,hBDCost,0))`,
    } as never;
    cell.numFmt = '$#,##0';
  }
  const hireRow = row++;

  ws.getRow(row).height = 36;
  const netLblCell = ws.getCell(row, 3);
  styleCell(netLblCell, C.NAVY, C.AMBER, 12, true, 'left');
  netLblCell.value = 'NET MONTHLY PROFIT / (LOSS)';
  for (let m = 1; m <= MONTHS; m++) {
    const col = m + 3;
    const cL = colLtr(col);
    const cell = ws.getCell(row, col);
    styleCell(cell, C.NAVY, C.AMBER, 12, true, 'right');
    // v3.2: Net = Revenue - (Expenses + Hiring)
    cell.value = { formula: `${cL}${totRevRow}-${cL}${totCostRow}-${cL}${hireRow}` } as never;
    cell.numFmt = '$#,##0';
  }
  const netRow = row++;

  ws.getRow(row).height = 28;
  const cumLbl = ws.getCell(row, 3);
  styleCell(cumLbl, C.WARM_GRAY, C.NAVY, 10, true, 'left');
  cumLbl.value = '    Cumulative Cash Position';
  const cumFirst = ws.getCell(row, 4);
  styleCell(cumFirst, C.WHITE, C.NAVY, 10, false, 'right');
  cumFirst.value = { formula: `gStartCash+IF(gFundMonth=1,gFundAmt,0)+D${netRow}` } as never;
  cumFirst.numFmt = '$#,##0';
  for (let m = 2; m <= MONTHS; m++) {
    const col = m + 3;
    const cell = ws.getCell(row, col);
    styleCell(cell, C.WHITE, C.NAVY, 10, false, 'right');
    cell.value = { formula: `${colLtr(col - 1)}${row}+IF(gFundMonth=${m},gFundAmt,0)+${colLtr(col)}${netRow}` } as never;
    cell.numFmt = '$#,##0';
  }

  // Conditional formatting on cumulative cash row
  const cumRange = `${colLtr(4)}${row}:${colLtr(MONTHS + 3)}${row}`;
  ws.addConditionalFormatting({
    ref: cumRange,
    rules: [
      { type: 'cellIs', operator: 'greaterThanOrEqual', formulae: ['0'], priority: 1,
        style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.EMERALD_LITE } }, font: { color: { argb: C.EMERALD } } } } as never,
      { type: 'cellIs', operator: 'lessThan', formulae: ['0'], priority: 2,
        style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.RED_LIGHT } }, font: { color: { argb: C.RED } } } } as never,
    ],
  });
}
