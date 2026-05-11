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

import { buildCoverTab }        from './tabs/cover.ts';
import { buildInputsTab }       from './tabs/inputs.ts';
import { buildExpensesTab }     from './tabs/expenses.ts';
import { buildRevenueTab }      from './tabs/revenue.ts';
import { buildBreakevenTab }    from './tabs/breakeven.ts';
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
