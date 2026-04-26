---
last_updated: "2026-04-26T00:34:48"
change_ref: "05da176"
change_type: "session-60-init"
status: "active"
---

# Request for Proposal — Florida Marketplace + Timeshare Counsel

**Engaging entity:** Rent-A-Vacation, Inc. (Delaware corporation, incorporation pending via Stripe Atlas as of April 2026)
**Date:** April 2026
**Issued by:** Sujit Gangadharan, Co-Founder & CEO

---

## 1. About Rent-A-Vacation

**Rent-A-Vacation** ("RAV") is a software platform / 3-sided marketplace connecting timeshare property owners with travelers seeking short-term vacation rentals at vacation club properties.

**What RAV is:**
- A marketplace operator earning a 15% commission (default; tier-adjusted) on completed bookings between timeshare owners and travelers
- A software-only company — no property ownership, no title transfer, no acting as a real estate broker
- Pre-launch: platform feature-complete in development; Staff Only Mode is currently enabled; no real customers; no real transactions yet

**What RAV is not:**
- Not a timeshare developer, operator, manager, or franchisee
- Not a timeshare resale broker (we facilitate **rentals** of unused timeshare weeks/points, not the sale or transfer of timeshare interests)
- Not affiliated with any specific resort brand (Hilton Grand Vacations, Marriott Vacation Club, Disney Vacation Club, etc.) — we're brand-agnostic and host listings for owners across multiple brands

**Founders:** Four co-founders (CEO/CTO, COO, CPO, CFO), all residents of Florida. Two are currently employed at regulated financial institutions and are completing Outside Business Activity (OBA) disclosure processes; their formal officer roles and stock issuance are deferred until OBA disclosures clear, but their pre-incorporation IP contributions are assigned to RAV at incorporation.

**Stage:**
- Platform: feature-complete in development, ~1,400 automated tests passing, Stripe Connect with destination charges integrated, escrow via PaySafe, 117 resorts and 9 vacation club brands populated in our resort database
- Legal: pre-incorporation; 8 policy drafts written and held at internal `status: draft` pending lawyer review (Booking ToS, Privacy Policy, Cancellation Policy, Refund Policy, Payment Policy, Trust & Safety Policy, Insurance/Liability Policy, Subscription Terms)
- Operations: zero owners onboarded; zero traveler accounts created; zero real money has touched the platform; **we will not open to public users until the legal review described in this RFP is complete**

**Strategic context:** Acquisition by an established hospitality or travel-technology company (Marriott Vacations Worldwide, Hilton Grand Vacations, Wyndham, Expedia Group, Booking Holdings) is the explicit long-term exit. KOALA (a competing timeshare rental platform) partnered with Expedia Group in May 2024, validating the market and the acquisition path.

A one-page mental model of the platform is available at `docs/PLATFORM-INVENTORY.md` in our repository — we can share this on request.

---

## 2. Why we're engaging counsel

We're a bootstrapped technical team. We can build and operate software, but we cannot launch a regulated-industry marketplace without specific legal opinions and document review that we are not qualified to perform ourselves.

We have been advised — by a structured boardroom advisory session involving counsel familiar with timeshare law (former HICV General Counsel), platform/consumer law (former Wilson Sonsini litigation partner), and marketplace payment risk (Stripe staff engineer) — that this engagement is the gating step before we can onboard our first paying owner.

We are not seeking outside investment, are not in a competitive auction, and are not facing a deadline imposed by anyone other than ourselves. We **are** seeking lawyer-blessed clarity on three specific questions and lawyer-reviewed (or lawyer-drafted) versions of the documents listed below.

---

## 3. Scope of work

### Workstream 1 — Florida regulatory opinion (priority HIGH)

**Question to answer:** Does Rent-A-Vacation's commission-on-rental marketplace activity, as actually operated (described in detail below and demonstrable on a platform walkthrough), trigger registration or licensing requirements under Florida's Vacation Plan and Timesharing Act (specifically Section 721.20 — Timeshare Resale Service Providers, and any related provisions)?

**Why we believe the answer is "no" but need a written opinion to launch:**
- RAV facilitates **rentals**, not resales. Section 721.20 is targeted at timeshare resale service providers — entities that broker the sale or transfer of timeshare interests.
- RAV does not take title to any timeshare interest, does not act as a fiduciary for the owner, does not receive funds owed to a developer, and does not represent itself as a licensed timeshare broker.
- RAV's commission is paid by the traveler at booking, not by the owner from sale proceeds.

**What we need:**
- A written legal opinion (not just verbal advice) confirming or correcting the above analysis
- If registration/licensing IS required: a written work plan for satisfying the requirement, with cost and timeline estimates
- A short-form summary suitable for sharing with future investors and acquisition counsel during due diligence

**Estimated effort:** [we believe this is a 5-10 hour matter for a Florida-licensed timeshare attorney; please confirm or correct]

---

### Workstream 2 — Platform document review (priority HIGH)

We have 8 policy documents drafted in plain English, currently held at `status: draft` in our codebase pending review. We're requesting:

**Review and redline of existing drafts:**
1. Booking Terms of Service (renter ↔ owner ↔ RAV agreement)
2. Privacy Policy (covers data flow through Supabase, Stripe, Resend, Sentry, PostHog, GA4, OpenRouter, VAPI, Deepgram, ElevenLabs)
3. Cancellation Policy (4-tier system: flexible / moderate / strict / super_strict)
4. Refund Policy (per-policy refund calculation; PaySafe escrow release timing)
5. Payment Policy (Stripe Connect destination charges; merchant of record; chargeback handling framework)
6. Trust & Safety Policy (owner removal, traveler banning, dispute resolution; appeals process)
7. Insurance / Liability Policy (allocates risk between RAV, owner, traveler in standard failure modes)
8. Subscription Terms (4 tiers; addresses FTC Negative Option Rule [Oct 2024], California automatic renewal law, 30-day notice for price changes)

**Documents we need you to draft from scratch:**
9. **Owner Listing Agreement** — owner warrants they have the right to rent under their resort's CC&Rs / club rules, indemnifies RAV against claims arising from breach of warranty, agrees to commission structure, agrees to platform Trust & Safety enforcement
10. **Acceptable Use Policy** — both sides; targets fake listings, chargeback abuse, fraud
11. **Marketplace Operator Agreement** (internal; defines RAV's third-party-platform legal posture; supports defense in any future cease-and-desist or class-action proceeding)

**What we need for each:**
- Written redlines for review documents (#1-#8) — clean Markdown delivered back to us
- Drafted clean documents for new ones (#9-#11) — Markdown
- A short transmittal memo summarizing material changes / rationale per document
- Specific attention to: arbitration clauses with class action waivers; clickwrap formation defensibility; merchant-of-record framing in chargeback context; data-flow accuracy in privacy policy

**Estimated effort:** [we believe this is a 25-40 hour matter; please confirm or correct]

---

### Workstream 3 — Money transmission opinion on PaySafe (priority HIGH)

**Question to answer:** Does RAV's use of PaySafe to hold booking funds in escrow until resort confirmation create any state money-transmission licensing exposure for RAV in:
- Florida (highest inventory volume)
- California
- Hawaii
- Nevada
- South Carolina

We were specifically advised in our boardroom session (by Patrick McKenzie, Stripe staff engineer, and Tonia Klausner, former Wilson Sonsini partner with consumer class action defense experience) that:

- The factual question is who has legal title to the funds during the escrow period — if RAV holds funds on behalf of the traveler until release, that is typically not transmission; if RAV holds funds on behalf of the owner waiting to receive them, that may be transmission
- The standard structure for marketplace platforms is to use an established licensed money services business; PaySafe may qualify but we need confirmation of its licensing in each state
- An alternative if PaySafe does not survive analysis is to use Stripe Connect's native marketplace escrow (Stripe is itself a licensed money transmitter in the relevant states)

**What we need:**
- A written opinion on PaySafe's MSB licensing status in the five states above (you may need to subcontract / consult specialty counsel)
- If PaySafe is unlicensed in one or more required states: a written recommendation on whether RAV should (a) restrict transactions in those states until PaySafe is licensed, (b) replace PaySafe with Stripe Connect-native escrow, or (c) some other approach
- Estimated cost and timeline of any required remediation

**Estimated effort:** [we believe this is a 5-10 hour matter, plus optional specialty subcontract; please confirm or correct]

---

## 4. Out of scope (for clarity)

To keep the engagement focused, the following are **NOT** part of this RFP:

- General corporate maintenance after incorporation (we'll handle annual reports, registered agent, etc. via Atlas + Florida Sunbiz directly)
- Tax structuring (we will engage a separate tax advisor for this — recommendations welcome)
- Patent or trademark filings (deferred until post-launch; the brand is currently unregistered)
- Employment law or contractor agreements for hires (deferred until first hire)
- M&A or financing-round work (deferred until applicable)
- Ongoing dispute representation (we hope to never need this; if we do, we'll engage at that time)

---

## 5. Engagement structure preferences

We are open to:
- **Fixed-fee per workstream** — preferred where feasible; gives us budget certainty
- **Hourly, billed monthly with a not-to-exceed cap per workstream** — also acceptable
- **Phased engagement** — we'd rather start with Workstream 1 (regulatory opinion) and Workstream 2 (document review) in parallel, defer Workstream 3 (money transmission) by 1-2 weeks if it makes sequencing easier on your side

We are **not** open to:
- Open-ended hourly engagements with no cap — we're bootstrapped and need to control burn

**Budget envelope (please confirm or push back):** We have planned for a $10K-$25K total engagement. If your firm's rate structure puts the full scope outside that envelope, please tell us — we can discuss scope reduction (e.g., redline depth on the policy documents) or split the engagement across two firms.

---

## 6. Timeline

| Milestone | Target date |
|---|---|
| RFP responses requested by | [DATE — typically 2 weeks from sending] |
| Engagement letter signed by | [DATE — within 4 weeks of sending] |
| Workstream 1 (regulatory opinion) — written opinion delivered | [DATE — within 4 weeks of engagement] |
| Workstream 2 (document review) — full redline + drafted docs delivered | [DATE — within 6 weeks of engagement] |
| Workstream 3 (money transmission opinion) — delivered | [DATE — within 6 weeks of engagement] |
| Internal sign-off on full packet | [DATE — within 8 weeks of engagement] |
| Platform Staff Only Mode lifted; first owner onboarded | [DATE — gating event; depends on lawyer sign-off] |

We're flexible on the exact dates. The hard constraint is: **no real users until the full packet is signed off.** Faster sign-off = faster launch = faster validated learning. Slower sign-off = no harm, but delayed launch.

---

## 7. What we will provide to you

To make your work efficient:

- **A platform walkthrough** — 60-minute video call with screen-share of the live development environment so you understand exactly how the platform behaves
- **The 8 existing policy drafts** in clean Markdown, with current `status: draft` clearly marked
- **PLATFORM-INVENTORY.md** — a one-page mental model of the entire RAV system across product, infrastructure, dev tooling, and governance
- **Founder team summary** — bios, OBA-disclosure status of the two affected founders, expected role assignments
- **Stripe Connect / PaySafe technical documentation** — exact data flow for booking → escrow → release to owner
- **The boardroom session transcript** referenced in this RFP (if useful) — five experienced practitioners debated the key questions in this engagement; their analysis may save you 1-2 hours of context-gathering

---

## 8. About the founders

| Founder | Role | Background |
|---|---|---|
| Sujit Gangadharan | Co-Founder, CEO/CTO | [Background to fill in — current role, prior experience, technical lead on the RAV platform] |
| Ajumon Zacharia | Co-Founder, COO | [Background to fill in] |
| Sandhya Sujit | Co-Founder, CPO | [Background to fill in] |
| Celin Sunny | Co-Founder, CFO | [Background to fill in] |

<!-- TODO: fill in actual founder backgrounds. Lawyers will read this section to gauge fit + decide who at the firm should respond. -->

---

## 9. Questions for you

If you proceed to a fit conversation, we'd appreciate your written response on:

1. **Confirmation that your firm has bench experience** with: (a) Florida Vacation Plan and Timesharing Act, (b) marketplace platform terms of service, (c) state money transmission frameworks (or able to subcontract reliably for #c)
2. **Whether your firm has any current or recent representation of a major timeshare developer or operator** (Marriott Vacations Worldwide, Hilton Grand Vacations, Wyndham, Disney Vacation Club, etc.). If yes, this may or may not be an actual conflict — we want to surface and discuss it early.
3. **Estimated total budget** for the scope as described, in the structure that fits your firm
4. **Estimated total elapsed time** from engagement letter to final document sign-off
5. **The specific attorney(s)** who would lead this work and their relevant experience
6. **Conflict-check confirmation** before any substantive review begins (we will not share the 8 policy drafts until conflict check clears)

---

## 10. How to respond

Please send your response to **[EMAIL]** with:

- Confirmation of fit (or thoughtful "no fit" with referral)
- Initial budget and timeline estimate
- A 30-minute call to discuss

We'll aim to respond within 2 business days of any inbound.

---

**Thank you for your consideration.**

Sujit Gangadharan
Co-Founder & CEO, Rent-A-Vacation, Inc. (Delaware corporation, formation pending via Stripe Atlas)
[PHONE] · [EMAIL]
https://rent-a-vacation.com (Staff Only Mode — production access by request)
