import type { Workbook, BorderStyle } from 'exceljs';
import { C } from '../colors.ts';
import { banner, styleCell, secHead, drop, addNote, setColumnPixelWidths } from '../style.ts';
import { EXPENSES, EXPENSE_CATEGORIES, type ExpenseCategory } from '../data.ts';

const CAT_BG: Record<string, string> = {
  'Legal & Formation':  C.NAVY,
  'Operations & Tools': C.DEEP_TEAL,
  'Marketing & Launch': C.CORAL,
  'Compliance & Tax':   C.SLATE,
  'People & Admin':     C.EMERALD,
};

export function buildExpensesTab(wb: Workbook): void {
  const ws = wb.addWorksheet('EXPENSES', { properties: { tabColor: { argb: C.CORAL } } });

  setColumnPixelWidths(ws, [20, 30, 190, 200, 100, 105, 105, 90, 95, 120, 240]);
  ws.views = [{ state: 'frozen', ySplit: 6 }];

  ws.getRow(1).height = 52;
  banner(ws, 1, 2, 10, 'RAV EXPENSE TRACKER — One-Time & Recurring Costs', C.NAVY, C.CORAL, 16, true);
  ws.getRow(2).height = 22;
  banner(ws, 2, 2, 10, 'Amber = editable. Add rows in the green section below. Totals auto-calculate.', C.CORAL_LIGHT, C.CORAL, 9, false);
  ws.getRow(3).height = 8;
  ws.getRow(4).height = 10;

  ws.getRow(5).height = 30;
  const headers = ['#', 'Category', 'Expense Item', 'Type', 'Amount ($)', 'Frequency', 'Start Mo.', 'End Mo.', 'Monthly $', 'Notes'];
  headers.forEach((h, i) => {
    const cell = ws.getCell(5, i + 2);
    styleCell(cell, C.NAVY, C.WHITE, 10, true, 'center');
    cell.value = h;
  });
  ws.getRow(6).height = 6;

  let row = 7;
  EXPENSES.forEach((e, idx) => {
    ws.getRow(row).height = 24;
    const alt = idx % 2 === 0 ? C.WHITE : C.CREAM;
    const catBg = CAT_BG[e.category] ?? C.WARM_GRAY;

    const idxCell = ws.getCell(row, 2);
    styleCell(idxCell, alt, C.SLATE, 9, false, 'center');
    idxCell.value = idx + 1;

    const catCell = ws.getCell(row, 3);
    styleCell(catCell, catBg as never, C.WHITE, 9, true, 'left');
    catCell.value = e.category;

    const itemCell = ws.getCell(row, 4);
    styleCell(itemCell, alt, C.NAVY, 10, false, 'left', true);
    itemCell.value = e.item;

    const typeCell = ws.getCell(row, 5);
    styleCell(typeCell, alt, C.NAVY, 10, false, 'left');
    typeCell.value = e.type;
    drop(typeCell, ['One-Time', 'Recurring']);

    const amtCell = ws.getCell(row, 6);
    styleCell(amtCell, C.AMBER_LIGHT, C.NAVY, 10, true, 'right');
    amtCell.value = e.amount;
    amtCell.numFmt = '$#,##0.00';
    amtCell.border = {
      top: { style: 'thin' as BorderStyle, color: { argb: C.AMBER } },
      left: { style: 'thin' as BorderStyle, color: { argb: C.AMBER } },
      bottom: { style: 'thin' as BorderStyle, color: { argb: C.AMBER } },
      right: { style: 'thin' as BorderStyle, color: { argb: C.AMBER } },
    };
    // Hover note surfaces the row's description as a tooltip on the Amount cell
    addNote(amtCell, `${e.item}\n\n${e.notes}`);

    const freqCell = ws.getCell(row, 7);
    styleCell(freqCell, alt, C.NAVY, 10, false, 'left');
    freqCell.value = e.frequency;
    drop(freqCell, ['Once', 'Monthly', 'Annual', 'Quarterly']);

    const startCell = ws.getCell(row, 8);
    styleCell(startCell, C.AMBER_LIGHT, C.NAVY, 10, true, 'center');
    startCell.value = e.startMo;
    startCell.border = amtCell.border;

    const endCell = ws.getCell(row, 9);
    styleCell(endCell, C.AMBER_LIGHT, C.NAVY, 10, true, 'center');
    endCell.value = e.endMo;
    endCell.border = amtCell.border;

    const monthlyCell = ws.getCell(row, 10);
    styleCell(monthlyCell, C.TEAL_LIGHT, C.NAVY, 10, false, 'right');
    monthlyCell.value = {
      formula: `IF(E${row}="One-Time",F${row},IF(G${row}="Monthly",F${row},IF(G${row}="Annual",F${row}/12,IF(G${row}="Quarterly",F${row}/3,0))))`,
    } as never;
    monthlyCell.numFmt = '$#,##0.00';

    const notesCell = ws.getCell(row, 11);
    styleCell(notesCell, alt, C.SLATE, 9, false, 'left', true);
    notesCell.value = e.notes;

    row++;
  });

  // Buffer rows for additions. Track lastDataRow so summary SUMIFs can use a
  // bounded range that excludes the summary cells themselves (otherwise SUMIF
  // ranges that include the formula's own row trigger Excel circular-reference
  // warnings — and the summary rows reuse the category names in column C,
  // which would also cause real self-counting).
  ws.getRow(row).height = 8;
  row++;
  secHead(ws, row++, 2, 10, '  + ADD NEW EXPENSES BELOW — copy format from rows above');
  for (let i = 0; i < 25; i++) {
    ws.getRow(row).height = 24;
    const idxCell = ws.getCell(row, 2);
    styleCell(idxCell, C.EMERALD_LITE, C.SLATE, 9, false, 'center');
    idxCell.value = EXPENSES.length + i + 1;
    [3, 4].forEach((c) => { ws.getCell(row, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.EMERALD_LITE } }; });
    const tCell = ws.getCell(row, 5);
    tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.EMERALD_LITE } };
    drop(tCell, ['One-Time', 'Recurring']);
    const amtCell = ws.getCell(row, 6);
    amtCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AMBER_LIGHT } };
    amtCell.numFmt = '$#,##0.00';
    amtCell.border = {
      top: { style: 'thin' as BorderStyle, color: { argb: C.AMBER } },
      left: { style: 'thin' as BorderStyle, color: { argb: C.AMBER } },
      bottom: { style: 'thin' as BorderStyle, color: { argb: C.AMBER } },
      right: { style: 'thin' as BorderStyle, color: { argb: C.AMBER } },
    };
    const fCell = ws.getCell(row, 7);
    fCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.EMERALD_LITE } };
    drop(fCell, ['Once', 'Monthly', 'Annual', 'Quarterly']);
    [8, 9].forEach((c) => {
      const cell = ws.getCell(row, c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.AMBER_LIGHT } };
      cell.border = amtCell.border;
    });
    const mCell = ws.getCell(row, 10);
    styleCell(mCell, C.TEAL_LIGHT, C.NAVY, 10, false, 'right');
    mCell.value = {
      formula: `IF(E${row}="One-Time",F${row},IF(G${row}="Monthly",F${row},IF(G${row}="Annual",F${row}/12,IF(G${row}="Quarterly",F${row}/3,0))))`,
    } as never;
    mCell.numFmt = '$#,##0.00';
    ws.getCell(row, 11).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.EMERALD_LITE } };
    row++;
  }

  // Capture the last data row (last buffer row). Summary formulas below MUST
  // stop here — extending into the summary rows themselves causes circular
  // references in Excel AND would double-count via the category-name match.
  const lastDataRow = row - 1;

  // Summary
  row += 2;
  secHead(ws, row++, 2, 10, '  EXPENSE SUMMARY BY CATEGORY');
  EXPENSE_CATEGORIES.forEach((cat: ExpenseCategory) => {
    ws.getRow(row).height = 26;
    ws.mergeCells(row, 3, row, 5);
    const catCell = ws.getCell(row, 3);
    styleCell(catCell, (CAT_BG[cat] ?? C.WARM_GRAY) as never, C.WHITE, 10, true, 'left');
    catCell.value = cat;
    const sumCell = ws.getCell(row, 10);
    styleCell(sumCell, C.TEAL_LIGHT, C.NAVY, 10, true, 'right');
    sumCell.value = { formula: `SUMIF(C7:C${lastDataRow},"${cat}",J7:J${lastDataRow})` } as never;
    sumCell.numFmt = '$#,##0.00';
    addNote(sumCell, `Steady-state monthly burn for ${cat}. Sum of the "Monthly $" column (J) for every row tagged ${cat}, including amortized annual/quarterly costs.`);
    row++;
  });

  ws.getRow(row).height = 32;
  banner(ws, row, 3, 3, 'TOTAL MONTHLY BURN (steady-state)', C.NAVY, C.WHITE, 11, true).alignment = { horizontal: 'left', vertical: 'middle' };
  const burnCell = ws.getCell(row, 10);
  styleCell(burnCell, C.NAVY, C.CORAL, 13, true, 'right');
  burnCell.value = { formula: `SUM(J7:J${lastDataRow})` } as never;
  burnCell.numFmt = '$#,##0.00';
  addNote(burnCell, 'Total recurring monthly burn across all categories. Sum of column J. This is the "$X/month to keep the lights on" number — multiply by 12 for annual run-rate.');
  row++;

  ws.getRow(row).height = 26;
  banner(ws, row, 3, 3, 'TOTAL ONE-TIME COSTS', C.NAVY_MID, C.WHITE, 10, true).alignment = { horizontal: 'left', vertical: 'middle' };
  const oneTimeCell = ws.getCell(row, 10);
  styleCell(oneTimeCell, C.NAVY_MID, C.AMBER, 11, true, 'right');
  oneTimeCell.value = { formula: `SUMIF(E7:E${lastDataRow},"One-Time",F7:F${lastDataRow})` } as never;
  oneTimeCell.numFmt = '$#,##0.00';
  addNote(oneTimeCell, 'Sum of all one-time costs — incorporation, attorney fees, trademarks, conference, launch ads. These hit your cash flow once in the month they\'re scheduled (column H).');
}
