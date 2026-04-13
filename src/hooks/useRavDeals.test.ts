import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeRavDeals, RAV_DEALS_THRESHOLD_DAYS } from './useRavDeals';
import type { ActiveListing } from './useListings';

// Helper to create a minimal ActiveListing for testing
function makeListing(overrides: Partial<ActiveListing> & { id: string; check_in_date: string }): ActiveListing {
  return {
    property_id: 'prop-1',
    owner_id: 'owner-1',
    status: 'active',
    check_out_date: '2026-05-07',
    final_price: 1000,
    owner_price: 870,
    rav_markup: 130,
    nightly_rate: 150,
    notes: null,
    cancellation_policy: 'flexible',
    open_for_bidding: true,
    bidding_ends_at: null,
    min_bid_amount: null,
    created_at: '2026-01-01T00:00:00Z',
    property: {
      id: 'prop-1',
      owner_id: 'owner-1',
      brand: 'hilton_grand_vacations',
      resort_name: 'Test Resort',
      location: 'Orlando, FL',
      description: null,
      bedrooms: 2,
      bathrooms: 2,
      sleeps: 6,
      amenities: [],
      images: [],
      resort_id: null,
      unit_type_id: null,
      resort: null,
      unit_type: null,
    },
    ...overrides,
  } as ActiveListing;
}

describe('computeRavDeals', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-01T12:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  it('includes listings within threshold with zero bids', () => {
    const listings = [
      makeListing({ id: 'a', check_in_date: '2026-05-20' }), // 19 days out
    ];
    const bidCounts = new Map<string, number>();
    const deals = computeRavDeals(listings, bidCounts);

    expect(deals).toHaveLength(1);
    expect(deals[0].listing.id).toBe('a');
    expect(deals[0].daysUntilCheckIn).toBe(19);
    expect(deals[0].bidCount).toBe(0);
  });

  it('includes listings with exactly 1 bid', () => {
    const listings = [
      makeListing({ id: 'a', check_in_date: '2026-05-20' }),
    ];
    const bidCounts = new Map([['a', 1]]);
    const deals = computeRavDeals(listings, bidCounts);

    expect(deals).toHaveLength(1);
    expect(deals[0].bidCount).toBe(1);
  });

  it('excludes listings with more than 1 bid', () => {
    const listings = [
      makeListing({ id: 'a', check_in_date: '2026-05-20' }),
    ];
    const bidCounts = new Map([['a', 2]]);
    const deals = computeRavDeals(listings, bidCounts);

    expect(deals).toHaveLength(0);
  });

  it('excludes listings beyond the threshold', () => {
    const listings = [
      makeListing({ id: 'a', check_in_date: '2026-07-01' }), // 61 days out
    ];
    const bidCounts = new Map<string, number>();
    const deals = computeRavDeals(listings, bidCounts);

    expect(deals).toHaveLength(0);
  });

  it('excludes past check-in dates', () => {
    const listings = [
      makeListing({ id: 'a', check_in_date: '2026-04-25' }), // past
    ];
    const bidCounts = new Map<string, number>();
    const deals = computeRavDeals(listings, bidCounts);

    expect(deals).toHaveLength(0);
  });

  it('includes listing exactly at threshold boundary', () => {
    // 45 days from 2026-05-01 = 2026-06-15
    const listings = [
      makeListing({ id: 'a', check_in_date: '2026-06-15' }),
    ];
    const bidCounts = new Map<string, number>();
    const deals = computeRavDeals(listings, bidCounts);

    expect(deals).toHaveLength(1);
    expect(deals[0].daysUntilCheckIn).toBe(RAV_DEALS_THRESHOLD_DAYS);
  });

  it('excludes listing one day beyond threshold', () => {
    const listings = [
      makeListing({ id: 'a', check_in_date: '2026-06-16' }), // 46 days
    ];
    const bidCounts = new Map<string, number>();
    const deals = computeRavDeals(listings, bidCounts);

    expect(deals).toHaveLength(0);
  });

  it('sorts by soonest check-in first', () => {
    const listings = [
      makeListing({ id: 'far', check_in_date: '2026-05-30' }),  // 29 days
      makeListing({ id: 'near', check_in_date: '2026-05-05' }), // 4 days
      makeListing({ id: 'mid', check_in_date: '2026-05-15' }),  // 14 days
    ];
    const bidCounts = new Map<string, number>();
    const deals = computeRavDeals(listings, bidCounts);

    expect(deals.map((d) => d.listing.id)).toEqual(['near', 'mid', 'far']);
  });

  it('computes urgency discount correctly', () => {
    const listings = [
      makeListing({ id: 'urgent', check_in_date: '2026-05-04' }), // 3 days → -15%
      makeListing({ id: 'moderate', check_in_date: '2026-05-20' }), // 19 days → -10%
    ];
    const bidCounts = new Map<string, number>();
    const deals = computeRavDeals(listings, bidCounts);

    expect(deals[0].urgencyDiscount).toBe(-15); // 3 days
    expect(deals[1].urgencyDiscount).toBe(-10); // 19 days
  });

  it('computes urgency level correctly', () => {
    const now = new Date('2026-05-01T12:00:00');
    const listings = [
      makeListing({ id: 'close', check_in_date: '2026-05-20' }),  // 19 days → 30d level
      makeListing({ id: 'far', check_in_date: '2026-06-10' }),    // 40 days → 60d level
    ];
    const bidCounts = new Map<string, number>();
    const deals = computeRavDeals(listings, bidCounts, now);

    expect(deals[0].urgencyLevel).toBe('30d');
    expect(deals[1].urgencyLevel).toBe('60d');
  });

  it('returns empty array for empty listings', () => {
    const deals = computeRavDeals([], new Map());
    expect(deals).toEqual([]);
  });
});
