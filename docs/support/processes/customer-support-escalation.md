---
last_updated: "2026-04-21T22:44:19"
change_ref: "02726bd"
change_type: "session-57-phase22-B4"
status: "active"
title: "Customer Support Escalation"
doc_type: "process"
audience: ["admin", "internal"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["escalation", "support", "ravio", "agent", "handoff", "process"]
---

# Customer Support Escalation

## Summary

When RAVIO cannot resolve a user's support request, it escalates into the existing dispute + admin review infrastructure — no parallel support queue. Escalation is a tool call (`open_dispute`) that creates a dispute row tagged `source: 'ravio_support'` so admins can tell agent-opened cases apart from user-filed ones.

## Details

### Escalation decision criteria

RAVIO is instructed to attempt resolution first. It should escalate when any of these apply:

1. **Requires data the agent cannot access** — e.g., changing a user's email, refunding outside policy, moderating another user, intervening in an active dispute.
2. **Requires human judgement** — e.g., evaluating dispute evidence, overriding policy, approving a listing edit on an active booking.
3. **User explicitly asks for a human** — "I want to talk to a real person" is always respected; agent does not argue.
4. **Emergency / safety** — anything involving immediate danger, medical emergency, harassment, or abuse goes through [`emergency-safety-escalation.md`](./emergency-safety-escalation.md), NOT this flow.
5. **Confidence threshold not met** — if the agent's retrieval returns low-confidence matches or conflicting answers, it escalates rather than guessing.
6. **Tool failure** — if `lookup_booking`, `check_refund_status`, etc. returns errors the agent can't explain, it escalates.
7. **Repeated failure** — if the same user has re-asked the same question twice within one conversation, escalate.

### Escalation channels

| Scenario | Channel | Priority | SLA |
|---|---|---|---|
| Standard support question, billing/booking/account | `open_dispute` → AdminDisputes | Normal | Per [`support-sla.md`](./support-sla.md) |
| Emergency / safety | `emergency-safety-escalation.md` flow (out-of-band) | Critical | < 1 hour human response |
| Pending dispute resolution | Existing dispute — agent adds a comment with context | Inherits dispute priority | Inherits dispute SLA |
| Account security (suspected compromise, locked-out) | `open_dispute` with `category: 'account_security'` + flag for admin | High | < 4 hours |

### How the agent escalates

1. Agent says something like: "I'll escalate this to our team. They'll respond within [SLA]. You'll get a notification when they do."
2. Agent calls `open_dispute(booking_id, category, description)`:
   - `booking_id` is optional (not all escalations are booking-linked; use `null` for account/platform issues)
   - `category` matches existing dispute category enum
   - `description` summarises the conversation + what the user wants + what the agent already tried
3. Dispute row created with `source: 'ravio_support'`.
4. AdminDisputes dashboard surfaces new row; RAV team gets notified per standard dispute notification flow.
5. Agent provides the dispute ID to the user for reference.
6. Conversation transcript is linked to the dispute so the admin has full context (stored via D1 — `conversations.channel: 'ravio_support'`, see [`D1 tracking issue`](../../README.md)).

### Info the agent must include in `description`

- User's plain-English problem statement
- What the agent tried (tool calls + results)
- Why the agent couldn't resolve it (missing access, policy boundary, etc.)
- Any relevant IDs (booking, listing, payment intent, etc.)
- User's preferred contact channel if mentioned
- Timeline urgency if expressed

The better the description, the faster the admin can triage.

### What happens after escalation

1. AdminDisputes shows a "RAVIO-opened" badge
2. Admin reviews transcript + dispute details
3. Admin resolves directly OR reassigns to the right team member
4. Resolution is posted back to the user via the dispute thread (not RAVIO)
5. User receives `dispute_resolved` notification

If the admin needs more info, they can comment on the dispute thread; the user sees the comment as a message in their inbox.

### Admin override capability

Admins can:

- Issue refunds outside cancellation policy (partial or full)
- Change listing status (pause, unlist)
- Edit or delete user content (reviews, messages) in extreme cases
- Adjust account roles (e.g., demote abusive users)
- Access full audit log for the conversation

These are not RAVIO capabilities — RAVIO can only propose. See `src/components/admin/AdminDisputes.tsx` + admin dashboard.

### Ravio self-deflection target

- **Goal:** 70%+ of incoming support volume resolved without escalation (Phase 22 success metric)
- **Measured in** `D2` admin tab metrics card (deflection %, escalation rate, median response time)
- **Sampling:** all `channel: 'ravio_support'` conversations from D1

### Known escalation anti-patterns

Don't escalate for:

- Questions the agent can answer from `support_docs` (even if "I don't know for sure" is a valid answer — say so)
- Pricing decisions within the pricing calculator's output range
- General advice ("is timeshare worth it", "which brand is best")
- Feature requests (suggest filing an issue via `Report Issue → Other`)

## Examples

**Example 1 — User wants refund outside policy**

User: "I cancelled 3 hours before check-in. Policy is strict so I got $0 back. This is unfair."

Agent: "Our strict cancellation policy refunds 50% only if cancelled 7+ days before check-in. I can escalate this to our team for review if you believe a specific circumstance should override the policy."

User: "Yes please."

Agent: calls `open_dispute(booking_id, 'cancellation_dispute', '<transcript + user's reason>')`, responds "Escalated as dispute #XX. A team member will respond within [SLA]."

**Example 2 — User asks for human**

User: "Just let me talk to a person."

Agent: "Got it — I'll hand this off. Can you give me a one-line summary of what you need, so I can route it?"

User: "I need to update my payout bank account."

Agent: calls `open_dispute(null, 'account', '<summary>')` and responds "Escalated. A team member will reach out within [SLA]."

**Example 3 — User asks question agent can answer**

User: "When do refunds land?"

Agent: (retrieves refund-policy.md summary, no escalation) "Refunds typically settle in 5–10 business days for US cards, up to 14 for international. Stripe processes them immediately; the settlement time is on the issuing bank's side."

## Related

- [`dispute-resolution.md`](./dispute-resolution.md) — internal dispute workflow post-escalation
- [`emergency-safety-escalation.md`](./emergency-safety-escalation.md) — separate flow for safety-critical
- [`support-sla.md`](./support-sla.md) — response-time commitments
- [`booking-workflow.md`](./booking-workflow.md) — booking context
- Parent issue: #398 (C5 agent-opened disputes with source tag)
- Code (planned): `supabase/functions/text-chat/` C1 support context
- Code (planned): `open_dispute` tool in C4
