/**
 * "No Timeshare Sales" listing validation.
 *
 * RAV facilitates timeshare *rentals* only. Listings that read like sale ads
 * (deed transfers, ownership transfers, "buy my timeshare", resale offers)
 * undermine the platform's marketplace-facilitator legal posture and pull RAV
 * into broker-licensing territory under FL § 721.11 and CA B&P § 11003.5.
 * This validator is the first line of defense — it scans owner-provided text
 * for sale-language phrases and returns the matched term so the UI can show
 * a helpful, specific error.
 *
 * Staff approval (proof_status workflow on `listings`) is the second line of
 * defense; nothing reaches renters until staff click Approve.
 *
 * @see docs/legal/_extracted_legal_dossier.txt § 2.3 — "No Timeshare Sales" designation
 * @see docs/legal/_extracted_compliance_brief.txt § 3.2 sub-requirement 1
 * @see GitHub issue #485
 */

/**
 * Phrases that indicate a sale, transfer, or resale rather than a rental.
 * Each phrase is matched case-insensitively as a substring (after NFKC
 * normalization + lowercasing). Adding terms here is the right way to harden
 * the filter — the test suite expects this list to be the single source of
 * truth.
 */
export const SALE_LANGUAGE_TERMS = [
  "for sale",
  "for-sale",
  "deed transfer",
  "transfer of deed",
  "transferring deed",
  "ownership transfer",
  "transfer of ownership",
  "transferring ownership",
  "buy my",
  "selling my timeshare",
  "sell my timeshare",
  "selling my points",
  "sell my points",
  "purchase my timeshare",
  "purchase my points",
  "resale",
] as const;

export type SaleLanguageCheckResult =
  | { ok: true }
  | { ok: false; term: string };

/**
 * Returns `{ ok: true }` if the text is clean, or `{ ok: false, term }` with
 * the first matched banned phrase. Empty / null / undefined input is OK.
 */
export function containsSaleLanguage(
  text: string | null | undefined,
): SaleLanguageCheckResult {
  if (!text) return { ok: true };
  // NFKC normalization collapses full-width / compatibility characters so a
  // user can't bypass the filter with e.g. wide-form `ｓａｌｅ`. We do not
  // attempt to normalize alternate dash characters (em / en) — staff review
  // is the backstop.
  const normalized = text.normalize("NFKC").toLowerCase();
  for (const term of SALE_LANGUAGE_TERMS) {
    if (normalized.includes(term)) {
      return { ok: false, term };
    }
  }
  return { ok: true };
}

export interface ListingTextFields {
  readonly title?: string | null;
  readonly resortName?: string | null;
  readonly location?: string | null;
  readonly description?: string | null;
}

export type ListingSaleLanguageResult =
  | { ok: true }
  | { ok: false; term: string; field: keyof ListingTextFields };

/**
 * Validate every owner-provided text field on a listing for sale language.
 * Returns the first field that contains a banned term so the UI can highlight
 * the right input.
 */
export function validateListingForSaleLanguage(
  fields: ListingTextFields,
): ListingSaleLanguageResult {
  const order: ReadonlyArray<keyof ListingTextFields> = [
    "title",
    "resortName",
    "location",
    "description",
  ];
  for (const field of order) {
    const text = fields[field];
    if (!text) continue;
    const normalized = text.normalize("NFKC").toLowerCase();
    for (const term of SALE_LANGUAGE_TERMS) {
      if (normalized.includes(term)) {
        return { ok: false, term, field };
      }
    }
  }
  return { ok: true };
}

/**
 * Type guard for ergonomic narrowing at call sites where TS does not narrow
 * the discriminated union automatically (some `tsconfig` settings block it).
 */
export function isListingSaleLanguageRejection(
  r: ListingSaleLanguageResult,
): r is { ok: false; term: string; field: keyof ListingTextFields } {
  return !r.ok;
}

/** Human-readable field label for use in user-facing error messages. */
export function saleLanguageFieldLabel(field: keyof ListingTextFields): string {
  switch (field) {
    case "title":
      return "title";
    case "resortName":
      return "resort name";
    case "location":
      return "location";
    case "description":
      return "description";
  }
}
