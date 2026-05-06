import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Listing, Property, Resort, ResortUnitType } from '@/types/database';
import { useMyMembership } from './useMembership';
import { isListingInEarlyAccess, canSeeEarlyAccess } from '@/lib/tierGating';

export interface ListingWithDetails extends Listing {
  property: Property & {
    resort: Resort | null;
    unit_type: Resort | null;
  };
}

// Full type for listing with all joined data
export interface ActiveListing {
  id: string;
  property_id: string;
  owner_id: string;
  status: string;
  check_in_date: string;
  check_out_date: string;
  final_price: number;
  owner_price: number;
  rav_markup: number;
  nightly_rate: number;
  notes: string | null;
  cancellation_policy: string;
  open_for_bidding: boolean;
  bidding_ends_at: string | null;
  min_bid_amount: number | null;
  is_exclusive_deal: boolean;
  // 2-letter US state code (Migration 074, denormalized from resort.location.state).
  // Nullable for legacy listings until backfill verification + NOT NULL follow-up.
  state: string | null;
  created_at: string;
  property: {
    id: string;
    owner_id: string;
    brand: string;
    resort_name: string;
    location: string;
    description: string | null;
    bedrooms: number;
    bathrooms: number;
    sleeps: number;
    amenities: string[];
    images: string[];
    resort_id: string | null;
    unit_type_id: string | null;
    resort: Resort | null;
    unit_type: ResortUnitType | null;
  };
}

// Fetch all active listings for the Rentals page (excludes past check-out dates)
export function useActiveListings() {
  return useQuery({
    queryKey: ['listings', 'active'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          property:properties(
            *,
            resort:resorts(*),
            unit_type:resort_unit_types(*)
          )
        `)
        .eq('status', 'active')
        // DEC-034: wish_matched listings are auto-created for a specific
        // accepting traveler and should never appear in generic search.
        // They remain reachable via useListing() for that traveler's checkout.
        .eq('source_type', 'pre_booked')
        .gte('check_out_date', today)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ActiveListing[];
    },
  });
}

// Fetch a single listing by ID for PropertyDetail page
export function useListing(listingId: string | undefined) {
  return useQuery({
    queryKey: ['listings', 'detail', listingId],
    queryFn: async () => {
      if (!listingId) return null;

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          property:properties(
            *,
            resort:resorts(*),
            unit_type:resort_unit_types(*)
          )
        `)
        .eq('id', listingId)
        .single();

      if (error) throw error;
      return data as ActiveListing;
    },
    enabled: !!listingId,
  });
}

// Get count of active listings (for voice search pre-check and empty states)
export function useActiveListingsCount() {
  return useQuery({
    queryKey: ['listings', 'active-count'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { count, error } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('source_type', 'pre_booked')
        .gte('check_out_date', today);

      if (error) throw error;
      return count || 0;
    },
  });
}

/**
 * Tier-aware listing hook: hides early-access listings from Free-tier travelers.
 * Returns { data, earlyAccessCount, ... } so callers can show upsell banners.
 */
export function useTierFilteredListings() {
  const { data: listings = [], ...rest } = useActiveListings();
  const { data: membership } = useMyMembership();

  const tierLevel = membership?.tier?.tier_level;
  const hasAccess = canSeeEarlyAccess(tierLevel);

  const result = useMemo(() => {
    let earlyAccessCount = 0;
    const filtered: ActiveListing[] = [];

    for (const listing of listings) {
      const isEarly = isListingInEarlyAccess(listing.created_at);
      if (isEarly) earlyAccessCount++;
      if (isEarly && !hasAccess) continue;
      filtered.push(listing);
    }

    return { filtered, earlyAccessCount };
  }, [listings, hasAccess]);

  return {
    data: result.filtered,
    earlyAccessCount: result.earlyAccessCount,
    canSeeEarlyAccess: hasAccess,
    ...rest,
  };
}
