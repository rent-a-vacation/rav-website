import { describe, it, expect } from 'vitest';
import { calculateTripBudget } from './budgetPlanner';

describe('budgetPlanner', () => {
  it('includes accommodation as first category', () => {
    const result = calculateTripBudget({
      destination: 'florida',
      nights: 7,
      travelers: 2,
      accommodationCost: 1000,
      spendingLevel: 'moderate',
      includeFlights: false,
      includeCarRental: false,
    });
    expect(result.categories[0].label).toBe('Accommodation');
    expect(result.categories[0].amount).toBe(1000);
  });

  it('includes flights when requested', () => {
    const without = calculateTripBudget({
      destination: 'hawaii',
      nights: 7,
      travelers: 2,
      accommodationCost: 1000,
      spendingLevel: 'moderate',
      includeFlights: false,
      includeCarRental: false,
    });
    const withFlights = calculateTripBudget({
      destination: 'hawaii',
      nights: 7,
      travelers: 2,
      accommodationCost: 1000,
      spendingLevel: 'moderate',
      includeFlights: true,
      includeCarRental: false,
    });
    expect(withFlights.totalTrip).toBeGreaterThan(without.totalTrip);
    const flightCat = withFlights.categories.find((c) => c.label === 'Flights');
    expect(flightCat).toBeDefined();
    expect(flightCat!.amount).toBe(550 * 2); // Hawaii flight * 2 travelers
  });

  it('includes car rental when requested', () => {
    const result = calculateTripBudget({
      destination: 'florida',
      nights: 5,
      travelers: 2,
      accommodationCost: 800,
      spendingLevel: 'moderate',
      includeFlights: false,
      includeCarRental: true,
    });
    const carCat = result.categories.find((c) => c.label === 'Car Rental');
    expect(carCat).toBeDefined();
    expect(carCat!.amount).toBe(55 * 5); // $55/day moderate * 5 nights
  });

  it('excludes local transport when car rental is included', () => {
    const withCar = calculateTripBudget({
      destination: 'florida',
      nights: 7,
      travelers: 2,
      accommodationCost: 1000,
      spendingLevel: 'moderate',
      includeFlights: false,
      includeCarRental: true,
    });
    const transportCat = withCar.categories.find((c) => c.label === 'Local Transport');
    expect(transportCat).toBeUndefined();
  });

  it('scales dining/activities by traveler count', () => {
    const solo = calculateTripBudget({
      destination: 'florida',
      nights: 7,
      travelers: 1,
      accommodationCost: 1000,
      spendingLevel: 'moderate',
      includeFlights: false,
      includeCarRental: false,
    });
    const duo = calculateTripBudget({
      destination: 'florida',
      nights: 7,
      travelers: 2,
      accommodationCost: 1000,
      spendingLevel: 'moderate',
      includeFlights: false,
      includeCarRental: false,
    });
    const soloDining = solo.categories.find((c) => c.label === 'Dining')!;
    const duoDining = duo.categories.find((c) => c.label === 'Dining')!;
    expect(duoDining.amount).toBe(soloDining.amount * 2);
  });

  it('calculates per-person and per-day totals', () => {
    const result = calculateTripBudget({
      destination: 'florida',
      nights: 7,
      travelers: 2,
      accommodationCost: 1400,
      spendingLevel: 'budget',
      includeFlights: false,
      includeCarRental: false,
    });
    expect(result.perPerson).toBe(Math.round(result.totalTrip / 2));
    expect(result.perDay).toBe(Math.round(result.totalTrip / 7));
  });

  it('category percentages sum to approximately 100', () => {
    const result = calculateTripBudget({
      destination: 'florida',
      nights: 7,
      travelers: 2,
      accommodationCost: 1000,
      spendingLevel: 'moderate',
      includeFlights: true,
      includeCarRental: true,
    });
    const totalPct = result.categories.reduce((sum, c) => sum + c.percentage, 0);
    // Rounding may cause slight deviation
    expect(totalPct).toBeGreaterThanOrEqual(95);
    expect(totalPct).toBeLessThanOrEqual(105);
  });

  it('spending levels affect total cost', () => {
    const budget = calculateTripBudget({
      destination: 'florida',
      nights: 7,
      travelers: 2,
      accommodationCost: 1000,
      spendingLevel: 'budget',
      includeFlights: false,
      includeCarRental: false,
    });
    const splurge = calculateTripBudget({
      destination: 'florida',
      nights: 7,
      travelers: 2,
      accommodationCost: 1000,
      spendingLevel: 'splurge',
      includeFlights: false,
      includeCarRental: false,
    });
    expect(splurge.totalTrip).toBeGreaterThan(budget.totalTrip);
  });
});
