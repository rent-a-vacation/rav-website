---
last_updated: "2026-04-21T22:57:11"
change_ref: "e5b8e77"
change_type: "session-57-phase22-E6"
status: "active"
title: "RAVIO Customer Support — Executive Overview"
doc_type: "guide"
audience: ["internal"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["overview", "vc", "pitch", "capabilities", "metrics", "roadmap", "executive"]
---

# RAVIO Customer Support — Executive Overview

> **Audience:** investors, board, prospective partners, new team members. Designed to be dropped into a pitch deck or a stakeholder update with minimal editing.

## One-line pitch

RAVIO is Rent-A-Vacation's customer support agent — an authenticated AI that resolves the vast majority of support queries in seconds, escalates edge cases into the existing dispute system, and never guesses.

## Capabilities (what RAVIO CAN do)

- **Resolve booking questions** from an auto-synced knowledge base of 20 canonical support documents
- **Fetch the user's own account data** — bookings, refund status, dispute status — via authenticated tool calls
- **File disputes on behalf of the user** when it can't resolve directly, tagged `source: 'ravio_support'` for admin triage
- **Stream responses** token-by-token for a conversational feel (SSE)
- **Switch contexts automatically** — discovery mode on browse pages, support mode on account/booking pages — without asking the user to choose
- **Handle both text and voice** — voice remains premium discovery-only (quota-gated); text handles support

## Boundaries (what RAVIO does NOT do)

- **No refunds issued directly** — admins control financial actions
- **No policy overrides** — admin discretion only
- **No access to other users' data** — RLS-enforced
- **No modifications to account settings, listings, or roles**
- **No fabricated answers** — if docs don't have it, escalate. Never guess.
- **No voice-based support** — voice is for discovery; support needs auth, screens, evidence upload

## How it differs from typical chatbots

| Typical chatbot | RAVIO |
|---|---|
| Canned responses | Grounded in 20 authoritative docs synced from git |
| Loses context on refresh | Server-side session + D1 conversation logging |
| Can't access account data | Auth-scoped tool use with RLS enforcement |
| "I can't help, here's a form" | Opens a real dispute + quotes an SLA + routes to admin |
| Policy drift between docs + UI + code | Source-doc map + CI enforces: code change → doc change |
| Legal review = edits in an admin UI | Legal review = PR diffs with git-audited history |

## 3-layer architecture

```
┌──────────────────────────────────────────┐
│ UI: RAVIO chat panel                      │
│   • Always-on chat button                 │
│   • Route-aware context switching         │
│   • Streamed tokens + result cards        │
├──────────────────────────────────────────┤
│ Agent: text-chat edge function            │
│   • Supabase SSE streaming                │
│   • Gemini Flash via OpenRouter           │
│   • Tool-use dispatcher (5 tools)         │
│   • Intent classifier fallback            │
├──────────────────────────────────────────┤
│ Data: Supabase Postgres                   │
│   • support_docs (GIN + tsvector)         │
│   • bookings, disputes, conversations     │
│   • RLS on every query                    │
└──────────────────────────────────────────┘
```

## Success metrics (tracked in Admin → Support Interactions)

- **Deflection rate** — % resolved without escalation. Target: 70%+
- **Escalation rate** — % that create a dispute. Target: < 30%
- **Median first response** — support queries answered in < 5 seconds
- **SLA compliance** — % of escalations meeting their tier SLA. Target: 95%+
- **Thumb up / thumb down** — user satisfaction per conversation
- **Mean time to resolution** — escalated dispute from open → resolved

_(Pre-launch values pending real usage data.)_

## Cost profile

- **Per-message cost** — ~$0.001 at Gemini Flash rates (OpenRouter). Tool calls + retrieval near-free in PostgreSQL.
- **Voice separately** — VAPI (Deepgram + GPT-4o-mini + ElevenLabs). Quota-gated by tier. Free tier 5/day; Premium unlimited.
- **Storage** — `support_docs` is 20 rows × ~10KB each = 200KB. Negligible.

## Compliance posture

- **CCPA / GDPR aligned** (privacy-policy in draft pending lawyer review)
- **No card data** stored — Stripe PCI DSS Level 1 handles all payment info
- **No 3rd-party ad tracking** — GA4 gated behind cookie consent
- **Auditable policy changes** — every word of every policy is git-tracked
- **Legal review** happens on PR diffs, not admin UI edits

## Roadmap

### v1 (pre-launch) — Phase 22

- [x] Supabase `support_docs` table + ingest pipeline (A1–A4)
- [x] 20 support docs across policies / FAQs / processes (B1–B4)
- [x] Legal-blocked policy drafts held at `status: draft` (B5)
- [x] Architecture diagrams + this one-pager (E1–E6)
- [ ] `context: 'support'` branch in text-chat edge fn (C1)
- [ ] Route-based context detection + classifier chip (C2, C3)
- [ ] 5 agent tools (lookup_booking, check_refund_status, check_dispute_status, open_dispute, query_support_docs) (C4)
- [ ] Agent-opened disputes with source tag (C5)
- [ ] Support conversation logging + admin metrics (D1, D2)

### v2 (post-launch)

- Multilingual support (Spanish first based on user geography)
- Proactive outreach ("We noticed your Wish-Matched booking is past its confirmation deadline — want us to check in?")
- Embedding-based retrieval (pgvector) for fuzzier queries
- Voice support — only if user demand justifies the quota-management UX cost
- Native mobile integration (post #240 Capacitor epic)

### v3 (opportunistic)

- Partner integrations (owners' property management software asking RAVIO questions on their behalf)
- Public developer API (already built — see `/developers`; support endpoints would extend that)

## Team

- **Engineering:** RAV core team
- **AI model provider:** Anthropic (authoring agent); OpenRouter (runtime — currently Gemini Flash; replaceable)
- **Infra:** Supabase (DB, auth, edge fn), Vercel (frontend), Stripe (payments)
- **Tooling:** TypeScript, React, Vitest, Playwright, Sentry

## References

- [Phase 22 Epic](https://github.com/rent-a-vacation/rav-website/issues/395) — full scope + progress
- [DEC-036](../PROJECT-HUB.md) — architectural decision (reject CrewAI, extend RAVIO)
- [`system-architecture.md`](./diagrams/system-architecture.md) — full stack diagram
- [`doc-pipeline.md`](./diagrams/doc-pipeline.md) — how docs stay in sync
- [`README.md`](./README.md) — doc schema + authoring workflow
