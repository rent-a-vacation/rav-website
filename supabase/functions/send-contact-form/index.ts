import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { buildEmailHtml } from "../_shared/email-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  user_id?: string | null;
}

const SUBJECT_LABELS: Record<string, string> = {
  general: "General Inquiry",
  booking: "Booking Help",
  account: "Account Issue",
  listing: "Listing Support",
  payment: "Payment Question",
  feedback: "Feedback",
  other: "Other",
};

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message, user_id }: ContactFormRequest = await req.json();

    if (!name || !email || !subject || !message) {
      throw new Error("Missing required fields: name, email, subject, message");
    }

    const subjectLabel = SUBJECT_LABELS[subject] || subject;
    const safeMessage = escapeHtml(message);

    // Lazy-import Resend to avoid top-level npm import crash
    const { Resend } = await import("npm:resend@2.0.0");
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Send notification email to support team
    const supportHtml = buildEmailHtml({
      heading: `New Contact Form: ${subjectLabel}`,
      body: `
        <p>A visitor has submitted a contact form on the website.</p>
        <p style="margin: 0 0 6px 0;"><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p style="margin: 0 0 6px 0;"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
        <p style="margin: 0 0 6px 0;"><strong>Subject:</strong> ${subjectLabel}</p>
        <p style="margin: 0 0 6px 0;"><strong>User:</strong> ${user_id || "Not logged in"}</p>
        <div style="margin-top: 20px; padding: 16px; background: #f7fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 8px 0; font-weight: 600;">Message:</p>
          <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
        </div>`,
      footerNote: "Internal notification — do not forward.",
    });

    const supportEmail = await resend.emails.send({
      from: "Rent-A-Vacation Support <support@updates.rent-a-vacation.com>",
      to: ["support@rent-a-vacation.com"],
      replyTo: email,
      subject: `[Contact Form] ${subjectLabel} — from ${name}`,
      html: supportHtml,
    });

    console.log("[CONTACT-FORM] Support email sent:", supportEmail);

    // Send confirmation email to the submitter
    const confirmHtml = buildEmailHtml({
      recipientName: name.split(" ")[0],
      heading: "We Received Your Message",
      body: `
        <p>Thank you for contacting Rent-A-Vacation. We've received your message and will get back to you within 24 hours.</p>
        <p><strong>Your message summary:</strong></p>
        <p style="margin: 0 0 6px 0;"><strong>Subject:</strong> ${subjectLabel}</p>
        <div style="margin-top: 12px; padding: 16px; background: #f7fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
          <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
        </div>`,
    });

    const confirmEmail = await resend.emails.send({
      from: "Rent-A-Vacation Support <support@updates.rent-a-vacation.com>",
      to: [email],
      subject: "We received your message — Rent-A-Vacation",
      html: confirmHtml,
    });

    console.log("[CONTACT-FORM] Confirmation email sent:", confirmEmail);

    return new Response(
      JSON.stringify({ success: true, email_sent: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("[CONTACT-FORM] Error:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: errMsg }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
