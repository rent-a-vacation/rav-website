// Core logic for auto-confirm-checkins (#462 / PaySafe Gap B).
//
// Scheduled cron (hourly). For every checkin_confirmations row where the
// confirmation deadline has elapsed and the renter took no action, mark
// confirmed_arrival = true with source = 'auto' so escrow + analytics have
// a deterministic state to rest on.
//
// Distinction: a renter who actively confirmed leaves source='renter';
// the cron leaves source='auto'. Reporting tools can trust this to compute
// fraud + dispute analytics. (Without this column, "renter confirmed" and
// "renter ignored the deadline" looked identical — see PAYSAFE-FLOW-SPEC §3.2.)
//
// Service-role only — no auth gate. The thin index.ts wrapper supplies
// service-role credentials. CRON SHOULD NOT EXPOSE THIS PUBLICLY.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[AUTO-CONFIRM-CHECKINS] ${step}${detailsStr}`);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseLike = any;

export interface Deps {
  supabase: SupabaseLike;
  env: Record<string, string | undefined>;
  /** Inject the "now" for tests. Defaults to real NOW() at call-time. */
  now?: () => Date;
}

const BATCH_LIMIT = 100;

export async function handler(req: Request, deps: Deps): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { supabase, now } = deps;

  try {
    logStep("Function started");

    const nowDate = now ? now() : new Date();
    const nowIso = nowDate.toISOString();

    // Pull rows past the deadline that are still unresolved + not flagged with
    // an issue. issue_reported=true rows are intentionally NOT auto-confirmed
    // because the renter actively engaged — those go through the dispute flow.
    const { data: candidates, error: fetchError } = await supabase
      .from("checkin_confirmations")
      .select("id, booking_id, traveler_id")
      .lt("confirmation_deadline", nowIso)
      .is("confirmed_arrival", null)
      .eq("issue_reported", false)
      .limit(BATCH_LIMIT);

    if (fetchError) {
      throw new Error(`Failed to fetch candidates: ${fetchError.message}`);
    }

    const rows = (candidates ?? []) as Array<{
      id: string;
      booking_id: string;
      traveler_id: string;
    }>;
    logStep("Fetched candidates", { count: rows.length });

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processedCount: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Bulk update — single statement filtering by ID set is cheaper than per-row.
    const { error: updateError } = await supabase
      .from("checkin_confirmations")
      .update({
        confirmed_arrival: true,
        confirmed_at: nowIso,
        confirmed_at_source: "auto",
      })
      .in(
        "id",
        rows.map((r) => r.id),
      );

    if (updateError) {
      throw new Error(`Bulk update failed: ${updateError.message}`);
    }

    logStep("Auto-confirmed", { processedCount: rows.length });

    return new Response(
      JSON.stringify({
        success: true,
        processedCount: rows.length,
        processedIds: rows.map((r) => r.id),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logStep("Error", { error: message });
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
