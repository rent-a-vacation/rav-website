---
last_updated: "2026-04-21T22:44:19"
change_ref: "02726bd"
change_type: "session-57-phase22-B4"
status: "active"
title: "Dispute Resolution (Internal Procedure)"
doc_type: "process"
audience: ["admin", "internal"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["dispute", "resolution", "evidence", "admin", "refund", "workflow", "internal"]
---

# Dispute Resolution (Internal Procedure)

## Summary

Internal workflow for handling disputes filed by renters or owners against each other. Disputes flow through `ReportIssueDialog` → `disputes` table → `AdminDisputes` dashboard → admin decision → `process-dispute-refund` (if refund required) → notifications to both parties. This is the procedural document for RAV admins; **not the public-facing T&Cs** (see legal-blocked `booking-terms.md`).

## Details

### Dispute categories

Per migration 041, the following categories are supported:

**Renter-initiated (8):**
- `property_not_as_described` — photos or description inaccurate
- `access_issues` — couldn't check in, keys missing, lockout
- `safety_concerns` — unsafe conditions, but NOT an active emergency (that's [`emergency-safety-escalation.md`](./emergency-safety-escalation.md))
- `cleanliness` — property was not clean on arrival
- `owner_no_show` — owner did not respond or unit was unavailable
- `cancellation_dispute` — dispute over cancellation terms/refund
- `payment_dispute` — charged amount is wrong, refund missing, etc.
- `other` — anything else

**Owner-initiated (7):**
- `renter_damage` — property damaged beyond normal wear
- `renter_no_show` — renter didn't arrive, claims refund unjustly
- `policy_violation` — guest count exceeded, unauthorised pets, smoking, etc.
- `harassment` — renter harassed owner or property staff
- `non_payment` — unusual for Stripe-processed, but possible for add-on fees
- `extended_stay` — renter overstayed check-out
- `other`

### Evidence

Evidence can be uploaded by either party via `useDisputeEvidence` hook:

- Photos / videos (required for most physical-condition disputes)
- Screenshots (of messages, confirmations, etc.)
- PDFs (receipts, repair invoices, etc.)
- File size cap: 10 MB per file, 10 files per dispute

Evidence is stored in Supabase Storage with RLS — only the two disputants and admins can view.

### Lifecycle states

| Status | Meaning | Next actions |
|---|---|---|
| `open` | Filed, awaiting admin triage | Admin reviews within SLA |
| `investigating` | Admin actively gathering info | Admin or either party may add evidence |
| `awaiting_response` | Admin waiting on a specific party's response | The flagged party has 48h to respond, else default decision |
| `resolved_for_renter` | Admin ruled in renter's favor | Refund processed if applicable |
| `resolved_for_owner` | Admin ruled in owner's favor | No refund beyond policy |
| `resolved_split` | Admin split the decision | Partial refund processed |
| `closed_no_action` | Dispute closed without ruling (e.g., withdrawn) | No changes |

### Admin triage workflow

1. **Open AdminDisputes** → `/admin/disputes` (filter by status, date, category, source, priority)
2. **Review dispute row** — read filed description, both parties' profiles, booking context, any evidence
3. **Check conversation thread** — pre-booking inquiries + post-booking messaging (all unified)
4. **Determine priority:**
   - High: safety-adjacent (but not emergency), owner no-show with imminent check-in, large refund amounts
   - Normal: most disputes
   - Low: post-stay reviews or minor cleanliness without financial impact
5. **Request evidence if insufficient** — add a note, set status `awaiting_response`
6. **Decide:**
   - For renter → approve refund at whatever % the admin deems fair (can exceed cancellation policy), execute via `process-dispute-refund` edge function
   - For owner → no refund; document reasoning
   - Split → partial refund at discretion
7. **Post decision** — the resolution note is surfaced to both parties via the dispute thread + notification
8. **Close dispute** → final status

### `process-dispute-refund` edge function

Handles dispute-driven refunds:

- Accepts `dispute_id`, `refund_amount`, `admin_notes`
- Verifies caller is admin
- Calls Stripe Refunds API on the booking's `payment_intent_id`
- Updates `disputes.status` + `disputes.resolution_amount`
- Updates `cancellation_requests` if applicable
- Handles escrow pull: if booking is pre-payout, refund reduces owner's pending payout; if post-payout, reverse transfer or direct charge
- Dispatches notifications: `dispute_resolved` to filer, `dispute_resolved_against_you` to other side

### When disputes override cancellation policy

Per [`cancellation-policy.md`](../policies/cancellation-policy.md) and [`refund-policy.md`](../policies/refund-policy.md):

- A dispute in progress at time of cancellation → standard policy is **not** auto-applied
- Admin decides refund amount, which can be anywhere from 0% (dispute rejected) to 100% (ruled fully in filer's favor) — or beyond 100% in rare cases involving compensation for damages (e.g., hotel costs incurred by renter during owner no-show)

### Admin notes

Every dispute decision requires admin notes (internal, not shown to users). Notes should capture:

- Summary of the filer's claim
- Summary of the other party's response
- Evidence relied upon
- Decision rationale
- Precedent references (if applicable — e.g., "similar to dispute #XX resolved for owner")

### Repeat offenders

The `profiles` table tracks `cancellation_count` and implicit dispute metrics. Admins should:

- Review history before ruling (many "other party was wrong" claims from one user = red flag)
- Escalate to senior review if an owner accumulates 3+ adverse rulings or a renter files 3+ unfounded disputes
- Senior review can pause listings (owner) or limit account (renter)

### Appeal

- No formal appeal process pre-launch. If either party disagrees, they can re-file with new evidence.
- Post-launch: TBD based on volume — likely a senior-reviewer tier.

### RAVIO-opened disputes

Disputes filed via the agent's `open_dispute` tool (C4) appear with `source: 'ravio_support'`. Admin UI shows a badge distinguishing these from user-filed. Transcript is linked; admins can see exactly what the user asked and what RAVIO tried before escalating.

See [`customer-support-escalation.md`](./customer-support-escalation.md).

## Examples

**Example 1 — Renter cleanliness dispute, moderate evidence**

Renter files `cleanliness` with 3 photos of a dirty bathroom. Admin reviews, contacts owner. Owner admits the cleaning service missed. Admin rules `resolved_for_renter` with 50% refund (property was still usable). Notes: "Partial refund reflects liveable-but-substandard cleaning. Owner cooperative." `process-dispute-refund(dispute_id, 50%, <notes>)`.

**Example 2 — Owner no-show, full refund**

Renter arrives at check-in, no keys, owner unresponsive for 4 hours. Renter books alternative at their cost and files `owner_no_show`. Admin confirms owner did not respond to platform messages. Rules `resolved_for_renter` 100% refund + flags owner's listing for suspension review.

**Example 3 — RAVIO-opened dispute**

User asked RAVIO about a charge discrepancy; agent could not resolve (user claimed the total on Stripe differed from RAV's shown total by $15). Agent escalated with transcript. Admin investigates — turns out to be a display bug in MyBookings, not an actual overcharge. Closes as `closed_no_action`, responds to user with explanation, files a platform bug ticket.

## Related

- [`customer-support-escalation.md`](./customer-support-escalation.md) — how RAVIO routes into this flow
- [`refund-policy.md`](../policies/refund-policy.md) — dispute override of standard refund rules
- [`cancellation-policy.md`](../policies/cancellation-policy.md) — standard rules disputes can override
- [`emergency-safety-escalation.md`](./emergency-safety-escalation.md) — separate flow for safety-critical
- Code: migration 041 (dispute categories + evidence)
- Code: `src/components/booking/ReportIssueDialog.tsx` (renter + owner filing UI)
- Code: `src/components/admin/AdminDisputes.tsx` (triage dashboard)
- Code: `src/hooks/useDisputeEvidence.ts` (evidence upload)
- Code: `supabase/functions/process-dispute-refund/` (refund execution)
