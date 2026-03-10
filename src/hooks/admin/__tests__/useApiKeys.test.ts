import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createHookWrapper } from "@/test/helpers/render";

// Mock supabase
const mockRpc = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: () => ({
      insert: (...args: unknown[]) => mockInsert(...args),
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return { eq: (...eqArgs: unknown[]) => mockEq(...eqArgs) };
      },
    }),
  },
}));

import { useApiKeys, useCreateApiKey, useRevokeApiKey, useApiKeyStats } from "../useApiKeys";

const wrapper = createHookWrapper();

describe("useApiKeys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches API keys via RPC", async () => {
    const mockKeys = [
      { id: "key-1", name: "Test Key", tier: "free", is_active: true },
    ];
    mockRpc.mockResolvedValueOnce({ data: mockKeys, error: null });

    const { result } = renderHook(() => useApiKeys(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockKeys);
    expect(mockRpc).toHaveBeenCalledWith("list_api_keys");
  });

  it("handles RPC error", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "Unauthorized" } });

    const { result } = renderHook(() => useApiKeys(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useApiKeyStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches stats for a specific key", async () => {
    const mockStats = [
      { endpoint: "/v1/listings", request_count: 50, avg_response_time_ms: 120, error_count: 2, day: "2026-03-10" },
    ];
    mockRpc.mockResolvedValueOnce({ data: mockStats, error: null });

    const { result } = renderHook(() => useApiKeyStats("key-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockStats);
    expect(mockRpc).toHaveBeenCalledWith("get_api_key_stats", { p_key_id: "key-1", p_days: 7 });
  });

  it("does not fetch when keyId is null", () => {
    renderHook(() => useApiKeyStats(null), { wrapper });
    expect(mockRpc).not.toHaveBeenCalled();
  });
});

describe("useCreateApiKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates key and inserts hashed version", async () => {
    mockInsert.mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useCreateApiKey(), { wrapper });

    let generatedKey = "";
    await waitFor(async () => {
      generatedKey = await result.current.mutateAsync({
        name: "Test Partner",
        scopes: ["listings:read"],
        tier: "free",
        ownerId: "user-1",
      });
    });

    expect(generatedKey).toMatch(/^rav_pk_[a-f0-9]{32}$/);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test Partner",
        scopes: ["listings:read"],
        tier: "free",
        daily_limit: 100,
        per_minute_limit: 10,
      })
    );
  });
});

describe("useRevokeApiKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets is_active to false and revoked_at", async () => {
    mockEq.mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useRevokeApiKey(), { wrapper });

    await waitFor(async () => {
      await result.current.mutateAsync("key-1");
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        is_active: false,
      })
    );
    expect(mockEq).toHaveBeenCalledWith("id", "key-1");
  });
});
