---
last_updated: "2026-04-21T22:53:24"
change_ref: "e5b8e77"
change_type: "session-57-phase22-B5"
status: "draft"
title: "Booking Terms of Service (DRAFT — pending legal review)"
doc_type: "policy"
audience: ["renter", "owner"]
version: "0.1.0"
legal_review_required: true
reviewed_by: null
reviewed_date: null
tags: ["booking", "terms", "tos", "agreement", "liability", "draft", "legal-blocked"]
---

# Booking Terms of Service (DRAFT)

> **DRAFT — pending lawyer review (#80). Not user-facing until `reviewed_by` + `reviewed_date` are set and `status: 'active'`.**

## Summary

These are the binding terms between Rent-A-Vacation, travelers (renters), and property owners for every booking made through the platform. By completing a booking, you accept these terms.

## Details

### 1. The parties

- **RAV** — the platform operator
- **Owner** — the user who listed the property
- **Renter (Traveler)** — the user booking the property

RAV is a marketplace facilitator. The Owner is the primary party providing the timeshare week.

### 2. RAV's role

RAV provides the platform: listings, search, communication, payment collection, escrow, dispute resolution. RAV does not own the properties, does not physically inspect them, does not hold the resort reservations, and is not the counterparty to the stay itself.

### 3. Eligibility

- Renters must be 18+ and provide accurate account info
- Owners must own the listed week (or have rights to rent it) and pass RAV verification
- Both parties must comply with applicable law and these terms

### 4. Booking formation

A booking is formed when:

- Renter completes payment for a Pre-Booked listing (instant)
- Owner confirms the resort reservation for a Wish-Matched booking (post-payment, within the confirmation deadline)

Until the booking is confirmed, no stay is guaranteed.

### 5. Pricing and fees

- Listed price is set by the Owner
- RAV commission (15%, or tier-adjusted for Owner Pro/Business) is included
- Stripe payment processing fees are included
- Taxes applied per applicable law

All fees are visible at checkout. No surprise charges.

### 6. Cancellation

Per each listing's cancellation policy (`flexible`, `moderate`, `strict`, `super_strict`). See [`cancellation-policy.md`](./cancellation-policy.md) for the authoritative rules.

Owner-initiated cancellations always result in a 100% refund to the renter.

### 7. Refunds

Per [`refund-policy.md`](./refund-policy.md). Settled via Stripe, typically 5–10 business days.

### 8. Disputes

If either party believes the other has breached these terms or the listing description, they may file a dispute via the platform. RAV adjudicates. Admin decisions may include refunds, account restrictions, or listing removal. See [`dispute-resolution.md`](../processes/dispute-resolution.md) (internal) — public summary embedded here.

### 9. Property condition and access

Owner warrants that:

- The property matches the description and photos in all material respects
- The resort reservation is valid at the time of check-in (or will be, for Wish-Matched)
- Check-in details will be communicated to the renter in advance
- The property will be clean and in habitable condition

Renter accepts the property "as described" subject to the dispute process for material discrepancies.

### 10. Renter conduct

Renter agrees:

- Guest count will not exceed the listing maximum
- Parties, smoking, pets only if listing explicitly permits
- Reasonable care of the property
- Compliance with resort rules
- No illegal activity on the premises

Violations may result in dispute rulings against the renter, chargebacks to the renter's account, or platform bans.

### 11. Owner conduct

Owner agrees:

- Listing is accurate and kept up to date
- Resort reservation will be honored for the full booked stay
- No discrimination per [`trust-safety-policy.md`](./trust-safety-policy.md)
- Prompt response to renter messages
- No demand for cash, side payments, or off-platform contact

Violations may result in listing suspension, dispute rulings against the owner, or platform bans.

### 12. Liability

RAV is not liable for:

- Injury or property damage during the stay (see [`insurance-liability-policy.md`](./insurance-liability-policy.md))
- Acts of god, natural disasters, resort closures outside Owner's control
- Owner's failure to deliver (but RAV will refund the renter per dispute resolution)
- Renter's misuse of the property (but Owner may seek damages via dispute)

RAV's maximum liability to any user is limited to the amount paid for the relevant booking.

### 13. Indemnification

Each user agrees to indemnify RAV for claims arising from their use of the platform beyond RAV's platform-level liability.

### 14. Governing law

These terms are governed by the laws of [state TBD upon formation]. Disputes are resolved in [forum TBD] except where AAA arbitration is required.

### 15. Modifications

RAV may update these terms. Material changes notified 30 days in advance. Continued use after notice constitutes acceptance.

### 16. Termination

- Either party may terminate the relationship for material breach, with notice
- RAV may suspend or terminate accounts for violations of these terms or the safety policy
- Termination does not affect bookings already in progress (those are completed per the normal flow)

### 17. Contact

- Terms questions: `legal@rent-a-vacation.com`
- Disputes: `disputes@rent-a-vacation.com` or via the in-platform dispute flow

## Related

- [`cancellation-policy.md`](./cancellation-policy.md)
- [`refund-policy.md`](./refund-policy.md)
- [`payment-policy.md`](./payment-policy.md) (legal-blocked)
- [`trust-safety-policy.md`](./trust-safety-policy.md) (legal-blocked)
- [`insurance-liability-policy.md`](./insurance-liability-policy.md) (legal-blocked)
- [`privacy-policy.md`](./privacy-policy.md) (legal-blocked)
- [`dispute-resolution.md`](../processes/dispute-resolution.md) — internal procedure
