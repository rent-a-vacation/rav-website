import type { Workbook } from 'exceljs';
import { C } from '../colors.ts';
import { banner, styleCell, secHead, setColumnPixelWidths } from '../style.ts';

const MONTHS = 24;

export function buildBreakevenTab(wb: Workbook): void {
  const ws = wb.addWorksheet('BREAK-EVEN', { properties: { tabColor: { argb: C.AMBER } } });

  setColumnPixelWidths(ws, [20, 30, 200, 150, 150, 150, 150, 160]);
  ws.views = [{ state: 'frozen', ySplit: 6 }];

  ws.getRow(1).height = 52;
  banner(ws, 1, 2, 7, 'RAV BREAK-EVEN & RUNWAY ANALYSIS', C.NAVY, C.AMBER, 16, true);
  ws.getRow(2).height = 22;
  banner(ws, 2, 2, 7, 'Shows the month when cumulative cash position first turns positive. Feeds your Funding Ask.', C.AMBER_LIGHT, C.AMBER, 9, false);
  ws.getRow(3).height = 8;

  // KPI headers
  ws.getRow(4).height = 28;
  const kpis = ['Total One-Time Costs', 'Monthly Burn (steady)', 'Break-Even Month', '6-Mo Funding Need', '12-Mo Funding Need'];
  kpis.forEach((k, i) => {
    const cell = ws.getCell(4, i + 3);
    styleCell(cell, C.NAVY, C.WHITE, 9, true, 'center');
    cell.value = k;
  });

  // KPI values
  ws.getRow(5).height = 40;
  const oneTime = ws.getCell(5, 3);
  styleCell(oneTime, C.CORAL_LIGHT, C.CORAL, 14, true, 'center');
  oneTime.value = { formula: 'SUMIF(EXPENSES!E7:E500,"One-Time",EXPENSES!F7:F500)' } as never;
  oneTime.numFmt = '$#,##0';

  const burn = ws.getCell(5, 4);
  styleCell(burn, C.RED_LIGHT, C.RED, 14, true, 'center');
  burn.value = { formula: 'SUMIF(EXPENSES!E7:E500,"Recurring",EXPENSES!J7:J500)' } as never;
  burn.numFmt = '$#,##0';

  const breakeven = ws.getCell(5, 5);
  styleCell(breakeven, C.TEAL_LIGHT, C.DEEP_TEAL, 14, true, 'center');
  // Find the first month (col D=Mo1..AA=Mo24 on this sheet, rows 9..32) where Cumulative Cash > 0
  breakeven.value = { formula: `IFERROR(MATCH(TRUE,G9:G${8 + MONTHS}>0,0),"Not in 24mo")` } as never;
  breakeven.numFmt = '0';

  const sixMo = ws.getCell(5, 6);
  styleCell(sixMo, C.AMBER_LIGHT, C.AMBER, 14, true, 'center');
  sixMo.value = { formula: 'C5+D5*6' } as never;
  sixMo.numFmt = '$#,##0';

  const twelveMo = ws.getCell(5, 7);
  styleCell(twelveMo, C.AMBER_LIGHT, C.AMBER, 14, true, 'center');
  twelveMo.value = { formula: 'C5+D5*12' } as never;
  twelveMo.numFmt = '$#,##0';

  ws.getRow(6).height = 8;

  let row = 7;
  secHead(ws, row++, 2, 7, '  Month-by-Month: Revenue vs Costs vs Cumulative Cash Position');

  const thdrs = ['Month', 'Monthly Revenue', 'Monthly Costs', 'Net (Rev − Cost)', 'Cumulative Cash', 'Runway Signal'];
  thdrs.forEach((h, i) => {
    const cell = ws.getCell(row, i + 3);
    styleCell(cell, C.NAVY_MID, C.WHITE, 10, true, 'center');
    cell.value = h;
  });
  ws.getRow(row).height = 26;
  row++;

  for (let m = 1; m <= MONTHS; m++) {
    ws.getRow(row).height = 24;
    const alt = m % 2 === 0 ? C.CREAM : C.WHITE;
    // Revenue Model month m is column D + (m-1) = D for m=1, E for m=2, ... AA for m=24
    // In a1, that's columns 4..27 → letters D..AA
    const cL = String.fromCharCode(64 + 3 + m); // crude — works up to col 26 (Z); for AA we need colLtr
    // Use the colLtr helper for correctness
    const colLetter = (() => {
      const n = 3 + m;
      let s = ''; let nn = n;
      while (nn > 0) { const k = (nn - 1) % 26; s = String.fromCharCode(65 + k) + s; nn = Math.floor((nn - 1) / 26); }
      return s;
    })();

    const monthCell = ws.getCell(row, 3);
    styleCell(monthCell, alt, C.NAVY, 10, false, 'center');
    monthCell.value = `Month ${m}`;

    const revCell = ws.getCell(row, 4);
    styleCell(revCell, C.EMERALD_LITE, C.EMERALD, 10, false, 'right');
    revCell.value = { formula: `IFERROR(INDEX('REVENUE MODEL'!${colLetter}:${colLetter},MATCH("TOTAL MONTHLY REVENUE",'REVENUE MODEL'!C:C,0)),0)` } as never;
    revCell.numFmt = '$#,##0';

    // v3.2: pull both the expense line + hiring line and sum them for Total Costs
    const costCell = ws.getCell(row, 5);
    styleCell(costCell, C.RED_LIGHT, C.RED, 10, false, 'right');
    costCell.value = {
      formula:
        `IFERROR(INDEX('REVENUE MODEL'!${colLetter}:${colLetter},MATCH("TOTAL MONTHLY COSTS (Expenses)",'REVENUE MODEL'!C:C,0)),0)` +
        `+IFERROR(INDEX('REVENUE MODEL'!${colLetter}:${colLetter},MATCH("    Hiring Costs (Eng + Support + BD)",'REVENUE MODEL'!C:C,0)),0)`,
    } as never;
    costCell.numFmt = '$#,##0';

    const netCell = ws.getCell(row, 6);
    styleCell(netCell, alt, C.NAVY, 10, true, 'right');
    netCell.value = { formula: `D${row}-E${row}` } as never;
    netCell.numFmt = '$#,##0';

    const cumCell = ws.getCell(row, 7);
    styleCell(cumCell, alt, C.NAVY, 10, false, 'right');
    if (m === 1) {
      cumCell.value = { formula: `gStartCash+IF(gFundMonth=1,gFundAmt,0)+F${row}` } as never;
    } else {
      cumCell.value = { formula: `G${row - 1}+IF(gFundMonth=${m},gFundAmt,0)+F${row}` } as never;
    }
    cumCell.numFmt = '$#,##0';

    const sigCell = ws.getCell(row, 8);
    styleCell(sigCell, alt, C.NAVY, 10, false, 'center');
    sigCell.value = { formula: `IF(G${row}>0,"Profitable","Burning Cash")` } as never;

    row++;
  }

  // Totals row
  ws.getRow(row).height = 32;
  banner(ws, row, 3, 1, '24-MONTH TOTALS', C.NAVY, C.WHITE, 10, true).alignment = { horizontal: 'center', vertical: 'middle' };
  const totRev = ws.getCell(row, 4);
  styleCell(totRev, C.EMERALD, C.WHITE, 12, true, 'right');
  totRev.value = { formula: `SUM(D${row - MONTHS}:D${row - 1})` } as never;
  totRev.numFmt = '$#,##0';
  const totCost = ws.getCell(row, 5);
  styleCell(totCost, C.RED, C.WHITE, 12, true, 'right');
  totCost.value = { formula: `SUM(E${row - MONTHS}:E${row - 1})` } as never;
  totCost.numFmt = '$#,##0';
  const totNet = ws.getCell(row, 6);
  styleCell(totNet, C.NAVY, C.CORAL, 12, true, 'right');
  totNet.value = { formula: `D${row}-E${row}` } as never;
  totNet.numFmt = '$#,##0';
}
