import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { handler } from "./handler.ts";

// Thin Deno wrapper. All logic lives in `handler.ts` (DEC-037).
// Service-role client — invoked by cron (hourly). Should NOT be exposed
// publicly; sla-monitor reads + writes disputes on behalf of the system.
serve((req) =>
  handler(req, {
    supabase: createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    ),
    env: {
      SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
    },
  }),
);
