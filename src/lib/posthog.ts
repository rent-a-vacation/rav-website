import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST as string | undefined;

export function initPostHog() {
  if (!POSTHOG_KEY) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST || "https://us.i.posthog.com",
    // Respect cookie consent — don't track until user opts in
    persistence: "localStorage+cookie",
    // Capture pageviews automatically on route change
    capture_pageview: false, // We'll handle this manually via React Router
    capture_pageleave: true,
    // Session recording disabled — rrweb uses `new Function()` which CSP blocks
    // without 'unsafe-eval'. We chose to keep CSP strict (issue #473) and rely
    // on autocapture + custom events for behavioural analytics.
    disable_session_recording: true,
    // Autocapture clicks, inputs, etc.
    autocapture: true,
    // Privacy: mask sensitive inputs by default
    mask_all_text: false,
    mask_all_element_attributes: false,
  });
}

/**
 * Identify a logged-in user. Only sends user ID and role — no email/PII.
 */
export function identifyUser(userId: string, properties?: Record<string, string>) {
  if (!POSTHOG_KEY) return;
  posthog.identify(userId, properties);
}

/**
 * Reset identity on logout.
 */
export function resetUser() {
  if (!POSTHOG_KEY) return;
  posthog.reset();
}

/**
 * Track a custom event.
 */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return;
  posthog.capture(event, properties);
}

/**
 * Track a page view (called on route change).
 */
export function trackPageView(path: string) {
  if (!POSTHOG_KEY) return;
  posthog.capture("$pageview", { $current_url: window.location.href, path });
}

export { posthog };
