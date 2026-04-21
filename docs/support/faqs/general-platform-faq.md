---
last_updated: "2026-04-21T22:35:57"
change_ref: "1d0c62c"
change_type: "session-57-phase22-B3"
status: "active"
title: "General Platform FAQ"
doc_type: "faq"
audience: ["renter", "owner"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["faq", "platform", "voice", "ravio", "referral", "tools", "smartearn", "smartprice", "pwa"]
---

# General Platform FAQ

## Summary

Broad answers about RAV itself — how the platform works end-to-end, voice search quotas, the referral program, free tools, and what's coming next. For role-specific FAQs see [`traveler-faq.md`](./traveler-faq.md) or [`property-owner-faq.md`](./property-owner-faq.md).

## Details

### What is Rent-A-Vacation?

A marketplace connecting timeshare owners (who have unused weeks) with travelers (who want brand-name resort stays at fair prices). Owners cover their maintenance fees + earn a bit; travelers save 30–60% vs booking through the resort directly. RAV retains a 15% commission per booking.

### How does the marketplace work?

Two-sided matching:

1. **Owners list weeks** (Pre-Booked Stays with specific dates) OR **respond to Wishes** (Wish-Matched Stays)
2. **Travelers search and book listings** directly OR **post Wishes** and wait for Offers

See [`booking-workflow.md`](../processes/booking-workflow.md) and [`bidding-process.md`](../processes/bidding-process.md).

### Who can use RAV?

- **Travelers:** anyone 18+ (age verification enforced at signup). US-based accounts supported first; international travelers can book existing listings.
- **Owners:** US-based owners of timeshare weeks or memberships. Verification required (deed, certificate, or ID).

### RAVIO — text and voice assistants

#### What is RAVIO?

RAVIO is our conversational assistant. It has two modes:

- **Text chat** — always available via the chat button on every page. Uses OpenRouter/Gemini Flash. Free, no quota.
- **Voice search** — premium feature, quota-limited. Uses VAPI (Deepgram STT + GPT-4o-mini + ElevenLabs TTS) for search and discovery.

#### What are the voice search quotas?

Per-day limits (resets at midnight UTC):

| Tier | Voice searches / day |
|---|---|
| Free traveler | 5 |
| Plus traveler | 25 |
| Premium traveler | Unlimited |
| Free owner | 5 |
| Pro owner | 25 |
| Business owner | Unlimited |
| RAV team | Unlimited |

Admin can grant per-user overrides for special cases.

#### Does voice search handle account-specific questions?

No. Voice is scoped to **discovery and search** only ("find me a ski resort in March"). Account-specific questions ("why was I charged $50", "cancel my booking") go through the text chat, which has authenticated tool access to your account.

#### Why is there a voice quota?

Voice queries cost more than text (transcription + premium voice synthesis). The quota lets us offer the feature free at small scale while scaling properly with subscription tiers.

### Referral Program

#### How does the referral program work?

1. Go to `/account` (or `/owner-dashboard` → Account) → Referral Program
2. Share your unique referral code with friends
3. When they sign up with your code and complete their first booking, you both earn a reward
4. Rewards compound — no limit on referrals

Your dashboard shows pending signups, completed referrals, and earned rewards.

#### Can owners and travelers both refer?

Yes. Anyone with an account can refer anyone else. Referred users become owners or travelers based on how they sign up.

#### Are there referral terms?

Yes — see [`subscription-terms.md`](../policies/subscription-terms.md) (legal-blocked). Main rules: no self-referrals, no fraudulent signups, referrals must complete a real booking to trigger the reward.

### Free tools (RAV Tools Hub)

RAV provides 5 free tools at `/tools`:

1. **RAV SmartEarn** — calculates what you'd net listing a week (owner-side)
2. **RAV SmartPrice** — calculates fair nightly rate based on comparables
3. **RAV SmartCompare** — compares cost of ownership vs booking year-over-year
4. **RAV SmartMatch** — matches traveler preferences to best-fit resort brands
5. **RAV SmartBudget** — plans an annual vacation budget across destinations

All free, no login required.

### Account management

#### How do I change my email address?

`/account` → Profile tab → Change Email. Requires confirming the new email before the change takes effect. Your old email stays on file until confirmation.

#### How do I change my password?

`/account` → Security tab → Change Password. Also supports 2FA setup. See [`account-security-faq.md`](./account-security-faq.md).

#### Can I have multiple roles (traveler + owner)?

Yes. All accounts start as travelers. Request the `property_owner` role from `/owner-dashboard` to add it. You can switch between Traveler and Owner dashboards anytime.

### Notifications

#### How do I manage what I get notified about?

`/settings/notifications`. Per-type per-channel (in-app / email / SMS) toggles. Some notifications are mandatory (booking confirmations, dispute updates) and can't be disabled.

#### Does RAV support SMS notifications?

Not yet publicly — SMS infrastructure is built but pending business formation (LLC/EIN) and Twilio A2P 10DLC registration. When live, you'll be able to opt in per notification type.

### Admin and team accounts

#### What's a RAV team / RAV admin account?

Internal accounts for RAV staff. They have access to dispute review, listing moderation, owner verification, analytics, and other operational tools. Not available for self-signup.

### Platform maturity

#### What's the current launch status?

Pre-launch. Platform is in staff-only mode on production; a private beta begins after business formation completes. DEV environment is feature-complete and runs nightly end-to-end tests.

#### Will there be a native mobile app?

Planned. Epic #240 tracks Capacitor-based iOS + Android apps — not started yet, validated after PWA demand data post-launch (DEC-011).

## Examples

**Example 1 — Traveler hits voice quota**

"Voice search stopped working." → Check your tier — Free gets 5/day. Try text chat (no quota) for the remaining search needs. Plus tier unlocks 25/day voice.

**Example 2 — Owner asks about referrals**

"Can I refer other owners to get a discount on commission?" → The referral program rewards both parties when a referred user completes their first booking — not a commission discount, but a reward credit. Check `/owner-dashboard` → Account → Referral Program for your current earnings.

**Example 3 — Traveler wants to compare costs**

"Is timeshare worth it vs renting?" → Try `/tools/smartcompare`. It models cost over a horizon (say, 10 years) comparing direct ownership vs booking through RAV vs booking through the resort. Free, no login needed.

## Related

- [`booking-workflow.md`](../processes/booking-workflow.md) — full traveler journey
- [`bidding-process.md`](../processes/bidding-process.md) — Wishes + Offers
- [`property-owner-faq.md`](./property-owner-faq.md) — owner-specific
- [`traveler-faq.md`](./traveler-faq.md) — traveler-specific
- [`account-security-faq.md`](./account-security-faq.md) — password, 2FA, recovery
- [`billing-faq.md`](./billing-faq.md) — payments + subscription
- [`subscription-terms.md`](../policies/subscription-terms.md) — referral + tier terms (legal-blocked)
