import type { ChatContext } from "@/types/chat";

// Route prefixes that map to each RAVIO chat context when no explicit context
// is supplied by the caller. Order: check longer prefixes first via the
// function below; this list is for readability only.
//
// Phase 22 C2 (#406) — DEC-036. Anticipates user flow per memory rule
// "Rooted in Simplicity": users who are mid-account/booking ask support
// questions; users browsing ask discovery questions.

const SUPPORT_PREFIXES = [
  "/my-trips",
  "/my-bookings",
  "/my-bids",
  "/account",
  "/owner-dashboard",
  "/settings",
  "/disputes",
  "/messages",
  "/notifications",
  "/checkin",
  "/checkout",
  "/booking-success",
  "/welcome",
  "/pending-approval",
  "/subscription-success",
];

const RENTALS_PREFIXES = [
  "/rentals",
  "/property",
  "/destinations",
  "/tools",
  "/calculator",
  "/rav-deals",
];

const BIDDING_PREFIXES = ["/marketplace", "/bidding"];

function hasPrefix(pathname: string, prefixes: string[]): boolean {
  const normalised = pathname.toLowerCase();
  return prefixes.some(
    (p) => normalised === p || normalised.startsWith(p + "/") || normalised.startsWith(p + "?"),
  );
}

/**
 * Derive the default RAVIO chat context for a given route pathname.
 * Callers with semantically-owned contexts (e.g. PropertyDetail explicitly
 * wants "property-detail") should continue to pass their context prop;
 * this utility is the fallback for pages that don't care to specify.
 */
export function detectChatContext(pathname: string): ChatContext {
  if (hasPrefix(pathname, SUPPORT_PREFIXES)) return "support";
  if (hasPrefix(pathname, BIDDING_PREFIXES)) return "bidding";
  if (hasPrefix(pathname, RENTALS_PREFIXES)) return "rentals";
  return "general";
}
