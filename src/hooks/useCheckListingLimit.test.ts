import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, cleanup, waitFor } from "@testing-library/react";
import { useCheckListingLimit } from "./useCheckListingLimit";
import { createHookWrapper } from "@/test/helpers/render";

const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const mockUser = { id: "owner-1", email: "owner@test.com" };
vi.mock("./useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

function setupMocks(opts: {
  canCreate: boolean;
  count: number;
  tierName: string | null;
  maxListings: number | null;
}) {
  mockRpc.mockResolvedValue({ data: opts.canCreate, error: null });

  let fromCallCount = 0;
  mockFrom.mockImplementation(() => {
    fromCallCount++;
    if (fromCallCount === 1) {
      // listings count query
      return {
        select: () => ({
          eq: () => ({
            in: () =>
              Promise.resolve({ count: opts.count, error: null }),
          }),
        }),
      };
    }
    // user_memberships tier query
    return {
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: opts.tierName
                  ? {
                      tier: {
                        tier_name: opts.tierName,
                        max_active_listings: opts.maxListings,
                      },
                    }
                  : null,
                error: null,
              }),
          }),
        }),
      }),
    };
  });
}

describe("useCheckListingLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("returns canCreate true when below free tier limit", async () => {
    setupMocks({ canCreate: true, count: 2, tierName: "Free", maxListings: 3 });

    const { result } = renderHook(() => useCheckListingLimit(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.canCreate).toBe(true);
    expect(result.current.currentCount).toBe(2);
    expect(result.current.maxListings).toBe(3);
    expect(result.current.tierName).toBe("Free");
  });

  it("returns canCreate false when at free tier limit", async () => {
    setupMocks({ canCreate: false, count: 3, tierName: "Free", maxListings: 3 });

    const { result } = renderHook(() => useCheckListingLimit(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.canCreate).toBe(false);
    expect(result.current.currentCount).toBe(3);
    expect(result.current.maxListings).toBe(3);
  });

  it("returns canCreate true for business tier (unlimited)", async () => {
    setupMocks({ canCreate: true, count: 25, tierName: "Business", maxListings: null });

    const { result } = renderHook(() => useCheckListingLimit(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.canCreate).toBe(true);
    expect(result.current.currentCount).toBe(25);
    expect(result.current.maxListings).toBe(null);
    expect(result.current.tierName).toBe("Business");
  });

  it("returns canCreate true for pro tier below limit", async () => {
    setupMocks({ canCreate: true, count: 7, tierName: "Pro", maxListings: 10 });

    const { result } = renderHook(() => useCheckListingLimit(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.canCreate).toBe(true);
    expect(result.current.currentCount).toBe(7);
    expect(result.current.maxListings).toBe(10);
  });

  it("returns canCreate false for pro tier at limit", async () => {
    setupMocks({ canCreate: false, count: 10, tierName: "Pro", maxListings: 10 });

    const { result } = renderHook(() => useCheckListingLimit(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.canCreate).toBe(false);
    expect(result.current.currentCount).toBe(10);
  });

  it("defaults to free tier when no membership exists", async () => {
    setupMocks({ canCreate: true, count: 1, tierName: null, maxListings: null });

    const { result } = renderHook(() => useCheckListingLimit(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.canCreate).toBe(true);
    expect(result.current.currentCount).toBe(1);
    expect(result.current.tierName).toBe("Free");
  });
});
