/**
 * Yield estimation logic — used by RAV SmartEarn (merged from standalone Yield Estimator).
 *
 * Reuses INCOME_ESTIMATES from calculatorLogic.ts and adds occupancy modeling.
 */

import { INCOME_ESTIMATES, VACATION_CLUB_BRANDS, UNIT_TYPES } from './calculatorLogic';

/** Seasonal occupancy multipliers by destination region. */
const REGIONAL_OCCUPANCY: Record<string, number> = {
  hawaii: 0.82,
  florida: 0.78,
  california: 0.75,
  mexico: 0.72,
  caribbean: 0.76,
  colorado: 0.70,
  arizona: 0.68,
  nevada: 0.73,
  south_carolina: 0.65,
  utah: 0.62,
  default: 0.70,
};

const RAV_COMMISSION = 0.15;

export interface YieldInputs {
  brand: string;
  unitType: string;
  weeksOwned: number;
  region: string;
  annualMaintenanceFees: number;
}

export interface YieldResult {
  grossWeeklyIncome: number;
  netWeeklyIncome: number;
  occupancyRate: number;
  estimatedWeeksRented: number;
  grossAnnualIncome: number;
  netAnnualIncome: number;
  annualExpenses: number;
  netProfit: number;
  roi: number; // percentage
  breakEvenWeeks: number;
}

export function estimateYield(inputs: YieldInputs): YieldResult | null {
  const { brand, unitType, weeksOwned, region, annualMaintenanceFees } = inputs;

  if (!brand || !unitType || weeksOwned < 1) return null;

  const brandData = INCOME_ESTIMATES[brand];
  if (!brandData) return null;

  const grossWeeklyIncome = brandData[unitType] || 0;
  if (grossWeeklyIncome === 0) return null;

  const ravFee = Math.round(grossWeeklyIncome * RAV_COMMISSION);
  const netWeeklyIncome = grossWeeklyIncome - ravFee;

  const occupancyRate = REGIONAL_OCCUPANCY[region] || REGIONAL_OCCUPANCY.default;
  const estimatedWeeksRented = Math.round(weeksOwned * occupancyRate * 10) / 10;

  const grossAnnualIncome = Math.round(grossWeeklyIncome * estimatedWeeksRented);
  const netAnnualIncome = Math.round(netWeeklyIncome * estimatedWeeksRented);
  const netProfit = netAnnualIncome - annualMaintenanceFees;
  const roi = annualMaintenanceFees > 0
    ? Math.round((netProfit / annualMaintenanceFees) * 100)
    : 0;

  const breakEvenWeeks = netWeeklyIncome > 0
    ? Math.ceil(annualMaintenanceFees / netWeeklyIncome)
    : 0;

  return {
    grossWeeklyIncome,
    netWeeklyIncome,
    occupancyRate,
    estimatedWeeksRented,
    grossAnnualIncome,
    netAnnualIncome,
    annualExpenses: annualMaintenanceFees,
    netProfit,
    roi,
    breakEvenWeeks,
  };
}

export const YIELD_REGIONS = [
  { value: 'hawaii', label: 'Hawaii' },
  { value: 'florida', label: 'Florida' },
  { value: 'california', label: 'California' },
  { value: 'mexico', label: 'Mexico' },
  { value: 'caribbean', label: 'Caribbean' },
  { value: 'colorado', label: 'Colorado' },
  { value: 'arizona', label: 'Arizona' },
  { value: 'nevada', label: 'Nevada' },
  { value: 'south_carolina', label: 'South Carolina' },
  { value: 'utah', label: 'Utah' },
];

export { VACATION_CLUB_BRANDS, UNIT_TYPES };
