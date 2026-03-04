# API Documentation — Agent Handoff

**Generated:** March 3, 2026 (Session 33)
**Agent:** Claude Opus 4.6

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `docs/api/openapi.yaml` | ~900 | OpenAPI 3.0.3 spec — all 25 edge functions |
| `docs/api/README.md` | ~70 | Usage guide and regeneration instructions |
| `docs/api/AGENT-HANDOFF.md` | This file | Agent handoff notes |
| `public/api/openapi.yaml` | ~900 | Static copy served by Vite |
| `scripts/generate-openapi.cjs` | ~230 | Audit and metadata extraction script |
| `src/pages/ApiDocs.tsx` | ~80 | Swagger UI page (CDN-loaded, admin-gated) |

## Files Modified

| File | Change |
|------|--------|
| `src/App.tsx` | Added lazy import for `ApiDocs` + route at `/api-docs` |

## Function Coverage

All 25 edge functions are documented:

| Tag | Functions |
|-----|-----------|
| AI | voice-search, text-chat |
| Payments | create-booking-checkout, verify-booking-payment, stripe-webhook |
| Payouts | create-connect-account, create-stripe-payout |
| Cancellations | process-cancellation |
| Disputes | process-dispute-refund |
| Escrow | process-escrow-release |
| Notifications | send-email, send-contact-form, send-approval-email, send-booking-confirmation-reminder, send-cancellation-email, send-verification-notification, process-deadline-reminders |
| Marketplace | match-travel-requests |
| GDPR | export-user-data, delete-user-account |
| Data | fetch-industry-news, fetch-macro-indicators, fetch-airdna-data, fetch-str-data |
| Admin | seed-manager |

## Functions Needing Manual Review

These functions have complex or unusual patterns where the auto-extracted spec may not capture all nuances:

1. **text-chat** — Returns SSE stream (not standard JSON). OpenAPI 3.0 has limited SSE support. The spec describes the event types but cannot fully model the streaming protocol. Consider OAS 3.1 `x-webhooks` or AsyncAPI for full SSE documentation.

2. **stripe-webhook** — Authenticated via Stripe signature header (not JWT). The request body is the raw Stripe event payload. The spec documents it as a generic object. For full Stripe event schemas, link to Stripe's own API docs.

3. **voice-search** — Accepts two different input formats: direct search params OR VAPI webhook format (`message.functionCall.parameters`). The spec uses `oneOf` implicitly via examples but only defines the direct format as the primary schema.

4. **seed-manager** — DEV-only. The response `details` object varies significantly by action. The spec uses a generic `object` type.

5. **process-escrow-release** — Accepts both JWT (admin) and service role key (scheduled job). The spec shows JWT auth but the scheduled execution path has no auth header.

## How to Validate the Spec

1. **Online:** Paste `docs/api/openapi.yaml` into https://editor.swagger.io
2. **CLI:** `npx @redocly/cli lint docs/api/openapi.yaml`
3. **Audit:** `node scripts/generate-openapi.cjs --audit`

## Known Gaps / Limitations

1. **No automated spec generation from TypeScript AST** — The generation script extracts metadata (interfaces, methods, rate limits) but does not programmatically convert TS interfaces to YAML schemas. The authoritative spec is hand-authored from source code analysis.

2. **SSE streaming not fully modeled** — OpenAPI 3.0.3 lacks native SSE support. The `text-chat` endpoint documents the event types in the description but the response schema is `text/event-stream: string`.

3. **Stripe webhook events not enumerated** — The 6 handled event types are listed in the description but individual event schemas are not defined (they follow Stripe's own schema).

4. **Rate limit headers not documented** — While rate-limited endpoints return `429` with `Retry-After`, the `X-RateLimit-*` headers are not formally specified.

5. **No request validation schemas for internal-only functions** — Functions called only by other edge functions (send-approval-email, send-booking-confirmation-reminder, etc.) have documented schemas but are not directly callable by frontend code.

## Recommended Next Steps

### Phase A: Immediate improvements
- [ ] Run spec through https://editor.swagger.io and fix any validation warnings
- [ ] Add `x-rate-limit` extensions for rate limit documentation
- [ ] Add webhook event type schemas for stripe-webhook

### Phase B: Toward a public API
- [ ] Design public API authentication (API keys vs OAuth)
- [ ] Create versioned API paths (`/v1/search`, `/v1/listings`)
- [ ] Add pagination schemas (`cursor`, `limit`, `offset`)
- [ ] Define public-facing subset of endpoints (search, listings, availability)
- [ ] Add request validation middleware
- [ ] Set up API key management in admin dashboard
- [ ] Rate limiting per API key (not just per user/IP)
- [ ] Consider AsyncAPI spec for SSE/WebSocket endpoints
