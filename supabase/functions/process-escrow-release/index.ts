import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";
import { handler } from "./handler.ts";

// Thin Deno wrapper. All logic lives in `handler.ts` (DEC-037 / #371).
// First applied to this fn in #468 / Gap D, alongside moving the previously
// hardcoded HOLD_PERIOD_DAYS to system_settings.
serve((req) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  return handler(req, {
    supabase: createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    ),
    stripe: stripeKey
      ? (new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" }) as unknown as Parameters<
          typeof handler
        >[1]["stripe"])
      : null,
    resend: new Resend(Deno.env.get("RESEND_API_KEY")),
    env: {
      SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
      STRIPE_SECRET_KEY: stripeKey,
      RESEND_API_KEY: Deno.env.get("RESEND_API_KEY"),
    },
  });
});
