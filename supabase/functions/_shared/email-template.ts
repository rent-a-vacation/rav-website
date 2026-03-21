/**
 * Shared email template for all Rent-A-Vacation emails.
 * Clean, professional design inspired by best-in-class transactional emails.
 */

const BRAND_COLOR = "#0d6b5c";
const ACCENT_COLOR = "#e86a4a";
const TEXT_COLOR = "#2d3748";
const MUTED_COLOR = "#718096";
const BG_COLOR = "#f7fafc";
const LOGO_URL = "https://rent-a-vacation.com/rav-logo.png";
const SITE_URL = "https://rent-a-vacation.com";

interface EmailTemplateOptions {
  /** Recipient's first name */
  recipientName?: string;
  /** Main heading displayed in the header bar */
  heading: string;
  /** Body content as HTML string */
  body: string;
  /** Optional CTA button */
  cta?: { label: string; url: string };
  /** Optional footer note (overrides default) */
  footerNote?: string;
}

/**
 * Wraps email content in a clean, professional layout.
 * Matches Koala-style minimal design: branded header, clean body, sign-off, footer with logo.
 */
export function buildEmailHtml(options: EmailTemplateOptions): string {
  const { recipientName, heading, body, cta, footerNote } = options;

  const ctaHtml = cta
    ? `
      <div style="margin: 32px 0;">
        <a href="${cta.url}" 
           style="background: ${ACCENT_COLOR}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">
          ${cta.label}
        </a>
      </div>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: ${BG_COLOR}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${BG_COLOR};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #1a4a3a 100%); padding: 28px 40px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">
                ${heading}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background: #ffffff; padding: 36px 40px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
              ${recipientName ? `<p style="font-size: 15px; color: ${TEXT_COLOR}; line-height: 1.6; margin: 0 0 20px 0;"><strong>Hi ${recipientName},</strong></p>` : ""}
              
              <div style="font-size: 15px; color: ${TEXT_COLOR}; line-height: 1.7;">
                ${body}
              </div>

              ${ctaHtml}

              <p style="font-size: 15px; color: ${TEXT_COLOR}; line-height: 1.6; margin: 24px 0 0 0;">
                If you have any questions, please feel free to reach out to us at
                <a href="mailto:support@rent-a-vacation.com" style="color: ${BRAND_COLOR}; text-decoration: none;">support@rent-a-vacation.com</a>.
              </p>

              <p style="font-size: 15px; color: ${TEXT_COLOR}; margin: 24px 0 4px 0;">Best,</p>
              <p style="font-size: 15px; color: ${TEXT_COLOR}; margin: 0;"><strong>—The Rent-A-Vacation Team</strong></p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #ffffff; padding: 24px 40px 32px; border-top: 1px solid #e2e8f0; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; text-align: center;">
              <img src="${LOGO_URL}" alt="Rent-A-Vacation" width="140" style="display: inline-block; margin-bottom: 12px;" />
              <p style="font-size: 12px; color: ${MUTED_COLOR}; margin: 0 0 12px 0;">
                ${footerNote || "Name Your Price. Book Your Paradise."}
              </p>
              <!-- Social Links -->
              <p style="margin: 0 0 12px 0;">
                <a href="https://facebook.com/rentavacation" style="color: ${MUTED_COLOR}; text-decoration: none; margin: 0 8px;">Facebook</a>
                <span style="color: #e2e8f0;">|</span>
                <a href="https://instagram.com/rentavacation" style="color: ${MUTED_COLOR}; text-decoration: none; margin: 0 8px;">Instagram</a>
                <span style="color: #e2e8f0;">|</span>
                <a href="https://linkedin.com/company/rent-a-vacation" style="color: ${MUTED_COLOR}; text-decoration: none; margin: 0 8px;">LinkedIn</a>
                <span style="color: #e2e8f0;">|</span>
                <a href="https://x.com/rentavacation" style="color: ${MUTED_COLOR}; text-decoration: none; margin: 0 8px;">X</a>
              </p>
              <p style="font-size: 12px; color: ${MUTED_COLOR}; margin: 0;">
                <a href="${SITE_URL}" style="color: ${MUTED_COLOR}; text-decoration: underline;">rentavacation.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Builds a detail row for key-value data (e.g., Listing ID, Resort, Dates).
 */
export function detailRow(label: string, value: string): string {
  return `<p style="margin: 0 0 6px 0;"><strong>${label}:</strong> ${value}</p>`;
}

/**
 * Builds a highlighted info/warning box.
 */
export function infoBox(content: string, variant: "info" | "warning" | "error" | "success" = "info"): string {
  const colors = {
    info: { bg: "#ebf8ff", border: BRAND_COLOR, text: "#2a4365" },
    warning: { bg: "#fffbeb", border: "#d69e2e", text: "#744210" },
    error: { bg: "#fff5f5", border: "#e53e3e", text: "#742a2a" },
    success: { bg: "#f0fff4", border: "#38a169", text: "#22543d" },
  };
  const c = colors[variant];
  return `
    <div style="background: ${c.bg}; padding: 16px 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${c.border};">
      <p style="margin: 0; font-size: 14px; color: ${c.text}; line-height: 1.6;">${content}</p>
    </div>`;
}
