---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Text Chat Agent — Project Brief

## Problem

The platform offers only voice search (VAPI) as a conversational interface. Voice is expensive, tier-gated with quotas, and not always practical (noisy environments, mobile, accessibility). Users without voice access fall back to the static filter UI with no conversational help.

## Solution

A text-based conversational assistant powered by OpenRouter that:
- Is available to **all logged-in users** with **no quota**
- Sits next to the voice button as a companion feature
- Provides context-aware help across 4 pages
- Uses the same search infrastructure as voice (shared module)

## API Contract

### Request
```
POST /functions/v1/text-chat
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "message": "Find me condos in Orlando under $1500",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "context": "rentals" | "property-detail" | "bidding" | "general"
}
```

### Response (SSE stream)
```
event: search_results
data: [{ listing_id, property_name, location, price, ... }]

event: token
data: "Here"

event: token
data: " are"

event: done
data: [DONE]
```

## System Prompts

| Context | Role | Tool Access |
|---------|------|-------------|
| `rentals` | Property search agent | `search_properties` |
| `property-detail` | Listing-specific help | None |
| `bidding` | Bidding guide | None |
| `general` | Platform help | None |

## Success Criteria

- [x] Chat button appears on 4 pages for logged-in users
- [x] Streaming responses render token-by-token
- [x] Property search returns inline cards with links
- [x] Voice search unaffected (shared module refactor is transparent)
- [x] 26 new tests, 208 total passing
- [x] 0 type errors, 0 lint errors, build clean
