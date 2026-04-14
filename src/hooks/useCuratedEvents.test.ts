/**
 * Unit tests for useCuratedEvents — verifies DB-to-frontend row mapping.
 * Issue #338.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCuratedEvents } from "./useCuratedEvents";

const rpcMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  supabase: { rpc: rpcMock },
}));

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

describe("useCuratedEvents", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("maps DB rows to CuratedEvent shape with category translation", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "1",
          slug: "sundance-2026",
          name: "Sundance Film Festival",
          icon: "Film",
          category: "local_events",
          recurrence_type: "annual_fixed",
          is_nationwide: false,
          search_destinations: ["Park City"],
          year: 2026,
          start_date: "2026-01-22",
          end_date: "2026-02-01",
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useCuratedEvents(2026), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    const ev = result.current.data![0];
    expect(ev.slug).toBe("sundance-2026");
    expect(ev.category).toBe("cultural"); // local_events → cultural
    expect(ev.dateRange).toEqual({ start: "2026-01-22", end: "2026-02-01" });
    expect(ev.destinations).toEqual(["Park City"]);
    expect(ev.nationwide).toBe(false);
    expect(ev.icon).toBe("Film");
  });

  it("maps each DB category enum to the frontend union", async () => {
    rpcMock.mockResolvedValue({
      data: [
        { id: "1", slug: "a", name: "A", icon: null, category: "major_holidays",      recurrence_type: "annual_fixed", is_nationwide: true,  search_destinations: [], year: 2026, start_date: "2026-01-01", end_date: "2026-01-02" },
        { id: "2", slug: "b", name: "B", icon: null, category: "sports_events",       recurrence_type: "annual_fixed", is_nationwide: false, search_destinations: [], year: 2026, start_date: "2026-01-01", end_date: "2026-01-02" },
        { id: "3", slug: "c", name: "C", icon: null, category: "school_breaks",       recurrence_type: "annual_fixed", is_nationwide: false, search_destinations: [], year: 2026, start_date: "2026-01-01", end_date: "2026-01-02" },
        { id: "4", slug: "d", name: "D", icon: null, category: "weather_peak_season", recurrence_type: "annual_fixed", is_nationwide: false, search_destinations: [], year: 2026, start_date: "2026-01-01", end_date: "2026-01-02" },
      ],
      error: null,
    });

    const { result } = renderHook(() => useCuratedEvents(2026), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cats = result.current.data!.map((e) => e.category);
    expect(cats).toEqual(["major_holiday", "sports", "school_break", "peak_season"]);
  });

  it("returns empty array when RPC returns null data", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useCuratedEvents(2026), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it("surfaces RPC errors", async () => {
    rpcMock.mockResolvedValue({ data: null, error: new Error("RPC failed") });
    const { result } = renderHook(() => useCuratedEvents(2026), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("falls back to Sparkles when icon is null", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "1",
          slug: "x",
          name: "X",
          icon: null,
          category: "major_holidays",
          recurrence_type: "annual_fixed",
          is_nationwide: true,
          search_destinations: [],
          year: 2026,
          start_date: "2026-01-01",
          end_date: "2026-01-02",
        },
      ],
      error: null,
    });
    const { result } = renderHook(() => useCuratedEvents(2026), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].icon).toBe("Sparkles");
  });
});
