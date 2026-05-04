import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { handler } from "./handler.ts";

// Thin Deno wrapper. All logic lives in `handler.ts` so it can be unit-tested
// in Vitest with injected mocks (issue #371 / DEC-037). The user's auth header
// flows through via the Bearer token re-extracted in the handler.
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
