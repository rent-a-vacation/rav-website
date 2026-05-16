---
last_updated: "2026-05-15T00:00:00"
change_ref: "manual-edit"
change_type: "session-68-accounting-index"
status: "active"
---

# Accounting & Tax — Feature Index

> **This folder is an index, not a content home.** Authoritative accounting/tax/payment docs live elsewhere — this README points to them so anyone browsing `docs/features/` can find the right source. Do NOT add narrative content here; update the canonical doc instead. (See `feedback-no-doc-duplication` rule.)

---

## Canonical docs

| Topic | Canonical home | Owner |
|---|---|---|
| **Pricing, taxes, accounting framework** (fee structure, commission tiers, Stripe Tax, Puzzle.io ledger, 1099-K, growth stages) | [`docs/RAV-PRICING-TAXES-ACCOUNTING.md`](../../RAV-PRICING-TAXES-ACCOUNTING.md) | Founder + Engineering |
| **PaySafe (escrow) compliance posture** (why RAV is not an MSB, what Stripe owns, what RAV owns) | [`docs/payments/PAYSAFE-COMPLIANCE.md`](../../payments/PAYSAFE-COMPLIANCE.md) | Founder + future legal counsel (#80) |
| **PaySafe flow specification** (state machines, edge functions, line numbers, gap register) | [`docs/payments/PAYSAFE-FLOW-SPEC.md`](../../payments/PAYSAFE-FLOW-SPEC.md) | Engineering |
| **Financial model** (P&L, runway, funding ask) | [`docs/financials/README.md`](../../financials/README.md) | Founder |

## Code surfaces

| Concern | Path |
|---|---|
| Pricing calculation (`computeListingPricing`, fee breakdown) | [`src/lib/pricing.ts`](../../../src/lib/pricing.ts) |
| Commission rate (runtime, hook + edge fn helpers) | [`src/config/commission.ts`](../../../src/config/commission.ts) + `useCommissionRate()` hook + `getCommissionRate()` edge fn helper |
| Cancellation policy refund math | [`src/lib/cancellationPolicy.ts`](../../../src/lib/cancellationPolicy.ts) |
| Escrow auto-release | [`supabase/functions/process-escrow-release/`](../../../supabase/functions/process-escrow-release/) |
| Cancellation refund | [`supabase/functions/process-cancellation/`](../../../supabase/functions/process-cancellation/) |
| Dispute refund | [`supabase/functions/process-dispute-refund/`](../../../supabase/functions/process-dispute-refund/) |
| Stripe webhook (incl. chargeback mirror) | [`supabase/functions/stripe-webhook/`](../../../supabase/functions/stripe-webhook/) |
| Booking checkout (Stripe Tax wired) | [`supabase/functions/create-booking-checkout/`](../../../supabase/functions/create-booking-checkout/) |
| Subscription billing (Phase H, in PROD) | [`supabase/functions/create-subscription-checkout/`](../../../supabase/functions/create-subscription-checkout/), `manage-subscription/`, `subscription-webhook/` |
| Admin tax reporting UI | [`src/components/admin/AdminTaxReporting.tsx`](../../../src/components/admin/AdminTaxReporting.tsx) |
| Admin financials UI | [`src/components/admin/AdminFinancials.tsx`](../../../src/components/admin/AdminFinancials.tsx) |
| Admin payouts UI | [`src/components/admin/AdminPayouts.tsx`](../../../src/components/admin/AdminPayouts.tsx) |

## Key decisions

| ID | Decision | Where |
|---|---|---|
| DEC-022 | Pricing & accounting architecture | [`docs/PROJECT-HUB.md`](../../PROJECT-HUB.md) |
| DEC-038 | PaySafe spec creation | [`docs/PROJECT-HUB.md`](../../PROJECT-HUB.md) |
| DEC-039 | PaySafe compliance posture doc | [`docs/PROJECT-HUB.md`](../../PROJECT-HUB.md) |
| DEC-041 | Default commission 12% with tier discounts | [`docs/PROJECT-HUB.md`](../../PROJECT-HUB.md) |
| DEC-043 | Commission rate runtime architecture | [`docs/PROJECT-HUB.md`](../../PROJECT-HUB.md) |

## Open follow-ups (GitHub issues)

- **#127** — Business Formation & Stripe Tax Activation (pre-launch, blocked, needs-decision)
- **#63** — Phase 20E: Accounting Integration (Puzzle.io → pluggable) (post-launch, blocked)
- **#65** — Automated Tax Filing (post-launch)
- **#509** — Promotional commission rate overrides (pre-launch, needs-decision)
- **#531** — Admin-configurable subscription tier prices (pre-launch)
- **#532** — Subscription pricing — full scope (post-launch)

## Generators (for snapshots)

To produce dated stakeholder-facing accounting snapshots, run `/generate-docs --accounting` (see [`/generate-docs` skill](../../../.claude/skills/generate-docs/SKILL.md)). Outputs land in `docs/exports/`.
