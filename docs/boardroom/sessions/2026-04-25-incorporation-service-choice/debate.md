---
last_updated: "2026-04-26T00:28:36"
change_ref: "316dde6"
change_type: "manual-edit"
status: "active"
---

# Boardroom Debate — Incorporation Service Choice (Stripe Atlas vs Gust vs Clerky vs alternatives)

**Board:** LEGAL-ADVISORY (5 advisors)
**Date:** April 25, 2026
**Final Vote:** YES — Stripe Atlas (UNANIMOUS, 5-0)

---

## The Question

Decision needed: which incorporation service to use for Rent-A-Vacation (RAV).

KNOWNS:
- Vehicle: Delaware C-Corp (decided — for VC fundability)
- Founders: 4 confirmed, 1 may join later, all live in Florida
- Operating state: Florida (will need foreign-entity registration there)
- Business model: Software platform / 3-sided marketplace connecting timeshare property owners to potential renters. Pure software/SaaS company providing services to the timeshare industry — NOT directly affiliated with any timeshare company and NOT owning timeshare properties. RAV charges 15% commission on bookings; tiered subscriptions for owners + travelers.
- Current state: Pre-launch. Platform feature-complete in DEV (1394 tests, full marketplace + Stripe + voice + chat). All 8 policy docs (booking ToS, privacy, cancellation, payment, refund, trust & safety, insurance/liability, subscription terms) drafted and held in docs/support/policies/ at status:draft pending lawyer review. Goal: zero owners onboarded until lawyer signs off the full packet.
- Budget sensitivity: Bootstrapped solo until now, cost-conscious but won't cut corners on legal foundation.

DECISION TO MAKE: Choose between Stripe Atlas (~$500), Gust Launch, Clerky, or any alternative the board surfaces.

---

## Round 1 — Opening Positions

### Yokum Taku — Round 1

**Vote:** YES — Stripe Atlas, with one specific caveat.

**Position:**

For a 4-founder Delaware C-Corp on an acquisition path — and the context file makes clear acquisition by Marriott / Hilton Grand Vacations / Wyndham / Expedia / Booking is the explicit exit thesis — Stripe Atlas is the right pick. Not because it's the most beautifully crafted product on the market (Clerky has cleaner documents in a few specific places), but because Atlas hits the four things that matter when an acquirer's M&A counsel pulls your cap table file in due diligence: (1) Cooley LLP did the docs, (2) the Cert of Incorporation is the standard form every Delaware corporate lawyer recognizes within fifteen seconds, (3) the founder restricted stock purchase agreements include four-year vesting with a one-year cliff as the default and they're filed correctly, (4) the 83(b) election form is generated and the cover letter explicitly tells your founders they have thirty days to mail it.

**Clerky** is genuinely excellent — closest competitor on document quality, more transparent, lets you customize more. But Clerky doesn't bundle the bank account, doesn't bundle Stripe live activation, doesn't include the Cooley free review, and costs more (~$799 base + add-ons). For a bootstrapped pre-launch marketplace running on Stripe, Clerky's better documents do not justify the loss of Atlas's bundling.

**Gust Launch** I would actively steer away from. Gust's incorporation product is a thin wrapper around standard Delaware filings, but their core business is investor-CRM and accelerator-relations — incorporation is a customer-acquisition funnel for that other product. Templates feel templated. Gust pushes you toward their cap table tool as the default, and migrating off Gust later is annoying enough that I have seen companies stay on it well past the point where Carta or Pulley would have been the better choice.

**Doola** I would also avoid — markets heavily to non-US founders and the cookie-cutter feel shows up in due diligence. **DIY-with-a-lawyer** ($3-5K) — output quality is highest but for a 4-founder marketplace at this stage, the marginal benefit is small.

**The caveat on Atlas.** Atlas's package is sized for a Silicon Valley two-founder formation. With four founders — and a fifth potentially joining within six months — you have specific things you must address that Atlas's wizard does not handle gracefully:

1. **The 4-way equity split must be fully decided BEFORE you click incorporate.** Atlas issues founder shares at filing. Get a one-page founder term sheet drafted and counter-signed first.
2. **The OBA blocker for Ajumon and Celin is not an incorporation blocker — it's a stock-issuance blocker for those two specifically.** Sujit and Sandhya can incorporate today and receive their founder stock today. Reserve the equivalent of Ajumon's and Celin's intended founder allocations. The moment their OBA disclosures clear, issue them their founder stock with the original intended vesting commencement date back-dated. Their 83(b) windows start when they actually receive the stock.
3. **The future fifth founder is an option grant, not a founder share grant.** Once value has been created, issuing additional "founder" stock creates real tax problems for the new joiner.
4. **The Cooley free review applies to the standard Atlas-generated documents only.** Not the RAV-specific marketplace operator agreement, owner listing agreement, 1099 contractor framework, or timeshare-specific compliance documents.

**On Florida foreign-entity registration:** Atlas does NOT do this. After Delaware filing, separately register with Florida Department of State Division of Corporations as a foreign for-profit corporation. Filing fee $70 + $61.25 registered agent fee. Budget another $200-300 for year-one registered agent service.

**On Carta vs. Pulley vs. Atlas's built-in cap table:** Atlas hands you a basic cap table tool free for the first year. Fine for four founders + an option pool. The moment you raise outside capital or grant employee options at scale, switch to Carta.

**Speed to launch:** Atlas filing typically completes in 7-10 business days for Cert + EIN + Stripe live activation. Mercury bank adds 1-3 days. So roughly two weeks to operational. Florida foreign-entity registration is a parallel filing — another 1-2 weeks.

**If I were in the room:** Get the four-way equity split signed in a one-page term sheet THIS WEEK before anyone clicks anything on Atlas. Then start the Atlas process the same day Sujit and Sandhya sign their founder restricted stock purchase agreements.

**My biggest concern with the other side:** The advisors who push toward "find a specialty timeshare lawyer first" are right that you need one — but if they convince you to delay Atlas filing until that lawyer is engaged, you'll burn another 6-8 weeks before you have an EIN, a bank account, or the ability to take real money. The two workstreams are independent. Run them in parallel.

---

### Brian T. Lower — Round 1

**Vote:** CONDITIONAL — Atlas is fine for the corporate shell, but your real risk is not the formation vehicle. It's launching the platform without a Florida timeshare attorney having signed off on RAV's regulatory status. Don't let "incorporation done" feel like "legally cleared to onboard owners."

**Position:**

Yokum's framework is correct for 90% of startup formations and incomplete for yours. He is treating this as a generic Delaware C-Corp formation problem. It is not. RAV operates in the secondary timeshare rental market, regulated under state-specific timeshare statutes that have nothing to do with corporate-formation choice and everything to do with whether you can lawfully accept money from a renter for a stay at a Hilton Grand Vacations or Marriott Vacation Club property in Florida, Hawaii, Nevada, California, or South Carolina.

The choice between Atlas and Gust will not save you from a Florida Department of Business and Professional Regulation cease-and-desist if your platform is determined to be operating as an unlicensed timeshare resale service provider. That determination has nothing to do with which incorporation service you used. So before I weigh in on Atlas vs. Gust, the founder must understand this decision is the easy one — and the harder decisions sitting underneath it are not solved by checking the Atlas box.

That said, on the actual question: yes, use Atlas. Yokum's reasoning is sound for the corporate-formation layer. I add three observations from operating inside a major timeshare brand for 26 years.

**First, on industry credibility.** The choice of Atlas vs. Clerky vs. Gust will be invisible to Marriott Vacations Worldwide's M&A team if they ever pursue an acquisition. What they will look at is: does RAV have documented positions from the major resort brands acknowledging the platform exists and not objecting to it? Does RAV have written legal opinion letters on its compliance status in the five highest-risk states? Does RAV have an owner-onboarding flow that requires owners to warrant they have permission to rent through a third-party platform? Those are the things that matter for industry-side credibility, and they all live downstream of incorporation.

**Second, on Atlas's Cooley relationship.** Real benefit. But the founder needs to understand the limit. Cooley will review the standard incorporation documents — Cert, Bylaws, founder stock purchase agreements, indemnification, organizational consent. They will not review your booking ToS, privacy policy, owner listing agreement, or any of the eight policy drafts in `docs/support/policies/`. They certainly will not opine on your platform's regulatory status under Florida's Vacation Plan and Timesharing Act. That requires a Florida-licensed attorney with timeshare-specific experience, and there are maybe ten attorneys in the entire state who do this work full-time. I can recommend two from the Orlando bar — Greenberg Traurig has a hospitality practice that handles this, and Holland & Knight has a vacation ownership group.

**Third, on the 4-founder Florida-resident structure.** This is operationally good news from a regulatory standpoint. Florida is your highest-volume timeshare state, and having all four founders physically present in Florida means you can be responsive to the Florida regulators if questions arise. It also means that when Sujit's CTO role and Ajumon's COO role start touching owner relationships, those owner-facing activities are happening in-state and can be defended as in-state activities.

**On the timeshare-specific questions Atlas/Gust/Clerky cannot solve:**

- Does RAV's commission-on-rental model trigger Florida's timeshare resale service registration requirement under Section 721.20, Florida Statutes? My read is "probably not, but a written legal opinion is needed before launch."
- What is the platform's exposure if a guest checks in and the resort refuses to honor the reservation because the unit's CC&Rs prohibit third-party rental? RAV's ToS needs to address this and PaySafe escrow needs to release funds back to the traveler in this scenario.
- For the 117 resorts in your ResortIQ database: have you obtained or even attempted to obtain documented positions from at least Hilton Grand Vacations, Marriott Vacations Worldwide, and Disney Vacation Club acknowledging RAV's platform? If no, that's a pre-launch must-have.

I'm voting CONDITIONAL because my "yes" on Atlas is contingent on the founder treating incorporation as Step 1 of about Step 12 — not as the gating step before launch. The actual gating step is the Florida timeshare attorney's opinion letter on RAV's regulatory status. That should be commissioned the same week Atlas filing starts, not after.

**On Florida foreign-entity registration:** File the Application by Foreign Profit Corporation for Authorization to Transact Business in Florida (form CR2E047), pay $70 + $35 designation of registered agent fee + $61.25 annual report fee. Total under $200. Do this within thirty days of incorporation; Florida's penalty for late registration is $500 plus all fees that should have been paid.

**One specific operational thing about Atlas + Mercury:** Mercury will ask for documentation of the business. Be careful with the language. "We operate a marketplace for timeshare rentals" can flag Mercury's compliance team because timeshare has historically been a high-fraud category. Better framing: "Software platform connecting vacation property owners with travelers; commission-based marketplace; payments processed through Stripe Connect; escrow via PaySafe." Get the language right the first time or you'll have your Mercury account frozen for 2-4 weeks during compliance review.

**If I were in the room:** Commission the Florida timeshare attorney opinion letter the same week you start the Atlas filing process. Do not let "incorporation in progress" become the excuse to defer the harder regulatory question.

**My biggest concern with the other side:** Yokum's framing risks treating this as a Silicon Valley YC-startup formation when it is actually a regulated-industry marketplace formation. The legal exposure that will kill RAV is not on the Atlas vs. Gust axis. It's on the "what do the resort brands and Florida regulators think of your platform" axis.

---

### Tonia Ouellette Klausner — Round 1

**Vote:** YES — Atlas, but for reasons different from Yokum's. The choice doesn't matter as much as the founder thinks. Spend the saved decision-energy on what does matter: getting the eight policy drafts in `docs/support/policies/` lawyer-reviewed and live before any user account creates an enforceable arbitration-and-class-waiver agreement.

**Position:**

The Atlas-vs-Gust-vs-Clerky question is the wrong frame for what's actually at stake here. The corporate-formation-document choice affects whether your acquisition due diligence in Year 4 is clean. The platform-policy-document choice affects whether you can be sued by 50,000 plaintiffs before you reach Year 2. These are different orders of magnitude of risk, and the founder is spending mental cycles on the smaller one because it has a clear forking decision and a clear price tag, while the bigger one is harder to scope.

That said: Atlas, yes, for the reasons Yokum gave, plus one I add.

**Why Atlas over the alternatives, from a litigation defense perspective:**

The bench effect is real. When a class action is filed against RAV — and at scale, the class action will come — opposing counsel will pull every public document about RAV's formation. If your formation documents look templated and your incorporator was "DIY, Inc.", plaintiffs' counsel will look harder for sloppy language elsewhere. If your formation documents look like every other Wilson Sonsini / Cooley-blessed Delaware C-Corp, plaintiffs' counsel moves on to the substantive claims faster. Small effect but free, and the kind of small thing that adds up across a defense.

Atlas also generates indemnification agreements that protect officers and directors. With four founders all serving as officers, you want these in place from formation. Gust includes them as an upsell. Atlas bundles them. Take the bundled version.

**The thing I want to redirect attention toward:**

Your platform has eight policy documents in `docs/support/policies/` at `status: draft`. Until those documents become `status: active`, every owner you onboard and every traveler who creates an account is doing so under whatever your default platform behavior is — which is no enforceable terms of service, no enforceable arbitration clause, no enforceable class action waiver, no enforceable privacy policy that disclaims data sharing arrangements with Stripe and Resend and Sentry and PostHog and GA4. None of which are theoretical exposures.

Specifically: if you launch beta with the policies still at `status: draft` because you're waiting for incorporation to complete first, every user who signs up during that window has signed up under no terms. When you later push the active policies live, those existing users have not consented to them. You cannot retroactively bind them to arbitration. You cannot retroactively bind them to a class waiver. You have created a class of users who can sue you in court, as a class, with no defenses you would otherwise have.

So my framing for the founder is: Atlas is a 2-week task. The 8-document lawyer review is a 4-8 week task. **Run them in parallel, not sequentially.** Atlas filing does not gate the lawyer engagement. You can hand the eight policy drafts to a Florida marketplace attorney today and say "review these as if RAV is a formed entity; we'll have the entity by the time you're done."

**Specific items I want to flag in the eight existing drafts:**

- **Booking ToS:** Does it disclaim that RAV is a party to the rental transaction? Does it require binding individual arbitration with class waiver? Does it specify jurisdiction? Does it have a survivability clause for if the user account is later deleted?
- **Privacy Policy:** Does it accurately describe every data flow? Stripe, Resend, Sentry, PostHog, GA4, OpenRouter, VAPI, Deepgram, ElevenLabs — every vendor that touches user data must be disclosed by category. Voice and chat conversations are stored — disclose this. 30-day deletion timeline.
- **Cancellation Policy:** Does it match what the platform actually does (flexible/moderate/strict/super_strict)? The single most common source of consumer class actions in this category is "the cancellation policy as written doesn't match the cancellation policy as enforced."
- **Refund Policy:** Where does the money go in each scenario? Who decides? On what timeline?
- **Trust & Safety Policy:** Does it set the framework for owner removal, traveler banning, and dispute resolution? Procedurally fair? Documented appeals process?
- **Insurance/Liability:** Does it allocate risk between RAV, owner, and traveler in each plausible failure mode?
- **Payment Policy:** Does it explain PaySafe escrow mechanics in plain English? Stripe's terms apply to payment processing? What happens if Stripe initiates a chargeback?
- **Subscription Terms:** Does it address auto-renewal in compliance with the FTC's Negative Option Rule (October 2024)? California's automatic renewal law? 30-day notice for price changes?

**On TCPA compliance for SMS:** When you turn off `SMS_TEST_MODE` and send real SMS to real consumers, every recipient must have provided prior express written consent specifically for SMS, separately from agreeing to the ToS. A separate checkbox during signup. Honor opt-outs within 10 days. One TCPA class action with 10,000 affected users is $5M-$50M in statutory damages.

**If I were in the room:** Engage a Florida-based marketplace attorney this week with experience defending platform terms of service in consumer class actions. Hand them the eight policy drafts. Tell them: "Atlas filing is in progress; we'll have the entity in 2 weeks; review these as platform documents and prepare to issue an opinion when the entity is formed." This compresses the 4-8 week review into the 2-week Atlas filing window.

**My biggest concern with the other side:** Yokum will treat this as fundamentally a corporate-formation question and Brian will treat it as fundamentally a timeshare-regulatory question. Both are real, but the 80th-percentile risk for RAV in Year 1-2 is a consumer class action — privacy, TCPA, automatic renewal, or a misrepresented cancellation policy. That's the failure mode the Atlas decision does nothing to address.

---

### Jason Gamel — Round 1

**Vote:** YES — Atlas, with a strong emphasis that the choice itself is industry-invisible and the founder should not over-weight it. The energy belongs on building ARDA-recognized industry standing, not on incorporation-vendor selection.

**Position:**

The Atlas-vs-Gust answer is irrelevant to industry credibility. Marriott Vacations Worldwide's corporate development team has never refused a meeting because a startup used the wrong incorporation service. They have refused meetings because the startup couldn't articulate what its compliance posture was, what its consumer-protection framework was, or whether the resort brands were aware of its existence.

So: Atlas is fine. Use it. Move on. Here is what actually matters for industry credibility.

**On formation vehicle:** Delaware C-Corp is the correct choice. Marriott Vacations Worldwide, Hilton Grand Vacations, Wyndham, Diamond Resorts (now Hilton subsidiary), and BVacations all do their own M&A through Delaware-formed entities and expect targets to look the same. An LLC would create friction in the eventual transaction structure.

**On the 4-founder structure:** Industry-side, mildly positive. A solo founder with a marketplace platform looks like a hobbyist. A 4-person team with assigned C-suite roles looks like a company. Make sure the LinkedIn presence and the website's "About" page actually reflect the four founders publicly.

**On the OBA blocker for Ajumon and Celin:** If two of your four founders' employment situations would be viewed by a regulated financial institution as creating an Outside Business Activity conflict, those two founders cannot publicly represent RAV at industry events — at ARDA conferences, at hospitality industry conferences, at investor pitches — until their OBAs are cleared. Plan for this. The two cleared founders should be the public face for the next 6-12 months.

**On industry positioning post-incorporation:**

Once Atlas filing completes and RAV is a Delaware C-Corp registered to do business in Florida, the next industry-credibility step is ARDA membership. ARDA membership is $5K-$15K depending on company size. Not required to operate. But signals to the industry that RAV understands it operates inside the timeshare ecosystem and intends to be a participant rather than an outsider. It opens doors. Marriott Vacations Worldwide and Hilton Grand Vacations both attend ARDA's annual conference (October 2026 at the Westin Kierland Resort in Phoenix). If RAV is an ARDA member by then, the founder team can request meetings with their corporate development teams in person.

**On the Florida operational base:**

Four founders all in Florida is an operational asset for industry-side credibility. Marriott Vacations Worldwide is headquartered in Orlando. Hilton Grand Vacations is in Orlando. Wyndham Destinations is in Orlando. ARDA's headquarters is in Washington DC, but the industry's operational center is in Orlando. Being physically located in or near Orlando means the founders can attend industry events, request meetings, and build relationships in person.

**On regulatory risk that Atlas does not address:**

Echoing Brian: the platform's regulatory status under the Florida Vacation Plan and Timesharing Act needs a written legal opinion before launch. If RAV is determined to be operating as an unlicensed timeshare resale service provider, the penalty under Section 721.20(11) is $5,000 per violation — and each transaction can be a separate violation. Even if the legal opinion ultimately concludes RAV is not a resale service provider (likely, given that you're a rental platform, not a resale broker), the opinion letter itself is an asset in any future regulatory inquiry or industry due-diligence conversation.

The FTC issued updated guidance in 2023 on timeshare advertising practices. Pricing claims, availability claims, and testimonials all have specific compliance requirements. Your RAV Smart Suite tools (SmartEarn, SmartPrice, SmartCompare) and any pricing guidance you display to owners must comply with those guidelines.

**On the resort-brand recognition question:**

The single most important pre-launch credibility step is documented acknowledgment from at least one major resort brand that they are aware of RAV and have not objected. Not a partnership agreement. Not a marketing deal. A written acknowledgment — even a short email from a brand-protection team contact — that says some version of "we are aware that your platform lists properties associated with our brand; we have not objected to the listings; we expect you to comply with our brand usage guidelines."

**Practical sequencing:**

1. Sign the 4-way founder term sheet this week
2. Start Atlas filing the same week
3. Commission a Florida timeshare attorney legal opinion the same week
4. Sandhya and Sujit (the OBA-cleared founders) begin outreach to Hilton Grand Vacations, Marriott Vacations Worldwide, and Disney Vacation Club brand-protection teams the following week
5. Apply for ARDA membership in parallel
6. Florida foreign-entity registration once the Cert of Incorporation arrives from Delaware
7. Then — only then — flip Staff Only Mode off and onboard the first owner

The Atlas decision is week 1, item 2 of about 12. Don't let it become the centerpiece.

**If I were in the room:** Apply for ARDA membership the same week you start Atlas filing. The cost is real ($5-15K) but the door-opening value over the next 24 months is 10-100x that.

**My biggest concern with the other side:** Yokum and Tonia are both right that incorporation matters and that platform documentation matters. But if the founder treats the lawyer-blessed corporate shell + lawyer-blessed policy documents as sufficient to launch, RAV will launch into a market where major resort brands have never heard of the platform and will react to it as a surprise. That's a credibility crater that takes years to climb out of.

---

### Patrick McKenzie — Round 1

**Vote:** YES — Stripe Atlas, but for the most boring possible reason: it eliminates the highest-friction step in standing up RAV's payment infrastructure, which is the single thing on the platform you cannot afford to get wrong.

**Position:**

I'm at Stripe. I have a conflict of interest on this question. Disclosing that, giving honest analysis, weight it accordingly.

The reason Atlas is the right choice for RAV has very little to do with the corporate-formation document quality and everything to do with what happens at the moment your platform first attempts to charge a real customer's credit card.

**The Stripe activation problem:**

When you sign up for a Stripe account independently, Stripe's underwriting team evaluates your business. They will ask: what is the business model, who are you charging, what are you selling, and most importantly for marketplace platforms — who is the merchant of record on each transaction. For a timeshare rental marketplace, that underwriting conversation is non-trivial. Timeshare has historically been a high-chargeback category. Vacation rentals have historically been a high-chargeback category. A marketplace that combines both, run by a brand-new entity with no transaction history, no LLC documentation in place yet, and no banking relationship — that account application is going to get manual review. Manual review at Stripe takes 2-10 business days. During that review, your account is in a probationary state where transaction limits are constrained. If something in the application flags Stripe's risk team, you get additional scrutiny. If something flags badly enough, you can be denied — and once you're denied at Stripe as a brand-new entity, the workaround paths are painful.

Atlas pre-clears all of this. When Stripe creates your Atlas-bundled live account, the underwriting context is "this is a Cooley LLP-formed Delaware C-Corp incorporated through Stripe Atlas, which means the corporate structure is verified, the founder identities are verified (Atlas does KYC at incorporation), and the business profile was reviewed during the Atlas onboarding flow." The activation is essentially instant.

For RAV specifically, where you've already built a Stripe Connect integration with destination charges and the entire booking flow runs through Stripe, this matters enormously. The day you complete Atlas filing is the day you can run a real transaction.

**On Stripe Connect specifically:**

Your platform uses Stripe Connect with destination charges. For Connect destination charges, the marketplace operator's Stripe account is the merchant of record, and a separate Transfer pushes funds to the connected owner account. This structure has specific legal implications: you (RAV) are the merchant of record on every transaction. You are the party Stripe will hold responsible for chargebacks. Your relationship with the underlying owner is separate from Stripe's relationship with the cardholder.

Atlas's Cooley templates know how to handle this. Gust's templates are competent on corporate structure but I have personally seen Gust-formed companies have issues during Stripe Connect onboarding because Gust's business profile language doesn't pre-anticipate marketplace structures the way Atlas does. Clerky's handle is good but doesn't have the same direct hand-off to Stripe live activation.

**On Mercury:** Fine bank for marketplace startups. Excellent UI, seamless Atlas integration, handles Stripe payout deposits cleanly. One thing to know: Mercury is a banking-as-a-service product layered on top of Choice Financial Group and Evolve Bank & Trust. Your Mercury account is technically held at one of those underlying banks. This matters in two narrow scenarios: (1) if you ever raise a round of $10M+, your investors will probably want you to move primary banking; (2) if you ever need a credit line larger than Mercury's $5M ceiling. Neither matters at your stage.

**On Brex:** Atlas now offers Brex as an alternative to Mercury. Functional difference for a 4-founder marketplace pre-revenue is negligible. Pick whichever UI you prefer.

**On the merchant of record question:**

When RAV processes a $1,000 booking, the cardholder's statement reads "RENT-A-VACATION" or whatever your Stripe descriptor is. Not "MARRIOTT GRAND VACATIONS." The card-issuing bank's chargeback adjudication process will look at RAV's terms of service to evaluate the chargeback. If your ToS does not clearly establish that the cardholder is purchasing a service from RAV (the platform) rather than directly from the property owner, you'll lose chargebacks you should win.

**On state money transmission licensing:**

RAV's escrow mechanism (PaySafe holds funds until resort confirmation) is functionally a money transmission activity in some states' interpretations. The factual question is: who has legal title to the funds during the escrow period? If RAV holds the funds on behalf of the traveler until release, that's typically not transmission. If RAV holds the funds on behalf of the owner waiting to receive them, that may be transmission. The standard structure for marketplace platforms is to use an established money services business (like Stripe Issuing or Bill.com) to handle the actual escrow operation, which keeps the marketplace platform out of the transmission-licensing question entirely. PaySafe is the right answer here if PaySafe is what I think it is — but the founder needs a written legal opinion confirming this.

**On the immediate operational question:**

This week, in order:
1. Sign the founder term sheet (Yokum's point)
2. Start Atlas filing
3. Engage a Florida marketplace attorney for the policy review (Tonia's point) AND the timeshare regulatory opinion (Brian's point) — these can be the same firm
4. Email Hilton Grand Vacations brand protection (Jason's point)
5. Begin drafting the chargeback dispute response template that you'll use the first time a traveler chargebacks a booking — because they will, and the response template is what defends the chargeback

**If I were in the room:** Get your Stripe Disputes process documented before you take a single real transaction. Atlas gets you the live Stripe account; it does not staff your dispute response operation. The first 50 chargebacks define your processor relationship for the next two years.

**My biggest concern with the other side:** Everyone is treating Atlas as a corporate-formation decision. It's actually a payments-infrastructure decision wearing a corporate-formation costume. The corporate-formation aspects are functionally interchangeable across Atlas/Clerky/Gust. The payments infrastructure aspect — pre-cleared Stripe live activation with the marketplace structure understood by the underwriter — is unique to Atlas and is worth the entire $500 fee on its own.

---

## Round 1 Vote Tracker

| Advisor | Vote | One-Line Summary |
|---------|------|-----------------|
| Yokum Taku | YES | Atlas — standard Cooley-blessed docs, but lock the 4-way equity split before clicking incorporate |
| Brian T. Lower | CONDITIONAL | Atlas is fine for the shell; the real risk is Florida timeshare regulatory exposure that Atlas does not address |
| Tonia Klausner | YES | Atlas — but the Atlas-vs-Gust choice is small noise vs. getting the 8 policy drafts lawyer-reviewed in parallel |
| Jason Gamel | YES | Atlas — and the choice itself is industry-invisible; spend the energy on ARDA membership + resort-brand outreach |
| Patrick McKenzie | YES | Atlas — the reason is pre-cleared Stripe live activation, not the formation docs |

**Round 1 Consensus:** YES (4 YES, 1 CONDITIONAL — the CONDITIONAL is also a YES on Atlas itself, conditional on parallel non-Atlas workstreams)

---

## Round 2 — Rebuttals & Final Votes

### Yokum Taku — Round 2

**Final Vote:** YES — unchanged.

**Who I'm arguing with most:** Brian T. Lower — specifically his framing that the Atlas decision is "the easy one" and the harder regulatory questions sit underneath it.

**Did I change my mind?** NO — but Brian's framing sharpened my own.

**Sharpest insight in this debate:** Patrick's point that Atlas is a payments-infrastructure decision wearing a corporate-formation costume. That reframing is exactly right and I should have led with it.

**Rebuttal:**

Brian's instinct is to surface the regulatory risk that the rest of us under-weight, and he's right that the Atlas decision does not solve the Florida timeshare attorney engagement question. But I want to push back on the implicit ordering in his "Step 1 of about Step 12" framing. He makes it sound like incorporation is the easy preamble to the hard work. Operationally, the opposite is closer to true.

The Atlas filing creates the legal entity that everything else attaches to. Without the entity:
- The Florida timeshare attorney cannot issue an opinion letter "on RAV" because RAV does not legally exist
- The 8 policy documents in `docs/support/policies/` cannot be enforceable terms of service because there is no party to the contract
- Tonia's marketplace attorney cannot opine on platform documents that bind a non-existent entity
- The Hilton/Marriott brand-protection outreach Jason wants happens from a pseudonym company name, which weakens the request
- ARDA membership requires a corporate member, not an individual
- Mercury cannot open a business bank account for an entity that doesn't exist
- Stripe live cannot be activated for an entity that doesn't exist

So Brian is right that Atlas-vs-Gust choice is the easy decision, but he is wrong that it is somehow downstream of the timeshare regulatory work. The regulatory work attaches to the entity. The entity must exist first. Atlas is week 1 because nothing else can be week 1.

The mistake to avoid is treating "Atlas in progress" as "we're working on it" and letting it stretch from a 2-week task to a 6-week task. Founders procrastinate on incorporation more than any other startup decision because it feels real and irreversible, and Atlas's wizard makes you make decisions you'd rather defer (equity split, vesting, board composition, share count). Lock the equity split in a one-page term sheet this week. Sign Atlas the same week. Two weeks later you have an entity. Then everything Brian and Tonia want to engage runs against that entity.

On Tonia's point that the 8 policy review can run in parallel with Atlas filing — yes, exactly. The Florida marketplace attorney can begin reviewing policy drafts the same day Atlas filing starts. They opine in the abstract during the 2-week Atlas window. By the time the entity is formed, the policy review is partially complete and the opinion letter can be issued days after formation.

On Patrick's chargeback point — this is genuinely sharp and I want to underline it. The chargeback response template is the thing that defines your Stripe processor relationship for years. Get it drafted before the first transaction.

**Final position:** YES on Atlas, with the explicit caveat that incorporation is workstream #1 of approximately five parallel workstreams, all of which start in the same week. The other four: (1) Florida timeshare attorney engagement, (2) marketplace lawyer for policy review, (3) brand-protection outreach to Hilton/Marriott/Disney, (4) ARDA membership application. Atlas is the gating dependency for nothing except itself. Run them in parallel.

---

### Brian T. Lower — Round 2

**Final Vote:** YES — upgrading from CONDITIONAL.

**Who I'm arguing with most:** Yokum — specifically his rebuttal of my framing as "Step 1 of about Step 12." He's right that I implied a sequence I didn't actually mean.

**Did I change my mind?** YES, on the vote. My CONDITIONAL was based on concern that the founder would treat Atlas as a launch-clearance step. Yokum's response and Tonia's parallel-workstream framing addressed that.

**Sharpest insight in this debate:** Jason's framing that "Atlas vs. Gust is industry-invisible" — meaning the resort-brand decision-makers and the M&A counsel for the eventual acquirer don't care which formation service was used. That removes one variable from the founder's mental load.

**Rebuttal:**

Yokum is right that my framing implied a sequence I didn't actually intend. Atlas filing is week 1, not week 6. The Florida timeshare attorney engagement is also week 1. Both happen in parallel. My concern was not about ordering — it was about the founder treating "Atlas filing complete" as somehow equivalent to "platform is launch-ready," which it is emphatically not. Yokum's parallel-workstreams framing addresses that concern directly, so I'm upgrading my vote.

I want to add one operational thing that came up reviewing Patrick's payments analysis. He correctly identified that for marketplace platforms with destination-charge Stripe Connect (which RAV uses), the platform operator is the merchant of record. He correctly flagged that the chargeback adjudication will look at RAV's ToS to evaluate chargebacks. What he didn't address — and this is where my timeshare experience matters — is what happens specifically when the chargeback reason is "service not as described" and the service was a stay at a Hilton Grand Vacations property that the resort refused to honor.

This is the worst chargeback scenario for a timeshare rental platform. The cardholder paid RAV $1,400. RAV held the funds in PaySafe escrow, released them to the owner after some confirmation step. The cardholder showed up at the resort and the resort refused entry because the owner's CC&Rs prohibit third-party rentals. Cardholder calls their card issuer and disputes. The card issuer asks RAV: was service rendered? RAV's answer needs to be: "service was rendered by the owner, not by RAV; RAV's role was to facilitate the transaction; the cardholder's recourse is against the owner under the booking ToS, not against RAV." But that defense only works if the booking ToS says exactly that, and if the cardholder demonstrably accepted that ToS at signup, and if the disclosure at booking made clear that RAV is not a party to the underlying rental transaction.

This is the thing that Atlas does not solve. Tonia's policy review does. Run them in parallel.

On Jason's ARDA membership recommendation — I think he's overweighting this slightly for a pre-launch startup. ARDA membership signals that you're a participant, but Jason is also the current ARDA CEO and has institutional reasons to want new entrants to join. For a $5-15K pre-launch spend, I'd suggest the founder calibrate based on whether the immediate post-launch plan includes outreach to the major brands. If yes (which it should), ARDA opens doors. If the founder wants to operate quietly for the first 6-12 months under the radar to establish transaction volume before asking for permission, ARDA membership becomes a publicity event the founder may not want yet.

Final vote: YES on Atlas. The credibility risks I flagged are still real, but they don't argue against Atlas — they argue against treating Atlas as sufficient. The right framing is "Atlas is necessary, not sufficient."

---

### Tonia Ouellette Klausner — Round 2

**Final Vote:** YES — unchanged.

**Who I'm arguing with most:** Patrick McKenzie — on his money transmission point, which I think he understated.

**Did I change my mind?** NO — but Patrick's payments framing is sharper than mine and I want to credit it.

**Sharpest insight in this debate:** Patrick's "Atlas is a payments-infrastructure decision wearing a corporate-formation costume." That single sentence reorients the whole debate.

**Rebuttal:**

Patrick is right that the underrated value of Atlas is pre-cleared Stripe activation, not the formation documents themselves. I want to add a litigation-defense angle to his payments framing.

His point about chargeback dispute response templates is exactly right and is the kind of operational documentation that defends a class action. Specifically: in a privacy or consumer protection class action, plaintiffs' counsel will demand discovery on RAV's chargeback handling because the chargeback decisions reveal what RAV actually thought about the disputed transactions. If RAV's chargeback responses are written ad-hoc by Sujit or Sandhya in real-time, they will contain admissions or characterizations that bind RAV in the larger litigation. Templated responses, written carefully with policy-reference language, do not.

On his money transmission point — I think he was correct on the analysis but understated the risk. He said "the standard structure for marketplace platforms is to use an established money services business... PaySafe is the right answer here if PaySafe is what I think it is." I want to flag that the founder needs a written legal opinion on whether PaySafe's escrow service is itself a licensed money services business in every state RAV operates in. If PaySafe is unlicensed in a particular state, RAV's use of PaySafe to hold funds for transactions in that state may inherit the unlicensed transmission exposure. The Conference of State Bank Supervisors has been increasingly aggressive on marketplace escrow arrangements over the past three years.

The fact that PaySafe is named in your context file but I cannot verify what it is — whether it's a licensed money services business, whether it's a bank, whether it's a software service that operates through an underlying licensed entity — is itself a flag. The Florida marketplace attorney engagement should specifically address this. If PaySafe is not what you need, the workaround is to use Stripe's own escrow products (Stripe Treasury or, for marketplace contexts, a separately-funded Stripe Connect arrangement that holds funds in the platform account until release).

On Brian's specific chargeback scenario — owner refuses entry because of CC&R rental restrictions — I want to add: RAV's owner onboarding flow needs to require the owner to make a binding warranty that they have the right to rent through RAV, and that warranty needs to indemnify RAV against claims arising from a breach of that warranty. Without that indemnification language in the owner agreement, the chargeback I just described becomes a loss for RAV with no recovery against the owner. The owner agreement is one of the documents Brian flagged as missing from the current 8 drafts. Add it before launch.

Atlas will not solve any of this. The marketplace attorney engagement will. Run both in parallel from week 1. Final vote: YES on Atlas, with the understanding that approximately 60-70% of RAV's pre-launch legal exposure is in the platform-document layer, not the formation layer.

---

### Jason Gamel — Round 2

**Final Vote:** YES — unchanged.

**Who I'm arguing with most:** Brian T. Lower — on his pushback against ARDA membership timing.

**Did I change my mind?** NO — but Brian's framing of "operate quietly for 6-12 months" is worth engaging directly.

**Sharpest insight in this debate:** Patrick's chargeback response template recommendation. It's exactly the kind of detail that signals to industry partners and acquirers that RAV is a serious operation.

**Rebuttal:**

Brian raised a strategic question I want to address head-on: "should RAV operate quietly for 6-12 months under the radar to establish transaction volume before asking for permission, or signal participation to the industry from day one?"

Both are defensible strategies. Let me argue for the public-from-day-one path with full acknowledgment of the trade-offs.

The case for going quiet first: you build proof-of-traction (booking volume, owner satisfaction, traveler reviews) before you ask any major brand to acknowledge your existence. When you eventually approach Hilton or Marriott, you're not pitching "we're a brand-new platform, please don't object" — you're pitching "we've facilitated 5,000 transactions on properties associated with your brand over the past 12 months, with X% NPS, Y% chargeback rate, Z% repeat usage." That's a much stronger position.

The case for being public from day one: the major brands have brand-protection teams that will eventually find your platform whether you announce yourself or not. If they find you and your first interaction is them sending a cease-and-desist, your starting position is adversarial. If you proactively reach out and have a 30-minute conversation with their brand-protection contact early, your starting position is "they know us, they expect to monitor us, they have not objected." The cease-and-desist becomes much less likely.

For RAV specifically — Hilton Grand Vacations and Marriott Vacations Worldwide both have well-established brand-protection processes. They monitor secondary rental platforms. KOALA partnering with Expedia Group in May 2024 put this entire category on the brand-protection radar in a way it wasn't before. It is essentially impossible for RAV to operate at any scale without these brands becoming aware of it. The question is timing — do they become aware on RAV's terms (proactive outreach, framed conversation) or on theirs (a cease-and-desist letter)?

I'm voting for proactive. Specifically: send a low-key introductory email to the brand-protection contact at Hilton Grand Vacations within 30 days of incorporation. Not a partnership pitch. Not a press release. A short email saying "we've launched a platform that may feature properties associated with your brand; we want to ensure compliance with your brand usage guidelines; here's how to reach us if you have questions."

On ARDA membership — Brian's right that I have institutional reasons to want startup members. I'll concede that the $5-15K is real and the founder may legitimately want to defer until there's transaction volume to point to. The compromise position: apply for ARDA membership in month 6 once you have 1,000+ transactions.

On the Atlas decision: still YES, still industry-invisible. The right move is not to over-think this.

Final vote: YES on Atlas. My main contribution is reorienting the founder away from over-weighting the Atlas-vs-Gust choice and toward the higher-leverage relationship-building work that needs to start as soon as the entity exists.

---

### Patrick McKenzie — Round 2

**Final Vote:** YES — unchanged.

**Who I'm arguing with most:** Yokum — but in agreement, not disagreement.

**Did I change my mind?** NO — but I want to credit Tonia for sharpening the money transmission risk I understated.

**Sharpest insight in this debate:** Tonia's point that the founder is spending mental cycles on the smaller decision (Atlas vs. Gust) because it has a clear forking decision and a clear price tag, while the bigger decision (which marketplace lawyer to engage and what to ask them) is harder to scope. That is a precise diagnosis of where the founder's attention is misallocated.

**Rebuttal:**

Tonia caught me understating the money transmission risk. She's right. Let me sharpen.

The fact that PaySafe is the named escrow provider and we cannot collectively verify whether PaySafe is a licensed money services business in every state RAV operates in — that's a red flag, not a yellow flag. When I said "PaySafe is the right answer if PaySafe is what I think it is," I was being too generous. The marketplace attorney engagement needs to specifically include: (1) is PaySafe licensed as an MSB in Florida, California, Hawaii, Nevada, and South Carolina at minimum? (2) if not, does RAV's use of PaySafe for transactions in those states inherit unlicensed transmission exposure? (3) what is the alternative if PaySafe is not licensed where it needs to be?

The alternative is to use Stripe Connect's own marketplace escrow capabilities. With Stripe Connect destination charges, you can hold funds in the platform account until you're ready to release them via Transfer to the connected account. This is functionally escrow without using a third-party escrow provider. Stripe has the licensing in place because Stripe is itself a licensed money transmitter in the relevant states. RAV doesn't inherit transmission exposure from using Stripe's standard products in their standard ways.

If PaySafe turns out to be the wrong choice, replacing it with a Stripe Connect-native escrow flow is a 2-3 week engineering project. The handler.ts files in the test PR are well-structured enough that this swap is feasible. Get the legal opinion first. If PaySafe survives the opinion, keep it. If not, plan the migration.

On Brian's chargeback scenario — owner refuses entry because of CC&R restrictions — this is the single most expensive recurring chargeback type for vacation rental marketplaces. Airbnb saw this pattern early and built their owner agreement to require explicit warranty of right-to-rent + indemnification of the platform. VRBO followed. RAV's owner onboarding flow needs to do the same.

On Jason's recommendation to do proactive outreach to brand-protection teams — I agree. Add to the outreach list: Stripe's marketplace risk team. Stripe maintains relationships with marketplace-pattern startups and sometimes provides advice on chargeback patterns, fraud mitigation, and processor-level risk management.

Final vote: YES on Atlas, for the reasons I articulated in Round 1, plus Tonia's sharpening on the money transmission issue, plus a strong recommendation that the marketplace lawyer engagement specifically includes a written opinion on PaySafe's licensing status before any production transaction.

---

## Final Vote Tracker

| Advisor | Round 1 | Final | Changed? |
|---------|---------|-------|----------|
| Yokum Taku | YES | YES | NO |
| Brian T. Lower | CONDITIONAL | YES | YES (upgraded from CONDITIONAL after Yokum/Tonia parallel-workstreams framing) |
| Tonia Klausner | YES | YES | NO |
| Jason Gamel | YES | YES | NO |
| Patrick McKenzie | YES | YES | NO |

**Final Consensus:** YES — UNANIMOUS (5-0 in favor of Stripe Atlas)
**Who changed their mind:** Brian T. Lower (upgraded from CONDITIONAL to YES)
**Biggest fight in the room:** Whether the Atlas-vs-Gust choice is the *right* decision to be focused on at all. Yokum, Patrick, and Tonia argued it matters specifically (for distinct reasons: cap-table cleanliness, Stripe activation, bench effect). Brian and Jason argued the choice is largely irrelevant compared to the harder workstreams it does not address. The unanimous vote on Atlas masked the real disagreement, which was about how much mental energy the founder should spend on this decision.

---

## Founder Briefing

You asked the board to choose between Stripe Atlas, Gust Launch, Clerky, and any alternative. The board unanimously voted **Atlas**, but the more important takeaway is what that vote *actually* says: this is the right decision, but it's also the smallest decision in front of you right now.

**The decision:** Use Stripe Atlas to incorporate RAV as a Delaware C-Corp.

**The verdict:** Unanimous YES. Brian was the only conditional vote in Round 1 and upgraded to YES in Round 2 after the parallel-workstreams framing was clarified.

**The core tension:** The board agreed on Atlas, but they disagreed sharply on how much you should be thinking about it. Yokum, Patrick, and Tonia framed Atlas as having specific, non-fungible advantages (clean cap table for due diligence, pre-cleared Stripe live activation, litigation-defense bench effect). Brian and Jason argued it's industry-invisible and the founder is over-weighting it because it has a clear forking decision and a clear price tag, while the harder workstreams (Florida timeshare regulatory opinion, marketplace-lawyer policy review, resort-brand outreach, ARDA membership) get less mental attention because they're harder to scope.

**The sharpest insight in this debate:** Patrick's framing — "Atlas is a payments-infrastructure decision wearing a corporate-formation costume." Pre-cleared Stripe live activation through Atlas eliminates 2-10 days of manual underwriting friction that an independently-applied Stripe account for a brand-new timeshare-rental marketplace entity is going to face. That alone is worth the entire $500 fee. Tonia's secondary insight — that you're spending decision-energy on the smaller question because the bigger one (which marketplace lawyer, what to ask them, on what timeline) is harder to scope — is the diagnostic that should reorient your week.

**Recommended action — this week, in parallel:**
1. Sign a one-page founder term sheet today documenting the 4-way equity split (Sujit, Ajumon, Sandhya, Celin) and the planned 5th founder reserve. All four signatures.
2. Start Atlas filing — the same week. Sujit and Sandhya issue founder shares immediately; Ajumon and Celin's allocations stay reserved until OBA disclosures clear.
3. Engage a Florida marketplace lawyer (specifically with timeshare and platform-law experience — Greenberg Traurig Orlando hospitality practice or Holland & Knight vacation ownership group are Brian's recommendations). Hand them the 8 policy drafts in `docs/support/policies/` AND ask for an opinion on PaySafe's money-transmission licensing status AND ask for the Florida Vacation Plan and Timesharing Act regulatory opinion.
4. Begin proactive brand-protection outreach to Hilton Grand Vacations, Marriott Vacations Worldwide, and Disney Vacation Club within 30 days of incorporation.
5. Defer ARDA membership to month 6 (per Brian's negotiation with Jason).

**The dissent worth heeding:** Brian's Round 1 concern, which he upgraded out of in Round 2 but which still matters: do not let "Atlas filing complete" become equivalent to "platform is launch-ready." The corporate shell is necessary, not sufficient. Onboarding owners before the lawyer review of the 8 policy drafts is complete and before the timeshare regulatory opinion is in hand is the failure mode the board is collectively most worried about — even though everyone voted YES on the formation choice.
