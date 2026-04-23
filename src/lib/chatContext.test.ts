import { describe, it, expect } from "vitest";
import { detectChatContext } from "./chatContext";

describe("detectChatContext @p0", () => {
  describe("support routes", () => {
    it.each([
      "/my-trips",
      "/my-trips?tab=offers",
      "/my-bookings",
      "/account",
      "/owner-dashboard",
      "/owner-dashboard?tab=bookings-earnings",
      "/settings/notifications",
      "/disputes/abc-123",
      "/messages",
      "/messages/conversation-id",
      "/notifications",
      "/checkin",
      "/checkout",
      "/booking-success",
      "/welcome",
      "/pending-approval",
      "/subscription-success",
    ])("maps %s → support", (path) => {
      expect(detectChatContext(path)).toBe("support");
    });
  });

  describe("discovery routes", () => {
    it.each([
      "/rentals",
      "/property/abc-123",
      "/destinations",
      "/destinations/orlando",
      "/destinations/orlando/downtown",
      "/tools",
      "/tools/cost-comparator",
      "/calculator",
      "/rav-deals",
    ])("maps %s → rentals", (path) => {
      expect(detectChatContext(path)).toBe("rentals");
    });
  });

  describe("marketplace routes", () => {
    it.each(["/marketplace", "/marketplace?tab=wishes", "/bidding", "/bidding/old-path"])(
      "maps %s → bidding",
      (path) => {
        expect(detectChatContext(path)).toBe("bidding");
      },
    );
  });

  describe("general fallback", () => {
    it.each([
      "/",
      "/how-it-works",
      "/faq",
      "/contact",
      "/user-guide",
      "/documentation",
      "/privacy",
      "/terms",
      "/developers",
      "/api-docs",
      "/unknown-route",
    ])("maps %s → general", (path) => {
      expect(detectChatContext(path)).toBe("general");
    });
  });

  describe("edge cases", () => {
    it("is case-insensitive", () => {
      expect(detectChatContext("/MY-TRIPS")).toBe("support");
      expect(detectChatContext("/Rentals")).toBe("rentals");
    });

    it("does not match partial path segments", () => {
      // /rentals-promo is NOT /rentals; should fall through to general
      expect(detectChatContext("/rentals-promo")).toBe("general");
      // /accountant is NOT /account
      expect(detectChatContext("/accountant")).toBe("general");
    });
  });
});
