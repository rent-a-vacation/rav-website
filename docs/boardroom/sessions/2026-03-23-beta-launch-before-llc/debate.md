---
last_updated: "2026-04-02T00:03:48"
change_ref: "73ad192"
change_type: "manual-edit"
status: "active"
---

# RAV-TECHNICAL Boardroom Session — Beta Launch Before LLC

**Question:** "Should we open beta before the LLC is formed?"
**Date:** March 23, 2026
**Board:** RAV-TECHNICAL (7 advisors)

---

## Round 1 — Opening Positions

### Howard Nusbaum — Round 1

**Vote:** NO

**Position:**

Let me be direct about something that might get lost in the enthusiasm around this platform: opening a consumer-facing vacation rental marketplace without a formed legal entity is the kind of decision that gets written about in trade press as a cautionary tale. I've been in this industry long enough to know the difference between "move fast and break things" energy and reckless operations, and this falls uncomfortably close to the latter.

**Point one: resort brands are watching, and first impressions are permanent.** RAV has 117 resorts in its ResortIQ database spanning Hilton, Marriott, and Disney. These are not anonymous property managers — these are publicly traded hospitality companies with legal teams that Google every new platform that touches their brand names. When Hilton Grand Vacations' compliance team searches "Rent-A-Vacation" and finds a live marketplace facilitating bookings of their properties without even a basic LLC filing, that's not a conversation Sujit wants to be having. I've watched at least three secondary market platforms get cease-and-desist letters from resort developers within 90 days of launch. Every one of them was operating without a clear legal identity. The brands didn't care that the technology was good — they cared that the operator looked unserious.

**Point two: the timeshare secondary market has specific regulatory scrutiny.** Eleven states have explicit timeshare resale and rental statutes. Florida — where a disproportionate number of RAV's target properties are located — requires that any person or entity facilitating timeshare rental transactions be clearly identified with a registered business entity. This isn't theoretical. The Florida Department of Business and Professional Regulation has issued enforcement actions against platforms operating in gray areas. Operating as... what? A sole proprietorship under Sujit's name? That's not a defensible position when the state AG calls.

**Point three: this damages the acquisition narrative before it starts.** The boardroom context is explicit — RAV's exit strategy is acquisition by Marriott Vacations Worldwide, Hilton Grand Vacations, or similar. I can tell you from 20+ years of sitting across from these companies' business development teams: the first thing their due diligence team pulls is the entity formation date, the state of incorporation, and the operating history. If RAV's first 90 days of transaction data were generated while the company didn't legally exist, that creates a due diligence footnote that their lawyers will flag. Footnotes kill deals. Not because the lawyers think you're fraudulent — because they don't want to deal with the complexity of pre-entity liability.

**Point four: the OBA blocker is measured in weeks, not years.** Issue #127 is blocked on OBA disclosures for two co-founders at regulated financial institutions. I understand the frustration — but OBA disclosures at banks and credit unions are typically resolved in 4-12 weeks. The question isn't "should we wait forever" — it's "should we wait 4-12 more weeks." When you've spent this long building 825 automated tests and 30 edge functions, the marginal cost of waiting for legal standing is trivial.

**Point five: there is a productive middle ground that doesn't involve opening beta.** Nothing stops RAV from continuing to build supply-side relationships right now. Sujit can personally reach out to timeshare owner communities, timeshare user groups on Facebook, and HOA mailing lists. Owners can be pre-registered. Properties can be pre-verified through TrustShield. Marketing landing pages can collect emails. None of this requires an LLC. What requires an LLC is the moment money changes hands.

The platform is impressive. I don't say that lightly — I've seen hundreds of startups try to enter this space. The technology here is genuinely differentiated. That's precisely why it would be wasteful to compromise the launch story by operating without proper legal standing.

**If I were in the room:** File the LLC formation documents in Delaware immediately for Sujit and Sandhya as initial members, with an operating agreement provision to add Ajumon and Celin once their OBAs clear. Start the clock now — don't wait for everyone to be clear.

**My biggest concern with the other side:** Anyone who says "just launch and fix the legal stuff later" has never sat across from a state Attorney General's investigator. The secondary timeshare market is actively monitored. It is not a "launch first, comply later" space.

---

### Leah Busque Solivan — Round 1

**Vote:** CONDITIONAL

**Conditions:** (1) Form the LLC with available co-founders immediately, (2) Cap beta to 50 owners and 3 destination markets, (3) No money moves until entity + Stripe are production-ready.

**Position:**

Here's what I know about marketplaces: the data you need to make good decisions comes from real users doing real things, and every week you don't have that data is a week you're flying blind. I built TaskRabbit. We launched in one neighborhood in Boston before we had anything resembling a proper corporate structure. But — and this is the critical "but" — we also weren't handling $5,000 vacation bookings through an escrow system. So let me separate two distinct questions that are being conflated here.

**Question one: should RAV start acquiring and activating supply before the LLC is formed?** Absolutely yes. Unequivocally. The cold-start problem for a two-sided marketplace is the existential threat, not the legal structure. RAV currently has zero real transactions. Zero repeat bookings. Zero supply-to-demand ratio data. Zero time-to-first-match metrics. Every single metric I need to evaluate marketplace health is at zero. That is the emergency, not the LLC.

**Question two: should RAV process real payments before the LLC is formed?** No. And I don't think this is actually what the question is asking, but it's important to separate it. Stripe Connect requires a verified business entity. The escrow system — PaySafe — holds real money. Processing payments as an individual is both a legal and practical problem. So the actual question becomes: what can we do in beta that generates the data we need without requiring money to change hands?

**The answer is: a lot.** Let me walk through the marketplace mechanics. RAV's bidding engine — Name Your Price — is a price discovery mechanism. You can run price discovery without processing transactions. Let owners list real properties. Let travelers browse and bid. Let the matching engine work. Track search-to-bid conversion rates. Track how many destinations have 3+ active listings (the minimum threshold for a meaningful bid environment). Track whether RAVIO voice search drives higher engagement than text browsing. All of this generates the data that will determine whether RAV has real marketplace potential — and none of it requires a payment.

**The supply density question is critical.** RAV has 117 resorts in ResortIQ. But how many active listings will there be at any given time? I need to see this number before I believe the bidding mechanic works. At TaskRabbit, we learned that below a certain supply density, users searched, found nothing, and never returned. The marketplace death spiral starts on the demand side when supply is thin. For RAV, I'd estimate you need at least 5 active listings per popular destination-month combination before the bidding mechanic produces real price discovery. Below that, bidding is theater — you're bidding against yourself.

**A capped beta is the right structure.** Invite 50 owners — manually selected, personally onboarded. Focus on 3 destination markets where you expect the highest listing density (Orlando, Myrtle Beach, and one Hawaiian resort cluster would be my guess based on the brand distribution). Track every metric obsessively. Run the system for 60 days. At the end of 60 days, you know: (1) whether owners will actually list, (2) whether travelers can find what they want, (3) what the natural bid range looks like, and (4) whether RAVIO converts searchers to bidders.

**Unit economics matter even at zero revenue.** Even without transactions, you can calculate theoretical unit economics from bid data. If travelers are bidding $800 for a week that owners listed at $1,200, you know your spread. If RAV's 15% fee makes that bid uncompetitive with RedWeek's flat-fee model, you need to know that now — not after you've processed 100 bookings and discovered your take rate is wrong.

**The trust architecture should be tested in beta.** TrustShield verification is built. Test it. Put real owners through the deed upload, certificate verification, and ID check. How long does it take? How many fail on the first attempt? What's the drop-off rate? These numbers are gold for your launch plan and your acquisition narrative. Every acquirer will ask "what's your verification conversion rate?" — have an answer.

**What I would not do is wait.** The OBA blocker is real but the marketplace learning is more urgent. Every week RAV sits in Staff Only Mode is a week the team gets more attached to their assumptions about how the marketplace works — assumptions that real users will invalidate within days.

**If I were in the room:** Launch a "Founders Beta" this week — invite-only, 50 owners, no payments. Track: listings created per owner, search-to-bid conversion, supply density by destination, TrustShield completion rate, RAVIO usage rate. Form the LLC in parallel. The moment the LLC and Stripe production keys are ready, flip the payment switch for beta participants who've already been active.

**My biggest concern with the other side:** Every day in Staff Only Mode is a day the marketplace learns nothing. I've watched marketplaces die not because they launched too early, but because they launched too late and discovered their core assumptions were wrong when it was too expensive to pivot.

---

### Bret Taylor — Round 1

**Vote:** YES

**Position:**

I want to reframe this question because I think the way it's being asked obscures the actual decision. The question isn't "should we open beta before the LLC is formed." The question is: "Is the absence of a legal entity the binding constraint on RAV's progress, or is the absence of user data the binding constraint?" I believe it's overwhelmingly the latter.

**The platform is a hypothesis, not a product.** RAV has 825 automated tests, 30 edge functions, and a comprehensive feature set. That's impressive engineering. But until real users interact with it, every feature is a hypothesis. Name Your Price is a hypothesis about how travelers want to discover vacation pricing. TrustShield is a hypothesis about what level of verification makes owners trustworthy. RAVIO is a hypothesis about whether voice-driven search changes booking behavior. PaySafe is a hypothesis about whether escrow creates enough trust to overcome the platform's newness. None of these hypotheses have been tested with a single real user.

When I was at Google, we shipped Google Maps before it was "ready" — before we had transit data, before we had satellite imagery everywhere, before the mobile experience was good. The data we got from the first million users reshaped every product decision we made for the next two years. At Salesforce, the same pattern: early customer data was worth more than any amount of internal testing. RAV is sitting on a platform that could be generating this data right now.

**The AI layer specifically needs real usage data.** RAVIO — both voice and text — is running on VAPI with Deepgram STT and ElevenLabs TTS, and the text chat uses OpenRouter with Gemini Flash. This is a capable stack, but it's trained on no RAV-specific interaction data. Every conversation RAVIO has with a real user generates training signal: what are travelers actually asking for? Which queries stump the system? Do users prefer voice or text? Do voice users convert to bids at higher rates? This data is the foundation of RAV's AI moat. Without it, RAVIO is a wrapper on third-party APIs — exactly what any acquirer's due diligence will identify. With 90 days of real interaction data, RAVIO becomes a proprietary intelligence layer with behavioral patterns no competitor can replicate.

**The LLC blocker is a legal formality, not a business constraint.** Let me be precise about what the LLC provides: liability protection, tax identity (EIN), and the ability to enter into contracts as an entity. These are important for processing payments. They are not important for letting 50 beta users browse listings, test the bidding interface, submit verification documents, and interact with RAVIO. The conflation of "we need an LLC" with "we can't do anything" is a planning fallacy.

**Here's what I'd ship this week.** Open the platform in a "preview mode" — real listings from real owners, real browsing and bidding by real travelers, real TrustShield verification, real RAVIO conversations. When a bid is accepted, instead of processing payment, show a confirmation screen that says "Your bid has been matched! Payment processing will be enabled in [X weeks] when our full platform launches. You'll be first in line." This captures the entire funnel up to the payment step. You lose the payment conversion data, but you gain everything else — and "everything else" is 90% of the marketplace intelligence you need.

**The competitive window matters.** KOALA partnered with Expedia in May 2024. That's nearly two years ago. The timeshare rental marketplace is a known category now. Every month RAV stays in Staff Only Mode is a month where a funded competitor could be building the same features. RAV's advantage is the depth of its platform — the bidding engine, the verification layer, the AI concierge, the analytics tools. But advantages decay when you're not in market. A less-featured competitor with real users beats a fully-featured platform with zero users every time — because the competitor is learning and iterating while you're polishing.

**On the acquisition narrative.** Simon will argue that messy early data hurts the acquisition story. I'd argue the opposite: acquirers want to see that you launched, learned, and iterated. A clean story with no data is less compelling than a messy story with user growth curves. Marriott Vacations Worldwide doesn't acquire platforms for their codebase — they acquire for the user base, the behavioral data, and the owner relationships. Start building all three now.

**The risk of waiting is concrete; the risk of launching is abstract.** What specifically goes wrong if RAV opens a non-payment beta tomorrow? Someone has a bad experience and writes a negative review? That's fixable. An owner lists a property they don't actually own? TrustShield catches that. A traveler bids and nobody responds? That's data about supply density you need. Compare these risks to the risk of waiting: you lose weeks or months of marketplace learning, your team builds features in a vacuum, and a competitor enters the market while you're waiting for an OBA disclosure at a credit union.

**If I were in the room:** Open RAV to an invite-only beta of 100 users (50 owners, 50 travelers) by end of this week. Enable everything except payment processing. Instrument every interaction. Set up a weekly metrics review. Form the LLC in parallel on whatever timeline the OBA disclosures allow. The moment the LLC and Stripe production keys are ready, enable payments for existing beta users first — they've already been validated by the system.

**My biggest concern with the other side:** Perfectionism disguised as prudence. Every "we should wait until X" argument assumes that waiting has no cost. It does. The cost is measured in learning velocity — and for a pre-revenue marketplace, learning velocity is the only metric that matters.

---

### Patrick McKenzie — Round 1

**Vote:** NO

**Position:**

I'm going to be the person who pulls out the red pen and marks up the specific claims being made here, because I think this conversation is drifting toward a dangerous conflation of "beta" with "no consequences." Let me enumerate the actual risks, because "should we launch beta" sounds innocuous until you look at what RAV's beta actually involves.

**Risk 1: Money transmission without a legal entity.** RAV's architecture includes PaySafe escrow — the platform holds traveler funds until resort confirmation is verified. This is textbook money transmission. Even if you call it "escrow," even if Stripe handles the actual money movement, the platform is the entity making the decision about when funds are released. In 48 states, money transmission requires a license or an exemption. The exemptions typically require that you are a registered business entity. Operating PaySafe as Sujit Personally is not an exemption — it's an exposure. The fines for unlicensed money transmission start at $25,000 per incident in most states and go up from there.

Now, I hear the counterargument: "We won't process payments in beta." Fine. But let me walk through the user experience you're proposing. A traveler finds a listing, bids $800, the owner accepts. The traveler sees... what? "Great news, your bid was accepted! We'll process the payment in a few weeks when our legal entity is ready." Do you know what that sounds like to a consumer? It sounds like a scam. It sounds like a platform that can't actually fulfill what it's promising. You are training your very first cohort of users to distrust the platform's ability to complete a transaction. At TaskRabbit, at Grubhub, at every marketplace I've studied: the first cohort's experience disproportionately shapes the platform's reputation. You do not get a second chance to make a first impression with your first 50 travelers.

**Risk 2: Stripe requires a legal entity.** This is not theoretical. Stripe's Terms of Service require that the account holder be a registered business or an individual operating as a sole proprietorship. RAV's Stripe integration uses Connect with destination charges. The connected accounts (owners) need to be connected to a platform account. That platform account must be a legal entity. If Sujit opens a Stripe account as an individual sole proprietorship to enable beta payments, he is personally liable for every chargeback, every dispute, and every fraud loss. The boardroom context shows the platform has Stripe live keys for production. Those keys are associated with... what entity? If the answer is "Sujit's personal Stripe account," that is a problem I need everyone in this room to understand the magnitude of.

**Risk 3: The fraud surface is real even without payments.** Even in a "no payment" beta, the platform is collecting sensitive personal data through TrustShield — government-issued IDs, property deeds, membership certificates. Under what privacy policy? Under what data processing agreement? As what entity? CCPA requires a "business" as defined in the statute. GDPR (if any EU-based users participate) requires a data controller. An individual person running a beta is not the same as a business entity running a beta, and the liability gap is significant. RAV already has Sentry.io and PostHog tracking user behavior. Who is the data processor? These are not theoretical questions — they are questions a plaintiff's attorney will ask if any user's personal data is compromised during beta.

**Risk 4: Insurance doesn't exist without an entity.** If a traveler books through RAV (or thinks they've booked through RAV) and something goes wrong at the resort — they show up and the unit isn't available, the property is misrepresented, the owner cancels last minute — who do they sue? Without an LLC, the answer is: the individual founders. Personally. That's what limited liability protection is for. RAV has built a cancellation system with policy-based refunds (flexible, moderate, strict, super_strict). Those policies are contractual terms. Who is the contracting party? If it's not a legal entity, those terms may not be enforceable.

**Risk 5: The "just do a non-payment beta" proposal has hidden costs.** I keep hearing "we can do everything except payments." But the features that matter most — the ones that validate the marketplace hypothesis — are downstream of payment. Bidding without payment completion is a game. TrustShield verification without a subsequent booking is an exercise. RAVIO converting a search to a bid that never becomes a booking tells you nothing about actual conversion. You are proposing to test 60% of the funnel and claim you know whether the marketplace works. You don't. You know whether people click buttons. That's a prototype test, not a marketplace test.

**What I'd actually do.** Form the LLC today. Not with all four co-founders — with whoever can sign today. Sujit and Sandhya are clear of OBA requirements. Form a Delaware LLC with those two as initial members. The operating agreement can include provisions for adding members once their OBA clears. File for an EIN immediately — the IRS processes these online in 15 minutes for LLCs with SSNs. Open a business bank account. Transfer the Stripe account to the LLC. This entire sequence takes 2-3 business days. Then open beta with the full platform — payments included — and get the real data that Leah and Bret are rightly asking for.

The question should not be "should we launch without an LLC" but rather "why haven't we formed the LLC with the founders who are already clear?" That's the question I'd ask Sujit.

**If I were in the room:** File a Delaware LLC with Sujit and Sandhya as members before this meeting ends. File the EIN online immediately after. Have the Stripe account transferred to the LLC within 48 hours. Open beta with full payment processing within one week. Add Ajumon and Celin to the operating agreement when their OBAs clear — this is a 10-minute amendment.

**My biggest concern with the other side:** People who say "launch without payments, it's fine" have never dealt with a chargeback, a state AG inquiry, or a class action from users whose personal data was collected by an unregistered entity. The legal exposure isn't hypothetical — it's the first thing an adversarial actor will exploit.

---

### Simon Lehmann — Round 1

**Vote:** CONDITIONAL

**Conditions:** (1) Form the LLC with available founders immediately — do not wait for all OBAs, (2) No financial transactions until entity is registered and Stripe is transferred, (3) Beta data must be clean enough to present in a board deck within 90 days.

**Position:**

I've sat in the room when an acquirer's due diligence team pulls the entity formation date and compares it to the first transaction date. If the first transaction predates the entity, it doesn't kill the deal — but it adds 4-6 weeks to legal review, costs $50,000-$100,000 in additional outside counsel fees, and gives the acquirer's general counsel a reason to push for a lower valuation. I've seen this pattern three times in European vacation rental acquisitions and twice in US travel-tech deals. It is a real cost, not a theoretical one.

That said, I also know that acquirers don't buy platforms with zero users. The most common reason travel-tech acquisitions fall apart isn't legal issues — it's that the target company has beautiful technology and no market validation. Marriott Vacations Worldwide will not acquire RAV for its 825 passing tests. They will acquire it for its verified owner base, its traveler engagement data, and its transaction volume. None of which exist today.

**The acquisition calculus demands data, but clean data.** Here's how I think about this from the acquirer's PowerPoint perspective. Slide 4 of any acquisition presentation is "Operating Metrics." That slide needs to show: monthly active users (both sides), listings growth curve, bid-to-booking conversion, average transaction value, and repeat usage. Every one of these metrics is at zero. The acquirer's team will ask: "What happened between platform completion in March 2026 and your first user?" If the answer is "we waited 3 months for an LLC," that's not a red flag per se, but it does raise a question about the team's operational velocity. If the answer is "we launched a structured beta, validated our core assumptions, and had 200 active users within 60 days of entity formation," that's a story that sells.

**The KOALA benchmark is breathing down RAV's neck.** KOALA partnered with Expedia in May 2024. That gives them a nearly two-year head start on real user data. If Expedia decides to build rather than buy in this category, they already have KOALA's data to work from. RAV's window is not infinite. Every month without users is a month where the strategic value proposition weakens relative to KOALA's growing dataset.

**My recommended structure is a staged beta with entity formation in parallel.** Stage 1 (this week): form the Delaware LLC with Sujit and Sandhya. This takes 2-3 days with a registered agent service. Stage 2 (days 3-10): EIN, business bank account, Stripe account transfer. Stage 3 (days 10-14): open invite-only beta with full payment processing. 50 owners, 100 travelers, 5 destination markets.

The beta should be designed as if it's the first chapter of an acquisition data room. Every metric tracked, every user interaction logged, every support issue documented. In 90 days, you should be able to produce a one-page dashboard showing: supply density by market, bid-to-booking conversion, average booking value, owner payout reliability, TrustShield verification rate, RAVIO engagement rate, and NPS. That's the data that makes the acquisition conversation real.

**What I would absolutely not do is open a beta without any legal entity.** Not because of regulatory risk per se — Jason will cover that better than I can — but because of the narrative damage. When Marriott's BD team Googles "Rent-A-Vacation" and finds a live marketplace with real users and no registered business entity, the conversation ends. They will not call back. The first Google result about your company cannot be a complaint about an unregistered marketplace.

**The "preview mode" idea from Bret is interesting but strategically wasteful.** A marketplace that collects bids but doesn't process them generates what I'd call "phantom metrics" — numbers that look like traction but don't represent real economic activity. An acquirer's data science team will discount this entirely. The bid-to-booking conversion rate when there are no bookings is undefined, not zero. It's worse than zero because it's unmeasurable. I'd rather have 14 fewer days of data and have every data point be a real transaction.

**On the co-founder structure.** The OBA issue is a human problem, not a business problem. Sujit and Sandhya can form the LLC. The operating agreement can reserve membership units for Ajumon and Celin, vesting upon OBA clearance. This is standard startup practice — I've seen it in at least five acquisitions where a co-founder had a prior employment restriction. It's not unusual, it's not a red flag, and it takes a competent startup attorney about 2 hours to draft.

**If I were in the room:** Call a Delaware registered agent service today. Form the LLC with Sujit and Sandhya as initial members. Draft an operating agreement with reserved units for Ajumon and Celin. File the EIN online. Open a Mercury business account. Transfer Stripe. Launch full beta within 14 days with real payments. In 90 days, produce the acquisition-ready dashboard.

**My biggest concern with the other side:** If RAV opens without a legal entity and a single traveler complains publicly, the "unregistered marketplace" narrative becomes the first Google result. That's not a legal problem — it's a brand problem that poisons every future conversation with resort brands, acquirers, and investors. You cannot undo a bad first impression in this industry.

---

### Jason Gamel — Round 1

**Vote:** NO

**Position:**

I'm going to walk through the specific legal statutes that apply here, because I think this room is underestimating how closely the secondary timeshare market is monitored by state regulators. This isn't a hypothetical concern — I work with these regulators. My organization, ARDA, communicates with state Attorneys General offices on a monthly basis about exactly this category of platform.

**Florida Statute 721, the Vacation Plan and Timesharing Act.** Florida is the single most important state for RAV — the majority of Hilton, Marriott, and Disney vacation club properties are in Florida. Section 721.20 requires that any person or entity facilitating the resale or rental of timeshare interests must be clearly identified. The statute specifically addresses "timeshare resale service providers" and requires registration with the Florida Department of Business and Professional Regulation (DBPR). Operating a platform that facilitates timeshare rentals without a registered business entity creates exposure under this statute. The DBPR has issued civil penalties ranging from $5,000 to $50,000 per violation, and they have been actively enforcing against online platforms since 2019.

**California Business and Professions Code Section 11245.** California requires that timeshare resale brokers be licensed or exempt. The exemption for owners renting their own timeshares is clear — but the exemption for the platform facilitating those rentals is not. RAV positions itself as a marketplace, not a broker, but the legal distinction depends on the degree of control RAV exercises over the transaction. When RAV holds funds in escrow (PaySafe), sets cancellation policy terms, and controls the payout timeline, regulators may argue RAV is functioning as a broker, not merely a marketplace. Without a legal entity, there is no entity to hold a broker's license even if one were required.

**Nevada Revised Statutes Chapter 119A.** Nevada regulates timeshare resale and requires that resale companies maintain a registered agent and be organized as a business entity. RAV lists properties at Las Vegas-area resorts. Operating in Nevada without a registered entity is a per se violation, regardless of whether money changes hands.

**The FTC advertising compliance issue.** RAV's landing page uses specific claims: "Name Your Price. Book Your Paradise." The platform references a 15% commission rate, 117 resorts, and specific brand names. Under the FTC's guidelines for timeshare advertising (16 CFR Part 429 and related guidance), pricing claims and availability claims must be substantiated and made by an identifiable entity. The FTC's enforcement position is that online marketplaces making availability claims about timeshare properties are subject to the same advertising standards as traditional resale companies. An unregistered individual making these claims has less legal protection than a registered entity, and the personal liability exposure is significant.

**Consumer data collection without entity registration.** TrustShield collects government-issued photo IDs, property deeds, and membership certificates. Under CCPA (California Consumer Privacy Act), a "business" that collects personal information must be a legal entity. RAV is collecting some of the most sensitive categories of personal information — government IDs and property ownership documents — without being a registered business. If any California resident's data is compromised during beta, the CCPA private right of action applies, with statutory damages of $100-$750 per consumer per incident. With even 50 beta users, that's meaningful exposure.

**The "no payment" beta doesn't eliminate the risk.** Several people in this room will argue that a beta without payment processing avoids the legal issues. It reduces them but does not eliminate them. The moment RAV facilitates a connection between an owner and a traveler for the purpose of a timeshare rental — even without processing the payment — RAV may be functioning as an unlicensed timeshare rental broker in states that regulate the facilitation of timeshare transactions, not just the financial transaction itself. Florida's definition of "timeshare resale service provider" includes any person who "offers to provide or provides... referral services" related to timeshare transfers.

**The reputational risk with ARDA and resort brands is not recoverable.** I represent the industry association that every major resort brand participates in. When a new platform enters the secondary timeshare market, our members notice. If that platform is operating without basic legal registration, it confirms every negative assumption that resort developers already have about the secondary market: that it's populated by fly-by-night operators, scam artists, and unregistered brokers. RAV's technology is clearly more sophisticated than that. But the optics of launching without an LLC send exactly the wrong signal. Howard knows this industry — the brands will categorize RAV based on their first impression, and "unregistered marketplace" is a category that's very hard to escape from.

**What I would recommend.** Form the LLC immediately with whoever is available. Then, before opening any kind of beta — even a non-payment beta — complete three things: (1) register the LLC as a foreign entity in Florida, California, and Nevada, (2) review and update the Terms of Service to clearly disclaim broker status under each relevant state statute, (3) have a licensed attorney review RAV's advertising claims for FTC compliance. This adds approximately 2-3 weeks to the timeline after LLC formation and reduces the regulatory surface area by 80%.

**If I were in the room:** Form the LLC today. Engage a timeshare-specific attorney (I can provide three referrals) to review state registration requirements and advertising compliance. Budget $5,000-$10,000 for this review. It's the cheapest insurance RAV will ever buy.

**My biggest concern with the other side:** People who say "the legal stuff can wait" have never received an enforcement letter from the Florida DBPR. These letters don't arrive with a warning — they arrive with a demand to cease operations and a penalty assessment. Responding to one consumes 3-6 months of founder time and $30,000-$50,000 in legal fees. That's the real cost of launching without proper registration.

---

### Casey Winters — Round 1

**Vote:** CONDITIONAL

**Conditions:** (1) LLC formed within 7 days with available founders, (2) Beta opens with full payment processing within 21 days, (3) Beta is geographically focused on 3 markets maximum with minimum 5 listings per market.

**Position:**

Let me frame this the way I think about it, which is through the lens of what kills marketplaces. Marketplaces don't die from legal entity timing. They die from three things: insufficient supply density, broken trust loops, and learning too slowly. RAV currently has all three risk factors active, and the LLC debate is a distraction from the real emergency.

**The real emergency is that RAV has zero marketplace health data.** Let me tell you what I'd want to measure right now if I were advising this company:

- **Supply density:** How many active listings per destination-month? The minimum viable threshold for a bidding marketplace is 5 competing listings per destination per month. Below that, Name Your Price is a fiction — you're not bidding against other options, you're making an offer to a monopolist.
- **Search-to-bid conversion:** What percentage of travelers who search actually place a bid? This tells you whether the supply is attractive and whether the UX works.
- **Bid-to-acceptance rate:** What percentage of bids do owners accept? This tells you whether the pricing expectations of both sides align.
- **Time-to-first-transaction:** How many days from signup to first booking? For vacation rentals, this could be weeks — but if it's months, the marketplace is too slow to retain users.
- **Repeat rate:** After an owner's first listing rents, do they list again? After a traveler's first booking, do they return? These are the metrics that separate a real marketplace from a one-time matching service.

Every single one of these metrics requires real users. Not survey respondents. Not friends testing the platform. Real owners with real properties making real decisions about pricing, and real travelers with real vacation plans making real decisions about bidding.

**The cold-start is RAV's actual binding constraint.** Here's my framework for the cold-start problem in RAV's specific case. The harder side to acquire is owners — they need to go through TrustShield verification, list a specific property for specific dates, set a nightly rate, and wait for bids. That's significant friction. Travelers are easier — they browse, search, and bid. So the sequencing is: get owners first, then attract travelers.

**But owners won't list without credible demand.** This is the classic chicken-and-egg. An owner looks at RAV and asks: "Are there actually travelers here who will bid on my property?" If the answer is "we don't know, we haven't opened yet," that owner lists on RedWeek instead, where there is known demand. RAV needs to demonstrate demand to attract supply, and supply to attract demand. The only way to break this cycle is to run the marketplace and solve the imbalance in real time.

**The "no payment" beta has a specific, measurable limitation.** Without completed transactions, I can't measure the three metrics that matter most: bid-to-booking conversion, average transaction value, and repeat booking rate. These are the metrics that tell you whether the marketplace generates real economic value. A beta that stops at "bid accepted" gives me the top of the funnel but not the bottom. And the bottom is where marketplaces succeed or fail.

**My recommended approach is a rapid, focused beta with full payment.** Form the LLC this week — Patrick's right that Sujit and Sandhya can do this in 2-3 days. Get the EIN, transfer Stripe, and open a full-featured beta within 21 days. But here's where I'll push back on both Bret and Leah: the beta must be geographically focused.

Don't open the entire platform across 117 resorts. Pick 3 markets — I'd suggest Orlando (highest Hilton/Marriott density), Myrtle Beach (strong Wyndham presence), and Maui or Big Island (aspirational destinations that drive traveler interest). Manually recruit 5-10 owners per market. Personally walk them through listing. Set up a weekly call with every beta owner for the first 30 days. Then open the demand side in those 3 markets only. Run it for 60 days. At the end of 60 days, you either have proof that the marketplace works or you have proof that it doesn't — and either answer is enormously valuable.

**The competitive pressure is real but not immediate.** KOALA's Expedia partnership is a signal, not a threat. Expedia's integration cadence is glacial — it took them 18 months to integrate Vrbo after the HomeAway acquisition. RAV has time, but not infinite time. The goal should be to have 90 days of real transaction data before any acquirer conversation, and the clock on that 90 days should start as soon as physically possible.

**If I were in the room:** Form the LLC by Friday. Stripe transfer by the following Wednesday. Open beta in 3 markets with 5+ listings each by Day 21. Run for 60 days. Measure everything. Make the go/no-go decision on full launch at Day 81 based on the data.

**My biggest concern with the other side:** The people saying "wait for everything to be perfect" don't understand that a marketplace with no data is already dying. You can't see it because there are no users to churn. But the competitive window is closing, the team's assumptions are calcifying, and every day without real feedback is a day where RAV gets further from product-market fit, not closer.

---

## Round 1 Vote Tracker

| Advisor | Vote | One-Line Summary |
|---------|------|-----------------|
| Howard Nusbaum | NO | Don't launch without a legal entity — resort brands and state regulators will categorize RAV as unserious |
| Leah Busque Solivan | CONDITIONAL | Launch a no-payment Founders Beta immediately for marketplace data; form LLC in parallel |
| Bret Taylor | YES | Open invite-only preview now — user data is the binding constraint, not legal structure |
| Patrick McKenzie | NO | Form the LLC with available founders today — it takes 2-3 days, not months; don't launch without it |
| Simon Lehmann | CONDITIONAL | Form LLC immediately with Sujit/Sandhya, then launch full beta within 14 days for acquisition-ready data |
| Jason Gamel | NO | Florida, California, and Nevada statutes create real enforcement risk even without payments |
| Casey Winters | CONDITIONAL | LLC in 7 days, full-payment beta in 3 focused markets within 21 days |

**Round 1 Consensus:** SPLIT — 3 NO, 3 CONDITIONAL, 1 YES

---

## Round 2 — Rebuttals & Final Votes

### Howard Nusbaum — Round 2

**Final Vote:** CONDITIONAL

**Who I'm arguing with most:** Bret Taylor — his claim that "the absence of user data is the binding constraint" dramatically underweights the reputational damage of entering this market without proper legal standing.

**Did I change my mind?** YES — Patrick McKenzie's point about forming the LLC with Sujit and Sandhya in 2-3 days reframed the timeline for me. I was treating the LLC as a multi-month blocker; it's not.

**Sharpest insight in this debate:** Patrick's observation that the real question is "why haven't we formed the LLC with the founders who are already clear?" — this reframes the entire debate from "launch vs. wait" to "execute the obvious administrative step that unblocks everything."

**Rebuttal:**

I came into this discussion as a firm NO, and I want to explain what changed. My concern was, and remains, that the timeshare industry's institutional memory is long. I've seen platforms blacklisted by resort brands based on their first 90 days of operations. That hasn't changed.

What changed is Patrick McKenzie's precise enumeration of the LLC formation timeline. When he said "File a Delaware LLC with Sujit and Sandhya as members before this meeting ends" and "File the EIN online immediately after — the IRS processes these online in 15 minutes," he eliminated the premise of the question. The question assumes the LLC is a distant blocker. It's not. It's a 48-hour administrative task.

I still disagree with Bret's "preview mode" proposal. His suggestion to show users "Your bid has been matched! Payment processing will be enabled in X weeks" is exactly the kind of experience that makes a new platform look amateurish. Bret's Google Maps analogy doesn't hold — Maps launched with incomplete data, but it never launched with a message saying "we'll calculate your directions in a few weeks." There's a difference between a product that's incomplete and a product that acknowledges it can't fulfill its core promise.

But I'll move to CONDITIONAL because I now believe the timeline to a proper, full-featured beta is 14-21 days, not months. My conditions: (1) LLC formed before any beta user is invited, (2) foreign entity registration filed in Florida before any Florida property is listed, and (3) a legal review of RAV's advertising claims completed within 30 days of launch. Jason's point about Florida's DBPR enforcement is not theoretical — I've personally seen those letters arrive.

Casey Winters' geographic focus recommendation is exactly right. Start with Orlando — it's the densest market for Hilton and Marriott vacation club properties, and the Florida regulatory path is the most important one to get right. Prove the model there, then expand.

---

### Leah Busque Solivan — Round 2

**Final Vote:** CONDITIONAL

**Who I'm arguing with most:** Patrick McKenzie — his claim that "bidding without payment completion is a game" and "you are proposing to test 60% of the funnel and claim you know whether the marketplace works" underestimates how much marketplace signal comes from pre-payment behavior.

**Did I change my mind?** NO — but I'm modifying my conditions to align with the emerging consensus on LLC formation speed.

**Sharpest insight in this debate:** Casey Winters' supply density threshold — "5 active listings per destination-month combination" — gives the team a concrete, measurable gate for whether beta is ready. This is exactly the kind of number that prevents false starts.

**Rebuttal:**

Patrick, I respect the precision of your legal analysis, and your point about forming the LLC immediately with Sujit and Sandhya is the smartest tactical suggestion in this room. But when you say that "bidding without payment completion is a game" and that a non-payment beta "tells you nothing about actual conversion," you're wrong — and I say that having run a marketplace through exactly this sequence.

At TaskRabbit, before we had payment processing, we tested the matching engine with real users. We learned that 40% of users who searched for a task never posted one — a UX problem we would have missed entirely if we'd waited for payment integration. We learned that the trust signals we thought mattered (profile photos, reviews) mattered less than response time — the Tasker who replied first won the job 73% of the time. These insights reshaped our entire product. None of them required a completed payment.

For RAV specifically, the pre-payment funnel tells you: (1) do owners actually complete TrustShield verification? (2) how long does listing creation take? (3) do travelers search and find relevant results? (4) does RAVIO drive higher bid engagement than manual search? (5) what's the natural bid range relative to listed price? These five metrics are enormously valuable and payment-independent.

That said, Patrick has reframed the timeline reality for me. If the LLC can be formed in 48 hours, there's no reason to plan a "no-payment" beta that lasts more than 2 weeks. My updated conditions: form the LLC this week, open a pre-payment beta for owner onboarding and supply building immediately, enable full payments within 14 days when Stripe is transferred.

---

### Bret Taylor — Round 2

**Final Vote:** YES

**Who I'm arguing with most:** Jason Gamel — his state-by-state regulatory analysis is thorough but conflates "risk exists" with "risk is imminent and likely." The Florida DBPR is not monitoring pre-launch beta platforms with 50 users.

**Did I change my mind?** NO — but I'll concede that Patrick's LLC formation timeline makes my "preview mode" proposal less necessary. If the LLC can be formed in 48 hours, do both in parallel.

**Sharpest insight in this debate:** Patrick McKenzie's reframing — "the question should not be 'should we launch without an LLC' but rather 'why haven't we formed the LLC with the founders who are already clear?'" This cuts through the entire debate.

**Rebuttal:**

I want to acknowledge that Patrick McKenzie has effectively dissolved the original question. If Sujit and Sandhya can form a Delaware LLC in 2-3 days, file for an EIN online in 15 minutes, and transfer the Stripe account within a week, then the debate shifts from "should we launch without an LLC" to "what should we do in the next 14 days while the LLC is being set up?"

Jason, I need to correct your assumption about enforcement probability. You're describing the maximum regulatory surface area as if it's the expected enforcement action. RAV in beta with 50 users is not going to trigger a Florida DBPR investigation. These agencies have finite enforcement resources and they target platforms processing significant transaction volume, not invite-only betas. I'm not dismissing the risk — I'm calibrating it against the cost of delay.

However, Howard's point about first impressions with resort brands is one I now weigh more heavily. When he says "the brands will categorize RAV based on their first impression," that's not a legal argument — it's a market positioning argument, and it's correct. Marriott's BD team will Google RAV. What they find matters. So here's where I've refined my position: form the LLC immediately, file in Florida as a foreign entity, and then launch. The 14-day timeline Casey proposed is tight but achievable.

My YES vote stands because I believe the answer to "should we open beta" is unambiguously yes — the only debate is the exact sequence of administrative steps in the next 14 days.

---

### Patrick McKenzie — Round 2

**Final Vote:** CONDITIONAL

**Who I'm arguing with most:** Leah Busque Solivan — her claim that pre-payment marketplace signals are "enormously valuable" is true in the abstract but misleading for RAV's specific situation, where the bidding mechanic's value proposition is inextricable from the payment completing.

**Did I change my mind?** YES — from NO to CONDITIONAL. The room has converged on "form the LLC immediately," which eliminates my primary objection. My remaining condition is that no beta user interacts with the platform until the LLC is formed and the privacy policy reflects the legal entity.

**Sharpest insight in this debate:** Jason Gamel's point about Florida's definition of "timeshare resale service provider" including "referral services" — this means even a non-payment beta has regulatory exposure, which reinforces the urgency of forming the LLC before any beta activity.

**Rebuttal:**

Leah, your TaskRabbit analogy about learning pre-payment signals is legitimate, but I want to highlight a critical difference. TaskRabbit's service marketplace has a transaction cycle measured in hours — someone posts a task, a Tasker accepts, the work is done, payment happens. The pre-payment signals (response time, matching patterns) are tightly coupled to the actual transaction. RAV's vacation rental marketplace has a transaction cycle measured in weeks to months — someone lists a property for a date 3 months out, a traveler bids, the owner considers, and the booking is confirmed. In this longer cycle, the payment commitment is a much stronger signal of genuine intent. A traveler who bids $800 with no payment obligation is expressing a preference. A traveler who bids $800 and commits real money is expressing demand. These are categorically different signals, and the marketplace health metrics Casey described — bid-to-booking conversion, repeat booking rate — fundamentally require the latter.

That said, I've moved from NO to CONDITIONAL because the room has correctly identified that the LLC formation timeline is days, not months. My original NO was predicated on the implicit assumption that the LLC was a distant blocker. It's not. The action item is blindingly obvious: form the LLC with Sujit and Sandhya this week.

My conditions for the CONDITIONAL: (1) LLC formed and EIN obtained before any beta user is invited, (2) Stripe account transferred to the LLC before any payment is processed, (3) privacy policy and terms of service updated to reflect the legal entity before any personal data (especially TrustShield documents) is collected.

Simon Lehmann's point about "phantom metrics" resonated with me. Bid data without payment completion is less valuable than it appears for the acquisition narrative. If RAV is positioning for acquisition by Marriott Vacations Worldwide, the metrics that matter are completed transactions, not expression-of-interest data.

---

### Simon Lehmann — Round 2

**Final Vote:** CONDITIONAL

**Who I'm arguing with most:** Bret Taylor — his framing that "acquirers want to see that you launched, learned, and iterated" is true but incomplete. They want to see that you launched *properly*. The iteration story only works if the foundation is clean.

**Did I change my mind?** NO — my position was already CONDITIONAL with immediate LLC formation. The room has converged toward my position.

**Sharpest insight in this debate:** Patrick McKenzie's practical dissolution of the question — "why haven't we formed the LLC with the founders who are already clear?" — is the kind of operational clarity that turns a strategic debate into an action item.

**Rebuttal:**

The most productive thing about this debate is that seven people with very different perspectives have converged on the same tactical recommendation: form the LLC with Sujit and Sandhya immediately, don't wait for all OBAs.

Bret, when you say "acquirers want to see that you launched, learned, and iterated," I'd refine this. What acquirers actually want to see is a clean operating history. "Clean" means: legal entity existed before first user, payment processing was compliant from day one, and the data trail shows intentional growth, not chaotic experimentation. Your Google Maps analogy is about product completeness — launching with incomplete features. That's different from launching with an incomplete legal structure. No acquirer cares if your product was rough at launch. Every acquirer cares if your legal structure was rough at launch.

Casey's geographic focus recommendation is strategically important and I want to reinforce it. When I advise travel-tech companies on acquisition positioning, I always recommend they prove the model in a single market before expanding. The acquirer narrative is much stronger as "we've achieved X density and Y conversion in Orlando, and we're ready to scale to 10 markets with your distribution" versus "we've spread across 15 markets and have thin data everywhere." The former is a growth story; the latter is a red flag.

My conditions remain unchanged. Form the LLC immediately. Full-payment beta within 14-21 days. Clean data from day one.

---

### Jason Gamel — Round 2

**Final Vote:** CONDITIONAL

**Who I'm arguing with most:** Bret Taylor — his claim that "the Florida DBPR is not monitoring pre-launch beta platforms with 50 users" reflects a misunderstanding of how state enforcement works. It's not about monitoring — it's about complaints.

**Did I change my mind?** YES — from NO to CONDITIONAL. Patrick's LLC formation timeline resolves my primary objection. But my conditions are strict.

**Sharpest insight in this debate:** Casey Winters' geographic focus strategy — starting in Orlando — accidentally aligns perfectly with regulatory strategy. If RAV can get Florida right first, it sets the precedent for every other state.

**Rebuttal:**

Bret, I need to correct your assumption about enforcement probability. You said the Florida DBPR "targets platforms processing significant transaction volume, not invite-only betas." That's not how state enforcement works. The DBPR doesn't monitor the internet looking for platforms. Enforcement actions are triggered by complaints — from consumers, from competing businesses, or from resort developers whose brands are being used without permission. RAV's ResortIQ database references Hilton, Marriott, and Disney properties by name. If a brand-protection attorney at any of these companies files a complaint with the DBPR about an unregistered marketplace using their brand names, the DBPR is obligated to investigate regardless of how many users the platform has.

That said, Patrick's point about the LLC formation timeline has reframed my analysis. My NO vote was based on the assumption that "before the LLC is formed" meant "for an extended, indefinite period." If the LLC can be formed this week, the risk window is measured in days, not months.

I'm moving to CONDITIONAL with strict conditions: (1) LLC formed before any beta activity, (2) Florida foreign entity registration filed within 10 days of LLC formation (this costs $125 and can be done online), (3) Terms of Service explicitly disclaim that RAV is not a licensed timeshare resale company, and (4) a timeshare-specific attorney reviews advertising claims within 30 days. These conditions reduce the regulatory surface area by approximately 80% and cost less than $10,000 total.

Casey's suggestion to start in Orlando is strategically brilliant for a reason he may not have considered: Florida's regulatory framework is the strictest and most actively enforced. If RAV can operate compliantly in Florida from day one, every other state is easier. It's like getting your CDL before your regular driver's license — everything after is simpler.

---

### Casey Winters — Round 2

**Final Vote:** CONDITIONAL

**Who I'm arguing with most:** Howard Nusbaum — his original NO position assumed a long LLC timeline. His shift to CONDITIONAL validates that the real question was always about execution speed, not about whether to launch.

**Did I change my mind?** NO — my position was CONDITIONAL from the start, and the room has moved toward it.

**Sharpest insight in this debate:** Patrick McKenzie's reframing — "why haven't we formed the LLC with the founders who are already clear?" — should end the debate and start the execution.

**Rebuttal:**

I want to zoom out and note what just happened in this room. We started with a strategic question — "should we open beta before the LLC is formed?" — and Patrick McKenzie turned it into an operational question — "why haven't you formed the LLC yet?" That reframing is worth more than the rest of this debate combined, because it reveals that the actual blocker isn't strategic disagreement, it's administrative inaction.

Leah's pre-payment marketplace signal argument and Patrick's payment-commitment signal argument are both correct — they're just measuring different things. Leah's signals (TrustShield completion rate, listing creation flow, search engagement) measure product-market fit. Patrick's signals (bid-to-booking conversion, transaction completion, repeat purchase) measure marketplace health. You need both. The sequencing is: Leah's signals first (days 1-14, while the LLC is being set up), then Patrick's signals (days 14 onward, with full payments).

What I don't want to lose in the legal discussion is the supply density requirement. None of this matters if RAV opens in Orlando and has 2 listings. Two listings is not a marketplace — it's a bulletin board. Before inviting any travelers, RAV needs a minimum of 5 active listings per destination-month in the target market. This means the first 7-10 days should be owner-only onboarding: personally recruit owners, walk them through TrustShield, help them list properties. Only after supply density is confirmed should travelers be invited.

My updated timeline: Days 1-3: form LLC, begin owner outreach. Days 3-10: owner onboarding in Orlando (target: 10+ listings). Days 10-14: EIN, Stripe transfer, payment testing. Day 14-21: invite travelers, open full beta. Day 81: first strategic review with 60 days of complete transaction data.

---

## Final Vote Tracker

| Advisor | Round 1 | Final | Changed? |
|---------|---------|-------|----------|
| Howard Nusbaum | NO | CONDITIONAL | YES |
| Leah Busque Solivan | CONDITIONAL | CONDITIONAL | NO |
| Bret Taylor | YES | YES | NO |
| Patrick McKenzie | NO | CONDITIONAL | YES |
| Simon Lehmann | CONDITIONAL | CONDITIONAL | NO |
| Jason Gamel | NO | CONDITIONAL | YES |
| Casey Winters | CONDITIONAL | CONDITIONAL | NO |

**Final Consensus:** CONDITIONAL — 6 CONDITIONAL, 1 YES (unanimous in favor of proceeding)
**Who changed their mind:** Howard Nusbaum, Patrick McKenzie, Jason Gamel
**Biggest fight in the room:** Whether a non-payment beta has real marketplace value (Leah/Bret say yes, Patrick says the payment-commitment signal is categorically different)

---

## Founder Briefing

**The decision:** Whether to lift Staff Only Mode and open RAV to real users before the LLC is formed — given that LLC formation is blocked by OBA disclosures for two co-founders.

**The verdict:** The board unanimously supports opening beta, but with one non-negotiable condition: form the LLC first, this week, with Sujit and Sandhya as initial members. The OBA blocker for Ajumon and Celin is irrelevant to LLC formation — they can be added later via an operating agreement amendment. Every advisor who started as a NO changed their vote once they realized the LLC takes 2-3 days, not months.

**The core tension:** This debate was never really about "beta vs. no beta." It was about whether the team has been treating an administrative task (LLC filing) as a strategic blocker. Patrick McKenzie's reframing — "why haven't we formed the LLC with the founders who are already clear?" — exposed that the real obstacle is execution inertia, not a genuine tradeoff.

**The sharpest insight:** The LLC formation and beta launch are not sequential — they're parallel. You can recruit owners, build supply density, and prepare the marketplace while the LLC, EIN, and Stripe transfer are processing. The first 10 days should be owner-only onboarding in Orlando; payments go live around Day 14.

**Recommended action:** Tomorrow morning, file a Delaware LLC with you and Sandhya as members. File for an EIN online the same day. By Day 7, have Stripe transferred. By Day 10, have 10+ owners onboarded in Orlando with active listings. By Day 14-21, open to travelers with full payment processing. This gives you 60 days of real transaction data by mid-May.

**The dissent worth heeding:** Jason Gamel's point about Florida foreign entity registration is the one operational detail you must not skip. File the Florida registration within 10 days of LLC formation ($125, online). RAV lists Hilton, Marriott, and Disney properties by name — if any brand-protection attorney files a complaint, you need to be a registered entity in Florida when the DBPR comes calling.
