import { describe, it, expect } from "vitest";
import {
  CURATED_EVENTS,
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

describe("CURATED_EVENTS data integrity", () => {
  it("has 14 curated events", () => {
    expect(CURATED_EVENTS.length).toBe(14);
  });

  it("all events have unique slugs", () => {
    const slugs = CURATED_EVENTS.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("all events have valid date ranges (start <= end)", () => {
    for (const event of CURATED_EVENTS) {
      expect(event.dateRange.start <= event.dateRange.end).toBe(true);
    }
  });

  it("nationwide events have empty destinations array", () => {
    const nationwide = CURATED_EVENTS.filter((e) => e.nationwide);
    for (const event of nationwide) {
      expect(event.destinations).toEqual([]);
    }
  });

  it("non-nationwide events have at least one destination", () => {
    const local = CURATED_EVENTS.filter((e) => !e.nationwide);
    for (const event of local) {
      expect(event.destinations.length).toBeGreaterThan(0);
    }
  });

  it("all events have an icon defined", () => {
    for (const event of CURATED_EVENTS) {
      expect(event.icon).toBeTruthy();
    }
  });
});

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
  const springBreakEast: CuratedEvent = CURATED_EVENTS.find((e) => e.slug === "spring-break-east")!;
  const fourthOfJuly: CuratedEvent = CURATED_EVENTS.find((e) => e.slug === "fourth-of-july-2026")!;

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

  it("returns all listings when no event selected", () => {
    expect(filterByEvent(listings, null)).toHaveLength(4);
  });

  it("filters by spring break east (date + destination)", () => {
    const result = filterByEvent(listings, "spring-break-east");
    expect(result).toHaveLength(2);
    expect(result.map((l) => l.id).sort()).toEqual(["1", "2"]);
  });

  it("returns all listings for unknown event slug", () => {
    expect(filterByEvent(listings, "nonexistent")).toHaveLength(4);
  });
});

describe("getUpcomingEvents", () => {
  it("returns events with end date >= reference date", () => {
    const upcoming = getUpcomingEvents("2026-06-01");
    expect(upcoming.every((e) => e.dateRange.end >= "2026-06-01")).toBe(true);
  });

  it("returns events sorted by start date", () => {
    const upcoming = getUpcomingEvents("2026-01-01");
    for (let i = 1; i < upcoming.length; i++) {
      expect(upcoming[i].dateRange.start >= upcoming[i - 1].dateRange.start).toBe(true);
    }
  });

  it("respects limit parameter", () => {
    const upcoming = getUpcomingEvents("2026-01-01", 3);
    expect(upcoming).toHaveLength(3);
  });

  it("filters out past events", () => {
    const upcoming = getUpcomingEvents("2027-12-01");
    expect(upcoming).toHaveLength(0);
  });
});

describe("findEventsByQuery", () => {
  it("finds events by partial name match", () => {
    const results = findEventsByQuery("super bowl");
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe("super-bowl-lx");
  });

  it("finds multiple matches", () => {
    const results = findEventsByQuery("spring");
    expect(results).toHaveLength(2);
  });

  it("returns empty for no match", () => {
    expect(findEventsByQuery("olympics")).toHaveLength(0);
  });

  it("returns empty for empty query", () => {
    expect(findEventsByQuery("")).toHaveLength(0);
  });

  it("is case insensitive", () => {
    expect(findEventsByQuery("MARDI GRAS")).toHaveLength(1);
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
