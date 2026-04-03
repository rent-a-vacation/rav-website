import { supabase, isSupabaseConfigured } from './supabase';

export type EmailType = 'welcome' | 'password-reset' | 'verification' | 'notification' | 'contact';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  type?: EmailType;
}

interface EmailResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

// ── Shared email layout ──────────────────────────────────────────
// IMPORTANT: Keep in sync with supabase/functions/_shared/email-template.ts
// Frontend can't import Deno modules, so this is a mirrored copy.
const BRAND_COLOR = "#0d6b5c";
const ACCENT_COLOR = "#e86a4a";
const TEXT_COLOR = "#2d3748";
const MUTED_COLOR = "#718096";
const BG_COLOR = "#f7fafc";
const LOGO_URL = "https://rent-a-vacation.com/rav-logo.png";
const SITE_URL = "https://rent-a-vacation.com";

function wrapEmail(opts: { recipientName?: string; heading: string; body: string; ctaLabel?: string; ctaUrl?: string; footerNote?: string }): string {
  const cta = opts.ctaLabel && opts.ctaUrl
    ? `<div style="margin: 32px 0;">
        <a href="${opts.ctaUrl}" style="background: ${ACCENT_COLOR}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">${opts.ctaLabel}</a>
      </div>`
    : "";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};"><tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="background:linear-gradient(135deg,${BRAND_COLOR} 0%,#1a4a3a 100%);padding:28px 40px;border-radius:8px 8px 0 0;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${opts.heading}</h1>
  </td></tr>
  <tr><td style="background:#ffffff;padding:36px 40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
    ${opts.recipientName ? `<p style="font-size:15px;color:${TEXT_COLOR};line-height:1.6;margin:0 0 20px 0;"><strong>Hi ${opts.recipientName},</strong></p>` : ""}
    <div style="font-size:15px;color:${TEXT_COLOR};line-height:1.7;">${opts.body}</div>
    ${cta}
    <p style="font-size:15px;color:${TEXT_COLOR};line-height:1.6;margin:24px 0 0 0;">If you have any questions, please feel free to reach out to us at <a href="mailto:support@rent-a-vacation.com" style="color:${BRAND_COLOR};text-decoration:none;">support@rent-a-vacation.com</a>.</p>
    <p style="font-size:15px;color:${TEXT_COLOR};margin:24px 0 4px 0;">Best,</p>
    <p style="font-size:15px;color:${TEXT_COLOR};margin:0;"><strong>—The Rent-A-Vacation Team</strong></p>
  </td></tr>
  <tr><td style="background:#ffffff;padding:24px 40px 32px;border-top:1px solid #e2e8f0;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-radius:0 0 8px 8px;text-align:center;">
    <img src="${LOGO_URL}" alt="Rent-A-Vacation" width="140" style="display:inline-block;margin-bottom:12px;" />
    <p style="font-size:12px;color:${MUTED_COLOR};margin:0 0 12px 0;">${opts.footerNote || "Name Your Price. Book Your Paradise."}</p>
    <p style="margin:0 0 12px 0;">
      <a href="https://facebook.com/rentavacation" style="color:${MUTED_COLOR};text-decoration:none;margin:0 8px;">Facebook</a>
      <span style="color:#e2e8f0;">|</span>
      <a href="https://instagram.com/rentavacation" style="color:${MUTED_COLOR};text-decoration:none;margin:0 8px;">Instagram</a>
      <span style="color:#e2e8f0;">|</span>
      <a href="https://linkedin.com/company/rent-a-vacation" style="color:${MUTED_COLOR};text-decoration:none;margin:0 8px;">LinkedIn</a>
      <span style="color:#e2e8f0;">|</span>
      <a href="https://x.com/rentavacation" style="color:${MUTED_COLOR};text-decoration:none;margin:0 8px;">X</a>
    </p>
    <p style="font-size:12px;color:${MUTED_COLOR};margin:0;"><a href="${SITE_URL}" style="color:${MUTED_COLOR};text-decoration:underline;">rentavacation.com</a></p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

/**
 * Send an email using the Resend API via edge function
 */
export const sendEmail = async (params: SendEmailParams): Promise<EmailResponse> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot send email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }

    return data as EmailResponse;
  } catch (err: unknown) {
    console.error('Email send error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

/**
 * Send a welcome email to a new user
 */
export const sendWelcomeEmail = async (to: string, userName: string): Promise<EmailResponse> => {
  return sendEmail({
    to,
    subject: 'Welcome to Rent-A-Vacation!',
    type: 'welcome',
    html: wrapEmail({
      recipientName: userName || undefined,
      heading: 'Welcome to Rent-A-Vacation!',
      body: `
        <p>Welcome! We're excited to have you join our community of travelers and timeshare owners.</p>
        <p>With Rent-A-Vacation, you can:</p>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li>Save 20-40% on luxury resort stays</li>
          <li>Access exclusive members-only vacation clubs</li>
          <li>List your timeshare and earn extra income</li>
        </ul>
      `,
      ctaLabel: 'Start Exploring',
      ctaUrl: 'https://rentavacation.lovable.app/rentals',
    }),
  });
};

/**
 * Send a contact form submission notification
 */
/**
 * Send confirmation email when a listing is submitted for review
 */
export const sendListingSubmittedEmail = async (
  to: string,
  ownerName: string,
  details: { resortName: string; location: string; checkIn: string; checkOut: string; price: number; nightlyRate?: number; nights?: number }
): Promise<EmailResponse> => {
  const priceDisplay = details.nightlyRate && details.nights
    ? `$${details.nightlyRate}/night (${details.nights} nights, $${details.price.toLocaleString()} total)`
    : `$${details.price.toLocaleString()}`;
  return sendEmail({
    to,
    subject: 'Listing Submitted for Review - Rent-A-Vacation',
    type: 'notification',
    html: wrapEmail({
      recipientName: ownerName || undefined,
      heading: 'Listing Submitted for Review',
      body: `
        <p>Your listing has been submitted and is now pending review.</p>
        <div style="background: #f7fafc; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0 0 6px 0;"><strong>Resort:</strong> ${details.resortName}</p>
          <p style="margin: 0 0 6px 0;"><strong>Location:</strong> ${details.location}</p>
          <p style="margin: 0 0 6px 0;"><strong>Dates:</strong> ${details.checkIn} — ${details.checkOut}</p>
          <p style="margin: 0;"><strong>Your Price:</strong> ${priceDisplay}</p>
        </div>
        <div style="background: #ebf8ff; padding: 16px 20px; border-radius: 6px; border-left: 4px solid ${BRAND_COLOR}; margin: 16px 0;">
          <p style="margin: 0 0 8px 0; font-weight: 600;">What happens next?</p>
          <ul style="margin: 0; padding-left: 18px; line-height: 1.8;">
            <li>Our team reviews listings within 24 hours</li>
            <li>You'll receive an email when your listing is approved</li>
            <li>Once approved, your listing goes live for travelers to book</li>
          </ul>
        </div>
      `,
      ctaLabel: 'View Your Listings',
      ctaUrl: `${SITE_URL}/owner-dashboard?tab=listings`,
    }),
  });
};

/**
 * Send confirmation email when a property is registered
 */
export const sendPropertyRegisteredEmail = async (
  to: string,
  ownerName: string,
  details: { brand: string; resortName: string; location: string; bedrooms: number }
): Promise<EmailResponse> => {
  return sendEmail({
    to,
    subject: 'Property Registered - Rent-A-Vacation',
    type: 'notification',
    html: wrapEmail({
      recipientName: ownerName || undefined,
      heading: 'Property Registered Successfully',
      body: `
        <p>Your vacation club property has been registered on Rent-A-Vacation.</p>
        <div style="background: #f7fafc; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0 0 6px 0;"><strong>Brand:</strong> ${details.brand}</p>
          <p style="margin: 0 0 6px 0;"><strong>Resort:</strong> ${details.resortName}</p>
          <p style="margin: 0 0 6px 0;"><strong>Location:</strong> ${details.location}</p>
          <p style="margin: 0;"><strong>Bedrooms:</strong> ${details.bedrooms}</p>
        </div>
        <div style="background: #ebf8ff; padding: 16px 20px; border-radius: 6px; border-left: 4px solid ${BRAND_COLOR}; margin: 16px 0;">
          <p style="margin: 0 0 8px 0; font-weight: 600;">Next step: Create a listing</p>
          <p style="margin: 0;">Now that your property is registered, create a listing with your available dates and pricing to start accepting bookings.</p>
        </div>
      `,
      ctaLabel: 'Create a Listing',
      ctaUrl: `${SITE_URL}/owner-dashboard?tab=listings`,
    }),
  });
};

/**
 * Send a contact form submission notification
 */
export const sendContactFormEmail = async (
  name: string,
  email: string,
  message: string
): Promise<EmailResponse> => {
  return sendEmail({
    to: 'support@rent-a-vacation.com',
    subject: `New Contact Form Submission from ${name}`,
    type: 'contact',
    html: wrapEmail({
      heading: 'New Contact Form Submission',
      body: `
        <p>A new message has been submitted through the contact form.</p>
        <div style="background: #f7fafc; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0 0 6px 0;"><strong>Name:</strong> ${name}</p>
          <p style="margin: 0 0 6px 0;"><strong>Email:</strong> ${email}</p>
        </div>
        <div style="background: #f7fafc; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0 0 6px 0;"><strong>Message:</strong></p>
          <p style="margin: 0;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        <p style="font-size: 13px; color: #718096;">Submitted at: ${new Date().toLocaleString()}</p>
      `,
      footerNote: 'Internal notification — do not forward.',
    }),
  });
};
