import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { createHookWrapper } from "@/test/helpers/render";

// Mock supabase
const mockFrom = vi.fn();
const mockInvoke = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
  isSupabaseConfigured: () => true,
}));

// Mock auth context — default: logged-in user
const mockUser = { id: "user-1", email: "test@test.com" };
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// Helper: build a chainable supabase mock
function chain(resolvedValue: { data: unknown; error: unknown }) {
  const c: Record<string, unknown> = {};
  const methods = [
    "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "gt", "gte", "lt", "lte", "in", "is",
    "order", "limit", "single", "maybeSingle", "match", "not", "or",
  ];
  for (const m of methods) {
    c[m] = vi.fn().mockReturnValue(c);
  }
  // Make awaitable
  Object.assign(c, { then: (_resolve: (v: unknown) => void) => _resolve(resolvedValue) });
  return Object.assign(Promise.resolve(resolvedValue), c);
}

// Dynamic imports so mocks are registered first
const biddingModule = await import("./useBidding");

const {
  useListingsOpenForBidding,
  useBidsForListing,
  useMyBids,
  useCreateBid,
  useUpdateBidStatus,
  useOpenListingForBidding,
  useOpenTravelRequests,
  useMyTravelRequests,
  useCreateTravelRequest,
  useUpdateTravelRequestStatus,
  useProposalsForRequest,
  useMyProposals,
  useCreateProposal,
  useUpdateProposalStatus,
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} = biddingModule;

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================
// LISTING BIDS
// ============================================================

describe("useListingsOpenForBidding", () => {
  it("returns listings open for bidding", async () => {
    const listings = [{ id: "l1", open_for_bidding: true }];
    mockFrom.mockReturnValue(chain({ data: listings, error: null }));

    const { result } = renderHook(() => useListingsOpenForBidding(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(listings);
    expect(mockFrom).toHaveBeenCalledWith("listings");
  });

  it("handles error", async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: { message: "fail" } }));

    const { result } = renderHook(() => useListingsOpenForBidding(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useBidsForListing", () => {
  it("returns bids for a specific listing", async () => {
    const bids = [{ id: "b1", bid_amount: 500, listing_id: "l1" }];
    mockFrom.mockReturnValue(chain({ data: bids, error: null }));

    const { result } = renderHook(() => useBidsForListing("l1"), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(bids);
    expect(mockFrom).toHaveBeenCalledWith("listing_bids");
  });

  it("returns empty when listingId is undefined", async () => {
    mockFrom.mockReturnValue(chain({ data: [], error: null }));

    const { result } = renderHook(() => useBidsForListing(undefined), {
      wrapper: createHookWrapper(),
    });

    // Should be idle since enabled: false
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useMyBids", () => {
  it("returns current user's bids", async () => {
    const bids = [{ id: "b1", bidder_id: "user-1", bid_amount: 300 }];
    mockFrom.mockReturnValue(chain({ data: bids, error: null }));

    const { result } = renderHook(() => useMyBids(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(bids);
  });
});

describe("useCreateBid @p0", () => {
  it("creates a bid successfully", async () => {
    const newBid = {
      id: "b-new",
      bid_amount: 450,
      listing_id: "l1",
      listing: { owner_id: "owner-1", property: { resort_name: "Test Resort" } },
    };
    mockFrom.mockReturnValue(chain({ data: newBid, error: null }));
    mockInvoke.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useCreateBid(), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        listing_id: "l1",
        bid_amount: 450,
        guest_count: 2,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith("listing_bids");
  });

  it("dispatches new_bid_received notification to listing owner", async () => {
    const newBid = {
      id: "b-new",
      bid_amount: 450,
      listing_id: "l1",
      listing: { owner_id: "owner-1", property: { resort_name: "Hilton Las Vegas" } },
    };
    mockFrom.mockReturnValue(chain({ data: newBid, error: null }));
    mockInvoke.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useCreateBid(), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.mutate({ listing_id: "l1", bid_amount: 450, guest_count: 2 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        "notification-dispatcher",
        expect.objectContaining({
          body: expect.objectContaining({
            type_key: "new_bid_received",
            user_id: "owner-1",
          }),
        }),
      );
    });
  });

  it("does not fail bid creation when notification dispatch errors", async () => {
    const newBid = {
      id: "b-new",
      bid_amount: 450,
      listing_id: "l1",
      listing: { owner_id: "owner-1", property: { resort_name: "Test Resort" } },
    };
    mockFrom.mockReturnValue(chain({ data: newBid, error: null }));
    mockInvoke.mockRejectedValue(new Error("dispatcher down"));

    const { result } = renderHook(() => useCreateBid(), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.mutate({ listing_id: "l1", bid_amount: 450, guest_count: 2 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useUpdateBidStatus @p0", () => {
  it("updates bid status to accepted", async () => {
    const updated = { id: "b1", status: "accepted" };
    mockFrom.mockReturnValue(chain({ data: updated, error: null }));

    const { result } = renderHook(() => useUpdateBidStatus(), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.mutate({ bidId: "b1", status: "accepted" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("supports counter offer", async () => {
    mockFrom.mockReturnValue(chain({ data: { id: "b1", status: "pending" }, error: null }));

    const { result } = renderHook(() => useUpdateBidStatus(), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        bidId: "b1",
        status: "pending",
        counterOfferAmount: 600,
        counterOfferMessage: "Can you meet at $600?",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useOpenListingForBidding", () => {
  it("opens a listing for bidding", async () => {
    mockFrom.mockReturnValue(chain({ data: { id: "l1", open_for_bidding: true }, error: null }));

    const { result } = renderHook(() => useOpenListingForBidding(), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        listing_id: "l1",
        bidding_ends_at: "2026-04-01T00:00:00Z",
        min_bid_amount: 100,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith("listings");
  });
});

// ============================================================
// TRAVEL REQUESTS
// ============================================================

describe("useOpenTravelRequests", () => {
  it("returns open travel requests", async () => {
    const requests = [{ id: "tr1", status: "open" }];
    mockFrom.mockReturnValue(chain({ data: requests, error: null }));

    const { result } = renderHook(() => useOpenTravelRequests(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(requests);
    expect(mockFrom).toHaveBeenCalledWith("travel_requests");
  });
});

describe("useMyTravelRequests", () => {
  it("returns user's travel requests", async () => {
    const requests = [{ id: "tr1", traveler_id: "user-1" }];
    mockFrom.mockReturnValue(chain({ data: requests, error: null }));

    const { result } = renderHook(() => useMyTravelRequests(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(requests);
  });
});

describe("useCreateTravelRequest", () => {
  it("creates a travel request", async () => {
    mockFrom.mockReturnValue(chain({ data: { id: "tr-new" }, error: null }));

    const { result } = renderHook(() => useCreateTravelRequest(), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        destination: "Orlando, FL",
        check_in_date: "2026-06-01",
        check_out_date: "2026-06-07",
        guest_count: 4,
        budget_preference: "range",
        budget_min: 500,
        budget_max: 1500,
        proposals_deadline: "2026-05-20T00:00:00Z",
      } as never);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useUpdateTravelRequestStatus", () => {
  it("updates request status", async () => {
    mockFrom.mockReturnValue(chain({ data: { id: "tr1", status: "closed" }, error: null }));

    const { result } = renderHook(() => useUpdateTravelRequestStatus(), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.mutate({ requestId: "tr1", status: "closed" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ============================================================
// PROPOSALS
// ============================================================

describe("useProposalsForRequest", () => {
  it("returns proposals for a travel request", async () => {
    const proposals = [{ id: "p1", request_id: "tr1", proposed_price: 800 }];
    mockFrom.mockReturnValue(chain({ data: proposals, error: null }));

    const { result } = renderHook(() => useProposalsForRequest("tr1"), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(proposals);
    expect(mockFrom).toHaveBeenCalledWith("travel_proposals");
  });

  it("is idle when requestId is undefined", () => {
    const { result } = renderHook(() => useProposalsForRequest(undefined), {
      wrapper: createHookWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useMyProposals", () => {
  it("returns owner's proposals", async () => {
    const proposals = [{ id: "p1", owner_id: "user-1" }];
    mockFrom.mockReturnValue(chain({ data: proposals, error: null }));

    const { result } = renderHook(() => useMyProposals(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(proposals);
  });
});

describe("useCreateProposal", () => {
  it("creates a proposal", async () => {
    mockFrom.mockReturnValue(chain({ data: { id: "p-new" }, error: null }));

    const { result } = renderHook(() => useCreateProposal(), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        request_id: "tr1",
        property_id: "prop1",
        proposed_price: 700,
        message: "Great property for your trip",
      } as never);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useUpdateProposalStatus", () => {
  it("accepts a proposal", async () => {
    mockFrom.mockReturnValue(chain({ data: { id: "p1", status: "accepted" }, error: null }));

    const { result } = renderHook(() => useUpdateProposalStatus(), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.mutate({ proposalId: "p1", status: "accepted" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ============================================================
// NOTIFICATIONS
// ============================================================

describe("useNotifications", () => {
  it("returns user's notifications", async () => {
    const notifications = [{ id: "n1", user_id: "user-1", type: "new_bid_received" }];
    mockFrom.mockReturnValue(chain({ data: notifications, error: null }));

    const { result } = renderHook(() => useNotifications(10), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(notifications);
    expect(mockFrom).toHaveBeenCalledWith("notifications");
  });
});

describe("useUnreadNotificationCount", () => {
  it("returns count of unread notifications", async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: null, count: 3 } as never));

    const { result } = renderHook(() => useUnreadNotificationCount(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe("useMarkNotificationRead", () => {
  it("marks a notification as read", async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: null }));

    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.mutate("n1");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith("notifications");
  });
});

describe("useMarkAllNotificationsRead", () => {
  it("marks all notifications as read", async () => {
    mockFrom.mockReturnValue(chain({ data: null, error: null }));

    const { result } = renderHook(() => useMarkAllNotificationsRead(), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
