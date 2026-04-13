import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { buildEmailHtml, detailRow, infoBox } from "../_shared/email-template.ts";

/**
 * Price Drop Checker — Cron-triggered edge function (#283)
 *
 * Finds listings where nightly_rate dropped in the last 24 hours,
 * matches them against saved searches with notify_email=true,
 * and dispatches price drop notifications (in-app + email).
 *
 * Schedule: Daily via Supabase cron or external scheduler
 * Auth: Service role key (no user auth required)
 */

const MAX_NOTIFICATIONS_PER_RUN = 100;
const COOLDOWN_HOURS = 24; // Don't re-notify same saved search within this window

interface PriceDropListing {
  id: string;
  nightly_rate: number;
  previous_nightly_rate: number;
  price_changed_at: string;
  owner_id: string;
  check_in_date: string;
  check_out_date: string;
  property: {
    brand: string;
    resort_name: string;
    location: string;
    bedrooms: number;
    sleeps: number;
  };
}

interface SavedSearch {
  id: string;
  user_id: string;
  name: string | null;
  criteria: Record<string, string | undefined>;
  notify_email: boolean;
  last_notified_at: string | null;
}

function doesListingMatchCriteria(
  listing: PriceDropListing,
  criteria: Record<string, string | undefined>
): boolean {
  if (criteria.brandFilter && criteria.brandFilter !== "all") {
    if (listing.property.brand !== criteria.brandFilter) return false;
  }
  if (criteria.searchQuery?.trim()) {
    const q = criteria.searchQuery.toLowerCase();
    if (
      !listing.property.location.toLowerCase().includes(q) &&
      !listing.property.brand.replace(/_/g, " ").toLowerCase().includes(q) &&
      !listing.property.resort_name.toLowerCase().includes(q)
    ) {
      return false;
    }
  }
  if (criteria.minPrice && listing.nightly_rate < Number(criteria.minPrice)) return false;
  if (criteria.maxPrice && listing.nightly_rate > Number(criteria.maxPrice)) return false;
  if (criteria.minBedrooms && listing.property.bedrooms < Number(criteria.minBedrooms)) return false;
  if (criteria.minGuests && listing.property.sleeps < Number(criteria.minGuests)) return false;
  return true;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const resend = resendKey ? new Resend(resendKey) : null;

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // 1. Find listings with price drops in the last 24 hours
    const { data: droppedListings, error: listingsError } = await supabase
      .from("listings")
      .select(`
        id, nightly_rate, previous_nightly_rate, price_changed_at,
        owner_id, check_in_date, check_out_date,
        property:properties!listings_property_id_fkey(
          brand, resort_name, location, bedrooms, sleeps
        )
      `)
      .eq("status", "active")
      .gte("price_changed_at", oneDayAgo)
      .not("previous_nightly_rate", "is", null);

    if (listingsError) {
      console.error("Failed to fetch price-dropped listings:", listingsError);
      return new Response(JSON.stringify({ error: listingsError.message }), { status: 500 });
    }

    // Filter to actual drops (previous > current)
    const priceDrops = (droppedListings || []).filter(
      (l: PriceDropListing) => l.previous_nightly_rate > l.nightly_rate
    ) as PriceDropListing[];

    if (priceDrops.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, priceDrops: 0, message: "No price drops found" }),
        { status: 200 }
      );
    }

    // 2. Fetch saved searches with email notifications enabled
    const { data: savedSearches, error: searchError } = await supabase
      .from("saved_searches")
      .select("id, user_id, name, criteria, notify_email, last_notified_at")
      .eq("notify_email", true);

    if (searchError) {
      console.error("Failed to fetch saved searches:", searchError);
      return new Response(JSON.stringify({ error: searchError.message }), { status: 500 });
    }

    if (!savedSearches || savedSearches.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, priceDrops: priceDrops.length, message: "No saved searches with notifications" }),
        { status: 200 }
      );
    }

    // 3. Match and notify
    let notificationsSent = 0;
    const results: Array<{ search_id: string; listing_id: string; success: boolean }> = [];

    const baseUrl = Deno.env.get("IS_DEV_ENVIRONMENT") === "true"
      ? "https://rentavacation.vercel.app"
      : "https://rent-a-vacation.com";

    for (const listing of priceDrops) {
      if (notificationsSent >= MAX_NOTIFICATIONS_PER_RUN) break;

      const dropPct = Math.round(
        ((listing.previous_nightly_rate - listing.nightly_rate) / listing.previous_nightly_rate) * 100
      );

      for (const search of savedSearches as SavedSearch[]) {
        if (notificationsSent >= MAX_NOTIFICATIONS_PER_RUN) break;

        // Don't notify the listing owner about their own listing
        if (search.user_id === listing.owner_id) continue;

        // Cooldown check
        if (search.last_notified_at) {
          const lastNotified = new Date(search.last_notified_at);
          const hoursSince = (now.getTime() - lastNotified.getTime()) / (1000 * 60 * 60);
          if (hoursSince < COOLDOWN_HOURS) continue;
        }

        // Criteria match
        if (!doesListingMatchCriteria(listing, search.criteria)) continue;

        // Create in-app notification
        await supabase.from("notifications").insert({
          user_id: search.user_id,
          type: "price_drop",
          title: `Price dropped ${dropPct}% on a listing you're watching`,
          message: `${listing.property.resort_name} in ${listing.property.location} — now $${listing.nightly_rate}/night (was $${listing.previous_nightly_rate}/night)`,
          linked_entity_id: listing.id,
          linked_entity_type: "listing",
        });

        // Send email
        if (resend) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", search.user_id)
            .single();

          if (profile?.email) {
            const html = buildEmailHtml({
              recipientName: profile.full_name?.split(" ")[0] || undefined,
              heading: "Price Drop Alert",
              body: `
                <p>Great news! A listing matching your saved search just dropped in price.</p>
                ${detailRow("Resort", listing.property.resort_name)}
                ${detailRow("Location", listing.property.location)}
                ${detailRow("Was", `$${listing.previous_nightly_rate}/night`)}
                ${detailRow("Now", `<strong style="color: #0d6b5c;">$${listing.nightly_rate}/night</strong>`)}
                ${detailRow("Savings", `${dropPct}% off`)}
                ${detailRow("Dates", `${listing.check_in_date} → ${listing.check_out_date}`)}
                ${infoBox("Price drops don't last long — make a RAV Offer before someone else does!", "info")}
                <p style="font-size: 12px; color: #718096; margin-top: 20px;">
                  You're receiving this because you have a saved search with price alerts enabled.
                  <a href="${baseUrl}/my-trips?tab=saved-searches" style="color: #0d6b5c;">Manage your saved searches</a>
                </p>`,
              cta: { label: "View Listing", url: `${baseUrl}/property/${listing.id}` },
            });

            try {
              await resend.emails.send({
                from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
                to: profile.email,
                subject: `📉 Price dropped ${dropPct}% — ${listing.property.resort_name}`,
                html,
              });
              results.push({ search_id: search.id, listing_id: listing.id, success: true });
            } catch (emailError) {
              console.error(`Email failed for ${profile.email}:`, emailError);
              results.push({ search_id: search.id, listing_id: listing.id, success: false });
            }
          }
        }

        // Update last_notified_at
        await supabase
          .from("saved_searches")
          .update({ last_notified_at: now.toISOString() })
          .eq("id", search.id);

        notificationsSent++;
      }
    }

    return new Response(
      JSON.stringify({
        priceDrops: priceDrops.length,
        savedSearches: (savedSearches as SavedSearch[]).length,
        sent: notificationsSent,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Price drop checker error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500 }
    );
  }
};

serve(handler);
