import { describe, it, expect } from "vitest";

// Test the redirect mapping logic extracted from OwnerDashboard
const TAB_REDIRECTS: Record<string, string> = {
  overview: "dashboard",
  properties: "my-listings",
  listings: "my-listings",
  proposals: "my-listings",
  bookings: "bookings-earnings",
  confirmations: "bookings-earnings",
  earnings: "bookings-earnings",
  payouts: "bookings-earnings",
  portfolio: "dashboard",
  verification: "account",
  membership: "account",
};

const VALID_TABS = new Set(["dashboard", "my-listings", "bookings-earnings", "account"]);

function resolveTab(rawTab: string): string {
  return VALID_TABS.has(rawTab) ? rawTab : (TAB_REDIRECTS[rawTab] || "dashboard");
}

describe("OwnerDashboard tab redirects", () => {
  it("keeps valid new tab values", () => {
    expect(resolveTab("dashboard")).toBe("dashboard");
    expect(resolveTab("my-listings")).toBe("my-listings");
    expect(resolveTab("bookings-earnings")).toBe("bookings-earnings");
    expect(resolveTab("account")).toBe("account");
  });

  it("redirects old overview tab to dashboard", () => {
    expect(resolveTab("overview")).toBe("dashboard");
  });

  it("redirects old properties/listings/proposals to my-listings", () => {
    expect(resolveTab("properties")).toBe("my-listings");
    expect(resolveTab("listings")).toBe("my-listings");
    expect(resolveTab("proposals")).toBe("my-listings");
  });

  it("redirects old booking-related tabs to bookings-earnings", () => {
    expect(resolveTab("bookings")).toBe("bookings-earnings");
    expect(resolveTab("confirmations")).toBe("bookings-earnings");
    expect(resolveTab("earnings")).toBe("bookings-earnings");
    expect(resolveTab("payouts")).toBe("bookings-earnings");
  });

  it("redirects old portfolio to dashboard", () => {
    expect(resolveTab("portfolio")).toBe("dashboard");
  });

  it("redirects old verification/membership to account", () => {
    expect(resolveTab("verification")).toBe("account");
    expect(resolveTab("membership")).toBe("account");
  });

  it("defaults unknown tabs to dashboard", () => {
    expect(resolveTab("nonexistent")).toBe("dashboard");
    expect(resolveTab("")).toBe("dashboard");
  });
});
