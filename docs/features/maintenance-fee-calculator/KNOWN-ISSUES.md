---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Maintenance Fee Calculator — Known Issues & Constraints

**Status:** Pre-implementation — issues are anticipated, not yet confirmed  
**Feature:** Phase 16 — Maintenance Fee Calculator  
**Last Updated:** February 21, 2026

---

## Anticipated Issues

### Income Estimates Are Approximate (MEDIUM — by design)

**Issue:** Weekly income figures are based on market research averages, not
live RAV data. A Maui HGV 2BR estimate of $2,800/week will vary significantly
by specific resort, season, and current demand.  
**Impact:** Owners may have slightly inflated or deflated expectations.  
**Mitigation:** Clear disclaimer on the page: "Estimates based on comparable
RAV listings and market data. Actual earnings vary by resort, season, and demand."  
**Status:** 🟢 By Design — acceptable for a calculator tool

---

### Social Proof Count — RLS May Block Unauthenticated Query (MEDIUM)

**Issue:** The social proof element ("Join X owners on RAV") requires counting
`property_owner` roles without authentication. Supabase RLS may block this.  
**Impact:** Count won't display; fallback text shows instead.  
**Mitigation:** Two options for agent to try in order:
1. Add a public RLS policy on `user_roles` allowing unauthenticated count
2. Create a Supabase Edge Function that returns the count (avoids RLS issue)
3. If both fail: use fallback text "Join hundreds of owners already earning on RAV"  
**Status:** 🟡 Investigate during Session 1

---

### No "Other Resort" Manual Entry (LOW)

**Issue:** The "Other / Independent Resort" brand uses generic income estimates
that may not reflect the owner's actual resort.  
**Impact:** Less accurate estimate for owners outside the 8 main brands.  
**Mitigation:** Income estimate is clearly labeled as approximate. Future
improvement: ask for state/region to improve the estimate.  
**Status:** 🟢 Acceptable for launch

---

### SEO Indexing Delay (LOW — expected)

**Issue:** New public page won't appear in Google search results immediately
after deployment.  
**Impact:** Lead generation benefit takes weeks to materialize.  
**Mitigation:** Submit URL to Google Search Console after deployment. Add
internal links from homepage and relevant blog content.  
**Status:** 🟢 Expected behavior — not a bug

---

## Post-Implementation Issues

*This section will be filled by the agent after Session 1.*

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| | | | |

---

## Resolution Priority Order

1. Any issue blocking `npm run build`
2. CTA button not linking correctly
3. Calculation producing wrong numbers
4. Social proof query failing (use fallback)
5. Mobile layout issues
