/**
 * SMS Scheduler — Daily cron trigger for seasonal reminders.
 * GitHub Issue: #218
 *
 * Scheduled mode (no body): queries event_instances for today's reminders,
 * calls notification-dispatcher for each match.
 *
 * Admin override mode (body with instance_id): triggers a specific instance
 * immediately, bypassing date check.
 *
 * Cron: pg_cron job fires daily at 10:00 AM UTC.
 *
 * Required environment variables:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SchedulerRequest {
  instance_id?: string;
  force_send?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Parse optional body
    let body: SchedulerRequest = {};
    try {
      const text = await req.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty body = scheduled mode
    }

    const results: Array<{ instance_id: string; event_name: string; reminder_type: string; result: unknown }> = [];

    if (body.instance_id) {
      // ----- Admin Override Mode -----
      console.log(`[SMS Scheduler] Admin override for instance: ${body.instance_id}`);

      const { data: instance } = await supabase
        .from("event_instances")
        .select("*, seasonal_events(name)")
        .eq("id", body.instance_id)
        .single();

      if (!instance) {
        return new Response(
          JSON.stringify({ error: "Instance not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }

      if (!instance.destination) {
        return new Response(
          JSON.stringify({
            error: "Instance has no destination (search-only event) — cannot send SMS",
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }

      // Determine which reminder type to use based on proximity
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(instance.event_date + "T00:00:00");
      const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let reminderType = "12_week";
      if (daysUntil <= 14) reminderType = "2_week";
      else if (daysUntil <= 42) reminderType = "6_week";

      const dispatchResult = await callDispatcher(supabaseUrl, serviceRoleKey, {
        type_key: `seasonal_sms_${reminderType.replace("_week", "wk")}`,
        destination: instance.destination,
        instance_id: body.instance_id,
        reminder_type: reminderType,
        force_send: body.force_send || false,
        payload: {
          message: `Seasonal reminder for ${instance.seasonal_events.name}`,
        },
      });

      results.push({
        instance_id: body.instance_id,
        event_name: instance.seasonal_events.name,
        reminder_type: reminderType,
        result: dispatchResult,
      });
    } else {
      // ----- Scheduled Mode -----
      console.log("[SMS Scheduler] Running scheduled daily check...");

      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      // Find all event instances where any reminder date matches today.
      // Filter out instances with NULL destination — those are search-only
      // events (e.g. Park City / Sundance) that have no SMS destination_bucket.
      const { data: instances, error } = await supabase
        .from("event_instances")
        .select("*, seasonal_events(name)")
        .eq("status", "active")
        .eq("date_confirmed", true)
        .not("destination", "is", null)
        .or(`reminder_12wk.eq.${today},reminder_6wk.eq.${today},reminder_2wk.eq.${today}`);

      if (error) {
        console.error("[SMS Scheduler] Query error:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }

      console.log(`[SMS Scheduler] Found ${instances?.length || 0} matching instances for ${today}`);

      if (instances && instances.length > 0) {
        for (const instance of instances) {
          // Determine which reminder type matched today
          let reminderType: string;
          if (instance.reminder_12wk === today) reminderType = "12_week";
          else if (instance.reminder_6wk === today) reminderType = "6_week";
          else if (instance.reminder_2wk === today) reminderType = "2_week";
          else continue; // shouldn't happen

          const typeKeySuffix = reminderType.replace("_week", "wk"); // 12wk, 6wk, 2wk

          console.log(`[SMS Scheduler] Dispatching ${reminderType} for ${instance.seasonal_events.name} at ${instance.destination}`);

          const dispatchResult = await callDispatcher(supabaseUrl, serviceRoleKey, {
            type_key: `seasonal_sms_${typeKeySuffix}`,
            destination: instance.destination,
            instance_id: instance.id,
            reminder_type: reminderType,
            payload: {
              message: `Seasonal reminder for ${instance.seasonal_events.name}`,
            },
          });

          results.push({
            instance_id: instance.id,
            event_name: instance.seasonal_events.name,
            reminder_type,
            result: dispatchResult,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        scheduled_at: new Date().toISOString(),
        instances_processed: results.length,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error) {
    console.error("[SMS Scheduler] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
};

async function callDispatcher(
  supabaseUrl: string,
  serviceRoleKey: string,
  payload: Record<string, unknown>,
): Promise<unknown> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/notification-dispatcher`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (e) {
    console.error("[SMS Scheduler] Dispatcher call failed:", e);
    return { error: e instanceof Error ? e.message : "Dispatcher call failed" };
  }
}

serve(handler);
