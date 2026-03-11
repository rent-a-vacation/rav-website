import { describe, it, expect } from 'vitest';
import { compareAccommodationCosts } from './costComparator';

describe('costComparator', () => {
  it('returns all three accommodation options', () => {
    const result = compareAccommodationCosts({
      destination: 'florida',
      nights: 7,
      guests: 2,
      ravNightlyRate: 150,
    });
    expect(result.rav.label).toBe('Rent-A-Vacation');
    expect(result.hotel.label).toBe('Hotel');
    expect(result.airbnb.label).toBe('Airbnb');
  });

  it('calculates RAV total with 15% service fee', () => {
    const result = compareAccommodationCosts({
      destination: 'florida',
      nights: 7,
      guests: 2,
      ravNightlyRate: 100,
    });
    // 100 * 7 = 700 base + 105 fee = 805
    expect(result.rav.subtotal).toBe(700);
    expect(result.rav.fees).toBe(105);
    expect(result.rav.total).toBe(805);
  });

  it('adds guest surcharges for 3+ guests', () => {
    const result2 = compareAccommodationCosts({
      destination: 'florida',
      nights: 7,
      guests: 2,
      ravNightlyRate: 150,
    });
    const result4 = compareAccommodationCosts({
      destination: 'florida',
      nights: 7,
      guests: 4,
      ravNightlyRate: 150,
    });
    // 2 extra guests * $25/night * 7 nights = $350 more for hotel
    expect(result4.hotel.subtotal).toBeGreaterThan(result2.hotel.subtotal);
    // RAV has no guest surcharge
    expect(result4.rav.total).toBe(result2.rav.total);
  });

  it('calculates savings vs hotel and airbnb', () => {
    const result = compareAccommodationCosts({
      destination: 'hawaii',
      nights: 7,
      guests: 2,
      ravNightlyRate: 200,
    });
    expect(result.savings.vsHotel).toBe(result.hotel.total - result.rav.total);
    expect(result.savings.vsAirbnb).toBe(result.airbnb.total - result.rav.total);
  });

  it('uses default rates for unknown destinations', () => {
    const result = compareAccommodationCosts({
      destination: 'unknown_place',
      nights: 3,
      guests: 1,
      ravNightlyRate: 100,
    });
    expect(result.hotel.nightlyRate).toBe(230); // default
    expect(result.airbnb.nightlyRate).toBe(190); // default
  });

  it('handles minimum 1 night and 1 guest', () => {
    const result = compareAccommodationCosts({
      destination: 'florida',
      nights: 0,
      guests: 0,
      ravNightlyRate: 100,
    });
    expect(result.rav.total).toBeGreaterThan(0);
  });

  it('includes amenity lists for each option', () => {
    const result = compareAccommodationCosts({
      destination: 'florida',
      nights: 7,
      guests: 2,
      ravNightlyRate: 150,
    });
    expect(result.rav.amenities.length).toBeGreaterThan(0);
    expect(result.hotel.amenities.length).toBeGreaterThan(0);
    expect(result.airbnb.amenities.length).toBeGreaterThan(0);
  });
});
