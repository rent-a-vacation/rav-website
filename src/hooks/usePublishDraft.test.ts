import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { usePublishDraft, loadDraft, clearDraft, type ListPropertyDraft } from "./usePublishDraft";

// Mock supabase
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockImplementation(() => ({
      insert: mockInsert.mockReturnValue({
        select: mockSelect.mockReturnValue({
          single: mockSingle,
        }),
      }),
    })),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

const baseDraft: ListPropertyDraft = {
  formStep: 3,
  selectedBrand: "hilton_grand_vacations",
  isManualEntry: false,
  resortName: "Test Resort",
  location: "Orlando, FL",
  bedrooms: "2",
  bathrooms: "2",
  sleeps: "6",
  description: "A nice resort",
  checkInDate: "2026-06-01",
  checkOutDate: "2026-06-08",
  nightlyRate: "200",
  cleaningFee: "50",
  cancellationPolicy: "flexible",
};

describe("usePublishDraft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("creates property and listing successfully", async () => {
    // Listing limit check passes
    mockRpc.mockResolvedValueOnce({ data: true, error: null });

    // First call: property insert → success
    mockSingle
      .mockResolvedValueOnce({ data: { id: "prop-123" }, error: null });

    // Second call: listing insert
    const { supabase } = await import("@/lib/supabase");
    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // properties insert
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "prop-123" }, error: null }),
            }),
          }),
        } as never;
      }
      // listings insert
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as never;
    });

    // Seed draft
    localStorage.setItem("rav-list-property-draft", JSON.stringify(baseDraft));

    const { result } = renderHook(() => usePublishDraft());

    let outcome: { success: boolean; error?: string };
    await act(async () => {
      outcome = await result.current.publishDraft("user-1", baseDraft);
    });

    expect(outcome!.success).toBe(true);
    expect(result.current.error).toBeNull();
    // Draft should be cleared
    expect(localStorage.getItem("rav-list-property-draft")).toBeNull();
  });

  it("rejects when listing limit is reached", async () => {
    mockRpc.mockResolvedValueOnce({ data: false, error: null });

    const { result } = renderHook(() => usePublishDraft());

    let outcome: { success: boolean; error?: string };
    await act(async () => {
      outcome = await result.current.publishDraft("user-1", baseDraft);
    });

    expect(outcome!.success).toBe(false);
    expect(result.current.error).toBe("Listing limit reached. Please upgrade your plan to create more listings.");
  });

  it("proceeds when listing limit check passes", async () => {
    mockRpc.mockResolvedValueOnce({ data: true, error: null });

    const { supabase } = await import("@/lib/supabase");
    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "prop-123" }, error: null }),
            }),
          }),
        } as never;
      }
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as never;
    });

    const { result } = renderHook(() => usePublishDraft());

    let outcome: { success: boolean; error?: string };
    await act(async () => {
      outcome = await result.current.publishDraft("user-1", baseDraft);
    });

    expect(outcome!.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("check_listing_limit", { _owner_id: "user-1" });
  });

  it("returns error when property insert fails", async () => {
    mockRpc.mockResolvedValueOnce({ data: true, error: null });
    const { supabase } = await import("@/lib/supabase");
    vi.mocked(supabase.from).mockImplementation(() => ({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: "RLS denied" } }),
        }),
      }),
    } as never));

    const { result } = renderHook(() => usePublishDraft());

    let outcome: { success: boolean; error?: string };
    await act(async () => {
      outcome = await result.current.publishDraft("user-1", baseDraft);
    });

    expect(outcome!.success).toBe(false);
    expect(result.current.error).toBe("RLS denied");
  });

  it("returns error when listing insert fails", async () => {
    mockRpc.mockResolvedValueOnce({ data: true, error: null });
    const { supabase } = await import("@/lib/supabase");
    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "prop-123" }, error: null }),
            }),
          }),
        } as never;
      }
      return {
        insert: vi.fn().mockResolvedValue({ error: { message: "Listing insert failed" } }),
      } as never;
    });

    const { result } = renderHook(() => usePublishDraft());

    let outcome: { success: boolean; error?: string };
    await act(async () => {
      outcome = await result.current.publishDraft("user-1", baseDraft);
    });

    expect(outcome!.success).toBe(false);
    expect(result.current.error).toBe("Listing insert failed");
  });
});

describe("loadDraft / clearDraft", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when no draft exists", () => {
    expect(loadDraft()).toBeNull();
  });

  it("returns parsed draft from localStorage", () => {
    localStorage.setItem("rav-list-property-draft", JSON.stringify(baseDraft));
    const draft = loadDraft();
    expect(draft).toEqual(baseDraft);
  });

  it("clearDraft removes the draft", () => {
    localStorage.setItem("rav-list-property-draft", JSON.stringify(baseDraft));
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it("returns null on malformed JSON", () => {
    localStorage.setItem("rav-list-property-draft", "not json{");
    expect(loadDraft()).toBeNull();
  });
});
