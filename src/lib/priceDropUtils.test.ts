import { describe, it, expect } from "vitest";
import {
  doesListingMatchCriteria,
  isPriceDrop,
  priceDropPercentage,
  formatPriceDrop,
  type ListingForMatch,
  type SavedSearchCriteria,
} from "./priceDropUtils";

const baseListing: ListingForMatch = {
  nightly_rate: 180,
  previous_nightly_rate: 220,
  brand: "hilton_grand_vacations",
  location: "Orlando, FL",
  bedrooms: 2,
  sleeps: 6,
};

describe("doesListingMatchCriteria", () => {
  it("matches when criteria is empty (match all)", () => {
    expect(doesListingMatchCriteria(baseListing, {})).toBe(true);
  });

  it("matches on brand filter", () => {
    expect(doesListingMatchCriteria(baseListing, { brandFilter: "hilton_grand_vacations" })).toBe(true);
    expect(doesListingMatchCriteria(baseListing, { brandFilter: "marriott_vacation_club" })).toBe(false);
  });

  it("ignores brand filter 'all'", () => {
    expect(doesListingMatchCriteria(baseListing, { brandFilter: "all" })).toBe(true);
  });

  it("matches on location search query", () => {
    expect(doesListingMatchCriteria(baseListing, { searchQuery: "Orlando" })).toBe(true);
    expect(doesListingMatchCriteria(baseListing, { searchQuery: "orlando" })).toBe(true);
    expect(doesListingMatchCriteria(baseListing, { searchQuery: "Las Vegas" })).toBe(false);
  });

  it("matches brand name in search query", () => {
    expect(doesListingMatchCriteria(baseListing, { searchQuery: "hilton" })).toBe(true);
  });

  it("filters by min price", () => {
    expect(doesListingMatchCriteria(baseListing, { minPrice: "150" })).toBe(true);
    expect(doesListingMatchCriteria(baseListing, { minPrice: "200" })).toBe(false);
  });

  it("filters by max price", () => {
    expect(doesListingMatchCriteria(baseListing, { maxPrice: "200" })).toBe(true);
    expect(doesListingMatchCriteria(baseListing, { maxPrice: "150" })).toBe(false);
  });

  it("filters by min bedrooms", () => {
    expect(doesListingMatchCriteria(baseListing, { minBedrooms: "2" })).toBe(true);
    expect(doesListingMatchCriteria(baseListing, { minBedrooms: "3" })).toBe(false);
  });

  it("filters by min guests", () => {
    expect(doesListingMatchCriteria(baseListing, { minGuests: "4" })).toBe(true);
    expect(doesListingMatchCriteria(baseListing, { minGuests: "8" })).toBe(false);
  });

  it("combines multiple criteria (AND logic)", () => {
    expect(doesListingMatchCriteria(baseListing, {
      searchQuery: "Orlando",
      brandFilter: "hilton_grand_vacations",
      minBedrooms: "2",
      maxPrice: "200",
    })).toBe(true);

    expect(doesListingMatchCriteria(baseListing, {
      searchQuery: "Orlando",
      brandFilter: "marriott_vacation_club", // wrong brand
      minBedrooms: "2",
    })).toBe(false);
  });
});

describe("isPriceDrop", () => {
  it("returns true when previous rate > current rate", () => {
    expect(isPriceDrop(baseListing)).toBe(true);
  });

  it("returns false when no previous rate", () => {
    expect(isPriceDrop({ ...baseListing, previous_nightly_rate: null })).toBe(false);
  });

  it("returns false when price increased", () => {
    expect(isPriceDrop({ ...baseListing, previous_nightly_rate: 150 })).toBe(false);
  });

  it("returns false when price unchanged", () => {
    expect(isPriceDrop({ ...baseListing, previous_nightly_rate: 180 })).toBe(false);
  });
});

describe("priceDropPercentage", () => {
  it("calculates correct percentage", () => {
    expect(priceDropPercentage(200, 180)).toBe(10);
    expect(priceDropPercentage(100, 75)).toBe(25);
    expect(priceDropPercentage(300, 150)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(priceDropPercentage(200, 170)).toBe(15);
    expect(priceDropPercentage(100, 67)).toBe(33);
  });

  it("returns 0 for zero old rate", () => {
    expect(priceDropPercentage(0, 100)).toBe(0);
  });
});

describe("formatPriceDrop", () => {
  it("formats price drop string", () => {
    expect(formatPriceDrop(220, 180)).toBe("$220/night → $180/night (18% off)");
  });

  it("handles round numbers", () => {
    expect(formatPriceDrop(200, 150)).toBe("$200/night → $150/night (25% off)");
  });
});
