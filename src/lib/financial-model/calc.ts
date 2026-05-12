/**
 * Pure-TypeScript calculation engine for the RAV Financial Model.
 *
 * Mirrors the formulas in the Excel/.xlsx generator (`scripts/financial-model/`)
 * but runs in-browser so the executive dashboard can display the BASE case
 * without opening Excel.
 *
 * Inputs: the data arrays exported from `data.ts` plus a scenario name.
 * Outputs: monthly arrays + aggregate totals, ready to feed React components.
 *
 * NOTE: this is the BASE case calculator. Sensitivity / scenario-switching /
 * cohort-grade LTV come in later stages.
 */

import { PLATFORM, GROWTH, RESERVES, HIRING, UNIT_ECON, EXPENSES, SUBSCRIPTIONS, SCENARIOS } from './data';

const MONTHS = 24;

/** Pull a value out of an InputRow array by named-range key. */
function val(rows: { name: string; value: string | number }[], name: string): number {
  const row = rows.find((r) => r.name === name);
  return typeof row?.value === 'number' ? row.value : 0;
}

export type Scenario = 'Conservative' | 'Base' | 'Optimistic';

export interface MonthlyProjection {
  month: number;
  activeOwners: number;
  activeTravelers: number;
  bookings: number;
  gbv: number;
  grossCommission: number;
  stripeFees: number;
  netCommission: number;
  subscriptionRev: number;
  voiceOverage: number;
  totalRevenue: number;
  totalCostsExpenses: number;
  hiringCosts: number;
  netPnL: number;
  cumulativeCash: number;
}

export interface ProjectionResult {
  scenario: Scenario;
  monthly: MonthlyProjection[];
  totals: {
    totalRevenue24mo: number;
    totalCosts24mo: number;
    totalProfit24mo: number;
    totalGBV24mo: number;
    totalCommissionGross24mo: number;
    totalCommissionNet24mo: number;
    totalStripeFees24mo: number;
    blendedCommissionRate: number;
  };
  breakEvenMonth: number | null;
  monthlyBurnSteadyState: number;
  oneTimeCostsTotal: number;
}

/**
 * Run the 24-month projection for the given scenario.
 *
 * Uses the same formulas as the Excel generator but expressed in TypeScript.
 * Edits to data.ts flow through here without needing a rebuild.
 */
export function project(scenario: Scenario = 'Base'): ProjectionResult {
  // ─── Pull inputs ──────────────────────────────────────────────────────────
  const pCommBase     = val(PLATFORM, 'pCommBase');
  const pProDisc      = val(PLATFORM, 'pProDisc');
  const pBizDisc      = val(PLATFORM, 'pBizDisc');
  const pAvgBooking   = val(PLATFORM, 'pAvgBooking');
  const pStripePct    = val(PLATFORM, 'pStripePct');
  const pStripeFixed  = val(PLATFORM, 'pStripeFixed');

  const gLaunchMo     = val(GROWTH, 'gLaunchMo');
  const gStartOwn     = val(GROWTH, 'gStartOwn');
  const gStartTrav    = val(GROWTH, 'gStartTrav');
  const gOwnGrowth    = val(GROWTH, 'gOwnGrowth');
  const gTravGrowth   = val(GROWTH, 'gTravGrowth');
  const gBookPerOwn   = val(GROWTH, 'gBookPerOwn');
  const gMix0         = val(GROWTH, 'gMix0');
  const gMix1         = val(GROWTH, 'gMix1');
  const gMix2         = val(GROWTH, 'gMix2');
  const gOwn1         = val(GROWTH, 'gOwn1');
  const gOwn2         = val(GROWTH, 'gOwn2');
  const gTrav1        = val(GROWTH, 'gTrav1');
  const gTrav2        = val(GROWTH, 'gTrav2');

  const gStartCash    = val(RESERVES, 'gStartCash');
  const gFundMonth    = val(RESERVES, 'gFundMonth');
  const gFundAmt      = val(RESERVES, 'gFundAmt');

  const hEngMonth     = val(HIRING, 'hEngMonth');
  const hEngCost      = val(HIRING, 'hEngCost');
  const hSupMonth     = val(HIRING, 'hSupMonth');
  const hSupCost      = val(HIRING, 'hSupCost');
  const hBDMonth      = val(HIRING, 'hBDMonth');
  const hBDCost       = val(HIRING, 'hBDCost');

  const uRampMonths   = val(UNIT_ECON, 'uRampMonths');
  const uVoiceOverage = val(UNIT_ECON, 'uVoiceOverage');

  const sOwnerPro     = val(SUBSCRIPTIONS, 'sOwnerPro');
  const sOwnerBiz     = val(SUBSCRIPTIONS, 'sOwnerBiz');
  const sTravPlus     = val(SUBSCRIPTIONS, 'sTravPlus');
  const sTravPrem     = val(SUBSCRIPTIONS, 'sTravPrem');

  // Scenario multipliers
  const bookMult = scenario === 'Conservative' ? val(SCENARIOS, 'scConBook')
                  : scenario === 'Optimistic'  ? val(SCENARIOS, 'scOptBook')
                  : val(SCENARIOS, 'scBaseBook');
  const growMult = scenario === 'Conservative' ? val(SCENARIOS, 'scConGrow')
                  : scenario === 'Optimistic'  ? val(SCENARIOS, 'scOptGrow')
                  : val(SCENARIOS, 'scBaseGrow');

  const blendedRate = gMix0 * pCommBase + gMix1 * (pCommBase - pProDisc) + gMix2 * (pCommBase - pBizDisc);

  // ─── Monthly projection ───────────────────────────────────────────────────
  const monthly: MonthlyProjection[] = [];
  let prevOwners = 0;
  let prevTravelers = 0;
  let cumulativeCash = gStartCash;

  for (let m = 1; m <= MONTHS; m++) {
    // Active counts (three-case: pre-launch / launch month / post-launch)
    let activeOwners: number;
    let activeTravelers: number;
    if (m < gLaunchMo) {
      activeOwners = 0;
      activeTravelers = 0;
    } else if (m === gLaunchMo) {
      activeOwners = gStartOwn;
      activeTravelers = gStartTrav;
    } else {
      activeOwners = prevOwners * (1 + gOwnGrowth * growMult);
      activeTravelers = prevTravelers * (1 + gTravGrowth * growMult);
    }

    // Cohort ramp factor
    const rampFactor = m >= gLaunchMo ? Math.min(1, (m - gLaunchMo + 1) / (uRampMonths || 1)) : 0;
    const bookings = m >= gLaunchMo ? activeOwners * gBookPerOwn * rampFactor * bookMult : 0;
    const gbv = bookings * pAvgBooking;

    const grossCommission = gbv * blendedRate;
    const stripeFees = (gbv * (1 + blendedRate) * pStripePct + bookings * pStripeFixed) * -1;
    const netCommission = grossCommission + stripeFees;

    // Subscription revenue
    const ownerProSubs = activeOwners * gOwn1 * sOwnerPro;
    const ownerBizSubs = activeOwners * gOwn2 * sOwnerBiz;
    const travPlusSubs = activeTravelers * gTrav1 * sTravPlus;
    const travPremSubs = activeTravelers * gTrav2 * sTravPrem;
    const subscriptionRev = ownerProSubs + ownerBizSubs + travPlusSubs + travPremSubs;

    // Voice overage (non-Premium travelers only)
    const voiceOverage = m >= gLaunchMo ? activeTravelers * (1 - gTrav2) * uVoiceOverage : 0;

    const totalRevenue = netCommission + subscriptionRev + voiceOverage;

    // Costs from EXPENSES — for each row, evaluate if it's active this month
    let totalCostsExpenses = 0;
    for (const e of EXPENSES) {
      if (e.type === 'Recurring' && e.startMo <= m && e.endMo >= m) {
        // Monthly equivalent (column J in the .xlsx)
        const monthlyEq = e.frequency === 'Monthly'    ? e.amount
                        : e.frequency === 'Annual'     ? e.amount / 12
                        : e.frequency === 'Quarterly'  ? e.amount / 3
                        : 0;
        totalCostsExpenses += monthlyEq;
      } else if (e.type === 'One-Time' && e.startMo === m) {
        totalCostsExpenses += e.amount;
      }
    }

    // Hiring costs (0 = no hire planned)
    const hireEng = hEngMonth > 0 && m >= hEngMonth ? hEngCost : 0;
    const hireSup = hSupMonth > 0 && m >= hSupMonth ? hSupCost : 0;
    const hireBD  = hBDMonth  > 0 && m >= hBDMonth  ? hBDCost  : 0;
    const hiringCosts = hireEng + hireSup + hireBD;

    const netPnL = totalRevenue - totalCostsExpenses - hiringCosts;

    // Cumulative cash includes funding inflow on the matching month
    const fundingInflow = m === gFundMonth ? gFundAmt : 0;
    cumulativeCash += netPnL + fundingInflow;

    monthly.push({
      month: m,
      activeOwners,
      activeTravelers,
      bookings,
      gbv,
      grossCommission,
      stripeFees,
      netCommission,
      subscriptionRev,
      voiceOverage,
      totalRevenue,
      totalCostsExpenses,
      hiringCosts,
      netPnL,
      cumulativeCash,
    });

    prevOwners = activeOwners;
    prevTravelers = activeTravelers;
  }

  // ─── Aggregates ───────────────────────────────────────────────────────────
  const totals = {
    totalRevenue24mo:        monthly.reduce((s, r) => s + r.totalRevenue, 0),
    totalCosts24mo:          monthly.reduce((s, r) => s + r.totalCostsExpenses + r.hiringCosts, 0),
    totalProfit24mo:         monthly.reduce((s, r) => s + r.netPnL, 0),
    totalGBV24mo:            monthly.reduce((s, r) => s + r.gbv, 0),
    totalCommissionGross24mo: monthly.reduce((s, r) => s + r.grossCommission, 0),
    totalCommissionNet24mo:  monthly.reduce((s, r) => s + r.netCommission, 0),
    totalStripeFees24mo:     monthly.reduce((s, r) => s + r.stripeFees, 0),
    blendedCommissionRate:   blendedRate,
  };

  // Break-even month: first month cumulativeCash > 0
  const breakEvenMonth = monthly.find((r) => r.cumulativeCash > 0)?.month ?? null;

  // Steady-state monthly burn from EXPENSES recurring rows
  const monthlyBurnSteadyState = EXPENSES
    .filter((e) => e.type === 'Recurring')
    .reduce((sum, e) => {
      const monthlyEq = e.frequency === 'Monthly'    ? e.amount
                       : e.frequency === 'Annual'    ? e.amount / 12
                       : e.frequency === 'Quarterly' ? e.amount / 3
                       : 0;
      return sum + monthlyEq;
    }, 0);

  const oneTimeCostsTotal = EXPENSES
    .filter((e) => e.type === 'One-Time')
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    scenario,
    monthly,
    totals,
    breakEvenMonth,
    monthlyBurnSteadyState,
    oneTimeCostsTotal,
  };
}
