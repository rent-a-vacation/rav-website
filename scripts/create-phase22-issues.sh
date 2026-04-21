#!/bin/bash
# Creates 22 child issues for Phase 22: Customer Support Foundation (epic #395)
# Idempotent: skips if title already exists in epic milestone
set -e

REPO="rent-a-vacation/rav-website"
EPIC=395
MILESTONE="Phase 22: Customer Support Foundation"

create_issue() {
  local title="$1"
  local labels="$2"
  local body="$3"

  # Skip if same title already exists open in this milestone
  local existing
  existing=$(gh issue list --repo "$REPO" --milestone "$MILESTONE" --search "\"$title\" in:title" --json number,title --jq ".[] | select(.title == \"$title\") | .number")
  if [ -n "$existing" ]; then
    echo "SKIP: #$existing already exists: $title"
    return
  fi

  local url
  url=$(gh issue create --repo "$REPO" --title "$title" --label "$labels" --milestone "$MILESTONE" --body "$body")
  echo "CREATED: $url — $title"
}

# ============================================================================
# TRACK A — Infrastructure (4)
# ============================================================================

create_issue \
  "A1: docs/support/ folder + frontmatter schema + exemplar doc" \
  "docs,platform,pre-launch" \
  "$(cat <<'EOF'
## Goal
Establish `docs/support/` as the home for 20 policy/FAQ/process/guide documents. Define the shared frontmatter schema + body structure every support doc must follow. Ship one exemplar doc demonstrating the pattern.

## Acceptance criteria
- [ ] `docs/support/{policies,faqs,processes,guides,diagrams}/` created
- [ ] `docs/support/README.md` documents frontmatter schema + body structure
- [ ] Frontmatter extends existing (`last_updated`, `change_ref`, `change_type`, `status`) with: `title`, `doc_type`, `audience[]`, `version`, `legal_review_required`, `reviewed_by`, `reviewed_date`, `tags[]`
- [ ] Body sections standardized: Summary / Details / Examples / Related
- [ ] One exemplar doc in `policies/` fully populated per schema (suggest: `cancellation-policy.md`)

Parent: #395
EOF
)"

create_issue \
  "A2: Migration — support_docs table + RLS" \
  "platform,database,pre-launch" \
  "$(cat <<'EOF'
## Goal
DB schema to index `docs/support/` content for fast agent retrieval. Markdown stays canonical in git; this is a build-time cache.

## Acceptance criteria
- [ ] New migration: `support_docs` table
- [ ] Columns: `id`, `slug`, `doc_type`, `audience text[]`, `version`, `frontmatter jsonb`, `sections jsonb`, `search_tsv tsvector`, `embedding vector` (if pgvector available, else defer)
- [ ] Indexes on `slug` (unique), `doc_type`, `search_tsv` (GIN)
- [ ] RLS: readable by authenticated users; write restricted to `service_role`
- [ ] Deployed to DEV after PR merge; PROD deploy gated on epic completion

Depends on: A1
Parent: #395
EOF
)"

create_issue \
  "A3: Ingest edge function + GitHub Action for docs/support/ sync" \
  "platform,edge-function,pre-launch" \
  "$(cat <<'EOF'
## Goal
One-way sync from `docs/support/*.md` → `support_docs` table. Triggered on push to `main`.

## Acceptance criteria
- [ ] `supabase/functions/ingest-support-docs/index.ts` parses frontmatter + section headers
- [ ] Upserts rows by `slug`; deletes rows whose source file was removed
- [ ] `.github/workflows/sync-support-docs.yml` invokes on push to `main` affecting `docs/support/**`
- [ ] Handles both DEV and PROD via env (default: PROD on main)
- [ ] Idempotent — re-running produces same DB state
- [ ] Test: tamper with an exemplar doc, push, verify DB updated within 2 minutes

Depends on: A1, A2
Parent: #395
EOF
)"

create_issue \
  "A4: Extend docs-sync-check.ts for docs/support/" \
  "docs,platform" \
  "$(cat <<'EOF'
## Goal
Prevent staleness + schema violations in support docs via the existing CI check.

## Acceptance criteria
- [ ] `scripts/docs-sync-check.ts` validates every `docs/support/**/*.md` has required frontmatter fields
- [ ] Flags docs with `legal_review_required: true` where `last_updated > 90 days`
- [ ] Flags docs with `status: 'active'` + `legal_review_required: true` where `reviewed_date` is null
- [ ] Wired into `npm run docs:sync-check` and existing `docs-audit.yml` CI workflow

Depends on: A1
Parent: #395
EOF
)"

# ============================================================================
# TRACK B — Content (5)
# ============================================================================

create_issue \
  "B1: Gap analysis — 20 support docs × authoritative source mapping" \
  "docs,pre-launch" \
  "$(cat <<'EOF'
## Goal
Before writing any doc, map each of 20 target docs to: **{derive from code, extract from FAQ/UserGuide, write new, legal-blocked}**. Prevents drift and scope creep.

## Deliverable
`docs/support/GAP-ANALYSIS.md` — table with 20 rows × columns:
- `doc_slug`
- `source_type` (derive | extract | write-new | legal-blocked)
- `authoritative_ref` (file path or existing doc/page)
- `legal_review_required` (bool)
- `owner` (who will author)
- `target_folder` (policies | faqs | processes)

## Acceptance criteria
- [ ] All 20 docs listed with source type + authoritative reference
- [ ] Identifies which `FAQ.tsx` / `UserGuide.tsx` sections feed which FAQ doc
- [ ] Identifies which `src/flows/` manifest or `src/lib/*.ts` file feeds which process doc
- [ ] Reviewed before B2-B5 begin

Parent: #395
EOF
)"

create_issue \
  "B2: Derive 4 process/policy docs from code" \
  "docs,pre-launch" \
  "$(cat <<'EOF'
## Goal
Author 4 docs derived from authoritative code sources — not hand-written prose that drifts.

## Docs
1. `policies/cancellation-policy.md` — from `src/lib/cancellationPolicy.ts` (4 policy tiers, deadlines, refund % per tier, examples)
2. `policies/refund-policy.md` — Stripe refund flow + `process-cancellation` edge function + dispute refund paths
3. `processes/booking-workflow.md` — from `src/flows/traveler-lifecycle.ts`
4. `processes/bidding-process.md` — from `src/flows/owner-lifecycle.ts` + `listing_bids` schema

## Acceptance criteria
- [ ] All 4 docs in place following schema from A1
- [ ] Each doc cites its authoritative source (path + commit SHA) in `change_ref`
- [ ] No duplication of rules from code — narrative only; rules linked

Depends on: A1, B1
Parent: #395
EOF
)"

create_issue \
  "B3: Consolidate 5 FAQ docs from FAQ.tsx + UserGuide.tsx" \
  "docs,pre-launch" \
  "$(cat <<'EOF'
## Goal
Extract and consolidate existing FAQ.tsx and UserGuide.tsx content into 5 markdown FAQs for agent retrieval. On-page UX stays untouched.

## Docs
1. `faqs/booking-faq.md`
2. `faqs/billing-faq.md` — includes owner tax / 1099-K section
3. `faqs/property-owner-faq.md`
4. `faqs/traveler-faq.md`
5. `faqs/general-platform-faq.md` — includes voice search fair use + referral program sections

## Acceptance criteria
- [ ] All 5 docs follow schema from A1
- [ ] `UserGuide.tsx` and `FAQ.tsx` remain the UX surface — no content removal
- [ ] Clear rule: FAQ.tsx updates trigger a PR task to update the corresponding markdown (or the opposite — TBD in B1)

Depends on: A1, B1
Parent: #395
EOF
)"

create_issue \
  "B4: Author 5 internal workflow docs (new content)" \
  "docs,pre-launch" \
  "$(cat <<'EOF'
## Goal
Write 5 internal-workflow docs not blocked by legal review.

## Docs
1. `processes/customer-support-escalation.md` — when agent escalates, to whom, via what channel
2. `processes/dispute-resolution.md` — internal dispute workflow (categories, evidence, admin review, refund path). NOT public T&Cs
3. `processes/emergency-safety-escalation.md` — separate routing for safety-critical (property unsafe, harassment, medical) — distinct SLA from billing
4. `processes/support-sla.md` — response time commitments + tier differentiation
5. `faqs/account-security-faq.md` — password reset, 2FA, account recovery, session issues

## Acceptance criteria
- [ ] All 5 docs follow schema from A1
- [ ] Emergency-safety escalation explicitly routes outside normal dispute queue
- [ ] Account-security-faq is user-facing and non-legal

Depends on: A1
Parent: #395
EOF
)"

create_issue \
  "B5: Legal-blocked public policy docs (6 drafts pending lawyer review)" \
  "docs,pre-launch,blocked,legal-compliance,needs-decision" \
  "$(cat <<'EOF'
## Goal
Draft 6 public-facing policy docs. All drafts completed and held with `status: 'draft'` + `legal_review_required: true` pending lawyer consult.

## Docs
1. `policies/privacy-policy.md` — legal requirement (CCPA/GDPR handling)
2. `policies/booking-terms.md` — public T&Cs for bookings
3. `policies/payment-policy.md` — fees, processing, billing terms
4. `policies/trust-safety-policy.md` — marketplace non-discrimination, harassment, prohibited behavior
5. `policies/insurance-liability-policy.md` — property damage liability, security deposits, trip insurance
6. `policies/subscription-terms.md` — tier cancellation/upgrade/downgrade/proration (separate from booking T&Cs)

## Acceptance criteria
- [ ] All 6 drafts in `docs/support/policies/` with `status: 'draft'`, `reviewed_by: null`, `reviewed_date: null`
- [ ] Drafts are production-quality; only lawyer sign-off gates publish
- [ ] Not surfaced to users in UI until `reviewed_date` set and `status: 'active'`

## Blocker
Blocked by legal consult — see #80

Depends on: A1, #80
Parent: #395
EOF
)"

# ============================================================================
# TRACK C — RAVIO support extension (5)
# ============================================================================

create_issue \
  "C1: Add context:'support' branch to text-chat edge function" \
  "platform,edge-function,pre-launch" \
  "$(cat <<'EOF'
## Goal
Extend `supabase/functions/text-chat/index.ts` to handle a `'support'` context with dedicated system prompt, auth enforcement, and tool-use schema.

## Acceptance criteria
- [ ] Accept `context: 'support'` in request payload
- [ ] Support context requires authenticated user (return 401 otherwise)
- [ ] Tool-use definitions declared (implementations in C4)
- [ ] Support system prompt: grounded in `support_docs` table, empathetic tone, explicit escalation rules
- [ ] Existing contexts (discovery, property-detail, bidding, general) untouched
- [ ] SSE streaming preserved

Depends on: A3
Parent: #395
EOF
)"

create_issue \
  "C2: Route-based context detection in useTextChat" \
  "experience,pre-launch" \
  "$(cat <<'EOF'
## Goal
Auto-switch RAVIO to support context on account/booking/dashboard pages; discovery elsewhere. No explicit toggle UI.

## Acceptance criteria
- [ ] `useTextChat` detects current route via `useLocation`
- [ ] Support contexts: `/my-trips`, `/my-bookings`, `/account`, `/owner-dashboard`, `/settings/*`, `/disputes/*`
- [ ] Discovery contexts: `/rentals`, `/property/*`, `/tools/*`, `/destinations/*`
- [ ] General fallback: `/`, `/help`, `/about`, ambiguous routes
- [ ] Suggested prompts in `TextChatPanel` swap per detected context
- [ ] Per memory: [Rooted in Simplicity] — anticipate user flow, surface most-relevant-first

Depends on: C1
Parent: #395
EOF
)"

create_issue \
  "C3: Intent classifier fallback + 'Switched to Support' chip" \
  "experience,pre-launch" \
  "$(cat <<'EOF'
## Goal
When user opens RAVIO on ambiguous routes (home, help), classify intent from the first message. Show a subtle chip when the classifier switches lanes, with an escape hatch.

## Acceptance criteria
- [ ] Lightweight intent classifier in edge fn — keyword heuristics first, small model fallback
- [ ] Returns `classified_context` in first streamed event
- [ ] Frontend renders chip: "Switched to Support — [back to Discovery]" when classified context differs from route-inferred context
- [ ] Chip click reverts + persists user override for the session
- [ ] Classification + user reverts logged for future tuning

Depends on: C1, C2
Parent: #395
EOF
)"

create_issue \
  "C4: Agent tool use — 5 function calls" \
  "platform,edge-function,pre-launch" \
  "$(cat <<'EOF'
## Goal
Implement the function-calling tools the support agent invokes.

## Tools
1. `lookup_booking(booking_id | email)` — returns booking + listing + payment state (auth-scoped)
2. `check_refund_status(booking_id)` — cancellation_request + Stripe refund state
3. `check_dispute_status(booking_id)` — dispute record state
4. `open_dispute(booking_id, category, description)` — creates dispute row, returns id
5. `query_support_docs(query, doc_type?)` — keyword + (if available) vector lookup in `support_docs`

## Acceptance criteria
- [ ] Each tool enforces RLS / auth context of calling user
- [ ] Each tool has unit tests (happy path + auth failure)
- [ ] Tool errors returned as structured JSON the agent can reason about
- [ ] Agent does not receive or echo sensitive fields (full card numbers, etc)

Depends on: A3, C1
Parent: #395
EOF
)"

create_issue \
  "C5: Agent-opened disputes flow to AdminDisputes (source tagging)" \
  "platform,pre-launch" \
  "$(cat <<'EOF'
## Goal
Disputes opened via `open_dispute` tool use appear in `AdminDisputes` tagged `source: 'ravio_support'` so admins can distinguish from manually-filed disputes.

## Acceptance criteria
- [ ] `disputes` table migration: add `source` enum column (`user_filed`, `ravio_support`) — default `user_filed`
- [ ] `AdminDisputes` UI shows source badge on dispute row
- [ ] Existing manual filing flow unchanged (defaults to `user_filed`)
- [ ] `ReportIssueDialog` continues to work as today

Depends on: C4
Parent: #395
EOF
)"

# ============================================================================
# TRACK D — Observability (2)
# ============================================================================

create_issue \
  "D1: Support conversation logging (extend conversations table)" \
  "platform,post-launch" \
  "$(cat <<'EOF'
## Goal
Persist RAVIO support conversations for audit, escalation handoff, and metrics. Target: pre-launch if time; can slip.

## Acceptance criteria
- [ ] `conversations` table migration: add `channel` enum (`booking_message`, `listing_inquiry`, `ravio_support`)
- [ ] Each support turn stored as a message row
- [ ] Agent tool calls + tool results logged alongside user/assistant messages
- [ ] RLS: user sees own conversations; admin sees all

Parent: #395
EOF
)"

create_issue \
  "D2: Admin 'Support Interactions' tab + metrics" \
  "platform,post-launch" \
  "$(cat <<'EOF'
## Goal
Admin observability into agent performance. Target: pre-launch if time; can slip.

## Acceptance criteria
- [ ] New `AdminDashboard` tab: "Support Interactions"
- [ ] Transcripts list — filterable by user, date, escalated?
- [ ] Metrics card: deflection % (resolved without escalation), escalation rate, median response time
- [ ] Thumb up/down signal collected per conversation (optional button in RAVIO UI)

Depends on: D1
Parent: #395
EOF
)"

# ============================================================================
# TRACK E — Architecture diagrams (6)
# ============================================================================

create_issue \
  "E1: Architecture diagram — system-architecture.md (Mermaid)" \
  "docs,pre-launch" \
  "$(cat <<'EOF'
## Goal
Full-stack architecture diagram for RAVIO Support — internal technical reference.

## Acceptance criteria
- [ ] `docs/support/diagrams/system-architecture.md` with Mermaid flowchart
- [ ] Shows: user → RAVIO UI → `useTextChat` → `text-chat` edge fn → intent classifier → tool use → {Supabase tables, `support_docs`, `AdminDisputes`}
- [ ] Brief narrative paragraph per major component

Parent: #395
EOF
)"

create_issue \
  "E2: Sequence diagram — discovery query" \
  "docs,pre-launch" \
  "$(cat <<'EOF'
## Goal
Mermaid sequence diagram for a discovery query (e.g., 'ski resort March').

## Acceptance criteria
- [ ] `docs/support/diagrams/sequence-discovery-query.md`
- [ ] Actors: user → RAVIO UI → text-chat edge fn → property search → listings table
- [ ] Shows SSE streaming + search result card rendering
- [ ] Confirms voice remains discovery-only (VAPI path shown as parallel)

Parent: #395
EOF
)"

create_issue \
  "E3: Sequence diagram — support query with tool use" \
  "docs,pre-launch" \
  "$(cat <<'EOF'
## Goal
Mermaid sequence diagram for a support query ('why was I charged $50?').

## Acceptance criteria
- [ ] `docs/support/diagrams/sequence-support-query.md`
- [ ] Actors: user → RAVIO → text-chat edge fn → tools (lookup_booking, query_support_docs) → response
- [ ] Shows auth requirement + tool-use round trip + streamed response

Parent: #395
EOF
)"

create_issue \
  "E4: Sequence diagram — escalation to AdminDisputes" \
  "docs,pre-launch" \
  "$(cat <<'EOF'
## Goal
Mermaid sequence diagram for escalation from agent to human support.

## Acceptance criteria
- [ ] `docs/support/diagrams/sequence-escalation.md`
- [ ] Actors: user → RAVIO → open_dispute tool → disputes table → AdminDisputes → admin notification
- [ ] Shows agent decision criteria for when to escalate vs self-serve

Parent: #395
EOF
)"

create_issue \
  "E5: Diagram — doc sync pipeline" \
  "docs,pre-launch" \
  "$(cat <<'EOF'
## Goal
Diagram the markdown → DB sync pipeline, establishing that git is source of truth and DB is a cache.

## Acceptance criteria
- [ ] `docs/support/diagrams/doc-pipeline.md`
- [ ] Mermaid flowchart: author edits `.md` → PR merge → GH Action → `ingest-support-docs` → `support_docs` table → agent retrieval
- [ ] Narrative explaining: 'git is source of truth, DB is cache'

Parent: #395
EOF
)"

create_issue \
  "E6: CS-OVERVIEW.md — VC-ready capability one-pager" \
  "docs,pre-launch" \
  "$(cat <<'EOF'
## Goal
External-facing one-pager: RAVIO Support capabilities, tech stack at executive level, metrics framework, roadmap. Designed to copy into a pitch deck.

## Acceptance criteria
- [ ] `docs/support/CS-OVERVIEW.md`
- [ ] Capability map diagram — what the agent CAN vs CANNOT do
- [ ] Simplified 3-layer architecture (UI / agent / data) — no internal jargon
- [ ] Metrics framework (deflection rate, escalation rate, SLA) with placeholder pre-launch values
- [ ] Roadmap: v1 (pre-launch) → v2 (post-launch: multilingual, voice-support if validated, proactive outreach)
- [ ] Polished for external share

Parent: #395
EOF
)"

echo ""
echo "Done. Verify with: gh issue list --repo $REPO --milestone \"$MILESTONE\""
