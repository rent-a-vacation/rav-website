---
last_updated: "2026-04-10T11:02:46"
change_ref: "2a9cb39"
change_type: "manual-edit"
status: "active"
---

# Boardroom Debate — Florida LLC + Holding Company Structure

**Date:** April 6, 2026
**Board:** LEGAL-ADVISORY
**Advisors:** Yokum Taku, Brian T. Lower, Tonia Klausner, Jason Gamel, Patrick McKenzie

---

## The Question

Long-term goal is to have venture capitalists invest or even buy out, but for the time being to start off, would it be okay to start the LLC in Florida itself? The thinking: TechSilon LLC is the founder's existing holding company, owned by Sujit and Sandhya. The proposal is to start Rent-A-Vacation LLC with TechSilon holding 50% equity, and Ajumon and Celin as the other two partners in Rent-A-Vacation LLC. Is that a good approach?

---

## Round 1 — Opening Positions

### Yokum Taku — Round 1

**Vote:** NO

**Position:**

I have to be direct with you because this is exactly the kind of decision that causes founders to spend $80,000–$200,000 in legal fees three years from now untangling a structure that should have been set up correctly on day one. I've watched it happen dozens of times. Let me walk you through precisely why this structure is going to hurt you.

**First, the entity type is wrong for your stated goal.** You told us your long-term goal is venture capital investment or acquisition. There is no scenario in which a venture capital firm leads a Series A into an LLC. Not zero scenarios — *no* scenarios. Institutional VCs, with extraordinarily rare exception, only invest in Delaware C-Corporations. The reasons are structural and they are not negotiable: VC funds have limited partners who are often pension funds, university endowments, and sovereign wealth funds, and those LPs cannot accept the pass-through tax treatment of an LLC because it creates UBTI (Unrelated Business Taxable Income) for tax-exempt LPs. This is not a preference. It is an institutional constraint baked into how venture capital works.

So when the day comes that you want to take that Series A — and based on your context document, you are explicitly building toward this — you will need to convert. LLC-to-C-Corp conversion is doable, but it is not free. The legal fees alone run $20,000–$50,000 in a clean conversion. In a messy conversion, with multiple operating entities and a holding company, that number triples. You will also create a tax event for the LLC members that may or may not be optimized depending on how the conversion is structured. And critically, you will lose the holding period for any Qualified Small Business Stock (QSBS) treatment under Section 1202 — which is potentially the most valuable tax benefit available to startup founders, allowing up to $10 million in capital gains exclusion at exit.

**Second, the holding company structure is the wrong shape for your situation.** I understand the appeal of TechSilon LLC owning 50% of Rent-A-Vacation LLC. It feels like you're keeping things organized. You're separating the "Sujit and Sandhya entity" from the "RAV operating entity." But what you're actually doing is creating a multi-tier corporate structure that any acquirer's M&A counsel will see as a red flag. The first thing they'll ask is: why does this exist? What's in TechSilon? Is there a reason this isn't a single clean cap table? They'll spend due diligence hours unwinding it, and they'll require you to flatten it before closing. That flattening will be painful and expensive.

**Third, the equity allocation creates problems you haven't seen yet.** In your proposed structure, TechSilon owns 50% and Ajumon and Celin presumably split the other 50% somehow — let's say 25% each. So the cap table at the RAV LLC level looks like: TechSilon 50%, Ajumon 25%, Celin 25%. Sujit and Sandhya's interest in RAV is *indirect* — through TechSilon. Now answer this: what happens when you raise a seed round and the investor wants 20% of RAV? Do they take it from TechSilon's 50% or from each member proportionally? What if Ajumon wants to leave the project in year two? His 25% is direct and creates an immediate cap table cleanup problem. What if you want to grant equity to a key engineer? Where does it come from?

These are not theoretical questions. I've seen each of them blow up real deals.

**Fourth, the OBA blocker doesn't require this structure.** I understand what you're trying to do. Ajumon and Celin can't legally hold equity in a competing business until their employers clear their Outside Business Activity disclosures. You're trying to start *something* now without including them as equity holders, while preserving the option for them to participate later. That's a reasonable goal. But the right structure for that is a Delaware C-Corp formed today by Sujit and Sandhya, with Ajumon and Celin's future equity reserved in the company's option pool or via a stock plan that issues to them when their OBA is cleared. The ownership chain stays clean. There's no holding company. There's no Florida LLC. There's just one entity, formed correctly, with a cap table that grows in the standard way.

**Fifth, on Florida specifically:** Florida is a perfectly fine state in which to *operate* a business. It is not the right state in which to *form* the entity that will eventually take venture capital. Delaware exists as the default formation state for a reason: its corporate law is the most developed, most predictable body of corporate law in the United States, and every venture investor and every M&A attorney is fluent in it. Form in Delaware, register the Delaware entity as a foreign entity doing business in Florida, and you have the best of both worlds.

**Numbers you should hold in your head:** A clean Delaware C-Corp formation costs $1,500–$3,000 in legal fees and about $400 in state filing fees. Conversion from a multi-tier LLC structure to a clean C-Corp with VC-ready cap table costs $50,000–$150,000. The decision today is between paying $3,000 now or $100,000 later. There is no middle path that ends well.

**If I were in the room:** Stop the LLC plan. Form a Delaware C-Corporation today with Sujit and Sandhya as the only initial stockholders. Reserve a 15% option pool. Reserve restricted stock grants for Ajumon and Celin contingent on their OBA clearance. File 83(b) elections within 30 days of any restricted stock issuance — that window is absolute.

**My biggest concern with the other side:** Anyone who tells you the LLC is "good enough for now" is solving today's problem and creating tomorrow's. The cost of being wrong about formation structure is asymmetric — a small extra cost today versus a massive cleanup cost later, at the worst possible moment, when you need investor or acquirer attention focused on the business and not on your corporate structure.

---

### Brian T. Lower — Round 1

**Vote:** CONDITIONAL

**Position:**

I'm going to disagree with my colleague Yokum Taku on a critical point, and then I'm going to agree with him on the bigger picture. Stay with me, because the nuance matters for a timeshare-adjacent business in particular.

**Where I disagree with Yokum:** The instinct that "Delaware is always right" is a Silicon Valley default that does not always survive contact with industries that operate in specific physical states with specific regulatory frameworks. For 26 years inside Holiday Inn Club Vacations, I watched competitors and partners structure themselves in different states for very specific operational reasons. Some of the largest vacation ownership operators in the United States are organized in Florida — not Delaware — because the day-to-day business of timeshare operation, resort management, and consumer-facing transactions happens in Florida, and Florida courts have developed a sophisticated body of timeshare law that you actually want to be subject to when disputes arise.

That said, RAV is not a vacation ownership operator. It is a marketplace platform whose long-term home is acquisition by a company like Marriott Vacations Worldwide or Hilton Grand Vacations. So Yokum's broader point — that the entity structure should be optimized for the eventual exit — is correct. I just want you to understand that "Florida is wrong" is not as clean an answer as it sounds, and the right answer requires understanding what RAV actually is from a regulatory standpoint.

**Where I am profoundly worried about your structure:** You are about to operate a platform that lists and sells access to timeshare and vacation club properties from Hilton, Marriott, Disney, Wyndham, and Bluegreen. Your ResortIQ database explicitly references 117 resorts across 9 brands. Each of those brands has a corporate legal team whose entire job is to monitor and pursue platforms that create unauthorized rental channels for their properties. Some of those brands have prosecuted exactly this kind of marketplace. I have personally been on the other side of those conversations.

When that brand legal team comes after RAV — and you should expect that some of them will — the question they will ask, the very first question, is: *who is the legal entity behind this platform?* They will want to sue someone. They will want to send a cease and desist to a real legal person. The entity structure you choose determines who that person is, what their assets look like, and how exposed Sujit, Sandhya, Ajumon, and Celin are personally.

**Here is what your proposed structure does to that question:** TechSilon LLC owns 50% of Rent-A-Vacation LLC. Sujit and Sandhya own TechSilon. Ajumon and Celin own the other 50% of RAV directly. If Marriott Vacations Worldwide sues Rent-A-Vacation LLC for unauthorized use of their brand, the operating entity is the defendant. Good — that's what the entity is for. But the brand's lawyers will then attempt to pierce the corporate veil to reach the individual members. The fact that you have a holding company structure does not provide additional protection unless TechSilon is genuinely operating as a separate business with its own books, capitalization, and arm's-length relationship with RAV. If TechSilon is just a paper entity holding 50% of RAV, it provides essentially zero additional liability shield, and it creates a confusing structure that opposing counsel will use to argue that you don't take corporate formalities seriously.

**Where I align with Yokum, with an important addition:** Form a single clean operating entity. I'm agnostic on whether that entity is Delaware C-Corp or Florida LLC for the legal-shield analysis — both work — but because your stated goal is venture capital and acquisition exit, Yokum's recommendation of Delaware C-Corp is correct for that goal. Just don't form it in Florida thinking it gives you any operational advantage in the timeshare regulatory landscape. It doesn't.

**What it absolutely cannot do:** Form *any* entity, in any state, with any structure, until you have addressed the Florida Vacation Plan and Timesharing Act exposure. Florida Statute Chapter 721 defines "timeshare resale service" broadly enough that a platform facilitating timeshare interval rentals may be captured. If RAV is captured, it must be registered with the Florida Division of Timeshares before processing a single Florida transaction — and your inventory has Disney, Wyndham, and Hilton properties that are physically in Florida. This is not a structural question. It is a *whether you can legally exist* question. And because you are forming the entity, this is the moment to commission a written legal opinion from a Florida timeshare attorney on whether RAV requires registration. I'd want that opinion in hand before I'd let you take any traveler's money.

**On the OBA blocker:** I want to flag something that nobody else will catch. You're proposing to put Ajumon and Celin as equity holders in Rent-A-Vacation LLC right now. *Even if their OBAs are pending and unresolved.* You cannot do this. The entire reason their OBAs are pending is that their employers have not yet authorized their participation in an outside business. Putting them on the cap table of an outside business before their OBA clears is exactly the violation their employers are watching for. This will get them fired. Form the entity without them as equity holders. Reserve their equity contingent on OBA clearance, as Yokum suggested.

**My condition:** I'd accept a single clean operating entity (Delaware C-Corp preferred for the exit goal) formed today by Sujit and Sandhya, with Ajumon and Celin's equity reserved contingent on OBA clearance, AND a Florida timeshare legal opinion in hand before opening to any real customers. Without those conditions, this is not safe to do.

**If I were in the room:** Get the Florida Chapter 721 legal opinion before the entity is even formed. The structure question is secondary to whether the business is legally permitted to operate in its primary inventory state.

**My biggest concern with the other side:** Anyone treating this as a pure "what's the best entity type" debate is missing that this is a regulated industry with brand-specific litigation risk. The structure must be designed to protect the founders personally from foreseeable brand legal action — not just optimized for VC due diligence.

---

### Tonia Ouellette Klausner — Round 1

**Vote:** NO

**Position:**

I am going to focus on something that neither Yokum nor Brian has yet addressed directly, which is what your proposed structure does to platform liability and consumer-facing legal documentation. As a litigator who has spent 17 years defending platforms in class action cases, this is the part of the analysis that determines whether your terms of service hold up when they're actually tested.

**Here is the litigation scenario I want you to imagine:** A class of 5,000 travelers file suit against Rent-A-Vacation in federal court in the Middle District of Florida. The complaint alleges that bookings made through the platform were not honored at check-in, that the platform misrepresented its verification of owner credentials, and that the escrow funds were wrongfully held. Plaintiff's counsel demands documents identifying every legal entity associated with the platform. They get back: Rent-A-Vacation LLC, TechSilon LLC, four named individuals. They immediately add all of them as defendants.

Now we're in the discovery phase. Plaintiff's counsel is going to ask, in a deposition: "Mr. Sujit, please explain the relationship between TechSilon LLC and Rent-A-Vacation LLC. What does TechSilon do? What employees does it have? What is its capitalization? When was it formed? Why does it hold 50% of Rent-A-Vacation LLC? Did TechSilon negotiate the equity split at arm's length?" If your answer to any of these is "it's just a holding entity I set up," opposing counsel will use that to argue that your corporate structure is a sham — that the entities should be collapsed for liability purposes. This is called "alter ego" or "veil piercing" doctrine, and Florida courts apply it. Multi-tier structures without genuine operating substance are precisely the fact pattern that invites it.

**Why this matters for your terms of service:** The terms of service is the most important document on a platform like RAV. It establishes who is and is not party to the rental transaction, who bears what risk, what arbitration applies, what disclaimers exist. Every piece of language in that ToS attaches to a specific legal entity. If the ToS says "Rent-A-Vacation LLC is not a party to the rental transaction" but the actual operator of the platform is some hybrid arrangement between TechSilon and RAV LLC and four individuals, the ToS becomes ambiguous. Plaintiff's counsel will argue the ToS doesn't bind the right parties. The arbitration clause may not extend to TechSilon. The class action waiver may be challenged on the grounds that not all the operators were properly disclosed.

I have personally defended cases where the platform's corporate structure was the weak link in an otherwise defensible position. It is awful. Your defense costs balloon, your settlement leverage evaporates, and you spend months explaining your own corporate structure to a judge instead of arguing the merits.

**Second reason this structure is a problem — DPA and data processor obligations:** Your platform processes user data through Stripe, Resend, Sentry, PostHog, and GA4. Each of those vendors requires a Data Processing Agreement that names the data controller. If your structure is "Rent-A-Vacation LLC, partially owned by TechSilon LLC, with operations performed by the four members," who is the data controller? In a GDPR investigation, an EU data protection authority will ask exactly that question, and if your answer is structurally muddled, the authority will treat both LLCs and all four individuals as joint controllers, multiplying your exposure.

**Third reason — TCPA exposure for your SMS notifications:** You have built an SMS notification system. The TCPA imposes strict liability for unwanted text messages, and statutory damages run $500–$1,500 per violation. A single violating campaign to 10,000 users is $5–15 million in statutory damages, and TCPA class actions are filed routinely. The defendant in a TCPA case is the entity that "made" the call or text — which the FCC and courts have interpreted to include any entity that initiated, controlled, or had immediate authority over the communication. In your structure, who is making the SMS? Rent-A-Vacation LLC? TechSilon? Both? All four members individually? This is a question your structure should have a clean answer to. Right now, it doesn't.

**On the OBA point:** I want to second what Brian Lower said with even more emphasis. Putting Ajumon and Celin on a cap table while their OBA is unresolved is not a paperwork problem. It is a *direct violation* of the very thing their employers are screening for. A bank or credit union OBA review is looking for exactly this — outside ownership interests in a business that compete with or relate to financial services activity. RAV processes payments. Their employer compliance teams will see "you own 25% of a payment-processing platform" and trigger formal disciplinary action. Klausner is telling you, as the litigation defense lawyer in the room, that this creates personal employment law exposure for them and corporate counterparty risk for RAV. Their OBA violation could be cited as evidence that RAV has a culture of legal sloppiness — which is the most damaging finding I could imagine in a future class action.

**On the long-term VC question:** Yokum is right that institutional VCs do not invest in LLCs. I'd add the related point that institutional VCs increasingly *also* don't want to invest in companies whose corporate history shows multi-entity arrangements that had to be unwound. When the due diligence team sees "this company was originally a Florida LLC, then a Florida LLC plus a holding LLC, then converted to Delaware C-Corp," they will ask a lot of questions about why. Each unwound entity represents potential historical liability that the investor is being asked to inherit. Some of those investors will pass on the deal.

**My condition for what I'd accept:** A single clean operating entity, formed once, in the right state for your exit goal. No holding company. No multi-tier structure. Equity for the OBA-blocked co-founders deferred until clearance, not granted now. Terms of service drafted to bind that single entity as the platform operator. This is the path of least litigation risk.

**If I were in the room:** Before you form anything, write the operating draft of your terms of service. Then ask: which entity does this ToS bind, and is that entity sufficient to defend it? Build the entity to fit the ToS, not the other way around.

**My biggest concern with the other side:** The instinct to defer entity decisions ("we'll fix it later") is precisely how platforms end up with terms of service that don't bind the right parties. By the time you discover the gap, you have 5,000 users and a complaint on file.

---

### Jason Gamel — Round 1

**Vote:** CONDITIONAL

**Position:**

I'm going to take a different angle than my colleagues, because they are largely thinking about you from the perspective of investors, litigants, and counterparties. I'm going to think about you from the perspective of the timeshare industry — the people whose properties you're listing, the regulators who watch our industry, and the resort brands whose acquisition is your stated exit strategy.

**The first question I'd ask about your structure is:** what does it look like when the General Counsel of Marriott Vacations Worldwide reads it for the first time?

Because that day is coming. Either she reads it because Marriott is considering acquiring you, or she reads it because Marriott is considering suing you. Either way, the document she reads will be your corporate filings. Your structure, on its face, will tell her something about who you are and what kind of operator you are.

A single clean operating entity formed in Delaware tells her: this is a company built to be acquired, the founders have professional legal advice, the corporate hygiene is proper. A two-tier LLC structure with a holding company and four individual members in Florida tells her: this is a closely-held family-style business with informal arrangements, possibly with no professional corporate counsel involved. The first impression matters and it is hard to undo.

I want to be careful here. I'm not telling you the second structure is illegal or even unusual. I'm telling you that the optical signal it sends is the wrong one for your exit strategy. ARDA member companies — and Marriott, Hilton, Wyndham, and Disney are all ARDA members — are large institutional businesses with legal and compliance cultures that gravitate toward counterparties that look like them. You want to look like them.

**The second issue is industry credibility.** I lead the trade association for the vacation ownership industry. I am asked, frequently, by brand executives whether new entrants to the secondary rental market are credible operators or fly-by-night problems. The answer to that question depends on a handful of observable signals: do they have a real legal entity structure, do they have proper terms of service, do they have demonstrated regulatory awareness, are they engaging with the industry through ARDA or similar bodies, do they have a credible team and credible advisors. Your structure proposal undermines several of those signals.

**Specifically:** Putting 25% equity in the hands of two co-founders whose Outside Business Activity disclosures are still pending is going to be a red flag for any compliance person who looks at it. Every ARDA member company has an OBA process for their own employees. Their compliance teams will recognize the pattern instantly: two financial services employees holding equity in a startup before clearance is a textbook OBA violation. This will be noted in the file. It will not be forgotten.

**Where I land on the LLC vs. C-Corp question:** Yokum is correct that VCs don't invest in LLCs and that conversion is expensive. But there is a separate consideration that he didn't mention which is actually relevant to your industry: the timeshare industry's incumbent acquirers operate as C-Corporations, and their M&A counsel are most comfortable acquiring C-Corporations. When Marriott Vacations Worldwide last acquired a smaller player in the secondary timeshare space, the target was a Delaware C-Corp. When Hilton Grand Vacations acquired Diamond Resorts, the target was a C-Corp. Industry M&A patterns favor C-Corp targets. You are not just optimizing for "VCs in general" — you are optimizing for "the specific acquirers most likely to buy this kind of business."

**Where Brian Lower made the most important point:** The Florida Chapter 721 legal exposure is real and it must be addressed before any entity is formed. I would go further than Brian and say: a written legal opinion from a Florida timeshare attorney is the absolute minimum, and you should also commission a memo on California, Nevada, Hawaii, and South Carolina compliance. Those five states cover the majority of high-value timeshare inventory. If your inventory includes Hilton properties in Hawaii, Wyndham properties in Nevada, and Disney properties in Florida and California, your regulatory exposure is concentrated in five state-specific timeshare statutes, each of which has its own definition of what constitutes a timeshare resale service or rental broker. The right entity structure cannot save you from a state AG enforcement action if you operate without addressing those statutes.

**On the FTC angle, which nobody has yet raised:** The FTC issued specific guidance on timeshare advertising in 2018 and updated it in 2023. Advertising claims about pricing, savings, and availability are subject to FTC scrutiny, and the agency has actively enforced against timeshare resale and rental platforms. Your "Name Your Price" branding is an advertising claim that needs to be scrubbed for compliance. Your structure question and your advertising compliance question both need to be answered before launch.

**My condition:** I'd accept a single clean Delaware C-Corp, formed by Sujit and Sandhya now, with reserved equity for Ajumon and Celin contingent on OBA clearance, AND legal opinions in hand on Florida Chapter 721, California, Nevada, Hawaii, and South Carolina before opening to public traffic. Without the regulatory opinions, no structure is safe.

**If I were in the room:** Commission the multi-state regulatory opinion now, while you're still in pre-launch. Address ARDA membership in the next 90 days — not because it's required, but because it changes how the industry sees you.

**My biggest concern with the other side:** Treating the entity structure as the central question while ignoring the regulatory exposure question is solving the wrong problem first. The right structure can't save a non-compliant business. Get the compliance opinions first.

---

### Patrick McKenzie — Round 1

**Vote:** NO

**Position:**

Let me focus on something specific that none of the other advisors have addressed in detail, which is what your proposed structure does to your payments architecture. This is going to be technical and I'm going to use specific Stripe terminology, but stay with me because the answer matters.

**The core question every payment system asks is: who is the merchant of record?** The merchant of record is the legal entity that has the relationship with the payment processor, that appears on the customer's credit card statement, that bears chargeback liability, and that the processor will debit if anything goes wrong. For a platform like Rent-A-Vacation that uses Stripe Connect, the merchant of record question has two layers: the platform entity (which has the Stripe Connect account) and the connected accounts (the owners who receive payouts).

In your proposed structure, the platform entity is Rent-A-Vacation LLC. Fine. But Rent-A-Vacation LLC is 50% owned by TechSilon LLC and 50% owned by Ajumon and Celin individually. Now imagine the day a chargeback happens. A traveler disputes a $1,800 booking with their credit card issuer. Stripe processes the chargeback. Stripe debits Rent-A-Vacation LLC's account for $1,800. If Rent-A-Vacation LLC doesn't have $1,800 in its account, Stripe will go up the chain and look at the platform's underlying ownership structure to assess collection risk and potentially reserve requirements.

When Stripe's risk team looks at your structure, they will see: a Florida LLC, owned partially by another LLC, owned by individuals, with no operating history, in a high-risk vertical (vacation rentals are categorized as high-risk by every payment processor I have ever seen). The most likely outcomes are: (1) elevated reserve requirements — Stripe will hold a percentage of every transaction for 90–180 days as a buffer against chargebacks, which materially affects your cash flow, or (2) outright rejection of your Stripe Connect application. I have personally seen rejections of Stripe Connect applications for vacation rental platforms with cleaner structures than yours.

**Second issue — money transmission risk.** Your platform has an escrow function (PaySafe). Escrow is one of the most heavily regulated functions in the financial system. In some states, holding customer funds for the benefit of a third party triggers state money transmitter licensing requirements. Money transmitter licenses are expensive to obtain — typically $50,000–$500,000 per state in legal and bonding costs — and many states will not grant them at all to startups without operating history. Your structure question intersects with this in a specific way: the entity that holds the escrow funds must be the entity that obtains the money transmitter license. If Rent-A-Vacation LLC holds the escrow, then Rent-A-Vacation LLC needs the license in every state where you have customers. This is one of the reasons platforms like RAV often partner with a licensed escrow provider rather than holding funds themselves — and you should look very carefully at how PaySafe is structured to confirm whether you are operating under their license or whether you have inadvertently put yourself in the licensed-money-transmitter business.

**Third issue — the holding company complicates the audit trail.** When Stripe, your bank, or your auditors ask "who controls Rent-A-Vacation LLC and where do the profits flow," the answer in a clean structure is "the cap table tells you." In your proposed structure, the answer is "Rent-A-Vacation LLC is owned by TechSilon LLC, which is owned by these two people, plus these two other people who own the rest of RAV directly." This is a perfectly normal holding structure for a real estate investment family or a small private business. It is not a normal structure for a software company seeking institutional investment, and it makes every audit and every counterparty diligence interaction more painful than it needs to be.

**Where I agree with Yokum:** A single Delaware C-Corp is the right answer for your stated goal. Yokum gave the legal reasons. I'll give you the practical reason: every payment processor, every bank, every fintech vendor, and every B2B partner you'll work with in the next decade is set up to easily understand a Delaware C-Corp. They are not set up to easily understand a Florida-LLC-owned-by-another-LLC. Your operational friction goes up in ways that are hard to predict but consistently annoying.

**Where I disagree with the optimistic tone of "fix it later":** The cost of starting wrong is not just legal fees at conversion. It's also the months of delay when your Stripe Connect application gets reserved or rejected, the fact that your first 12 months of transaction history are tied to an entity that you'll later restructure (which creates audit complexity), and the fact that you'll be making payment-related decisions in those 12 months under a structure that you know is going to change. That uncertainty has a cost even if you can't put a number on it.

**On the OBA point — the practical version:** I want to emphasize something Brian and Tonia raised. Your two co-founders work at financial institutions. Financial institutions have automated OBA monitoring systems that scan public records, including state corporation filings. The day Rent-A-Vacation LLC is filed with the Florida Division of Corporations with Ajumon Zacharia and Celin Sunny listed as members, that filing is going to appear in their employer's OBA monitoring system within days. The compliance team will pull the filing, see that the entity is in payments and timeshare rental, see that the OBA disclosure is pending and unresolved, and initiate disciplinary action. This is not a hypothetical. This is how OBA monitoring works at every regulated financial institution I have ever seen.

**My condition would have to include:** No public filing that names Ajumon or Celin as equity holders until their OBA disclosures are formally cleared by their employers in writing. This is non-negotiable.

**If I were in the room:** Run a red-team on the proposed structure by asking: (1) what does Stripe's risk team see when they review the application, (2) what does each co-founder's employer's OBA monitor see in the public corporate filing, (3) which state's money transmitter laws does the escrow function trigger. Each answer kills the proposed structure independently.

**My biggest concern with the other side:** Anyone who says "form an LLC now and worry about Stripe and money transmission later" has not been on the receiving end of a Stripe Connect rejection or a state money transmitter inquiry. Both of these are slow, expensive, and capable of stopping a launch entirely. They need to be designed for at formation.

---

## Round 1 Vote Tracker

| Advisor | Vote | One-Line Summary |
|---------|------|------------------|
| Yokum Taku | NO | Form Delaware C-Corp now; LLCs and holding structures are the most common deal-killer in VC and M&A due diligence |
| Brian T. Lower | CONDITIONAL | Single clean entity OK regardless of state, but Florida Chapter 721 legal opinion must come first |
| Tonia Klausner | NO | Multi-tier LLC structure undermines terms of service enforceability and creates alter-ego veil-piercing exposure |
| Jason Gamel | CONDITIONAL | Delaware C-Corp + multi-state regulatory legal opinions before launch; structure as proposed signals wrong things to industry acquirers |
| Patrick McKenzie | NO | Stripe Connect risk team will reserve or reject; OBA monitoring will catch the public filing; money transmitter exposure unaddressed |

**Round 1 Consensus:** NO with strong additional conditions (3 NO + 2 CONDITIONAL — unanimous against the proposed structure as stated)

---

## Round 2 — Rebuttals & Final Votes

### Yokum Taku — Round 2

**Final Vote:** NO

**Who I'm arguing with most:** Brian Lower, on his suggestion that "Florida is fine, Delaware is a Silicon Valley default."
**Did I change my mind?** NO — but I want to acknowledge Brian made me sharpen *why* Delaware is right specifically here, not just generically.
**Sharpest insight in this debate:** Patrick's point that Stripe Connect's risk team will see this structure during application review and likely impose elevated reserves or reject outright. That is a launch-blocking concrete risk that I had underweighted in my Round 1 framing.

**Rebuttal:**

Brian, I want to engage with your point directly because it deserves a real response, not a dismissal. You said the "Delaware is always right" instinct is a Silicon Valley default that doesn't always survive contact with regulated industries that operate in specific states. You are correct as a general matter — there are absolutely industries and businesses where Delaware is the wrong answer, and I have advised clients to form in their home state precisely because their business model didn't fit the Delaware C-Corp template.

But — and this is the crux of where I push back — RAV is not one of those businesses. Let me be specific about why. The businesses where I'd recommend a non-Delaware structure are typically: (a) closely-held family businesses with no exit ambition, (b) professional service firms where the owners *are* the business, (c) real estate investment vehicles where the entity exists primarily for tax pass-through, or (d) businesses operating in a single state with no plan to ever take outside capital. RAV is none of those. RAV is a software platform with stated VC and acquisition ambitions, with a national customer base, in a high-risk payments-adjacent vertical. For that fact pattern, Delaware C-Corp is not a "default" — it is the structurally correct answer because it is the structure that the eventual capital sources and acquirers are designed to absorb.

The point you made about Florida courts having a sophisticated body of timeshare law is true and relevant, but it does not bear on the question of where to *form* the entity. RAV will be subject to Florida timeshare law regardless of where it is formed, because Florida applies its consumer protection statutes to any business that transacts with Florida consumers. Forming in Florida does not give you better access to Florida law than forming in Delaware and registering as a foreign entity. It just creates extra cost when you eventually have to convert.

Tonia, your point about terms of service being entity-specific is the part of this debate that I think most founders genuinely don't understand until they've seen a litigation. I'm going to amplify it. The terms of service is a contract between the user and a specific named legal entity. If that entity changes, or if the entity is one of multiple entities in a confusing structure, the contract's binding force becomes a question for a court. I have seen plaintiff's lawyers spend an entire deposition asking which entity the user agreed to do business with — and a structure where TechSilon LLC owns 50% of RAV LLC is precisely the fact pattern that gives plaintiff's counsel material to work with. Your point is correct and it is a stronger argument against the proposed structure than my generic "VCs prefer C-Corps" framing.

Patrick, your Stripe Connect rejection point landed with me. I had framed this debate around the eventual VC or acquirer, but you correctly noted that the structure has immediate operational consequences with payment processors. A Stripe Connect rejection or elevated reserve requirement would block launch as effectively as any legal problem. That is a Round 1 omission on my part and I want to credit it.

Jason, your point about Marriott VW's General Counsel reading the corporate filing is exactly the kind of detail that makes legal structure decisions concrete instead of abstract. Founders sometimes hear "form a C-Corp" as a recommendation that exists in a vacuum. The point is that the structure is *signaling* — it tells everyone who interacts with the company what kind of operator the founders are. A clean Delaware C-Corp signals that the founders take corporate hygiene seriously. A multi-tier Florida LLC signals the opposite. I should have made this point in Round 1.

**On the OBA blocker:** Three of the five advisors in this room (Brian, Tonia, Patrick) all flagged that putting Ajumon and Celin on the cap table while OBA is unresolved is itself a violation of their employers' OBA policies. I want to add the legal mechanic here. The OBA disclosure is not just a paperwork requirement — it is a contractual obligation in their employment agreements. Violating the OBA policy is breach of an employment contract, which exposes them to termination for cause, which terminates their unvested equity in their employer, which often triggers clawback of past compensation. The financial cost to Ajumon and Celin of being on the RAV cap table prematurely could be $50,000 to $500,000 each, depending on their compensation structure. The right answer is to defer their equity until OBA is cleared, full stop.

**Final position:** Form a single Delaware C-Corporation today with Sujit and Sandhya as the only initial stockholders. File 83(b) elections within 30 days. Reserve a 15% option pool. Create a restricted stock purchase agreement template for Ajumon and Celin to execute the day their OBA is cleared, with vesting starting from the original founding date so they don't lose time. Get the Florida Chapter 721 legal opinion (Brian's point) before opening to real customers. This is the right answer, and it is the cheapest path to where you want to go.

---

### Brian T. Lower — Round 2

**Final Vote:** NO

**Who I'm arguing with most:** My own Round 1 position. I gave a CONDITIONAL vote because I wanted to push back on what I saw as a Silicon Valley default, but the specifics of this case have moved me.
**Did I change my mind?** YES — Round 1 was CONDITIONAL, Round 2 is NO. The combination of Tonia's litigation analysis and Patrick's Stripe Connect point convinced me the proposed structure is not salvageable with conditions.
**Sharpest insight in this debate:** Patrick's point that public filing of Ajumon and Celin as members in a Florida LLC will trigger their employers' automated OBA monitoring within days. I had warned about the OBA violation in principle; Patrick gave the operational mechanic by which it gets discovered.

**Rebuttal:**

I'm changing my vote and I want to explain why, because intellectual honesty in this room is what makes the exercise valuable.

In Round 1, I gave a CONDITIONAL because I wanted to push back on Yokum's clean Silicon Valley framing and emphasize that the timeshare regulatory environment matters more than the corporate-structure-best-practices conversation. I still believe the timeshare regulatory exposure is the most important issue here, and I still want the Florida Chapter 721 legal opinion before any customer money moves. But Tonia and Patrick raised arguments that made me realize the proposed structure has problems that no condition can fix.

**Tonia, on alter-ego doctrine:** You named the specific Florida case-law issue that I should have raised myself in Round 1 and didn't. Florida courts do apply alter-ego analysis to multi-tier LLCs, and a holding company with no operating substance is the textbook example. I have personally been involved in a case where Florida Middle District pierced a similarly-structured entity and reached the individual members. The plaintiffs' lawyers deposed every member about the holding company's operations, found there were no real operations, and the court ruled the holding company was a "mere instrumentality." Once that happens, the entire personal liability shield for *every* member is gone for that case. Your point about this being the wrong fact pattern for a litigation defense is exactly right and I should have raised it.

**Patrick, on the OBA monitoring point:** You took my abstract warning about OBA and made it concrete in a way that I think is the single most important practical detail in this debate. I told the founders that "Putting Ajumon and Celin on the cap table while OBA is pending is exactly what their employers are watching for." You explained the *mechanism* — that financial institutions run automated monitoring of state corporation filings, and the filing will be flagged within days. This is the kind of operational specificity that turns a general warning into an actionable risk. I should have known this and said it. You're right.

**Yokum, on Delaware vs. Florida:** I want to give you the credit you deserve here. I pushed back in Round 1 on the "Delaware is always right" framing, and your Round 2 response is correct: RAV's specific fact pattern (software platform, national customer base, VC and acquisition ambition) is exactly the fact pattern where Delaware C-Corp is the structurally correct answer, not the "Silicon Valley default" answer. I conceded too little in Round 1 and I'm conceding it now. Form Delaware. The Florida operational considerations are addressed through foreign entity registration in Florida, not through forming the entity in Florida.

**Where I still want the room's attention:** Even with a clean Delaware C-Corp, this business has Florida Chapter 721 exposure, and that exposure is *not* a structure question. You can have the most beautiful Delaware C-Corp in the world and still be operating an unregistered timeshare resale service in violation of Florida law. The legal opinion on Chapter 721 must come from a Florida timeshare attorney, and it should be in writing, on letterhead, before any Florida transaction. I want to make sure that requirement doesn't get lost in the broader structure debate. I'd add the same requirement for the four other states where vacation ownership inventory is concentrated: California, Nevada, Hawaii, South Carolina. Five state-specific legal opinions, in writing, before public launch.

**Jason, on industry credibility:** I want to second your point about ARDA membership and how the industry sees new entrants. I came up inside the industry and I can tell you that brand legal teams talk to each other, and they talk to ARDA. A new platform that engages early with the industry through ARDA, with proper legal documentation and a clean corporate structure, gets a meaningfully different reception than one that doesn't. The structure decision is not just about VCs and acquirers — it is about how the industry talks about you while you're still pre-launch.

**Final position:** Single Delaware C-Corp formed today by Sujit and Sandhya only. Reserved equity for Ajumon and Celin contingent on OBA clearance. Multi-state timeshare regulatory legal opinions before opening to real customers. ARDA engagement in the next 90 days. The proposed structure is not salvageable with conditions — it has too many independent failure modes.

---

### Tonia Ouellette Klausner — Round 2

**Final Vote:** NO

**Who I'm arguing with most:** Jason Gamel — not because I disagree with him, but because his "what does the Marriott GC see" framing is the single most useful lens in this debate and I want to extend it.
**Did I change my mind?** NO — vote unchanged from Round 1 NO.
**Sharpest insight in this debate:** Brian Lower's reference to Florida Middle District piercing a holding company structure on alter-ego grounds. That is the case law that turns my abstract warning about veil-piercing into a concrete precedent the founders should look up.

**Rebuttal:**

Jason, your "what does the General Counsel of Marriott Vacations Worldwide see when she reads this filing" framing is the most useful contribution to this debate. I want to extend it because the same lens applies to every adversarial reader of the platform's corporate structure. Let me list the readers and what they see in the proposed structure:

1. **Marriott Vacations Worldwide GC** (Jason's example): Sees a closely-held family-style business and downgrades the platform's seriousness as a counterparty.

2. **A plaintiff's class action attorney** (my example): Sees a multi-entity structure with named individual members and adds them all as defendants. Spends discovery dollars reaching the personal assets.

3. **Stripe Connect risk team** (Patrick's example): Sees a high-risk vertical with an opaque ownership structure and elevates the reserve requirement or rejects the application.

4. **The Florida Division of Corporations OBA monitoring system at Ajumon's and Celin's employers** (Patrick's mechanic): Sees the filing within days and triggers internal disciplinary review.

5. **A future Series A investor's due diligence counsel** (Yokum's example): Sees a multi-tier structure that requires conversion before investment, with associated cost and risk.

6. **A Florida state Attorney General's office** (Brian's and Jason's combined warning): Sees a Florida LLC operating a timeshare rental service without registration and asks whether registration is required.

Each of these readers can independently take an action that hurts the founders. The question for the founders is: which of these readers can your structure simultaneously satisfy? The answer for the proposed Florida-LLC-with-holding-company structure is: none of them. The answer for a single clean Delaware C-Corp is: most of them, with the regulatory readers (Florida AG, ARDA, Chapter 721) addressed through separate compliance work.

**Brian, on the Florida Middle District alter-ego case:** You raised exactly the right precedent type. I want to add that Florida's alter-ego doctrine is among the more piercing-friendly state laws — Florida courts will look at multiple factors including (1) commingling of assets, (2) failure to observe corporate formalities, (3) undercapitalization, and (4) use of the entity to perpetrate a fraud or injustice. A holding company with no operating substance and no separate capitalization meets at least three of those factors automatically, and a court will not need a sophisticated argument to reach the individuals. The proposed structure puts Sujit, Sandhya, Ajumon, and Celin all in the line of fire of a successful piercing argument.

**Patrick, on payment merchant of record:** Your point intersects with my terms of service concern in a specific way. The merchant of record is the entity that the user's credit card company will identify as the counterparty. If that entity is "Rent-A-Vacation LLC" but the platform's terms of service is between the user and "Rent-A-Vacation LLC and TechSilon LLC and four named individuals," there is a contractual mismatch. The credit card statement says one thing, the legal documentation says another. Plaintiff's lawyers exploit exactly this kind of mismatch in chargeback litigation and class actions. The entity that takes the user's money must be the entity named in the terms of service, period.

**Yokum, on the QSBS point:** I want to second this because it's worth real money. If you form a Delaware C-Corp now, the founders get a five-year clock running on Section 1202 Qualified Small Business Stock treatment. At exit, if you've held the stock for five years and the gain is below the cap, up to 100% of the capital gain is excluded from federal income tax. For a $20M exit, this can be the difference between paying $4M in capital gains tax and paying $0. That's not a tax planning footnote — that's life-changing money. Delaying formation or starting in an LLC and converting later resets that clock. Form C-Corp, today.

**On the OBA situation specifically:** I want to make a procedural recommendation that I don't think anyone else has stated this directly. The right move is to form the C-Corp immediately with Sujit and Sandhya as the only stockholders, AND simultaneously execute a written agreement among all four founders that specifies (a) the percentages each founder will hold once OBA is cleared, (b) the vesting schedule that will apply at that time, and (c) the cliff and acceleration provisions. This agreement is *not* a cap table document — it does not transfer equity. It is a contractual commitment between the four founders about future equity. It protects Ajumon and Celin's expectation interest without violating their OBA disclosures. It's the cleanest way to give everyone certainty without creating the OBA violation.

**Final position:** Single Delaware C-Corp, formed today by Sujit and Sandhya only. Founders' agreement among all four documenting future equity allocation contingent on OBA clearance. Reserved option pool of 15%. Florida Chapter 721 legal opinion before launch. Terms of service drafted to bind the single C-Corp entity as platform operator. None of the conditions of the proposed structure salvage it.

---

### Jason Gamel — Round 2

**Final Vote:** NO

**Who I'm arguing with most:** My own Round 1 position. I voted CONDITIONAL but the room's analysis has convinced me it should be NO.
**Did I change my mind?** YES — Round 1 was CONDITIONAL, Round 2 is NO. Tonia's enumeration of adversarial readers and Patrick's payment-specific operational risks moved me.
**Sharpest insight in this debate:** Tonia's framing of "adversarial readers of the corporate structure." It is the cleanest way I've heard the legal structure question articulated.

**Rebuttal:**

I'm moving my vote from CONDITIONAL to NO and I want to explain why, in the spirit Brian set when he changed his vote.

In Round 1 I voted CONDITIONAL because I wanted to keep the door open to the founders' instinct. My role on this board is partly to think about industry credibility and partly to think about regulatory risk, and I framed the question as "what does this look like to the industry I represent." Tonia and Patrick reframed the question in a way that was sharper.

**Tonia, on adversarial readers:** Your enumeration of who reads the structure and what they see is the cleanest way I've heard this articulated. I want to add one reader to your list that I am specifically positioned to speak about: **the ARDA membership committee.** When RAV applies for ARDA membership — which I recommend they do in the next 90 days — the membership committee will pull the corporate filing. They will see the structure. The committee includes representatives from Marriott VW, Hilton Grand Vacations, Wyndham Destinations, and Disney Vacation Club. These are the same companies whose properties RAV lists. The committee's first question is always: "Is this operator credible?" The corporate structure is the first signal they evaluate. A multi-tier Florida LLC with named individual members is not the structure of an operator the committee will quickly approve. A clean Delaware C-Corp is.

Membership matters because ARDA membership signals to the brands that the operator is in the ecosystem, not against it. Without membership, RAV is a question mark. With membership, RAV is a participant. The structure decision affects this directly.

**Patrick, on the OBA monitoring mechanic:** You added the operational specifics that I had only referenced in general terms. I want to confirm from my industry experience that financial institutions, particularly credit unions and banks of the size that employ Ajumon and Celin, do run automated monitoring of public corporate filings. This is a known operational practice in their compliance departments. The risk is not theoretical. It's a near-certainty that the filing will be flagged within a week.

**Brian, on the alter-ego case law:** Your point about Florida Middle District alter-ego doctrine is the kind of jurisdiction-specific knowledge that is exactly why this debate needs Florida-licensed timeshare attorneys involved. I want to make a stronger recommendation than I made in Round 1. The founders should retain a Florida timeshare attorney *now*, not when they're ready to launch. The retainer should cover (a) the Chapter 721 opinion, (b) the entity formation review, and (c) advice on how the chosen structure interacts with the alter-ego doctrine in Florida. This is legal work that costs $5,000–$15,000 and saves potentially $1M+ in litigation defense costs later. The math is obvious.

**Yokum, on QSBS:** Tonia raised this and I want to triple-underline it. The Section 1202 QSBS exclusion is the single most valuable tax benefit available to startup founders in the United States. Up to $10 million in capital gains exclusion per founder, per qualifying transaction. Five-year holding period from formation. If the founders form an LLC now and convert to C-Corp later, the QSBS clock starts at conversion, not at original formation. For a company on an acquisition path with a 4–6 year time horizon, that delay can cost the founders millions in personal taxes at exit. This is not a footnote — it is one of the most consequential financial decisions in the company's history, and it is being made today.

**Where I want to add something nobody has said yet:** The exit conversation with a strategic acquirer like Marriott Vacations Worldwide doesn't start with the M&A team. It starts with a corporate development scout who reaches out 18–36 months before the actual deal happens. That scout will pull RAV's corporate filings as part of initial diligence. The structure they see is going to influence whether the conversation ever progresses to the M&A team. I have seen this pattern repeatedly in the timeshare industry. The corporate filings are the first impression, and they happen long before the founders know they're being evaluated.

**Final position:** Single Delaware C-Corp, formed today by Sujit and Sandhya. ARDA membership application within 90 days. Florida-licensed timeshare attorney retained before any operating decisions are finalized. Multi-state regulatory legal opinions (Florida, California, Nevada, Hawaii, South Carolina) before opening to real customers. Reserved equity for Ajumon and Celin contingent on documented OBA clearance. The proposed structure has no path to "fix it with conditions" because the conditions don't address the fundamental design problems.

---

### Patrick McKenzie — Round 2

**Final Vote:** NO

**Who I'm arguing with most:** Yokum Taku — but only because he's the closest to fully right and I want to add the operational specifics that complete his framework.
**Did I change my mind?** NO — vote unchanged from Round 1 NO.
**Sharpest insight in this debate:** Tonia's "adversarial readers" framing. It captures every dimension of why the structure is wrong without reducing it to any single legal doctrine.

**Rebuttal:**

The room reached unanimous NO and I want to use my Round 2 to consolidate the operational specifics rather than re-argue the position.

**Yokum, on QSBS:** I want to add a specific number. Section 1202 currently caps the per-founder exclusion at the greater of $10 million or 10x the original investment basis. For a typical software founder with a low cost basis (because they paid almost nothing for their founding shares), the cap is effectively $10 million per founder. For a four-founder company with all founders qualifying, that's $40 million in capital gains potentially excluded from federal income tax. At a 23.8% federal capital gains rate, that's $9.5 million in tax savings to the founder group at exit.

If RAV is acquired in 5–7 years (the typical timeline for an acquisition-targeted startup) and the QSBS clock has been running from a clean Delaware C-Corp formation today, the founders capture this benefit. If RAV is formed as an LLC today and converted to C-Corp in year 2, the QSBS clock restarts at conversion and the holding period requirement (5 years) may not be met before the acquisition. The founders lose the benefit. This is real money. Yokum mentioned QSBS once; Tonia seconded it; I want to put the specific dollar number on it because founders sometimes need to see the magnitude.

**Tonia, on the adversarial readers framing:** This is the cleanest articulation of the issue I have heard in any boardroom. I want to add a sixth reader to your list:

7. **The IRS, in any future audit:** A multi-tier LLC structure with related-party transactions (TechSilon to RAV LLC) creates additional audit complexity. Every dollar that moves between the entities requires arms-length pricing analysis. Every distribution requires documentation. The compliance burden of operating two entities is meaningfully higher than operating one, and the founders will pay for that burden in accounting fees every year for as long as the structure exists.

**Brian, on the timeshare regulatory layer:** Your insistence that the Chapter 721 opinion comes before any customer transaction is correct and I want to amplify it from a payments perspective. State money transmitter laws and timeshare resale service registration laws are *both* potentially triggered by RAV's operations. They are independent regulatory regimes — compliance with one does not satisfy the other. The founders need legal opinions on both, in writing, before processing the first transaction.

I want to suggest something specific: ask the Florida timeshare attorney to *also* address whether RAV's escrow function (PaySafe-branded) triggers Florida money transmitter licensing under Florida Statute Chapter 560. The two questions are related and should be answered in the same opinion letter. If Chapter 721 says you need to register as a timeshare resale service, and Chapter 560 says you need to be a licensed money transmitter, the launch path becomes very different from what the founders are currently planning.

**Jason, on the corporate development scout:** Your point about the 18–36 month lead time on M&A conversations is critical and underrated. Founders sometimes think the corporate hygiene work is for "the day we sign a term sheet." It is not. It is for the day a corporate development analyst at Marriott VW pulls your filings as part of routine market scanning and decides whether to flag you for the M&A team. By the time the term sheet conversation happens, the impression has already been formed.

**On the OBA mechanic, additional detail:** I want to add one more specific risk to the OBA situation. Some financial institutions monitor not just public corporate filings but also professional networking sites (LinkedIn, AngelList, Crunchbase) for signals of outside business activity. If Ajumon or Celin update their LinkedIn profiles to mention "Co-founder, Rent-A-Vacation" before OBA is formally cleared, that is also a violation that gets flagged by automated monitoring. The cleanest path is: no public mention of their RAV affiliation until OBA is cleared in writing. Their roles can be internal-only until that point.

**The right structure, restated for the record:** A single Delaware C-Corporation, formed today, with Sujit and Sandhya as the only initial stockholders. 1,000,000 shares authorized, 800,000 issued to founders, 200,000 reserved as the option pool. 4-year vesting with a 1-year cliff for the founders. 83(b) elections filed within 30 days. A founders' agreement signed by all four founders documenting future equity allocations contingent on OBA clearance. Florida foreign entity registration. Florida timeshare attorney retained. Stripe Connect application submitted under the clean C-Corp identity. ARDA membership application in the next 90 days. Multi-state legal opinions in hand before public launch.

This is the answer. The cost is approximately $5,000–$10,000 in legal fees today and about $400 in state filing fees. The cost of doing it the proposed way and converting later is $50,000–$200,000 plus untold operational friction in the meantime.

**Final position unchanged:** NO to the proposed structure. YES to a single Delaware C-Corp formed correctly.

---

## Final Vote Tracker

| Advisor | Round 1 | Final | Changed? |
|---------|---------|-------|----------|
| Yokum Taku | NO | NO | NO |
| Brian T. Lower | CONDITIONAL | NO | YES |
| Tonia Klausner | NO | NO | NO |
| Jason Gamel | CONDITIONAL | NO | YES |
| Patrick McKenzie | NO | NO | NO |

**Final Consensus:** NO — 5/5 unanimous against the proposed structure
**Who changed their mind:** Brian Lower and Jason Gamel both moved from CONDITIONAL to NO after seeing Tonia's litigation framing and Patrick's operational specifics
**Biggest fight in the room:** Whether Florida vs. Delaware is a meaningful debate at all, or whether the entity-type and structural-shape questions overwhelm the state-of-formation question. (Resolved: state of formation matters, and Delaware wins for a VC-track software platform regardless of where operations occur.)

---

## Founder Briefing

**The decision:** Whether to form Rent-A-Vacation LLC in Florida, with TechSilon LLC (your existing holding company) owning 50% and Ajumon and Celin as the other two equity holders.

**The verdict:** The board voted unanimous NO — five out of five against the proposed structure. Two advisors started CONDITIONAL and moved to NO after the debate. This is not a close call.

**The core tension:** The real disagreement was not "Florida vs. Delaware" or "LLC vs. C-Corp." Those were resolved quickly. The real fight was whether your stated long-term goal (VC investment or strategic acquisition) is best served by optimizing the structure for that goal *today* — even at the cost of administrative effort — or by deferring the optimization until later. The board landed firmly on "optimize today." The cost of starting wrong is asymmetric: a few thousand dollars and a few hours today, versus tens of thousands of dollars, months of friction, and potentially lost QSBS tax benefits later.

**The sharpest insight:** Tonia's "adversarial readers" frame. Every legal structure has multiple readers — investors, plaintiffs' lawyers, payment processors, regulators, M&A scouts, OBA monitoring systems at your co-founders' employers. Your job at formation is to pick the structure that satisfies as many of those readers as possible simultaneously. The proposed structure satisfies none of them. A single Delaware C-Corp satisfies most of them.

**Recommended action:**
1. **Do not form the proposed structure.** Do not file Florida LLC paperwork. Do not put Ajumon or Celin's names on any public corporate filing.
2. **Form a Delaware C-Corporation this week.** Use a startup-experienced attorney (Yokum's firm is one option; Cooley, Gunderson Dettmer, Fenwick, or Orrick are other defaults). Cost: $1,500–$5,000.
3. **Initial stockholders:** Sujit and Sandhya only. 800,000 shares to founders, 200,000 in option pool, 1,000,000 authorized.
4. **File 83(b) elections within 30 days.** This window is absolute and unforgiving.
5. **Founders' agreement signed by all four founders** documenting Ajumon and Celin's promised equity contingent on OBA clearance. This protects their expectation interest without creating an OBA violation.
6. **Retain a Florida-licensed timeshare attorney now.** Commission a written opinion on Florida Chapter 721 (timeshare resale service registration) and Chapter 560 (money transmitter licensing) before opening to real customers.
7. **Register Delaware C-Corp as a foreign entity in Florida** so you can lawfully transact business there.
8. **Apply for ARDA membership in the next 90 days.**
9. **Submit Stripe Connect application under the clean C-Corp identity.** Do not let the multi-tier proposed structure ever touch your payments stack.

**The dissent worth heeding:** Brian Lower's original instinct — that the Florida Chapter 721 regulatory exposure is more important than the corporate structure debate — is correct and must not get lost. The cleanest C-Corp in Delaware does not save you from operating an unregistered timeshare resale service in Florida. Get the legal opinion in writing, on letterhead, before the first transaction. Brian's caution is the conscience of this debate even though his vote ultimately moved.
