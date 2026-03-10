/**
 * API Key authentication and authorization for the Public API gateway.
 * Handles key validation, rate limiting, scope checking, and request logging.
 */

// Use minimal interface to avoid import conflicts between esm.sh and npm
type SupabaseClientLike = {
  rpc: (fn: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };
};

export interface ApiKeyRecord {
  key_id: string;
  owner_user_id: string;
  name: string;
  scopes: string[];
  tier: string;
  daily_limit: number;
  per_minute_limit: number;
  daily_usage: number;
  daily_usage_reset_at: string;
}

/**
 * Extract and validate an API key from the request.
 * Returns the key record if valid, null if no key or invalid.
 */
export async function validateApiKey(
  supabase: SupabaseClientLike,
  request: Request
): Promise<ApiKeyRecord | null> {
  const apiKey = request.headers.get("X-API-Key");
  if (!apiKey) return null;

  // Validate format: rav_pk_<32 hex chars>
  if (!/^rav_pk_[a-f0-9]{32}$/.test(apiKey)) return null;

  const keyHash = await hashApiKey(apiKey);
  const { data, error } = await supabase.rpc("validate_api_key", {
    p_key_hash: keyHash,
  });

  if (error) {
    console.error("[API-AUTH] Key validation error:", error.message);
    return null;
  }

  const records = data as ApiKeyRecord[];
  if (!records || records.length === 0) return null;

  return records[0];
}

/**
 * Check if an API key has the required scope.
 */
export function hasScope(keyScopes: string[], requiredScope: string): boolean {
  // Wildcard scope grants all access
  if (keyScopes.includes("*")) return true;

  // Direct match
  if (keyScopes.includes(requiredScope)) return true;

  // Parent scope match: "listings:read" matches "listings"
  const parentScope = requiredScope.split(":")[0];
  if (keyScopes.includes(parentScope)) return true;

  return false;
}

/**
 * Increment API key daily usage counter.
 * Returns true if within limit, false if rate limit exceeded.
 */
export async function checkApiKeyRateLimit(
  supabase: SupabaseClientLike,
  keyId: string
): Promise<boolean> {
  const { data: allowed, error } = await supabase.rpc("increment_api_key_usage", {
    p_key_id: keyId,
  });

  if (error) {
    // Fail-open on rate limit check errors
    console.error("[API-AUTH] Rate limit check error:", error.message);
    return true;
  }

  return allowed as boolean;
}

/**
 * Log an API request (fire-and-forget — errors are swallowed).
 */
export function logApiRequest(
  supabase: SupabaseClientLike,
  params: {
    keyId: string | null;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTimeMs: number;
    ipAddress: string | null;
    userAgent: string | null;
  }
): void {
  // Fire-and-forget — don't await
  supabase.from("api_request_log").insert({
    key_id: params.keyId,
    endpoint: params.endpoint,
    method: params.method,
    status_code: params.statusCode,
    response_time_ms: params.responseTimeMs,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
  }).then(({ error }) => {
    if (error) {
      console.error("[API-AUTH] Request log error:", error.message);
    }
  });
}

/**
 * SHA-256 hash of an API key string.
 */
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate a new API key in the format: rav_pk_<32 hex chars>
 */
export function generateApiKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `rav_pk_${hex}`;
}

/** Rate limit tiers with default limits */
export const API_KEY_TIERS = {
  free: { daily: 100, perMinute: 10 },
  partner: { daily: 10_000, perMinute: 100 },
  premium: { daily: 100_000, perMinute: 500 },
} as const;
