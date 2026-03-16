/**
 * Twilio Webhook Handler — Delivery status updates & STOP opt-out.
 * GitHub Issue: #219
 *
 * Accepts POST from Twilio at /functions/v1/twilio-webhook.
 * - Validates X-Twilio-Signature header
 * - Updates notification_delivery_log on delivery status changes
 * - Handles STOP/opt-out: disables SMS for the user (TCPA compliance)
 * - Returns valid TwiML response
 *
 * Required environment variables:
 *   TWILIO_AUTH_TOKEN
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const TWIML_RESPONSE = '<?xml version="1.0" encoding="UTF-8"?>\n<Response/>';

function buildTwimlResponse(status = 200): Response {
  return new Response(TWIML_RESPONSE, {
    status,
    headers: { "Content-Type": "text/xml" },
  });
}

/**
 * Validates Twilio request signature per:
 * https://www.twilio.com/docs/usage/security#validating-requests
 * Uses Web Crypto API (built-in, no external deps).
 */
async function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>,
): Promise<boolean> {
  // Build the data string: URL + sorted params concatenated
  let data = url;
  const sortedKeys = Object.keys(params).sort();
  for (const key of sortedKeys) {
    data += key + params[key];
  }

  // HMAC-SHA1 via Web Crypto API, base64 encoded
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(authToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const expectedSig = base64Encode(new Uint8Array(sig));
  return expectedSig === signature;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return buildTwimlResponse(405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Parse form-encoded body
    const bodyText = await req.text();
    const params: Record<string, string> = {};
    for (const pair of bodyText.split("&")) {
      const [key, value] = pair.split("=").map(decodeURIComponent);
      if (key) params[key] = value || "";
    }

    console.log("[Twilio Webhook] Received:", JSON.stringify(params));

    // Validate Twilio signature
    const signature = req.headers.get("X-Twilio-Signature") || "";
    const webhookUrl = `${supabaseUrl}/functions/v1/twilio-webhook`;

    if (twilioAuthToken && signature) {
      const isValid = await validateTwilioSignature(twilioAuthToken, signature, webhookUrl, params);
      if (!isValid) {
        console.error("[Twilio Webhook] Invalid signature — rejecting request");
        return buildTwimlResponse(403);
      }
    }

    const messageSid = params.MessageSid || params.SmsSid || "";
    const messageStatus = params.MessageStatus || params.SmsStatus || "";
    const to = params.To || "";
    const from = params.From || "";
    const body = params.Body || "";
    const errorCode = params.ErrorCode || "";

    // Handle STOP opt-out (inbound message)
    if (body.trim().toUpperCase() === "STOP") {
      console.log(`[Twilio Webhook] STOP received from ${from} — opting out`);

      // Update profiles: set sms_opted_in = false
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .update({
          sms_opted_in: false,
          sms_opted_out_at: new Date().toISOString(),
        })
        .eq("phone_e164", from)
        .select("id")
        .single();

      if (profileError) {
        console.error("[Twilio Webhook] Profile update error:", profileError.message);
      }

      if (profile) {
        // Disable all SMS channels in user_notification_preferences
        const { data: catalogRows } = await supabase
          .from("notification_catalog")
          .select("type_key")
          .eq("channel_sms_allowed", true);

        if (catalogRows) {
          for (const row of catalogRows) {
            await supabase
              .from("user_notification_preferences")
              .upsert(
                {
                  user_id: profile.id,
                  type_key: row.type_key,
                  channel: "sms",
                  enabled: false,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id,type_key,channel" },
              );
          }
        }

        console.log(`[Twilio Webhook] User ${profile.id} opted out of SMS`);
      }

      return buildTwimlResponse();
    }

    // Handle delivery status update
    if (messageSid && messageStatus) {
      console.log(`[Twilio Webhook] Status update: ${messageSid} → ${messageStatus}`);

      // Map Twilio statuses to our statuses
      let ourStatus: string;
      switch (messageStatus.toLowerCase()) {
        case "delivered":
          ourStatus = "delivered";
          break;
        case "sent":
          ourStatus = "sent";
          break;
        case "failed":
        case "undelivered":
          ourStatus = "failed";
          break;
        default:
          // queued, accepted, sending — don't update
          ourStatus = "";
      }

      if (ourStatus) {
        const updateData: Record<string, unknown> = { status: ourStatus };
        if (ourStatus === "delivered") {
          updateData.delivered_at = new Date().toISOString();
        }
        if (errorCode) {
          updateData.error_message = `Twilio error ${errorCode}`;
        }

        const { error: updateError } = await supabase
          .from("notification_delivery_log")
          .update(updateData)
          .eq("twilio_message_sid", messageSid);

        if (updateError) {
          console.error("[Twilio Webhook] Delivery log update error:", updateError.message);
        }
      }
    }

    return buildTwimlResponse();
  } catch (error) {
    console.error("[Twilio Webhook] Error:", error);
    return buildTwimlResponse(500);
  }
};

serve(handler);
