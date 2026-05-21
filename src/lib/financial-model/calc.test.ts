import { describe, it, expect } from 'vitest';
import { project } from './calc';
import {
  PLATFORM, SUBSCRIPTIONS, GROWTH, SCENARIOS, HORIZON,
  RESERVES, HIRING, UNIT_ECON, EXPENSES,
} from './data';
import { DEFAULT_COMMISSION } from '@/config/commission';

describe('project() — backwards-compatibility (#550 PR1) @p0', () => {
  it('project("Base") with explicit CANONICAL_BASELINE arg produces same output as no-arg form', () => {
    const noArgs = project('Base');
    const explicitBaseline = project('Base', {
      platform: PLATFORM,
      subscriptions: SUBSCRIPTIONS,
      growth: GROWTH,
      scenarios: SCENARIOS,
      horizon: HORIZON,
      reserves: RESERVES,
      hiring: HIRING,
      unitEcon: UNIT_ECON,
      expenses: EXPENSES,
    });

    expect(explicitBaseline.totals.totalRevenue24mo).toBe(noArgs.totals.totalRevenue24mo);
    expect(explicitBaseline.totals.totalCosts24mo).toBe(noArgs.totals.totalCosts24mo);
    expect(explicitBaseline.totals.totalProfit24mo).toBe(noArgs.totals.totalProfit24mo);
    expect(explicitBaseline.breakEvenMonth).toBe(noArgs.breakEvenMonth);
    expect(explicitBaseline.monthly.length).toBe(noArgs.monthly.length);
    expect(explicitBaseline.monthly[23].cumulativeCash)
      .toBe(noArgs.monthly[23].cumulativeCash);
  });

  it('all three scenarios produce different numbers (Conservative < Base < Optimistic)', () => {
    const c = project('Conservative').totals.totalRevenue24mo;
    const b = project('Base').totals.totalRevenue24mo;
    const o = project('Optimistic').totals.totalRevenue24mo;
    expect(c).toBeLessThan(b);
    expect(b).toBeLessThan(o);
  });

  it('commissionRate arg overrides DEFAULT_COMMISSION', () => {
    const baseline = project('Base');
    const halved = project('Base', undefined, {
      base: DEFAULT_COMMISSION.base / 2,
      proDiscount: DEFAULT_COMMISSION.proDiscount,
      businessDiscount: DEFAULT_COMMISSION.businessDiscount,
    });
    expect(halved.totals.totalCommissionGross24mo).toBeLessThan(baseline.totals.totalCommissionGross24mo);
    expect(halved.totals.blendedCommissionRate).toBeLessThan(baseline.totals.blendedCommissionRate);
  });

  it('input override measurably changes projection', () => {
    const baseline = project('Base');
    const boosted = project('Base', {
      platform: PLATFORM,
      subscriptions: SUBSCRIPTIONS,
      growth: GROWTH.map((row) => row.name === 'gOwnGrowth'
        ? { ...row, value: 0.50 }
        : row),
      scenarios: SCENARIOS,
      horizon: HORIZON,
      reserves: RESERVES,
      hiring: HIRING,
      unitEcon: UNIT_ECON,
      expenses: EXPENSES,
    });
    expect(boosted.totals.totalGBV24mo).toBeGreaterThan(baseline.totals.totalGBV24mo);
  });
});
