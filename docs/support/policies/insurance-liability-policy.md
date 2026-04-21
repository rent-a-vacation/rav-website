---
last_updated: "2026-04-21T22:53:24"
change_ref: "e5b8e77"
change_type: "session-57-phase22-B5"
status: "draft"
title: "Insurance & Liability Policy (DRAFT — pending legal review)"
doc_type: "policy"
audience: ["renter", "owner"]
version: "0.1.0"
legal_review_required: true
reviewed_by: null
reviewed_date: null
tags: ["insurance", "liability", "damage", "security-deposit", "trip-insurance", "draft", "legal-blocked"]
---

# Insurance & Liability Policy (DRAFT)

> **DRAFT — pending lawyer review (#80).**

## Summary

Rent-A-Vacation provides platform-level adjudication for disputes, but is not an insurance company. Property damage, personal injury, trip interruption, and cancellation-for-cause coverage are the responsibility of the user through their own insurance or third-party travel insurance. This policy describes what coverage RAV does and does not provide, and recommended user protections.

## Details

### 1. What RAV provides

- **Platform adjudication** — disputes resolved per [`dispute-resolution.md`](../processes/dispute-resolution.md), including refund decisions up to 100% of booking value
- **Emergency assistance coordination** — help finding alternative accommodation in safety emergencies (actual reimbursement via dispute + refund flow)
- **Fraud prevention** — identity verification, listing moderation, platform bans for bad actors
- **Payment protection** — Stripe-backed fraud protection on card payments

### 2. What RAV does NOT provide

- **Property damage insurance** — RAV does not reimburse an owner for physical damage caused by a renter, beyond what the dispute process determines
- **Renter injury insurance** — RAV does not cover medical costs or trip interruption
- **Trip cancellation insurance** — "cancel for any reason" coverage is not provided; refunds follow the cancellation policy
- **Lost / stolen belongings insurance** — not covered
- **Resort-side disruptions** — hurricanes, maintenance shutdowns, COVID-style closures; RAV facilitates refunds per policy but is not financially responsible for the underlying disruption

### 3. Recommended protections

**For renters:**
- Travel insurance through a third-party (Allianz, Travel Guard, credit card benefits)
- Trip cancellation / interruption coverage
- Medical coverage abroad
- Rental car coverage if driving

**For owners:**
- Homeowner / condo policy with short-term rental rider (check your insurer)
- Separate rental liability policy if your primary policy excludes rentals
- Security deposit via the booking (if supported) to cover minor damages

### 4. Security deposits

- Owners may request a security deposit as part of the listing (where supported)
- Held by Stripe as an authorization (not charged) at booking
- Released post-stay if no damage claim within 48h
- Converted to a charge if owner files a damage claim with evidence; renter may dispute via normal process

### 5. Damage claims (owner-initiated)

1. Owner files dispute with category `renter_damage` and photos + repair estimate within 48h of check-out
2. Renter has 48h to respond
3. Admin reviews evidence, decides:
   - Claim accepted → charge security deposit or (if no deposit) attempt charge on original payment method
   - Claim denied → no charge; owner may pursue external recovery
   - Split → partial charge
4. Renter may appeal with new evidence
5. Disputes over damage amounts are capped at the security deposit or $[cap TBD, suggest $2000] whichever is lower; larger claims must be pursued externally

### 6. Injury claims

- Report injuries to 911 first, then to RAV
- RAV will facilitate contact between the parties but does not pay injury claims
- Travel insurance or personal health insurance should cover medical costs
- The owner's insurance is responsible for property-caused injuries (e.g., broken stair)

### 7. Force majeure

If a stay is disrupted by a force majeure event (hurricane, earthquake, resort-mandated closure, pandemic restrictions):

- Renter gets a full refund regardless of the standard cancellation policy
- Owner gets their payout if the stay was not fulfilled due to reasons beyond their control and RAV determines fault lies with force majeure only
- Admins have discretion in close calls; trip insurance is the right answer for consistent coverage

### 8. Liability limits

Per [`booking-terms.md`](./booking-terms.md), RAV's maximum liability for any dispute or claim is limited to the amount paid for the relevant booking.

### 9. Subrogation

Where a third-party insurer (owner's homeowner, renter's travel insurance) pays a claim, that insurer may pursue subrogation against the other party. RAV will cooperate with reasonable information requests from such insurers.

### 10. Safety inspections

RAV does not physically inspect listings. Owners warrant they meet resort / building / local safety standards. Failures surface through the dispute process and may result in listing removal.

### 11. Contact

- Damage claims: via `Report Issue → renter_damage` on the affected booking
- Injury or safety incidents: `safety@rent-a-vacation.com`
- Insurance inquiries: `legal@rent-a-vacation.com`

## Related

- [`dispute-resolution.md`](../processes/dispute-resolution.md) — how damage claims are adjudicated
- [`refund-policy.md`](./refund-policy.md) — refund mechanics
- [`emergency-safety-escalation.md`](../processes/emergency-safety-escalation.md) — safety-critical flow
- [`booking-terms.md`](./booking-terms.md) — liability cap (legal-blocked)
- [`trust-safety-policy.md`](./trust-safety-policy.md) — behavioral standards (legal-blocked)
