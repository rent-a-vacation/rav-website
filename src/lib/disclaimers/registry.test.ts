// @vitest-environment jsdom
// @p0
/**
 * Tests for the central disclaimer registry.
 *
 * Verbatim text is sourced from Legal Dossier v3 § VIII; this test asserts each disclaimer's
 * text contains the load-bearing phrases counsel will check, and that the edge-function
 * mirror at `supabase/functions/_shared/disclaimers.ts` has not drifted from the source.
 *
 * @see docs/legal/_extracted_legal_dossier.txt § VIII
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  DISCLAIMERS,
  STATE_DISCLAIMER_MAP,
  getDisclaimer,
  getDisclaimersForLocation,
  type Disclaimer,
} from "./registry";

const ALL_IDS = Object.keys(DISCLAIMERS) as Array<keyof typeof DISCLAIMERS>;

describe("DISCLAIMERS registry shape", () => {
  it("includes the 8 mandated disclaimers (8.1–8.8) plus the trademark/affiliation disclaimer", () => {
    expect(Object.keys(DISCLAIMERS).sort()).toEqual(
      ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "8.8", "trademark"].sort(),
    );
  });

  it.each(ALL_IDS)("disclaimer %s has all required fields populated", (id) => {
    const d: Disclaimer = DISCLAIMERS[id];
    expect(d.id).toBe(id);
    expect(d.title.length).toBeGreaterThan(0);
    expect(d.text.length).toBeGreaterThan(40);
    expect(d.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(d.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof d.legalReviewRequired).toBe("boolean");
    expect(d.requiredLocations.length).toBeGreaterThan(0);
    expect(d.source.length).toBeGreaterThan(0);
  });

  it("has no disclaimer marked as counsel-reviewed yet (all flow through legal review first)", () => {
    for (const id of ALL_IDS) {
      const d = DISCLAIMERS[id];
      expect(
        d.legalReviewRequired,
        `disclaimer ${id} should have legalReviewRequired: true`,
      ).toBe(true);
      expect(d.reviewedBy, `disclaimer ${id} reviewedBy should be null`).toBeNull();
      expect(d.reviewedDate, `disclaimer ${id} reviewedDate should be null`).toBeNull();
    }
  });
});

describe("DISCLAIMERS verbatim text — load-bearing phrases", () => {
  it("8.1 Marketplace Disclaimer contains the marketplace/no-party/not-responsible-for-accuracy language", () => {
    const t = DISCLAIMERS["8.1"].text;
    expect(t).toMatch(/technology platform/);
    expect(t).toMatch(/not a party to any rental agreement/);
    expect(t).toMatch(/does not own or manage any listed property/);
    expect(t).toMatch(/not responsible for the accuracy of Host-provided/);
    expect(t).toMatch(/directly between Hosts and Guests/);
  });

  it("8.2 No Timeshare Sales Disclaimer contains the rental-only / no-sales / not-an-exit-company language", () => {
    const t = DISCLAIMERS["8.2"].text;
    expect(t).toMatch(/rental of timeshare periods only/);
    expect(t).toMatch(/does not facilitate, broker, or assist in the purchase, sale, transfer, or resale/);
    expect(t).toMatch(/not a timeshare developer, reseller, or exit company/);
  });

  it("8.3 Non-Broker / Non-Agent Disclaimer contains the broker/agent/travel-agent/fiduciary disclaimer", () => {
    const t = DISCLAIMERS["8.3"].text;
    expect(t).toMatch(/does not act as a real estate broker, real estate agent, travel agent, or fiduciary/);
    expect(t).toMatch(/No employee or representative of Rent-A-Vacation is authorized to provide legal, tax, financial, or real estate advice/);
    expect(t).toMatch(/consult qualified professionals/);
  });

  it("8.4 Tax Disclosure contains the included-in-total-price and on-behalf-of-Hosts language", () => {
    const t = DISCLAIMERS["8.4"].text;
    expect(t).toMatch(/transient occupancy taxes, hotel taxes, and\/or sales taxes/);
    expect(t).toMatch(/included in the total price displayed at checkout/);
    expect(t).toMatch(/collects and remits applicable taxes on behalf of Hosts/);
  });

  it("8.5 Cancellation & Refund Policy contains the 30-day Host-cancellation, 5-business-day refund, and platform-fee-non-refundable language", () => {
    const t = DISCLAIMERS["8.5"].text;
    expect(t).toMatch(/Cancellation and refund policies vary by listing/);
    expect(t).toMatch(/Host cancellation within 30 days of check-in/);
    expect(t).toMatch(/full refund within 5 business days/);
    expect(t).toMatch(/platform fee is non-refundable except in cases of Host cancellation or verified fraud/);
  });

  it("8.6 Limitation of Liability contains the 12-month-fee cap and exclusion of consequential damages", () => {
    const t = DISCLAIMERS["8.6"].text;
    expect(t).toMatch(/maximum extent permitted by applicable law/);
    expect(t).toMatch(/total platform fees paid by such user in the twelve \(12\) months preceding/);
    expect(t).toMatch(/indirect, incidental, special, consequential, or punitive damages/);
  });

  it("8.7 Florida-Specific Disclosure cites Florida Statute Chapter 721 and § 721.20", () => {
    const t = DISCLAIMERS["8.7"].text;
    expect(t).toMatch(/Florida Statute Chapter 721/);
    expect(t).toMatch(/Florida Statute § 721\.20/);
    expect(t).toMatch(/not a licensed timeshare resale broker/);
  });

  it("8.8 Escrow / Fund-Holding Notice names BOTH Stripe and the 'Pay Safe' service, and disclaims escrow-agent status", () => {
    const t = DISCLAIMERS["8.8"].text;
    expect(t, "must name Stripe as the licensed processor").toMatch(/Stripe/);
    expect(t, "must name the customer-facing 'Pay Safe' brand").toMatch(/Pay Safe/);
    expect(t).toMatch(/licensed payment processor/);
    expect(t).toMatch(/segregated account/);
    expect(t).toMatch(/not commingled with Rent-A-Vacation operating funds/);
    expect(t).toMatch(/disbursed to Hosts upon completion of the check-in date/);
    expect(t, "must explicitly disclaim escrow-agent status").toMatch(/does not act as an escrow agent/);
  });

  it("trademark/affiliation disclaimer names all 8 vacation-club brands and asserts independence", () => {
    const t = DISCLAIMERS.trademark.text;
    const brands = [
      "Hilton Grand Vacations",
      "Marriott Vacations Club",
      "Disney Vacation Club",
      "Wyndham Destinations",
      "Bluegreen Vacations",
      "Hyatt Residence Club",
      "Holiday Inn Club Vacations",
      "WorldMark by Wyndham",
    ];
    for (const brand of brands) {
      expect(t, `must name brand: ${brand}`).toContain(brand);
    }
    expect(t).toMatch(/independent secondary marketplace/);
    expect(t).toMatch(/not affiliated with, endorsed by, or sponsored by/);
  });
});

describe("DISCLAIMERS required locations", () => {
  it("8.1 covers homepage / footer / listing-pages", () => {
    expect(new Set(DISCLAIMERS["8.1"].requiredLocations)).toEqual(
      new Set(["homepage", "footer", "listing-pages"]),
    );
  });

  it("8.7 is geo-targeted to FL listing-pages + FL checkout", () => {
    expect(new Set(DISCLAIMERS["8.7"].requiredLocations)).toEqual(
      new Set(["fl-listing-pages", "fl-checkout"]),
    );
  });

  it("8.8 covers payment-flow + checkout + booking-confirmation", () => {
    expect(new Set(DISCLAIMERS["8.8"].requiredLocations)).toEqual(
      new Set(["payment-flow", "checkout", "booking-confirmation"]),
    );
  });
});

describe("registry helpers", () => {
  it("getDisclaimer returns the record for a known id", () => {
    expect(getDisclaimer("8.1")?.title).toBe("Marketplace Disclaimer");
  });

  it("getDisclaimer returns null for an unknown id", () => {
    expect(getDisclaimer("nonexistent")).toBeNull();
  });

  it("getDisclaimersForLocation('checkout') returns 8.4, 8.5, 8.8", () => {
    const ids = getDisclaimersForLocation("checkout").map((d) => d.id).sort();
    expect(ids).toEqual(["8.4", "8.5", "8.8"]);
  });

  it("getDisclaimersForLocation('tos') returns 8.3 and 8.6", () => {
    const ids = getDisclaimersForLocation("tos").map((d) => d.id).sort();
    expect(ids).toEqual(["8.3", "8.6"]);
  });
});

describe("STATE_DISCLAIMER_MAP", () => {
  it("maps FL to 8.7 (the registered FL disclosure)", () => {
    expect(STATE_DISCLAIMER_MAP.FL).toBe("8.7");
  });

  it("maps CA to 8.7-CA (placeholder until counsel returns text — entry intentionally absent from DISCLAIMERS)", () => {
    expect(STATE_DISCLAIMER_MAP.CA).toBe("8.7-CA");
    // The map points at "8.7-CA" but the registry intentionally omits that entry until
    // counsel question C10 lands. <StateSpecificDisclaimer /> handles the absence gracefully.
    expect((DISCLAIMERS as Record<string, unknown>)["8.7-CA"]).toBeUndefined();
  });
});

describe("edge-function mirror — drift detection", () => {
  /**
   * The edge-function mirror at supabase/functions/_shared/disclaimers.ts is a manual
   * copy because the frontend cannot import Deno modules and edge functions cannot
   * import the @/ alias. This test extracts the disclaimer text strings from the mirror
   * file and asserts they match the source registry byte-for-byte. Drift fails CI,
   * which surfaces the need to update both files in lock-step.
   */
  const mirrorPath = resolve(
    __dirname,
    "../../../supabase/functions/_shared/disclaimers.ts",
  );

  it("mirror file exists and is readable", () => {
    expect(() => readFileSync(mirrorPath, "utf-8")).not.toThrow();
  });

  it.each(ALL_IDS)("mirror text for %s matches the registry source byte-for-byte", (id) => {
    const mirrorSource = readFileSync(mirrorPath, "utf-8");
    const registryText = DISCLAIMERS[id].text;
    expect(
      mirrorSource,
      `expected mirror to contain the verbatim text for ${id}; update supabase/functions/_shared/disclaimers.ts in lock-step with src/lib/disclaimers/registry.ts`,
    ).toContain(registryText);
  });
});
