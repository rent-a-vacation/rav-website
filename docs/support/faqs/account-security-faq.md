---
last_updated: "2026-04-21T22:44:19"
change_ref: "02726bd"
change_type: "session-57-phase22-B4"
status: "active"
title: "Account Security FAQ"
doc_type: "faq"
audience: ["renter", "owner"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["security", "password", "2fa", "login", "recovery", "account", "session"]
---

# Account Security FAQ

## Summary

Answers to account-security questions: password resets, 2FA, recovering a locked account, recognising phishing, and what to do if you suspect your account has been compromised.

## Details

### Password

#### How do I reset my password?

On `/login`, click **Forgot Password**. Enter your email. You'll receive a reset link valid for 1 hour. Follow the link, set a new password (8+ characters, mix of letters + numbers + symbols recommended).

#### How do I change my password while logged in?

`/account` → Security tab → Change Password. Requires current password + new password.

#### What are the password requirements?

- Minimum 8 characters
- At least one letter and one number
- We recommend a mix of upper/lower case + a symbol, or a passphrase of 4+ random words
- No length cap — use a password manager

#### I forgot my email — how do I recover my account?

Email `support@rent-a-vacation.com` with any identifying info: booking reference, payment last-4, name. RAV support manually verifies + issues a recovery link.

### 2FA (Two-Factor Authentication)

#### Does RAV support 2FA?

Yes. `/account` → Security tab → Enable 2FA. Uses TOTP-compatible apps (Google Authenticator, Authy, 1Password, etc.). Backup codes provided at setup — save them in a password manager.

#### I lost my 2FA device — how do I get back in?

1. Use one of your backup codes on the login page
2. If no backup codes: email `support@rent-a-vacation.com` with identifying info — manual verification + reset

#### Is 2FA required?

- **Renter accounts:** optional, strongly recommended
- **Owner accounts:** required for accounts with payout access (Stripe Connect onboarded)
- **RAV admin accounts:** required

### Sessions

#### How long does a login session last?

Access tokens are valid for 1 hour. Sessions refresh silently as long as you're active. Closing the browser does NOT log you out unless you're in incognito mode.

#### How do I see all my active sessions?

`/account` → Security tab → Active Sessions. Shows device, location, last active. You can revoke any session individually or all at once.

#### How do I log out of all devices?

Security tab → Revoke All Other Sessions. Forces re-login on every other device. Recommended if you suspect compromise.

### Phishing / suspicious emails

#### How can I tell if an email is really from RAV?

- Real RAV transactional emails come from `notifications@updates.rent-a-vacation.com` (Resend-verified domain)
- Real support emails come from `support@updates.rent-a-vacation.com`
- Incoming support inbox: `support@rent-a-vacation.com` (Cloudflare catch-all)
- RAV will **never** ask for your password, 2FA code, or full credit card by email or phone
- We may ask for the last 4 digits of your card or confirm your booking reference for identity verification

#### I got a suspicious email claiming to be from RAV

Don't click any links. Forward the email to `support@rent-a-vacation.com` with "PHISHING REPORT" in the subject. We'll investigate + alert other users if it's a known scam. Then delete.

#### Someone is impersonating RAV on social media / text / phone

Report to `support@rent-a-vacation.com` with screenshots. We'll file takedown requests where possible.

### Suspected compromise

#### I think someone accessed my account — what do I do?

1. **Change your password immediately** (from `/account` → Security, or Forgot Password if locked out)
2. **Revoke all other sessions** (Security tab)
3. **Enable 2FA** if not already on
4. **Check recent activity:** Bookings, payment methods, listings — anything unexpected?
5. **File a dispute** with category `account_security` + description of what you observed
6. RAV support responds within 4 hours (or faster at higher tiers — see [`support-sla.md`](../processes/support-sla.md))

#### What can RAV do if my account was compromised?

- Reset credentials
- Roll back unauthorised bookings (full refunds issued via dispute resolution)
- Remove unauthorised listings or reviews
- Review audit logs for unauthorised access to identify compromise vector
- If financial loss occurred, coordinate with Stripe to dispute + chargeback as appropriate

### Payment security

#### Does RAV store my credit card number?

No. All card data lives in Stripe, which is PCI DSS Level 1 compliant. RAV sees only the last 4 digits + expiration + card type for display.

#### How do I remove a saved card?

`/account` → Payment Methods tab → Remove. Cards in use by an active subscription must have a replacement before removal.

### Account deletion

#### How do I delete my account?

`/account` → Delete Account. Confirms via email. GDPR-compliant deletion removes personal data. Required records (tax, disputes) retained per retention schedule.

#### Is deletion reversible?

Not after the 7-day grace period. Within 7 days of deletion request, contact support to restore.

## Examples

**Example 1 — User forgot password**

"I can't log in." → Click Forgot Password on /login. Check email (including spam folder) for reset link. Link expires in 1 hour.

**Example 2 — User lost 2FA device**

"My phone died and I can't get my 2FA code." → Use a backup code from the set saved at setup. If none, email support with booking reference + last-4 of card. Manual verification + 2FA reset.

**Example 3 — User sees unfamiliar booking**

"There's a booking on my account I didn't make." → Change password now. Revoke other sessions. File `account_security` dispute. Support responds < 4 hours, refunds the unauthorised booking, investigates compromise vector.

## Related

- [`customer-support-escalation.md`](../processes/customer-support-escalation.md) — escalation for security incidents
- [`support-sla.md`](../processes/support-sla.md) — response time for account security
- [`privacy-policy.md`](../policies/privacy-policy.md) — data handling + retention (legal-blocked)
- [`general-platform-faq.md`](./general-platform-faq.md) — platform basics
- Email: `support@rent-a-vacation.com`
