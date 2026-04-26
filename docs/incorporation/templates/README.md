---
last_updated: "2026-04-26T00:34:48"
change_ref: "05da176"
change_type: "session-60-init"
status: "active"
---

# Incorporation Templates

> Reusable document templates for RAV's incorporation and post-incorporation legal infrastructure. Add to this folder as new template needs arise.

---

## Templates in this folder

| File | Purpose | When to use |
|---|---|---|
| [`founder-term-sheet.md`](founder-term-sheet.md) | 4-way founder equity split + vesting + IP assignment + governance preview | **Before clicking incorporate on Stripe Atlas.** Get all 4 founders' signatures, then start Atlas filing the same day. |

---

## How to use a template

1. **Copy** the template file to a sibling folder appropriate to the artifact type — e.g. `docs/incorporation/founder-term-sheet-2026-04-26.md` for a signed instance, or `docs/incorporation/RAV-SPECIFIC-DOCS/owner-listing-agreement-v1.md` for a drafted RAV doc.
2. **Replace placeholders** marked `[BRACKETED CAPS]` with actual values.
3. **Resolve TODO comments** marked `<!-- TODO: ... -->` — these are decision points that require human input.
4. **Save the filled-in version** in its appropriate folder. Never commit a filled-in template back into `templates/` — keep templates clean for reuse.

---

## What belongs in this folder vs. elsewhere

**In `templates/`:** generic reusable structures — founder term sheet, IP assignment template, board consent template, advisor agreement template.

**NOT in `templates/`:**
- **Filled-in instances** of templates → live next to the template's intended destination (e.g., `docs/incorporation/founder-term-sheet-signed.md`)
- **One-off documents** that won't be reused → live in their topical folder (e.g., `docs/incorporation/lawyer-outreach/intro-email.md`)
- **Generated artifacts from third-party services** (Atlas Cert of Incorporation, EIN letter, etc.) → live in `docs/incorporation/formation-artifacts/`

---

## Adding new templates

When you create a new template:

1. Use kebab-case filename: `concept-name.md`
2. Add YAML frontmatter with `last_updated`, `status: active`, `change_type` (manual-edit or session-NN)
3. Use `[BRACKETED CAPS]` for fields the user fills in
4. Use `<!-- TODO: ... -->` HTML comments for decision points
5. Add a row to the table above

---

## Templates likely needed soon (placeholder)

Per #438 scope WIDE, these templates are anticipated:

- **`ip-assignment-agreement.md`** — covers founder + future hire IP assignment to RAV
- **`board-consent-template.md`** — for major decisions (financing, M&A approvals, executive hires)
- **`advisor-agreement.md`** — equity grants for industry advisors (e.g., once we pursue the resort-brand introduction conversations Jason recommended)
- **`stripe-chargeback-response-template.md`** — operational template per Patrick McKenzie's recommendation; defends platform position in card-issuer dispute adjudication
- **`owner-onboarding-warranty.md`** — per Tonia + Brian: owner warrants right-to-rent + indemnifies RAV
