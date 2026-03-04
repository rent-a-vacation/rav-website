import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { computeBookingTimeline } from "./bookingTimeline";

describe("computeBookingTimeline", () => {
  const baseInput = {
    status: "confirmed" as const,
    created_at: "2026-03-01T00:00:00Z",
    check_in_date: "2026-04-10",
    check_out_date: "2026-04-17",
  };

  beforeEach(() => {
    // Fix "now" to March 3, 2026
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-03T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 5 steps", () => {
    const steps = computeBookingTimeline(baseInput);
    expect(steps).toHaveLength(5);
  });

  it("pending: step 1 complete, step 2 active, 3-5 upcoming", () => {
    const steps = computeBookingTimeline({ ...baseInput, status: "pending" });
    expect(steps[0].status).toBe("complete");
    expect(steps[1].status).toBe("active");
    expect(steps[2].status).toBe("upcoming");
    expect(steps[3].status).toBe("upcoming");
    expect(steps[4].status).toBe("upcoming");
  });

  it("confirmed far from check-in: 1-2 complete, 3 active, 4-5 upcoming", () => {
    const steps = computeBookingTimeline(baseInput);
    expect(steps[0].status).toBe("complete");
    expect(steps[1].status).toBe("complete");
    expect(steps[2].status).toBe("active");
    expect(steps[3].status).toBe("upcoming");
    expect(steps[4].status).toBe("upcoming");
  });

  it("confirmed during stay: 1-3 complete, 4 active, 5 upcoming", () => {
    vi.setSystemTime(new Date("2026-04-12T12:00:00"));
    const steps = computeBookingTimeline(baseInput);
    expect(steps[0].status).toBe("complete");
    expect(steps[1].status).toBe("complete");
    expect(steps[2].status).toBe("complete");
    expect(steps[3].status).toBe("active");
    expect(steps[4].status).toBe("upcoming");
  });

  it("confirmed after checkout: 1-4 complete, 5 active", () => {
    vi.setSystemTime(new Date("2026-04-20T12:00:00"));
    const steps = computeBookingTimeline(baseInput);
    expect(steps[0].status).toBe("complete");
    expect(steps[1].status).toBe("complete");
    expect(steps[2].status).toBe("complete");
    expect(steps[3].status).toBe("complete");
    expect(steps[4].status).toBe("active");
  });

  it("completed without review: 1-4 complete, 5 active", () => {
    const steps = computeBookingTimeline({ ...baseInput, status: "completed", hasReview: false });
    expect(steps[0].status).toBe("complete");
    expect(steps[1].status).toBe("complete");
    expect(steps[2].status).toBe("complete");
    expect(steps[3].status).toBe("complete");
    expect(steps[4].status).toBe("active");
  });

  it("completed with review: all 5 complete", () => {
    const steps = computeBookingTimeline({ ...baseInput, status: "completed", hasReview: true });
    expect(steps.every((s) => s.status === "complete")).toBe(true);
  });

  it("cancelled: step 1 complete, 2-5 upcoming", () => {
    const steps = computeBookingTimeline({ ...baseInput, status: "cancelled" });
    expect(steps[0].status).toBe("complete");
    expect(steps[1].status).toBe("upcoming");
    expect(steps[2].status).toBe("upcoming");
    expect(steps[3].status).toBe("upcoming");
    expect(steps[4].status).toBe("upcoming");
  });

  it("step IDs are unique", () => {
    const steps = computeBookingTimeline(baseInput);
    const ids = steps.map((s) => s.id);
    expect(new Set(ids).size).toBe(5);
  });

  it("each step has title and description", () => {
    const steps = computeBookingTimeline(baseInput);
    steps.forEach((step) => {
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
    });
  });

  it("cancelled step 2 description mentions cancellation", () => {
    const steps = computeBookingTimeline({ ...baseInput, status: "cancelled" });
    expect(steps[1].description.toLowerCase()).toContain("cancel");
  });
});
