---
last_updated: "2026-04-21T12:24:25"
change_ref: "e51b76d"
change_type: "session-57-phase22-B1"
status: "active"
title: "Support Docs Gap Analysis — 20-Doc Authoritative Source Mapping"
doc_type: "guide"
audience: ["internal"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["meta", "planning", "gap-analysis", "phase-22"]
---

# Support Docs Gap Analysis

Mapping of all 20 planned support docs to their authoritative source. **Gates all downstream content work (B2, B3, B4, B5).** Prevents drift and scope creep: every doc must either be derivable from existing code/UI, extractable from an existing doc, or explicitly written from scratch.

## Source-type vocabulary

| Source type | Meaning |
|---|---|
| `derive` | Rules live in code or a flow manifest; the markdown is a narrative mirror that cites the source. Changes to code require a paired doc update. |
| `extract` | Content already exists in a user-facing page (`FAQ.tsx`, `UserGuide.tsx`); the markdown consolidates and structures it. UI page remains the UX surface. |
| `write-new` | No pre-existing source; authored from business rules, industry norms, and platform behavior. |
| `legal-blocked` | `write-new` drafts held with `status: draft` pending lawyer review (#80). |

## The 20 docs

### Policies (8)

| Slug | Source type | Authoritative ref | Legal? | Owner | Tracked in |
|---|---|---|---|---|---|
| `cancellation-policy` | `derive` | `src/lib/cancellationPolicy.ts` (rules), `supabase/functions/process-cancellation/` (execution) | ❌ | Claude | B2 #401 |
| `refund-policy` | `derive` | `src/lib/cancellationPolicy.ts`, `supabase/functions/process-cancellation/`, Stripe refund flow, dispute-refund path in `supabase/functions/process-dispute-refund/` | ❌ | Claude | B2 #401 |
| `booking-terms` | `legal-blocked` | Platform behavior + booking lifecycle (`src/flows/traveler-lifecycle.ts`) | ✅ | Claude (draft) → Lawyer | B5 #404 |
| `payment-policy` | `legal-blocked` | Stripe integration + fee structure (`src/lib/pricing.ts`, 15% commission, tier overrides) | ✅ | Claude (draft) → Lawyer | B5 #404 |
| `privacy-policy` | `legal-blocked` | GDPR deletion (migration 027, issue #89), CCPA posture, data-retention rules | ✅ | Claude (draft) → Lawyer | B5 #404 |
| `trust-safety-policy` | `legal-blocked` | — (industry norms: non-discrimination, harassment, prohibited behavior) | ✅ | Claude (draft) → Lawyer | B5 #404 |
| `insurance-liability-policy` | `legal-blocked` | — (industry norms: property damage, security deposits, trip insurance) | ✅ | Claude (draft) → Lawyer | B5 #404 |
| `subscription-terms` | `legal-blocked` | `src/hooks/useSubscription*`, Stripe subscription products, tier gating (`src/lib/tierGating.ts`) | ✅ | Claude (draft) → Lawyer | B5 #404 |

### Processes (6)

| Slug | Source type | Authoritative ref | Legal? | Owner | Tracked in |
|---|---|---|---|---|---|
| `booking-workflow` | `derive` | `src/flows/traveler-lifecycle.ts` | ❌ | Claude | B2 #401 |
| `bidding-process` | `derive` | `src/flows/owner-lifecycle.ts` + `listing_bids` schema | ❌ | Claude | B2 #401 |
| `customer-support-escalation` | `write-new` | — (agent → human handoff rules; references dispute infrastructure) | ❌ | Claude | B4 #403 |
| `dispute-resolution` | `write-new` | `src/components/booking/ReportIssueDialog.tsx`, `src/components/admin/AdminDisputes.tsx`, migration 041 (dispute categories), `supabase/functions/process-dispute-refund/` | ❌ | Claude | B4 #403 |
| `emergency-safety-escalation` | `write-new` | — (distinct from dispute queue; separate SLA for safety-critical) | ❌ | Claude | B4 #403 |
| `support-sla` | `write-new` | — (response time commitments, tier differentiation) | ❌ | Claude | B4 #403 |

### FAQs (6)

| Slug | Source type | Authoritative ref | Legal? | Owner | Tracked in |
|---|---|---|---|---|---|
| `booking-faq` | `extract` | `src/pages/FAQ.tsx` renter sections, `src/pages/UserGuide.tsx` renter booking steps | ❌ | Claude | B3 #402 |
| `billing-faq` | `extract` | `src/pages/FAQ.tsx` billing/payment, `src/pages/UserGuide.tsx` payments, owner tax/1099-K surfaces, admin tax tab | ❌ | Claude | B3 #402 |
| `property-owner-faq` | `extract` | `src/pages/FAQ.tsx` owner sections, `src/pages/UserGuide.tsx` owner sections | ❌ | Claude | B3 #402 |
| `traveler-faq` | `extract` | `src/pages/FAQ.tsx` general traveler + search + discovery, `src/pages/UserGuide.tsx` traveler (complement to booking-faq) | ❌ | Claude | B3 #402 |
| `general-platform-faq` | `extract` | `src/pages/FAQ.tsx` general platform, voice quota section (`useVoiceSearch`), referral program (`src/hooks/useReferral.ts`), RAV Tools Hub | ❌ | Claude | B3 #402 |
| `account-security-faq` | `write-new` | — (password reset, 2FA, account recovery, session expiry) | ❌ | Claude | B4 #403 |

## Split of derivative work (B2)

4 docs. All code-authoritative; markdown narrative mirrors + cites.

- cancellation-policy ← `src/lib/cancellationPolicy.ts`
- refund-policy ← `src/lib/cancellationPolicy.ts` + Stripe + dispute paths
- booking-workflow ← `src/flows/traveler-lifecycle.ts`
- bidding-process ← `src/flows/owner-lifecycle.ts`

**Rule:** B2 docs must cite their source file + function/export in the `Related` section. Any refactor of those sources triggers a mandatory doc-update PR (enforced by `scripts/source-doc-map.json`).

## Split of extract work (B3)

5 docs. Content already exists in user-facing pages; markdown consolidates for agent retrieval.

**Critical rule:** `FAQ.tsx` and `UserGuide.tsx` remain the UX surface. No content deletion from those pages. Any user-facing FAQ add/update must ALSO update the corresponding markdown file. This one-way rule avoids double-edit risk.

Alternative considered: generate markdown from FAQ.tsx/UserGuide.tsx at build time. Rejected — the markdown needs more structure (Summary/Details/Examples/Related) than the on-page content, and we want editorial control.

## Split of new-write work (B4)

5 docs. No authoritative source; written from platform behavior + industry norms.

- customer-support-escalation (agent escalation criteria + routing)
- dispute-resolution (internal procedure, references existing dispute infrastructure)
- emergency-safety-escalation (distinct SLA; safety-critical routing outside dispute queue)
- support-sla (response-time commitments; tier differentiation)
- account-security-faq (password, 2FA, recovery — highest-volume CS category)

All are internal process or FAQ — not legal-blocked.

## Split of legal-blocked work (B5)

6 docs. Drafts will be authored in Track B work and held at `status: draft` until lawyer review (#80).

- booking-terms (public T&Cs for bookings)
- payment-policy (public fee/processing disclosure)
- privacy-policy (CCPA/GDPR — legal requirement for any site handling PII)
- trust-safety-policy (non-discrimination, harassment, prohibited behavior)
- insurance-liability-policy (property damage, deposits, trip insurance)
- subscription-terms (tier cancel/upgrade/downgrade/proration — separate from booking T&Cs)

**Hard stop:** none of these move to `status: active` without a lawyer-signed `reviewed_by` + `reviewed_date`. The ingest pipeline will serve `status: draft` docs to admins only (never to end users).

## Follow-ups surfaced during gap analysis

1. **`scripts/source-doc-map.json` update** — add mappings for B2-derived docs so CI warns when code changes without a paired doc update. Track separately from Phase 22 content tickets.
2. **FAQ.tsx / UserGuide.tsx → markdown sync check** — currently manual. Consider automated drift detection (new Tier A follow-up issue if Track B3 reveals it's burdensome).
3. **Voice search quota page** — currently a section in `general-platform-faq`. If voice quota rules get complex (per-tier overrides, per-user exceptions from migration 021), consider promoting to its own doc `voice-fair-use.md`. Defer until rules mature.
4. **Tax / 1099-K owner doc** — currently a section in `billing-faq`. After #127 (LLC/EIN) unblocks Stripe Tax, the owner tax story gets concrete enough to warrant its own doc. Defer until then.
