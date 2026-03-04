import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

/**
 * Idle Listing Alerts — Cron-triggered edge function
 *
 * Sends email alerts to owners whose active listings have:
 * - No bids (bid_count = 0)
 * - Check-in within 60 or 30 days
 * - Not already been alerted at that threshold
 * - Not opted out of alerts
 *
 * Schedule: Daily via Supabase cron or external cron service
 * Auth: Service role key (no user auth required)
 * Rate limit: Max 50 emails per invocation
 */

const MAX_EMAILS_PER_RUN = 50;

const handler = async (req: Request): Promise<Response> => {
  // Only allow POST (cron invocation) or OPTIONS (CORS)
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
    const in60d = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Fetch active listings within 60 days with 0 bids, not opted out
    const { data: listings, error } = await supabase
      .from("listings")
      .select(`
        id,
        check_in_date,
        nightly_rate,
        final_price,
        bid_count,
        idle_alert_60d_sent_at,
        idle_alert_30d_sent_at,
        idle_alert_opt_out,
        owner_id,
        property:properties!listings_property_id_fkey(
          resort:resorts!properties_resort_id_fkey(resort_name)
        )
      `)
      .eq("status", "active")
      .eq("bid_count", 0)
      .eq("idle_alert_opt_out", false)
      .gte("check_in_date", now.toISOString().split("T")[0])
      .lte("check_in_date", in60d.toISOString().split("T")[0]);

    if (error) {
      console.error("Failed to fetch listings:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (!listings || listings.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No idle listings found" }), {
        status: 200,
      });
    }

    let emailsSent = 0;
    const results: Array<{ listing_id: string; level: string; success: boolean }> = [];

    for (const listing of listings) {
      if (emailsSent >= MAX_EMAILS_PER_RUN) break;

      const checkIn = new Date(listing.check_in_date);
      const daysUntil = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let alertLevel: "30d" | "60d" | null = null;

      if (daysUntil <= 30 && !listing.idle_alert_30d_sent_at) {
        alertLevel = "30d";
      } else if (daysUntil <= 60 && !listing.idle_alert_60d_sent_at) {
        alertLevel = "60d";
      }

      if (!alertLevel) continue;

      // Fetch owner email
      const { data: owner } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", listing.owner_id)
        .single();

      if (!owner?.email) continue;

      const prop = listing.property as { resort?: { resort_name?: string } } | undefined;
      const resortName = prop?.resort?.resort_name || "Your listing";

      const daysLabel = alertLevel === "30d" ? "30 days" : "60 days";
      const isUrgent = alertLevel === "30d";

      const subject = isUrgent
        ? `⚠️ ${resortName} has no bookings — check-in is in ${daysLabel}`
        : `📋 ${resortName} needs attention — check-in is in ${daysLabel}`;

      const baseUrl = Deno.env.get("IS_DEV_ENVIRONMENT") === "true"
        ? "https://rentavacation.vercel.app"
        : "https://rent-a-vacation.com";

      const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1a1a2e;">Your listing needs attention</h2>
  <p>Hi ${owner.full_name?.split(" ")[0] || "there"},</p>
  <p>Your listing <strong>${resortName}</strong> has no bookings yet, and check-in is only <strong>${daysLabel} away</strong>.</p>

  <h3 style="color: #1a1a2e;">Suggested actions:</h3>
  <ul>
    <li><strong>Lower your price</strong> — Currently $${listing.nightly_rate}/night.</li>
    <li><strong>Enable bidding</strong> — Let travelers make offers.</li>
    <li><strong>Share your listing</strong> — Increase visibility.</li>
  </ul>

  <div style="margin: 24px 0;">
    <a href="${baseUrl}/property/${listing.id}" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Your Listing</a>
  </div>

  <p style="color: #666; font-size: 12px;">
    You're receiving this because you have an active listing on Rent-A-Vacation.
    <a href="${baseUrl}/owner-dashboard?tab=my-listings">Manage alert preferences</a>
  </p>
</div>`;

      // Send email
      if (resend) {
        try {
          await resend.emails.send({
            from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
            to: [owner.email],
            subject,
            html,
          });
        } catch (emailError) {
          console.error(`Failed to send email for listing ${listing.id}:`, emailError);
          results.push({ listing_id: listing.id, level: alertLevel, success: false });
          continue;
        }
      }

      // Update listing alert timestamp
      const updateCol = alertLevel === "30d" ? "idle_alert_30d_sent_at" : "idle_alert_60d_sent_at";
      await supabase
        .from("listings")
        .update({ [updateCol]: now.toISOString() })
        .eq("id", listing.id);

      // Insert notification
      await supabase.from("notifications").insert({
        user_id: listing.owner_id,
        type: "listing_idle_alert",
        title: isUrgent ? "Urgent: Listing Needs Attention" : "Listing Reminder",
        message: `${resortName} has no bookings and check-in is in ${daysLabel}. Consider reducing the price or enabling bidding.`,
        listing_id: listing.id,
      });

      emailsSent++;
      results.push({ listing_id: listing.id, level: alertLevel, success: true });
    }

    console.log(`Idle listing alerts: ${emailsSent} emails sent out of ${listings.length} idle listings`);

    return new Response(
      JSON.stringify({ sent: emailsSent, total_idle: listings.length, results }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Idle listing alerts error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};

serve(handler);
