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
  console.log(`[UPDATE-SUBSCRIPTION] ${step}${detailsStr}`);
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
    const { newTierKey } = await req.json();
    if (!newTierKey) throw new Error("newTierKey is required");
    logStep("Request body parsed", { newTierKey });

    // Fetch current membership with tier join
    const { data: membership, error: membershipError } = await supabaseClient
      .from("user_memberships")
      .select("*, tier:membership_tiers(*)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (membershipError || !membership) {
      throw new Error("No active membership found");
    }

    // Must have an active Stripe subscription to update
    if (!membership.stripe_subscription_id) {
      throw new Error("No active Stripe subscription. Use checkout to subscribe first.");
    }
    logStep("Current membership found", {
      currentTier: membership.tier?.tier_key,
      tierLevel: membership.tier?.tier_level,
      subscriptionId: membership.stripe_subscription_id,
    });

    // Fetch target tier
    const { data: targetTier, error: targetTierError } = await supabaseClient
      .from("membership_tiers")
      .select("*")
      .eq("tier_key", newTierKey)
      .single();

    if (targetTierError || !targetTier) {
      throw new Error("Target membership tier not found");
    }
    logStep("Target tier fetched", {
      tierKey: targetTier.tier_key,
      tierLevel: targetTier.tier_level,
      monthlyPriceCents: targetTier.monthly_price_cents,
    });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // If target is a free tier, cancel at period end
    if (targetTier.monthly_price_cents === 0) {
      logStep("Downgrading to free tier — cancelling at period end");
      await stripe.subscriptions.update(membership.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      return new Response(
        JSON.stringify({
          success: true,
          effective: "period_end",
          message: "Subscription will cancel at end of billing period",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Validate target tier has a Stripe price
    if (!targetTier.stripe_price_id) {
      throw new Error("Target tier does not have a Stripe price configured");
    }

    // Get current subscription from Stripe to find the subscription item ID
    const subscription = await stripe.subscriptions.retrieve(membership.stripe_subscription_id);
    const itemId = subscription.items.data[0].id;
    logStep("Stripe subscription retrieved", { itemId });

    const currentTierLevel = membership.tier?.tier_level ?? 0;
    const targetTierLevel = targetTier.tier_level ?? 0;

    if (targetTierLevel > currentTierLevel) {
      // UPGRADE: prorate immediately
      logStep("Upgrading subscription", {
        from: membership.tier?.tier_key,
        to: targetTier.tier_key,
      });
      await stripe.subscriptions.update(membership.stripe_subscription_id, {
        items: [{ id: itemId, price: targetTier.stripe_price_id }],
        proration_behavior: "create_prorations",
        metadata: { user_id: user.id, tier_key: newTierKey },
      });
      return new Response(
        JSON.stringify({ success: true, effective: "immediate" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // DOWNGRADE: no proration, effective next cycle
      logStep("Downgrading subscription", {
        from: membership.tier?.tier_key,
        to: targetTier.tier_key,
      });
      await stripe.subscriptions.update(membership.stripe_subscription_id, {
        items: [{ id: itemId, price: targetTier.stripe_price_id }],
        proration_behavior: "none",
        metadata: { user_id: user.id, tier_key: newTierKey },
      });
      return new Response(
        JSON.stringify({ success: true, effective: "next_cycle" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
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
