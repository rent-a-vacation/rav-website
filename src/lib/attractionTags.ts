import type { ActiveListing } from "@/hooks/useListings";

/**
 * Attraction tag definitions for resort-level activity filtering.
 * Tags live on the resorts table; listings inherit via property → resort FK.
 */

export type AttractionTag =
  | "Beach"
  | "Theme Park"
  | "Golf"
  | "Casino"
  | "Ski"
  | "Spa"
  | "Mountain"
  | "Lake";

export interface AttractionTagDef {
  tag: AttractionTag;
  label: string;
  /** Lucide icon name — imported dynamically in the UI component */
  icon: string;
}

/**
 * Ordered list of attraction tags with display metadata.
 * Order determines pill bar rendering order.
 */
export const ATTRACTION_TAGS: AttractionTagDef[] = [
  { tag: "Beach", label: "Beach", icon: "Palmtree" },
  { tag: "Theme Park", label: "Theme Park", icon: "Ferris Wheel" },
  { tag: "Golf", label: "Golf", icon: "Flag" },
  { tag: "Casino", label: "Casino", icon: "Dice5" },
  { tag: "Ski", label: "Ski", icon: "Snowflake" },
  { tag: "Spa", label: "Spa", icon: "Sparkles" },
  { tag: "Mountain", label: "Mountain", icon: "Mountain" },
  { tag: "Lake", label: "Lake", icon: "Waves" },
];

/** All valid tag values as a flat array */
export const ATTRACTION_TAG_VALUES: AttractionTag[] = ATTRACTION_TAGS.map((t) => t.tag);

/**
 * Filter listings by selected attraction tags (OR logic).
 * Returns all listings if no tags selected.
 * A listing matches if its resort has ANY of the selected tags.
 */
export function filterByAttractions(
  listings: ActiveListing[],
  selectedTags: Set<string>
): ActiveListing[] {
  if (selectedTags.size === 0) return listings;

  return listings.filter((listing) => {
    const resortTags = listing.property?.resort?.attraction_tags;
    if (!resortTags || resortTags.length === 0) return false;
    return resortTags.some((tag) => selectedTags.has(tag));
  });
}

/**
 * Get all unique attraction tags present across a set of listings.
 * Useful for showing only relevant tags in the UI.
 */
export function getAvailableAttractions(listings: ActiveListing[]): Set<AttractionTag> {
  const available = new Set<AttractionTag>();
  for (const listing of listings) {
    const tags = listing.property?.resort?.attraction_tags;
    if (tags) {
      for (const tag of tags) {
        if (ATTRACTION_TAG_VALUES.includes(tag as AttractionTag)) {
          available.add(tag as AttractionTag);
        }
      }
    }
  }
  return available;
}
