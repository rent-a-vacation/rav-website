---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Maintenance Fee Calculator

**Phase:** 16  
**Status:** ✅ Completed (Session 16), rebranded RAV SmartEarn (Session 39)
**Route:** `/tools/smart-earn` (redirected from `/calculator`)
**Migration:** None — frontend only
**Key artifacts:** `calculatorLogic.ts`, 9 brands, OwnershipForm / BreakevenResults / BreakevenBar / CalculatorCTA components
**Note:** Yield Estimator merged into SmartEarn as a toggle (Session 39). `YieldEstimator.tsx` deleted; `/tools/yield-estimator` redirects to `/calculator`.

---

## What This Feature Does

A free, public-facing web tool that timeshare owners find via Google Search.
They enter their resort brand, unit type, and annual maintenance fees — the
calculator shows exactly how many rental weeks they need to break even and
what they could earn listing on RAV.

Primary purpose: **SEO lead generation.** Owners find it on Google, see their
earnings potential, click "Create Free Owner Account."

---

## Files in This Folder

```
docs/features/maintenance-fee-calculator/
├── README.md                    # This file — start here
├── 00-PROJECT-BRIEF.md          # Full spec: flow, income estimates, design, SEO
├── 01-SESSION1-TASK.md          # Agent task: build everything in one session
├── handoffs/                    # Empty — agent fills after session
└── KNOWN-ISSUES.md              # Pre-populated with known constraints
```

---

## Quick Start for Agent

1. Read `00-PROJECT-BRIEF.md` fully
2. Run `01-SESSION1-TASK.md`
3. Save output to `handoffs/session1-handoff.md`

---

## Implementation Order

Independent of all other features. Can run in parallel with Phase 15.

```
Phase 15: Fair Value Score   ← independent
Phase 16: Calculator         ← independent, can run in parallel
Phase 17: Owner Dashboard    ← after Phase 15
Phase 18: Wishlist Matching  ← last
```

---

## Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Auth required | No — fully public | Top-of-funnel tool, must work before signup |
| Income estimates | Static lookup table | Sufficient accuracy, no API cost |
| Calculation | Pure frontend, live update | No submit button, instant feedback |
| Social proof count | Supabase unauthenticated query | Real number builds trust |
| Migration | None | Pure frontend, no DB changes |

---

## Income Estimates Reference

Built-in lookup table — 9 brands × 4 unit types = 36 data points.
All figures based on comparable RAV listings and published market research.
Disclaimer shown on page: estimates vary by resort, season, and demand.

---

## SEO Target Keywords

- "timeshare maintenance fee calculator"
- "how to rent my timeshare week"
- "can I rent my Hilton Grand Vacations week"
- "timeshare rental income calculator"

---

## Success Criteria

- [ ] `/calculator` loads without auth
- [ ] All 9 brands in dropdown
- [ ] Results update live as user types (no submit button)
- [ ] Progress bars color correctly (red/amber/green)
- [ ] CTA links to `/auth?mode=signup&role=property_owner`
- [ ] SEO meta tags set
- [ ] Mobile responsive
- [ ] Footer link added
- [ ] 8+ new tests passing
- [ ] `npm run build` passes

---

**Last Updated:** February 21, 2026
