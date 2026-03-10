/**
 * Standardized response helpers for the Public API.
 * Provides consistent envelope format, pagination, and rate limit headers.
 */

const API_VERSION = "v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export interface PaginationMeta {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

/**
 * Standard success response envelope.
 */
export function apiSuccess(
  data: unknown,
  meta?: Partial<PaginationMeta>,
  status = 200
): Response {
  const body: Record<string, unknown> = {
    data,
    api_version: API_VERSION,
  };

  if (meta) {
    body.meta = {
      page: meta.page ?? 1,
      per_page: meta.per_page ?? 20,
      total_count: meta.total_count ?? 0,
      total_pages: meta.total_pages ?? 0,
    };
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Standard error response envelope.
 */
export function apiError(
  code: string,
  message: string,
  status: number
): Response {
  return new Response(
    JSON.stringify({
      error: { code, message },
      api_version: API_VERSION,
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Add rate limit headers to an existing response.
 */
export function withRateLimitHeaders(
  response: Response,
  remaining: number,
  limit: number,
  resetAt: Date
): Response {
  const headers = new Headers(response.headers);
  headers.set("X-RateLimit-Limit", String(limit));
  headers.set("X-RateLimit-Remaining", String(Math.max(0, remaining)));
  headers.set("X-RateLimit-Reset", String(Math.floor(resetAt.getTime() / 1000)));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Parse pagination parameters from URL query string.
 * Defaults: page=1, per_page=20, max per_page=50.
 */
export function parsePagination(url: URL): { page: number; perPage: number; offset: number } {
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const perPage = Math.min(50, Math.max(1, parseInt(url.searchParams.get("per_page") ?? "20", 10) || 20));
  const offset = (page - 1) * perPage;

  return { page, perPage, offset };
}

/**
 * CORS preflight response.
 */
export function corsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
