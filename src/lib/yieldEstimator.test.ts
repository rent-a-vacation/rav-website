import { describe, it, expect } from 'vitest';
import { estimateYield } from './yieldEstimator';

describe('yieldEstimator', () => {
  it('returns null for missing brand', () => {
    expect(estimateYield({ brand: '', unitType: '1br', weeksOwned: 2, region: 'florida', annualMaintenanceFees: 1500 })).toBeNull();
  });

  it('returns null for missing unit type', () => {
    expect(estimateYield({ brand: 'hilton_grand_vacations', unitType: '', weeksOwned: 2, region: 'florida', annualMaintenanceFees: 1500 })).toBeNull();
  });

  it('returns null for zero weeks', () => {
    expect(estimateYield({ brand: 'hilton_grand_vacations', unitType: '1br', weeksOwned: 0, region: 'florida', annualMaintenanceFees: 1500 })).toBeNull();
  });

  it('calculates positive ROI for high-value brand', () => {
    const result = estimateYield({
      brand: 'hilton_grand_vacations',
      unitType: '2br',
      weeksOwned: 4,
      region: 'florida',
      annualMaintenanceFees: 2000,
    });
    expect(result).not.toBeNull();
    expect(result!.grossWeeklyIncome).toBeGreaterThan(0);
    expect(result!.netWeeklyIncome).toBeLessThan(result!.grossWeeklyIncome);
  });

  it('applies 15% RAV commission', () => {
    const result = estimateYield({
      brand: 'hilton_grand_vacations',
      unitType: '1br',
      weeksOwned: 2,
      region: 'florida',
      annualMaintenanceFees: 1000,
    });
    expect(result).not.toBeNull();
    const expectedFee = Math.round(result!.grossWeeklyIncome * 0.15);
    expect(result!.grossWeeklyIncome - result!.netWeeklyIncome).toBe(expectedFee);
  });

  it('accounts for regional occupancy rates', () => {
    const hawaii = estimateYield({
      brand: 'hilton_grand_vacations',
      unitType: '1br',
      weeksOwned: 10,
      region: 'hawaii',
      annualMaintenanceFees: 2000,
    });
    const utah = estimateYield({
      brand: 'hilton_grand_vacations',
      unitType: '1br',
      weeksOwned: 10,
      region: 'utah',
      annualMaintenanceFees: 2000,
    });
    expect(hawaii).not.toBeNull();
    expect(utah).not.toBeNull();
    // Hawaii has higher occupancy → more weeks rented
    expect(hawaii!.estimatedWeeksRented).toBeGreaterThan(utah!.estimatedWeeksRented);
  });

  it('calculates break-even weeks', () => {
    const result = estimateYield({
      brand: 'marriott_vacation_club',
      unitType: '1br',
      weeksOwned: 4,
      region: 'florida',
      annualMaintenanceFees: 1500,
    });
    expect(result).not.toBeNull();
    expect(result!.breakEvenWeeks).toBeGreaterThan(0);
    // Break-even weeks * net weekly >= maintenance fees
    expect(result!.breakEvenWeeks * result!.netWeeklyIncome).toBeGreaterThanOrEqual(1500);
  });

  it('uses default occupancy for unknown region', () => {
    const result = estimateYield({
      brand: 'hilton_grand_vacations',
      unitType: '1br',
      weeksOwned: 2,
      region: 'unknown',
      annualMaintenanceFees: 1000,
    });
    expect(result).not.toBeNull();
    expect(result!.occupancyRate).toBe(0.70); // default
  });
});
