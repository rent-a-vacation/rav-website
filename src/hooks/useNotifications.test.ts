/**
 * Tests for useNotifications hook utility functions.
 * GitHub Issue: #220
 */

import { describe, it, expect } from "vitest";
import { getNotificationLink } from "./useNotifications";

describe("getNotificationLink", () => {
  it("returns listing link for bid-related notifications", () => {
    expect(
      getNotificationLink({
        type: "new_bid_received",
        listing_id: "abc-123",
      }),
    ).toBe("/rentals/abc-123");
  });

  it("returns listing link for bid_accepted", () => {
    expect(
      getNotificationLink({
        type: "bid_accepted",
        listing_id: "listing-1",
      }),
    ).toBe("/rentals/listing-1");
  });

  it("returns null for bid notification without listing_id", () => {
    expect(
      getNotificationLink({
        type: "new_bid_received",
        listing_id: null,
      }),
    ).toBeNull();
  });

  it("returns my-trips bookings tab for booking_confirmed with booking_id", () => {
    expect(
      getNotificationLink({
        type: "booking_confirmed",
        booking_id: "book-1",
      }),
    ).toBe("/my-trips?tab=bookings");
  });

  it("returns my-trips for booking_confirmed without booking_id", () => {
    expect(
      getNotificationLink({
        type: "booking_confirmed",
        booking_id: null,
      }),
    ).toBe("/my-trips");
  });

  it("returns my-trips bookings for payment_received", () => {
    expect(
      getNotificationLink({
        type: "payment_received",
        booking_id: "book-2",
      }),
    ).toBe("/my-trips?tab=bookings");
  });

  it("returns my-trips offers for proposal notifications", () => {
    expect(
      getNotificationLink({
        type: "new_proposal_received",
      }),
    ).toBe("/my-trips?tab=offers");

    expect(
      getNotificationLink({
        type: "proposal_accepted",
      }),
    ).toBe("/my-trips?tab=offers");

    expect(
      getNotificationLink({
        type: "proposal_rejected",
      }),
    ).toBe("/my-trips?tab=offers");
  });

  it("returns my-trips overview for travel request notifications", () => {
    expect(
      getNotificationLink({
        type: "new_travel_request_match",
      }),
    ).toBe("/my-trips?tab=overview");

    expect(
      getNotificationLink({
        type: "travel_request_expiring_soon",
      }),
    ).toBe("/my-trips?tab=overview");

    expect(
      getNotificationLink({
        type: "travel_request_matched",
      }),
    ).toBe("/my-trips?tab=overview");
  });

  it("returns my-trips bookings for message_received", () => {
    expect(
      getNotificationLink({
        type: "message_received",
        booking_id: "book-3",
      }),
    ).toBe("/my-trips?tab=bookings");
  });

  it("returns null for unknown notification type", () => {
    expect(
      getNotificationLink({
        type: "some_unknown_type",
      }),
    ).toBeNull();
  });

  it("returns listing link for bidding_ending_soon", () => {
    expect(
      getNotificationLink({
        type: "bidding_ending_soon",
        listing_id: "listing-xyz",
      }),
    ).toBe("/rentals/listing-xyz");
  });

  it("returns listing link for bid_expired", () => {
    expect(
      getNotificationLink({
        type: "bid_expired",
        listing_id: "listing-exp",
      }),
    ).toBe("/rentals/listing-exp");
  });

  it("returns listing link for bid_rejected", () => {
    expect(
      getNotificationLink({
        type: "bid_rejected",
        listing_id: "listing-rej",
      }),
    ).toBe("/rentals/listing-rej");
  });

  it("returns my-trips overview for request_expiring_soon", () => {
    expect(
      getNotificationLink({
        type: "request_expiring_soon",
      }),
    ).toBe("/my-trips?tab=overview");
  });
});
