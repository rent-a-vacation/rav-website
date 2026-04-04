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
  console.log(`[CREATE-SUBSCRIPTION-CHECKOUT] ${step}${detailsStr}`);
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
    const rateCheck = await checkRateLimit(supabaseClient, user.id, RATE_LIMITS.SUBSCRIPTION_CHECKOUT);
    if (!rateCheck.allowed) {
      logStep("Rate limited", { userId: user.id });
      return rateLimitResponse(rateCheck.retryAfterSeconds);
    }

    // Parse the request body
    const { tierKey } = await req.json();
    if (!tierKey) throw new Error("tierKey is required");
    logStep("Request body parsed", { tierKey });

    // Fetch target tier
    const { data: tier, error: tierError } = await supabaseClient
      .from("membership_tiers")
      .select("*")
      .eq("tier_key", tierKey)
      .single();

    if (tierError || !tier) {
      throw new Error("Membership tier not found");
    }
    logStep("Target tier fetched", { tierKey: tier.tier_key, stripePriceId: tier.stripe_price_id });

    // Validate tier has a Stripe price (reject free tiers)
    if (!tier.stripe_price_id) {
      throw new Error("This tier does not require a subscription. No Stripe price configured.");
    }

    // Fetch current membership
    const { data: currentMembership } = await supabaseClient
      .from("user_memberships")
      .select("*, tier:membership_tiers(*)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    // If already on a paid tier with active subscription, reject
    if (currentMembership?.stripe_subscription_id) {
      throw new Error("Already subscribed. Use upgrade instead.");
    }
    logStep("Current membership checked", {
      hasMembership: !!currentMembership,
      hasSubscription: !!currentMembership?.stripe_subscription_id,
    });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    }

    const origin = req.headers.get("origin") || "https://rent-a-vacation.com";

    // Create Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: !customerId ? user.email : undefined,
      mode: "subscription",
      line_items: [{ price: tier.stripe_price_id, quantity: 1 }],
      success_url: `${origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/owner-dashboard?tab=account&cancelled=true`,
      metadata: { user_id: user.id, tier_key: tierKey },
      subscription_data: {
        metadata: { user_id: user.id, tier_key: tierKey },
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ url: session.url }),
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
