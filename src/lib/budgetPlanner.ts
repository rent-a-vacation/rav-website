/**
 * Trip Budget Planner — estimate total vacation cost beyond accommodation.
 *
 * All estimates are per-person/day averages from travel industry data.
 */

/** Per-person daily cost estimates by category and spending level. */
const DAILY_COSTS: Record<string, Record<string, number>> = {
  dining: { budget: 40, moderate: 70, splurge: 120 },
  activities: { budget: 20, moderate: 50, splurge: 100 },
  transportation: { budget: 15, moderate: 35, splurge: 60 },
  shopping: { budget: 10, moderate: 25, splurge: 50 },
};

/** Average round-trip flight cost per person by destination. */
const FLIGHT_ESTIMATES: Record<string, number> = {
  hawaii: 550,
  florida: 300,
  california: 350,
  mexico: 400,
  caribbean: 450,
  colorado: 280,
  arizona: 250,
  nevada: 220,
  south_carolina: 280,
  utah: 260,
  default: 320,
};

/** Daily car rental estimates. */
const CAR_RENTAL_DAILY: Record<string, number> = {
  budget: 35,
  moderate: 55,
  splurge: 90,
};

export type SpendingLevel = 'budget' | 'moderate' | 'splurge';

export interface BudgetInputs {
  destination: string;
  nights: number;
  travelers: number;
  accommodationCost: number; // total, not per-night
  spendingLevel: SpendingLevel;
  includeFlights: boolean;
  includeCarRental: boolean;
}

export interface BudgetCategory {
  label: string;
  amount: number;
  perPerson: number;
  percentage: number;
}

export interface BudgetResult {
  categories: BudgetCategory[];
  totalTrip: number;
  perPerson: number;
  perDay: number;
}

export function calculateTripBudget(inputs: BudgetInputs): BudgetResult {
  const { destination, nights, travelers, accommodationCost, spendingLevel, includeFlights, includeCarRental } = inputs;
  const n = Math.max(1, nights);
  const t = Math.max(1, travelers);

  const categories: { label: string; amount: number }[] = [];

  // Accommodation
  categories.push({ label: 'Accommodation', amount: accommodationCost });

  // Flights
  if (includeFlights) {
    const perPerson = FLIGHT_ESTIMATES[destination] || FLIGHT_ESTIMATES.default;
    categories.push({ label: 'Flights', amount: perPerson * t });
  }

  // Car rental
  if (includeCarRental) {
    const daily = CAR_RENTAL_DAILY[spendingLevel];
    categories.push({ label: 'Car Rental', amount: daily * n });
  }

  // Dining
  const diningDaily = DAILY_COSTS.dining[spendingLevel] * t;
  categories.push({ label: 'Dining', amount: diningDaily * n });

  // Activities
  const activitiesDaily = DAILY_COSTS.activities[spendingLevel] * t;
  categories.push({ label: 'Activities', amount: activitiesDaily * n });

  // Transportation (rideshare, taxis if no rental)
  if (!includeCarRental) {
    const transportDaily = DAILY_COSTS.transportation[spendingLevel] * t;
    categories.push({ label: 'Local Transport', amount: transportDaily * n });
  }

  // Shopping & misc
  const shoppingDaily = DAILY_COSTS.shopping[spendingLevel] * t;
  categories.push({ label: 'Shopping & Misc', amount: shoppingDaily * n });

  const totalTrip = categories.reduce((sum, c) => sum + c.amount, 0);

  const result: BudgetCategory[] = categories.map((c) => ({
    label: c.label,
    amount: Math.round(c.amount),
    perPerson: Math.round(c.amount / t),
    percentage: totalTrip > 0 ? Math.round((c.amount / totalTrip) * 100) : 0,
  }));

  return {
    categories: result,
    totalTrip: Math.round(totalTrip),
    perPerson: Math.round(totalTrip / t),
    perDay: Math.round(totalTrip / n),
  };
}

export const BUDGET_DESTINATIONS = [
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
