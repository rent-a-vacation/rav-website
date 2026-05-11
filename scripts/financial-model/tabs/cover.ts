import type { Workbook } from 'exceljs';
import { C } from '../colors.ts';
import { banner, styleCell, styleRange, setColumnPixelWidths } from '../style.ts';

export function buildCoverTab(wb: Workbook, createdLabel: string): void {
  const ws = wb.addWorksheet('Cover', { properties: { tabColor: { argb: C.DEEP_TEAL } } });

  setColumnPixelWidths(ws, [30, 50, 320, 240, 200]);

  ws.getRow(1).height = 16;
  ws.getRow(2).height = 70;
  banner(ws, 2, 2, 4, 'RENT-A-VACATION', C.NAVY, C.CORAL, 38, true);

  ws.getRow(3).height = 32;
  banner(ws, 3, 2, 4, 'Name Your Price. Book Your Paradise.', C.NAVY, C.AMBER, 14, false);

  ws.getRow(4).height = 42;
  banner(ws, 4, 2, 4, 'FINANCIAL MODEL & FUNDING PLANNER', C.DEEP_TEAL, C.WHITE, 17, true);

  ws.getRow(5).height = 12;
  ws.mergeCells(5, 2, 5, 5);
  styleRange(ws, 5, 2, 5, 5, C.CORAL, C.CORAL, 10, false, 'left');

  ws.getRow(6).height = 10;

  const meta: [string, string][] = [
    ['Document',     'Financial Model & Funding Planner — v3.2 (Phase 1b)'],
    ['Created',      createdLabel],
    ['Company',      'Rent-A-Vacation, Inc. (RAV)'],
    ['Parent Entity','Techsilon.com'],
    ['Website',      'rent-a-vacation.com'],
    ['Stage',        'Pre-Revenue · Pre-Incorporation · Product Built'],
    ['Horizon',      '24-Month Projection'],
    ['Status',       'CONFIDENTIAL — Not for external distribution'],
  ];
  let r = 7;
  meta.forEach((m, i) => {
    ws.getRow(r).height = 26;
    const lblCell = ws.getCell(r, 3);
    styleCell(lblCell, i % 2 === 0 ? C.NAVY : C.NAVY_MID, C.WHITE, 10, true, 'left');
    lblCell.value = m[0];
    ws.mergeCells(r, 4, r, 5);
    styleRange(ws, r, 4, r, 5, i % 2 === 0 ? C.SAND : C.CREAM, C.NAVY, 10, false, 'left');
    ws.getCell(r, 4).value = m[1];
    r++;
  });

  r += 2;
  banner(ws, r, 2, 4, '  SPREADSHEET NAVIGATION', C.NAVY, C.WHITE, 11, true);
  r++;

  const tabs: [string, string, string][] = [
    ['INPUTS',        C.DEEP_TEAL, 'Configure all parameters — commission rates, pricing, growth assumptions, tax & reserve inputs'],
    ['EXPENSES',      C.CORAL,     'Add and manage all one-time and recurring costs by category'],
    ['REVENUE MODEL', C.EMERALD,   '24-month projection — Conservative / Base / Optimistic scenario toggle'],
    ['BREAK-EVEN',    C.AMBER,     'Month-by-month cumulative cash position — break-even month auto-highlighted'],
    ['FUNDING ASK',   C.NAVY,      'One-page investor summary — auto-populated from your inputs and expenses'],
    ['INSTRUCTIONS',  C.SLATE,     'How to use this model, glossary of key terms'],
  ];
  tabs.forEach((t) => {
    ws.getRow(r).height = 28;
    const lblCell = ws.getCell(r, 3);
    styleCell(lblCell, t[1] as never, C.WHITE, 10, true, 'left');
    lblCell.value = t[0];
    ws.mergeCells(r, 4, r, 5);
    styleRange(ws, r, 4, r, 5, C.CREAM, C.NAVY, 10, false, 'left');
    ws.getCell(r, 4).value = t[2];
    r++;
  });

  r += 2;
  ws.getRow(r).height = 22;
  banner(ws, r, 2, 4, 'All projections are forward-looking estimates. Actual results will vary.', C.RED_LIGHT, C.RED, 9, false);
}
