---
last_updated: "2026-04-21T22:35:57"
change_ref: "1d0c62c"
change_type: "session-57-phase22-B3"
status: "active"
title: "Traveler FAQ"
doc_type: "faq"
audience: ["renter"]
version: "1.0.0"
legal_review_required: false
reviewed_by: null
reviewed_date: null
tags: ["faq", "traveler", "renter", "search", "wish", "offer", "discovery", "safety"]
---

# Traveler FAQ

## Summary

Broad answers to traveler questions not specific to booking or billing — search, Wishes, Offers, discovery, safety, and platform basics. See also [`booking-faq.md`](./booking-faq.md) for booking-specific questions and [`billing-faq.md`](./billing-faq.md) for payment questions.

## Details

### How is RAV different from Airbnb / Vrbo?

RAV specialises in **timeshare weeks from real owners** — not entire vacation rentals at market rates. You get the amenities of a major resort brand (Hilton, Marriott, Disney, Wyndham, etc.) at prices based on what the owner paid in maintenance fees, not speculative market rates. Typical savings are 30–60% vs booking the same unit through the resort directly.

### What brands and resorts are on the platform?

117 resorts across major brands: Hilton (62), Marriott (40), Disney (15), plus Wyndham, Westgate, WorldMark, and others. Browse `/destinations` to see what's available by region.

### How do I search effectively?

Use `/rentals` with filters: dates, brand, destination, price, amenities. Two conversational options:

- **RAVIO text chat** (always available on every page): "find me a Disney resort in March under $800"
- **VAPI voice search** (premium discovery feature, quota-gated): speak a similar query

Both understand brand, destination, dates, budget, and amenities and return ranked results.

### What's a Wish?

A **Wish** is a travel request you post when you don't find the perfect existing listing. Specify your destination, dates, budget, guest count, and preferences. Owners see your Wish and submit Offers with listings they can provide. You pick the one you like.

### How do I post a Wish?

`/wishes/new` → fill in the form → submit. Offers typically start arriving within 24-72 hours. You can extend or close your Wish anytime.

### What's an Offer?

An **Offer** is a proposed price + terms from either side of the marketplace:

- **On a Listing** — you propose a price below the listed price (if the owner enabled bidding). The owner accepts or rejects.
- **On a Wish** — an owner proposes a specific listing (resort + dates + price) in response to your Wish.

See [`bidding-process.md`](../processes/bidding-process.md) for the full flow.

### Can I pay less than the listed price?

Possibly. If the owner enabled Offers on a listing, you can submit an Offer below the listed price. The owner reviews and accepts/rejects. You can also post a Wish and let owners come to you at your budget.

### Can I save favorite listings?

Yes. Heart icon → `/my-trips` → Favorites.

### Can I save searches and get notified?

Yes. On `/rentals`, use **Save Search** after applying filters. You'll get notified when new listings match, and when price drops happen on saved searches.

### Is the property I'm renting safe?

Owners are identity-verified before they can list; RAV reviews verification documents. All bookings are protected by the dispute system — if anything is materially wrong (property not as described, safety issue, etc.), file an issue and the platform will adjudicate. See [`dispute-resolution.md`](../processes/dispute-resolution.md).

For emergencies during a stay (medical, safety threat), call local emergency services first. RAV's emergency support flow is documented in [`emergency-safety-escalation.md`](../processes/emergency-safety-escalation.md).

### How do I contact the owner?

**Before booking:** use "Ask the Owner" on the listing page (pre-booking inquiry thread).

**After booking:** use the booking's Messages tab. All messaging lives in one unified inbox.

### Does RAV have a mobile app?

Not yet (mobile epic #240 in planning). The web app is fully mobile-responsive — add it to your home screen and use it like a PWA.

### Does RAV support international travelers?

Yes. Bookings use USD and the platform is US-centric for now, but travelers from anywhere can book. Stripe handles currency conversion at card level.

### What accessibility features are supported?

All pages comply with WCAG 2.1 AA color contrast and keyboard-navigability standards. Screen reader support is tested. Tap targets meet 44×44px minimum on mobile. File `Report Issue → other` if you hit an accessibility bug.

### Does RAV collect my personal data?

Yes, as needed to operate the platform: account info (email, name), payment info (via Stripe, we never store card numbers), and booking history. See [`privacy-policy.md`](../policies/privacy-policy.md) (legal-blocked; published after lawyer review).

### Can I delete my account?

Yes. `/account` → Delete Account. GDPR-compliant deletion removes your personal data while retaining required records (tax + dispute history for the retention period).

### How do I refer a friend?

`/account` → Referral Program. Share your unique link; when a friend signs up and completes their first booking you both earn rewards. See [`general-platform-faq.md`](./general-platform-faq.md) for full details.

## Examples

**Example 1 — Traveler looking for specific brand**

"Any Hilton properties in March?" → Use /rentals filter: Brand = Hilton, Check-in = March. Results sorted by Fair Value + availability. Or post a Wish if nothing matches your budget.

**Example 2 — Traveler wants to pay less**

"This listing is $900, can I pay $700?" → Check if Offers are enabled on that listing. If yes, submit Offer of $700. Owner reviews and decides. If no, you can post a Wish with your $700 budget and let matching owners come to you.

**Example 3 — Traveler worried about property condition**

"How do I know the photos are accurate?" → Listings show owner identity verification status, Fair Value score, and past reviews. If the unit doesn't match on check-in, photograph the issue immediately and file a dispute; full refund is possible if the admin agrees.

## Related

- [`booking-faq.md`](./booking-faq.md) — booking-specific questions
- [`billing-faq.md`](./billing-faq.md) — payments, refunds, charges
- [`general-platform-faq.md`](./general-platform-faq.md) — platform-wide questions (voice search, referrals, tools)
- [`bidding-process.md`](../processes/bidding-process.md) — how Offers and Wishes work
- [`booking-workflow.md`](../processes/booking-workflow.md) — full booking lifecycle
- [`dispute-resolution.md`](../processes/dispute-resolution.md) — filing an issue
- [`privacy-policy.md`](../policies/privacy-policy.md) — data handling (legal-blocked)
