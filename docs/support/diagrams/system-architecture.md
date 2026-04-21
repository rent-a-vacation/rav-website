---
last_updated: "2026-04-21T22:57:11"
change_ref: "e5b8e77"
change_type: "session-57-phase22-E1"
status: "active"
title: "System Architecture — RAVIO Support"
doc_type: "guide"
audience: ["internal"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["architecture", "diagram", "mermaid", "ravio", "system", "overview"]
---

# System Architecture — RAVIO Support

## Summary

Full-stack view of how a user's support question flows from their browser to the Supabase backend, through the RAVIO text-chat edge function, through tool calls and document retrieval, and back as a streamed response. Voice search remains a parallel discovery-only path and is included for completeness.

## Details

```mermaid
flowchart TD
  subgraph Client["Client (browser / PWA)"]
    UI[RAVIO Chat Panel<br/>src/components/TextChatPanel.tsx]
    VUI[Voice Search UI<br/>src/components/VoiceSearchButton.tsx]
    HOOK[useTextChat hook<br/>src/hooks/useTextChat.ts]
    VHOOK[useVoiceSearch hook<br/>src/hooks/useVoiceSearch.ts]
    UI --> HOOK
    VUI --> VHOOK
  end

  subgraph Edge["Supabase Edge Functions"]
    TXT[text-chat<br/>SSE streaming<br/>multi-context prompts<br/>tool-use dispatcher]
    VOX[voice-search<br/>discovery only<br/>quota-gated]
    INGEST[ingest-support-docs<br/>bearer auth<br/>upsert on push to main]
  end

  subgraph LLM["LLM providers"]
    OR[OpenRouter<br/>Gemini Flash]
    VAPI[VAPI<br/>Deepgram + GPT-4o-mini + ElevenLabs]
  end

  subgraph Tools["Agent tools — auth-scoped"]
    T1[lookup_booking]
    T2[check_refund_status]
    T3[check_dispute_status]
    T4[open_dispute]
    T5[query_support_docs]
  end

  subgraph DB["Supabase Postgres"]
    TBOOK[(bookings + listings)]
    TDISP[(disputes + evidence)]
    TDOCS[(support_docs<br/>GIN-indexed tsvector)]
    TCONV[(conversations<br/>channel=ravio_support)]
    RLS[[Row-level security<br/>scopes every query by auth.uid]]
  end

  subgraph Human["Human support loop"]
    ADM[AdminDisputes dashboard<br/>source:ravio_support badge]
    NOTIF[notification-dispatcher]
  end

  subgraph Git["Source of truth"]
    MD[docs/support/*.md]
    GHA[GitHub Action on main]
  end

  HOOK -->|POST SSE<br/>context=support| TXT
  VHOOK -->|POST| VOX
  TXT --> OR
  VOX --> VAPI
  TXT -->|tool use| T1 & T2 & T3 & T4 & T5
  T1 --> TBOOK
  T2 --> TBOOK
  T3 --> TDISP
  T4 --> TDISP
  T5 --> TDOCS
  TBOOK & TDISP & TDOCS --> RLS
  T4 --> ADM
  ADM --> NOTIF
  NOTIF -->|in-app + email| UI

  MD --> GHA
  GHA -->|bearer auth| INGEST
  INGEST --> TDOCS

  TXT -.->|logs turn| TCONV
```

### Component notes

- **RAVIO Chat Panel + useTextChat** — single UI surface with context-aware prompts. Route-based detection flips `context` from `discovery` to `support` automatically on `/my-trips`, `/my-bookings`, `/account`, `/owner-dashboard`, `/settings/*`. User-visible chip appears if the classifier overrode the route-based guess.
- **text-chat edge function** — already in production for discovery. C1 extends it with a `'support'` branch that requires authenticated user, uses a support-grounded system prompt, and declares tool-use schema. SSE streaming preserved.
- **voice-search edge function** — untouched by Phase 22. Remains quota-gated (Free 5/day → Premium unlimited). Never answers support queries.
- **Agent tools** — implemented in C4. Every tool enforces RLS via the caller's JWT. Tool errors return structured JSON the agent can reason about.
- **support_docs table** — migration 060. Populated by `ingest-support-docs` edge function on every push to main. GIN-indexed `search_tsv` for fast keyword retrieval. Weighted: title/tags A, summary B, details C, examples/body D.
- **conversations table** — D1 extension. Stores every support turn + tool call + result for audit and admin handoff.
- **AdminDisputes** — existing dashboard. C5 adds a `source` badge to distinguish agent-opened disputes. No parallel admin surface.

### Trust boundaries

1. **User ↔ Client** — standard browser boundary
2. **Client ↔ Edge fn** — Supabase JWT required for support context (C1 enforces)
3. **Edge fn ↔ Tools** — service_role can call anything; user-scoped tools use caller's JWT
4. **Edge fn ↔ support_docs** — read-only, user-scoped (RLS filters active docs)
5. **Ingest ↔ support_docs** — service_role write (RLS policy `support_docs_service_role_write`)
6. **GitHub ↔ Ingest** — custom bearer secret (`INGEST_SUPPORT_DOCS_SECRET`), not Supabase JWT

## Related

- [`sequence-discovery-query.md`](./sequence-discovery-query.md) — discovery message flow
- [`sequence-support-query.md`](./sequence-support-query.md) — support message flow
- [`sequence-escalation.md`](./sequence-escalation.md) — escalation path
- [`doc-pipeline.md`](./doc-pipeline.md) — markdown → DB sync
- [`CS-OVERVIEW.md`](../CS-OVERVIEW.md) — VC-ready one-pager
