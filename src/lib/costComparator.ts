/**
 * Vacation Cost Comparator — compare timeshare rental vs hotel vs Airbnb.
 *
 * Uses industry averages for hotel/Airbnb pricing since we don't have
 * live API integrations. RAV pricing uses real listing data.
 */

/** Average nightly hotel rates by destination region (USD). */
const HOTEL_RATES: Record<string, number> = {
  hawaii: 350,
  florida: 220,
  california: 280,
  mexico: 180,
  caribbean: 320,
  colorado: 250,
  arizona: 200,
  nevada: 180,
  south_carolina: 190,
  utah: 210,
  default: 230,
};

/** Average nightly Airbnb rates by destination region (USD). */
const AIRBNB_RATES: Record<string, number> = {
  hawaii: 280,
  florida: 180,
  california: 230,
  mexico: 140,
  caribbean: 250,
  colorado: 210,
  arizona: 160,
  nevada: 150,
  south_carolina: 160,
  utah: 180,
  default: 190,
};

/** Per-guest daily surcharges for 3+ guests. */
const EXTRA_GUEST_HOTEL = 25;
const EXTRA_GUEST_AIRBNB = 15;

/** Typical additional fees. */
const HOTEL_RESORT_FEE_PCTG = 0.12; // 12% resort/destination fee
const AIRBNB_SERVICE_FEE_PCTG = 0.14; // 14% service fee
const AIRBNB_CLEANING_FEE = 120; // flat cleaning fee
const HOTEL_TAX_PCTG = 0.13; // ~13% lodging tax
const AIRBNB_TAX_PCTG = 0.10; // ~10% occupancy tax

export interface CostComparatorInputs {
  destination: string; // destination slug or key
  nights: number;
  guests: number;
  ravNightlyRate: number; // user-entered or from a listing
}

export interface AccommodationCost {
  label: string;
  nightlyRate: number;
  subtotal: number;
  fees: number;
  taxes: number;
  total: number;
  perNight: number;
  amenities: string[];
}

export interface CostComparisonResult {
  rav: AccommodationCost;
  hotel: AccommodationCost;
  airbnb: AccommodationCost;
  savings: { vsHotel: number; vsAirbnb: number };
}

export function compareAccommodationCosts(
  inputs: CostComparatorInputs,
): CostComparisonResult {
  const { destination, nights, guests, ravNightlyRate } = inputs;
  const n = Math.max(1, nights);
  const g = Math.max(1, guests);
  const extraGuests = Math.max(0, g - 2);

  // --- RAV ---
  const ravBase = ravNightlyRate * n;
  const ravServiceFee = Math.round(ravBase * 0.15);
  const ravTotal = ravBase + ravServiceFee;

  const rav: AccommodationCost = {
    label: 'Rent-A-Vacation',
    nightlyRate: ravNightlyRate,
    subtotal: ravBase,
    fees: ravServiceFee,
    taxes: 0, // calculated at checkout
    total: ravTotal,
    perNight: Math.round(ravTotal / n),
    amenities: ['Full kitchen', 'Washer/dryer', 'Resort pool & amenities', 'Living room', 'No extra guest fees'],
  };

  // --- Hotel ---
  const hotelBase = (HOTEL_RATES[destination] || HOTEL_RATES.default) * n;
  const hotelGuestSurcharge = extraGuests * EXTRA_GUEST_HOTEL * n;
  const hotelSubtotal = hotelBase + hotelGuestSurcharge;
  const hotelResortFee = Math.round(hotelSubtotal * HOTEL_RESORT_FEE_PCTG);
  const hotelTax = Math.round(hotelSubtotal * HOTEL_TAX_PCTG);
  const hotelTotal = hotelSubtotal + hotelResortFee + hotelTax;

  const hotel: AccommodationCost = {
    label: 'Hotel',
    nightlyRate: HOTEL_RATES[destination] || HOTEL_RATES.default,
    subtotal: hotelSubtotal,
    fees: hotelResortFee,
    taxes: hotelTax,
    total: hotelTotal,
    perNight: Math.round(hotelTotal / n),
    amenities: ['Daily housekeeping', 'Room service', 'Concierge'],
  };

  // --- Airbnb ---
  const airbnbBase = (AIRBNB_RATES[destination] || AIRBNB_RATES.default) * n;
  const airbnbGuestSurcharge = extraGuests * EXTRA_GUEST_AIRBNB * n;
  const airbnbSubtotal = airbnbBase + airbnbGuestSurcharge;
  const airbnbServiceFee = Math.round(airbnbSubtotal * AIRBNB_SERVICE_FEE_PCTG);
  const airbnbTax = Math.round(airbnbSubtotal * AIRBNB_TAX_PCTG);
  const airbnbTotal = airbnbSubtotal + airbnbServiceFee + AIRBNB_CLEANING_FEE + airbnbTax;

  const airbnb: AccommodationCost = {
    label: 'Airbnb',
    nightlyRate: AIRBNB_RATES[destination] || AIRBNB_RATES.default,
    subtotal: airbnbSubtotal,
    fees: airbnbServiceFee + AIRBNB_CLEANING_FEE,
    taxes: airbnbTax,
    total: airbnbTotal,
    perNight: Math.round(airbnbTotal / n),
    amenities: ['Full kitchen (varies)', 'Unique properties', 'Self check-in'],
  };

  return {
    rav,
    hotel,
    airbnb,
    savings: {
      vsHotel: hotelTotal - ravTotal,
      vsAirbnb: airbnbTotal - ravTotal,
    },
  };
}

/** Destination options for the comparator UI. */
export const COMPARATOR_DESTINATIONS = [
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
