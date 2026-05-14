import { describe, it, expect } from 'vitest';
import { calculateBreakeven, type CalculatorInputs } from './calculatorLogic';
import { DEFAULT_COMMISSION } from '@/config/commission';

const validInputs: CalculatorInputs = {
  brand: 'hilton_grand_vacations',
  unitType: '1br',
  annualMaintenanceFees: 2800,
  weeksOwned: 1,
};

describe('calculateBreakeven', () => {
  it('returns null for incomplete inputs (no brand)', () => {
    expect(calculateBreakeven({ ...validInputs, brand: '' })).toBeNull();
  });

  it('returns null for incomplete inputs (no unitType)', () => {
    expect(calculateBreakeven({ ...validInputs, unitType: '' })).toBeNull();
  });

  it('returns null for zero maintenance fees', () => {
    expect(calculateBreakeven({ ...validInputs, annualMaintenanceFees: 0 })).toBeNull();
  });

  it('returns null for negative maintenance fees', () => {
    expect(calculateBreakeven({ ...validInputs, annualMaintenanceFees: -100 })).toBeNull();
  });

  it('netPerWeek = grossWeekly - RAV fee', () => {
    const result = calculateBreakeven(validInputs);
    expect(result).not.toBeNull();
    // HGV 1BR = $1,850 gross
    expect(result!.estimatedWeeklyIncome).toBe(1850);
    const expectedFee = 1850 * DEFAULT_COMMISSION.base;
    expect(result!.ravFeePerWeek).toBeCloseTo(expectedFee, 2);
    expect(result!.netPerWeek).toBeCloseTo(1850 - expectedFee, 2);
  });

  it('breakEvenWeeks is correct: fees / netPerWeek', () => {
    const result = calculateBreakeven(validInputs);
    const netPerWeek = 1850 * (1 - DEFAULT_COMMISSION.base);
    expect(result!.breakEvenWeeks).toBeCloseTo(2800 / netPerWeek, 4);
  });

  it('scenario 2 weeks: coverage is 2x single week coverage', () => {
    const result = calculateBreakeven(validInputs);
    const s1 = result!.scenarios[0];
    const s2 = result!.scenarios[1];
    expect(s2.netIncome).toBeCloseTo(s1.netIncome * 2, 2);
    expect(s2.coveragePercent).toBeCloseTo(s1.coveragePercent * 2, 2);
  });

  it('coveragePercent > 100 when income exceeds fees', () => {
    const result = calculateBreakeven({
      ...validInputs,
      annualMaintenanceFees: 1000, // Low fees, 1 week easily covers
    });
    expect(result!.scenarios[0].coveragePercent).toBeGreaterThan(100);
  });

  it('netProfit is negative when income < maintenance fees', () => {
    const result = calculateBreakeven({
      ...validInputs,
      annualMaintenanceFees: 5000, // High fees, 1 week won't cover
    });
    expect(result!.scenarios[0].netProfit).toBeLessThan(0);
  });

  it('netProfit is positive when income > maintenance fees', () => {
    const result = calculateBreakeven({
      ...validInputs,
      annualMaintenanceFees: 1000,
    });
    expect(result!.scenarios[0].netProfit).toBeGreaterThan(0);
  });

  it('handles unknown brand gracefully', () => {
    expect(calculateBreakeven({ ...validInputs, brand: 'unknown_brand' })).toBeNull();
  });

  it('returns 3 scenarios for weeks 1, 2, 3', () => {
    const result = calculateBreakeven(validInputs);
    expect(result!.scenarios).toHaveLength(3);
    expect(result!.scenarios.map(s => s.weeks)).toEqual([1, 2, 3]);
  });
});
