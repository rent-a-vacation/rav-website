/**
 * Dump the investor-FAQ data as JSON for /generate-docs --investor-faq.
 *
 * Calls project() for all three scenarios + extracts subscription tiers,
 * commission rates, funding ask, unit economics, expense structure — all
 * from the canonical financial model. Same source of truth as the .xlsx
 * and the web /executive-dashboard/financial-model dashboard.
 *
 * Usage:  npx tsx scripts/financial-model/dump-investor-faq.ts
 * Output: JSON to stdout
 */

import {
  EXPENSES,
  HORIZON,
  PLATFORM,
  RESERVES,
  SUBSCRIPTIONS,
  UNIT_ECON,
} from '../../src/lib/financial-model/data.ts';
import { project, type Scenario } from '../../src/lib/financial-model/calc.ts';
import { DEFAULT_COMMISSION, EFFECTIVE_RATES } from '../../src/config/commission.ts';

type ExpenseRow = (typeof EXPENSES)[number];

function monthlyContribution(row: ExpenseRow, mo: number): number {
  if (mo < row.startMo || mo > row.endMo) return 0;
  if (row.type === 'One-Time') {
    const span = Math.max(1, row.endMo - row.startMo + 1);
    return row.amount / span;
  }
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

function currentModelMonth(): number {
  const horizonRow = HORIZON.find((r) => r.name === 'gHorizon');
  const horizon = typeof horizonRow?.value === 'number' ? horizonRow.value : 24;
  const now = new Date();
  const monthsSinceModelStart =
    (now.getUTCFullYear() - 2026) * 12 + (now.getUTCMonth() + 1 - 5) + 1;
  return Math.max(1, Math.min(horizon, monthsSinceModelStart));
}

function calendarLabelForMonth(mo: number): string {
  const calMonth = ((mo - 1 + 4) % 12) + 1;
  const calYear = 2026 + Math.floor((mo - 1 + 4) / 12);
  const monthName = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ][calMonth - 1];
  return `${monthName} ${calYear}`;
}

function val(rows: typeof PLATFORM, name: string): number {
  const row = rows.find((r) => r.name === name);
  return typeof row?.value === 'number' ? row.value : 0;
}

function getInputRowByName(rows: typeof PLATFORM, name: string) {
  return rows.find((r) => r.name === name);
}

// ─── Build the FAQ payload ───────────────────────────────────────────────────

const today = currentModelMonth();
const scenarios: Scenario[] = ['Conservative', 'Base', 'Optimistic'];

const projections = scenarios.map((s) => {
  const p = project(s);
  return {
    scenario: s,
    breakEvenMonth: p.breakEvenMonth,
    breakEvenLabel: p.breakEvenMonth ? calendarLabelForMonth(p.breakEvenMonth) : null,
    totalRevenue24mo: p.totals.totalRevenue24mo,
    totalGBV24mo: p.totals.totalGBV24mo,
    totalCommissionNet24mo: p.totals.totalCommissionNet24mo,
    totalCosts24mo: p.totals.totalCosts24mo,
    totalProfit24mo: p.totals.totalProfit24mo,
    blendedCommissionRate: p.totals.blendedCommissionRate,
    monthlyBurnSteadyState: p.monthlyBurnSteadyState,
    // Snapshots at Mo 6 / 12 / 18 / 24
    snapshots: [6, 12, 18, 24].map((mo) => {
      const row = p.monthly.find((m) => m.month === mo);
      return row
        ? {
            month: mo,
            calendarLabel: calendarLabelForMonth(mo),
            activeOwners: row.activeOwners,
            activeTravelers: row.activeTravelers,
            bookings: row.bookings,
            monthlyRevenue: row.totalRevenue,
            cumulativeCash: row.cumulativeCash,
          }
        : null;
    }).filter(Boolean),
  };
});

const breakdownToday = categoryBreakdownForMonth(today);
const topCategoriesToday = Object.entries(breakdownToday)
  .map(([category, amount]) => ({ category, amount }))
  .filter((c) => c.amount > 0)
  .sort((a, b) => b.amount - a.amount);
const totalToday = topCategoriesToday.reduce((sum, c) => sum + c.amount, 0);

const fundingMonth = val(RESERVES, 'gFundMonth');
const fundingAmount = val(RESERVES, 'gFundAmt');
const startingCash = val(RESERVES, 'gStartCash');
const founderComp = val(RESERVES, 'gFndComp');
const founderCount = val(RESERVES, 'gFndCount');
const funded = val(RESERVES, 'gFunded');

const dump = {
  generated_at: new Date().toISOString(),
  today_model_month: today,
  today_calendar_label: calendarLabelForMonth(today),
  // Q1 — Commission structure
  commission: {
    base_pct: DEFAULT_COMMISSION.base * 100,
    pro_discount_pp: DEFAULT_COMMISSION.proDiscount * 100,
    business_discount_pp: DEFAULT_COMMISSION.businessDiscount * 100,
    effective_rates_pct: {
      free: EFFECTIVE_RATES.free * 100,
      pro: EFFECTIVE_RATES.pro * 100,
      business: EFFECTIVE_RATES.business * 100,
    },
    runtime_source: 'system_settings.platform_commission_rate (DEC-043)',
    fallback_source: 'src/config/commission.ts DEFAULT_COMMISSION',
  },
  // Q2 — Subscription tiers
  subscriptions: SUBSCRIPTIONS.map((s) => ({
    label: s.label,
    price_usd: typeof s.value === 'number' ? s.value : 0,
    notes: s.note,
  })),
  // Q3 — Today's monthly burn
  burn: {
    today_total: totalForMonth(today),
    steady_state: projections.find((p) => p.scenario === 'Base')?.monthlyBurnSteadyState ?? 0,
    top_categories: topCategoriesToday.map((c) => ({
      category: c.category,
      amount: c.amount,
      pct: totalToday > 0 ? (c.amount / totalToday) * 100 : 0,
    })),
  },
  // Q4-Q9 — Projection answers per scenario
  projections,
  // Q7 — Funding ask
  funding: {
    month: fundingMonth,
    month_calendar_label: fundingMonth > 0 ? calendarLabelForMonth(fundingMonth) : null,
    amount_usd: fundingAmount,
    starting_cash: startingCash,
    founder_comp_per_month: founderComp,
    founder_count: founderCount,
    funded_flag: funded === 1,
  },
  // Q10 — Unit economics
  unit_econ: {
    cohort_ramp_months: val(UNIT_ECON, 'uRampMonths'),
    avg_owner_lifetime_months: val(UNIT_ECON, 'uOwnLife'),
    avg_traveler_lifetime_months: val(UNIT_ECON, 'uTravLife'),
    voice_overage_per_traveler_per_month: val(UNIT_ECON, 'uVoiceOverage'),
    notes: {
      cohort_ramp: getInputRowByName(UNIT_ECON, 'uRampMonths')?.note,
      owner_lifetime: getInputRowByName(UNIT_ECON, 'uOwnLife')?.note,
      traveler_lifetime: getInputRowByName(UNIT_ECON, 'uTravLife')?.note,
    },
  },
  // Misc context
  context: {
    avg_booking_value: val(PLATFORM, 'pAvgBooking'),
    avg_nights_per_booking: val(PLATFORM, 'pAvgNights'),
    stripe_pct: val(PLATFORM, 'pStripePct') * 100,
    stripe_fixed: val(PLATFORM, 'pStripeFixed'),
    horizon_months: val(HORIZON, 'gHorizon'),
  },
};

console.log(JSON.stringify(dump, null, 2));
