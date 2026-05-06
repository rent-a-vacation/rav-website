// @vitest-environment jsdom
// @p0
/**
 * Placement audit — grep-style test that asserts each legally-required placement of
 * <DisclaimerBlock /> is wired into its target file. Page-level integration tests for
 * Checkout / BookingSuccess / PropertyDetail / Index would require extensive mocking of
 * auth / supabase / hooks for marginal value — this test instead reads the source files
 * directly and asserts the DisclaimerBlock invocations exist with the correct ids. If a
 * future refactor accidentally removes a placement, CI fails before the change ships.
 *
 * @see docs/legal/attorney-meeting-compliance-status.md
 * @see docs/legal/compliance-gap-analysis.md item I-1
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf-8");

interface Placement {
  file: string;
  required: ReadonlyArray<string>;
  notes?: string;
}

const PLACEMENTS: ReadonlyArray<Placement> = [
  {
    file: "src/components/Footer.tsx",
    required: [
      `import { DisclaimerBlock }`,
      `id="trademark"`,
      `id="8.1"`,
      `id="8.2"`,
    ],
    notes: "Footer must contain trademark + 8.1 + 8.2 (the trademark inline anti-pattern was migrated to registry by PR following audit).",
  },
  {
    file: "src/pages/Terms.tsx",
    required: [
      `id="8.3"`,
      `id="8.6"`,
    ],
    notes: "Terms of Service must contain 8.3 (Non-Broker / Non-Agent) and 8.6 (Limitation of Liability — verbatim 12-month-fee-cap text).",
  },
  {
    file: "src/pages/About.tsx",
    required: [
      `id="8.3"`,
    ],
    notes: "About page must render Disclaimer 8.3 (Non-Broker / Non-Agent).",
  },
  {
    file: "src/pages/Index.tsx",
    required: [
      `id="8.1"`,
      `id="8.2"`,
    ],
    notes: "Homepage must display Marketplace Disclaimer (8.1) and No Timeshare Sales (8.2).",
  },
  {
    file: "src/pages/Checkout.tsx",
    required: [
      `id="8.4"`,
      `id="8.5"`,
      `id="8.8"`,
      `<StateSpecificDisclaimer`,
    ],
    notes: "Checkout must display Tax (8.4), Cancellation (8.5), Escrow/Pay Safe (8.8) verbatim, plus state-specific disclosure for FL/CA.",
  },
  {
    file: "src/pages/BookingSuccess.tsx",
    required: [
      `id="8.4"`,
      `id="8.5"`,
      `id="8.8"`,
    ],
    notes: "Booking confirmation page must display Tax (8.4), Cancellation (8.5), Escrow (8.8).",
  },
  {
    file: "src/pages/PropertyDetail.tsx",
    required: [
      `id="8.1"`,
      `id="8.2"`,
      `id="8.5"`,
      `<StateSpecificDisclaimer`,
    ],
    notes: "Listing page must display Marketplace (8.1), No Sales (8.2), Cancellation (8.5), and state-specific disclosure for FL/CA.",
  },
  {
    file: "supabase/functions/verify-booking-payment/handler.ts",
    required: [
      `disclaimerHtml("8.4")`,
      `disclaimerHtml("8.5")`,
      `disclaimerHtml("8.8")`,
    ],
    notes: "Booking confirmation email must include verbatim Tax (8.4), Cancellation (8.5), Escrow (8.8) via the edge-function mirror.",
  },
  {
    file: "src/pages/ListProperty.tsx",
    required: [
      `validateListingForSaleLanguage`,
      `saleLanguageFieldLabel`,
      // #486 — state captured from selected resort and persisted on listing insert
      `setState((loc?.state || "").toUpperCase())`,
      `state: state ? state.toUpperCase() : null`,
    ],
    notes: "Listing creation must call validateListingForSaleLanguage (#485) and persist 2-letter US state code (#486) on insert.",
  },
  {
    file: "src/pages/PropertyDetail.tsx",
    required: [
      `propertyState={listing?.state ?? resort?.location?.state}`,
    ],
    notes: "PropertyDetail must prefer the denormalized listing.state (Migration 074) and fall back to resort.location.state for legacy listings.",
  },
  {
    file: "src/pages/Checkout.tsx",
    required: [
      `propertyState={listing?.state ?? resort?.location?.state}`,
    ],
    notes: "Checkout must prefer the denormalized listing.state (Migration 074) and fall back to resort.location.state.",
  },
];

describe("Disclaimer placement audit — required <DisclaimerBlock /> usages per page", () => {
  for (const placement of PLACEMENTS) {
    describe(placement.file, () => {
      const source = read(placement.file);
      for (const required of placement.required) {
        it(`contains required marker: ${required.replace(/\n\s*/g, " ⏎ ")}`, () => {
          expect(
            source,
            `expected ${placement.file} to contain "${required}". ${placement.notes ?? ""}`,
          ).toContain(required);
        });
      }
    });
  }
});
