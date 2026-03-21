---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Maintenance Fee Calculator — Project Brief

**Feature Name:** Maintenance Fee Calculator  
**Phase:** 16  
**Route:** `/calculator` (public, no auth required)  
**Status:** 🟡 Planning  
**Created:** February 20, 2026  
**Migration:** None — frontend only  
**Docs:** `docs/features/maintenance-fee-calculator/`

---

## Overview

A free, public-facing web tool that timeshare owners can find via Google Search.
They enter their resort brand, unit type, and annual maintenance fees — the tool
shows them exactly how many rental weeks they need to break even and what they
could realistically earn by listing on RAV.

This is a **lead generation and SEO machine**, not a logged-in feature.
No auth required. No database writes. Pure frontend calculation with a strong CTA
at the end driving owners to sign up and list their property.

**URL:** `rent-a-vacation.com/calculator`  
**Target search terms:** "how to rent my timeshare week", "timeshare maintenance fee
calculator", "can I rent my Hilton Grand Vacations week"

---

## The Calculator Flow

### Step 1 — Enter your ownership details
- Vacation club brand (dropdown: HGV, Marriott, Disney, Wyndham, etc.)
- Resort name (text input — free text, not linked to resorts table)
- Unit type (Studio / 1BR / 2BR / 3BR+)
- Annual maintenance fees ($)
- Number of weeks owned per year (1 / 2 / 3+)

### Step 2 — See your break-even analysis
Calculated instantly, no API call needed:

```
Your annual maintenance fees:        $2,800
Estimated RAV rental income per week: $1,850  ← based on brand/location/unit type
RAV platform fee (10%):              -$185
Your net per week:                    $1,665

Weeks needed to break even:          1.7 weeks
                                     ─────────
With 1 week listed:   Cover 59% of your fees
With 2 weeks listed:  Cover 119% — NET PROFIT of $530
With 3 weeks listed:  Cover 179% — NET PROFIT of $2,195
```

### Step 3 — CTA
"List your first week free — no commitment"
→ Sign Up button → `/auth?mode=signup&role=property_owner`

---

## Income Estimates by Brand/Unit

These are built-in lookup tables (no API needed). Based on published market data.

```typescript
const INCOME_ESTIMATES: Record<string, Record<string, number>> = {
  hilton_grand_vacations: {
    studio: 1200, '1br': 1850, '2br': 2800, '3br': 4200
  },
  marriott_vacation_club: {
    studio: 1100, '1br': 1700, '2br': 2600, '3br': 3900
  },
  disney_vacation_club: {
    studio: 1400, '1br': 2100, '2br': 3200, '3br': 4800
  },
  wyndham_destinations: {
    studio: 900, '1br': 1400, '2br': 2100, '3br': 3100
  },
  hyatt_residence_club: {
    studio: 1300, '1br': 1900, '2br': 2900, '3br': 4300
  },
  bluegreen_vacations: {
    studio: 800, '1br': 1250, '2br': 1900, '3br': 2800
  },
  holiday_inn_club: {
    studio: 750, '1br': 1150, '2br': 1750, '3br': 2600
  },
  worldmark: {
    studio: 850, '1br': 1300, '2br': 2000, '3br': 2900
  },
  other: {
    studio: 900, '1br': 1400, '2br': 2100, '3br': 3100
  }
}
```

Add disclaimer: "Estimates based on comparable RAV listings and market data.
Actual earnings vary by resort, season, and demand."

---

## Design

**Style:** Light theme (this is a public page, not the dark dashboard).
Matches the main RAV site design.

**Layout:** Single page, two-column on desktop (inputs left, results right).
Results update live as user types — no submit button needed for calculation.

**Results visualization:**
- Progress bar showing "% of fees covered" for each scenario (1, 2, 3 weeks)
- Color: red (<100%) → amber (close to break-even) → green (profit)
- The "profit" number in emerald green and bold when positive

**Social proof element** below the calculator:
"Join 47 owners already earning on RAV"  ← pull this count live from Supabase
"Average RAV owner covers their maintenance fees in 1.8 weeks"

**SEO meta tags** (add to page):
```html
<title>Timeshare Maintenance Fee Calculator — Rent-A-Vacation</title>
<meta name="description" content="Calculate how many weeks you need to rent 
your timeshare to cover annual maintenance fees. Free tool for Hilton, 
Marriott, Disney, Wyndham owners.">
```

---

## File Structure

```
src/
├── pages/
│   └── MaintenanceFeeCalculator.tsx    # Main page (public route)
├── components/
│   └── calculator/
│       ├── OwnershipForm.tsx           # Step 1 inputs
│       ├── BreakevenResults.tsx        # Step 2 results
│       ├── BreakevenBar.tsx            # Progress bar visualization
│       └── CalculatorCTA.tsx          # Step 3 sign-up prompt
└── lib/
    └── calculatorLogic.ts             # Pure calculation functions + lookup table
```

---

## Implementation Plan — 1 Session

Single agent session. Pure frontend — no migration, no Edge Function.

---

## Success Criteria

- [ ] `/calculator` route accessible without login
- [ ] Linked in main site navigation (footer at minimum, nav if space allows)
- [ ] Brand dropdown shows all 9 RAV vacation club brands
- [ ] Results update live as inputs change (no submit button)
- [ ] Break-even weeks calculation is correct
- [ ] 1/2/3 week scenarios all display correctly
- [ ] Progress bars color correctly (red/amber/green)
- [ ] CTA button links to signup with `role=property_owner` param
- [ ] Social proof owner count pulls from Supabase (unauthenticated query)
- [ ] SEO meta tags set correctly
- [ ] Mobile responsive (owners may find this on phone from Google)
- [ ] `npm run build` passes, all existing tests pass
- [ ] 5+ new tests covering calculation logic

---

## Key Decisions

### DEC-021: Public Route, No Auth
**Decision:** `/calculator` is fully public — no login required  
**Reasoning:** This is a top-of-funnel lead generation tool. Requiring login
before showing value defeats the purpose. Owners find it on Google, use it,
then see the CTA to sign up.  
**Status:** ✅ Final

### DEC-022: Static Income Lookup Table
**Decision:** Use hardcoded income estimates per brand/unit — no external API  
**Reasoning:** AirDNA/STR data isn't worth the API cost for this use case.
Published market research gives sufficient accuracy for a calculator tool.
Add clear disclaimer that estimates are approximate.  
**Status:** ✅ Final
