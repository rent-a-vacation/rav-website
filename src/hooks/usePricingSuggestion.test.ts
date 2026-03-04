import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePricingSuggestion } from "./usePricingSuggestion";

// Mock useActiveListings
const mockListings = vi.hoisted(() => ({
  data: [] as Array<{ nightly_rate: number; property: { brand: string; location: string } }>,
}));

vi.mock("@/hooks/useListings", () => ({
  useActiveListings: () => mockListings,
}));

function setListings(listings: Array<{ nightly_rate: number; brand: string; location: string }>) {
  mockListings.data = listings.map((l) => ({
    nightly_rate: l.nightly_rate,
    property: { brand: l.brand, location: l.location },
  }));
}

describe("usePricingSuggestion", () => {
  it("returns null when brand is undefined", () => {
    setListings([
      { nightly_rate: 100, brand: "hilton_grand_vacations", location: "Orlando, FL" },
      { nightly_rate: 150, brand: "hilton_grand_vacations", location: "Orlando, FL" },
    ]);
    const { result } = renderHook(() => usePricingSuggestion(undefined, "Orlando, FL"));
    expect(result.current).toBeNull();
  });

  it("returns null when fewer than 2 comparables", () => {
    setListings([
      { nightly_rate: 100, brand: "hilton_grand_vacations", location: "Orlando, FL" },
    ]);
    const { result } = renderHook(() => usePricingSuggestion("hilton_grand_vacations", "Orlando, FL"));
    expect(result.current).toBeNull();
  });

  it("computes average, min, max from matching listings", () => {
    setListings([
      { nightly_rate: 100, brand: "hilton_grand_vacations", location: "Orlando, FL" },
      { nightly_rate: 200, brand: "hilton_grand_vacations", location: "Orlando, FL" },
      { nightly_rate: 150, brand: "hilton_grand_vacations", location: "Orlando, FL" },
      { nightly_rate: 300, brand: "marriott_vacation_club", location: "Orlando, FL" }, // different brand
    ]);
    const { result } = renderHook(() => usePricingSuggestion("hilton_grand_vacations", "Orlando, FL"));
    expect(result.current).toEqual({
      avgNightlyRate: 150,
      minNightlyRate: 100,
      maxNightlyRate: 200,
      comparableCount: 3,
    });
  });

  it("filters by location (case-insensitive)", () => {
    setListings([
      { nightly_rate: 100, brand: "hilton_grand_vacations", location: "Orlando, FL" },
      { nightly_rate: 200, brand: "hilton_grand_vacations", location: "orlando, fl" },
      { nightly_rate: 500, brand: "hilton_grand_vacations", location: "Las Vegas, NV" },
    ]);
    const { result } = renderHook(() => usePricingSuggestion("hilton_grand_vacations", "Orlando, FL"));
    expect(result.current?.comparableCount).toBe(2);
    expect(result.current?.avgNightlyRate).toBe(150);
  });

  it("excludes listings with 0 nightly_rate", () => {
    setListings([
      { nightly_rate: 100, brand: "hilton_grand_vacations", location: "Orlando, FL" },
      { nightly_rate: 0, brand: "hilton_grand_vacations", location: "Orlando, FL" },
    ]);
    const { result } = renderHook(() => usePricingSuggestion("hilton_grand_vacations", "Orlando, FL"));
    expect(result.current).toBeNull(); // Only 1 valid comparable
  });

  it("returns null when location is empty", () => {
    setListings([
      { nightly_rate: 100, brand: "hilton_grand_vacations", location: "Orlando, FL" },
      { nightly_rate: 200, brand: "hilton_grand_vacations", location: "Orlando, FL" },
    ]);
    const { result } = renderHook(() => usePricingSuggestion("hilton_grand_vacations", ""));
    expect(result.current).toBeNull();
  });
});
