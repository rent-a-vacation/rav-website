---
last_updated: "2026-04-27T12:44:05"
change_ref: "d1dd28e"
change_type: "session-60-init"
status: "active"
---

# Signing & Storage Logistics — RAV Legal Documents

> **Audience:** Sujit (operationally) + the four founders. Walks through HOW to actually sign documents that originate as Markdown in this repo, and WHERE signed copies live.

> **Why this exists:** The term sheet is in `.md` format because that's how everything in this repo is. But you can't ask four founders to sign a Markdown file. This guide covers the conversion → signing → storage flow.

---

## TL;DR — recommended approach for the term sheet

1. **Convert** the filled term sheet (`docs/incorporation/founder-term-sheet-<YYYYMMDD>.md`) → PDF using `python scripts/md-to-pdf.py <input.md>` with appropriate `--footer-left` / `--footer-center` flags
2. **Send for e-signature** via **Zoho Sign** (free tier supports the 4-founder signing flow; see Option B for setup)
3. **Save signed PDF** to:
   - Google Drive (canonical): `Rent-A-Vacation > 01-Incorporation > 01-Term-Sheet > founder-term-sheet-signed-<YYYY-MM-DD>.pdf`
   - **Do NOT commit the signed PDF or the filled markdown to the public GitHub repo** — `docs/incorporation/founder-term-sheet-*.{md,pdf}` and `docs/incorporation/signed/` are gitignored for this reason
4. **Save the Audit Trail / Certificate of Completion** alongside the signed PDF in Google Drive — Zoho Sign attaches it as final pages of the signed PDF *and* makes it separately downloadable. Keep both forms; the certificate is what makes the digital signatures legally enforceable
5. **Update** the meeting agenda + the term sheet template README to mark it complete

**Why NOT Carta yet:** Carta is a cap table management tool — it makes sense AFTER incorporation when you have actual issued stock to track. Pre-incorporation, it's overkill (and Atlas's filing process includes a basic cap table tool free for year 1 anyway). Migrate to Carta later if/when you raise outside capital or scale beyond ~10 employees.

---

## The full picture

There are three options. Pick based on how digital-first the team is.

### Option A — Print, sign by hand, scan back (lowest tech)

**Steps:**
1. Convert `founder-term-sheet.md` → PDF
2. Print 4 copies (or 1 copy with all 4 signature lines on the last page)
3. All four founders sign with a pen (initial each page, full signature on signature page)
4. Scan signed pages → single PDF
5. Save to Google Drive + repo

**Pros:** Familiar. No accounts to set up. Works if any founder is resistant to e-signature.

**Cons:** Requires physical proximity (or mailing). Scans are lossy. Original-vs-copy questions can come up later. Hard to verify all signatures are on the same final version of the document.

**When this makes sense:** If the four of you are meeting in person tomorrow and want to sign on the spot with no setup overhead.

---

### Option B — E-signature via Zoho Sign (RECOMMENDED)

**Steps:**
1. Convert the filled term sheet markdown → PDF (`python scripts/md-to-pdf.py docs/incorporation/founder-term-sheet-<YYYYMMDD>.md --footer-left "CONFIDENTIAL — RAV Founder Term Sheet" --footer-center "Effective: <DATE>"`)
2. Sujit creates a free Zoho account if he doesn't already have one (https://www.zoho.com/sign/) — Zoho Sign is part of the broader Zoho suite
3. Upload the PDF, drag four signature fields + four date fields onto page 5 over the underscored areas
4. Add the four founders' email addresses as recipients (parallel signing — all four can sign in any order)
5. Each founder signs in their browser via an email link (no Zoho account needed for signers)
6. When the last founder signs, Zoho Sign emails everyone the fully-signed PDF with the audit trail attached as final pages
7. Save the signed PDF + standalone audit trail to Google Drive (do NOT commit to the public repo)

**Pros:**
- **Free tier supports 4 signers per document** — unlike Dropbox Sign, which caps at 3
- **Audit trail / Completion Certificate** included — IP addresses, timestamps, email-verification of each signer (this is what acquirers want to see in due diligence)
- **Court-enforceable in all 50 states** under the ESIGN Act + UETA
- **No printing, no scanning, no in-person required**
- **All four founders end up with the same signed PDF** (no version-divergence risk)
- **Integrates with the broader Zoho suite** if you adopt Zoho Mail / Zoho Books / Zoho CRM later

**Cons:** Sujit needs to set up a Zoho account (~5 min). Free-tier limits change periodically — verify the current document quota on Zoho's pricing page before sending.

**What "Audit Trail / Certificate of Completion" actually is:** A separate document Zoho Sign auto-generates showing each signer's name, email, IP address, timestamp, and authentication method. It is NOT the signed PDF — it's the proof that those specific people signed it. Zoho Sign attaches it as the final pages of the signed PDF *and* makes it separately downloadable. Keep both — the signed PDF says "here's what was signed," the certificate says "here's proof these people signed it." Together they make the digital signatures legally enforceable.

**Alternatives to Zoho Sign:**
- **Dropbox Sign** — formerly HelloSign. Free tier supports 3 sig-requests/month BUT **caps at 3 signers per document** — does not work for 4-founder docs without upgrading. Fine for any future doc with 1–3 signers.
- **DocuSign** — industry-standard. Free trial supports up to 5 recipients per envelope but only 3 envelopes lifetime. Burns the trial fast across multiple incorporation docs.
- **DocuSeal** — open-source, fully free for low volume, no signer cap. Can self-host or use their cloud (https://www.docuseal.com). Good fallback if Zoho Sign's free tier tightens.
- **PandaDoc** — free tier limited to 1 signed-doc-template-per-month.
- **Adobe Acrobat Sign** — included if anyone has Adobe Creative Cloud.

---

### Option C — Carta (or Pulley) for cap-table-managed signing

**Steps:**
1. Wait until AFTER Atlas filing completes (incorporation must happen first)
2. Set up a Carta or Pulley account
3. Use their built-in document signing for ongoing equity events (employee option grants, advisor agreements, etc.)
4. Migrate the term sheet + Atlas-issued Stock Purchase Agreements into the Carta record

**Pros:** Everything in one place. Cap-table-aware (it knows who owns what). Investor-ready when you start fundraising.

**Cons:**
- **Carta has a free tier** for companies with <25 stakeholders, but it's limited
- Carta's pricing for full features is significant ($800-3K/year+ depending on tier)
- Pulley is the cheaper modern alternative ($400-1500/year)
- **Both are overkill pre-incorporation** — there's nothing to manage in a cap table when no stock has been issued yet

**Verdict:** Don't use Carta for the term sheet. Revisit Carta after Atlas filing is complete and you have ~$50K+ raised or 5+ stakeholders to track.

---

## Step-by-step: converting `.md` → PDF

### Method 1 — VS Code with the "Markdown PDF" extension (easiest)

1. Open the `.md` file in VS Code
2. Install the extension `yzane.markdown-pdf` (search "Markdown PDF" in extensions)
3. Right-click in the editor → **Markdown PDF: Export (pdf)**
4. PDF lands in the same folder as the `.md` file

### Method 2 — Browser print-to-PDF

1. Open the `.md` file's GitHub-rendered view (push to GitHub first if needed)
2. Browser → File → Print → "Save as PDF"
3. Use letter paper, default margins

### Method 3 — Pandoc (command-line, most control)

```bash
# Install pandoc + a LaTeX engine first (one-time setup):
# Windows: winget install pandoc, then install MiKTeX from miktex.org
# Mac: brew install pandoc basictex
# Linux: sudo apt install pandoc texlive-latex-recommended

cd docs/incorporation/templates/
pandoc founder-term-sheet.md -o founder-term-sheet.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=1in \
  -V fontsize=11pt
```

Pandoc gives the cleanest output but requires installing LaTeX (which is a hassle). VS Code extension is the right call for one-off documents.

---

## Recommended folder structure

### Google Drive (the canonical home for signed legal documents)

```
Rent-A-Vacation/                                    [shared with all 4 founders]
├── 01-Incorporation/
│   ├── 01-Term-Sheet/
│   │   ├── founder-term-sheet-template.pdf         [unsigned reference]
│   │   ├── founder-term-sheet-signed-YYYY-MM-DD.pdf
│   │   └── signing-audit-trail.pdf                 [Dropbox Sign provides this]
│   ├── 02-Equity-Worksheets/
│   │   ├── equity-worksheet-sujit.pdf              [each founder's filled-in copy]
│   │   ├── equity-worksheet-ajumon.pdf
│   │   ├── equity-worksheet-sandhya.pdf
│   │   └── equity-worksheet-celin.pdf
│   ├── 03-Atlas-Filing/                            [populated post-Atlas]
│   │   ├── certificate-of-incorporation.pdf
│   │   ├── ein-letter.pdf
│   │   ├── bylaws.pdf
│   │   ├── stock-purchase-agreement-sujit.pdf
│   │   ├── stock-purchase-agreement-sandhya.pdf
│   │   ├── stock-purchase-agreement-ajumon.pdf     [held; signed when OBA clears]
│   │   ├── stock-purchase-agreement-celin.pdf      [held; signed when OBA clears]
│   │   ├── 83b-election-sujit.pdf                  [proof of mailing + IRS receipt]
│   │   ├── 83b-election-sandhya.pdf
│   │   ├── indemnification-agreements/
│   │   └── organizational-consent.pdf
│   ├── 04-Florida-Foreign-Entity/
│   │   ├── form-CR2E047-filed.pdf
│   │   └── florida-acknowledgment.pdf
│   ├── 05-Cap-Table/                               [updated quarterly]
│   │   └── cap-table-vYYYY-MM-DD.xlsx
│   └── 06-IP-Assignments/
│       ├── ciiaa-sujit-signed.pdf
│       ├── ciiaa-sandhya-signed.pdf
│       ├── ciiaa-ajumon-signed.pdf
│       └── ciiaa-celin-signed.pdf
├── 02-Legal/                                       [post-lawyer-engagement]
│   ├── 01-Lawyer-Engagement-Letter.pdf
│   ├── 02-Florida-Regulatory-Opinion.pdf
│   ├── 03-Policy-Documents-Final/
│   │   ├── booking-tos-v1.0-final.pdf
│   │   ├── privacy-policy-v1.0-final.pdf
│   │   └── (etc — all 8 policies)
│   ├── 04-PaySafe-MSB-Opinion.pdf
│   └── 05-Owner-Listing-Agreement-template.pdf
├── 03-Operations/                                  [ongoing]
│   ├── Bank-Statements/
│   ├── Stripe-Reports/
│   ├── Insurance/
│   └── Vendor-Contracts/
└── 99-Archive/                                     [old versions, retired docs]
```

### This repo (the canonical home for templates and drafts)

```
docs/incorporation/
├── README.md
├── templates/                                      [clean, unfilled templates]
│   ├── founder-term-sheet.md
│   ├── term-sheet-explainer-one-pager.md
│   ├── equity-split-briefing.md                    [reading half, pre-meeting]
│   ├── equity-split-worksheet-form.md              [fill-in half, in-meeting]
│   ├── role-selection-form.md                      [fill-in form, in-meeting]
│   └── signing-logistics-guide.md                  [this file]
├── lawyer-outreach/
├── personal-outreach/
├── founder-meetings/                               [meeting prep + notes]
│   └── 2026-04-26-term-sheet-and-equity/
│       └── agenda.md
└── signed/                                         [PDF copies of signed docs]
    └── founder-term-sheet-signed-2026-04-26.pdf
```

**Why both Google Drive AND repo?** Different purposes:
- **Google Drive:** the canonical, shared, easy-to-access location all four founders + future hires + lawyers reference. PDFs only.
- **Repo:** templates and drafts (Markdown, version-controlled, AI-tooling-friendly). Signed PDFs duplicated here as a backup with git history.

---

## Logistics for tomorrow's meeting

### Before the meeting (Sujit)

1. **Convert the founder-meeting docs to PDF** (from this repo):
   - `templates/term-sheet-explainer-one-pager.md` → PDF (pre-meeting reading)
   - `templates/equity-split-briefing.md` → PDF (pre-meeting reading)
   - `templates/equity-split-worksheet-form.md` → PDF (4 printed copies for the meeting table)
   - `templates/role-selection-form.md` → PDF (4 printed copies for the meeting table)
   - `templates/founder-term-sheet.md` → PDF (the actual term sheet — DON'T FILL IN PERCENTAGES YET; those get filled in during the meeting based on the equity-split discussion)
   - `founder-meetings/2026-04-26-term-sheet-and-equity/agenda-shared.md` → PDF (shared with all four founders)
   - `founder-meetings/2026-04-26-term-sheet-and-equity/agenda-facilitation.md` → PDF (Sujit's facilitation playbook only — NOT distributed)

2. **Send the term-sheet-explainer + equity-split-briefing to all four founders 12-24 hours before the meeting** so they can read in advance. This compresses the meeting time significantly — discussion goes much faster when everyone has read the materials beforehand. The worksheet form does NOT need to be sent in advance; it lives on the table at the meeting.

3. **Set up a Dropbox Sign account** if going with Option B (5 minutes — https://sign.dropbox.com)

4. **Create the Google Drive folder structure** above. Share with all four founders (Editor access for `01-Incorporation/`).

### During the meeting

1. Confirm everyone read the term-sheet-explainer + equity-split-briefing (re-read together if anyone hasn't)
2. Run the equity-split worksheet process — distribute printed copies of `equity-split-worksheet-form.md`, each founder fills in independently, then reveal + discuss
3. Once you have the four numbers, fill them into a clean copy of `founder-term-sheet.md` (or directly into a printed PDF)
4. Resolve the remaining `<!-- TODO -->` comments in the term sheet:
   - Each founder claims their own role in a quick round-robin (self-nomination only — no one picks another founder's role)
   - Each founder confirms their OBA disclosure status (Cleared with employer + date / Pending with date filed + expected resolution / Not yet filed)
   - Confirm reservation timeframe in Section 5 (6, 12, or 18 months)
   - Confirm founder-allocation % (typically 70-80%) and option-pool % (typically 10-15%)
   - Confirm initial board composition (Section 7): Option A (sole director) vs Option B (two co-directors)

### After the meeting

1. Sujit converts the filled-in term sheet to PDF
2. Sends via Dropbox Sign to all four signers
3. Each founder signs (~5 minutes per founder)
4. Sujit downloads the fully-signed PDF + audit trail
5. Saves to Google Drive (`01-Incorporation > 01-Term-Sheet/`)
6. Saves to repo (`docs/incorporation/signed/`) and commits
7. Sends a "Term Sheet signed — starting Atlas filing this week" email to all four founders + saves to Google Drive

---

## What's legally enforceable

**Both physical signatures and e-signatures are equally enforceable in the United States** under the federal ESIGN Act (2000) and the state-level Uniform Electronic Transactions Act (UETA, adopted in 49 of 50 states + Washington DC).

For corporate documents like a founder term sheet:
- E-signatures via Dropbox Sign / DocuSign / DocuSeal are court-enforceable
- The audit trail (IP address + timestamp + email-verification per signer) is admissible evidence
- Florida has adopted UETA (Section 668.50, Florida Statutes), so Florida-resident founders signing electronically is on solid legal ground

The only documents that REQUIRE physical signatures are:
- Wills, codicils, testamentary trusts
- Real estate transfer deeds
- Court documents
- Some specific notarization-required filings

A founder term sheet is none of those. E-signature is fine.

---

## Common mistakes to avoid

- **Signing a draft.** Make sure the version everyone signs is the FINAL version with all percentages and TODOs resolved. Easier to do this on Dropbox Sign (everyone signs the same uploaded PDF) than on print-and-sign-physically (where someone might sign an earlier version by accident).

- **Not capturing the audit trail.** If using Dropbox Sign, save the audit trail PDF alongside the signed document. If signing physically, photograph the signature pages with timestamps visible. The audit trail is what acquirers and lawyers ask for.

- **Storing only in one place.** Save signed PDFs to BOTH Google Drive AND the repo. If Google Drive ever has a permission issue or the repo ever has a corruption issue, the other location is your backup.

- **Confusing the term sheet with the Stock Purchase Agreements.** The term sheet is the pre-incorporation agreement among the four founders. The Stock Purchase Agreements are the formal documents Atlas generates AT incorporation. Both need to be signed. The term sheet is signed first; the SPAs are signed when Atlas generates them.

- **Forgetting the 83(b) election deadline.** This isn't about signing — it's about the IRS form each founder mails within 30 days of receiving stock. Send Sandhya and Sujit a calendar reminder for "mail 83(b) election" set for 25 days after the SPA signing date. The IRS does not extend this deadline for any reason.
