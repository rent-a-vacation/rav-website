import type { ActiveListing } from "@/hooks/useListings";
import { getLocation } from "@/components/ListingCard";

/**
 * Curated event types and pure utilities for event-based search filtering.
 *
 * Event data is now managed in the DB (`seasonal_events` + `event_instances`)
 * and fetched via the `useCuratedEvents` hook. Admin staff can add/edit/retire
 * events from RAV Ops → Notification Center → Templates (#338).
 *
 * This file intentionally contains no static event data — only type
 * definitions and pure functions that operate on events.
 */

export type EventCategory =
  | "major_holiday"
  | "sports"
  | "cultural"
  | "school_break"
  | "peak_season";

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
 * Requires the caller to supply the pool of events (typically from useCuratedEvents).
 */
export function filterByEvent(
  listings: ActiveListing[],
  eventSlug: string | null,
  events: CuratedEvent[]
): ActiveListing[] {
  if (!eventSlug) return listings;

  const event = events.find((e) => e.slug === eventSlug);
  if (!event) return listings;

  return listings.filter((listing) => doesListingMatchEvent(listing, event));
}

/**
 * Filter the supplied events list to those that have not ended by `referenceDate`,
 * sorted by start date. Optional `limit` caps the returned count.
 */
export function getUpcomingEvents(
  events: CuratedEvent[],
  referenceDate?: string,
  limit?: number
): CuratedEvent[] {
  const ref = referenceDate || new Date().toISOString().split("T")[0];

  const upcoming = events.filter((e) => e.dateRange.end >= ref);
  upcoming.sort((a, b) => a.dateRange.start.localeCompare(b.dateRange.start));

  return limit ? upcoming.slice(0, limit) : upcoming;
}

/**
 * Find events matching a search query (for text search integration).
 */
export function findEventsByQuery(events: CuratedEvent[], query: string): CuratedEvent[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return events.filter((e) => e.name.toLowerCase().includes(q));
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
