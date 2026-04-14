import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CuratedEvent, EventCategory } from "@/lib/events";

/**
 * Raw row shape returned by the `get_curated_events` RPC.
 * Maps DB `event_category` enum to the frontend `EventCategory` union.
 */
interface CuratedEventRow {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  category: string;
  recurrence_type: string;
  is_nationwide: boolean;
  search_destinations: string[] | null;
  year: number;
  start_date: string;
  end_date: string;
}

/**
 * Map DB enum values back to the frontend union used by Rentals.tsx / events.ts.
 * DB uses plural forms (e.g., `major_holidays`); frontend uses singular (e.g., `major_holiday`).
 */
const DB_TO_FE_CATEGORY: Record<string, EventCategory> = {
  major_holidays: "major_holiday",
  sports_events: "sports",
  local_events: "cultural",
  school_breaks: "school_break",
  weather_peak_season: "peak_season",
};

function rowToCuratedEvent(row: CuratedEventRow): CuratedEvent {
  return {
    slug: row.slug,
    name: row.name,
    category: DB_TO_FE_CATEGORY[row.category] ?? "cultural",
    dateRange: { start: row.start_date, end: row.end_date },
    year: row.year,
    destinations: row.search_destinations ?? [],
    nationwide: row.is_nationwide,
    icon: row.icon ?? "Sparkles",
  };
}

/**
 * Fetch all curated events for a given year (defaults to current year).
 * Powers the renter-facing Rentals events filter and the upcoming events pill bar.
 */
export function useCuratedEvents(year?: number) {
  return useQuery({
    queryKey: ["curated-events", year ?? "current"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_curated_events", {
        p_year: year ?? null,
      });
      if (error) throw error;
      return ((data ?? []) as CuratedEventRow[]).map(rowToCuratedEvent);
    },
    staleTime: 5 * 60 * 1000, // Events rarely change mid-session.
  });
}
