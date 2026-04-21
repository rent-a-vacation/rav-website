---
last_updated: "2026-04-21T22:57:11"
change_ref: "e5b8e77"
change_type: "session-57-phase22-E4"
status: "active"
title: "Sequence — Agent Escalation to AdminDisputes"
doc_type: "guide"
audience: ["internal"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["sequence", "diagram", "escalation", "dispute", "admin", "handoff"]
---

# Sequence — Agent Escalation to AdminDisputes

## Summary

When RAVIO cannot resolve a user's support question within its policy and tool boundaries, it opens a dispute record tagged `source: 'ravio_support'` that surfaces in the existing `AdminDisputes` dashboard. No parallel admin queue; no new notification channel. Humans pick it up from there.

## Details

```mermaid
sequenceDiagram
  actor U as Authenticated User
  participant FN as text-chat (support context)
  participant AG as Agent (LLM)
  participant T as open_dispute tool
  participant DB as disputes table
  participant D as notification-dispatcher
  participant ADM as Admin (AdminDisputes)
  participant U2 as User (in-app + email)

  Note over FN,AG: Earlier: agent tried<br/>lookup_booking / query_support_docs<br/>but cannot resolve

  AG-->>FN: decide to escalate
  AG->>U: "I'll escalate this to our team.<br/>They'll respond within [SLA]."

  AG->>T: open_dispute(booking_id?, category, description)
  T->>DB: INSERT disputes (<br/>user_id=auth.uid(),<br/>source='ravio_support',<br/>category, description,<br/>status='open')
  DB-->>T: dispute_id
  T->>DB: Optional: link conversation transcript
  T-->>AG: { dispute_id }

  AG->>U: "Escalated as dispute #NN.<br/>You'll get a notification when<br/>someone responds."

  T->>D: dispatch('dispute_opened', user_id, admin_user_ids)
  D->>U2: in-app notification + email

  Note over ADM: AdminDisputes auto-refreshes<br/>(realtime subscription)
  ADM->>DB: SELECT disputes WHERE status='open'<br/>ORDER BY priority, created_at
  DB-->>ADM: dispute row with source='ravio_support' badge

  ADM->>DB: review dispute + transcript + context
  ADM->>DB: UPDATE status='investigating'<br/>add admin note

  Note over ADM,DB: Admin resolves per<br/>dispute-resolution.md procedure

  ADM->>DB: UPDATE status='resolved_*'<br/>resolution_amount, admin_notes
  DB->>D: dispatch('dispute_resolved', user_id)
  D->>U2: in-app notification + email
```

### What the agent sends

The `open_dispute` tool call payload must include:

- `booking_id` (nullable — not all escalations are booking-linked)
- `category` — matches existing dispute category enum
- `description` — structured summary:
  - User's plain-English problem
  - What the agent tried (tool calls + results, redacted for sensitive fields)
  - Why the agent couldn't resolve
  - User's preferred contact channel
  - Timeline urgency if expressed
- `source: 'ravio_support'` — set by the tool, not the agent

### What the admin sees

- Standard dispute row in `AdminDisputes`, plus:
  - `source: 'ravio_support'` badge (visual distinction)
  - Link to the conversation transcript (via D1's `conversations.channel='ravio_support'` rows)
  - Agent's description pre-filled as the initial dispute text

### SLA handoff

- Agent quotes the tier-appropriate SLA from [`support-sla.md`](../processes/support-sla.md) to the user
- Admin tooling surfaces the SLA deadline
- D2 metrics tab reports compliance

### When NOT to escalate

- Question answerable from `support_docs` (even if the answer is "I don't know the specifics; here's the policy")
- General advice
- Feature requests (file via `Report Issue → Other` instead)
- Emergency / safety — use [`emergency-safety-escalation.md`](../processes/emergency-safety-escalation.md) flow instead (distinct SLA + routing)

### Admin → agent feedback loop

Post-resolution, the admin can tag the dispute with metadata (e.g., "agent escalated correctly" vs "agent could have answered"). This signal feeds D2 metrics and future system-prompt tuning.

## Related

- [`system-architecture.md`](./system-architecture.md)
- [`sequence-support-query.md`](./sequence-support-query.md) — the flow that led here
- [`customer-support-escalation.md`](../processes/customer-support-escalation.md) — escalation rules
- [`dispute-resolution.md`](../processes/dispute-resolution.md) — admin procedure
- Tracking: C5 #409 (source tagging), D1 #410 (conversation logging)
