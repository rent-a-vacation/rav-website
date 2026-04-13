import { describe, it, expect } from "vitest";
import {
  ATTRACTION_TAGS,
  ATTRACTION_TAG_VALUES,
  filterByAttractions,
  getAvailableAttractions,
} from "./attractionTags";
import type { ActiveListing } from "@/hooks/useListings";

// Helper to create a minimal listing with resort attraction_tags
function makeListing(id: string, tags: string[]): ActiveListing {
  return {
    id,
    property_id: `prop-${id}`,
    owner_id: "owner-1",
    status: "active",
    check_in_date: "2026-06-01",
    check_out_date: "2026-06-08",
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
      location: "Orlando, FL",
      description: null,
      bedrooms: 2,
      bathrooms: 2,
      sleeps: 6,
      amenities: [],
      images: [],
      resort_id: `resort-${id}`,
      unit_type_id: null,
      resort: {
        id: `resort-${id}`,
        brand: "hilton_grand_vacations" as const,
        resort_name: "Test Resort",
        location: { city: "Orlando", state: "FL", country: "US", full_address: "" },
        description: null,
        contact: null,
        resort_amenities: [],
        attraction_tags: tags,
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

describe("ATTRACTION_TAGS", () => {
  it("contains 8 tag definitions", () => {
    expect(ATTRACTION_TAGS).toHaveLength(8);
  });

  it("has unique tag values", () => {
    const tags = ATTRACTION_TAGS.map((t) => t.tag);
    expect(new Set(tags).size).toBe(tags.length);
  });

  it("ATTRACTION_TAG_VALUES matches ATTRACTION_TAGS order", () => {
    expect(ATTRACTION_TAG_VALUES).toEqual(ATTRACTION_TAGS.map((t) => t.tag));
  });

  it("each tag has an icon defined", () => {
    for (const def of ATTRACTION_TAGS) {
      expect(def.icon).toBeTruthy();
    }
  });
});

describe("filterByAttractions", () => {
  const beachListing = makeListing("1", ["Beach"]);
  const golfListing = makeListing("2", ["Golf", "Spa"]);
  const skiListing = makeListing("3", ["Ski", "Mountain"]);
  const noTagsListing = makeListing("4", []);
  const allListings = [beachListing, golfListing, skiListing, noTagsListing];

  it("returns all listings when no tags selected", () => {
    const result = filterByAttractions(allListings, new Set());
    expect(result).toHaveLength(4);
  });

  it("filters by single tag (Beach)", () => {
    const result = filterByAttractions(allListings, new Set(["Beach"]));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("uses OR logic for multiple tags", () => {
    const result = filterByAttractions(allListings, new Set(["Beach", "Ski"]));
    expect(result).toHaveLength(2);
    expect(result.map((l) => l.id).sort()).toEqual(["1", "3"]);
  });

  it("matches listings with multi-tag resorts", () => {
    const result = filterByAttractions(allListings, new Set(["Spa"]));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("excludes listings with no tags", () => {
    const result = filterByAttractions(allListings, new Set(["Beach"]));
    expect(result.every((l) => l.id !== "4")).toBe(true);
  });

  it("excludes listings with null resort", () => {
    const noResort: ActiveListing = {
      ...beachListing,
      id: "5",
      property: { ...beachListing.property, resort: null },
    };
    const result = filterByAttractions([noResort], new Set(["Beach"]));
    expect(result).toHaveLength(0);
  });
});

describe("getAvailableAttractions", () => {
  it("returns unique tags from all listings", () => {
    const listings = [
      makeListing("1", ["Beach", "Spa"]),
      makeListing("2", ["Golf", "Spa"]),
      makeListing("3", ["Ski"]),
    ];
    const available = getAvailableAttractions(listings);
    expect(available).toEqual(new Set(["Beach", "Spa", "Golf", "Ski"]));
  });

  it("returns empty set for listings with no tags", () => {
    const listings = [makeListing("1", [])];
    const available = getAvailableAttractions(listings);
    expect(available.size).toBe(0);
  });

  it("ignores invalid tag values", () => {
    const listings = [makeListing("1", ["Beach", "InvalidTag"])];
    const available = getAvailableAttractions(listings);
    expect(available).toEqual(new Set(["Beach"]));
  });
});
