import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildEmailHtml, infoBox } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ApprovalEmailRequest {
  user_id: string;
  action: "approved" | "rejected";
  rejection_reason?: string;
  email_type?: "user_approval" | "role_upgrade";
  requested_role?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, action, rejection_reason, email_type, requested_role }: ApprovalEmailRequest =
      await req.json();

    if (!user_id || !action) {
      throw new Error("Missing required fields: user_id and action");
    }

    // Fetch user profile
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user_id)
      .single();

    if (profileError || !profile) {
      throw new Error("User not found");
    }

    const name = profile.full_name || "there";
    const firstName = name.split(" ")[0];
    const isRoleUpgrade = email_type === "role_upgrade";
    const roleLabel = requested_role === "property_owner" ? "Property Owner" : requested_role || "new role";

    let subject: string;
    let heading: string;
    let body: string;
    let cta: { label: string; url: string } | undefined;

    if (isRoleUpgrade && action === "approved") {
      subject = `Your ${roleLabel} role has been approved!`;
      heading = "Role Upgrade Approved!";
      body = `
        <p><strong>Great news!</strong> Your request to become a <strong>${roleLabel}</strong> has been approved.</p>
        <p>You now have access to the Owner Dashboard where you can:</p>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li>Register your vacation club properties</li>
          <li>Create and manage listings</li>
          <li>Receive bookings and earn income</li>
          <li>Track your earnings and payouts</li>
        </ul>`;
      cta = { label: "Go to Owner Dashboard", url: "https://rent-a-vacation.com/owner-dashboard" };
    } else if (isRoleUpgrade && action === "rejected") {
      subject = `Update on your ${roleLabel} role request`;
      heading = "Role Request Update";
      body = `
        <p>Thank you for your interest in becoming a ${roleLabel} on Rent-A-Vacation.</p>
        <p>Unfortunately, we're unable to approve your role upgrade request at this time.</p>
        ${rejection_reason ? infoBox(`<strong>Reason:</strong> ${rejection_reason}`, "warning") : ""}
        <p>You can submit a new request at any time.</p>`;
    } else if (action === "approved") {
      subject = "Your Rent-A-Vacation account has been approved!";
      heading = "Welcome to Rent-A-Vacation!";
      body = `
        <p><strong>Great news!</strong> Your account has been approved and you now have full access to Rent-A-Vacation.</p>
        <p>Log in to complete a quick welcome step and get started:</p>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li>Browse and book vacation rentals</li>
          <li>Name Your Price on open listings</li>
          <li>Post Vacation Wishes to get owner proposals</li>
          <li>List your own timeshare properties</li>
        </ul>
        <p style="margin-top: 16px;">Click the button below to log in and begin.</p>`;
      cta = { label: "Log In to Your Account", url: "https://rent-a-vacation.com/login" };
    } else {
      subject = "Update on your Rent-A-Vacation account";
      heading = "Account Update";
      body = `
        <p>Thank you for your interest in Rent-A-Vacation.</p>
        <p>Unfortunately, we're unable to approve your account at this time.</p>
        ${rejection_reason ? infoBox(`<strong>Reason:</strong> ${rejection_reason}`, "warning") : ""}
        <p>If you believe this is an error, please reply to this email and we'll be happy to help.</p>`;
    }

    const html = buildEmailHtml({ recipientName: firstName, heading, body, cta });

    console.log(
      `[APPROVAL-EMAIL] Sending ${action} email to: ${profile.email}`
    );

    const emailResponse = await resend.emails.send({
      from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
      to: [profile.email],
      subject,
      html,
    });

    console.log("[APPROVAL-EMAIL] Email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, email_sent: true, action }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("[APPROVAL-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
