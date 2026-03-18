/**
 * Tests for notification utility functions.
 */

import { describe, it, expect } from "vitest";
import {
  normalizePhone,
  formatDestination,
  getDateGroup,
  NOTIFICATION_TYPE_CATEGORIES,
} from "./notificationUtils";

describe("normalizePhone", () => {
  it("normalizes 10-digit US number", () => {
    expect(normalizePhone("5551234567")).toBe("+15551234567");
  });

  it("normalizes 11-digit number starting with 1", () => {
    expect(normalizePhone("15551234567")).toBe("+15551234567");
  });

  it("accepts valid E.164 format", () => {
    expect(normalizePhone("+15551234567")).toBe("+15551234567");
  });

  it("strips non-digit characters", () => {
    expect(normalizePhone("(555) 123-4567")).toBe("+15551234567");
    expect(normalizePhone("555-123-4567")).toBe("+15551234567");
    expect(normalizePhone("555.123.4567")).toBe("+15551234567");
  });

  it("strips +1 prefix formatting", () => {
    expect(normalizePhone("+1 (555) 123-4567")).toBe("+15551234567");
  });

  it("returns null for too few digits", () => {
    expect(normalizePhone("555123")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(normalizePhone("")).toBeNull();
  });

  it("returns null for non-standard international numbers via digits path", () => {
    // 12 digits doesn't match 10 or 11-starting-with-1
    expect(normalizePhone("441234567890")).toBeNull();
  });

  it("accepts valid international E.164 numbers", () => {
    expect(normalizePhone("+441234567890")).toBe("+441234567890");
  });

  it("treats +0... as 10-digit input after stripping non-digits", () => {
    // +0123456789 → digits "0123456789" (10 digits) → "+10123456789"
    expect(normalizePhone("+0123456789")).toBe("+10123456789");
  });
});

describe("formatDestination", () => {
  it("formats known destinations", () => {
    expect(formatDestination("orlando")).toBe("Orlando");
    expect(formatDestination("las_vegas")).toBe("Las Vegas");
    expect(formatDestination("maui_hawaii")).toBe("Maui / Hawaii");
    expect(formatDestination("myrtle_beach")).toBe("Myrtle Beach");
    expect(formatDestination("new_york")).toBe("New York");
  });

  it("formats unknown destinations by replacing underscores and capitalizing", () => {
    expect(formatDestination("san_francisco")).toBe("San Francisco");
    expect(formatDestination("some_place")).toBe("Some Place");
  });
});

describe("getDateGroup", () => {
  it("returns 'Today' for today's date", () => {
    const now = new Date();
    expect(getDateGroup(now.toISOString())).toBe("Today");
  });

  it("returns 'Yesterday' for yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0); // midday to avoid edge cases
    expect(getDateGroup(yesterday.toISOString())).toBe("Yesterday");
  });

  it("returns 'This Week' for 3 days ago", () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(12, 0, 0, 0);
    expect(getDateGroup(threeDaysAgo.toISOString())).toBe("This Week");
  });

  it("returns 'Older' for 2 weeks ago", () => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    expect(getDateGroup(twoWeeksAgo.toISOString())).toBe("Older");
  });
});

describe("NOTIFICATION_TYPE_CATEGORIES", () => {
  it("maps booking types to bookings", () => {
    expect(NOTIFICATION_TYPE_CATEGORIES["booking_confirmed"]).toBe("bookings");
    expect(NOTIFICATION_TYPE_CATEGORIES["payment_received"]).toBe("bookings");
  });

  it("maps bid types to bids", () => {
    expect(NOTIFICATION_TYPE_CATEGORIES["new_bid_received"]).toBe("bids");
    expect(NOTIFICATION_TYPE_CATEGORIES["bid_accepted"]).toBe("bids");
    expect(NOTIFICATION_TYPE_CATEGORIES["bidding_ending_soon"]).toBe("bids");
  });

  it("maps travel request types to travel_requests", () => {
    expect(NOTIFICATION_TYPE_CATEGORIES["new_travel_request_match"]).toBe("travel_requests");
    expect(NOTIFICATION_TYPE_CATEGORIES["travel_request_matched"]).toBe("travel_requests");
  });

  it("maps seasonal types to reminders", () => {
    expect(NOTIFICATION_TYPE_CATEGORIES["seasonal_sms_12wk"]).toBe("reminders");
    expect(NOTIFICATION_TYPE_CATEGORIES["seasonal_sms_6wk"]).toBe("reminders");
    expect(NOTIFICATION_TYPE_CATEGORIES["seasonal_sms_2wk"]).toBe("reminders");
  });

  it("maps message_received to system", () => {
    expect(NOTIFICATION_TYPE_CATEGORIES["message_received"]).toBe("system");
  });
});
