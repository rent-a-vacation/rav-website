import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createHookWrapper } from "@/test/helpers/render";
import { useReferralCode, useReferralStats } from "./useReferral";

const mockRpcResult = vi.hoisted(() => ({
  data: null as unknown,
  error: null as unknown,
}));

const mockUser = vi.hoisted(() => ({
  user: { id: "user-1", email: "test@test.com" } as { id: string; email: string } | null,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(() => Promise.resolve(mockRpcResult)),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUser,
}));

describe("useReferralCode", () => {
  it("returns null when user is not logged in", () => {
    mockUser.user = null;
    const wrapper = createHookWrapper();
    const { result } = renderHook(() => useReferralCode(), { wrapper });
    expect(result.current.data).toBeUndefined();
  });

  it("returns referral code when logged in", async () => {
    mockUser.user = { id: "user-1", email: "test@test.com" };
    mockRpcResult.data = "ABC12345";
    mockRpcResult.error = null;

    const wrapper = createHookWrapper();
    const { result } = renderHook(() => useReferralCode(), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toBe("ABC12345");
    });
  });
});

describe("useReferralStats", () => {
  it("returns stats when logged in", async () => {
    mockUser.user = { id: "user-1", email: "test@test.com" };
    mockRpcResult.data = {
      totalReferrals: 5,
      convertedReferrals: 2,
      pendingReferrals: 3,
      totalReward: 2,
      rewardType: "commission_discount",
    };
    mockRpcResult.error = null;

    const wrapper = createHookWrapper();
    const { result } = renderHook(() => useReferralStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data?.totalReferrals).toBe(5);
    expect(result.current.data?.convertedReferrals).toBe(2);
  });

  it("returns undefined when not logged in", () => {
    mockUser.user = null;
    const wrapper = createHookWrapper();
    const { result } = renderHook(() => useReferralStats(), { wrapper });
    expect(result.current.data).toBeUndefined();
  });
});
