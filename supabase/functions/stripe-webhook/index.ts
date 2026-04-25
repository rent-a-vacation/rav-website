import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";
import { handler } from "./handler.ts";

// Thin Deno wrapper. All logic lives in `handler.ts` so it can be unit-tested
// in Vitest with injected mocks (issue #371).
serve((req) =>
  handler(req, {
    supabase: createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    ),
    stripe: new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2025-08-27.basil",
    }),
    resend: new Resend(Deno.env.get("RESEND_API_KEY")),
    env: {
      SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
      SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY"),
      STRIPE_SECRET_KEY: Deno.env.get("STRIPE_SECRET_KEY"),
      STRIPE_WEBHOOK_SECRET: Deno.env.get("STRIPE_WEBHOOK_SECRET"),
    },
  }),
);
