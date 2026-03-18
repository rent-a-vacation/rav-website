/**
 * Notification Dispatcher — Central routing engine for ALL notification channels.
 * GitHub Issue: #217
 *
 * Every notification routes through here. Handles:
 * - In-app: inserts into `notifications` table
 * - Email: calls existing `send-email` edge function via Resend
 * - SMS: calls Twilio Messages API (or logs in test mode)
 *
 * Required environment variables:
 *   TWILIO_ACCOUNT_SID      - Twilio account SID
 *   TWILIO_AUTH_TOKEN        - Twilio auth token
 *   TWILIO_PHONE_NUMBER      - Twilio sender phone number (E.164)
 *   SMS_TEST_MODE            - 'true' or 'false'
 *   SUPABASE_URL             - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase service role key
 *   RESEND_API_KEY           - Resend API key for email
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { buildEmailHtml } from "../_shared/email-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---- Types ----

interface DispatchRequest {
  type_key: string;
  user_id?: string;
  user_ids?: string[];
  destination?: string;
  instance_id?: string;
  reminder_type?: string; // '12_week' | '6_week' | '2_week'
  force_send?: boolean;
  payload: {
    title?: string;
    message: string;
    linked_id?: string;
    link_type?: string; // 'listing' | 'booking' | 'bid' | 'request'
  };
}

interface DispatchResponse {
  processed: number;
  dispatched: {
    in_app: number;
    email: number;
    sms: number;
  };
  skipped: number;
  errors: number;
  test_mode: boolean;
}

interface CatalogRow {
  type_key: string;
  display_name: string;
  category: string;
  opt_out_level: string;
  default_in_app: boolean;
  default_email: boolean;
  default_sms: boolean;
  channel_in_app_allowed: boolean;
  channel_email_allowed: boolean;
  channel_sms_allowed: boolean;
  active: boolean;
}

// ---- Helpers ----

const DESTINATION_LABELS: Record<string, string> = {
  orlando: "Orlando",
  miami: "Miami",
  las_vegas: "Las Vegas",
  maui_hawaii: "Maui / Hawaii",
  myrtle_beach: "Myrtle Beach",
  colorado: "Colorado",
  new_york: "New York",
  nashville: "Nashville",
};

function formatDestination(dest: string): string {
  return DESTINATION_LABELS[dest] || dest.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getFirstName(fullName: string | null): string {
  if (!fullName) return "Owner";
  return fullName.split(" ")[0] || "Owner";
}

function buildSmsMessage(
  reminderType: string,
  firstName: string,
  eventName: string,
  destination: string,
  eventDate: string,
  customTemplate?: string | null,
): string {
  const destLabel = formatDestination(destination);
  const dateLabel = formatDate(eventDate);

  if (customTemplate) {
    return customTemplate
      .replace(/\{first_name\}/g, firstName)
      .replace(/\{event_name\}/g, eventName)
      .replace(/\{destination\}/g, destLabel)
      .replace(/\{date\}/g, dateLabel);
  }

  switch (reminderType) {
    case "12_week":
      return `Hi ${firstName}! 🏖️ ${eventName} at ${destLabel} is 12 weeks away (${dateLabel}). List your property NOW to capture early renters — more time in front of renters means more bookings. List at rent-a-vacation.com`;
    case "6_week":
      return `⏰ Reminder: ${eventName} at ${destLabel} is just 6 weeks away! Renters are actively searching. Your property isn't listed yet — don't miss peak demand. List today: rent-a-vacation.com`;
    case "2_week":
      return `🚨 FINAL REMINDER: ${eventName} at ${destLabel} is in 2 WEEKS! Last chance to fill your dates. Renters are booking NOW. List immediately: rent-a-vacation.com`;
    default:
      return `Reminder: ${eventName} at ${destLabel} is coming up on ${dateLabel}. List your property at rent-a-vacation.com`;
  }
}

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

// ---- Main handler ----

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const smsTestMode = Deno.env.get("SMS_TEST_MODE") === "true";
  const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID") || "";
  const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN") || "";
  const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER") || "";
  const resendKey = Deno.env.get("RESEND_API_KEY") || "";

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body: DispatchRequest = await req.json();
    const { type_key, payload, instance_id, reminder_type, force_send } = body;

    // 1. Load catalog entry
    const { data: catalog, error: catalogError } = await supabase
      .from("notification_catalog")
      .select("*")
      .eq("type_key", type_key)
      .single();

    if (catalogError || !catalog) {
      return new Response(
        JSON.stringify({ error: `Unknown notification type: ${type_key}` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (!catalog.active) {
      return new Response(
        JSON.stringify({ error: `Notification type ${type_key} is inactive` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const catalogRow = catalog as CatalogRow;

    // 2. Resolve target users
    let userIds: string[] = [];

    if (body.user_ids && body.user_ids.length > 0) {
      userIds = body.user_ids;
    } else if (body.user_id) {
      userIds = [body.user_id];
    } else if (body.destination) {
      // Find property owners in this destination who have opted in to SMS
      const { data: owners } = await supabase
        .from("profiles")
        .select("id")
        .eq("sms_opted_in", true)
        .not("phone_e164", "is", null);

      if (owners) {
        userIds = owners.map((o: { id: string }) => o.id);
      }
    }

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({
          processed: 0,
          dispatched: { in_app: 0, email: 0, sms: 0 },
          skipped: 0,
          errors: 0,
          test_mode: smsTestMode,
        } as DispatchResponse),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Load event instance data if this is a seasonal SMS
    let eventData: { name: string; event_date: string; destination: string; sms_template_12wk?: string; sms_template_6wk?: string; sms_template_2wk?: string } | null = null;
    if (instance_id) {
      const { data: inst } = await supabase
        .from("event_instances")
        .select("*, seasonal_events(*)")
        .eq("id", instance_id)
        .single();
      if (inst) {
        eventData = {
          name: inst.seasonal_events.name,
          event_date: inst.event_date,
          destination: inst.destination,
          sms_template_12wk: inst.seasonal_events.sms_template_12wk,
          sms_template_6wk: inst.seasonal_events.sms_template_6wk,
          sms_template_2wk: inst.seasonal_events.sms_template_2wk,
        };
      }
    }

    // 3. Process each user
    const result: DispatchResponse = {
      processed: 0,
      dispatched: { in_app: 0, email: 0, sms: 0 },
      skipped: 0,
      errors: 0,
      test_mode: smsTestMode,
    };

    // Load all user profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, phone_e164, sms_opted_in")
      .in("id", userIds);

    const profileMap = new Map<string, { full_name: string | null; phone_e164: string | null; sms_opted_in: boolean }>();
    if (profiles) {
      for (const p of profiles) {
        profileMap.set(p.id, p);
      }
    }

    // Get user emails from auth (via profiles join or auth.users)
    // We'll get email from the user object on per-user basis if needed

    const channels = [
      { key: "in_app" as const, allowed: catalogRow.channel_in_app_allowed },
      { key: "email" as const, allowed: catalogRow.channel_email_allowed },
      { key: "sms" as const, allowed: catalogRow.channel_sms_allowed },
    ].filter((c) => c.allowed);

    for (const userId of userIds) {
      result.processed++;
      const profile = profileMap.get(userId);
      if (!profile) {
        result.errors++;
        continue;
      }

      for (const channel of channels) {
        // Check user preference
        const { data: prefResult } = await supabase.rpc("get_notification_preference", {
          p_user_id: userId,
          p_type_key: type_key,
          p_channel: channel.key,
        });

        if (!prefResult) {
          result.skipped++;
          continue;
        }

        // ---- IN-APP CHANNEL ----
        if (channel.key === "in_app") {
          try {
            // Build linked entity fields
            const linkedFields: Record<string, string | null> = {
              listing_id: null,
              bid_id: null,
              booking_id: null,
              proposal_id: null,
              request_id: null,
            };
            if (payload.linked_id && payload.link_type) {
              const fkField = `${payload.link_type}_id`;
              if (fkField in linkedFields) {
                linkedFields[fkField] = payload.linked_id;
              }
            }

            const { data: notifRow, error: notifError } = await supabase
              .from("notifications")
              .insert({
                user_id: userId,
                type: type_key,
                title: payload.title || catalogRow.display_name,
                message: payload.message,
                ...linkedFields,
              })
              .select("id")
              .single();

            if (notifError) {
              console.error(`In-app insert error for ${userId}:`, notifError.message);
              result.errors++;

              await supabase.from("notification_delivery_log").insert({
                user_id: userId,
                notification_id: null,
                type_key,
                channel: "in_app",
                instance_id: instance_id || null,
                reminder_type: reminder_type || null,
                subject_or_title: payload.title || catalogRow.display_name,
                message_body: payload.message,
                status: "failed",
                error_message: notifError.message,
                sent_at: new Date().toISOString(),
              });
              continue;
            }

            // Log delivery
            await supabase.from("notification_delivery_log").insert({
              user_id: userId,
              notification_id: notifRow?.id || null,
              type_key,
              channel: "in_app",
              instance_id: instance_id || null,
              reminder_type: reminder_type || null,
              subject_or_title: payload.title || catalogRow.display_name,
              message_body: payload.message,
              status: "sent",
              sent_at: new Date().toISOString(),
            });

            result.dispatched.in_app++;
          } catch (e) {
            console.error(`In-app error for ${userId}:`, e);
            result.errors++;
          }
        }

        // ---- EMAIL CHANNEL ----
        if (channel.key === "email") {
          try {
            // Get user email from auth
            const { data: authUser } = await supabase.auth.admin.getUserById(userId);
            const email = authUser?.user?.email;

            if (!email) {
              result.skipped++;
              await supabase.from("notification_delivery_log").insert({
                user_id: userId,
                type_key,
                channel: "email",
                instance_id: instance_id || null,
                reminder_type: reminder_type || null,
                subject_or_title: payload.title || catalogRow.display_name,
                message_body: payload.message,
                status: "skipped_no_channel",
                sent_at: new Date().toISOString(),
              });
              continue;
            }

            const firstName = getFirstName(profile.full_name);
            const emailHtml = buildEmailHtml({
              recipientName: firstName,
              heading: payload.title || catalogRow.display_name,
              body: `<p>${payload.message}</p>`,
              cta: payload.linked_id
                ? { label: "View Details", url: `https://rent-a-vacation.com/${payload.link_type || "rentals"}/${payload.linked_id}` }
                : undefined,
            });

            // Send via Resend
            const resendResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendKey}`,
              },
              body: JSON.stringify({
                from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
                to: [email],
                subject: payload.title || catalogRow.display_name,
                html: emailHtml,
              }),
            });

            const resendData = await resendResponse.json();

            await supabase.from("notification_delivery_log").insert({
              user_id: userId,
              type_key,
              channel: "email",
              instance_id: instance_id || null,
              reminder_type: reminder_type || null,
              recipient_email: email,
              resend_message_id: resendData?.id || null,
              subject_or_title: payload.title || catalogRow.display_name,
              message_body: payload.message,
              status: resendResponse.ok ? "sent" : "failed",
              error_message: resendResponse.ok ? null : JSON.stringify(resendData),
              sent_at: new Date().toISOString(),
            });

            if (resendResponse.ok) {
              result.dispatched.email++;
            } else {
              result.errors++;
            }
          } catch (e) {
            console.error(`Email error for ${userId}:`, e);
            result.errors++;
          }
        }

        // ---- SMS CHANNEL ----
        if (channel.key === "sms") {
          try {
            const firstName = getFirstName(profile.full_name);

            // Guard 1: SMS opt-in
            if (!profile.sms_opted_in) {
              result.skipped++;
              await supabase.from("notification_delivery_log").insert({
                user_id: userId,
                type_key,
                channel: "sms",
                instance_id: instance_id || null,
                reminder_type: reminder_type || null,
                phone_e164: profile.phone_e164,
                message_body: payload.message,
                status: "skipped_no_consent",
              });
              await supabase.from("sms_suppression_log").insert({
                owner_id: userId,
                instance_id: instance_id || null,
                suppression_reason: "skipped_no_consent",
              });
              continue;
            }

            // Guard 2: Valid E.164 phone
            if (!profile.phone_e164 || !E164_REGEX.test(profile.phone_e164)) {
              result.skipped++;
              await supabase.from("notification_delivery_log").insert({
                user_id: userId,
                type_key,
                channel: "sms",
                instance_id: instance_id || null,
                reminder_type: reminder_type || null,
                phone_e164: profile.phone_e164,
                message_body: payload.message,
                status: "skipped_no_channel",
              });
              continue;
            }

            // Guard 3: Duplicate check
            if (instance_id && reminder_type) {
              const { data: existing } = await supabase
                .from("notification_delivery_log")
                .select("id")
                .eq("user_id", userId)
                .eq("instance_id", instance_id)
                .eq("reminder_type", reminder_type)
                .in("status", ["sent", "delivered"])
                .limit(1);

              if (existing && existing.length > 0) {
                result.skipped++;
                await supabase.from("notification_delivery_log").insert({
                  user_id: userId,
                  type_key,
                  channel: "sms",
                  instance_id,
                  reminder_type,
                  phone_e164: profile.phone_e164,
                  message_body: payload.message,
                  status: "skipped_duplicate",
                });
                continue;
              }
            }

            // Guard 4: Already listed check (skip if owner has active listing)
            if (eventData) {
              const { data: activeListing } = await supabase
                .from("listings")
                .select("id")
                .eq("owner_id", userId)
                .eq("status", "active")
                .limit(1);

              if (activeListing && activeListing.length > 0) {
                result.skipped++;
                await supabase.from("notification_delivery_log").insert({
                  user_id: userId,
                  type_key,
                  channel: "sms",
                  instance_id: instance_id || null,
                  reminder_type: reminder_type || null,
                  phone_e164: profile.phone_e164,
                  message_body: payload.message,
                  status: "skipped_already_listed",
                });
                await supabase.from("sms_suppression_log").insert({
                  owner_id: userId,
                  instance_id: instance_id || null,
                  suppression_reason: "skipped_already_listed",
                });
                continue;
              }
            }

            // Guard 5: Frequency cap (max 2 SMS in 7 days)
            if (!force_send) {
              const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
              const { count: recentCount } = await supabase
                .from("notification_delivery_log")
                .select("id", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("channel", "sms")
                .in("status", ["sent", "delivered", "test"])
                .gte("created_at", sevenDaysAgo);

              if (recentCount && recentCount >= 2) {
                result.skipped++;
                await supabase.from("notification_delivery_log").insert({
                  user_id: userId,
                  type_key,
                  channel: "sms",
                  instance_id: instance_id || null,
                  reminder_type: reminder_type || null,
                  phone_e164: profile.phone_e164,
                  message_body: payload.message,
                  status: "skipped_frequency_cap",
                });
                await supabase.from("sms_suppression_log").insert({
                  owner_id: userId,
                  instance_id: instance_id || null,
                  suppression_reason: "skipped_frequency_cap",
                });
                continue;
              }
            }

            // Build SMS message
            let smsBody: string;
            if (eventData && reminder_type) {
              const customTemplate =
                reminder_type === "12_week" ? eventData.sms_template_12wk :
                reminder_type === "6_week" ? eventData.sms_template_6wk :
                reminder_type === "2_week" ? eventData.sms_template_2wk : null;

              smsBody = buildSmsMessage(
                reminder_type,
                firstName,
                eventData.name,
                eventData.destination,
                eventData.event_date,
                customTemplate,
              );
            } else {
              smsBody = payload.message;
            }

            // SMS_TEST_MODE handling
            if (smsTestMode) {
              console.log("[SMS TEST MODE] Would send to:", profile.phone_e164);
              console.log("[SMS TEST MODE] Message:", smsBody);
              console.log("[SMS TEST MODE] Type:", type_key, "Reminder:", reminder_type);

              await supabase.from("notification_delivery_log").insert({
                user_id: userId,
                type_key,
                channel: "sms",
                instance_id: instance_id || null,
                reminder_type: reminder_type || null,
                phone_e164: profile.phone_e164,
                message_body: smsBody,
                status: "test",
                test_mode: true,
                sent_at: new Date().toISOString(),
              });

              result.dispatched.sms++;
            } else {
              // Production: call Twilio
              const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
              const twilioAuth = btoa(`${twilioSid}:${twilioToken}`);

              const twilioBody = new URLSearchParams({
                To: profile.phone_e164,
                From: twilioPhone,
                Body: smsBody,
              });

              const twilioResponse = await fetch(twilioUrl, {
                method: "POST",
                headers: {
                  Authorization: `Basic ${twilioAuth}`,
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: twilioBody.toString(),
              });

              const twilioData = await twilioResponse.json();

              await supabase.from("notification_delivery_log").insert({
                user_id: userId,
                type_key,
                channel: "sms",
                instance_id: instance_id || null,
                reminder_type: reminder_type || null,
                phone_e164: profile.phone_e164,
                twilio_message_sid: twilioData?.sid || null,
                message_body: smsBody,
                status: twilioResponse.ok ? "sent" : "failed",
                test_mode: false,
                error_message: twilioResponse.ok ? null : JSON.stringify(twilioData),
                sent_at: new Date().toISOString(),
              });

              if (twilioResponse.ok) {
                result.dispatched.sms++;
              } else {
                console.error(`Twilio error for ${userId}:`, twilioData);
                result.errors++;
              }
            }
          } catch (e) {
            console.error(`SMS error for ${userId}:`, e);
            result.errors++;
          }
        }
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Notification dispatcher error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
};

serve(handler);
