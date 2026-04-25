// Core logic for create-connect-account (issue #442). Extracted from index.ts
// per the harness pattern (DEC-037).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CONNECT-ACCOUNT] ${step}${detailsStr}`);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseLike = any;

export interface StripeLike {
  accounts: {
    create: (args: Record<string, unknown>) => Promise<{ id: string }>;
    retrieve: (
      id: string,
    ) => Promise<{ id: string; charges_enabled?: boolean; payouts_enabled?: boolean }>;
  };
  accountLinks: {
    create: (args: Record<string, unknown>) => Promise<{ url: string }>;
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    const { returnUrl } = await req.json();

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isOwner = roles?.some((r: { role: string }) => r.role === "property_owner");
    if (!isOwner) throw new Error("Only property owners can create a Connect account");

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_complete, full_name")
      .eq("id", user.id)
      .single();

    let accountId = profile?.stripe_account_id;

    if (accountId) {
      const account = await stripe.accounts.retrieve(accountId);

      if (account.charges_enabled && account.payouts_enabled) {
        logStep("Account already fully onboarded", { accountId });
        return new Response(
          JSON.stringify({
            success: true,
            already_complete: true,
            account_id: accountId,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }

      logStep("Account exists but onboarding incomplete, generating new link", { accountId });
    } else {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        metadata: { rav_user_id: user.id },
        business_profile: {
          product_description:
            "Vacation timeshare property rentals via Rent-A-Vacation marketplace",
        },
        capabilities: {
          transfers: { requested: true },
        },
      });

      accountId = account.id;
      logStep("Stripe Express account created", { accountId });

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          stripe_account_id: accountId,
          stripe_onboarding_complete: false,
          stripe_charges_enabled: false,
          stripe_payouts_enabled: false,
        })
        .eq("id", user.id);

      if (updateError) {
        logStep("Warning: Failed to store account ID in profile", { error: updateError.message });
      }
    }

    const origin = req.headers.get("origin") || "https://rent-a-vacation.com";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: returnUrl || `${origin}/owner-dashboard?tab=earnings&stripe=refresh`,
      return_url: returnUrl || `${origin}/owner-dashboard?tab=earnings&stripe=complete`,
      type: "account_onboarding",
    });

    logStep("Onboarding link generated", { url: accountLink.url });

    return new Response(
      JSON.stringify({
        success: true,
        url: accountLink.url,
        account_id: accountId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
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
