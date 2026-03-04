import { describe, it, expect } from "vitest";
import { buildComparisonRows } from "./compareListings";
import type { ActiveListing } from "@/hooks/useListings";

function makeListing(overrides: Partial<ActiveListing> & { brand?: string; location?: string; resort_name?: string }): ActiveListing {
  const { brand, location, resort_name, ...rest } = overrides;
  return {
    id: "test-1",
    property_id: "prop-1",
    owner_id: "owner-1",
    status: "active",
    check_in_date: "2026-04-10",
    check_out_date: "2026-04-17",
    final_price: 1400,
    owner_price: 1200,
    rav_markup: 200,
    nightly_rate: 200,
    notes: null,
    cancellation_policy: "moderate",
    open_for_bidding: false,
    bidding_ends_at: null,
    min_bid_amount: null,
    created_at: "2026-03-01T00:00:00Z",
    property: {
      id: "prop-1",
      owner_id: "owner-1",
      brand: brand || "hilton_grand_vacations",
      resort_name: resort_name || "Test Resort",
      location: location || "Orlando, FL",
      description: null,
      bedrooms: 2,
      bathrooms: 2,
      sleeps: 6,
      amenities: [],
      images: [],
      resort_id: null,
      unit_type_id: null,
      resort: null,
      unit_type: null,
    },
    ...rest,
  } as ActiveListing;
}

describe("buildComparisonRows", () => {
  it("returns empty array for empty input", () => {
    expect(buildComparisonRows([])).toEqual([]);
  });

  it("returns 9 rows for two listings", () => {
    const rows = buildComparisonRows([makeListing({}), makeListing({})]);
    expect(rows).toHaveLength(9);
  });

  it("identifies lowest price as best", () => {
    const listings = [
      makeListing({ nightly_rate: 200, final_price: 1400 }),
      makeListing({ id: "test-2", nightly_rate: 150, final_price: 1050 }),
    ];
    const rows = buildComparisonRows(listings);
    const priceRow = rows.find((r) => r.label === "Price/Night")!;
    expect(priceRow.bestIndex).toBe(1); // $150 is cheaper
    expect(priceRow.values).toEqual(["$200", "$150"]);
  });

  it("identifies most bedrooms as best", () => {
    const l1 = makeListing({});
    l1.property.bedrooms = 1;
    const l2 = makeListing({ id: "test-2" });
    l2.property.bedrooms = 3;
    const rows = buildComparisonRows([l1, l2]);
    const bedroomRow = rows.find((r) => r.label === "Bedrooms")!;
    expect(bedroomRow.bestIndex).toBe(1);
  });

  it("identifies most guests as best", () => {
    const l1 = makeListing({});
    l1.property.sleeps = 4;
    const l2 = makeListing({ id: "test-2" });
    l2.property.sleeps = 8;
    const rows = buildComparisonRows([l1, l2]);
    const guestRow = rows.find((r) => r.label === "Guests")!;
    expect(guestRow.bestIndex).toBe(1);
  });

  it("identifies best cancellation policy", () => {
    const listings = [
      makeListing({ cancellation_policy: "strict" }),
      makeListing({ id: "test-2", cancellation_policy: "flexible" }),
    ];
    const rows = buildComparisonRows(listings);
    const cancelRow = rows.find((r) => r.label === "Cancellation")!;
    expect(cancelRow.bestIndex).toBe(1); // flexible is best
    expect(cancelRow.values).toEqual(["Strict", "Flexible"]);
  });

  it("resort and location rows have no bestIndex", () => {
    const rows = buildComparisonRows([makeListing({}), makeListing({})]);
    const resort = rows.find((r) => r.label === "Resort")!;
    const loc = rows.find((r) => r.label === "Location")!;
    expect(resort.bestIndex).toBeNull();
    expect(loc.bestIndex).toBeNull();
  });

  it("handles 3 listings", () => {
    const listings = [
      makeListing({ nightly_rate: 200 }),
      makeListing({ id: "test-2", nightly_rate: 100 }),
      makeListing({ id: "test-3", nightly_rate: 300 }),
    ];
    const rows = buildComparisonRows(listings);
    expect(rows[0].values).toHaveLength(3);
    const priceRow = rows.find((r) => r.label === "Price/Night")!;
    expect(priceRow.bestIndex).toBe(1); // $100 is lowest
  });

  it("shows Studio for 0 bedrooms", () => {
    const l1 = makeListing({});
    l1.property.bedrooms = 0;
    const l2 = makeListing({ id: "test-2" });
    l2.property.bedrooms = 2;
    const rows = buildComparisonRows([l1, l2]);
    const bedroomRow = rows.find((r) => r.label === "Bedrooms")!;
    expect(bedroomRow.values[0]).toBe("Studio");
    expect(bedroomRow.values[1]).toBe("2");
  });
});
