/**
 * Central disclaimer registry — single source of truth for all RAV legal disclaimers.
 *
 * Verbatim text is sourced from *Legal Research Memorandum v3* (`Legal_Dossier_RentAVacation_v3.pdf`)
 * Section VIII, plus the trademark/affiliation disclaimer from the 2026-05-04 brand review (PR #479).
 *
 * Compliance Brief § 3.5 requires central management so a single text update propagates to all
 * locations. Components must read from this registry rather than hardcoding disclaimer text.
 *
 * If counsel revises a disclaimer, edit the `text`, bump the `version`, and update
 * `lastUpdated` / `reviewedBy` / `reviewedDate`. The mirror at
 * `supabase/functions/_shared/disclaimers.ts` must be updated in lock-step (a regression test
 * asserts they match).
 *
 * @see docs/legal/_extracted_legal_dossier.txt § VIII (lines 727–799) — verbatim source text
 * @see docs/legal/attorney-meeting-compliance-status.md — current compliance status
 * @see docs/legal/compliance-gap-analysis.md — implementation plan
 */

export type DisclaimerLocation =
  | "homepage"
  | "footer"
  | "header"
  | "listing-pages"
  | "tos"
  | "about-page"
  | "checkout"
  | "booking-confirmation"
  | "payment-flow"
  | "fl-listing-pages"
  | "fl-checkout"
  | "ca-listing-pages"
  | "ca-checkout";

export interface Disclaimer {
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly version: string;
  readonly lastUpdated: string; // ISO 8601 date
  readonly legalReviewRequired: boolean;
  readonly reviewedBy: string | null;
  readonly reviewedDate: string | null;
  readonly requiredLocations: readonly DisclaimerLocation[];
  readonly source: string;
}

export const DISCLAIMERS = {
  "8.1": {
    id: "8.1",
    title: "Marketplace Disclaimer",
    text: "Rent-A-Vacation is a technology platform that connects timeshare owners with prospective renters. Rent-A-Vacation is not a party to any rental agreement between Hosts and Guests, does not own or manage any listed property, and is not responsible for the accuracy of Host-provided listing information. All rental agreements are entered into directly between Hosts and Guests.",
    version: "1.0.0",
    lastUpdated: "2026-05-05",
    legalReviewRequired: true,
    reviewedBy: null,
    reviewedDate: null,
    requiredLocations: ["homepage", "footer", "listing-pages"],
    source: "Legal Dossier v3 § 8.1",
  },
  "8.2": {
    id: "8.2",
    title: "No Timeshare Sales Disclaimer",
    text: "Rent-A-Vacation facilitates the rental of timeshare periods only. This platform does not facilitate, broker, or assist in the purchase, sale, transfer, or resale of timeshare interests. Rent-A-Vacation is not a timeshare developer, reseller, or exit company.",
    version: "1.0.0",
    lastUpdated: "2026-05-05",
    legalReviewRequired: true,
    reviewedBy: null,
    reviewedDate: null,
    requiredLocations: ["homepage", "listing-pages", "header", "footer"],
    source: "Legal Dossier v3 § 8.2",
  },
  "8.3": {
    id: "8.3",
    title: "Non-Broker / Non-Agent Disclaimer",
    text: "Rent-A-Vacation does not act as a real estate broker, real estate agent, travel agent, or fiduciary representative of any Host or Guest. No employee or representative of Rent-A-Vacation is authorized to provide legal, tax, financial, or real estate advice. Users are encouraged to consult qualified professionals before entering into any rental agreement.",
    version: "1.0.0",
    lastUpdated: "2026-05-05",
    legalReviewRequired: true,
    reviewedBy: null,
    reviewedDate: null,
    requiredLocations: ["tos", "about-page"],
    source: "Legal Dossier v3 § 8.3",
  },
  "8.4": {
    id: "8.4",
    title: "Tax Disclosure",
    text: "Applicable transient occupancy taxes, hotel taxes, and/or sales taxes are included in the total price displayed at checkout. Tax rates are calculated based on the location of the rental property and applicable state and local law. Rent-A-Vacation collects and remits applicable taxes on behalf of Hosts in jurisdictions where required by law.",
    version: "1.0.0",
    lastUpdated: "2026-05-05",
    legalReviewRequired: true,
    reviewedBy: null,
    reviewedDate: null,
    requiredLocations: ["checkout", "booking-confirmation"],
    source: "Legal Dossier v3 § 8.4",
  },
  "8.5": {
    id: "8.5",
    title: "Cancellation & Refund Policy",
    text: "Cancellation and refund policies vary by listing and are set by individual Hosts. The applicable policy is displayed on each listing page and must be reviewed before booking. In the event of a Host cancellation within 30 days of check-in, Guests will receive a full refund within 5 business days. Rent-A-Vacation's platform fee is non-refundable except in cases of Host cancellation or verified fraud.",
    version: "1.0.0",
    lastUpdated: "2026-05-05",
    legalReviewRequired: true,
    reviewedBy: null,
    reviewedDate: null,
    requiredLocations: ["listing-pages", "checkout", "booking-confirmation"],
    source: "Legal Dossier v3 § 8.5",
  },
  "8.6": {
    id: "8.6",
    title: "Limitation of Liability",
    text: "To the maximum extent permitted by applicable law, Rent-A-Vacation's total liability to any user for any claim arising out of or relating to these Terms or the use of the platform shall not exceed the total platform fees paid by such user in the twelve (12) months preceding the claim. Rent-A-Vacation shall not be liable for any indirect, incidental, special, consequential, or punitive damages.",
    version: "1.0.0",
    lastUpdated: "2026-05-05",
    legalReviewRequired: true,
    reviewedBy: null,
    reviewedDate: null,
    requiredLocations: ["tos"],
    source: "Legal Dossier v3 § 8.6",
  },
  "8.7": {
    id: "8.7",
    title: "Florida-Specific Disclosure",
    text: "This listing is for the rental of a timeshare period only. The rental of timeshare periods is subject to Florida Statute Chapter 721. The property owner is responsible for ensuring that the rental complies with the terms of their timeshare agreement and applicable resort rules. Rent-A-Vacation is not a licensed timeshare resale broker under Florida Statute § 721.20.",
    version: "1.0.0",
    lastUpdated: "2026-05-05",
    legalReviewRequired: true,
    reviewedBy: null,
    reviewedDate: null,
    requiredLocations: ["fl-listing-pages", "fl-checkout"],
    source: "Legal Dossier v3 § 8.7",
  },
  "8.8": {
    id: "8.8",
    title: "Escrow / Fund-Holding Notice",
    // "[Payment Processor Name]" → "Stripe (the 'Pay Safe' service)" per founder direction —
    // names both the legal processor (Stripe) and the customer-facing brand (Pay Safe) so
    // counsel sees the architecture and consumers see the brand. Pay Safe is RAV's
    // customer-facing name for the Stripe-held escrow flow; RAV never holds funds in its
    // own bank account.
    text: "Rental payments collected through the Rent-A-Vacation platform are processed by Stripe (the “Pay Safe” service), a licensed payment processor. Guest funds are held in a segregated account and are not commingled with Rent-A-Vacation operating funds. Funds are disbursed to Hosts upon completion of the check-in date, subject to the platform's cancellation and refund policy. Rent-A-Vacation does not act as an escrow agent.",
    version: "1.0.0",
    lastUpdated: "2026-05-05",
    legalReviewRequired: true,
    reviewedBy: null,
    reviewedDate: null,
    requiredLocations: ["payment-flow", "checkout", "booking-confirmation"],
    source: "Legal Dossier v3 § 8.8 (with founder substitution: 'Stripe (the “Pay Safe” service)' for '[Payment Processor Name]')",
  },
  trademark: {
    id: "trademark",
    title: "Trademark / Affiliation Disclaimer",
    text: "Hilton Grand Vacations®, Marriott Vacations Club®, Disney Vacation Club®, Wyndham Destinations®, Bluegreen Vacations®, Hyatt Residence Club®, Holiday Inn Club Vacations®, and WorldMark by Wyndham® are trademarks of their respective owners. Rent-A-Vacation, Inc. is an independent secondary marketplace and is not affiliated with, endorsed by, or sponsored by any of these brands.",
    version: "1.0.0",
    lastUpdated: "2026-05-05",
    legalReviewRequired: true,
    reviewedBy: null,
    reviewedDate: null,
    requiredLocations: ["footer"],
    source: "RAV 2026-05-04 brand review (PR #479)",
  },
  // 8.7-CA — California-Specific Disclosure — INTENTIONALLY OMITTED.
  // Counsel question C10 (see docs/legal/attorney-meeting-compliance-status.md § 5) requests
  // verbatim CA text. The wiring in <StateSpecificDisclaimer /> already maps state="CA" to id
  // "8.7-CA"; when the entry is missing, the component renders nothing. Add the entry here
  // once counsel returns text — no other code change required.
} as const satisfies Record<string, Disclaimer>;

export type DisclaimerId = keyof typeof DISCLAIMERS;

/** Return the disclaimer record for a given id, or null if not present. */
export function getDisclaimer(id: string): Disclaimer | null {
  return (DISCLAIMERS as Record<string, Disclaimer>)[id] ?? null;
}

/** Return all disclaimers required at a given location. */
export function getDisclaimersForLocation(location: DisclaimerLocation): Disclaimer[] {
  return Object.values(DISCLAIMERS).filter((d) =>
    (d.requiredLocations as readonly DisclaimerLocation[]).includes(location),
  );
}

/** Map a 2-letter US state code to the disclaimer id for that state, if any. */
export const STATE_DISCLAIMER_MAP: Readonly<Record<string, string>> = {
  FL: "8.7",
  CA: "8.7-CA",
};
