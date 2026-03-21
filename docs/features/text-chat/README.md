---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Text Chat Agent

Conversational text assistant powered by OpenRouter, available to all logged-in users with no quota restrictions.

## Quick Reference

| Item | Detail |
|------|--------|
| **Route** | Sheet overlay (no dedicated route) |
| **Access** | All logged-in users, no quota |
| **Edge Function** | `supabase/functions/text-chat/index.ts` |
| **Secret** | `OPENROUTER_API_KEY` |
| **Model** | `google/gemini-3-flash-preview` (via OpenRouter) |
| **Pages** | Rentals, PropertyDetail, BiddingMarketplace, HowItWorksPage |

## Architecture

```
User types message
  -> useTextChat hook
  -> POST /functions/v1/text-chat
  -> OpenRouter API (+ tool calling for search)
  -> _shared/property-search.ts (same as voice-search)
  -> SSE stream back to client
  -> TextChatPanel renders token-by-token
```

## Components

| Component | File | Purpose |
|-----------|------|---------|
| `TextChatButton` | `src/components/TextChatButton.tsx` | MessageCircle icon button (mirrors VoiceSearchButton) |
| `TextChatPanel` | `src/components/TextChatPanel.tsx` | Sheet-based chat UI with messages, search results, suggested prompts |
| `useTextChat` | `src/hooks/useTextChat.ts` | Core hook: state, SSE streaming, AbortController |
| `ChatMessage` etc. | `src/types/chat.ts` | TypeScript types |

## Context Modes

The chat adapts its system prompt based on which page it's on:

| Context | Page | Capabilities |
|---------|------|-------------|
| `rentals` | Rentals | Search properties via tool calling |
| `property-detail` | PropertyDetail | Answer questions about the viewed listing |
| `bidding` | BiddingMarketplace | Explain bidding mechanics |
| `general` | HowItWorksPage | General platform help |

## Key Decisions

- **Session-only persistence** — messages live in React state, cleared on navigation
- **No quota** — text chat uses OpenRouter (cheap) vs. VAPI (expensive voice)
- **Shared search module** — `_shared/property-search.ts` used by both voice-search and text-chat
- **VAPI untouched** — completely separate systems, separate providers
- **SSE streaming** — token-by-token display for natural chat feel
