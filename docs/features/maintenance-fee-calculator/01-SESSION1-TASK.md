---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "archived"
---
# Session 1: Maintenance Fee Calculator — Build It

**Feature:** Maintenance Fee Calculator  
**Session:** 1 of 1  
**Agent Role:** Frontend Engineer  
**Duration:** ~2 hours  
**Prerequisites:** Read `00-PROJECT-BRIEF.md` fully before writing any code

---

## Mission

Build the complete public-facing Maintenance Fee Calculator page.
Pure frontend — no migration, no Edge Function. One page, two components,
one logic file.

---

## Task 1: Calculation Logic

Create `src/lib/calculatorLogic.ts` — pure functions, no React, fully testable.

```typescript
export const VACATION_CLUB_BRANDS = [
  { value: 'hilton_grand_vacations', label: 'Hilton Grand Vacations' },
  { value: 'marriott_vacation_club', label: 'Marriott Vacation Club' },
  { value: 'disney_vacation_club', label: 'Disney Vacation Club' },
  { value: 'wyndham_destinations', label: 'Wyndham Destinations' },
  { value: 'hyatt_residence_club', label: 'Hyatt Residence Club' },
  { value: 'bluegreen_vacations', label: 'Bluegreen Vacations' },
  { value: 'holiday_inn_club', label: 'Holiday Inn Club Vacations' },
  { value: 'worldmark', label: 'WorldMark by Wyndham' },
  { value: 'other', label: 'Other / Independent Resort' },
]

export const UNIT_TYPES = [
  { value: 'studio', label: 'Studio' },
  { value: '1br', label: '1 Bedroom' },
  { value: '2br', label: '2 Bedroom' },
  { value: '3br', label: '3 Bedroom+' },
]

// Weekly income estimates (net to owner before RAV fee)
// Based on comparable RAV listings and published market research
const INCOME_ESTIMATES: Record<string, Record<string, number>> = {
  hilton_grand_vacations: { studio: 1200, '1br': 1850, '2br': 2800, '3br': 4200 },
  marriott_vacation_club: { studio: 1100, '1br': 1700, '2br': 2600, '3br': 3900 },
  disney_vacation_club:   { studio: 1400, '1br': 2100, '2br': 3200, '3br': 4800 },
  wyndham_destinations:   { studio: 900,  '1br': 1400, '2br': 2100, '3br': 3100 },
  hyatt_residence_club:   { studio: 1300, '1br': 1900, '2br': 2900, '3br': 4300 },
  bluegreen_vacations:    { studio: 800,  '1br': 1250, '2br': 1900, '3br': 2800 },
  holiday_inn_club:       { studio: 750,  '1br': 1150, '2br': 1750, '3br': 2600 },
  worldmark:              { studio: 850,  '1br': 1300, '2br': 2000, '3br': 2900 },
  other:                  { studio: 900,  '1br': 1400, '2br': 2100, '3br': 3100 },
}

const RAV_FEE_RATE = 0.10  // 10% platform fee

export interface CalculatorInputs {
  brand: string
  unitType: string
  annualMaintenanceFees: number
  weeksOwned: number
}

export interface WeekScenario {
  weeks: number
  grossIncome: number
  ravFee: number
  netIncome: number
  coveragePercent: number  // netIncome / annualMaintenanceFees * 100
  netProfit: number        // netIncome - annualMaintenanceFees (can be negative)
}

export interface CalculatorResult {
  estimatedWeeklyIncome: number  // Gross per week
  ravFeePerWeek: number
  netPerWeek: number             // After RAV fee
  breakEvenWeeks: number         // annualMaintenanceFees / netPerWeek
  scenarios: WeekScenario[]      // 1, 2, 3 week scenarios
}

export function calculateBreakeven(inputs: CalculatorInputs): CalculatorResult | null {
  if (!inputs.brand || !inputs.unitType || inputs.annualMaintenanceFees <= 0) {
    return null
  }

  const grossWeekly = INCOME_ESTIMATES[inputs.brand]?.[inputs.unitType] ?? 0
  if (grossWeekly === 0) return null

  const ravFeePerWeek = grossWeekly * RAV_FEE_RATE
  const netPerWeek = grossWeekly - ravFeePerWeek
  const breakEvenWeeks = inputs.annualMaintenanceFees / netPerWeek

  const scenarios: WeekScenario[] = [1, 2, 3].map(weeks => {
    const grossIncome = grossWeekly * weeks
    const ravFee = ravFeePerWeek * weeks
    const netIncome = netPerWeek * weeks
    const coveragePercent = (netIncome / inputs.annualMaintenanceFees) * 100
    const netProfit = netIncome - inputs.annualMaintenanceFees
    return { weeks, grossIncome, ravFee, netIncome, coveragePercent, netProfit }
  })

  return { estimatedWeeklyIncome: grossWeekly, ravFeePerWeek, netPerWeek, breakEvenWeeks, scenarios }
}
```

---

## Task 2: Add Public Route

In `App.tsx`, add the public route (NO ProtectedRoute wrapper):

```tsx
import MaintenanceFeeCalculator from '@/pages/MaintenanceFeeCalculator'

<Route path="/calculator" element={<MaintenanceFeeCalculator />} />
```

Add to site footer navigation:
```tsx
<a href="/calculator">Maintenance Fee Calculator</a>
```

---

## Task 3: Page Component

Create `src/pages/MaintenanceFeeCalculator.tsx`

```tsx
// Set page SEO meta tags (use react-helmet or equivalent if installed,
// otherwise add to the page's title element):
// Title: "Timeshare Maintenance Fee Calculator — Rent-A-Vacation"
// Description: "Calculate how many weeks you need to rent your timeshare 
//               to cover annual maintenance fees."

// Layout: max-w-5xl mx-auto px-4 py-12

// Header section:
// H1: "Will renting your timeshare cover your maintenance fees?"
// Subtitle: "Find out in 30 seconds — free, no account needed"

// Two-column grid on desktop (stack on mobile):
// Left col: <OwnershipForm /> (inputs)
// Right col: <BreakevenResults /> (live results) OR placeholder "Enter your 
//             details to see your earnings potential" when inputs incomplete

// Below the two columns:
// <CalculatorCTA /> — sign up prompt

// Social proof bar between results and CTA:
// "Join {ownerCount} owners already earning on RAV"
// Pull ownerCount: SELECT COUNT(*) FROM user_roles WHERE role = 'property_owner'
// (unauthenticated — add RLS policy that allows public count query, or use
// a Supabase Edge Function if RLS doesn't allow it)
// Fallback if query fails: show "Join hundreds of owners already earning on RAV"
```

---

## Task 4: OwnershipForm Component

Create `src/components/calculator/OwnershipForm.tsx`

```tsx
// Controlled form — lifts state up to parent page via onChange prop
interface OwnershipFormProps {
  inputs: CalculatorInputs
  onChange: (inputs: CalculatorInputs) => void
}

// Fields:
// 1. Brand — shadcn Select dropdown, uses VACATION_CLUB_BRANDS list
// 2. Unit Type — shadcn Select dropdown, uses UNIT_TYPES list
// 3. Annual Maintenance Fees — number input, prefix "$", placeholder "2,800"
//    Format with commas as user types
// 4. Weeks owned — shadcn Select: "1 week", "2 weeks", "3+ weeks"

// Styling: white card, shadow-sm, rounded-xl, p-6
// Label + input stacked vertically, gap-4 between fields
// Each label: text-sm font-medium text-gray-700
```

---

## Task 5: BreakevenResults Component

Create `src/components/calculator/BreakevenResults.tsx`

```tsx
interface BreakevenResultsProps {
  result: CalculatorResult | null
  maintenanceFees: number
}

// If result is null: show empty state card
//   "Enter your ownership details to see your earnings potential →"
//   Soft gray dashed border, centered text

// If result exists:
// 
// Top section — weekly breakdown:
//   "Estimated weekly earnings" — large number ($X,XXX)
//   Below: "RAV platform fee (10%): -$XXX"
//   Below: "Your net per week: $X,XXX" (emerald, bold)
//
// Middle section — break-even:
//   "Break-even point: {X.X} weeks"
//   Subtext: "You need to rent {ceil(X.X)} week(s) to cover your fees"
//
// Scenario bars — one per scenario (1, 2, 3 weeks):
//   <BreakevenBar scenario={scenario} maintenanceFees={maintenanceFees} />
//
// Disclaimer (small, gray):
//   "* Estimates based on comparable RAV listings. 
//      Actual earnings vary by resort, season, and demand."
```

---

## Task 6: BreakevenBar Component

Create `src/components/calculator/BreakevenBar.tsx`

```tsx
interface BreakevenBarProps {
  scenario: WeekScenario
  maintenanceFees: number
}

// Layout per bar:
// Row 1: "{X} week{s}" label (left) + coverage amount (right)
// Row 2: Progress bar
// Row 3: Profit/loss label

// Progress bar:
//   Width: min(coveragePercent, 100)% — cap at 100% visually
//   Color:
//     coveragePercent < 75:   bg-red-400
//     coveragePercent < 100:  bg-amber-400
//     coveragePercent >= 100: bg-emerald-500

// Profit/loss label:
//   Positive (profit):  text-emerald-600 font-semibold
//                       "+ $X,XXX net profit after fees"
//   Negative (deficit): text-red-500
//                       "Covers {X}% of your maintenance fees"
//
// When coveragePercent >= 100: add checkmark ✓ and 
//   "Fees fully covered!" in emerald
```

---

## Task 7: CalculatorCTA Component

Create `src/components/calculator/CalculatorCTA.tsx`

```tsx
// CTA card — appears below results
// bg-gradient-to-r from-blue-600 to-blue-700, text-white, rounded-xl, p-8

// Headline: "Ready to start earning?"
// Subtext: "List your first week in under 10 minutes. 
//           No commitment — cancel anytime."

// Button: "Create Free Owner Account →"
// Links to: /auth?mode=signup&role=property_owner
// Button style: bg-white text-blue-700 font-semibold px-8 py-3 rounded-lg

// Below button (small, white/80):
// "✓ No listing fees  ✓ 10% platform fee only on successful bookings  
//  ✓ You control your pricing"
```

---

## Task 8: Tests

Create `src/lib/__tests__/calculatorLogic.test.ts`

```typescript
test('calculateBreakeven returns null for incomplete inputs')
test('calculateBreakeven returns null for zero maintenance fees')
test('breakEvenWeeks is correct: fees / netPerWeek')
test('netPerWeek = grossWeekly - 10% RAV fee')
test('scenario 2 weeks: coverage is 2x single week coverage')
test('coveragePercent > 100 when income exceeds fees')
test('netProfit is negative when income < maintenance fees')
test('netProfit is positive when income > maintenance fees')
```

---

## Deliverables Checklist

- [ ] `calculatorLogic.ts` — pure functions, no TypeScript errors
- [ ] `/calculator` route — loads without auth
- [ ] Brand dropdown — all 9 brands listed
- [ ] Unit type dropdown — all 4 options listed
- [ ] Results update live as inputs change
- [ ] Break-even weeks calculated correctly
- [ ] All 3 scenario bars render with correct colors
- [ ] Profit shows in emerald when positive
- [ ] Deficit shows in red when negative
- [ ] CTA button links to `/auth?mode=signup&role=property_owner`
- [ ] Social proof count displays (or fallback text if query fails)
- [ ] SEO title and meta description set
- [ ] Mobile responsive — stacks to single column
- [ ] Footer link added to `/calculator`
- [ ] 8+ new tests passing, all existing tests passing
- [ ] `npm run build` — no errors
- [ ] Commit: `feat: Add public Maintenance Fee Calculator page`

## Handoff

Create `docs/features/maintenance-fee-calculator/handoffs/session1-handoff.md`:
- URL of the page (local + Vercel preview)
- Screenshot description of the calculator filled in
- Social proof query — did it work or use fallback?
- Any adjustments to income estimates made
- Test count
