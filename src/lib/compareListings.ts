import type { ActiveListing } from "@/hooks/useListings";
import { calculateNights } from "@/lib/pricing";
import { CANCELLATION_POLICY_LABELS, type CancellationPolicy } from "@/types/database";

export interface ComparisonRow {
  label: string;
  values: string[];
  bestIndex: number | null; // null = no "best" (e.g. resort name)
}

// Policy ranking: flexible best (4), moderate (3), strict (2), super_strict worst (1)
const POLICY_RANK: Record<string, number> = {
  flexible: 4,
  moderate: 3,
  strict: 2,
  super_strict: 1,
};

function getDisplayName(listing: ActiveListing): string {
  const prop = listing.property;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (prop.resort?.resort_name && prop.unit_type) return `${(prop.unit_type as any).unit_type_name} at ${prop.resort.resort_name}`;
  return prop.resort?.resort_name || prop.resort_name;
}

function getLocation(listing: ActiveListing): string {
  const prop = listing.property;
  if (prop.resort?.location) return `${prop.resort.location.city}, ${prop.resort.location.state}`;
  return prop.location;
}

/**
 * Build comparison rows from a list of listings.
 */
export function buildComparisonRows(listings: ActiveListing[]): ComparisonRow[] {
  if (listings.length === 0) return [];

  const nightsArr = listings.map((l) => calculateNights(l.check_in_date, l.check_out_date));
  const pricePerNight = listings.map((l, i) =>
    l.nightly_rate || (nightsArr[i] > 0 ? Math.round(l.final_price / nightsArr[i]) : 0)
  );
  const totals = listings.map((l) => l.final_price);
  const bedrooms = listings.map((l) => l.property.bedrooms);
  const guests = listings.map((l) => l.property.sleeps);
  const policies = listings.map((l) => l.cancellation_policy);

  // Helper: index of min value
  const minIdx = (arr: number[]) => arr.indexOf(Math.min(...arr));
  // Helper: index of max value
  const maxIdx = (arr: number[]) => arr.indexOf(Math.max(...arr));

  return [
    {
      label: "Resort",
      values: listings.map(getDisplayName),
      bestIndex: null,
    },
    {
      label: "Location",
      values: listings.map(getLocation),
      bestIndex: null,
    },
    {
      label: "Check-in",
      values: listings.map((l) => new Date(l.check_in_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })),
      bestIndex: null,
    },
    {
      label: "Nights",
      values: nightsArr.map(String),
      bestIndex: maxIdx(nightsArr),
    },
    {
      label: "Price/Night",
      values: pricePerNight.map((p) => `$${p}`),
      bestIndex: minIdx(pricePerNight),
    },
    {
      label: "Total Price",
      values: totals.map((t) => `$${t.toLocaleString()}`),
      bestIndex: minIdx(totals),
    },
    {
      label: "Bedrooms",
      values: bedrooms.map((b) => (b === 0 ? "Studio" : String(b))),
      bestIndex: maxIdx(bedrooms),
    },
    {
      label: "Guests",
      values: guests.map(String),
      bestIndex: maxIdx(guests),
    },
    {
      label: "Cancellation",
      values: policies.map((p) => CANCELLATION_POLICY_LABELS[p as CancellationPolicy] || p),
      bestIndex: (() => {
        const ranks = policies.map((p) => POLICY_RANK[p] || 0);
        return maxIdx(ranks);
      })(),
    },
  ];
}
