---
last_updated: "2026-04-21T22:53:24"
change_ref: "e5b8e77"
change_type: "session-57-phase22-B5"
status: "draft"
title: "Privacy Policy (DRAFT — pending legal review)"
doc_type: "policy"
audience: ["renter", "owner", "admin"]
version: "0.1.0"
legal_review_required: true
reviewed_by: null
reviewed_date: null
tags: ["privacy", "gdpr", "ccpa", "data", "retention", "draft", "legal-blocked"]
---

# Privacy Policy (DRAFT)

> **This is a DRAFT held at `status: draft` pending lawyer review (#80). Not shown to end users until `reviewed_by` + `reviewed_date` are set and `status: 'active'`.**

## Summary

Rent-A-Vacation (RAV) collects, uses, and shares personal information as necessary to operate the timeshare marketplace — accounts, bookings, payments, support. We do not sell personal information. This policy explains what we collect, why, how it's protected, and your rights.

## Details

### 1. Who we are

"Rent-A-Vacation" or "RAV" means Rent-A-Vacation LLC (pending formation — placeholder), a [state] limited liability company, and its authorized operators of the website, apps, and services at rent-a-vacation.com.

### 2. Information we collect

**You provide:**

- Account info: email, name, password (hashed), phone number (optional)
- Identity verification (owners only): government ID, deed, certificate — reviewed, retained per legal requirements, not shared publicly
- Listings and Wishes content: descriptions, photos, pricing, preferences
- Payment info: card details (handled by Stripe; RAV never stores full card numbers), billing address
- Messages: pre-booking inquiries, booking-thread messages, dispute evidence
- Support interactions: RAVIO chats, support tickets

**Collected automatically:**

- Device info: browser, OS, IP address, device identifiers
- Usage data: pages visited, search queries, listings viewed, bookings made
- Cookies and similar technologies (see Cookie Policy section)
- Crash/error data (via Sentry)

**From third parties:**

- OAuth providers (Google) if you sign in via OAuth — name, email, profile photo
- Stripe — payment status, last-4 digits, payout status (for owners)
- Identity verification providers (if/when integrated)

### 3. How we use information

- Operate the marketplace: matching travelers with owners, processing bookings/Offers, payments, payouts
- Authenticate you and maintain your account
- Send transactional emails (booking confirmations, dispute updates, owner payouts)
- Send marketing communications (only with your opt-in; always with an unsubscribe link)
- Provide customer support (including authenticated tool access in RAVIO support queries)
- Detect fraud, abuse, safety issues
- Analytics for product improvement (internal only — no third-party ad tracking)
- Comply with legal obligations (tax reporting, dispute resolution, law enforcement requests)

### 4. How we share information

We share personal information with:

- **Other users as needed for bookings** — your name and communication with a specific counterparty during a booking
- **Stripe** — for payment processing (Stripe's privacy policy governs their handling)
- **Service providers** — email (Resend), hosting (Vercel, Supabase), error tracking (Sentry), analytics (GA4 with consent)
- **Law enforcement / legal process** — when legally required
- **Business transfers** — if RAV is acquired, merged, or assets transferred, information may transfer with the business

**We do not sell personal information** (CCPA/CPRA definition).

### 5. Cookies

- **Essential:** login session, CSRF, Stripe checkout session — cannot be disabled
- **Analytics:** GA4 — gated behind cookie consent banner, disabled unless you accept
- **Preferences:** theme, filters — stored locally

See the cookie consent banner on first visit. You can revoke consent anytime from `/account` → Privacy.

### 6. Your rights

Depending on your jurisdiction:

- **Access** — request a copy of your personal data (`/account` → Delete Account shows an export button before deletion)
- **Correction** — edit your profile and listings directly; contact support for other fields
- **Deletion** — `/account` → Delete Account for GDPR-compliant deletion; retention for tax and legal records applies
- **Portability** — export your data in machine-readable format
- **Opt-out of marketing** — unsubscribe link in every marketing email
- **Do not sell / share** (CCPA/CPRA) — we do not sell; no action needed

Exercise rights by emailing `privacy@rent-a-vacation.com` or via `/account`.

### 7. Data retention

| Category | Retention |
|---|---|
| Account data (active) | Until you delete your account |
| Account data (deleted) | 7-day grace period, then permanent deletion except required records |
| Booking records | 7 years (US tax + dispute resolution) |
| Payment records | 7 years (PCI + tax) |
| Identity verification docs | Per legal requirements, typically 7 years |
| Communication logs | 3 years, or until dispute resolution |
| Analytics | Aggregated; no individual retention beyond 24 months |

### 8. Security

- Passwords hashed (bcrypt/similar)
- TLS in transit
- Stripe handles all card data (PCI DSS Level 1)
- RLS on Supabase tables
- 2FA required for owner accounts with payout access + RAV admin accounts
- Annual security audits

Breach notification: we'll notify affected users within 72 hours of confirmed breach per GDPR / applicable state law.

### 9. International users

- Primary operation: US
- Data may be transferred to US servers (Supabase, Vercel, Stripe, Resend, Sentry, GA)
- Standard Contractual Clauses applied for EU users

### 10. Children

RAV requires users to be 18+. We do not knowingly collect data from anyone under 18. If you believe we have, contact `privacy@rent-a-vacation.com` for immediate removal.

### 11. Changes to this policy

Material changes notified via email to all active users 30 days in advance. Minor edits (clarifications, typos) posted without notification. Version history retained in this document's git history.

### 12. Contact

- Privacy questions: `privacy@rent-a-vacation.com`
- Data subject requests: `privacy@rent-a-vacation.com` (subject line: "DSR")
- EU representative (if required): TBD post-formation
- DPO (if required): TBD post-formation

## Examples

*(Not included in public-facing policies; omitted for this doc type.)*

## Related

- [`booking-terms.md`](./booking-terms.md) — public T&Cs (legal-blocked)
- [`trust-safety-policy.md`](./trust-safety-policy.md) — safety policy (legal-blocked)
- Cookie Policy — TBD (may be section of this doc post-review)
- [`account-security-faq.md`](../faqs/account-security-faq.md) — security practices
