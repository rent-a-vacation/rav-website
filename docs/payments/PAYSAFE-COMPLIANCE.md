---
last_updated: "2026-05-02T18:30:00"
change_ref: "session-63"
change_type: "session-63"
status: "active"
---

# PaySafe Compliance Posture

> **Purpose:** Captures *why* the RAV money-flow architecture keeps the platform out of money-transmission compliance scope, what the platform remains accountable for, and how each open gap maps to that posture. This doc is the place to land **specific legal references** when counsel provides them — see §7.
>
> **Audience:** Founders, future legal counsel under #80, engineering when reasoning about scope changes that could affect the compliance posture (e.g., "should we settle funds ourselves?").
>
> **Source of truth:** code + Stripe agreement + active counsel guidance. When this doc and the implementation disagree, the implementation wins — open a PR.
>
> **Related docs:**
> - `docs/payments/PAYSAFE-FLOW-SPEC.md` — internal *system* spec (state machines, edge fns, line numbers)
> - `docs/support/policies/payment-policy.md` — public-facing payment policy (currently `status: draft`, blocked on #80)
> - `docs/support/policies/cancellation-policy.md` — public-facing cancellation policy (renter-readable)
> - `docs/PROJECT-HUB.md` — Key Decisions Log (DEC-038 → spec; DEC-039 → this doc)

---

## 1. Why this doc exists

PaySafe is the brand name for RAV's escrow + dispute system. The system is functional today, but several questions recur and deserve a single, durable answer:

- *"Are we a money services business?"*
- *"Do we need money-transmitter licenses in the states we operate?"*
- *"What does the platform actually own legally vs. what does Stripe own?"*
- *"Why is gap X marked post-launch — does that create regulatory risk?"*
- *"When counsel asks for the legal model, what do we hand them?"*

This doc answers those once. The user has indicated they will share specific statutory references at a later date — those land in §7 as a per-jurisdiction index linking RAV behavior to each cited statute.

---

## 2. The architecture choice that drives the entire compliance posture

**Stripe Connect with the destination-charge model.**

In plain English:

1. The traveler pays via Stripe Checkout. The card is charged to RAV's Stripe platform account.
2. The funds **sit in Stripe's custody** for the entire booking lifecycle. They never enter any RAV-controlled bank account.
3. After the 5-day post-checkout hold (`process-escrow-release` edge function), RAV calls `stripe.transfers.create()` against the owner's connected Stripe account. Stripe executes the actual transfer of funds.

The legal effect: **RAV does not hold, transmit, or settle customer funds.** Stripe does.

The "5-day escrow hold" is therefore a *product feature* — RAV-controlled timing of a Stripe transfer — and not a custodial action. We never break the *funds-stay-in-Stripe* invariant. (See `PAYSAFE-FLOW-SPEC.md` §7.1 for the corresponding statement in the system spec.)

This single architectural choice carries the compliance load for the whole marketplace.

---

## 3. What Stripe takes off RAV's plate

| Burden | Owner |
|---|---|
| Money-transmitter licensing in 50 US states | **Stripe** (federally + state-licensed) |
| FinCEN MSB registration | **Stripe** (RAV is not an MSB under 31 CFR 1010.100(ff) — not a "money transmitter") |
| Sponsor bank relationship | **Stripe** (RAV needs none) |
| PCI-DSS scope | **Stripe** — RAV is **SAQ A** (never sees a raw card number) |
| Owner KYC / identity verification | **Stripe Connect Express** onboarding flow |
| 1099-K issuance to owners over IRS threshold | **Stripe** files them |
| Card-network rules + chargeback infrastructure | **Stripe** |
| Sales-tax calculation (post-#127, when Stripe Tax activates) | **Stripe Tax** |
| Anti-money-laundering / sanctions screening at fund movement | **Stripe** |

If the user's incoming legal references include statutes for any of these, they should reference Stripe as the responsible party in §7.

---

## 4. What RAV remains accountable for

These cannot be outsourced to Stripe. They are the platform's responsibility.

| Responsibility | Where it lives |
|---|---|
| **When funds move** — 5-day hold, admin holds, dispute pauses, auto-release logic | `supabase/functions/process-escrow-release/`, `system_settings` |
| **Inter-party dispute mediation** — between renter and owner | `supabase/functions/process-dispute-refund/`, `AdminDisputes.tsx` |
| **Marketplace terms of service** disclosing custody, refund logic, dispute process | `docs/support/policies/payment-policy.md` (draft, blocked on #80) |
| **Timeshare-specific copy compliance** — FL Ch. 721, etc. — language must not imply *sale of an interest* | Listing copy guidelines, BRAND-LOCK |
| **Per-state consumer-protection cancellation overrides** — CA Civil Code §1689, NY GBL — may force flexibility regardless of policy tier | Gap I, #466 |
| **Operational SLAs** — once advertised, they become marketplace promises | Gap G, #464 |
| **Audit trail** — who confirmed what, when, why a hold was placed | `disputes`, `booking_confirmations`, `admin_audit_trail` |
| **Renter-arrival confirmation as a fraud + dispute signal** | Gaps A/B/C, #461 / #462 / #467 |

If counsel raises a question that maps to one of these, RAV is the responsible party.

---

## 5. Currently implemented (and therefore already legally aligned with the posture above)

The following are live in code and consistent with the marketplace model. Each item is a building block of a compliant marketplace; together they form the substantive product behind the legal posture.

- ✅ Six-state escrow lifecycle (`pending_confirmation → confirmation_submitted → verified → released | refunded | disputed`)
- ✅ 5-day hold + auto-release cron via `process-escrow-release`
- ✅ Admin payout-hold (RAV staff can pause release pending dispute)
- ✅ Stripe Connect destination-charge plumbing — RAV never holds funds
- ✅ Stripe Connect Express onboarding for owner KYC
- ✅ Cancellation-policy tiers (`flexible | moderate | strict | super_strict`) with refund math in `src/lib/cancellationPolicy.ts`
- ✅ 13 dispute categories + status workflow + refund-amount resolutions
- ✅ Pre-Booked vs Wish-Matched flow distinction (DEC-034) — different timing rules for funds release based on whether the owner already holds the resort confirmation
- ✅ Owner-confirmation timer for Wish-Matched bookings (60 min default + 2× 30-min extensions via `system_settings`)
- ✅ Dispute evidence upload (10 files / 10 MB each, RLS-gated bucket)
- ✅ Admin disputes UI with category-aware UI gating (schema parity coming via Gap E)
- ✅ Stripe Tax scaffolded behind `STRIPE_TAX_ENABLED` env flag (activates post-#127 Stripe Tax registration)

---

## 6. Gap closure register (A–I)

Live status of every gap from `PAYSAFE-FLOW-SPEC.md` §9. Updated by every PR that closes a gap.

| Gap | Issue | Status | Closed by | Note |
|-----|-------|--------|-----------|------|
| **A** — `confirm-checkin` server action | [#461](https://github.com/rent-a-vacation/rav-website/issues/461) | ✅ Closed | Session 63 PR | Edge fn (handler.ts split per DEC-037) + photo upload UI + replaces direct DB writes; idempotent + auth-gated; new `confirmed_at_source` enum |
| **B** — Auto-confirmation cron when renter ignores deadline | [#462](https://github.com/rent-a-vacation/rav-website/issues/462) | ✅ Closed | Session 63 PR | `auto-confirm-checkins` scheduled edge fn flips deadline-elapsed rows with `confirmed_at_source='auto'` for analytics distinction |
| **C** — Issue → dispute pre-fill | [#467](https://github.com/rent-a-vacation/rav-website/issues/467) | ✅ Closed | Session 63 PR | `ReportIssueDialog.prefill` prop + check-in issue→dispute category mapper; "File a formal dispute" CTA appears under issue cards |
| **D** — `HOLD_PERIOD_DAYS` to `system_settings` | [#468](https://github.com/rent-a-vacation/rav-website/issues/468) | ✅ Closed | Session 63 PR | Migration 068 + `process-escrow-release` refactored to handler.ts split (DEC-037) with 11 unit tests; ops can tune hold period at runtime |
| **E** — Per-category dispute role enforcement in schema/RLS | [#463](https://github.com/rent-a-vacation/rav-website/issues/463) | ✅ Closed | Session 63 PR | Migration 069: `can_resolve_dispute()` SECURITY DEFINER fn + new RLS UPDATE policy. `rav_admin` → all; `rav_staff` → operational categories only; `rav_owner` no longer schema-allowed for resolution writes |
| **F** — Split refunds, holdbacks, rebooking credits, fee waivers | [#469](https://github.com/rent-a-vacation/rav-website/issues/469) | ⏸ Deferred (post-launch) | — | Confirmed deferral by user in Session 63 — admin can handle complex disputes manually for the first ~10 cases (separate Stripe action + admin note). Real feature epic when promoted. |
| **G** — SLA enforcement + alerting + business-hours config | [#464](https://github.com/rent-a-vacation/rav-website/issues/464) | ✅ Closed | Session 63 PR | Migrations 071 + 072 + `sla-monitor` scheduled edge fn; on-site categories use wall-clock, others use 09:00–18:00 ET business minutes excluding federal holidays; targets snapshotted on insert |
| **H** — Auto-mirror Stripe `charge.dispute.created` to internal disputes | [#465](https://github.com/rent-a-vacation/rav-website/issues/465) | ✅ Closed | Session 63 PR | Migration 070 + `handleChargeDisputeCreated` in stripe-webhook; idempotent via `stripe_dispute_id` UNIQUE; orphan chargebacks alert RAV team |
| **I** — Jurisdiction field on bookings + per-state disclosure logic | [#466](https://github.com/rent-a-vacation/rav-website/issues/466) | ⏸ Blocked | — | Gated on counsel input under #80 — counsel must confirm which states require what disclosure copy and which cancellation overrides apply |

**Net of Session 63:** 7 of 9 gaps queued for closure this session. F is explicit deferral. I is gated on legal counsel.

---

## 7. Legal-reference index *(to be populated)*

> **Status:** Placeholder pending counsel inputs. The user has indicated they will share specific statutes / regulations / case references; each reference will land in this section, mapped to the relevant section of this doc and `PAYSAFE-FLOW-SPEC.md`.

Format planned:

```
### 7.x [Jurisdiction] — [Topic]
- **Statute:** [citation] ([statute name])
- **What it requires:** [plain-English summary]
- **How RAV is compliant:** [link back to §3 / §4 / §5 above + specific implementation reference]
- **Counsel guidance:** [date received, summary]
```

Anticipated jurisdictions / topics (from `PAYSAFE-FLOW-SPEC.md` §7):

- **Federal — money transmission** (FinCEN 31 CFR 1010.100(ff)): how Stripe handles the licensure burden, why RAV is not an MSB
- **Florida — Ch. 721 F.S. (Florida Vacation Plan & Timeshare Act)**: language constraints on listings (no "sale of interest")
- **Hawaii — Transient Accommodations Tax**: handled by Stripe Tax post-#127
- **Tennessee — short-term-rental ordinances** (e.g., Nashville Metro 17.16.250.E): host responsibility, platform disclosure
- **California — Civil Code §1689 / §1689.5** (consumer cancellation overrides)
- **New York — General Business Law §§349/350 + §527**
- **Card-network chargebacks**: Stripe-managed; RAV maintains evidence within Gap H window

---

## 8. How this doc relates to other RAV docs

| Doc | Relationship |
|---|---|
| `PAYSAFE-FLOW-SPEC.md` | The *system* spec — exact migration files, edge fns, line numbers, state diagrams. This compliance doc cites it for every "as-implemented" claim. |
| `payment-policy.md` (`docs/support/policies/`) | Public-facing policy — what travelers see in Help / Trust & Safety. Uses *consumer-readable* language; this doc uses *legally-precise* language. Currently `status: draft` pending #80. |
| `cancellation-policy.md` (`docs/support/policies/`) | Public-facing cancellation tiers + override notes — public version of §4 here. |
| `RAV-PRICING-TAXES-ACCOUNTING.md` | Fee structure + commission tiers + accounting flow (DEC-022). Adjacent to compliance — covers *what* fees are charged, not *under what authority*. |
| `ARCHITECTURE.md` | Cross-cutting concerns and system overview. Links here for the compliance angle. |
| `DECISIONS.md` / `PROJECT-HUB.md` (Key Decisions Log) | DEC-038 (spec creation), DEC-039 (this compliance doc + Tier B promotion of C/D) |

---

## 9. Revision history

| Date | Session | Change |
|---|---|---|
| 2026-05-02 | 63 | Initial creation. §§1–8 seeded with the marketplace + Stripe-Connect compliance posture. Gap closure register populated with current Session 63 work plan (A/B/C/D/E/G/H queued; F deferred; I gated on #80). §7 left as placeholder for incoming counsel references. |
