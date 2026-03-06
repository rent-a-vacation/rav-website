/**
 * Launch Readiness Checks
 *
 * Pure functions that evaluate whether the platform is ready for production launch.
 * Each check returns a CheckResult with pass/fail, category, and description.
 */

export interface CheckResult {
  id: string;
  category: "infrastructure" | "payments" | "security" | "content" | "monitoring";
  label: string;
  description: string;
  status: "pass" | "fail" | "warn" | "manual";
  detail?: string;
}

// ---------------------------------------------------------------------------
// Individual check functions (pure — take data, return result)
// ---------------------------------------------------------------------------

export function checkSupabaseConnectivity(connected: boolean): CheckResult {
  return {
    id: "supabase",
    category: "infrastructure",
    label: "Supabase Connectivity",
    description: "Database and auth services are reachable",
    status: connected ? "pass" : "fail",
    detail: connected ? "Connected" : "Cannot reach Supabase",
  };
}

export function checkSupabaseEnvironment(url: string | undefined): CheckResult {
  const isProd = url?.includes("xzfllqndrlmhclqfybew");
  const isDev = url?.includes("oukbxqnlxnkainnligfz");
  return {
    id: "supabase-env",
    category: "infrastructure",
    label: "Supabase Environment",
    description: "Must point to PROD project for launch",
    status: isProd ? "pass" : isDev ? "fail" : "warn",
    detail: isProd
      ? "Production (xzfllqndrlmhclqfybew)"
      : isDev
        ? "DEV (oukbxqnlxnkainnligfz) — must switch to PROD"
        : `Unknown: ${url ?? "not set"}`,
  };
}

export function checkStripeMode(checkoutUrl: string | undefined): CheckResult {
  // Stripe mode is determined server-side via STRIPE_SECRET_KEY in edge functions.
  // On the frontend we can only check if the checkout edge function is available.
  // The real check is whether the Supabase secret uses sk_live_ vs sk_test_.
  return {
    id: "stripe-mode",
    category: "payments",
    label: "Stripe Live Mode",
    description: "Stripe secret key must be live mode (sk_live_) on PROD",
    status: "manual",
    detail: "Verify in Supabase Dashboard > Edge Functions > Secrets that STRIPE_SECRET_KEY starts with sk_live_",
  };
}

export function checkStripeWebhook(): CheckResult {
  return {
    id: "stripe-webhook",
    category: "payments",
    label: "Stripe Webhook Configured",
    description: "Webhook endpoint registered in Stripe Dashboard pointing to PROD edge function",
    status: "manual",
    detail: "Verify in Stripe Dashboard > Developers > Webhooks that endpoint URL points to PROD Supabase project",
  };
}

export function checkSeedDataOnProd(
  hasTestAccounts: boolean,
  isProd: boolean
): CheckResult {
  if (!isProd) {
    return {
      id: "seed-data",
      category: "security",
      label: "No Seed Data on PROD",
      description: "Test/seed accounts must not exist on production",
      status: "warn",
      detail: "Not on PROD — check skipped",
    };
  }
  return {
    id: "seed-data",
    category: "security",
    label: "No Seed Data on PROD",
    description: "Test/seed accounts must not exist on production",
    status: hasTestAccounts ? "fail" : "pass",
    detail: hasTestAccounts
      ? "Found test accounts (@rent-a-vacation.com dev emails) — run cleanup before launch"
      : "No test accounts found",
  };
}

export function checkEmailSender(): CheckResult {
  return {
    id: "email-sender",
    category: "infrastructure",
    label: "Email Sender (Resend)",
    description: "Transactional email domain verified and API key set",
    status: "manual",
    detail: "Verify in Resend dashboard that updates.rent-a-vacation.com domain is verified and RESEND_API_KEY is set in Supabase secrets",
  };
}

export function checkSentryDsn(dsn: string | undefined): CheckResult {
  return {
    id: "sentry",
    category: "monitoring",
    label: "Sentry Error Monitoring",
    description: "Sentry DSN configured for error tracking",
    status: dsn ? "pass" : "fail",
    detail: dsn ? "DSN configured" : "VITE_SENTRY_DSN not set",
  };
}

export function checkGoogleAnalytics(): CheckResult {
  // GA4 is hardcoded in analytics.ts as G-G2YCVHNS25, loaded on cookie consent
  return {
    id: "ga4",
    category: "monitoring",
    label: "Google Analytics (GA4)",
    description: "GA4 measurement ID configured and gated behind cookie consent",
    status: "pass",
    detail: "G-G2YCVHNS25 hardcoded in src/lib/analytics.ts, loaded on consent",
  };
}

export function checkLegalPages(
  termsExists: boolean,
  privacyExists: boolean
): CheckResult {
  const both = termsExists && privacyExists;
  return {
    id: "legal-pages",
    category: "content",
    label: "Legal Pages (ToS & Privacy)",
    description: "Terms of Service and Privacy Policy pages exist with real content",
    status: both ? "warn" : "fail",
    detail: both
      ? "Pages exist but need legal review (#80) — content may be placeholder"
      : `Missing: ${!termsExists ? "/terms" : ""}${!termsExists && !privacyExists ? ", " : ""}${!privacyExists ? "/privacy" : ""}`,
  };
}

export function checkStaffOnlyMode(isStaffOnly: boolean): CheckResult {
  return {
    id: "staff-only",
    category: "security",
    label: "Staff Only Mode",
    description: "Must be OFF for public launch",
    status: isStaffOnly ? "warn" : "pass",
    detail: isStaffOnly
      ? "Currently ON — platform is locked to RAV team only"
      : "OFF — platform is open to all approved users",
  };
}

export function checkDnsSsl(): CheckResult {
  return {
    id: "dns-ssl",
    category: "infrastructure",
    label: "DNS & SSL",
    description: "rent-a-vacation.com resolves correctly with valid SSL",
    status: "manual",
    detail: "Verify https://rent-a-vacation.com loads without certificate errors",
  };
}

export function checkRlsPolicies(): CheckResult {
  return {
    id: "rls",
    category: "security",
    label: "RLS Policies Reviewed",
    description: "Row Level Security policies verified on all tables",
    status: "manual",
    detail: "Review Supabase Dashboard > Authentication > Policies for all public tables",
  };
}

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

export function computeReadinessScore(checks: CheckResult[]): {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  manual: number;
  percentage: number;
} {
  const passed = checks.filter((c) => c.status === "pass").length;
  const failed = checks.filter((c) => c.status === "fail").length;
  const warnings = checks.filter((c) => c.status === "warn").length;
  const manual = checks.filter((c) => c.status === "manual").length;
  const total = checks.length;
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
  return { total, passed, failed, warnings, manual, percentage };
}
