import type { Workbook } from 'exceljs';
import { C } from '../colors.ts';
import { banner, styleCell, secHead, note, setColumnPixelWidths } from '../style.ts';
import { PLATFORM_FACTS, MILESTONES } from '../data.ts';

export function buildFundingAskTab(wb: Workbook): void {
  const ws = wb.addWorksheet('FUNDING ASK', { properties: { tabColor: { argb: C.NAVY } } });

  setColumnPixelWidths(ws, [20, 30, 220, 200, 140, 200]);

  ws.getRow(1).height = 60;
  banner(ws, 1, 2, 5, 'RENT-A-VACATION — FUNDING OVERVIEW', C.NAVY, C.CORAL, 20, true);
  ws.getRow(2).height = 30;
  banner(ws, 2, 2, 5, '"Name Your Price. Book Your Paradise."  ·  rent-a-vacation.com  ·  CONFIDENTIAL', C.NAVY_MID, C.AMBER, 11, false);
  ws.getRow(3).height = 8;

  let r = 4;

  // THE ASK
  secHead(ws, r++, 2, 5, '  THE ASK');

  // v3.1 — fixed: formulas reference data column D, not label column C
  // r=5 maps to D5 = 6-Mo Runway, r=6→D6 = 12-Mo Runway, r=7→D7 = contingency, r=8→D8 = total ask
  const asks: [string, string, string][] = [
    ['6-Month Runway (minimum viable)',  "='BREAK-EVEN'!F5", 'Incorporation, legal, tools, initial marketing to beta launch'],
    ['12-Month Runway (target)',          "='BREAK-EVEN'!G5", 'Beta launch, growth, first conference, first Offers and Wishes'],
    ['Contingency Buffer (15%)',          '=D6*0.15',          '15% buffer on 12-month runway for unknowns'],
    ['RECOMMENDED SEED ASK',             '=D6+D7',            'Total: 12-month runway + contingency buffer'],
  ];
  asks.forEach((a, i) => {
    const isTotal = i === 3;
    ws.getRow(r).height = isTotal ? 40 : 28;
    const lblCell = ws.getCell(r, 3);
    styleCell(lblCell, isTotal ? C.NAVY : C.SAND, isTotal ? C.WHITE : C.NAVY, isTotal ? 13 : 10, true, 'left');
    lblCell.value = a[0];

    const valCell = ws.getCell(r, 4);
    styleCell(valCell, isTotal ? C.CORAL : C.TEAL_LIGHT, isTotal ? C.WHITE : C.NAVY, isTotal ? 20 : 13, true, 'right');
    valCell.value = { formula: a[1].replace(/^=/, '') } as never;
    valCell.numFmt = '$#,##0';

    ws.mergeCells(r, 5, r, 6);
    const noteCell = ws.getCell(r, 5);
    styleCell(noteCell, isTotal ? C.NAVY_MID : C.CREAM, isTotal ? C.TEAL_LIGHT : C.SLATE, 9, false, 'left');
    noteCell.value = a[2];
    r++;
  });
  r++;

  // USE OF FUNDS
  secHead(ws, r++, 2, 5, '  USE OF FUNDS');
  ['Category', 'Amount', '% of Ask', 'Notes'].forEach((h, i) => {
    const cell = ws.getCell(r, i + 3);
    styleCell(cell, C.NAVY_MID, C.WHITE, 10, true, i === 1 ? 'right' : i === 2 ? 'center' : 'left');
    cell.value = h;
  });
  ws.getRow(r).height = 26;
  r++;

  // 12-month spend by category: One-Time items at full amount + Recurring × 12.
  // Same formula structure for all 5 categories — v3.2 fixed inconsistencies that
  // were over-counting Operations & Tools, double-counting Marketing/Compliance/People
  // one-time items, and missing recurring legal costs.
  const twelveMonthByCategory = (cat: string) =>
    `SUMIFS(EXPENSES!F7:F500,EXPENSES!C7:C500,"${cat}",EXPENSES!E7:E500,"One-Time")+` +
    `SUMIFS(EXPENSES!J7:J500,EXPENSES!C7:C500,"${cat}",EXPENSES!E7:E500,"Recurring")*12`;

  const funds: [string, string, string][] = [
    ['Legal & Formation',   twelveMonthByCategory('Legal & Formation'),  'Atlas $500 + IP assignments + attorney + ToS/Privacy + 3 trademark filings + Year-1 registered agent (Atlas) — most are one-time'],
    ['Operations & Tools',  twelveMonthByCategory('Operations & Tools'), 'SaaS stack for 12 months: Claude Max, Vercel, Supabase, VAPI, OpenRouter, Twilio, GitHub, Canva, IDEs, domain — plus Twilio A2P 10DLC one-time'],
    ['Marketing & Launch',  twelveMonthByCategory('Marketing & Launch'), 'Launch ads + conference (registration + travel + booth) + 6+ months sustained social/Google ads'],
    ['Compliance & Tax',    twelveMonthByCategory('Compliance & Tax'),   'CPA annual + DE franchise + state franchise + D&O / E&O / GL insurance + Stripe Tax + Puzzle accounting (mostly free tier)'],
    ['People',              twelveMonthByCategory('People & Admin'),     'Founder stipends + contractor placeholder + test management — set to $0 today; activate via INPUTS Section F (Founder Comp) or by editing EXPENSES directly'],
    ['Contingency Buffer',  'D7',                                         'From The Ask above — 15% buffer on 12-month runway. Auto-calculated; do not edit here.'],
  ];
  funds.forEach((f, i) => {
    ws.getRow(r).height = 26;
    const labelCell = ws.getCell(r, 3);
    styleCell(labelCell, i % 2 === 0 ? C.SAND : C.CREAM, C.NAVY, 10, false, 'left');
    labelCell.value = f[0];

    const amtCell = ws.getCell(r, 4);
    styleCell(amtCell, C.TEAL_LIGHT, C.NAVY, 10, false, 'right');
    amtCell.value = { formula: f[1] } as never;
    amtCell.numFmt = '$#,##0';

    const pctCell = ws.getCell(r, 5);
    styleCell(pctCell, i % 2 === 0 ? C.WHITE : C.CREAM, C.SLATE, 10, false, 'center');
    pctCell.value = { formula: `D${r}/$D$8` } as never;
    pctCell.numFmt = '0.0%';

    const notesCell = ws.getCell(r, 6);
    styleCell(notesCell, i % 2 === 0 ? C.WHITE : C.CREAM, C.SLATE, 9, false, 'left', true);
    notesCell.value = f[2];
    r++;
  });
  r++;

  // PLATFORM FACTS
  secHead(ws, r++, 2, 5, '  PLATFORM FACTS  (what is already built)');
  PLATFORM_FACTS.forEach((f, i) => {
    ws.getRow(r).height = 28;
    const lblCell = ws.getCell(r, 3);
    styleCell(lblCell, i % 2 === 0 ? C.NAVY : C.NAVY_MID, C.WHITE, 10, true, 'left');
    lblCell.value = f[0];
    ws.mergeCells(r, 4, r, 6);
    const valCell = ws.getCell(r, 4);
    styleCell(valCell, i % 2 === 0 ? C.SAND : C.CREAM, C.NAVY, 10, false, 'left', true);
    valCell.value = f[1];
    r++;
  });
  r++;

  // MILESTONES
  secHead(ws, r++, 2, 5, '  KEY MILESTONES — Use of Funding Timeline');
  ['Timeline', 'Area', 'Milestone'].forEach((h, i) => {
    const cell = ws.getCell(r, i + 3);
    styleCell(cell, C.NAVY_MID, C.WHITE, 10, true, 'left');
    cell.value = h;
  });
  ws.getRow(r).height = 26;
  r++;

  MILESTONES.forEach((m, i) => {
    ws.getRow(r).height = 32;
    const tlCell = ws.getCell(r, 3);
    styleCell(tlCell, i % 2 === 0 ? C.DEEP_TEAL : C.NAVY_MID, C.WHITE, 10, true, 'center');
    tlCell.value = m[0];

    const areaCell = ws.getCell(r, 4);
    styleCell(areaCell, i % 2 === 0 ? C.TEAL_LIGHT : C.SAND, C.DEEP_TEAL, 10, true, 'left');
    areaCell.value = m[1];

    ws.mergeCells(r, 5, r, 6);
    const msCell = ws.getCell(r, 5);
    styleCell(msCell, i % 2 === 0 ? C.CREAM : C.WHITE, C.NAVY, 10, false, 'left', true);
    msCell.value = m[2];
    r++;
  });
  r += 2;
  note(ws, r, 2, 5, 'Auto-populated from INPUTS and EXPENSES. Before investor meetings: verify claims against BRAND-LOCK.md Section 5.');
}
