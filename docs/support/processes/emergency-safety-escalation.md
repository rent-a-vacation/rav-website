---
last_updated: "2026-04-21T22:44:19"
change_ref: "02726bd"
change_type: "session-57-phase22-B4"
status: "active"
title: "Emergency & Safety Escalation"
doc_type: "process"
audience: ["admin", "internal", "renter", "owner"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["emergency", "safety", "escalation", "critical", "harassment", "medical", "threat"]
---

# Emergency & Safety Escalation

## Summary

Safety-critical situations (medical emergencies, immediate threats, harassment, abuse) follow a **separate** escalation path from the standard dispute queue. They have a distinct SLA (< 1 hour human response) and do not go through RAVIO's normal `open_dispute` tool. **For immediate physical danger, the user must call local emergency services first — RAV is a secondary channel.**

## Details

### What qualifies as emergency / safety

- Medical emergency requiring immediate attention
- Active physical threat (violence, intruder, weapons)
- Active verbal or physical harassment by the other party
- Sexual harassment or assault
- Suspected human trafficking
- Fire, flood, carbon monoxide, or other hazard
- Being locked in or unable to safely leave the property
- Minors at risk

### What does NOT qualify (goes through standard dispute flow)

- Cleanliness issues
- Property condition complaints
- Billing disputes
- Late check-in / check-out
- Non-urgent access issues (e.g., Wi-Fi not working)
- Disagreements about cancellation policy

These are handled via [`dispute-resolution.md`](./dispute-resolution.md).

### User-facing guidance

**In a true emergency, always:**

1. **Call local emergency services first** — 911 (US), 112 (EU), or the local equivalent
2. **Get to a safe location** — leave the property if staying is dangerous
3. **Document evidence** if safe to do so — photos, videos, any communication

**Then notify RAV:**

- Use `Report Issue → safety_concerns` with a clear "EMERGENCY" indicator in the description
- If the standard dialog isn't working, email `support@rent-a-vacation.com` with subject line "EMERGENCY"
- Text chat (RAVIO) will recognise emergency keywords and display emergency contact info + fast-path escalation
- Voice chat (VAPI) is NOT the right channel — voice routing is discovery-only

### Agent (RAVIO) behavior on emergency signals

When the text chat detects emergency keywords ("unsafe", "threat", "emergency", "hurt", "911", "abuse", "harassed", "trafficking"), it MUST:

1. Immediately display: "If you are in immediate danger, call 911 (or your local emergency services) right now. I can help you after you're safe."
2. Not attempt to resolve the situation conversationally
3. Not run standard tools (lookup_booking, etc.)
4. Show the emergency support contact: `support@rent-a-vacation.com` + "We respond to emergency reports within 1 hour."
5. If user confirms they are safe and wants help, escalate via a dedicated emergency flag (distinct from standard `open_dispute`) — see engineering implementation in C4/C5.

### Admin response workflow

**SLA: < 1 hour response to any emergency report.** This is an internal commitment; actual settlement depends on the situation.

1. Emergency reports surface to AdminDisputes with a **red priority flag**
2. Paging rotation notifies on-call admin immediately (post-launch: SMS/phone)
3. Admin contacts reporter via their preferred channel + phone if provided
4. If threat is still active:
   - Coordinate with local authorities if the reporter has already contacted them
   - Provide emergency contacts and safety guidance
   - Arrange alternative accommodation through our partner hotels if the reporter needs to leave the property
5. If threat has resolved:
   - Collect evidence
   - Begin investigation of the other party (owner or renter)
   - Pause the other party's listing or account pending review
6. Document the full timeline in admin notes

### Consequences for the other party

Emergencies are treated very seriously. Depending on the investigation outcome:

- **Confirmed threat / abuse** → immediate permanent account ban, listing removals, law enforcement coordination as appropriate
- **Harassment confirmed** → account suspension, formal warning, possible permanent ban on repeat
- **Safety hazard (e.g., unsafe property)** → listing removal, owner required to remediate before relisting, refund to affected renter + compensation for any hotel costs incurred
- **Unsubstantiated / misuse of emergency flag** → user warned; repeated misuse may result in account restriction

### Refund posture

Emergency refunds are **always approved at 100%** regardless of cancellation policy, and may exceed the booking total to cover:

- Alternative accommodation costs (documented)
- Transportation costs to leave the property safely
- Related incidental costs with receipts

These go through `process-dispute-refund` with admin notes specifying emergency context.

### Post-incident follow-up

- 24-hour check-in with the reporter to verify safety
- 7-day follow-up to confirm no retaliation or continued issue
- Offer to rebook with a comparable listing at RAV's expense if the reporter wants to complete the trip
- Incident memo filed internally for training

### Contact channels

| Channel | Use | Response target |
|---|---|---|
| 911 / local emergency services | Active threat | Immediate |
| `support@rent-a-vacation.com` with "EMERGENCY" | Anything emergency-flagged | < 1 hour |
| Phone (post-launch) | Active emergency escalation | < 15 minutes |
| RAVIO text chat | Emergency keyword triggers auto-surfacing of above contacts | Immediate triage display |
| `Report Issue → safety_concerns` | Post-incident or non-immediate | < 1 hour if flagged emergency |

### Training

All admin team members receive:

- Emergency-response training (what to say, what not to say, when to involve law enforcement)
- Trauma-informed communication basics
- Legal scope boundaries (we facilitate — we do not investigate like law enforcement)

## Examples

**Example 1 — Renter locked out with injury**

Renter messages RAVIO: "I fell on the stairs, I think I broke my ankle, and I can't reach the owner." RAVIO detects "broke my ankle" as medical, displays 911 prompt, then escalates to admin emergency queue. Admin calls renter, confirms 911 contacted, arranges transportation reimbursement + hotel booking + full refund.

**Example 2 — Harassment by owner**

Renter messages RAVIO: "The owner keeps coming to the unit uninvited, it's making me feel unsafe." RAVIO detects "unsafe," shows emergency guidance, escalates. Admin contacts renter, moves them to alternative accommodation at RAV's expense, suspends owner's listings pending investigation.

**Example 3 — Carbon monoxide detector**

Renter calls out in chat: "CO detector is going off, we need to evacuate." RAVIO: "Leave the property NOW and call 911. I'm escalating to our team — they'll contact you shortly." Admin coordinates full refund + documented hotel reimbursement, begins owner property safety investigation.

## Related

- [`dispute-resolution.md`](./dispute-resolution.md) — standard (non-emergency) dispute flow
- [`customer-support-escalation.md`](./customer-support-escalation.md) — non-emergency escalation path
- [`support-sla.md`](./support-sla.md) — general SLAs (emergency is distinct)
- [`trust-safety-policy.md`](../policies/trust-safety-policy.md) — public-facing safety policy (legal-blocked)
- External: local emergency services (911 in US)
