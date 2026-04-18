import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-BOOKING-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Rate limit check
    const rateCheck = await checkRateLimit(supabaseClient, user.id, RATE_LIMITS.CHECKOUT);
    if (!rateCheck.allowed) {
      logStep("Rate limited", { userId: user.id });
      return rateLimitResponse(rateCheck.retryAfterSeconds);
    }

    // Parse the request body
    const { listingId, guestCount, specialRequests } = await req.json();
    if (!listingId) throw new Error("Listing ID is required");
    logStep("Request body parsed", { listingId, guestCount });

    // Fetch the listing with property details
    const { data: listing, error: listingError } = await supabaseClient
      .from("listings")
      .select(`
        *,
        property:properties(*)
      `)
      .eq("id", listingId)
      .eq("status", "active")
      .single();

    if (listingError || !listing) {
      throw new Error("Listing not found or not available");
    }
    logStep("Listing fetched", { 
      listingId: listing.id, 
      price: listing.final_price,
      property: listing.property?.resort_name 
    });

    // Determine commission rate:
    // 1. Check per-owner agreement override
    // 2. Fall back to platform base rate minus tier discount
    const { data: agreement } = await supabaseClient
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
      // Get platform base rate from system_settings
      const { data: commissionSetting } = await supabaseClient
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "platform_commission_rate")
        .single();

      const settingVal = commissionSetting?.setting_value as Record<string, unknown> | undefined;
      const baseRate = (settingVal?.rate as number) ?? 15;

      // Get owner's tier discount
      const { data: membership } = await supabaseClient
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
    // Fee breakdown calculation
    const checkIn = new Date(listing.check_in_date);
    const checkOut = new Date(listing.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const baseAmount = Math.round(listing.nightly_rate * nights * 100) / 100;
    const cleaningFee = listing.cleaning_fee || 0;
    const serviceFee = Math.round(baseAmount * (commissionRate / 100) * 100) / 100;
    const totalAmount = baseAmount + serviceFee + cleaningFee;
    const ravCommission = serviceFee;
    const ownerPayout = baseAmount + cleaningFee;
    logStep("Fee breakdown calculated", { baseAmount, serviceFee, cleaningFee, totalAmount, ravCommission, ownerPayout, commissionRate });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Gate automatic tax behind env flag — requires valid head office address
    // in the Stripe account (unavailable in sandbox and pre-#127 live account).
    const taxEnabled = Deno.env.get("STRIPE_TAX_ENABLED") === "true";
    logStep("Tax mode", { taxEnabled });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    }

    // Create a pending booking record
    const { data: booking, error: bookingError } = await supabaseClient
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
      })
      .select()
      .single();

    if (bookingError) throw new Error(`Failed to create booking: ${bookingError.message}`);
    logStep("Booking created", { bookingId: booking.id });

    // Build line items with separate fees for transparency
    const lineItems = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${listing.property?.resort_name || "Vacation Rental"}`,
            description: `${nights} nights • ${checkIn.toLocaleDateString()} - ${checkOut.toLocaleDateString()} • ${listing.property?.location || ""}`,
            tax_code: "txcd_99999999", // General lodging / short-term rental
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
            tax_code: "txcd_10000000", // Service charge — generally non-taxable
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

    // Create Stripe checkout session with automatic tax calculation
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

    // Update booking with payment intent ID (from session)
    await supabaseClient
      .from("bookings")
      .update({ payment_intent_id: session.id })
      .eq("id", booking.id);

    return new Response(
      JSON.stringify({ 
        url: session.url, 
        booking_id: booking.id,
        session_id: session.id 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
