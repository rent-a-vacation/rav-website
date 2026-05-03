// Core logic for sla-monitor (#464 / PaySafe Gap G).
//
// Scheduled cron (hourly). For every active dispute, compares elapsed time
// against the sla_triage_minutes / sla_resolution_minutes snapshot stored on
// the row. Fires alerts via notification-dispatcher and idempotently stamps
// triage_alerted_at / resolution_alerted_at so re-runs do not double-alert.
//
// Service-role only — no auth gate.

import {
  DEFAULT_BUSINESS_HOURS,
  type BusinessHoursConfig,
  elapsedBusinessMinutes,
  elapsedWallClockMinutes,
  isResolutionBreached,
  isTriageBreached,
} from "../../../src/lib/disputeSla.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SLA-MONITOR] ${step}${detailsStr}`);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseLike = any;

export interface Deps {
  supabase: SupabaseLike;
  env: Record<string, string | undefined>;
  /** Inject "now" for tests. Defaults to real NOW(). */
  now?: () => Date;
}

/** Set of dispute categories that ignore business-hours math (on-site urgency). */
const ON_SITE_CATEGORIES = new Set([
  "safety_concerns",
  "owner_no_show",
  "access_issues",
  "property_not_as_described",
]);

interface BusinessHoursRow {
  start_hour: number;
  end_hour: number;
  timezone: string;
  federal_holidays: string[];
  weekend_days: number[];
}

async function loadBusinessHoursConfig(
  supabase: SupabaseLike,
): Promise<BusinessHoursConfig> {
  try {
    const { data } = await supabase
      .from("business_hours_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    const row = data as BusinessHoursRow | null;
    if (!row) return DEFAULT_BUSINESS_HOURS;
    return {
      startHour: row.start_hour,
      endHour: row.end_hour,
      timezone: row.timezone,
      federalHolidays: row.federal_holidays ?? [],
      weekendDays: row.weekend_days ?? [0, 6],
    };
  } catch (err) {
    logStep("business-hours config load failed — using defaults", {
      error: err instanceof Error ? err.message : String(err),
    });
    return DEFAULT_BUSINESS_HOURS;
  }
}

interface DisputeRow {
  id: string;
  category: string;
  status: string;
  assigned_to: string | null;
  triage_alerted_at: string | null;
  resolution_alerted_at: string | null;
  sla_triage_minutes: number | null;
  sla_resolution_minutes: number | null;
  created_at: string;
  reporter_id: string;
}

/**
 * For a single dispute row, decide how to compute elapsed minutes given the
 * business-hours config. Exported for direct testing.
 */
export function computeElapsedMinutes(
  dispute: Pick<DisputeRow, "category" | "created_at">,
  now: Date,
  config: BusinessHoursConfig,
): number {
  const created = new Date(dispute.created_at);
  if (ON_SITE_CATEGORIES.has(dispute.category)) {
    return elapsedWallClockMinutes(created, now);
  }
  return elapsedBusinessMinutes(created, now, config);
}

export async function handler(req: Request, deps: Deps): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { supabase, now: nowFn } = deps;

  try {
    logStep("Function started");

    const now = nowFn ? nowFn() : new Date();
    const config = await loadBusinessHoursConfig(supabase);

    const { data: disputes, error } = await supabase
      .from("disputes")
      .select(
        "id, category, status, assigned_to, triage_alerted_at, resolution_alerted_at, sla_triage_minutes, sla_resolution_minutes, created_at, reporter_id",
      )
      .not("status", "in", "(resolved_full_refund,resolved_partial_refund,resolved_no_refund,closed)");

    if (error) throw new Error(`Failed to fetch disputes: ${error.message}`);

    const rows = (disputes ?? []) as DisputeRow[];
    logStep("Fetched active disputes", { count: rows.length });

    let triageAlerts = 0;
    let resolutionAlerts = 0;
    const alertIds: string[] = [];

    for (const row of rows) {
      if (!row.sla_triage_minutes || !row.sla_resolution_minutes) {
        // Can't evaluate breach without a target. Skip silently — usually
        // older rows from before migration 072 backfill.
        continue;
      }

      const elapsed = computeElapsedMinutes(row, now, config);

      const triageBreach = isTriageBreached({
        elapsedMinutes: elapsed,
        slaTriageMinutes: row.sla_triage_minutes,
        triageAlertedAt: row.triage_alerted_at,
        assignedTo: row.assigned_to,
      });

      const resolutionBreach = isResolutionBreached({
        elapsedMinutes: elapsed,
        slaResolutionMinutes: row.sla_resolution_minutes,
        resolutionAlertedAt: row.resolution_alerted_at,
        status: row.status,
      });

      if (!triageBreach && !resolutionBreach) continue;

      const updates: Record<string, string> = {};
      if (triageBreach) updates.triage_alerted_at = now.toISOString();
      if (resolutionBreach) updates.resolution_alerted_at = now.toISOString();

      const { error: stampErr } = await supabase
        .from("disputes")
        .update(updates)
        .eq("id", row.id);
      if (stampErr) {
        logStep("Failed to stamp alert (will retry next run)", {
          disputeId: row.id,
          error: stampErr.message,
        });
        continue;
      }

      if (triageBreach) triageAlerts++;
      if (resolutionBreach) resolutionAlerts++;
      alertIds.push(row.id);

      // Fire RAV-team alert (single notification per dispute even if both
      // breaches occurred — the team will see both in the dispute view).
      supabase.functions
        .invoke("notification-dispatcher", {
          body: {
            type_key: "dispute_sla_breach",
            payload: {
              title: triageBreach
                ? "Dispute past triage SLA"
                : "Dispute past resolution SLA",
              message: `Dispute ${row.id.slice(0, 8)} (${row.category}) — ${
                triageBreach ? "needs triage assignment" : "needs resolution"
              }.`,
              dispute_id: row.id,
              category: row.category,
              triage_breach: triageBreach,
              resolution_breach: resolutionBreach,
            },
          },
        })
        .catch((err: unknown) =>
          logStep("notification dispatch failed (non-fatal)", {
            error: err instanceof Error ? err.message : String(err),
          }),
        );
    }

    logStep("Completed", { triageAlerts, resolutionAlerts });

    return new Response(
      JSON.stringify({
        success: true,
        triageAlerts,
        resolutionAlerts,
        alertedDisputeIds: alertIds,
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
