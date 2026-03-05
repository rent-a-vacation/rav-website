import { describe, it, expect } from "vitest";
import { sortListings, type SortOption } from "./listingSort";

const makeListings = () => [
  { created_at: "2026-02-01", final_price: 1500, check_in_date: "2026-04-10", property: { resort: { guest_rating: 4.5 } } },
  { created_at: "2026-02-15", final_price: 800, check_in_date: "2026-03-01", property: { resort: { guest_rating: 4.8 } } },
  { created_at: "2026-01-20", final_price: 1200, check_in_date: "2026-05-01", property: { resort: null } },
] as unknown as import("@/hooks/useListings").ActiveListing[];

describe("sortListings @p0", () => {
  it("sorts by newest first (default)", () => {
    const result = sortListings(makeListings(), "newest");
    expect(result[0].final_price).toBe(800); // Feb 15 is newest
    expect(result[2].final_price).toBe(1200); // Jan 20 is oldest
  });

  it("sorts by price ascending", () => {
    const result = sortListings(makeListings(), "price_asc");
    expect(result[0].final_price).toBe(800);
    expect(result[2].final_price).toBe(1500);
  });

  it("sorts by price descending", () => {
    const result = sortListings(makeListings(), "price_desc");
    expect(result[0].final_price).toBe(1500);
    expect(result[2].final_price).toBe(800);
  });

  it("sorts by check-in date soonest first", () => {
    const result = sortListings(makeListings(), "checkin");
    expect(result[0].check_in_date).toBe("2026-03-01");
    expect(result[2].check_in_date).toBe("2026-05-01");
  });

  it("sorts by rating descending with null handling", () => {
    const result = sortListings(makeListings(), "rating");
    expect(result[0].property.resort.guest_rating).toBe(4.8);
    // null resort rating treated as 0, goes last
    expect(result[2].property.resort).toBeNull();
  });

  it("does not mutate the original array", () => {
    const original = makeListings();
    const firstPrice = original[0].final_price;
    sortListings(original, "price_desc");
    expect(original[0].final_price).toBe(firstPrice);
  });
});
