// Use a minimal interface to avoid import conflicts between esm.sh and npm: styles
type SupabaseClientLike = { rpc: (fn: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }> };

interface RateLimitConfig {
  endpoint: string;
  maxRequests: number;
  windowSeconds?: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Check rate limit for a user on a specific endpoint.
 * Uses the check_rate_limit RPC (database-backed sliding window).
 *
 * @returns { allowed: boolean, retryAfterSeconds?: number }
 */
export async function checkRateLimit(
  supabase: SupabaseClientLike,
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { endpoint, maxRequests, windowSeconds = 60 } = config;

  const { data: allowed, error } = await supabase.rpc("check_rate_limit", {
    p_user_id: userId,
    p_endpoint: endpoint,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    // On rate limit check failure, allow the request (fail-open)
    // but log the error for monitoring
    console.error(`[RATE-LIMIT] Error checking rate limit: ${error.message}`);
    return { allowed: true };
  }

  return {
    allowed: allowed as boolean,
    retryAfterSeconds: allowed ? undefined : windowSeconds,
  };
}

/**
 * Returns a 429 Too Many Requests response.
 */
export function rateLimitResponse(retryAfterSeconds: number = 60): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: "Too many requests. Please try again later.",
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}

/** Rate limit presets for common endpoints */
export const RATE_LIMITS = {
  /** Payment checkout: 5 requests per minute */
  CHECKOUT: { endpoint: "create-booking-checkout", maxRequests: 5, windowSeconds: 60 },
  /** Payment verification: 10 requests per minute */
  VERIFY_PAYMENT: { endpoint: "verify-booking-payment", maxRequests: 10, windowSeconds: 60 },
  /** Text chat: 20 messages per minute */
  TEXT_CHAT: { endpoint: "text-chat", maxRequests: 20, windowSeconds: 60 },
  /** Cancellation: 3 requests per minute */
  CANCELLATION: { endpoint: "process-cancellation", maxRequests: 3, windowSeconds: 60 },
  /** Check-in confirm / report-issue: 5 requests per minute (idempotency layer is at the handler) */
  CHECKIN_CONFIRMATION: { endpoint: "confirm-checkin", maxRequests: 5, windowSeconds: 60 },
  /** Dispute refund (admin): 5 requests per minute */
  DISPUTE_REFUND: { endpoint: "process-dispute-refund", maxRequests: 5, windowSeconds: 60 },
  /** Account deletion: 3 requests per minute */
  ACCOUNT_DELETION: { endpoint: "delete-user-account", maxRequests: 3, windowSeconds: 60 },
  /** Data export: 3 requests per 5 minutes */
  DATA_EXPORT: { endpoint: "export-user-data", maxRequests: 3, windowSeconds: 300 },
  /** Subscription checkout: 5 requests per minute */
  SUBSCRIPTION_CHECKOUT: { endpoint: "create-subscription-checkout", maxRequests: 5, windowSeconds: 60 },
  /** Manage subscription (billing portal): 10 requests per minute */
  MANAGE_SUBSCRIPTION: { endpoint: "manage-subscription", maxRequests: 10, windowSeconds: 60 },
} as const;
