/**
 * Disclaimer registry mirror for edge functions.
 *
 * IMPORTANT: Keep in sync with `src/lib/disclaimers/registry.ts`.
 * The frontend cannot import Deno modules and edge functions cannot import the @/ alias,
 * so a manual mirror is maintained. A regression test in
 * `src/lib/disclaimers/registry.test.ts` reads both files and asserts the disclaimer
 * text strings are byte-identical — drift will fail CI.
 *
 * @see src/lib/disclaimers/registry.ts — source of truth (TypeScript with type safety)
 * @see docs/legal/_extracted_legal_dossier.txt § VIII (lines 727–799) — verbatim source
 */

export const DISCLAIMERS_TEXT: Readonly<Record<string, string>> = {
  "8.1": "Rent-A-Vacation is a technology platform that connects timeshare owners with prospective renters. Rent-A-Vacation is not a party to any rental agreement between Hosts and Guests, does not own or manage any listed property, and is not responsible for the accuracy of Host-provided listing information. All rental agreements are entered into directly between Hosts and Guests.",
  "8.2": "Rent-A-Vacation facilitates the rental of timeshare periods only. This platform does not facilitate, broker, or assist in the purchase, sale, transfer, or resale of timeshare interests. Rent-A-Vacation is not a timeshare developer, reseller, or exit company.",
  "8.3": "Rent-A-Vacation does not act as a real estate broker, real estate agent, travel agent, or fiduciary representative of any Host or Guest. No employee or representative of Rent-A-Vacation is authorized to provide legal, tax, financial, or real estate advice. Users are encouraged to consult qualified professionals before entering into any rental agreement.",
  "8.4": "Applicable transient occupancy taxes, hotel taxes, and/or sales taxes are included in the total price displayed at checkout. Tax rates are calculated based on the location of the rental property and applicable state and local law. Rent-A-Vacation collects and remits applicable taxes on behalf of Hosts in jurisdictions where required by law.",
  "8.5": "Cancellation and refund policies vary by listing and are set by individual Hosts. The applicable policy is displayed on each listing page and must be reviewed before booking. In the event of a Host cancellation within 30 days of check-in, Guests will receive a full refund within 5 business days. Rent-A-Vacation's platform fee is non-refundable except in cases of Host cancellation or verified fraud.",
  "8.6": "To the maximum extent permitted by applicable law, Rent-A-Vacation's total liability to any user for any claim arising out of or relating to these Terms or the use of the platform shall not exceed the total platform fees paid by such user in the twelve (12) months preceding the claim. Rent-A-Vacation shall not be liable for any indirect, incidental, special, consequential, or punitive damages.",
  "8.7": "This listing is for the rental of a timeshare period only. The rental of timeshare periods is subject to Florida Statute Chapter 721. The property owner is responsible for ensuring that the rental complies with the terms of their timeshare agreement and applicable resort rules. Rent-A-Vacation is not a licensed timeshare resale broker under Florida Statute § 721.20.",
  "8.8": "Rental payments collected through the Rent-A-Vacation platform are processed by Stripe (the “Pay Safe” service), a licensed payment processor. Guest funds are held in a segregated account and are not commingled with Rent-A-Vacation operating funds. Funds are disbursed to Hosts upon completion of the check-in date, subject to the platform's cancellation and refund policy. Rent-A-Vacation does not act as an escrow agent.",
  trademark: "Hilton Grand Vacations®, Marriott Vacations Club®, Disney Vacation Club®, Wyndham Destinations®, Bluegreen Vacations®, Hyatt Residence Club®, Holiday Inn Club Vacations®, and WorldMark by Wyndham® are trademarks of their respective owners. Rent-A-Vacation, Inc. is an independent secondary marketplace and is not affiliated with, endorsed by, or sponsored by any of these brands.",
};

export const DISCLAIMERS_TITLE: Readonly<Record<string, string>> = {
  "8.1": "Marketplace Disclaimer",
  "8.2": "No Timeshare Sales Disclaimer",
  "8.3": "Non-Broker / Non-Agent Disclaimer",
  "8.4": "Tax Disclosure",
  "8.5": "Cancellation & Refund Policy",
  "8.6": "Limitation of Liability",
  "8.7": "Florida-Specific Disclosure",
  "8.8": "Escrow / Fund-Holding Notice",
  trademark: "Trademark / Affiliation Disclaimer",
};

/**
 * Render a disclaimer as plain HTML for inclusion in transactional emails.
 * Wrap the text in a styled paragraph that matches the existing email-template aesthetic.
 */
export function disclaimerHtml(id: string): string {
  const text = DISCLAIMERS_TEXT[id];
  const title = DISCLAIMERS_TITLE[id];
  if (!text) return "";
  return `<div style="margin: 24px 0; padding: 14px 18px; background: #f7fafc; border-left: 3px solid #0d6b5c; border-radius: 4px;">
    <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #0d6b5c; text-transform: uppercase; letter-spacing: 0.4px;">${title ?? "Disclaimer"}</p>
    <p style="margin: 0; font-size: 12px; color: #4a5568; line-height: 1.6;">${text}</p>
  </div>`;
}
