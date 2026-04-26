---
last_updated: "2026-04-26T00:59:55"
change_ref: "c7e181b"
change_type: "session-60-init"
status: "active"
---

# Founder Meeting — Term Sheet + Equity Split

**Date:** April 26, 2026
**Time:** [TIME]
**Location:** [IN-PERSON OR VIDEO LINK]
**Attendees:** Sujit (CEO/CTO), Ajumon (COO), Sandhya (CPO), Celin (CFO)

**Goal:** End the meeting with a signed Founder Term Sheet that captures the 4-way equity split, vesting schedule, OBA-blocker handling, and IP assignment. This is the gating document before Sujit starts the Stripe Atlas filing process.

**Time required:** ~90-120 minutes total

---

## Pre-meeting reading (send to founders 12-24 hours in advance)

1. **`templates/term-sheet-explainer-one-pager.md`** (5 min read) — explains why we need a term sheet even though we're not raising VC. Pre-empts the "isn't this only for VC?" question.
2. **`templates/equity-split-worksheet.md`** (10 min read) — the structured process for deciding the 4-way equity split. Each founder will need to fill this in during the meeting (or before, if they want to think about it in advance).
3. **`templates/founder-term-sheet.md`** (15 min read) — the actual document we're going to sign. Skim so everyone knows what they're agreeing to. The percentages are blank; we fill them in during the meeting.

If founders ask "do I need to read all three before the meeting?" → **yes**. The meeting goes 30-45 minutes faster if everyone has pre-read.

---

## Agenda

### Block 1 — Set context (5 min)

**Sujit opens:**

> "Tonight we're locking in two things: the founder term sheet, and within that, the 4-way equity split. The reason we need this is that I'm starting Stripe Atlas filing this week — Atlas issues our formal Stock Purchase Agreements at incorporation, and we need to have agreed on equity, vesting, and roles BEFORE we click the button. Otherwise we're negotiating in real-time inside a wizard, which is a bad way to make a multi-million-dollar decision.
>
> If anyone has the 'why do we need this if we're not raising VC?' question — that's covered in the one-pager I sent. Quick recap: term sheets aren't VC-specific. They're the 'agree first, formalize second' pattern. We're agreeing first; Atlas formalizes second.
>
> Tonight's outcome: a signed term sheet by end of meeting. Everything else flows from that."

**Open the floor briefly for clarifying questions on the explainer.** Don't relitigate "do we need this" — the answer is yes. If someone strongly objects, table the meeting and discuss separately; don't try to debate it in the room with all four founders watching.

---

### Block 2 — Equity split (60-75 min)

This is the hard part. Run the worksheet process from `equity-split-worksheet.md`.

**Step 1 (20 min) — INDIVIDUAL WORKSHEET FILLING:**
- Hand each founder a copy of the equity-split-worksheet (printed, or Google Doc link, or filled in on paper)
- Set a 20-minute timer
- **NO DISCUSSION DURING THIS TIME.** Phones face down. Everyone fills in independently.
- The worksheet has 7 factors; each founder rates all four founders on each factor; then calculates a percentage at the bottom

**Step 2 (10 min) — REVEAL:**
- All four worksheets go on the table at the same time
- Read out each person's bottom-line numbers for each founder
- Write them on a whiteboard or shared screen so everyone can see all four side by side

**Step 3 (30-45 min) — DISCUSSION:**

Three possible outcomes (covered in the worksheet doc):

- **Tight consensus** (everyone within ±3 points per founder): Take the median for each founder, normalize to 100%, write into the term sheet. Move to Block 3.
- **Moderate variance** (5-10 points): Walk through each factor where people scored differently. Usually the disagreement is in 1-2 factors (most often "value of past contribution" or "expected future hours"). Discuss; re-run the math with shared assumptions.
- **Wide variance** (>10 points per founder): **Stop the meeting.** Do not try to negotiate to a number tonight. Schedule a follow-up. Consider an outside facilitator (the Florida lawyer once engaged, or a startup advisor).

**Sujit's job during this discussion:** Keep it structured. When someone says "I think it should be X%", ask "based on which factor in the worksheet?" Keep the conversation grounded in the explicit factors, not in vague "fairness" arguments.

**Hard rule:** the equity discussion ends with **four numbers totaling 100% written down**. No "we'll figure out the exact percentages later." That's how this gets stuck.

---

### Block 3 — Resolve remaining term-sheet TODOs (15 min)

Walk through the open `<!-- TODO -->` comments in `templates/founder-term-sheet.md`:

| Section | TODO | Decision needed |
|---|---|---|
| 1 | Role titles | Confirm: Sujit = CEO/CTO, Ajumon = COO, Sandhya = CPO, Celin = CFO. Anyone want a different title? |
| 1 | OBA status for Ajumon and Celin | Confirm date filed + expected resolution date for each (or "not yet filed") |
| 2 | Founder allocation % | Pick from 70-80% range (recommend 75% — middle of standard range) |
| 2 | Option pool % | Pick from 10-15% range (recommend 10% — conservative for a 4-founder pre-launch company) |
| 5 | OBA reservation timeframe | Pick from 6/12/18 months (recommend 12 — gives realistic time for the OBA process while preventing indefinite reservation) |
| 7 (formerly 8) | Board composition | Confirm Sujit as initial sole director, expand later by board action |

Sujit fills these in on a working copy as decisions are made.

---

### Block 4 — Sign the term sheet (15-20 min)

Two paths — pick before the meeting:

**Path A — Sign in the room (if meeting in person):**
1. Sujit pulls up the filled-in term sheet on a laptop
2. Converts to PDF (VS Code "Markdown PDF: Export" — 30 seconds)
3. Either:
   - **Print 4 copies, all four sign with a pen, scan back at home** — works if there's a printer + scanner
   - **OR upload to Dropbox Sign in the room and send to everyone for immediate e-signature** — works if everyone's on email and willing to sign right away
4. Confirm everyone has the signed copy

**Path B — Sign within 48 hours (if remote):**
1. Sujit converts the filled-in term sheet to PDF after the meeting
2. Uploads to Dropbox Sign, sends to all four founders
3. Everyone signs within 48 hours (set a deadline — don't let this drift)
4. Sujit downloads the fully-signed PDF + audit trail

**Recommended: Path B with Dropbox Sign even if meeting in person.** Cleaner audit trail, no scanning artifacts, all four founders end up with the same signed PDF. The 48-hour signing window doesn't slow anything down — Sujit can start Atlas filing as soon as Path B completes.

---

### Block 5 — Confirm next steps (10 min)

Sujit walks through what happens after signing:

1. **Sujit:** Starts Atlas filing the same week. Atlas takes 7-10 business days for Cert + EIN + Stripe live + Mercury bank.
2. **Sujit + Sandhya:** Be ready to sign formal Stock Purchase Agreements when Atlas generates them (within 2 weeks).
3. **Sujit + Sandhya:** Mail 83(b) elections within 30 days of receiving stock. **HARD IRS DEADLINE** — set calendar reminders right now in the room.
4. **Ajumon + Celin:** Continue OBA disclosure process. Notify other founders the moment OBA clears so we can issue your stock.
5. **All four:** Sign IP assignment agreements (CIIAAs) at incorporation. These are separate from the Stock Purchase Agreements and apply regardless of OBA status.
6. **Sujit:** Sends the lawyer outreach intro emails this week (separate workstream — see `lawyer-outreach/intro-email.md`).
7. **Sujit + Sandhya:** Begin proactive brand-protection outreach to Hilton Grand Vacations / Marriott Vacations Worldwide / Disney Vacation Club within 30 days of incorporation.
8. **Sujit:** Files Florida foreign-entity registration (form CR2E047, ~$200) within 30 days of receiving Delaware Cert.

**Set a follow-up meeting** for ~3 weeks out — checkpoint to review:
- Atlas filing complete? Any issues?
- Any responses from lawyer outreach? Engagement letter signed?
- Any responses from brand-protection outreach?
- 83(b) elections mailed?
- Status of OBA disclosures for Ajumon + Celin?

---

## Logistics checklist (Sujit, before the meeting)

- [ ] PDF versions of the four prep docs created (term-sheet-explainer, equity-worksheet, founder-term-sheet template, this agenda)
- [ ] Sent to all four founders 12-24 hours before meeting with note: "Read these before tomorrow — they make the meeting much shorter"
- [ ] Dropbox Sign account created (if using Path B)
- [ ] Google Drive folder structure created and shared with all four founders (`Rent-A-Vacation > 01-Incorporation > 01-Term-Sheet/`)
- [ ] Whiteboard or shared screen set up for the equity-split discussion (Step 2 of the worksheet)
- [ ] Printer access if going with Path A (print-and-sign in person)
- [ ] 4 copies of the equity-split worksheet printed (or Google Doc link sent — pick the format that matches the meeting style)
- [ ] Calendar slot blocked for ~120 minutes (don't time-pressure this conversation)
- [ ] Follow-up meeting tentatively scheduled for ~3 weeks out

---

## Things to watch for during the meeting

**Watch for "let's just split equally to keep things simple."** This is the easy out and is often the wrong answer. Push back politely: "I want us to land at the right number, not the simplest number. Let's run the worksheet."

**Watch for someone going silent during the equity discussion.** If a founder isn't pushing back on a number that's lower than what their worksheet suggested, they're either being magnanimous (good) or being pressured (bad — will resurface as resentment in 18 months). Pull them aside if needed: "your worksheet said X, the room is converging on Y, are you genuinely OK with Y or are you just not pushing back?"

**Watch for "we'll figure out the percentages later."** Hard rule — we don't leave the meeting without four numbers totaling 100%. If we genuinely can't get there tonight, schedule the follow-up immediately and pick a date within 7 days. Don't let this drift.

**Watch for OBA-conversation avoidance.** Ajumon and Celin's OBA status affects when their stock issues, not whether or how much. Make sure they understand this clearly. The reservation in the term sheet doesn't reduce their equity — it just defers the timing.

**Watch the time on Block 2 (equity discussion).** If you're 60+ minutes in and nowhere close to consensus, stop. Schedule the follow-up. Don't try to push through with everyone tired and frustrated — that's how bad equity decisions happen.

---

## After-meeting deliverables (Sujit)

1. **Save the 4 filled-in equity worksheets** to `Google Drive > 01-Incorporation > 02-Equity-Worksheets/`
2. **Save the signed term sheet PDF** to:
   - `Google Drive > 01-Incorporation > 01-Term-Sheet/founder-term-sheet-signed-2026-04-26.pdf`
   - `docs/incorporation/signed/founder-term-sheet-signed-2026-04-26.pdf` (this repo)
3. **Save the Dropbox Sign audit trail PDF** to the same locations
4. **Update `docs/incorporation/README.md`** workstream tracker: change Workstream #1 status from `⏸ Pending signatures` to `✅ Signed YYYY-MM-DD`
5. **Send a recap email to all four founders** confirming:
   - Term sheet signed
   - Equity split locked in
   - Atlas filing starting [DATE]
   - Next checkpoint meeting scheduled for [DATE]
6. **Commit to the repo** with message `docs(incorporation): term sheet signed by all 4 founders`
