---
last_updated: "2026-04-21T22:57:11"
change_ref: "e5b8e77"
change_type: "session-57-phase22-E2"
status: "active"
title: "Sequence — Discovery Query"
doc_type: "guide"
audience: ["internal"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["sequence", "diagram", "discovery", "search", "ravio", "vapi"]
---

# Sequence — Discovery Query

## Summary

How a user's discovery query ("find me a ski resort in March under $800") flows through the system. Both text and voice paths are shown; the voice path is quota-gated and discovery-only per DEC-036.

## Details

### Text (RAVIO) discovery path

```mermaid
sequenceDiagram
  actor U as User
  participant UI as RAVIO Chat Panel
  participant H as useTextChat
  participant FN as text-chat edge fn
  participant OR as OpenRouter (Gemini Flash)
  participant DB as Postgres (listings)

  U->>UI: "Ski resort in March under $800"
  UI->>H: sendMessage(query, context='discovery')
  H->>FN: POST /text-chat (SSE)
  Note over FN: Route to discovery system prompt<br/>(no auth required)

  FN->>OR: stream completion request
  OR-->>FN: token-by-token stream
  FN-->>H: SSE data: {delta, searchResults?}
  H-->>UI: append tokens

  FN->>DB: property_search(filters)<br/>(when model emits search intent)
  DB-->>FN: matching listings
  FN-->>H: SSE data: {searchResults: [...]}
  H-->>UI: render result cards

  OR-->>FN: [DONE]
  FN-->>H: SSE close
  UI-->>U: Complete response + cards
```

### Voice (VAPI) discovery path

```mermaid
sequenceDiagram
  actor U as User
  participant UI as Voice Search UI
  participant H as useVoiceSearch
  participant FN as voice-search edge fn
  participant V as VAPI
  participant DB as Postgres (listings + quota)

  U->>UI: Tap voice button
  UI->>H: startCall()
  H->>FN: POST /voice-search (check quota)
  FN->>DB: get_user_voice_quota(user_id)
  DB-->>FN: { remaining: 3 }

  alt quota exhausted
    FN-->>H: 429 quota_exceeded
    H-->>UI: "Voice limit reached — try text"
  else quota available
    FN-->>H: VAPI call config
    H->>V: start call (Deepgram STT → GPT-4o-mini → ElevenLabs TTS)
    V-->>H: streaming audio
    H-->>UI: render spoken response
    H->>FN: log_voice_search (fire-and-forget)
    FN->>DB: insert voice_search_logs
  end
```

### Notes

- **Same UI shell** — discovery is the default RAVIO context on `/rentals`, `/property/*`, `/tools/*`, `/destinations/*`, and ambiguous routes. No auth required.
- **Voice is separate** — different hook, different edge function, different LLM stack. Quota-gated per tier (Free 5/day → Premium unlimited).
- **Property search embedding** — when the discovery model needs to filter listings, it emits a tool-like payload that the edge function resolves against `listings` + `property_search` RPC. Results are streamed back inline with the response.
- **No account context** — discovery doesn't know about the user's specific bookings or disputes. That's the support path.

## Related

- [`system-architecture.md`](./system-architecture.md) — component overview
- [`sequence-support-query.md`](./sequence-support-query.md) — support path
- [`general-platform-faq.md`](../faqs/general-platform-faq.md) — voice quotas per tier
- Code: `supabase/functions/text-chat/index.ts`
- Code: `supabase/functions/voice-search/index.ts`
- Code: `src/hooks/useTextChat.ts`, `src/hooks/useVoiceSearch.ts`
