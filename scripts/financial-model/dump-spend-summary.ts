/**
 * Dump a one-page spend summary as JSON for the /generate-docs --spend-brief
 * Python generator.
 *
 * Sources from src/lib/financial-model/data.ts so the brief always reflects
 * the same EXPENSES the .xlsx model uses. No duplication.
 *
 * Usage:  npx tsx scripts/financial-model/dump-spend-summary.ts
 * Output: JSON to stdout
 */

import { EXPENSES, HORIZON, type ExpenseCategory } from '../../src/lib/financial-model/data.ts';

type ExpenseRow = (typeof EXPENSES)[number];

/**
 * For a given model month (1-indexed), return the per-month spend contribution
 * of a single expense row.
 *
 * - One-Time rows contribute their full amount in months in [startMo, endMo]
 *   (treated as evenly spread across that range if endMo > startMo).
 * - Recurring Monthly rows contribute `amount` every month in [startMo, endMo].
 * - Recurring Annual rows contribute `amount / 12` every month in [startMo, endMo].
 */
function monthlyContribution(row: ExpenseRow, mo: number): number {
  if (mo < row.startMo || mo > row.endMo) return 0;
  if (row.type === 'One-Time') {
    const span = Math.max(1, row.endMo - row.startMo + 1);
    return row.amount / span;
  }
  // Recurring
  if (row.frequency === 'Monthly') return row.amount;
  if (row.frequency === 'Annual') return row.amount / 12;
  return 0;
}

function totalForMonth(mo: number): number {
  return EXPENSES.reduce((sum, row) => sum + monthlyContribution(row, mo), 0);
}

function categoryBreakdownForMonth(mo: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of EXPENSES) {
    const c = row.category;
    out[c] = (out[c] ?? 0) + monthlyContribution(row, mo);
  }
  return out;
}

/**
 * Today's model month. Model starts at May 2026 (Month 1 = May 2026).
 * Computes (current_year - 2026) * 12 + (current_month - 5) + 1.
 * Clamped to [1, gHorizon].
 */
function currentModelMonth(): number {
  const horizonRow = HORIZON.find((r) => r.name === 'gHorizon');
  const horizon = typeof horizonRow?.value === 'number' ? horizonRow.value : 24;
  const now = new Date();
  const monthsSinceModelStart =
    (now.getUTCFullYear() - 2026) * 12 + (now.getUTCMonth() + 1 - 5) + 1;
  return Math.max(1, Math.min(horizon, monthsSinceModelStart));
}

function topNCategoriesForMonth(mo: number, n: number): Array<{ category: string; amount: number; pct: number }> {
  const breakdown = categoryBreakdownForMonth(mo);
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return Object.entries(breakdown)
    .map(([category, amount]) => ({ category, amount, pct: total > 0 ? (amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n);
}

function curveSnapshots(): Array<{ month: number; label: string; total: number }> {
  // Show today + months 3, 6, 9, 12 ahead of today (or end of horizon, whichever is sooner)
  const horizonRow = HORIZON.find((r) => r.name === 'gHorizon');
  const horizon = typeof horizonRow?.value === 'number' ? horizonRow.value : 24;
  const today = currentModelMonth();
  const offsets = [0, 3, 6, 9, 12];
  return offsets
    .map((offset) => {
      const mo = today + offset;
      if (mo > horizon) return null;
      // Compute a calendar label: model month 1 = May 2026
      const calMonth = ((mo - 1 + 4) % 12) + 1; // 4 = May - Jan (0-indexed: May=4)
      const calYear = 2026 + Math.floor((mo - 1 + 4) / 12);
      const monthName = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ][calMonth - 1];
      const label = offset === 0
        ? `Today (Mo ${mo}, ${monthName} ${calYear})`
        : `+${offset}mo (Mo ${mo}, ${monthName} ${calYear})`;
      return { month: mo, label, total: totalForMonth(mo) };
    })
    .filter((x): x is { month: number; label: string; total: number } => x !== null);
}

function recurringVsOneTime(mo: number): { recurring: number; oneTime: number } {
  let recurring = 0;
  let oneTime = 0;
  for (const row of EXPENSES) {
    if (mo < row.startMo || mo > row.endMo) continue;
    if (row.type === 'One-Time') {
      const span = Math.max(1, row.endMo - row.startMo + 1);
      oneTime += row.amount / span;
    } else if (row.frequency === 'Monthly') {
      recurring += row.amount;
    } else if (row.frequency === 'Annual') {
      recurring += row.amount / 12;
    }
  }
  return { recurring, oneTime };
}

const today = currentModelMonth();
const summary = {
  generated_at: new Date().toISOString(),
  model_month_today: today,
  today_total_monthly_burn: totalForMonth(today),
  today_top_5_categories: topNCategoriesForMonth(today, 5),
  today_recurring_vs_onetime: recurringVsOneTime(today),
  curve: curveSnapshots(),
  total_expense_rows: EXPENSES.length,
};

console.log(JSON.stringify(summary, null, 2));
