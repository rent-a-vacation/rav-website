---
last_updated: "2026-04-21T22:53:24"
change_ref: "e5b8e77"
change_type: "session-57-phase22-B5"
status: "draft"
title: "Payment Policy (DRAFT — pending legal review)"
doc_type: "policy"
audience: ["renter", "owner"]
version: "0.1.0"
legal_review_required: true
reviewed_by: null
reviewed_date: null
tags: ["payment", "stripe", "fees", "commission", "payout", "draft", "legal-blocked"]
---

# Payment Policy (DRAFT)

> **DRAFT — pending lawyer review (#80).**

## Summary

All payments on Rent-A-Vacation are processed by Stripe. RAV retains a 15% commission on each booking; the remainder flows to the property owner after stay completion. Subscription fees for Plus/Premium/Pro/Business are billed per cycle with no mid-cycle refunds for voluntary downgrades.

## Details

### 1. Payment processing

- Card payments via Stripe Checkout (Visa, Mastercard, Amex, Discover, Apple Pay, Google Pay, Link)
- Currency: USD
- RAV does not store card details; Stripe handles all PCI-sensitive data

### 2. Booking fees and commission

| Component | Rate |
|---|---|
| Owner's nightly rate × nights | Set by Owner |
| RAV platform commission | 15% (Free tier) |
| RAV platform commission | 13% (Owner Pro) |
| RAV platform commission | 10% (Owner Business) |
| Stripe payment processing fee | Varies by card/region |
| Taxes | Per Stripe Tax where applicable |

Renter sees the all-in total at checkout. Owner sees net payout before accepting/listing.

### 3. Owner payouts

- Held in escrow until stay completes without open dispute
- Released via Stripe Connect (Express accounts) to the owner's linked bank account
- Typical bank arrival: 2–3 business days after release
- Stripe Connect payout schedule configurable per owner

### 4. Escrow

Funds collected at booking are held by Stripe in RAV's platform account until:

- Stay completes + dispute window lapses → release to owner
- Dispute is filed → held until admin resolves
- Cancellation → refunded per [`cancellation-policy.md`](./cancellation-policy.md)

### 5. Refunds

Per [`refund-policy.md`](./refund-policy.md):

- Settle to the original payment method in 5–10 business days
- Stripe processing fees retained (non-recoverable)
- Partial or full per cancellation policy or admin dispute decision

### 6. Subscriptions

- Plus / Premium (traveler) and Pro / Business (owner) billed via Stripe Subscriptions
- Monthly or annual billing cycles per the plan selected
- Immediate upgrades prorated; downgrades effective next cycle
- Cancellations effective at end of current cycle; no mid-cycle refunds for voluntary cancellation

See [`subscription-terms.md`](./subscription-terms.md) for full subscription terms.

### 7. Chargebacks

- Chargebacks initiated by the cardholder with their bank incur a Stripe dispute fee
- RAV will defend chargebacks where our records support the charge was authorised and fulfilled
- Disputes through the platform (vs. chargeback) are strongly preferred — faster, non-adversarial
- Abusive chargebacks may result in account bans

### 8. Tax

- Applicable sales / occupancy tax is computed and collected by Stripe Tax where enabled
- Owners are responsible for their own income tax on earnings
- RAV issues 1099-K to owners meeting IRS thresholds (annually by January 31)

### 9. Failed payments

- Card decline at booking → no booking created, renter prompted to retry
- Card decline on subscription renewal → retry per Stripe Smart Retries; subscription moved to past_due; access to tier features restricted after 7 days
- Account locked after 30 days of past_due with no resolution

### 10. Currency and FX

- USD-denominated for all bookings and subscriptions
- International cards: FX handled by the issuing bank
- No wire transfers or ACH transfers for bookings (Stripe-only)

### 11. Refund disputes

If a refund isn't reflected in your account within 14 business days, contact `billing@rent-a-vacation.com` with your booking reference. We'll provide the Stripe refund ID for you to share with your bank.

### 12. Contact

- Billing questions: `billing@rent-a-vacation.com`
- Payout questions (owners): `payouts@rent-a-vacation.com`

## Related

- [`cancellation-policy.md`](./cancellation-policy.md)
- [`refund-policy.md`](./refund-policy.md)
- [`booking-terms.md`](./booking-terms.md) (legal-blocked)
- [`subscription-terms.md`](./subscription-terms.md) (legal-blocked)
- [`billing-faq.md`](../faqs/billing-faq.md) — common payment questions
