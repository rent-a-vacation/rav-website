---
name: sdlc
description: Full SDLC workflow — priority review, issue pickup, brand check, implementation, testing, deployment, and issue updates
argument-hint: "[issue-number or 'status']"
allowed-tools: Bash(git *) Bash(npm run test) Bash(npm run build) Bash(npm run test:p0) Bash(gh *)
---

# RAV SDLC Workflow

> Structured development lifecycle for Rent-A-Vacation. Invoke with `/sdlc` for full workflow, `/sdlc status` for project status, or `/sdlc 326` to work on a specific issue.

## If invoked with `status` or no arguments: Project Status Review

Run this at the start of every session:

1. **Read the priority roadmap:**
   ```
   Read docs/PRIORITY-ROADMAP.md
   ```

2. **Check open issues:**
   ```bash
   gh issue list --repo rent-a-vacation/rav-website --state open --limit 50
   ```

3. **Check what changed since last session:**
   ```bash
   git log --oneline -10
   ```

4. **Check current test/build health:**
   ```bash
   npm run test:p0
   ```

5. **Report to the user:**
   - Current Tier A items (what to build next)
   - Any new issues since last session
   - Any blockers or items that need decisions
   - Recommend the next item to work on

## If invoked with an issue number: Full Development Cycle

### Phase 1: Requirements & Context (DO FIRST)

1. **Read the issue:**
   ```bash
   gh issue view $0 --repo rent-a-vacation/rav-website
   ```

2. **Read the priority roadmap for context:**
   ```
   Read docs/PRIORITY-ROADMAP.md
   ```

3. **Read architectural context:**
   ```
   Read docs/PROJECT-HUB.md (KEY DECISIONS LOG section)
   ```

4. **Brand check — MANDATORY before any UI work:**
   ```
   Read docs/brand-assets/BRAND-LOCK.md (Sections 8 and 9)
   ```
   Verify: all user-facing text uses the correct branded terms per the Terminology Context Map.

5. **Check if related issues exist:**
   ```bash
   gh issue list --repo rent-a-vacation/rav-website --state open --search "<keywords>"
   ```

6. **Enter plan mode** for non-trivial work (3+ files or architectural decisions).

### Phase 2: Design & Planning

1. **Explore affected code** — use Explore agent for broad searches
2. **Identify all files that need changes** — list them explicitly
3. **Check for required artifacts** (per CLAUDE.md):
   - New route? Update flow manifest in `src/flows/`
   - New table? Update seed manager
   - New edge function? Plan Supabase deployment
   - Financial logic? Plan edge-case test coverage
4. **Present plan to user** — get approval before writing code

### Phase 3: Implementation

1. **Follow existing patterns** — read similar code first
2. **Write tests alongside code** (Tests-With-Features Policy)
3. **Brand compliance** — check every user-facing string against BRAND-LOCK.md Section 9
4. **Minimal impact** — only touch what's necessary
5. **Run type check periodically:** `npx tsc --noEmit`

### Phase 4: Testing & Verification

1. **Run full test suite:**
   ```bash
   npm run test
   ```
2. **Run P0 critical path tests:**
   ```bash
   npm run test:p0
   ```
3. **Run build:**
   ```bash
   npm run build
   ```
4. **Verify test count increased** if new logic was added
5. **Check for regressions** in related features

### Phase 5: Commit & Deploy

1. **Commit with conventional format:**
   ```
   type(scope): description
   ```
2. **Push to dev:**
   ```bash
   git push origin dev
   ```
3. **Create PR dev → main:**
   ```bash
   gh pr create --repo rent-a-vacation/rav-website --base main --head dev
   ```
4. **Merge after CI passes:**
   ```bash
   gh pr merge <number> --repo rent-a-vacation/rav-website --merge
   ```

### Phase 6: Issue & Documentation Updates

1. **Close the issue with business-language summary:**
   ```bash
   gh issue close $0 --repo rent-a-vacation/rav-website --comment "Completed: [what the user/owner/renter gains]

   Technical: [migration details, test counts, deployment notes]"
   ```

2. **Update PRIORITY-ROADMAP.md:**
   - Remove completed item from its tier
   - Add revision history entry with date + session + what changed

3. **Update PROJECT-HUB.md** if architectural decisions were made

4. **Create follow-up issues** for anything discovered during implementation:
   ```bash
   gh issue create --repo rent-a-vacation/rav-website --title "..." --label "..." --body "..."
   ```

5. **Update memory** if anything session-persistent was learned

---

## Quick Reference

| Need | Command |
|------|---------|
| Open issues | `gh issue list --repo rent-a-vacation/rav-website --state open` |
| Issue detail | `gh issue view <N> --repo rent-a-vacation/rav-website` |
| Run tests | `npm run test` |
| P0 tests | `npm run test:p0` |
| Build | `npm run build` |
| Brand terms | `Read docs/brand-assets/BRAND-LOCK.md` (Sections 8-9) |
| Priorities | `Read docs/PRIORITY-ROADMAP.md` |
| Architecture | `Read docs/PROJECT-HUB.md` |
| Completed work | `Read docs/COMPLETED-PHASES.md` |
| Test strategy | `Read docs/testing/TEST-STRATEGY.md` |
