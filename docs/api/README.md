---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# RAV API Documentation

Internal OpenAPI 3.0.3 specification for all 27 Supabase Edge Functions powering the Rent-A-Vacation platform.

## What This Covers

- **27 edge functions** organized by domain: AI, Payments, Payouts, Cancellations, Disputes, Escrow, Notifications, Marketplace, GDPR, Data, Admin, API
- Request/response schemas derived from actual TypeScript source code
- Authentication requirements (JWT, Stripe signature, service role)
- Rate limiting details per endpoint
- Error response formats

## Files

| File | Purpose |
|------|---------|
| `docs/api/openapi.yaml` | Authoritative OpenAPI spec (edit this) |
| `public/api/openapi.yaml` | Static copy served by Vite (auto-copied) |
| `scripts/generate-openapi.cjs` | Audit/bootstrap script |
| `src/pages/ApiDocs.tsx` | Swagger UI page at `/api-docs` (admin) |
| `src/pages/Developers.tsx` | Public Swagger UI page at `/developers` |

## Quick Start

### Base URLs

| Environment | Base URL |
|-------------|----------|
| **DEV** | `https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/api-gateway` |
| **PROD** | `https://xzfllqndrlmhclqfybew.supabase.co/functions/v1/api-gateway` |

### Authentication

All requests require either an **API key** or a **JWT token**.

**API Key** (recommended for integrations):
```bash
curl -H "X-API-Key: rav_pk_<your-key>" \
  https://xzfllqndrlmhclqfybew.supabase.co/functions/v1/api-gateway/v1/listings
```

**JWT Token** (for logged-in users):
```bash
curl -H "Authorization: Bearer <your-jwt-token>" \
  https://xzfllqndrlmhclqfybew.supabase.co/functions/v1/api-gateway/v1/listings
```

API keys are created in the Admin Dashboard → API Keys tab, or via the `generate_api_key` RPC.

### Endpoints

#### 1. List active listings

```bash
curl -H "X-API-Key: $API_KEY" \
  "$BASE_URL/v1/listings?page=1&per_page=10&destination=Miami&min_price=100&max_price=500"
```

Query params: `page`, `per_page` (max 50), `destination`, `min_price`, `max_price`, `bedrooms`, `brand`, `check_in`, `check_out`

#### 2. Get a single listing

```bash
curl -H "X-API-Key: $API_KEY" \
  "$BASE_URL/v1/listings/<listing-uuid>"
```

#### 3. Search listings (POST)

```bash
curl -X POST -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"destination":"Hawaii","check_in_date":"2026-06-01","check_out_date":"2026-06-08","bedrooms":2}' \
  "$BASE_URL/v1/search"
```

Body params: `destination`, `check_in_date`, `check_out_date`, `min_price`, `max_price`, `bedrooms`, `property_type`, `amenities` (array), `max_guests`, `flexible_dates`

#### 4. List destinations

```bash
curl -H "X-API-Key: $API_KEY" "$BASE_URL/v1/destinations"
```

Returns all destination regions with their cities.

#### 5. List resorts

```bash
curl -H "X-API-Key: $API_KEY" \
  "$BASE_URL/v1/resorts?page=1&per_page=20"
```

Query params: `page`, `per_page` (max 50)

### Response Format

**Success (200):**
```json
{
  "data": [...],
  "meta": { "page": 1, "per_page": 20, "total_count": 150, "total_pages": 8 },
  "api_version": "v1"
}
```

**Error (4xx/5xx):**
```json
{
  "error": { "code": "unauthorized", "message": "Missing or invalid API key" },
  "api_version": "v1"
}
```

### Rate Limits

Rate limits are enforced per API key and returned in response headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Daily request quota |
| `X-RateLimit-Remaining` | Requests remaining today |
| `X-RateLimit-Reset` | Unix timestamp when limit resets |

| Tier | Daily Limit | Per-Minute |
|------|------------|------------|
| `free` | 100 | 10 |
| `partner` | 10,000 | 100 |
| `premium` | 100,000 | 500 |

When exceeded, you'll receive a `429` response with a `Retry-After` header.

### IP Allowlisting

API keys can optionally restrict access to specific IPs or CIDR ranges (e.g., `["203.0.113.5", "192.0.2.0/24"]`). Configure in Admin Dashboard → API Keys.

---

## Accessing the Docs

### Local Development

```
npm run dev
# Open http://localhost:5173/api-docs
```

Requires: logged in as RAV admin/staff, OR `VITE_STAFF_ONLY_MODE=true` in `.env.local`.

### Production

```
https://rent-a-vacation.com/api-docs
```

Accessible only to authenticated RAV team members.

## Regenerating / Auditing the Spec

### Audit mode (compare spec to source files)

```bash
node scripts/generate-openapi.cjs --audit
```

This checks that all 27 edge functions have corresponding entries in the spec.

### Full metadata extraction

```bash
node scripts/generate-openapi.cjs
```

Prints a summary table of all functions with their HTTP methods, auth type, rate limits, and extractable TypeScript interfaces. Also copies `docs/api/openapi.yaml` to `public/api/openapi.yaml`.

### Validating the spec

Paste `docs/api/openapi.yaml` into https://editor.swagger.io to validate syntax and preview.

## Updating When Adding a New Edge Function

1. Create the edge function under `supabase/functions/<name>/index.ts`
2. Add a path entry to `docs/api/openapi.yaml` under the appropriate tag
3. Define request/response schemas in `components.schemas` if not reusing existing ones
4. Copy the updated spec: `cp docs/api/openapi.yaml public/api/openapi.yaml`
5. Run `node scripts/generate-openapi.cjs --audit` to verify coverage
6. Validate at https://editor.swagger.io

## Swagger UI Reference

- [Swagger UI docs](https://swagger.io/tools/swagger-ui/)
- [OpenAPI 3.0.3 spec](https://spec.openapis.org/oas/v3.0.3)
- CDN used: `https://unpkg.com/swagger-ui-dist@5/`
