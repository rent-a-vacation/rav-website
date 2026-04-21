---
last_updated: "2026-04-21T22:35:57"
change_ref: "1d0c62c"
change_type: "session-57-phase22-B3"
status: "active"
title: "Billing & Payments FAQ"
doc_type: "faq"
audience: ["renter", "owner"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["faq", "billing", "payment", "stripe", "tax", "1099-k", "commission", "fees", "charges"]
---

# Billing & Payments FAQ

## Summary

Answers to the most common questions about charges, refunds, commission, payouts, tax documents, and Stripe-specific behavior on Rent-A-Vacation.

## Details

### Traveler payment questions

#### What payment methods are accepted?

Stripe Checkout supports all major credit and debit cards (Visa, Mastercard, Amex, Discover) plus Apple Pay, Google Pay, and Link. Some regions also see bank-debit options. Currency is USD.

#### When is my card charged?

Immediately at checkout. Pre-Booked Stays confirm instantly; Wish-Matched Stays hold the charge and confirm after the owner verifies the reservation. Either way the charge posts right away.

#### When will I see a refund in my account?

Refunds post to Stripe as soon as the cancellation is processed. They settle to your bank/card in **5–10 business days** (up to 14 days for international cards). See [`refund-policy.md`](../policies/refund-policy.md).

#### What's the 15% fee?

RAV charges a 15% commission on every booking to cover platform, payment, and support costs. It's already included in the displayed total — there are no surprise add-ons at checkout.

#### Why am I seeing tax on my booking?

If the owner's region has tax-collection requirements and RAV has Stripe Tax enabled in that region, Stripe computes and collects the required tax amount. Pre-launch, Stripe Tax is gated behind an env flag and may be off on your account.

#### I was charged but didn't receive a confirmation — what do I do?

Check `/my-trips` first. If the booking shows there, confirmation is in place — the email may have been delayed. If it doesn't appear, file a payment dispute from Report Issue within your session, or contact support. The Stripe payment can be verified by our team using the email you used at checkout.

### Owner payout questions

#### When do I get paid?

Payouts release after the traveler's stay completes. We use Stripe Connect (Express accounts). Once the stay ends and no dispute is open, the transfer posts to your Stripe account and typically lands in your bank within 2–3 business days (your Stripe payout schedule applies).

#### Why is my payout "held in escrow"?

Funds are held from booking until after stay completion to protect both sides from disputes. This is a platform-wide rule, not a per-owner setting.

#### Can I see all my past payouts?

Yes — `/owner-dashboard` → Bookings & Earnings tab → Earnings sub-section lists every booking with amount, payout status, and Stripe transfer ID.

#### What happens to my payout if the renter cancels?

Depends on the cancellation policy and timing. For renter-initiated cancellations before check-in, the refunded portion comes out of what would have been your payout. Owner-initiated cancellations return 100% to the renter, so no payout for that booking. See [`refund-policy.md`](../policies/refund-policy.md).

#### What happens to my payout if there's a dispute?

Escrow is held until the dispute resolves. If the admin rules in the renter's favor, the refund is pulled from your escrowed amount. If it rules in your favor, the full payout releases.

### Tax / 1099-K questions

#### Do I need to declare RAV income on taxes?

Yes, rental income from RAV is taxable. RAV reports payments to the IRS via 1099-K when you exceed thresholds.

#### When do I get a 1099-K?

The 1099-K is issued annually (by January 31) for the prior tax year if you met IRS reporting thresholds for the year. Stripe generates and emails the form directly based on the reporting thresholds in effect that year.

#### Where do I see my tax summary?

`/owner-dashboard` → Tax tab shows year-to-date earnings, a downloadable CSV, and 1099-K status.

#### What records should I keep for taxes?

- Each booking's gross amount, RAV commission, net payout
- Any refunds issued
- Any dispute settlements
- Any property-related expenses (maintenance fees, owner's cost basis, etc.) — not tracked by RAV

Consult a tax professional for your specific situation.

### Subscription billing (Plus / Premium / Pro / Business)

#### How do I see my subscription?

`/account` → Subscription tab. Shows current tier, next renewal date, Stripe customer portal link.

#### How do I cancel or change my subscription?

Use the "Manage Subscription" button on the Subscription tab — it opens the Stripe Customer Portal where you can upgrade, downgrade, or cancel. Changes take effect at the end of the current billing period (for cancels) or immediately (for upgrades, prorated).

#### Will I get a refund if I downgrade mid-cycle?

Subscriptions bill per cycle. Downgrades apply at the next cycle; no mid-cycle refunds. See [`subscription-terms.md`](../policies/subscription-terms.md) for the full terms.

#### What happens to my booked trips if I cancel my subscription?

Existing bookings are unaffected. Tier-gated features you used to create those bookings remain honored. You just lose forward access to tier features.

## Examples

**Example 1 — Traveler checks their refund status**

"I cancelled yesterday. When do I see my money?" → Refund was processed immediately in Stripe; settles in 5–10 business days. Check your card statement, or the pending refunds area of your bank's app.

**Example 2 — Owner's first payout timing**

"My first booking's stay ended yesterday. When do I get paid?" → Payout releases after the stay completes (usually within 24h) to your Stripe Connect account. Your Stripe payout schedule determines bank arrival (often 2-3 business days).

**Example 3 — Owner asks about 1099-K in February**

"I haven't received my 1099-K, is there a problem?" → If you met the IRS threshold, Stripe emails directly by Jan 31. Check Spam. If you met the threshold and it's not there by mid-Feb, contact support.

## Related

- [`refund-policy.md`](../policies/refund-policy.md) — refund flow + settlement times
- [`cancellation-policy.md`](../policies/cancellation-policy.md) — refund % per policy tier
- [`payment-policy.md`](../policies/payment-policy.md) — public-facing fee and processing terms (legal-blocked)
- [`subscription-terms.md`](../policies/subscription-terms.md) — subscription lifecycle (legal-blocked)
- [`property-owner-faq.md`](./property-owner-faq.md) — owner-side questions
- [`booking-faq.md`](./booking-faq.md) — booking-specific questions
