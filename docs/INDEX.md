---
last_updated: "2026-05-15T00:00:00"
change_ref: "manual-edit"
change_type: "session-68-master-doc-map"
status: "active"
---

# Documentation Index

> **Master map of every documentation home in this repo.** When you don't know where a topic lives, start here. When you create a new doc, find the right folder here first — do not duplicate content across docs (see `feedback-no-doc-duplication`). When you discover a doc that should be archived, see [Archival convention](#archival-convention).

> Last refreshed: **Session 68 (2026-05-15)**. This index is auto-validated by `npm run docs:sync-check` (it must list every active top-level doc + every active subfolder).

---

## How to use this index

1. **Looking for a topic?** Use the topic table below.
2. **Adding a new doc?** Find the right folder in [Folder map](#folder-map). If your topic doesn't fit cleanly into an existing folder, raise it before creating a new top-level home.
3. **Generating a snapshot?** Use [`/generate-docs --<topic>`](../.claude/skills/generate-docs/SKILL.md) — outputs go to `docs/exports/`.
4. **Doc looks stale?** Run `/sdlc-docs audit` — it cross-references against `scripts/source-doc-map.json` to flag drift.

---

## Topic → home

| Topic | Canonical doc | Snapshot generator |
|---|---|---|
| **Pricing, taxes, accounting** | [`RAV-PRICING-TAXES-ACCOUNTING.md`](RAV-PRICING-TAXES-ACCOUNTING.md) | `/generate-docs --accounting` |
| **PaySafe (escrow) compliance** | [`payments/PAYSAFE-COMPLIANCE.md`](payments/PAYSAFE-COMPLIANCE.md) | (composed into `--accounting`) |
| **PaySafe flow spec** | [`payments/PAYSAFE-FLOW-SPEC.md`](payments/PAYSAFE-FLOW-SPEC.md) | — |
| **Financial model** | [`financials/README.md`](financials/README.md) | `/generate-docs --financials` |
| **Operating model** | [`OPERATING-MODEL.md`](OPERATING-MODEL.md) | `/generate-docs --operating-model` |
| **Architecture** | [`ARCHITECTURE.md`](ARCHITECTURE.md) | (composed into `--operating-model`) |
| **Platform inventory** | [`PLATFORM-INVENTORY.md`](PLATFORM-INVENTORY.md) | (composed into `--operating-model`) |
| **Roadmap (current)** | [`PRIORITY-ROADMAP.md`](PRIORITY-ROADMAP.md) | `/generate-docs --product-roadmap` |
| **Status / dev report (current)** | [`PROJECT-HUB.md`](PROJECT-HUB.md) (Session Handoff section) | `/generate-docs --status` |
| **Launch readiness** | [`LAUNCH-READINESS.md`](LAUNCH-READINESS.md) | (composed into `--status`) |
| **Completed phases (archive)** | [`COMPLETED-PHASES.md`](COMPLETED-PHASES.md) | — |
| **Decisions log (archive)** | [`DECISIONS.md`](DECISIONS.md) + active in `PROJECT-HUB.md` | — |
| **Security risk log** | [`SECURITY-RISK-LOG.md`](SECURITY-RISK-LOG.md) | `/generate-docs --security-posture` |
| **Sentry / observability** | [`SENTRY-GUIDE.md`](SENTRY-GUIDE.md) | — |
| **Deployment** | [`DEPLOYMENT.md`](DEPLOYMENT.md) | — |
| **Setup (local dev)** | [`SETUP.md`](SETUP.md) | — |
| **Demo walkthrough** | [`DEMO-WALKTHROUGH.md`](DEMO-WALKTHROUGH.md) | — |
| **P0 test cases** | [`P0-TEST-CASES.md`](P0-TEST-CASES.md) | — |
| **Testing status** | [`testing/TESTING-STATUS.md`](testing/TESTING-STATUS.md) | (composed into `--status`) |
| **QA playbook** | [`testing/QA-PLAYBOOK.md`](testing/QA-PLAYBOOK.md) | — |
| **Doc templates** | [`DOCUMENTATION-TEMPLATE.md`](DOCUMENTATION-TEMPLATE.md), [`NEW-CHAT-TEMPLATE.md`](NEW-CHAT-TEMPLATE.md) | — |
| **Brand & terminology** | [`brand-assets/BRAND-LOCK.md`](brand-assets/BRAND-LOCK.md) | — |
| **API (public)** | [`api/README.md`](api/README.md) | — |
| **Support policies & processes** | [`support/`](support/) | — |
| **Legal dossier** | [`legal/`](legal/) | — |
| **Incorporation** | [`incorporation/`](incorporation/) | — |
| **Marketing** | [`marketing/`](marketing/) | — |
| **Strategy** | [`strategy/`](strategy/) | — |
| **Boardroom artifacts** | [`boardroom/`](boardroom/) | — |
| **Launch artifacts** | [`launch/`](launch/) | — |

---

## Folder map

| Folder | Contains | Owner |
|---|---|---|
| `docs/` (top-level `.md` files) | Cross-cutting canonical docs (architecture, ops, accounting, security, launch, etc.) | Founder + Engineering |
| `docs/api/` | Public API reference + auth/rate-limit notes | Engineering |
| `docs/archive/` | Superseded versions of docs (renamed to be self-explanatory; see [archival convention](#archival-convention)) | — |
| `docs/boardroom/` | Board-facing artifacts | Founder |
| `docs/brand-assets/` | Brand lock, logo, terminology map (BRAND-LOCK.md is canonical) | Founder |
| `docs/exports/` | Auto-generated dated snapshots (`.md` + `.docx`). Output target for `/generate-docs`. Older artifacts move to `docs/exports/archive/`. | Generated |
| `docs/features/` | Per-feature READMEs (engineering reference). Many subfolders also include planning briefs. **Accounting docs do NOT live here** — see [`docs/RAV-PRICING-TAXES-ACCOUNTING.md`](RAV-PRICING-TAXES-ACCOUNTING.md). [`features/accounting/`](features/accounting/) is a thin index pointing to canonical accounting docs. | Engineering |
| `docs/financials/` | Generated `.xlsx` financial model (gitignored). README points to TS source in `scripts/financial-model/`. | Founder |
| `docs/guides/` | How-to guides (user-facing or internal) | Mixed |
| `docs/incorporation/` | LLC formation + state-registration packet | Founder |
| `docs/launch/` | Launch readiness collateral | Founder + Engineering |
| `docs/legal/` | Compliance dossier extracts (some PDFs gitignored — confidential) | Founder + counsel |
| `docs/marketing/` | Go-to-market collateral | Founder |
| `docs/payments/` | PaySafe (escrow) docs — flow spec + compliance posture | Engineering + counsel |
| `docs/strategy/` | Long-range strategy artifacts | Founder |
| `docs/supabase-migrations/` | Migrations 001–006 + 022–023 archive (inherited from Lovable starter; not re-played in `supabase/migrations/`) | Engineering |
| `docs/support/` | Public-facing policies + admin processes (e.g., dispute-resolution SOP) | Founder + Engineering |
| `docs/testing/` | Test status, QA playbook, Stripe test cards, etc. | Engineering |

---

## Archival convention

When a doc is superseded, deprecated, or no longer the source of truth:

1. **Move** to `docs/archive/<original-folder>/<self-explanatory-name>-YYYY-MM-DD.md` (rename to make purpose obvious — e.g. "PLATFORM-REVIEW" → "Platform-UX-Review").
2. **Leave a stub** at the original path with `status: archived` and a one-line redirect to the new location, so inbound links don't break.
3. **Update this INDEX** if the topic mapping changes.
4. `/sdlc-docs` auto-archives **unambiguous supersessions** (same name pattern with newer date) — for ambiguous cases it asks first. See [SKILL.md](../.claude/skills/sdlc-docs/SKILL.md).

## Naming convention (new docs)

- **Self-explanatory file names.** "PLATFORM-REVIEW" was ambiguous (review of what?). "Platform-UX-Review" makes the purpose clear.
- **Dated artifacts** use `Topic-YYYY-MM-DD.md` (ISO-style sortable).
- **Generated snapshots** live in `docs/exports/` and use the existing `RAV-Topic-MMDDYYYY.{md,docx}` naming for backwards compatibility with the Python generators.
- **Per-feature READMEs** live as `docs/features/<feature-slug>/README.md`.

---

## Related infrastructure

- **Auto-stamping pre-commit hook** — [`.husky/pre-commit`](../.husky/pre-commit) → [`scripts/docs-stamp.sh`](../scripts/docs-stamp.sh) auto-fills `last_updated` + `change_ref` frontmatter.
- **Sync check (CI)** — [`scripts/docs-sync-check.ts`](../scripts/docs-sync-check.ts) verifies session-handoff dates, test-count drift, support-doc legal review, DEC-040 phase guard. Runs on every PR.
- **Audit (CI)** — [`scripts/docs-audit.ts`](../scripts/docs-audit.ts) verifies frontmatter completeness + cross-references `scripts/source-doc-map.json`.
- **Source-to-doc map** — [`scripts/source-doc-map.json`](../scripts/source-doc-map.json) maps source file globs to docs that need updating when source changes.
- **Skills** — [`/sdlc`](../.claude/skills/sdlc/SKILL.md) (full SDLC), [`/sdlc-docs`](../.claude/skills/sdlc-docs/SKILL.md) (doc-sync watchdog), [`/generate-docs`](../.claude/skills/generate-docs/SKILL.md) (snapshot composer).
