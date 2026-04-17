import type { ActiveListing } from "@/hooks/useListings";

export type SortOption = "newest" | "price_asc" | "price_desc" | "checkin" | "rating";

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest First",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
  checkin: "Check-in: Soonest",
  rating: "Highest Rated",
};

/**
 * Sort listings. When ownerTierMap is provided and sortBy is "newest",
 * Pro/Business owner listings (tier >= 1) are boosted to the top.
 */
export function sortListings(
  listings: ActiveListing[],
  sortBy: SortOption,
  ownerTierMap?: Map<string, number>,
): ActiveListing[] {
  const sorted = [...listings];
  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => {
        // Priority boost: Pro/Business (tier >= 1) sort before Free (tier 0)
        if (ownerTierMap) {
          const aPriority = (ownerTierMap.get(a.owner_id) ?? 0) >= 1 ? 1 : 0;
          const bPriority = (ownerTierMap.get(b.owner_id) ?? 0) >= 1 ? 1 : 0;
          if (bPriority !== aPriority) return bPriority - aPriority;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    case "price_asc":
      return sorted.sort((a, b) => a.final_price - b.final_price);
    case "price_desc":
      return sorted.sort((a, b) => b.final_price - a.final_price);
    case "checkin":
      return sorted.sort((a, b) => new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime());
    case "rating":
      return sorted.sort((a, b) => {
        const rA = a.property?.resort?.guest_rating ?? 0;
        const rB = b.property?.resort?.guest_rating ?? 0;
        return rB - rA;
      });
    default:
      return sorted;
  }
}
