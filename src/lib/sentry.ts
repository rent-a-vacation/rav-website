import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export function initSentry() {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.VITE_SUPABASE_URL?.includes("oukbxqnlxnkainnligfz")
      ? "development"
      : "production",
    release: `rav-website@${__APP_VERSION__}`,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],

    // Capture 100% of errors, 5% of transactions (free tier: 10K/month)
    sampleRate: 1.0,
    tracesSampleRate: 0.05,

    // Session Replay — only record sessions that hit errors (free tier: 50/month)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    // Filter out noisy/irrelevant errors
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      "originalCreateNotification",
      "canvas.contentDocument",
      // Network errors users can't control
      "Failed to fetch",
      "NetworkError",
      "Load failed",
      // ResizeObserver (benign, from browser layout)
      "ResizeObserver loop",
    ],

    beforeSend(event) {
      // Strip PII from error reports
      if (event.user) {
        delete event.user.ip_address;
        delete event.user.email;
      }
      return event;
    },
  });
}

/**
 * Set the current user context for Sentry error reports.
 * Only sends user ID and role — no email/PII.
 */
export function setSentryUser(userId: string | null, role?: string) {
  if (!SENTRY_DSN) return;
  if (userId) {
    Sentry.setUser({ id: userId, ...(role ? { role } : {}) });
  } else {
    Sentry.setUser(null);
  }
}

export { Sentry };
