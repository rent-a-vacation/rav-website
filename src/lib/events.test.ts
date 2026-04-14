import { describe, it, expect } from "vitest";
import {
  dateRangesOverlap,
  doesListingMatchEvent,
  filterByEvent,
  getUpcomingEvents,
  findEventsByQuery,
  formatEventDateRange,
  type CuratedEvent,
} from "./events";
import type { ActiveListing } from "@/hooks/useListings";

// Helper to create a minimal listing
function makeListing(
  id: string,
  checkIn: string,
  checkOut: string,
  city: string,
  state: string
): ActiveListing {
  return {
    id,
    property_id: `prop-${id}`,
    owner_id: "owner-1",
    status: "active",
    check_in_date: checkIn,
    check_out_date: checkOut,
    final_price: 1000,
    owner_price: 870,
    rav_markup: 130,
    nightly_rate: 143,
    notes: null,
    cancellation_policy: "moderate",
    open_for_bidding: true,
    bidding_ends_at: null,
    min_bid_amount: null,
    created_at: "2026-04-01",
    property: {
      id: `prop-${id}`,
      owner_id: "owner-1",
      brand: "hilton_grand_vacations",
      resort_name: "Test Resort",
      location: `${city}, ${state}`,
      description: null,
      bedrooms: 2,
      bathrooms: 2,
      sleeps: 6,
      amenities: [],
      images: [],
      resort_id: null,
      unit_type_id: null,
      resort: {
        id: "resort-1",
        brand: "hilton_grand_vacations" as const,
        resort_name: "Test Resort",
        location: { city, state, country: "US", full_address: "" },
        description: null,
        contact: null,
        resort_amenities: [],
        attraction_tags: [],
        policies: null,
        nearby_airports: [],
        guest_rating: null,
        main_image_url: null,
        additional_images: [],
        created_at: "",
        updated_at: "",
      },
      unit_type: null,
    },
  };
}

// Sample event fixtures used across tests (replicate DB-shape events).
const springBreakEast: CuratedEvent = {
  slug: "spring-break-east",
  name: "Spring Break (East Coast)",
  category: "school_break",
  dateRange: { start: "2026-03-07", end: "2026-03-21" },
  year: 2026,
  destinations: ["Orlando", "Miami", "Tampa", "Myrtle Beach", "Daytona Beach"],
  nationwide: false,
  icon: "Sun",
};

const fourthOfJuly: CuratedEvent = {
  slug: "fourth-of-july-2026",
  name: "Fourth of July",
  category: "major_holiday",
  dateRange: { start: "2026-06-27", end: "2026-07-06" },
  year: 2026,
  destinations: [],
  nationwide: true,
  icon: "Sparkles",
};

const superBowl: CuratedEvent = {
  slug: "super-bowl-lx",
  name: "Super Bowl LX",
  category: "sports",
  dateRange: { start: "2026-02-04", end: "2026-02-10" },
  year: 2026,
  destinations: ["Santa Clara"],
  nationwide: false,
  icon: "Trophy",
};

const mardiGras: CuratedEvent = {
  slug: "mardi-gras-2026",
  name: "Mardi Gras",
  category: "cultural",
  dateRange: { start: "2026-02-12", end: "2026-02-18" },
  year: 2026,
  destinations: ["New Orleans", "Orlando"],
  nationwide: false,
  icon: "PartyPopper",
};

describe("dateRangesOverlap", () => {
  it("returns true for overlapping ranges", () => {
    expect(dateRangesOverlap("2026-03-01", "2026-03-10", "2026-03-05", "2026-03-15")).toBe(true);
  });

  it("returns true when ranges share a single day", () => {
    expect(dateRangesOverlap("2026-03-01", "2026-03-10", "2026-03-10", "2026-03-20")).toBe(true);
  });

  it("returns false for non-overlapping ranges", () => {
    expect(dateRangesOverlap("2026-03-01", "2026-03-10", "2026-03-11", "2026-03-20")).toBe(false);
  });

  it("returns true when one range contains the other", () => {
    expect(dateRangesOverlap("2026-03-01", "2026-03-31", "2026-03-10", "2026-03-15")).toBe(true);
  });

  it("returns true for identical ranges", () => {
    expect(dateRangesOverlap("2026-03-01", "2026-03-10", "2026-03-01", "2026-03-10")).toBe(true);
  });
});

describe("doesListingMatchEvent", () => {
  it("matches listing with date overlap + destination match", () => {
    const listing = makeListing("1", "2026-03-10", "2026-03-17", "Orlando", "FL");
    expect(doesListingMatchEvent(listing, springBreakEast)).toBe(true);
  });

  it("rejects listing with date overlap but wrong destination", () => {
    const listing = makeListing("2", "2026-03-10", "2026-03-17", "Las Vegas", "NV");
    expect(doesListingMatchEvent(listing, springBreakEast)).toBe(false);
  });

  it("rejects listing with right destination but no date overlap", () => {
    const listing = makeListing("3", "2026-06-01", "2026-06-08", "Orlando", "FL");
    expect(doesListingMatchEvent(listing, springBreakEast)).toBe(false);
  });

  it("matches any destination for nationwide events", () => {
    const listing = makeListing("4", "2026-07-01", "2026-07-05", "Las Vegas", "NV");
    expect(doesListingMatchEvent(listing, fourthOfJuly)).toBe(true);
  });

  it("still requires date overlap for nationwide events", () => {
    const listing = makeListing("5", "2026-08-01", "2026-08-08", "Orlando", "FL");
    expect(doesListingMatchEvent(listing, fourthOfJuly)).toBe(false);
  });
});

describe("filterByEvent", () => {
  const listings = [
    makeListing("1", "2026-03-10", "2026-03-17", "Orlando", "FL"),
    makeListing("2", "2026-03-12", "2026-03-19", "Miami", "FL"),
    makeListing("3", "2026-03-10", "2026-03-17", "Las Vegas", "NV"),
    makeListing("4", "2026-06-01", "2026-06-08", "Orlando", "FL"),
  ];
  const events = [springBreakEast, fourthOfJuly, superBowl, mardiGras];

  it("returns all listings when no event selected", () => {
    expect(filterByEvent(listings, null, events)).toHaveLength(4);
  });

  it("filters by spring break east (date + destination)", () => {
    const result = filterByEvent(listings, "spring-break-east", events);
    expect(result).toHaveLength(2);
    expect(result.map((l) => l.id).sort()).toEqual(["1", "2"]);
  });

  it("returns all listings for unknown event slug", () => {
    expect(filterByEvent(listings, "nonexistent", events)).toHaveLength(4);
  });

  it("returns all listings when events list is empty", () => {
    expect(filterByEvent(listings, "spring-break-east", [])).toHaveLength(4);
  });
});

describe("getUpcomingEvents", () => {
  const events = [springBreakEast, fourthOfJuly, superBowl, mardiGras];

  it("returns events with end date >= reference date", () => {
    const upcoming = getUpcomingEvents(events, "2026-06-01");
    expect(upcoming.every((e) => e.dateRange.end >= "2026-06-01")).toBe(true);
  });

  it("returns events sorted by start date", () => {
    const upcoming = getUpcomingEvents(events, "2026-01-01");
    for (let i = 1; i < upcoming.length; i++) {
      expect(upcoming[i].dateRange.start >= upcoming[i - 1].dateRange.start).toBe(true);
    }
  });

  it("respects limit parameter", () => {
    const upcoming = getUpcomingEvents(events, "2026-01-01", 2);
    expect(upcoming).toHaveLength(2);
  });

  it("filters out past events", () => {
    const upcoming = getUpcomingEvents(events, "2027-12-01");
    expect(upcoming).toHaveLength(0);
  });
});

describe("findEventsByQuery", () => {
  const events = [springBreakEast, fourthOfJuly, superBowl, mardiGras];

  it("finds events by partial name match", () => {
    const results = findEventsByQuery(events, "super bowl");
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe("super-bowl-lx");
  });

  it("returns empty for no match", () => {
    expect(findEventsByQuery(events, "olympics")).toHaveLength(0);
  });

  it("returns empty for empty query", () => {
    expect(findEventsByQuery(events, "")).toHaveLength(0);
  });

  it("is case insensitive", () => {
    expect(findEventsByQuery(events, "MARDI GRAS")).toHaveLength(1);
  });
});

describe("formatEventDateRange", () => {
  it("formats same-month range correctly", () => {
    const event: CuratedEvent = {
      slug: "test",
      name: "Test",
      category: "major_holiday",
      dateRange: { start: "2026-03-07", end: "2026-03-21" },
      year: 2026,
      destinations: [],
      nationwide: true,
      icon: "Sun",
    };
    expect(formatEventDateRange(event)).toBe("Mar 7–21");
  });

  it("formats cross-month range correctly", () => {
    const event: CuratedEvent = {
      slug: "test",
      name: "Test",
      category: "major_holiday",
      dateRange: { start: "2026-12-19", end: "2027-01-03" },
      year: 2026,
      destinations: [],
      nationwide: true,
      icon: "Gift",
    };
    expect(formatEventDateRange(event)).toBe("Dec 19 – Jan 3");
  });
});
