import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useActiveListings, type ActiveListing } from '@/hooks/useListings';
import { daysUntilDate, calculateUrgencyDiscount } from '@/lib/dynamicPricing';
import { getUrgencyLevel, type UrgencyLevel } from '@/lib/idleListingAlerts';

/** Maximum days until check-in for a listing to qualify as a RAV Deal */
export const RAV_DEALS_THRESHOLD_DAYS = 45;

export interface RavDeal {
  listing: ActiveListing;
  daysUntilCheckIn: number;
  urgencyDiscount: number;
  urgencyLevel: UrgencyLevel;
  bidCount: number;
}

/**
 * Fetch bid counts for all active listings.
 * Returns a Map of listing_id → bid count.
 */
function useBidCounts() {
  return useQuery({
    queryKey: ['listing-bids', 'counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listing_bids')
        .select('listing_id');

      if (error) throw error;

      const counts = new Map<string, number>();
      for (const row of data || []) {
        counts.set(row.listing_id, (counts.get(row.listing_id) || 0) + 1);
      }
      return counts;
    },
    staleTime: 60_000,
  });
}

/**
 * Pure function to compute RAV Deals from listings and bid counts.
 * Exported for testing.
 */
export function computeRavDeals(
  listings: ActiveListing[],
  bidCounts: Map<string, number>,
  now: Date = new Date()
): RavDeal[] {
  const deals: RavDeal[] = [];

  for (const listing of listings) {
    const days = daysUntilDate(listing.check_in_date);

    // Must be in the future and within threshold
    if (days <= 0 || days > RAV_DEALS_THRESHOLD_DAYS) continue;

    const bidCount = bidCounts.get(listing.id) || 0;

    // Only include listings with zero or very few bids (≤ 1)
    if (bidCount > 1) continue;

    deals.push({
      listing,
      daysUntilCheckIn: days,
      urgencyDiscount: calculateUrgencyDiscount(days),
      urgencyLevel: getUrgencyLevel(listing, now),
      bidCount,
    });
  }

  // Sort by soonest check-in first (most urgent)
  deals.sort((a, b) => a.daysUntilCheckIn - b.daysUntilCheckIn);

  return deals;
}

/**
 * Hook that surfaces RAV Deals — distressed/expiring inventory
 * with urgency metadata for display.
 */
export function useRavDeals() {
  const { data: listings = [], isLoading: listingsLoading, error: listingsError } = useActiveListings();
  const { data: bidCounts, isLoading: bidsLoading, error: bidsError } = useBidCounts();

  const isLoading = listingsLoading || bidsLoading;
  const error = listingsError || bidsError;

  const deals = useMemo(() => {
    if (!bidCounts || listings.length === 0) return [];
    return computeRavDeals(listings, bidCounts);
  }, [listings, bidCounts]);

  return {
    deals,
    isLoading,
    error,
    isEmpty: !isLoading && !error && deals.length === 0,
  };
}
