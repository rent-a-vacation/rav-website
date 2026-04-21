---
last_updated: "2026-04-21T22:53:24"
change_ref: "e5b8e77"
change_type: "session-57-phase22-B5"
status: "draft"
title: "Subscription Terms (DRAFT — pending legal review)"
doc_type: "policy"
audience: ["renter", "owner"]
version: "0.1.0"
legal_review_required: true
reviewed_by: null
reviewed_date: null
tags: ["subscription", "plus", "premium", "pro", "business", "tiers", "referral", "draft", "legal-blocked"]
---

# Subscription Terms (DRAFT)

> **DRAFT — pending lawyer review (#80). Covers both subscription tiers and the referral program.**

## Summary

Rent-A-Vacation offers optional paid subscriptions for travelers (Plus, Premium) and owners (Pro, Business). These unlock enhanced features, lower commissions, and priority support. This document is distinct from booking terms — subscriptions bill separately from bookings.

## Details

### 1. Available plans

**Traveler:**

| Tier | Monthly | Annual | Benefits |
|---|---|---|---|
| Free | $0 | $0 | RAVIO text chat, 5/day voice, basic booking |
| Plus | $9.99 | $99 | 25/day voice, early access to new listings, exclusive deals |
| Premium | $29.99 | $299 | Unlimited voice, Concierge support, priority support SLA |

**Owner:**

| Tier | Monthly | Annual | Benefits |
|---|---|---|---|
| Free | $0 | $0 | Standard listing, 15% commission |
| Pro | $19.99 | $199 | Priority listing placement, 13% commission, 25/day voice |
| Business | $49.99 | $499 | Dedicated account manager, 10% commission, unlimited voice |

*(Prices subject to change; grandfathered rates for existing subscribers on material changes.)*

### 2. Billing

- Stripe Subscriptions billed in advance per cycle
- Payment methods: same as booking payments (card, Apple/Google Pay, Link)
- Automatic renewal unless cancelled before the renewal date
- Receipts emailed for each charge

### 3. Upgrades

Immediate; prorated charge for remaining cycle. Full access to new tier from upgrade moment.

### 4. Downgrades

Effective at the next cycle. No mid-cycle refund. Current tier features remain until cycle end.

### 5. Cancellations

- Self-service via `/account` → Subscription → Manage (Stripe Customer Portal)
- Effective at end of current billing cycle
- No mid-cycle refund for voluntary cancellation
- Features continue until cycle end; no charge on next cycle

### 6. Refund eligibility (exceptions)

Refunds available for:

- **Double-charged** by error → full refund of duplicate
- **Stripe dispute with valid cause** → per Stripe's resolution
- **Material change in subscription terms** within 30 days of notification → pro-rated refund if cancelling in response
- **Platform material failure** (extended outage, etc.) — admin discretion

Refund requests: `billing@rent-a-vacation.com` with subscription ID.

### 7. Past-due handling

- Failed renewal → Stripe Smart Retries (up to 4 attempts over 14 days)
- After 4th failure → subscription moved to `past_due`
- Features restricted to Free tier after 7 days past_due
- Account locked after 30 days without resolution
- Bookings remain honored; only forward tier access is affected

### 8. Tier commitments (for owners)

- **Owner Pro / Business commission rates** applied to bookings made while the subscription is active
- If subscription lapses mid-booking cycle: commissions for NEW bookings revert to Free-tier 15%; existing confirmed bookings retain the tier rate

### 9. Referral Program

#### Terms

- Each user has a unique referral code from `/account` → Referral Program
- When a new user signs up with that code AND completes their first paid booking:
  - Both referrer and referee earn a reward (amount per current program rules — subject to change)
- No limit on number of referrals
- Referral codes valid indefinitely unless the referrer's account is banned

#### Restrictions

- Self-referrals prohibited (same email, same payment method, same household where determinable)
- Fake accounts, cancelled-for-refund bookings, and bookings later charged back do not count
- RAV may claw back rewards if fraud is detected
- Rewards not transferable to cash; redeemable as RAV credits against future bookings

#### Changes

- Reward amounts and rules can change with 30 days' notice to program participants
- Existing pending rewards honored under the rules in effect when earned

### 10. Tier feature exclusions

Tier features listed are the current set; we may add or adjust features. Removals of existing tier-exclusive features will be announced with 30 days' notice, and subscribers may cancel for pro-rated refund.

### 11. Taxes

Subscription prices are pre-tax. Applicable sales tax collected at checkout per Stripe Tax configuration.

### 12. Affiliate / business subscriptions

Custom enterprise / affiliate arrangements available for bulk owners or corporate travel programs. Contact `business@rent-a-vacation.com`.

### 13. Termination by RAV

RAV may terminate a subscription for:

- Platform terms violations (see [`trust-safety-policy.md`](./trust-safety-policy.md))
- Payment failures beyond the retry window
- Fraud or abuse

In such cases, pro-rated refund at admin discretion; forfeiture for fraud/abuse.

### 14. Governing law

Per [`booking-terms.md`](./booking-terms.md) governing law section.

### 15. Contact

- Subscription questions: `billing@rent-a-vacation.com`
- Referral questions: `referrals@rent-a-vacation.com`

## Related

- [`payment-policy.md`](./payment-policy.md) — payment processing (legal-blocked)
- [`booking-terms.md`](./booking-terms.md) — booking T&Cs (legal-blocked)
- [`billing-faq.md`](../faqs/billing-faq.md) — common subscription questions
- [`general-platform-faq.md`](../faqs/general-platform-faq.md) — referral program overview
- [`support-sla.md`](../processes/support-sla.md) — tier-based support SLAs
