import type { ActiveListing } from "@/hooks/useListings";
import { getLocation } from "@/components/ListingCard";

/**
 * Curated event data for event-based search filtering.
 * Static for now — structured for easy migration to a DB table later.
 * Update quarterly to keep dates current.
 */

export type EventCategory = "major_holiday" | "sports" | "cultural" | "school_break" | "peak_season";

export interface CuratedEvent {
  slug: string;
  name: string;
  category: EventCategory;
  dateRange: { start: string; end: string }; // ISO dates (YYYY-MM-DD)
  year: number;
  /** City/state names that match getLocation() output format (e.g., "Orlando", "Las Vegas", "HI") */
  destinations: string[];
  /** If true, matches all destinations (nationwide events) */
  nationwide: boolean;
  icon: string; // Lucide icon name
}

/**
 * Curated events for 2026. Ordered roughly by date.
 * Destinations use city/state names that match resort location strings.
 */
export const CURATED_EVENTS: CuratedEvent[] = [
  {
    slug: "sundance-2026",
    name: "Sundance Film Festival",
    category: "cultural",
    dateRange: { start: "2026-01-22", end: "2026-02-01" },
    year: 2026,
    destinations: ["Park City"],
    nationwide: false,
    icon: "Film",
  },
  {
    slug: "super-bowl-lx",
    name: "Super Bowl LX",
    category: "sports",
    dateRange: { start: "2026-02-04", end: "2026-02-10" },
    year: 2026,
    destinations: ["Santa Clara", "San Francisco", "San Jose"],
    nationwide: false,
    icon: "Trophy",
  },
  {
    slug: "mardi-gras-2026",
    name: "Mardi Gras",
    category: "cultural",
    dateRange: { start: "2026-02-12", end: "2026-02-18" },
    year: 2026,
    destinations: ["New Orleans", "Orlando", "Miami"],
    nationwide: false,
    icon: "PartyPopper",
  },
  {
    slug: "spring-break-east",
    name: "Spring Break (East Coast)",
    category: "school_break",
    dateRange: { start: "2026-03-07", end: "2026-03-21" },
    year: 2026,
    destinations: ["Orlando", "Miami", "Tampa", "Myrtle Beach", "Daytona Beach"],
    nationwide: false,
    icon: "Sun",
  },
  {
    slug: "spring-break-west",
    name: "Spring Break (West Coast)",
    category: "school_break",
    dateRange: { start: "2026-03-14", end: "2026-03-28" },
    year: 2026,
    destinations: ["Cancun", "Cabo San Lucas", "Maui", "Oahu", "San Diego"],
    nationwide: false,
    icon: "Sun",
  },
  {
    slug: "masters-golf-2026",
    name: "The Masters",
    category: "sports",
    dateRange: { start: "2026-04-06", end: "2026-04-12" },
    year: 2026,
    destinations: ["Hilton Head", "Myrtle Beach", "Charleston"],
    nationwide: false,
    icon: "Flag",
  },
  {
    slug: "memorial-day-2026",
    name: "Memorial Day Weekend",
    category: "major_holiday",
    dateRange: { start: "2026-05-22", end: "2026-05-26" },
    year: 2026,
    destinations: [],
    nationwide: true,
    icon: "Flag",
  },
  {
    slug: "summer-peak-2026",
    name: "Summer Peak Season",
    category: "peak_season",
    dateRange: { start: "2026-06-15", end: "2026-08-15" },
    year: 2026,
    destinations: [],
    nationwide: true,
    icon: "Sun",
  },
  {
    slug: "fourth-of-july-2026",
    name: "Fourth of July",
    category: "major_holiday",
    dateRange: { start: "2026-06-27", end: "2026-07-06" },
    year: 2026,
    destinations: [],
    nationwide: true,
    icon: "Sparkles",
  },
  {
    slug: "labor-day-2026",
    name: "Labor Day Weekend",
    category: "major_holiday",
    dateRange: { start: "2026-09-04", end: "2026-09-08" },
    year: 2026,
    destinations: [],
    nationwide: true,
    icon: "Palmtree",
  },
  {
    slug: "halloween-orlando-2026",
    name: "Halloween at the Parks",
    category: "cultural",
    dateRange: { start: "2026-10-24", end: "2026-11-01" },
    year: 2026,
    destinations: ["Orlando"],
    nationwide: false,
    icon: "Ghost",
  },
  {
    slug: "thanksgiving-2026",
    name: "Thanksgiving Week",
    category: "major_holiday",
    dateRange: { start: "2026-11-21", end: "2026-11-29" },
    year: 2026,
    destinations: [],
    nationwide: true,
    icon: "UtensilsCrossed",
  },
  {
    slug: "ski-season-2026",
    name: "Ski Season",
    category: "peak_season",
    dateRange: { start: "2026-12-01", end: "2027-03-31" },
    year: 2026,
    destinations: ["Vail", "Breckenridge", "Aspen", "Steamboat Springs", "Park City", "Lake Tahoe"],
    nationwide: false,
    icon: "Snowflake",
  },
  {
    slug: "holiday-season-2026",
    name: "Holiday Season",
    category: "major_holiday",
    dateRange: { start: "2026-12-19", end: "2027-01-03" },
    year: 2026,
    destinations: [],
    nationwide: true,
    icon: "Gift",
  },
];

/**
 * Check if two date ranges overlap.
 * Range A: [aStart, aEnd], Range B: [bStart, bEnd]
 * Overlap if aStart <= bEnd AND aEnd >= bStart.
 */
export function dateRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

/**
 * Check if a listing matches an event (date overlap + destination match).
 */
export function doesListingMatchEvent(listing: ActiveListing, event: CuratedEvent): boolean {
  // Date overlap check
  const hasDateOverlap = dateRangesOverlap(
    listing.check_in_date,
    listing.check_out_date,
    event.dateRange.start,
    event.dateRange.end
  );
  if (!hasDateOverlap) return false;

  // Nationwide events match all destinations
  if (event.nationwide) return true;

  // Destination match — check if listing location contains any event destination
  const locationStr = getLocation(listing).toLowerCase();
  return event.destinations.some((dest) => locationStr.includes(dest.toLowerCase()));
}

/**
 * Filter listings by a selected event.
 * Returns all listings if no event slug provided.
 */
export function filterByEvent(
  listings: ActiveListing[],
  eventSlug: string | null
): ActiveListing[] {
  if (!eventSlug) return listings;

  const event = CURATED_EVENTS.find((e) => e.slug === eventSlug);
  if (!event) return listings;

  return listings.filter((listing) => doesListingMatchEvent(listing, event));
}

/**
 * Get upcoming events (not yet ended), sorted by start date proximity.
 */
export function getUpcomingEvents(referenceDate?: string, limit?: number): CuratedEvent[] {
  const ref = referenceDate || new Date().toISOString().split("T")[0];

  const upcoming = CURATED_EVENTS.filter((e) => e.dateRange.end >= ref);
  upcoming.sort((a, b) => a.dateRange.start.localeCompare(b.dateRange.start));

  return limit ? upcoming.slice(0, limit) : upcoming;
}

/**
 * Find events matching a search query (for text search integration).
 * Returns matching event slugs.
 */
export function findEventsByQuery(query: string): CuratedEvent[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return CURATED_EVENTS.filter((e) => e.name.toLowerCase().includes(q));
}

/**
 * Format event date range for display.
 */
export function formatEventDateRange(event: CuratedEvent): string {
  const start = new Date(event.dateRange.start + "T00:00:00");
  const end = new Date(event.dateRange.end + "T00:00:00");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${monthNames[start.getMonth()]} ${start.getDate()}–${end.getDate()}`;
  }
  return `${monthNames[start.getMonth()]} ${start.getDate()} – ${monthNames[end.getMonth()]} ${end.getDate()}`;
}
