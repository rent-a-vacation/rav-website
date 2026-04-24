# CLAUDE.md — Rent-A-Vacation AI Agent Instructions

> This file is automatically loaded by Claude Code at session start.  
> It defines mandatory conventions for maintaining code quality and documentation.

---

## Project Management — GitHub Issues & Milestones (MANDATORY)

### Source of Truth (in priority order)
1. **GitHub Issues & Milestones** — what to work on, current status, backlog
2. **docs/PROJECT-HUB.md** — architectural decisions, session context, agent instructions
3. **docs/COMPLETED-PHASES.md** — detailed technical record of completed work

### At the START of every session
1. List open issues in the current milestone:
   ```bash
   gh issue list --repo rent-a-vacation/rav-website --state open --label "pre-launch"
   ```
2. Read `docs/PROJECT-HUB.md` for architectural context and decisions
3. For the full mental model of everything built (product + platform + tooling + governance), read `docs/PLATFORM-INVENTORY.md`
3. Confirm with the user which issue to work on before starting any code

### At the END of every session — MANDATORY DOCUMENTATION CHECKLIST

After every merged PR, walk through this checklist. **No session ends with stale docs.** These checks apply whether the session started with `/sdlc`, a plain feature request, a bug fix, or anything else. `/sdlc status` in future sessions reads these files — if they lie, the next session starts with a distorted picture.

1. **Close completed issues with a business-language summary:**
   ```bash
   gh issue close <number> --repo rent-a-vacation/rav-website --comment "Completed: [Business-language summary — what the user/owner/renter gains]

   Technical: [migration details, test counts, deployment notes]"
   ```
   > **Important:** The daily status report auto-extracts the `Completed:` line for the Key Deliverables section. Plain business language only. The `Technical:` line is optional.

2. **`docs/PRIORITY-ROADMAP.md`** — ALWAYS
   - Remove completed items from their tier (or mark ✅ Done)
   - Add revision-history entry (date + session + what changed)
   - Add new follow-up issues to the appropriate tier (or note as "needs tier assignment")

3. **`docs/PROJECT-HUB.md`** — ALWAYS
   - Extend current Session handoff entry (or start a new one)
   - Update "Platform Status" block (test count, migrations, edge functions, dev/main sync)
   - Add DEC-### entry in Key Decisions Log if any architectural decision was made

4. **`docs/testing/TESTING-STATUS.md`** — if tests were added/removed
   - Update total test count, test-file count, run times
   - Update QA manual-scenarios row if scenarios were added/updated

5. **`docs/LAUNCH-READINESS.md`** — if pre-launch checks or blocked items changed
   - Update checklist rows + blockers table
   - Add new rows for env flags, infra gates, or deploy requirements introduced

6. **`docs/ARCHITECTURE.md`** + **flow manifests (`src/flows/`)** — if routes, components, tables, or edge functions changed
   - Update the relevant flow manifest (owner-lifecycle / traveler-lifecycle / admin-lifecycle)
   - `/architecture` page auto-regenerates from manifests — no manual Mermaid edits
   - Update ARCHITECTURE.md narrative if a new cross-cutting concern was introduced

7. **`src/pages/UserGuide.tsx`** + **FAQ** — if user-facing behavior changed
   - Traveler-facing changes → `renterSections` + FAQ
   - Owner-facing changes → `ownerSections` + FAQ
   - Admin-facing changes → admin section
   - New workflow → add FAQ entry

8. **`docs/testing/QA-PLAYBOOK.md`** + **QA Scenario Spreadsheet** — if user workflow changed
   - If a flow differs per state/track, add scenario variants (e.g., S-##a, S-##b)
   - Rename terminology in scenario steps to match latest UI labels
   - Scenario spreadsheet lives in Google Drive — scenario numbers stay stable, content updates

9. **`docs/brand-assets/BRAND-LOCK.md`** — if terminology or brand language changed
   - Update the Terminology Context Map (Section 9)
   - Add new DEC-### if it supersedes prior terminology lock

10. **`docs/COMPLETED-PHASES.md`** — only at session close, for sessions aging out of PROJECT-HUB
    - Move session-handoff entries older than ~5 sessions from PROJECT-HUB to this archive
    - Keep PROJECT-HUB Session Handoff section lean (current + last 5 sessions)

11. **Create follow-up issues** for anything discovered during implementation:
    ```bash
    gh issue create --repo rent-a-vacation/rav-website --title "..." --label "..." --milestone "Launch Readiness" --body "..."
    ```

12. **Update auto-memory** if session-persistent knowledge was learned (see `auto memory` in system prompt — feedback / project / user / reference memory types)

13. **Do NOT update PROJECT-HUB.md priority queue** — GitHub Issues is now the source for priorities.

### Before calling a session done, ask yourself:
- [ ] Does `/sdlc status` (reads live docs) give an accurate picture?
- [ ] Would a new collaborator reading PROJECT-HUB understand today's changes?
- [ ] Do the testing docs claim the right test count + scenario state?
- [ ] Did I change any user-facing behavior without telling USER-GUIDE + FAQ?
- [ ] Did I introduce an env flag, infra gate, or deploy flag without updating LAUNCH-READINESS?
- [ ] Did a route, table, or edge function change without a flow-manifest update?

If the answer to any of these is "no", fix it before closing.

### Automated enforcement (run this before closing the session):

```bash
npm run docs:sync-check
```

This runs `scripts/docs-sync-check.ts` and programmatically verifies that the four docs `/sdlc status` depends on are current:

- `docs/PROJECT-HUB.md` — Session Handoff header matches latest session in git
- `docs/PRIORITY-ROADMAP.md` — "as of Session NN" header is within 1 session of git
- `docs/testing/TESTING-STATUS.md` — claimed test count matches `test-results/junit.xml` within ±5%
- `docs/LAUNCH-READINESS.md` — `change_type` frontmatter is within 3 sessions of git

The same check runs in CI on every PR via `.github/workflows/docs-audit.yml` — PRs with stale docs fail the check and get a comment showing which files need updating. If the CI check fails, update the flagged files, then re-push.

**This is the safety net for the self-discipline checklist above.** The checklist tells you what to update; `docs:sync-check` tells you if you actually did it.

### Issue lifecycle
- **New idea** → create issue with `idea` label, no milestone (Backlog)
- **Ready to work** → add milestone, move to `Ready`
- **In progress** → add `in-progress` label
- **Done** → close issue with summary comment

### Creating issues during a session
```bash
# Bug discovered
gh issue create --repo rent-a-vacation/rav-website \
  --title "Bug: [description]" \
  --label "bug,platform" \
  --body "[What's broken, steps to reproduce, expected vs actual]"

# Enhancement identified
gh issue create --repo rent-a-vacation/rav-website \
  --title "[Feature name]" \
  --label "enhancement,pre-launch,marketplace" \
  --milestone "Phase 20: Accounting & Tax" \
  --body "[What needs to be built and why]"
```

### What stays in PROJECT-HUB.md
- KEY DECISIONS LOG (DEC-XXX entries)
- Architecture notes and technical decisions
- Session handoff context
- Link to GitHub Project board: https://github.com/orgs/rent-a-vacation/projects/

### What is now tracked in GitHub Issues
- Everything previously in PRIORITY QUEUE
- Everything previously in IDEAS BACKLOG
- Bug tracking
- Phase sub-tasks

### Labels reference
| Label | Use for |
|-------|---------|
| `bug` | Something broken |
| `enhancement` | New feature or improvement |
| `idea` | Unvalidated concept |
| `docs` | Documentation only |
| `refactor` | Code quality, no behavior change |
| `marketplace` | Bidding, listings, booking engine |
| `platform` | Auth, payments, infra, admin |
| `experience` | UI, voice, mobile, discovery |
| `pre-launch` | Required before public launch |
| `post-launch` | Can wait until after launch |
| `blocked` | Waiting on something |
| `needs-decision` | Requires human decision before proceeding |

---

## Content Accuracy (MANDATORY)

All content in the codebase must reflect verified, accurate data. Never use placeholder or estimated figures.

### Verified facts (do not change without confirmation)
- **Commission rate:** 15% (not 10%)
- **Resort count:** 117 (Hilton 62, Marriott 40, Disney 15)
- **Voice quota:** Tier-based — Free: 5/day, Plus/Pro: 25/day, Premium/Business: unlimited (not flat 10/day)
- **App version:** v0.9.0 (visible in footer)

### Before updating any statistic or business metric
1. Check `docs/PROJECT-HUB.md` KEY DECISIONS LOG
2. Check `docs/COMPLETED-PHASES.md` for when it was last verified
3. If uncertain, flag with `needs-decision` label and ask the user

---

## Flow Manifest Convention (MANDATORY)

The application uses declarative **Flow Manifests** in `src/flows/` to auto-generate interactive architecture diagrams at `/architecture`. This keeps system documentation synchronized with code without manual Mermaid authoring.

### When to update manifests

You MUST update the relevant manifest in `src/flows/` when:

1. **Adding a new route** in `App.tsx` → Add a step to the appropriate lifecycle manifest
2. **Adding a new page/component** that represents a user-facing workflow step
3. **Adding conditional business logic** (status checks, approval gates) → Add `branches` to the relevant step
4. **Adding a new edge function** → Add it to the `edgeFunctions` array on the relevant step
5. **Adding/modifying database tables** → Update the `tables` array on affected steps

### Manifest structure

Flow manifests live in `src/flows/` with this structure:

```
src/flows/
├── types.ts              # FlowDefinition, FlowStep, FlowBranch types + flowToMermaid()
├── owner-lifecycle.ts    # Property Owner Journey (signup → payout)
├── traveler-lifecycle.ts # Traveler Journey (browse → check-in)
├── admin-lifecycle.ts    # RAV Admin Operations (approvals → financials)
└── index.ts              # Re-exports all flows + allFlows array
```

### Adding a step — example

When adding a new "Verification" step to the owner lifecycle:

```typescript
// In src/flows/owner-lifecycle.ts, add to the steps array:
{
  id: 'new_step_id',
  route: '/the-route',
  label: 'Human-Readable Label',
  component: 'ComponentName',
  tab: 'optional-tab',
  roles: ['property_owner'],
  description: 'What this step does',
  tables: ['affected_tables'],
  edgeFunctions: ['edge-function-name'],
  branches: [
    { condition: 'If approved', targetStepId: 'next_step_id', label: 'Approved' },
    { condition: 'If rejected', targetStepId: 'previous_step_id', label: 'Rejected', edgeStyle: 'dashed' },
  ],
}
```

### Adding a new flow

If creating an entirely new user journey:

1. Create `src/flows/new-flow-name.ts` exporting a `FlowDefinition`
2. Add it to `src/flows/index.ts` in the `allFlows` array
3. The `/architecture` page auto-renders it — no other changes needed

### Schema reference

See `src/flows/types.ts` for the complete TypeScript interfaces:
- `FlowDefinition` — a complete user journey
- `FlowStep` — a single step with route, component, tables, branches
- `FlowBranch` — a conditional edge between steps

### What NOT to do

- ❌ Do NOT hand-author Mermaid strings — the `flowToMermaid()` function generates them
- ❌ Do NOT modify `/architecture` page for content — it reads from manifests
- ❌ Do NOT skip manifest updates when adding routes — the diagram will have orphan gaps

---

## Git Branching & Deployment (MANDATORY)

### Branch Strategy: `dev` → `main`

```
feature/* (optional)
    ↓ PR
  dev   →  Vercel Preview Deploy  →  Supabase DEV
    ↓ PR (release)
  main  →  Vercel Production      →  Supabase PROD
```

### Rules

- **`dev`** is the working branch. All new code goes here first.
- **`main`** is the production branch. Protected — requires PR + 1 review + CI passing.
- **Never push directly to `main`**. Always create a PR from `dev` (or a feature branch).
- Feature branches are optional for small changes but recommended for larger work.
- Local `.env.local` points to **Supabase DEV**.
- Vercel production points to **Supabase PROD**.

### Workflow

1. Work locally on `dev` (or a feature branch off `dev`)
2. Push to `dev` → Vercel creates a preview deploy → test against Supabase DEV
3. When ready for production: create PR `dev` → `main`
4. PR requires: CI passing + 1 approval
5. Merge to `main` → auto-deploys to production

### Commit message format

```
type(scope): description

feat(auth): add user approval system
fix(voice): correct quota display for tier-based limits
docs(hub): update PROJECT-HUB after session 17
test(booking): add payment flow integration tests
chore(deps): update supabase client to v2.x
```

---

## Testing (MANDATORY)

### Tests-With-Features Policy

**Every feature or bug fix MUST include corresponding tests.** This is non-negotiable.

When building a new feature or fixing a bug, you MUST:

1. **Write tests alongside the code** — not as a separate follow-up task
2. **At minimum, test:**
   - Any new function in `src/lib/` (pure unit tests — highest ROI)
   - Any new hook in `src/hooks/` (mock Supabase, test logic branches)
   - Any new context method (extend existing context tests)
   - Any new edge function's corresponding frontend integration (mutation hooks)
3. **What to cover:**
   - Happy path + at least one error case
   - Edge cases for financial calculations (pricing, fees, commissions, refunds)
   - Conditional logic branches (role checks, status checks, date comparisons)
4. **Before committing, verify** the test count has increased if new logic was added

### Pre-commit checklist

```
✅ New functions in src/lib/ have unit tests?
✅ New hooks have integration tests?
✅ New context methods have test cases in the context test file?
✅ Financial calculations have edge-case coverage?
✅ npm run test passes?
✅ npm run build passes?
```

### Rules for every code change

1. **Run tests before committing:**
   ```bash
   npm run test
   npm run build
   ```
2. **Never commit if tests fail** — fix tests first, or explicitly discuss with user
3. **Add tests for new business logic** — especially anything in `src/lib/`

### Test file locations

```
src/lib/*.test.ts              # Unit tests for pure functions
src/hooks/*.test.ts            # Integration tests for hooks
src/hooks/**/__tests__/*.ts    # Integration tests for nested hooks
src/contexts/*.test.tsx        # Integration tests for contexts
e2e/smoke/                     # Playwright E2E smoke tests
e2e/visual/                    # Percy visual regression tests
```

### Test helpers

```
src/test/fixtures/users.ts        # mockUser(), mockSession(), mockProfile(), mockAuthContext()
src/test/fixtures/listings.ts     # Listing fixtures
src/test/fixtures/memberships.ts  # Membership tier fixtures
src/test/helpers/render.tsx       # createHookWrapper(), renderWithProviders()
src/test/helpers/supabase-mock.ts # createSupabaseMock(), emptyResponse(), errorResponse()
```

### Running tests

```bash
npm run test              # Vitest unit + integration (watch mode)
npm run test:coverage     # With coverage report
npm run test:e2e          # Playwright E2E
npm run test:e2e:headed   # Playwright with browser visible
```

### Coverage thresholds (enforced in CI)
- Statements: 25%
- Branches: 25%
- Functions: 30%
- Lines: 25%

---

## Repository Information

- **GitHub:** https://github.com/rent-a-vacation/rav-website
- **Production:** https://rent-a-vacation.com
- **Vercel:** https://rentavacation.vercel.app
- **Supabase PROD:** xzfllqndrlmhclqfybew
- **Supabase DEV:** oukbxqnlxnkainnligfz

---

## Environment & Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Edge Functions + Auth)
- **Payments:** Stripe
- **Voice:** VAPI (Deepgram STT + GPT-4o-mini + ElevenLabs TTS)
- **Deployment:** Vercel (auto-deploy on push to main)
- **Testing:** Vitest + Playwright + Percy + Qase

---

## Key Architectural Decisions

> Full decisions log: `docs/PROJECT-HUB.md` → KEY DECISIONS LOG  
> Archived decisions: `docs/DECISIONS.md`

Key active decisions agents must respect:
- **DEC-011:** Native mobile via Capacitor (not React Native) — after PWA validates demand
- **DEC-014:** Executive Dashboard is `/executive-dashboard` standalone page, not an admin tab
- **DEC-015:** Seed data system is DEV-only, production-guarded
- **DEC-020:** Text Chat Agent supersedes Phase 10 Track D AI Support Agent
- **Voice quota:** Tier-based (not flat) — Free 5/day, Plus/Pro 25/day, Premium/Business unlimited

---

## Documentation Audit Convention (MANDATORY)

### Frontmatter requirement

Every `docs/**/*.md` file MUST have YAML frontmatter at the top:

```yaml
---
last_updated: "2026-03-13T14:30:00"
change_ref: "abc1234"
change_type: "session-40"
status: "active"
---
```

| Field | Description | Auto? |
|-------|-------------|-------|
| `last_updated` | ISO 8601 datetime | Yes — pre-commit hook |
| `change_ref` | Short commit SHA | Yes — pre-commit hook |
| `change_type` | Context: session number, PR#, or description | Manual — defaults to `"manual-edit"` |
| `status` | `active` / `archived` / `draft` | Manual — set once |

### When modifying docs

1. **Set `change_type`** to something meaningful (e.g., `"session-40"`, `"PR #215"`)
2. The pre-commit hook auto-stamps `last_updated` and `change_ref` — do NOT set these manually
3. New docs get frontmatter auto-injected by the pre-commit hook
4. `archived` docs skip staleness checks in CI

### Source-to-doc mapping

`scripts/source-doc-map.json` maps source code paths to their related docs. When source changes, CI warns if mapped docs weren't updated. Add new mappings when creating feature docs.

### Running the audit

```bash
npm run docs:audit      # Local audit report
npm run docs:audit:ci   # CI mode (exits 1 on errors)
```

---

## Email Template Convention (MANDATORY)

All emails sent by Rent-A-Vacation MUST use the shared branded template:

- **Edge functions:** Import `buildEmailHtml()`, `detailRow()`, `infoBox()` from `../_shared/email-template.ts`
- **Frontend:** Use `wrapEmail()` from `src/lib/email.ts` (mirrored copy — keep in sync with shared template)

### What NOT to do with emails

- ❌ Do NOT write inline HTML email templates in edge functions
- ❌ Do NOT create local `buildEmailHtml` functions — use the shared one
- ❌ Do NOT use non-brand colors (blue `#3b82f6`, purple `#6366f1`) — use teal `#0d6b5c` and coral `#e86a4a`

---

## Seed Manager Convention (MANDATORY)

The seed manager (`supabase/functions/seed-manager/index.ts`) creates test data for DEV. It must stay in sync with the database schema.

### When to update the seed manager

You MUST update the seed manager when:

1. **Adding a migration that creates new tables** → Add sample rows for the new tables
2. **Adding new user-facing features gated by data** → Ensure test users have that data (e.g., varied membership tiers, referral codes, API keys)
3. **Changing table schemas** that affect existing seed data (renamed columns, new required fields)

### What the seed manager must always provide

- **Foundation users** with diverse roles: RAV admin, RAV staff, property owners at different tiers (Free/Pro/Business), renters at different tiers (Free/Plus/Premium)
- **Realistic test data** for every user-facing feature: listings, bookings, bids, reviews, notifications, subscriptions
- **Admin dashboard data** so all admin tabs show meaningful content (MRR metrics, disputes, escrow, voice logs)

### Admin Safeguards Convention (MANDATORY)

All admin actions that modify data MUST have appropriate confirmation dialogs:

| Action Type | Required Safeguard |
|-------------|-------------------|
| **Destructive** (delete, reset, revoke) | AlertDialog with explicit description of impact |
| **Financial** (release escrow, change commission, initiate payout) | AlertDialog showing amounts + recipient |
| **Platform-wide** (staff-only toggle, kill switches) | AlertDialog with "I understand" confirmation |
| **Role/permission changes** | AlertDialog + prevent self-demotion |
| **Tier/subscription overrides** | Dialog with admin notes (required) |

- ❌ Never use bare `window.confirm()` — always use shadcn AlertDialog
- ❌ Never update settings on keystroke (`onChange`) — use Save button or `onBlur`
- ❌ Never allow admins to remove their own `rav_admin` or `rav_owner` role

---

## What NOT to Do

- ❌ Never push directly to `main`
- ❌ Never commit with failing tests
- ❌ Never ship new business logic without corresponding tests (see Tests-With-Features Policy)
- ❌ Never hardcode business metrics without verifying against docs
- ❌ Never update GitHub Issues priority — that's the human's job
- ❌ Never skip updating flow manifests when adding routes
- ❌ Never skip updating seed manager when adding tables (see Seed Manager Convention)
- ❌ Never use placeholder content or fake statistics
- ❌ Never modify production Supabase (xzfllqndrlmhclqfybew) without explicit human confirmation
