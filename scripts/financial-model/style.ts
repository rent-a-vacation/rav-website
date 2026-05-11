import type { Cell, Worksheet, Workbook, BorderStyle } from 'exceljs';
import { C, type RavColor } from './colors.ts';

type HAlign = 'left' | 'center' | 'right';

/**
 * Apply RAV brand styling to a cell (or merged range — caller passes the
 * top-left cell after merging). Equivalent of rav() helper in the .gs.
 */
export function styleCell(
  cell: Cell,
  bg: RavColor,
  fg: RavColor,
  size = 10,
  bold = false,
  align: HAlign = 'left',
  wrap = false,
): Cell {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  cell.font = { name: 'Calibri', size, bold, color: { argb: fg } };
  cell.alignment = { horizontal: align, vertical: 'middle', wrapText: wrap };
  return cell;
}

/**
 * Style every cell in a merged range. exceljs merge() doesn't propagate
 * styles automatically, so we walk the range.
 */
export function styleRange(
  ws: Worksheet,
  r1: number, c1: number, r2: number, c2: number,
  bg: RavColor, fg: RavColor,
  size = 10, bold = false, align: HAlign = 'left', wrap = false,
): void {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      styleCell(ws.getCell(r, c), bg, fg, size, bold, align, wrap);
    }
  }
}

/**
 * Merged banner cell with text + style. Returns the top-left cell.
 */
export function banner(
  ws: Worksheet,
  row: number, col: number, span: number,
  text: string, bg: RavColor, fg: RavColor,
  size = 12, bold = true,
): Cell {
  ws.mergeCells(row, col, row, col + span - 1);
  styleRange(ws, row, col, row, col + span - 1, bg, fg, size, bold, 'center', false);
  const cell = ws.getCell(row, col);
  cell.value = text;
  return cell;
}

/**
 * Section header — left-aligned navy-mid bar with white text.
 */
export function secHead(
  ws: Worksheet, row: number, col: number, span: number, text: string,
): Cell {
  ws.mergeCells(row, col, row, col + span - 1);
  styleRange(ws, row, col, row, col + span - 1, C.NAVY_MID, C.WHITE, 10, true, 'left', false);
  const cell = ws.getCell(row, col);
  cell.value = '  ' + text;
  ws.getRow(row).height = 26;
  return cell;
}

/**
 * Label cell — sand background, navy text.
 */
export function lbl(ws: Worksheet, row: number, col: number, text: string): Cell {
  const cell = ws.getCell(row, col);
  styleCell(cell, C.SAND, C.NAVY, 10, false, 'left', false);
  cell.value = text;
  return cell;
}

/**
 * Editable input cell — amber-light background, amber border, named range optional.
 * The named range becomes a workbook-level defined name usable in formulas.
 */
export function inp(
  wb: Workbook, ws: Worksheet,
  row: number, col: number,
  value: string | number,
  fmt?: string, name?: string,
): Cell {
  const cell = ws.getCell(row, col);
  styleCell(cell, C.AMBER_LIGHT, C.NAVY, 10, true, 'right', false);
  cell.value = value;
  cell.border = {
    top:    { style: 'thin' as BorderStyle, color: { argb: C.AMBER } },
    left:   { style: 'thin' as BorderStyle, color: { argb: C.AMBER } },
    bottom: { style: 'thin' as BorderStyle, color: { argb: C.AMBER } },
    right:  { style: 'thin' as BorderStyle, color: { argb: C.AMBER } },
  };
  if (fmt) cell.numFmt = fmt;
  if (name) {
    // exceljs supports per-cell names that auto-register as workbook defined names
    cell.name = name;
  }
  return cell;
}

/**
 * Calculated cell — teal-light background, navy text, holds a formula.
 */
export function calc(
  ws: Worksheet, row: number, col: number,
  formula: string, fmt?: string,
): Cell {
  const cell = ws.getCell(row, col);
  styleCell(cell, C.TEAL_LIGHT, C.NAVY, 10, false, 'right', false);
  // exceljs takes formula without leading '='
  cell.value = { formula: formula.replace(/^=/, '') } as never;
  if (fmt) cell.numFmt = fmt;
  return cell;
}

/**
 * Info note row — italic amber on amber-light.
 */
export function note(
  ws: Worksheet, row: number, col: number, span: number, text: string,
): Cell {
  ws.mergeCells(row, col, row, col + span - 1);
  styleRange(ws, row, col, row, col + span - 1, C.AMBER_LIGHT, C.AMBER, 9, false, 'left', false);
  const cell = ws.getCell(row, col);
  cell.value = 'i  ' + text;
  cell.font = { ...(cell.font ?? {}), italic: true };
  ws.getRow(row).height = 22;
  return cell;
}

/**
 * Dropdown / list data validation.
 */
export function drop(cell: Cell, opts: string[]): void {
  cell.dataValidation = {
    type: 'list',
    allowBlank: false,
    formulae: [`"${opts.join(',')}"`],
    showErrorMessage: true,
    errorStyle: 'stop',
    error: 'Select one of: ' + opts.join(', '),
  };
}

/**
 * Convenience: write a cell with a formula (handles leading '=').
 */
export function formula(cell: Cell, f: string, fmt?: string): Cell {
  cell.value = { formula: f.replace(/^=/, '') } as never;
  if (fmt) cell.numFmt = fmt;
  return cell;
}

/**
 * Convert column number (1-based) to letter (1=A, 27=AA).
 */
export function colLtr(n: number): string {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/**
 * Set column widths from an array of pixel widths.
 * exceljs width units are roughly pixels / 7 for the default font.
 */
export function setColumnPixelWidths(ws: Worksheet, widths: number[]): void {
  widths.forEach((px, i) => {
    ws.getColumn(i + 1).width = px / 7;
  });
}
