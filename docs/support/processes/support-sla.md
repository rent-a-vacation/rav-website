---
last_updated: "2026-04-21T22:44:19"
change_ref: "02726bd"
change_type: "session-57-phase22-B4"
status: "active"
title: "Support SLA"
doc_type: "process"
audience: ["admin", "internal", "renter", "owner"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["sla", "response-time", "support", "tier", "concierge", "escalation"]
---

# Support SLA

## Summary

Rent-A-Vacation targets first-response times based on the category of the request and the user's subscription tier. Emergency and safety issues always receive < 1 hour attention regardless of tier. Most standard support interactions are resolved end-to-end by RAVIO without human involvement, so the SLAs below apply to the portion of work that reaches a human.

## Details

### Response-time targets (first human response after escalation)

| Category | Free | Plus/Pro | Premium/Business | RAV Team | Notes |
|---|---|---|---|---|---|
| **Emergency / safety** | < 1 hour | < 1 hour | < 1 hour | < 1 hour | Always top priority; see [`emergency-safety-escalation.md`](./emergency-safety-escalation.md) |
| **Active booking (within 48h of check-in or during stay)** | 4 hours | 2 hours | 1 hour | Immediate | Time-sensitive |
| **Dispute — with financial impact** | 24 hours | 12 hours | 4 hours | Immediate | Refunds, damages, payouts |
| **Dispute — no financial impact** | 48 hours | 24 hours | 12 hours | N/A | Reviews, minor complaints |
| **Account / billing** | 24 hours | 12 hours | 4 hours | Immediate | Password, payout, subscription |
| **General support / how-to** | 48 hours | 24 hours | 12 hours | N/A | Most should be deflected by RAVIO |
| **Feature requests** | N/A | N/A | N/A | N/A | Filed as GitHub issues; no SLA |

All times are wall-clock; we do not currently operate business-hours-only.

### What counts as "first response"

- A human reading the escalation and posting a response in the dispute thread (not an automated ack)
- For emergencies, a phone call or direct message counts
- RAVIO auto-responses (e.g., "I've escalated this") do NOT count toward the SLA

### Tier-specific support features

#### Free tier

- RAVIO text chat (unlimited)
- VAPI voice: 5/day
- Dispute access
- Standard SLA

#### Plus (traveler) / Pro (owner)

- Everything in Free
- VAPI voice: 25/day
- Faster SLA (see table)

#### Premium (traveler) / Business (owner)

- Everything in Plus/Pro
- **Concierge support** — 1:1 human support channel, fastest SLA
- VAPI voice: unlimited
- Premium/Business: dedicated email/chat that bypasses RAVIO entirely for those who prefer human-only support

### Concierge support (Premium / Business)

- Dedicated support channel surfaced in the user's dashboard
- Assigned account manager for Business owners (see `subscription-terms.md` legal-blocked)
- < 1 hour first response during stay / booking windows
- Proactive outreach on observed issues (e.g., delayed owner confirmation)

### Measuring SLA compliance

- **D1 conversation logging** captures every RAVIO escalation and handoff timestamp
- **D2 admin metrics tab** reports:
  - Deflection % (resolved without escalation)
  - Escalation rate
  - Median first response time per category + tier
  - SLA compliance % per category + tier
  - P99 response times
- Monthly review by platform ops — misses trigger process refinement or staffing adjustments

### RAVIO's role in SLA

- RAVIO targets instant response for in-scope questions (docs retrieval + structured tool calls)
- For well-scoped questions, resolution time is seconds, not hours
- Every RAVIO interaction should end with either a resolution or a successful escalation — never a dangling "I don't know, goodbye"

### When the SLA isn't met

- Apologise explicitly in the response
- Note the delay in admin notes
- If systemic (multiple missed SLAs in a period), trigger a post-mortem
- Consider a goodwill credit or compensation for the affected user (admin discretion)

### Post-launch evolution

Pre-launch (current): SLAs are aspirational targets while we build volume. RAV team is small, so most escalations hit a human directly.

Post-launch (scale): the D2 metrics inform staffing + hiring. We'll tighten SLAs as RAVIO deflection improves and the team grows.

## Examples

**Example 1 — Free traveler with booking question**

User asks RAVIO at 2 PM: "Can I change my dates?" RAVIO answers from `booking-faq.md` (2 seconds). No escalation, no SLA invoked.

**Example 2 — Premium traveler during active stay**

User at 10 PM during stay: "Unit has a broken AC, it's 90°F inside." RAVIO recognises active-stay + high-priority, escalates to on-call admin. Premium tier → 1-hour SLA. Admin responds at 10:35 PM with alternative hotel options + refund commitment.

**Example 3 — Business owner with payout question**

User (Business tier): "My Stripe payout is showing pending for 5 days, is that normal?" RAVIO escalates — Business tier → 4 hour SLA for account/billing. Admin responds within 3 hours with diagnosis: the owner's Stripe Connect account has an identity-verification hold. Admin walks owner through resolution.

## Related

- [`customer-support-escalation.md`](./customer-support-escalation.md) — how escalations reach a human
- [`emergency-safety-escalation.md`](./emergency-safety-escalation.md) — separate emergency SLA
- [`dispute-resolution.md`](./dispute-resolution.md) — dispute-specific handling
- [`subscription-terms.md`](../policies/subscription-terms.md) — tier descriptions (legal-blocked)
- [`billing-faq.md`](../faqs/billing-faq.md) — subscription billing
