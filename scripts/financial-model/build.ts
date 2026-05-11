/**
 * RAV Financial Model — Excel generator.
 *
 * Run via: npm run financials:build
 *
 * Produces: docs/financials/RAV_Financial_Model_YYYY-MM-DD.xlsx
 *
 * The output .xlsx is CONFIDENTIAL and gitignored. The .ts sources here are
 * the single source of truth — both for this generator and (eventually) for
 * the Phase 2 web tool on /executive-dashboard.
 */
import ExcelJS from 'exceljs';
import path from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Monkey-patch exceljs's hardcoded comment-box dimensions. The default size
// (width:97.8pt × height:59.1pt, hardcoded in vml-shape-xform.js) is too small
// for our explanatory hover notes — long ones get cut off. We bump it to
// 280pt × 140pt so a typical 200-300 char note fits comfortably.
//
// This patches a private internal of exceljs. If the library reorganizes its
// internals, this import path may need to be updated.
type ShapeXformModule = {
  default?: { V_SHAPE_ATTRIBUTES: (model: unknown, index: number) => Record<string, unknown> };
  V_SHAPE_ATTRIBUTES?: (model: unknown, index: number) => Record<string, unknown>;
};
const shapeXformMod = (await import(
  // @ts-expect-error — accessing a CJS internal not on the public API
  'exceljs/lib/xlsx/xform/comment/vml-shape-xform.js'
)) as ShapeXformModule;
const VmlShapeXform = (shapeXformMod.default ?? shapeXformMod) as {
  V_SHAPE_ATTRIBUTES: (model: { note?: { margins?: { insetmode?: string } } }, index: number) => Record<string, unknown>;
};
VmlShapeXform.V_SHAPE_ATTRIBUTES = (model, index) => ({
  id: `_x0000_s${1025 + index}`,
  type: '#_x0000_t202',
  style: 'position:absolute; margin-left:105.3pt;margin-top:10.5pt;width:280pt;height:140pt;z-index:1;visibility:hidden',
  fillcolor: 'infoBackground [80]',
  strokecolor: 'none [81]',
  'o:insetmode': model.note?.margins?.insetmode,
});

import { buildCoverTab }        from './tabs/cover.ts';
import { buildInputsTab }       from './tabs/inputs.ts';
import { buildExpensesTab }     from './tabs/expenses.ts';
import { buildRevenueTab }      from './tabs/revenue.ts';
import { buildBreakevenTab }    from './tabs/breakeven.ts';
import { buildUnitEconTab }     from './tabs/unit-econ.ts';
import { buildSensitivityTab }  from './tabs/sensitivity.ts';
import { buildFundingAskTab }   from './tabs/funding.ts';
import { buildInstructionsTab } from './tabs/instructions.ts';

async function main(): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'RAV Financial Model Generator';
  wb.company = 'Rent-A-Vacation, Inc.';
  wb.created = new Date();
  wb.modified = new Date();

  // Filename includes HH-MM so a same-day rerun produces a new file instead
  // of silently overwriting. Excel files are gitignored — disk cost is trivial,
  // and the timestamp creates a natural audit trail.
  const iso = wb.created.toISOString();
  const dateLabel = iso.slice(0, 10);                          // 2026-05-11
  const timeLabel = iso.slice(11, 16).replace(':', '');        // 1432
  const stampLabel = `${dateLabel}_${timeLabel}`;              // 2026-05-11_1432
  const longLabel = wb.created.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });

  buildCoverTab(wb, longLabel);
  buildInputsTab(wb);
  buildExpensesTab(wb);
  buildRevenueTab(wb);
  buildBreakevenTab(wb);
  buildUnitEconTab(wb);
  buildSensitivityTab(wb);
  buildFundingAskTab(wb);
  buildInstructionsTab(wb);

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const outDir = path.resolve(__dirname, '..', '..', 'docs', 'financials');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `RAV_Financial_Model_${stampLabel}.xlsx`);

  await wb.xlsx.writeFile(outPath);
  // eslint-disable-next-line no-console
  console.log(`✓ Wrote ${outPath}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
