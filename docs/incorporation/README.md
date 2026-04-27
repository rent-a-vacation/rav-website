---
last_updated: "2026-04-27T12:44:05"
change_ref: "d1dd28e"
change_type: "session-60-init"
status: "active"
---

# RAV Incorporation Documentation

> Working folder for everything related to RAV's incorporation as a Delaware C-Corp via Stripe Atlas, foreign-entity registration in Florida, and the lawyer engagement that surrounds them. This is the home for the **scope-WIDE** version of issue **#438** (Incorporation Documentation Starter Kit).

> **Status:** Pre-incorporation. Atlas filing has not started. Boardroom verdict from `docs/boardroom/sessions/2026-04-25-incorporation-service-choice/` is UNANIMOUS Atlas (5-0). Five parallel workstreams in flight.

---

## Folder structure

```
docs/incorporation/
├── README.md                              # this file — index + status
├── templates/                             # reusable templates
│   ├── README.md
│   ├── founder-term-sheet.md              # 4-way equity split agreement
│   ├── term-sheet-explainer-one-pager.md  # "why we need this even without VC"
│   ├── equity-split-briefing.md           # reading-half: 3 pre-built split options + guiding questions
│   ├── equity-split-worksheet-form.md     # fill-in-half: 1-page form, printed 4x at meeting
│   ├── role-selection-form.md             # fill-in form: each founder claims their own title
│   └── signing-logistics-guide.md         # .md → signed PDF; Drive structure
├── lawyer-outreach/                       # Florida marketplace lawyer engagement
│   ├── intro-email.md                     # short intro to Greenberg Traurig / Holland & Knight
│   └── rfp.md                             # full scope of work for the engagement
├── personal-outreach/                     # personal-network referral requests
│   └── attorney-referral-letter.md        # reusable template for friends/contacts
├── founder-meetings/                      # meeting prep + agendas + notes
│   └── 2026-04-26-term-sheet-and-equity/
│       └── agenda.md
└── signed/                                # PDF copies of signed documents (created at signing time)
```

Future additions (per #438 scope WIDE — see PRIORITY-ROADMAP.md):

- `OPERATING-AGREEMENT.md` — co-founder governance (created post-Atlas filing)
- `FORMATION-CHECKLIST.md` — step-by-step incorporation runbook
- `IP-ASSIGNMENT.md` — RAV-specific IP assignment template (founder + future hires)
- `STATE-TAX-NOTES.md` — Florida + multi-state tax exposure notes
- `RAV-SPECIFIC-DOCS/` — marketplace operator agreement, owner listing agreement, 1099 contractor framework, AUP

---

## The five parallel workstreams (Session 60 boardroom recommendation)

All five start the same week — incorporation is the gating dependency for nothing except itself.

| # | Workstream | Owner | Status | Documents in this folder |
|---|---|---|---|---|
| 1 | **Founder term sheet** — 4-way equity split signed before clicking Atlas | Sujit + 3 co-founders | ⏸ Pending signatures | `templates/founder-term-sheet.md` |
| 2 | **Atlas filing** — Delaware C-Corp + EIN + Stripe live + Mercury bank | Sujit | ⏸ Pending term sheet | (Atlas-generated docs land here once filed) |
| 3 | **Florida marketplace lawyer** — engage Greenberg Traurig Orlando hospitality OR Holland & Knight vacation ownership group | Sujit | ⏸ Outreach pending | `lawyer-outreach/intro-email.md`, `lawyer-outreach/rfp.md` |
| 4 | **Brand-protection outreach** — Hilton Grand Vacations, Marriott Vacations Worldwide, Disney Vacation Club | OBA-cleared Founders (assigned at the term-sheet meeting) | ⏸ Pending Atlas Cert (need entity name) | (separate folder TBD) |
| 5 | **Florida foreign-entity registration** — form CR2E047, ~$200 | Sujit | ⏸ Pending Atlas Cert | (filing receipts land here) |

---

## Key context for anyone reading this folder

- **Decision:** Stripe Atlas (UNANIMOUS boardroom verdict, 5-0 — see `docs/boardroom/sessions/2026-04-25-incorporation-service-choice/`)
- **Vehicle:** Delaware C-Corp
- **Operating state:** Florida (foreign-entity registration required)
- **Founders:** 4 confirmed (Sujit, Ajumon, Sandhya, Celin) — all Florida-based. No additional founders planned.
- **OBA disclosure dependency:** Some Founders may be employed by regulated financial institutions or other employers whose Outside Business Activity (OBA) policies require disclosure and approval before they can hold equity in or take an officer role at an outside company. Each Founder's status is confirmed at the term-sheet meeting. **Founder stock issuance is blocked for any Founder whose OBA is still pending**, but **incorporation itself is NOT blocked** — OBA-cleared Founders can incorporate immediately, and OBA-pending Founders' allocations stay reserved at the percentages locked in the term sheet until clearance
- **Goal:** Zero owners onboard the platform until a Florida timeshare attorney has signed off on the full packet (incorporation + 8 policy drafts + RAV-specific marketplace docs)
- **Budget posture:** Bootstrapped. Won't cut corners on legal foundation but expect to compress lawyer hours through preparation

---

## Cross-references

| Document | Purpose |
|---|---|
| `docs/PROJECT-HUB.md` → DEC-037 | Edge-fn test harness decision (Session 60 context) |
| `docs/PRIORITY-ROADMAP.md` → Tier B → #438 | Tier placement and scope confirmation |
| `docs/boardroom/sessions/2026-04-25-incorporation-service-choice/` | Boardroom debate that drove this folder's creation |
| `docs/support/policies/` | The 8 policy drafts at `status: draft` awaiting lawyer review |
| `docs/PLATFORM-INVENTORY.md` | One-page mental model of RAV (lawyer hand-off context) |

---

## Update conventions

- **When a workstream advances:** update its row in the table above + add the relevant artifact to the right subfolder
- **When the lawyer engagement starts:** create `lawyer-outreach/engagement-log.md` with dates of each interaction, key decisions, billed hours
- **When Atlas filing completes:** create `formation-artifacts/` and store the Cert of Incorporation, EIN letter, founder stock purchase agreements, indemnification agreements, organizational consent
- **At session close:** updates to this folder do NOT need a `npm run docs:sync-check` pass — these aren't tracked by the staleness audit (they're project artifacts, not the bootstrap doc set)
