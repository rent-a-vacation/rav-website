/**
 * Price drop alert utilities — matching saved searches against price-dropped listings.
 * Pure functions usable in both frontend tests and edge function logic.
 */

export interface ListingForMatch {
  nightly_rate: number;
  previous_nightly_rate: number | null;
  brand: string;
  location: string;
  bedrooms: number;
  sleeps: number;
}

export interface SavedSearchCriteria {
  searchQuery?: string;
  brandFilter?: string;
  minPrice?: string;
  maxPrice?: string;
  minBedrooms?: string;
  minGuests?: string;
}

/**
 * Check if a listing matches a saved search's criteria.
 * Empty criteria fields are treated as "match any".
 */
export function doesListingMatchCriteria(
  listing: ListingForMatch,
  criteria: SavedSearchCriteria
): boolean {
  // Brand filter
  if (criteria.brandFilter && criteria.brandFilter !== "all") {
    if (listing.brand !== criteria.brandFilter) return false;
  }

  // Location/text search
  if (criteria.searchQuery?.trim()) {
    const q = criteria.searchQuery.toLowerCase();
    if (!listing.location.toLowerCase().includes(q) && !listing.brand.replace(/_/g, " ").toLowerCase().includes(q)) {
      return false;
    }
  }

  // Price range (compare nightly rate, not total)
  if (criteria.minPrice) {
    if (listing.nightly_rate < Number(criteria.minPrice)) return false;
  }
  if (criteria.maxPrice) {
    if (listing.nightly_rate > Number(criteria.maxPrice)) return false;
  }

  // Bedrooms
  if (criteria.minBedrooms) {
    if (listing.bedrooms < Number(criteria.minBedrooms)) return false;
  }

  // Guests
  if (criteria.minGuests) {
    if (listing.sleeps < Number(criteria.minGuests)) return false;
  }

  return true;
}

/**
 * Check if a listing has had a price drop.
 */
export function isPriceDrop(listing: ListingForMatch): boolean {
  return (
    listing.previous_nightly_rate !== null &&
    listing.previous_nightly_rate > listing.nightly_rate
  );
}

/**
 * Calculate the price drop percentage.
 */
export function priceDropPercentage(oldRate: number, newRate: number): number {
  if (oldRate <= 0) return 0;
  return Math.round(((oldRate - newRate) / oldRate) * 100);
}

/**
 * Format a price drop for display.
 */
export function formatPriceDrop(oldRate: number, newRate: number): string {
  const pct = priceDropPercentage(oldRate, newRate);
  return `$${oldRate}/night → $${newRate}/night (${pct}% off)`;
}
