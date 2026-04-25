// Core logic for create-booking-checkout. Extracted from index.ts for #371
// so it can be unit-tested in Vitest with injected Stripe + Supabase mocks.
//
// `index.ts` stays as a 5-line Deno.serve wrapper that calls handler() with
// real production deps. This file imports nothing from `https://esm.sh/...`
// or `npm:...` so Vitest can resolve it.
//
// The narrow `SupabaseLike` / `StripeLike` shapes here are NOT a refactor of
// the SDK types — they're the smallest contract the handler needs, which is
// also the smallest contract a mock has to satisfy.

import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-BOOKING-CHECKOUT] ${step}${detailsStr}`);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseLike = any;

export interface StripeLike {
  customers: {
    list: (args: { email: string; limit?: number }) => Promise<{ data: Array<{ id: string }> }>;
  };
  checkout: {
    sessions: {
      create: (args: Record<string, unknown>) => Promise<{ id: string; url: string | null }>;
    };
  };
}

export interface Deps {
  supabase: SupabaseLike;
  stripe: StripeLike;
  env: Record<string, string | undefined>;
}

export async function handler(req: Request, deps: Deps): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { supabase, stripe, env } = deps;

  try {
    logStep("Function started");

    if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const rateCheck = await checkRateLimit(supabase, user.id, RATE_LIMITS.CHECKOUT);
    if (!rateCheck.allowed) {
      logStep("Rate limited", { userId: user.id });
      return rateLimitResponse(rateCheck.retryAfterSeconds);
    }

    const { listingId, guestCount, specialRequests } = await req.json();
    if (!listingId) throw new Error("Listing ID is required");
    logStep("Request body parsed", { listingId, guestCount });

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select(
        `
        *,
        property:properties(*)
      `,
      )
      .eq("id", listingId)
      .eq("status", "active")
      .single();

    if (listingError || !listing) {
      throw new Error("Listing not found or not available");
    }
    logStep("Listing fetched", {
      listingId: listing.id,
      price: listing.final_price,
      property: listing.property?.resort_name,
      sourceType: listing.source_type,
    });

    // DEC-034: inherit source_type; for wish_matched also link travel_proposal_id
    const listingSourceType: "pre_booked" | "wish_matched" =
      listing.source_type === "wish_matched" ? "wish_matched" : "pre_booked";
    let travelProposalId: string | null = null;
    if (listingSourceType === "wish_matched") {
      const { data: proposal } = await supabase
        .from("travel_proposals")
        .select("id")
        .eq("listing_id", listing.id)
        .eq("status", "accepted")
        .maybeSingle();
      travelProposalId = proposal?.id ?? null;
    }

    // Commission: per-owner agreement override → fall back to platform base − tier discount
    const { data: agreement } = await supabase
      .from("owner_agreements")
      .select("commission_rate")
      .eq("owner_id", listing.owner_id)
      .eq("status", "active")
      .single();

    let commissionRate: number;

    if (agreement?.commission_rate) {
      commissionRate = agreement.commission_rate;
      logStep("Using per-owner agreement rate", { commissionRate });
    } else {
      const { data: commissionSetting } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "platform_commission_rate")
        .single();

      const settingVal = commissionSetting?.setting_value as Record<string, unknown> | undefined;
      const baseRate = (settingVal?.rate as number) ?? 15;

      const { data: membership } = await supabase
        .from("user_memberships")
        .select("tier:membership_tiers(commission_discount_pct)")
        .eq("user_id", listing.owner_id)
        .eq("status", "active")
        .single();

      const tierData = membership?.tier as Record<string, unknown> | undefined;
      const tierDiscount = (tierData?.commission_discount_pct as number) ?? 0;
      commissionRate = baseRate - tierDiscount;
      logStep("Using tier-aware commission rate", { baseRate, tierDiscount, commissionRate });
    }

    const checkIn = new Date(listing.check_in_date);
    const checkOut = new Date(listing.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const baseAmount = Math.round(listing.nightly_rate * nights * 100) / 100;
    const cleaningFee = listing.cleaning_fee || 0;
    const serviceFee = Math.round(baseAmount * (commissionRate / 100) * 100) / 100;
    const totalAmount = baseAmount + serviceFee + cleaningFee;
    const ravCommission = serviceFee;
    const ownerPayout = baseAmount + cleaningFee;
    logStep("Fee breakdown calculated", {
      baseAmount,
      serviceFee,
      cleaningFee,
      totalAmount,
      ravCommission,
      ownerPayout,
      commissionRate,
    });

    const taxEnabled = env.STRIPE_TAX_ENABLED === "true";
    logStep("Tax mode", { taxEnabled });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        listing_id: listingId,
        renter_id: user.id,
        status: "pending",
        total_amount: totalAmount,
        base_amount: baseAmount,
        service_fee: serviceFee,
        cleaning_fee: cleaningFee,
        rav_commission: ravCommission,
        owner_payout: ownerPayout,
        guest_count: guestCount || 1,
        special_requests: specialRequests || null,
        source_type: listingSourceType,
        travel_proposal_id: travelProposalId,
      })
      .select()
      .single();

    if (bookingError) throw new Error(`Failed to create booking: ${bookingError.message}`);
    logStep("Booking created", { bookingId: booking.id });

    const lineItems: Array<Record<string, unknown>> = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${listing.property?.resort_name || "Vacation Rental"}`,
            description: `${nights} nights • ${checkIn.toLocaleDateString()} - ${checkOut.toLocaleDateString()} • ${listing.property?.location || ""}`,
            tax_code: "txcd_99999999",
          },
          unit_amount: Math.round(baseAmount * 100),
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "RAV Service Fee",
            tax_code: "txcd_10000000",
          },
          unit_amount: Math.round(serviceFee * 100),
        },
        quantity: 1,
      },
    ];

    if (cleaningFee > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Cleaning Fee",
            tax_code: "txcd_99999999",
          },
          unit_amount: Math.round(cleaningFee * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "payment",
      automatic_tax: { enabled: taxEnabled },
      success_url: `${req.headers.get("origin")}/booking-success?booking_id=${booking.id}`,
      cancel_url: `${req.headers.get("origin")}/property/${listing.property_id}?cancelled=true`,
      metadata: {
        booking_id: booking.id,
        listing_id: listingId,
        renter_id: user.id,
      },
      payment_intent_data: {
        metadata: {
          booking_id: booking.id,
          listing_id: listingId,
          renter_id: user.id,
        },
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    await supabase
      .from("bookings")
      .update({ payment_intent_id: session.id })
      .eq("id", booking.id);

    return new Response(
      JSON.stringify({
        url: session.url,
        booking_id: booking.id,
        session_id: session.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}
