import { useMemo } from "react";
import { useActiveListings } from "@/hooks/useListings";

export interface PricingSuggestion {
  avgNightlyRate: number;
  minNightlyRate: number;
  maxNightlyRate: number;
  comparableCount: number;
}

/**
 * Compute pricing suggestions from active listings by brand + location.
 * Returns null if fewer than 2 comparables are found.
 */
export function usePricingSuggestion(
  brand: string | undefined,
  location: string | undefined
): PricingSuggestion | null {
  const { data: listings = [] } = useActiveListings();

  return useMemo(() => {
    if (!brand || !location || listings.length === 0) return null;

    // Normalize for comparison
    const normBrand = brand.toLowerCase();
    const normLocation = location.toLowerCase().trim();

    const comparables = listings.filter((l) => {
      const listingBrand = l.property.brand?.toLowerCase();
      const listingLocation = l.property.location?.toLowerCase().trim();
      return listingBrand === normBrand && listingLocation === normLocation && l.nightly_rate > 0;
    });

    if (comparables.length < 2) return null;

    const rates = comparables.map((l) => l.nightly_rate);
    const sum = rates.reduce((a, b) => a + b, 0);

    return {
      avgNightlyRate: Math.round(sum / rates.length),
      minNightlyRate: Math.min(...rates),
      maxNightlyRate: Math.max(...rates),
      comparableCount: comparables.length,
    };
  }, [brand, location, listings]);
}
