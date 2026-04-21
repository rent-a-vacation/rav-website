---
last_updated: "2026-04-21T22:57:11"
change_ref: "e5b8e77"
change_type: "session-57-phase22-E3"
status: "active"
title: "Sequence — Support Query with Tool Use"
doc_type: "guide"
audience: ["internal"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["sequence", "diagram", "support", "ravio", "tool-use", "auth"]
---

# Sequence — Support Query with Tool Use

## Summary

How RAVIO handles an authenticated support question ("why was I charged $50?"). Requires user auth; uses tool calls to fetch account-scoped data and retrieve relevant policy; streams a grounded response. No human involvement unless the agent escalates.

## Details

```mermaid
sequenceDiagram
  actor U as Authenticated User
  participant UI as RAVIO Chat Panel
  participant H as useTextChat
  participant FN as text-chat edge fn
  participant OR as OpenRouter (Gemini Flash)
  participant TK as Agent tools
  participant DB as Postgres (RLS-scoped)

  U->>UI: "Why was I charged $50?"
  UI->>H: sendMessage(query, context='support')
  H->>FN: POST /text-chat (SSE, Authorization: Bearer <JWT>)
  Note over FN: Verify JWT → auth.uid()<br/>Reject if anon (401)

  FN->>OR: stream with support system prompt<br/>+ tool definitions
  OR-->>FN: {tool_call: query_support_docs('refund fees')}

  FN->>TK: query_support_docs('refund fees')
  TK->>DB: SELECT * FROM support_docs<br/>WHERE search_tsv @@ to_tsquery(...)<br/>(RLS: status='active')
  DB-->>TK: [refund-policy.md, billing-faq.md]
  TK-->>FN: docs with summary + details
  FN->>OR: continue with tool result

  OR-->>FN: {tool_call: lookup_booking(user_ctx)}
  FN->>TK: lookup_booking (uses caller's JWT)
  TK->>DB: SELECT bookings WHERE user_id = auth.uid()<br/>(RLS: user sees own only)
  DB-->>TK: recent bookings + payment intents
  TK-->>FN: booking details
  FN->>OR: continue with tool result

  OR-->>FN: stream final answer (grounded)
  FN-->>H: SSE stream response tokens
  H-->>UI: append tokens
  UI-->>U: "That $50 charge corresponds to<br/>your Marriott booking on Mar 15..."

  Note over FN: Logs turn + tool calls<br/>to conversations table (D1)
```

### Auth + RLS flow

1. User must be authenticated — anonymous hits on `context='support'` are rejected 401.
2. The edge function extracts `auth.uid()` from the Bearer JWT.
3. Every tool call either:
   - Uses the caller's JWT (user-scoped tools: `lookup_booking`, `check_refund_status`, `check_dispute_status`, `open_dispute`) — RLS enforces visibility
   - Uses the service_role but filters by `auth.uid()` explicitly (only for tools that need RLS-adjacent queries)
4. `query_support_docs` is a special case — reads active docs regardless of user. RLS policy `support_docs_read_active` allows any authenticated user.

### What the agent is allowed to do

- ✅ Answer from retrieved docs with cite
- ✅ Fetch the user's own bookings, refund status, dispute status
- ✅ Open a dispute on behalf of the user (tagged `source: 'ravio_support'`)
- ❌ Access another user's data
- ❌ Issue refunds directly (admin-only via `process-cancellation` / `process-dispute-refund`)
- ❌ Modify account settings, listings, or roles
- ❌ Bypass rate limits or quotas

If the agent cannot resolve, it escalates — see [`sequence-escalation.md`](./sequence-escalation.md).

### Logging

Every support turn is logged to `conversations` (D1) with:

- User message
- Agent response
- Tool calls + results (redacted for sensitive fields)
- Elapsed time
- Escalation flag (if applicable)

This powers the D2 admin metrics tab.

## Related

- [`system-architecture.md`](./system-architecture.md)
- [`sequence-discovery-query.md`](./sequence-discovery-query.md) — compared path
- [`sequence-escalation.md`](./sequence-escalation.md) — when agent can't resolve
- [`customer-support-escalation.md`](../processes/customer-support-escalation.md) — escalation rules
- Tracking issues: C1 #405, C2 #406, C3 #407, C4 #408
