import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createHookWrapper } from "@/test/helpers/render";
import { mockListings, resetListingCounter } from "@/test/fixtures/listings";

// Mock the supabase module
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
  isSupabaseConfigured: () => true,
}));

// Dynamically import after mock setup
const { useActiveListings, useListing, useActiveListingsCount } = await import(
  "./useListings"
);

beforeEach(() => {
  vi.clearAllMocks();
  resetListingCounter();
});

describe("useActiveListings @p0", () => {
  it("returns active listings on success", async () => {
    const listings = mockListings(3);

    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          gte: mockGte.mockReturnValue({
            order: mockOrder.mockResolvedValue({
              data: listings,
              error: null,
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useActiveListings(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(3);
    expect(mockFrom).toHaveBeenCalledWith("listings");
  });

  it("returns empty array when no listings exist", async () => {
    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          gte: mockGte.mockReturnValue({
            order: mockOrder.mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useActiveListings(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(0);
  });

  it("handles database errors", async () => {
    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          gte: mockGte.mockReturnValue({
            order: mockOrder.mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useActiveListings(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });
});

describe("useListing", () => {
  it("returns single listing by ID", async () => {
    const listing = mockListings(1)[0];

    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          single: mockSingle.mockResolvedValue({
            data: listing,
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useListing("listing-1"), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });

  it("is disabled when listingId is undefined", () => {
    const { result } = renderHook(() => useListing(undefined), {
      wrapper: createHookWrapper(),
    });

    // Should not be loading since it's disabled
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useActiveListingsCount", () => {
  it("returns count of active listings", async () => {
    mockFrom.mockReturnValue({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          gte: mockGte.mockResolvedValue({
            count: 5,
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useActiveListingsCount(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(5);
  });
});
