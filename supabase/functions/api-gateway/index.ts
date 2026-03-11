import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateApiKey, hasScope, checkApiKeyRateLimit, logApiRequest, checkIpAllowlist } from "../_shared/api-auth.ts";
import { apiSuccess, apiError, corsResponse, parsePagination, withRateLimitHeaders } from "../_shared/api-response.ts";
import { searchProperties } from "../_shared/property-search.ts";
import { DESTINATIONS } from "../_shared/destinations.ts";
import type { ApiKeyRecord } from "../_shared/api-auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ─── Route definitions ─────────────────────────────────────────────────────

interface RouteConfig {
  method: string;
  scope: string;
  handler: (req: Request, supabase: ReturnType<typeof createClient>, url: URL) => Promise<Response>;
}

const routes: Record<string, RouteConfig> = {
  "GET /v1/listings": {
    method: "GET",
    scope: "listings:read",
    handler: handleListings,
  },
  "GET /v1/listings/:id": {
    method: "GET",
    scope: "listings:read",
    handler: handleListingById,
  },
  "POST /v1/search": {
    method: "POST",
    scope: "search",
    handler: handleSearch,
  },
  "GET /v1/destinations": {
    method: "GET",
    scope: "listings:read",
    handler: handleDestinations,
  },
  "GET /v1/resorts": {
    method: "GET",
    scope: "listings:read",
    handler: handleResorts,
  },
};

// ─── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return corsResponse();
  }

  const startTime = Date.now();
  const url = new URL(req.url);

  // Extract the path after /api-gateway (Supabase routes: /functions/v1/api-gateway/v1/...)
  const fullPath = url.pathname;
  const gatewayPrefix = "/api-gateway";
  const apiPath = fullPath.includes(gatewayPrefix)
    ? fullPath.substring(fullPath.indexOf(gatewayPrefix) + gatewayPrefix.length)
    : fullPath;

  // ── Auth: API Key or JWT ────────────────────────────────────────────────

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let apiKeyRecord: ApiKeyRecord | null = null;
  let authedViaJwt = false;

  // Try API key first
  apiKeyRecord = await validateApiKey(serviceClient, req);

  // If no API key, try JWT
  if (!apiKeyRecord) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      // Skip service role key — that's not a user JWT
      if (token !== SUPABASE_SERVICE_ROLE_KEY) {
        const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: { user }, error } = await userClient.auth.getUser();
        if (user && !error) {
          authedViaJwt = true;
        }
      }
    }
  }

  if (!apiKeyRecord && !authedViaJwt) {
    return apiError("unauthorized", "Missing or invalid authentication. Provide X-API-Key header or Authorization: Bearer <jwt>.", 401);
  }

  // ── IP allowlist check (API key only) ───────────────────────────────────

  if (apiKeyRecord && apiKeyRecord.allowed_ips) {
    const requestIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || null;
    if (!checkIpAllowlist(apiKeyRecord.allowed_ips, requestIp)) {
      logRequest(serviceClient, apiKeyRecord.key_id, "/ip-blocked", req, 403, startTime);
      return apiError("forbidden", "Request IP not in allowlist", 403);
    }
  }

  // ── Route matching ────────────────────────────────────────────────────────

  const { handler, scope, matchedPath } = matchRoute(req.method, apiPath);

  if (!handler) {
    return apiError("not_found", `No endpoint matches ${req.method} ${apiPath}`, 404);
  }

  // ── Scope check (API key only — JWT users have implicit access) ──────────

  if (apiKeyRecord && !hasScope(apiKeyRecord.scopes, scope)) {
    logRequest(serviceClient, apiKeyRecord?.key_id ?? null, matchedPath, req, 403, startTime);
    return apiError("forbidden", `API key missing required scope: ${scope}`, 403);
  }

  // ── Rate limit check (API key only — JWT uses existing per-user limits) ──

  if (apiKeyRecord) {
    const allowed = await checkApiKeyRateLimit(serviceClient, apiKeyRecord.key_id);
    if (!allowed) {
      logRequest(serviceClient, apiKeyRecord.key_id, matchedPath, req, 429, startTime);
      const retryAfter = 86400; // Daily limit — retry after 24h
      return new Response(
        JSON.stringify({
          error: { code: "rate_limit_exceeded", message: "Daily API key rate limit exceeded." },
          api_version: "v1",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  }

  // ── Execute handler ───────────────────────────────────────────────────────

  try {
    const response = await handler(req, serviceClient, url);

    // Add rate limit headers for API key requests
    let finalResponse = response;
    if (apiKeyRecord) {
      const remaining = apiKeyRecord.daily_limit - (apiKeyRecord.daily_usage + 1);
      const resetAt = new Date(apiKeyRecord.daily_usage_reset_at);
      resetAt.setHours(resetAt.getHours() + 24);
      finalResponse = withRateLimitHeaders(response, remaining, apiKeyRecord.daily_limit, resetAt);
    }

    logRequest(serviceClient, apiKeyRecord?.key_id ?? null, matchedPath, req, response.status, startTime);
    return finalResponse;
  } catch (err) {
    console.error(`[API-GATEWAY] Handler error on ${matchedPath}:`, err);
    logRequest(serviceClient, apiKeyRecord?.key_id ?? null, matchedPath, req, 500, startTime);
    return apiError("internal_error", "An unexpected error occurred.", 500);
  }
});

// ─── Route matching helper ──────────────────────────────────────────────────

function matchRoute(
  method: string,
  path: string
): { handler: RouteConfig["handler"] | null; scope: string; matchedPath: string } {
  // Normalize path: remove trailing slash
  const normalizedPath = path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;

  // Try exact match first
  const exactKey = `${method} ${normalizedPath}`;
  if (routes[exactKey]) {
    return { handler: routes[exactKey].handler, scope: routes[exactKey].scope, matchedPath: normalizedPath };
  }

  // Try parameterized match: /v1/listings/:id
  const parts = normalizedPath.split("/");
  if (parts.length === 4 && parts[1] === "v1" && parts[2] === "listings") {
    const paramKey = `${method} /v1/listings/:id`;
    if (routes[paramKey]) {
      return { handler: routes[paramKey].handler, scope: routes[paramKey].scope, matchedPath: normalizedPath };
    }
  }

  return { handler: null, scope: "", matchedPath: normalizedPath };
}

// ─── Fire-and-forget request logging ────────────────────────────────────────

function logRequest(
  supabase: ReturnType<typeof createClient>,
  keyId: string | null,
  endpoint: string,
  req: Request,
  status: number,
  startTime: number
) {
  logApiRequest(supabase, {
    keyId,
    endpoint,
    method: req.method,
    statusCode: status,
    responseTimeMs: Date.now() - startTime,
    ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? null,
    userAgent: req.headers.get("user-agent") ?? null,
  });
}

// ─── Route Handlers ─────────────────────────────────────────────────────────

/**
 * GET /v1/listings — Browse listings with filters and pagination
 */
async function handleListings(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  url: URL
): Promise<Response> {
  const { page, perPage, offset } = parsePagination(url);

  // Build query
  let query = supabase
    .from("listings")
    .select(`
      id,
      check_in_date,
      check_out_date,
      owner_price,
      nightly_rate,
      status,
      created_at,
      properties!inner (
        id,
        name,
        city,
        state,
        country,
        bedrooms,
        bathrooms,
        sleeps,
        amenities,
        images,
        resorts (
          id,
          name,
          brand,
          rating,
          amenities
        ),
        unit_types (
          id,
          name,
          square_footage
        )
      )
    `, { count: "exact" })
    .eq("status", "active");

  // Filters
  const destination = url.searchParams.get("destination");
  if (destination) {
    // Search city, state, or country
    query = query.or(
      `properties.city.ilike.%${destination}%,properties.state.ilike.%${destination}%,properties.country.ilike.%${destination}%`
    );
  }

  const minPrice = url.searchParams.get("min_price");
  if (minPrice) query = query.gte("owner_price", Number(minPrice));

  const maxPrice = url.searchParams.get("max_price");
  if (maxPrice) query = query.lte("owner_price", Number(maxPrice));

  const bedrooms = url.searchParams.get("bedrooms");
  if (bedrooms) query = query.gte("properties.bedrooms", Number(bedrooms));

  const brand = url.searchParams.get("brand");
  if (brand) query = query.ilike("properties.resorts.brand", `%${brand}%`);

  const checkIn = url.searchParams.get("check_in");
  if (checkIn) query = query.gte("check_in_date", checkIn);

  const checkOut = url.searchParams.get("check_out");
  if (checkOut) query = query.lte("check_out_date", checkOut);

  // Pagination
  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[API-GATEWAY] Listings query error:", error);
    return apiError("query_error", error.message, 500);
  }

  const totalCount = count ?? 0;
  return apiSuccess(data, {
    page,
    per_page: perPage,
    total_count: totalCount,
    total_pages: Math.ceil(totalCount / perPage),
  });
}

/**
 * GET /v1/listings/:id — Single listing with full details
 */
async function handleListingById(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  url: URL
): Promise<Response> {
  const fullPath = url.pathname;
  const gatewayPrefix = "/api-gateway";
  const apiPath = fullPath.includes(gatewayPrefix)
    ? fullPath.substring(fullPath.indexOf(gatewayPrefix) + gatewayPrefix.length)
    : fullPath;
  const parts = apiPath.split("/");
  const listingId = parts[3]; // /v1/listings/<id>

  if (!listingId) {
    return apiError("bad_request", "Missing listing ID", 400);
  }

  const { data, error } = await supabase
    .from("listings")
    .select(`
      id,
      check_in_date,
      check_out_date,
      owner_price,
      nightly_rate,
      status,
      created_at,
      properties!inner (
        id,
        name,
        description,
        city,
        state,
        country,
        bedrooms,
        bathrooms,
        sleeps,
        amenities,
        images,
        resorts (
          id,
          name,
          brand,
          rating,
          amenities,
          address,
          city,
          state
        ),
        unit_types (
          id,
          name,
          square_footage,
          max_occupancy
        )
      )
    `)
    .eq("id", listingId)
    .single();

  if (error || !data) {
    return apiError("not_found", `Listing ${listingId} not found`, 404);
  }

  return apiSuccess(data);
}

/**
 * POST /v1/search — AI-powered property search (reuses shared searchProperties)
 */
async function handleSearch(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  _url: URL
): Promise<Response> {
  let body;
  try {
    body = await req.json();
  } catch {
    return apiError("bad_request", "Invalid JSON body", 400);
  }

  const results = await searchProperties(supabase, body);

  return apiSuccess(results, {
    total_count: results.length,
  });
}

/**
 * GET /v1/destinations — Static destination directory
 */
async function handleDestinations(
  _req: Request,
  _supabase: ReturnType<typeof createClient>,
  _url: URL
): Promise<Response> {
  return apiSuccess(DESTINATIONS, {
    total_count: DESTINATIONS.length,
  });
}

/**
 * GET /v1/resorts — Resort directory with pagination
 */
async function handleResorts(
  _req: Request,
  supabase: ReturnType<typeof createClient>,
  url: URL
): Promise<Response> {
  const { page, perPage, offset } = parsePagination(url);

  const { data, error, count } = await supabase
    .from("resorts")
    .select(`
      id,
      name,
      brand,
      rating,
      amenities,
      address,
      city,
      state,
      country,
      unit_types (
        id,
        name,
        bedrooms,
        bathrooms,
        max_occupancy,
        square_footage
      )
    `, { count: "exact" })
    .order("name")
    .range(offset, offset + perPage - 1);

  if (error) {
    console.error("[API-GATEWAY] Resorts query error:", error);
    return apiError("query_error", error.message, 500);
  }

  const totalCount = count ?? 0;
  return apiSuccess(data, {
    page,
    per_page: perPage,
    total_count: totalCount,
    total_pages: Math.ceil(totalCount / perPage),
  });
}
