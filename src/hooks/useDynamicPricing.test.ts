import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createHookWrapper } from "@/test/helpers/render";
import { useDynamicPricing } from "./useDynamicPricing";

const mockRpcResult = vi.hoisted(() => ({
  data: null as unknown,
  error: null as unknown,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(() => Promise.resolve(mockRpcResult)),
  },
}));

// Mock suggestDynamicPrice to isolate hook logic
vi.mock("@/lib/dynamicPricing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/dynamicPricing")>();
  return {
    ...actual,
    suggestDynamicPrice: actual.suggestDynamicPrice,
  };
});

describe("useDynamicPricing", () => {
  it("returns null when brand is undefined", () => {
    const wrapper = createHookWrapper();
    const { result } = renderHook(() => useDynamicPricing(undefined, "Orlando, FL", 2, "2026-06-01"), { wrapper });
    expect(result.current.suggestion).toBeNull();
  });

  it("returns null when location is undefined", () => {
    const wrapper = createHookWrapper();
    const { result } = renderHook(() => useDynamicPricing("hilton_grand_vacations", undefined, 2, "2026-06-01"), { wrapper });
    expect(result.current.suggestion).toBeNull();
  });

  it("returns null when bedrooms is undefined", () => {
    const wrapper = createHookWrapper();
    const { result } = renderHook(() => useDynamicPricing("hilton_grand_vacations", "Orlando, FL", undefined, "2026-06-01"), { wrapper });
    expect(result.current.suggestion).toBeNull();
  });

  it("returns null when checkInDate is undefined", () => {
    const wrapper = createHookWrapper();
    const { result } = renderHook(() => useDynamicPricing("hilton_grand_vacations", "Orlando, FL", 2, undefined), { wrapper });
    expect(result.current.suggestion).toBeNull();
  });

  it("returns suggestion when RPC returns valid data", async () => {
    mockRpcResult.data = {
      seasonalData: [],
      marketAvg: 200,
      comparableCount: 5,
      pendingBidCount: 0,
      savedSearchCount: 0,
    };
    mockRpcResult.error = null;

    const wrapper = createHookWrapper();
    const { result } = renderHook(
      () => useDynamicPricing("hilton_grand_vacations", "Orlando, FL", 2, "2026-09-01"),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.suggestion).not.toBeNull();
    });

    expect(result.current.suggestion?.baseMarketRate).toBe(200);
    expect(result.current.suggestion?.confidence).toBe("medium");
  });

  it("returns null when fewer than 2 comparables", async () => {
    mockRpcResult.data = {
      seasonalData: [],
      marketAvg: 200,
      comparableCount: 1,
      pendingBidCount: 0,
      savedSearchCount: 0,
    };
    mockRpcResult.error = null;

    const wrapper = createHookWrapper();
    const { result } = renderHook(
      () => useDynamicPricing("hilton_grand_vacations", "Orlando, FL", 2, "2026-09-01"),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.suggestion).toBeNull();
  });
});
