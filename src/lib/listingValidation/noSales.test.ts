// @vitest-environment jsdom
// @p0
/**
 * Tests for the "No Timeshare Sales" listing validator. Compliance-critical:
 * a regression here lets sale-language listings reach the platform.
 *
 * @see GitHub issue #485
 * @see docs/legal/compliance-gap-analysis.md item I-5
 */
import { describe, it, expect } from "vitest";
import {
  SALE_LANGUAGE_TERMS,
  containsSaleLanguage,
  saleLanguageFieldLabel,
  validateListingForSaleLanguage,
} from "./noSales";

describe("containsSaleLanguage — positive cases (must reject)", () => {
  const cases: Array<[label: string, text: string, expectedTerm: string]> = [
    ["lowercase 'for sale'", "This timeshare is for sale", "for sale"],
    ["uppercase 'FOR SALE'", "FOR SALE: vacation week", "for sale"],
    ["mixed case 'For Sale'", "Available For Sale immediately", "for sale"],
    ["hyphenated 'for-sale'", "for-sale by owner", "for-sale"],
    ["'deed transfer'", "Looking for deed transfer arrangement", "deed transfer"],
    ["'transfer of deed'", "Transfer of deed available upon agreement", "transfer of deed"],
    ["'transferring deed'", "We will be transferring deed at closing", "transferring deed"],
    ["'ownership transfer'", "Ownership transfer included with sale", "ownership transfer"],
    ["'transfer of ownership'", "Full transfer of ownership offered", "transfer of ownership"],
    ["'buy my'", "Buy my timeshare today", "buy my"],
    ["'selling my timeshare'", "I'm selling my timeshare points", "selling my timeshare"],
    ["'sell my timeshare'", "Sell my timeshare for any price", "sell my timeshare"],
    ["'sell my points'", "I'd like to sell my points fast", "sell my points"],
    ["'selling my points'", "Selling my points at a discount", "selling my points"],
    ["'purchase my timeshare'", "Purchase my timeshare and save", "purchase my timeshare"],
    ["'resale'", "Resale opportunity!", "resale"],
    ["full-width unicode 'sale'", "ｆｏｒ ｓａｌｅ", "for sale"], // NFKC normalization
  ];

  for (const [label, text, expectedTerm] of cases) {
    it(`rejects: ${label}`, () => {
      expect(containsSaleLanguage(text)).toEqual({ ok: false, term: expectedTerm });
    });
  }
});

describe("containsSaleLanguage — negative cases (must accept)", () => {
  const cases: Array<[label: string, text: string]> = [
    ["typical rental description", "Beautiful 2BR vacation rental at the resort"],
    ["mentions vacation club brand", "Wonderful Marriott Vacation Club week available"],
    ["available 'for rent'", "Available for rent during summer 2026"],
    ["mentions 'bought' (not 'buy my')", "We bought this and now want to share with travelers"],
    ["'selling out quickly' (not 'selling my')", "These dates sell quickly — book now"],
    ["'family-owned' (not 'ownership transfer')", "Family-owned property since 2010"],
    ["'deed' alone is allowed (e.g., DVC deeded contract)", "Disney Vacation Club deed property at Aulani"],
    ["'owned' (not 'ownership transfer')", "Privately owned by responsible host"],
    ["'transfer' alone (e.g., airport transfer)", "Free airport transfer included"],
    ["empty string", ""],
    ["only whitespace", "   "],
    ["typical description with rental terminology", "Two-bedroom suite available for nightly rental during peak season"],
    ["mentions 'sales tax'", "Includes applicable sales tax at checkout"],
    ["typical title", "Marriott's Grande Vista — Lockoff 2BR — Apr 18-25"],
  ];

  for (const [label, text] of cases) {
    it(`accepts: ${label}`, () => {
      expect(containsSaleLanguage(text).ok).toBe(true);
    });
  }

  it("accepts null", () => {
    expect(containsSaleLanguage(null).ok).toBe(true);
  });

  it("accepts undefined", () => {
    expect(containsSaleLanguage(undefined).ok).toBe(true);
  });
});

describe("validateListingForSaleLanguage", () => {
  it("returns ok when all fields are clean", () => {
    const result = validateListingForSaleLanguage({
      title: "Marriott Aruba Surf Club",
      resortName: "Marriott Aruba Surf Club",
      location: "Palm Beach, Aruba",
      description: "Beautiful 2BR/2BA villa at the resort",
    });
    expect(result.ok).toBe(true);
  });

  it("flags the title field when title contains sale language", () => {
    const result = validateListingForSaleLanguage({
      title: "FOR SALE: Marriott Vacation Club",
      description: "Two bedroom unit",
    });
    expect(result).toEqual({ ok: false, term: "for sale", field: "title" });
  });

  it("flags the description field when only description contains sale language", () => {
    const result = validateListingForSaleLanguage({
      title: "Beautiful resort week",
      description: "Buy my timeshare today, asking $5000",
    });
    expect(result).toEqual({ ok: false, term: "buy my", field: "description" });
  });

  it("flags resortName when only resort name contains sale language", () => {
    const result = validateListingForSaleLanguage({
      resortName: "Resale Brokers Inc.",
      description: "Family resort week available",
    });
    expect(result).toEqual({ ok: false, term: "resale", field: "resortName" });
  });

  it("flags location when only location contains sale language", () => {
    const result = validateListingForSaleLanguage({
      title: "Beautiful unit",
      location: "Resale district, Orlando",
    });
    expect(result).toEqual({ ok: false, term: "resale", field: "location" });
  });

  it("returns the FIRST matching field, not the last", () => {
    // Title is checked before description, so a banned term in title wins.
    const result = validateListingForSaleLanguage({
      title: "for sale",
      description: "buy my timeshare",
    });
    expect(result).toEqual({ ok: false, term: "for sale", field: "title" });
  });

  it("handles missing fields gracefully (only validates provided ones)", () => {
    expect(validateListingForSaleLanguage({}).ok).toBe(true);
    expect(validateListingForSaleLanguage({ title: undefined, description: null }).ok).toBe(true);
  });
});

describe("SALE_LANGUAGE_TERMS sanity", () => {
  it("contains the explicit terms required by the compliance brief", () => {
    // The compliance brief Section 3.2 sub-requirement 1 enumerates these:
    const required = [
      "for sale",
      "for-sale",
      "deed transfer",
      "ownership transfer",
      "buy my",
      "selling my timeshare",
      "sell my points",
      "resale",
    ];
    for (const term of required) {
      expect(SALE_LANGUAGE_TERMS).toContain(term);
    }
  });

  it("every term is lowercase (normalization invariant)", () => {
    for (const term of SALE_LANGUAGE_TERMS) {
      expect(term).toBe(term.toLowerCase());
    }
  });
});

describe("saleLanguageFieldLabel", () => {
  it("returns human-readable labels for each field", () => {
    expect(saleLanguageFieldLabel("title")).toBe("title");
    expect(saleLanguageFieldLabel("resortName")).toBe("resort name");
    expect(saleLanguageFieldLabel("location")).toBe("location");
    expect(saleLanguageFieldLabel("description")).toBe("description");
  });
});
