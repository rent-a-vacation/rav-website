export const VACATION_CLUB_BRANDS = [
  { value: 'hilton_grand_vacations', label: 'Hilton Grand Vacations' },
  { value: 'marriott_vacation_club', label: 'Marriott Vacation Club' },
  { value: 'disney_vacation_club', label: 'Disney Vacation Club' },
  { value: 'wyndham_destinations', label: 'Wyndham Destinations' },
  { value: 'hyatt_residence_club', label: 'Hyatt Residence Club' },
  { value: 'bluegreen_vacations', label: 'Bluegreen Vacations' },
  { value: 'holiday_inn_club', label: 'Holiday Inn Club Vacations' },
  { value: 'worldmark', label: 'WorldMark by Wyndham' },
  { value: 'other', label: 'Other / Independent Resort' },
] as const;

export const UNIT_TYPES = [
  { value: 'studio', label: 'Studio' },
  { value: '1br', label: '1 Bedroom' },
  { value: '2br', label: '2 Bedroom' },
  { value: '3br', label: '3 Bedroom+' },
] as const;

// Weekly income estimates (gross, before RAV fee)
// Based on comparable RAV listings and published market research
export const INCOME_ESTIMATES: Record<string, Record<string, number>> = {
  hilton_grand_vacations: { studio: 1200, '1br': 1850, '2br': 2800, '3br': 4200 },
  marriott_vacation_club: { studio: 1100, '1br': 1700, '2br': 2600, '3br': 3900 },
  disney_vacation_club:   { studio: 1400, '1br': 2100, '2br': 3200, '3br': 4800 },
  wyndham_destinations:   { studio: 900,  '1br': 1400, '2br': 2100, '3br': 3100 },
  hyatt_residence_club:   { studio: 1300, '1br': 1900, '2br': 2900, '3br': 4300 },
  bluegreen_vacations:    { studio: 800,  '1br': 1250, '2br': 1900, '3br': 2800 },
  holiday_inn_club:       { studio: 750,  '1br': 1150, '2br': 1750, '3br': 2600 },
  worldmark:              { studio: 850,  '1br': 1300, '2br': 2000, '3br': 2900 },
  other:                  { studio: 900,  '1br': 1400, '2br': 2100, '3br': 3100 },
};

const RAV_FEE_RATE = 0.15; // 15% platform fee (configurable in Admin Settings)

export interface CalculatorInputs {
  brand: string;
  unitType: string;
  annualMaintenanceFees: number;
  weeksOwned: number;
}

export interface WeekScenario {
  weeks: number;
  grossIncome: number;
  ravFee: number;
  netIncome: number;
  coveragePercent: number;
  netProfit: number;
}

export interface CalculatorResult {
  estimatedWeeklyIncome: number;
  ravFeePerWeek: number;
  netPerWeek: number;
  breakEvenWeeks: number;
  scenarios: WeekScenario[];
}

export function calculateBreakeven(inputs: CalculatorInputs): CalculatorResult | null {
  if (!inputs.brand || !inputs.unitType || inputs.annualMaintenanceFees <= 0) {
    return null;
  }

  const grossWeekly = INCOME_ESTIMATES[inputs.brand]?.[inputs.unitType] ?? 0;
  if (grossWeekly === 0) return null;

  const ravFeePerWeek = grossWeekly * RAV_FEE_RATE;
  const netPerWeek = grossWeekly - ravFeePerWeek;
  const breakEvenWeeks = inputs.annualMaintenanceFees / netPerWeek;

  const scenarios: WeekScenario[] = [1, 2, 3].map(weeks => {
    const grossIncome = grossWeekly * weeks;
    const ravFee = ravFeePerWeek * weeks;
    const netIncome = netPerWeek * weeks;
    const coveragePercent = (netIncome / inputs.annualMaintenanceFees) * 100;
    const netProfit = netIncome - inputs.annualMaintenanceFees;
    return { weeks, grossIncome, ravFee, netIncome, coveragePercent, netProfit };
  });

  return { estimatedWeeklyIncome: grossWeekly, ravFeePerWeek, netPerWeek, breakEvenWeeks, scenarios };
}
