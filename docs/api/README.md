# RAV API Documentation

Internal OpenAPI 3.0.3 specification for all 25 Supabase Edge Functions powering the Rent-A-Vacation platform.

## What This Covers

- **25 edge functions** organized by domain: AI, Payments, Payouts, Cancellations, Disputes, Escrow, Notifications, Marketplace, GDPR, Data, Admin
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
| `src/pages/ApiDocs.tsx` | Swagger UI page at `/api-docs` |

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

This checks that all 25 edge functions have corresponding entries in the spec.

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
