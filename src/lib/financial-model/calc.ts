/**
 * Pure-TypeScript calculation engine for the RAV Financial Model.
 *
 * Inputs default to the canonical baseline imports from data.ts.
 * Stage 2c (#550): accepts an optional `inputs` arg so the merged
 * (baseline ← scenario.overrides ← draft) view-model can flow through;
 * and an optional `commissionRate` so the live DB rate (per DEC-043)
 * replaces the build-time fallback.
 */

import {
  PLATFORM,
  GROWTH,
  RESERVES,
  HIRING,
  UNIT_ECON,
  EXPENSES,
  SUBSCRIPTIONS,
  SCENARIOS,
  HORIZON,
  type InputRow,
  type ExpenseRow,
} from './data';
import { DEFAULT_COMMISSION } from '@/config/commission';

function val(rows: { name: string; value: string | number }[], name: string): number {
  const row = rows.find((r) => r.name === name);
  return typeof row?.value === 'number' ? row.value : 0;
}

export type Scenario = 'Conservative' | 'Base' | 'Optimistic';

export interface ModelInputs {
  platform: InputRow[];
  subscriptions: InputRow[];
  growth: InputRow[];
  scenarios: InputRow[];
  horizon: InputRow[];
  reserves: InputRow[];
  hiring: InputRow[];
  unitEcon: InputRow[];
  expenses: ExpenseRow[];
}

export interface CommissionRate {
  base: number;
  proDiscount: number;
  businessDiscount: number;
}

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

export const CANONICAL_BASELINE: ModelInputs = {
  platform: PLATFORM,
  subscriptions: SUBSCRIPTIONS,
  growth: GROWTH,
  scenarios: SCENARIOS,
  horizon: HORIZON,
  reserves: RESERVES,
  hiring: HIRING,
  unitEcon: UNIT_ECON,
  expenses: EXPENSES,
};

export function project(
  scenario: Scenario = 'Base',
  inputs: ModelInputs = CANONICAL_BASELINE,
  commissionRate?: CommissionRate,
): ProjectionResult {
  const rate: CommissionRate = commissionRate ?? {
    base: val(inputs.platform, 'pCommBase') || DEFAULT_COMMISSION.base,
    proDiscount: val(inputs.platform, 'pProDisc') || DEFAULT_COMMISSION.proDiscount,
    businessDiscount: val(inputs.platform, 'pBizDisc') || DEFAULT_COMMISSION.businessDiscount,
  };

  const pAvgBooking   = val(inputs.platform, 'pAvgBooking');
  const pStripePct    = val(inputs.platform, 'pStripePct');
  const pStripeFixed  = val(inputs.platform, 'pStripeFixed');

  const gLaunchMo     = val(inputs.growth, 'gLaunchMo');
  const gStartOwn     = val(inputs.growth, 'gStartOwn');
  const gStartTrav    = val(inputs.growth, 'gStartTrav');
  const gOwnGrowth    = val(inputs.growth, 'gOwnGrowth');
  const gTravGrowth   = val(inputs.growth, 'gTravGrowth');
  const gBookPerOwn   = val(inputs.growth, 'gBookPerOwn');
  const gMix0         = val(inputs.growth, 'gMix0');
  const gMix1         = val(inputs.growth, 'gMix1');
  const gMix2         = val(inputs.growth, 'gMix2');
  const gOwn1         = val(inputs.growth, 'gOwn1');
  const gOwn2         = val(inputs.growth, 'gOwn2');
  const gTrav1        = val(inputs.growth, 'gTrav1');
  const gTrav2        = val(inputs.growth, 'gTrav2');

  const gStartCash    = val(inputs.reserves, 'gStartCash');
  const gFundMonth    = val(inputs.reserves, 'gFundMonth');
  const gFundAmt      = val(inputs.reserves, 'gFundAmt');

  const hEngMonth     = val(inputs.hiring, 'hEngMonth');
  const hEngCost      = val(inputs.hiring, 'hEngCost');
  const hSupMonth     = val(inputs.hiring, 'hSupMonth');
  const hSupCost      = val(inputs.hiring, 'hSupCost');
  const hBDMonth      = val(inputs.hiring, 'hBDMonth');
  const hBDCost       = val(inputs.hiring, 'hBDCost');

  const uRampMonths   = val(inputs.unitEcon, 'uRampMonths');
  const uVoiceOverage = val(inputs.unitEcon, 'uVoiceOverage');

  const sOwnerPro     = val(inputs.subscriptions, 'sOwnerPro');
  const sOwnerBiz     = val(inputs.subscriptions, 'sOwnerBiz');
  const sTravPlus     = val(inputs.subscriptions, 'sTravPlus');
  const sTravPrem     = val(inputs.subscriptions, 'sTravPrem');

  const bookMult = scenario === 'Conservative' ? val(inputs.scenarios, 'scConBook')
                  : scenario === 'Optimistic'  ? val(inputs.scenarios, 'scOptBook')
                  : val(inputs.scenarios, 'scBaseBook');
  const growMult = scenario === 'Conservative' ? val(inputs.scenarios, 'scConGrow')
                  : scenario === 'Optimistic'  ? val(inputs.scenarios, 'scOptGrow')
                  : val(inputs.scenarios, 'scBaseGrow');

  // ─── Pull inputs ──────────────────────────────────────────────────────────
  const months = val(inputs.horizon, 'gHorizon') || 24;

  const blendedRate =
      gMix0 * rate.base
    + gMix1 * (rate.base - rate.proDiscount)
    + gMix2 * (rate.base - rate.businessDiscount);

  // ─── Monthly projection ───────────────────────────────────────────────────
  const monthly: MonthlyProjection[] = [];
  let prevOwners = 0;
  let prevTravelers = 0;
  let cumulativeCash = gStartCash;

  for (let m = 1; m <= months; m++) {
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

    const rampFactor = m >= gLaunchMo ? Math.min(1, (m - gLaunchMo + 1) / (uRampMonths || 1)) : 0;
    const bookings = m >= gLaunchMo ? activeOwners * gBookPerOwn * rampFactor * bookMult : 0;
    const gbv = bookings * pAvgBooking;

    const grossCommission = gbv * blendedRate;
    const stripeFees = (gbv * (1 + blendedRate) * pStripePct + bookings * pStripeFixed) * -1;
    const netCommission = grossCommission + stripeFees;

    const ownerProSubs = activeOwners * gOwn1 * sOwnerPro;
    const ownerBizSubs = activeOwners * gOwn2 * sOwnerBiz;
    const travPlusSubs = activeTravelers * gTrav1 * sTravPlus;
    const travPremSubs = activeTravelers * gTrav2 * sTravPrem;
    const subscriptionRev = ownerProSubs + ownerBizSubs + travPlusSubs + travPremSubs;

    const voiceOverage = m >= gLaunchMo ? activeTravelers * (1 - gTrav2) * uVoiceOverage : 0;

    const totalRevenue = netCommission + subscriptionRev + voiceOverage;

    let totalCostsExpenses = 0;
    for (const e of inputs.expenses) {
      if (e.type === 'Recurring' && e.startMo <= m && e.endMo >= m) {
        const monthlyEq = e.frequency === 'Monthly'    ? e.amount
                        : e.frequency === 'Annual'     ? e.amount / 12
                        : e.frequency === 'Quarterly'  ? e.amount / 3
                        : 0;
        totalCostsExpenses += monthlyEq;
      } else if (e.type === 'One-Time' && e.startMo === m) {
        totalCostsExpenses += e.amount;
      }
    }

    const hireEng = hEngMonth > 0 && m >= hEngMonth ? hEngCost : 0;
    const hireSup = hSupMonth > 0 && m >= hSupMonth ? hSupCost : 0;
    const hireBD  = hBDMonth  > 0 && m >= hBDMonth  ? hBDCost  : 0;
    const hiringCosts = hireEng + hireSup + hireBD;

    const netPnL = totalRevenue - totalCostsExpenses - hiringCosts;

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

  const breakEvenMonth = monthly.find((r) => r.cumulativeCash > 0)?.month ?? null;

  const monthlyBurnSteadyState = inputs.expenses
    .filter((e) => e.type === 'Recurring')
    .reduce((sum, e) => {
      const monthlyEq = e.frequency === 'Monthly'    ? e.amount
                       : e.frequency === 'Annual'    ? e.amount / 12
                       : e.frequency === 'Quarterly' ? e.amount / 3
                       : 0;
      return sum + monthlyEq;
    }, 0);

  const oneTimeCostsTotal = inputs.expenses
    .filter((e) => e.type === 'One-Time')
    .reduce((sum, e) => sum + e.amount, 0);

  return { scenario, monthly, totals, breakEvenMonth, monthlyBurnSteadyState, oneTimeCostsTotal };
}
