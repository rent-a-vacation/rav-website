/**
 * Single source of truth for all data in the RAV Financial Model.
 *
 * When the Phase 2 web tool is built at /executive-dashboard, it will import
 * from this module — the same inputs / expenses / scenarios feed both the
 * Excel generator and the React UI. Calculation logic lives in calc.ts.
 *
 * Issue #510: commission-rate defaults are imported from the central config
 * (src/config/commission.ts). Changing the platform commission requires
 * editing ONE file — that change flows here, into src/lib/pricing.ts, and
 * into every component that imports from either.
 */

import { DEFAULT_COMMISSION } from '@/config/commission';

// ─── Input rows ──────────────────────────────────────────────────────────────
// Each input row produces one editable cell (amber) with a label, value,
// number format, named range, and a tooltip-style note shown to the right.

export type InputRow = {
  label: string;
  value: string | number;
  fmt: string;
  name: string;
  note: string;
};

// Section A — Platform Parameters.
// Defaults sourced from src/config/commission.ts so the financial model and
// the live product (src/lib/pricing.ts) can never drift.
export const PLATFORM: InputRow[] = [
  { label: 'Base Commission Rate',          value: DEFAULT_COMMISSION.base,             fmt: '0.00%',  name: 'pCommBase',    note: 'RAV charges owners this % per booking. Default is sourced from src/config/commission.ts — editing the .xlsx amber cell here only changes THIS scenario; to change the platform default, edit the config file and rebuild.' },
  { label: 'Owner Pro Discount',            value: DEFAULT_COMMISSION.proDiscount,       fmt: '0.00%',  name: 'pProDisc',     note: 'Pro tier effective rate = Base − Pro Discount. Default from central config.' },
  { label: 'Owner Business Discount',       value: DEFAULT_COMMISSION.businessDiscount,  fmt: '0.00%',  name: 'pBizDisc',     note: 'Business tier effective rate = Base − Business Discount. Default from central config.' },
  { label: 'Average Booking Value ($)',     value: 2000,  fmt: '$#,##0', name: 'pAvgBooking',  note: 'Typical timeshare week rental price.' },
  { label: 'Average Nights Per Booking',    value: 7,     fmt: '0',      name: 'pAvgNights',   note: 'Most timeshare listings are fixed 7-night weeks.' },
  { label: 'Stripe Processing Fee (%)',     value: 0.029, fmt: '0.000%', name: 'pStripePct',   note: '~2.9% per transaction — absorbed by RAV, baked into margin.' },
  { label: 'Stripe Fixed Fee Per Txn ($)',  value: 0.30,  fmt: '$0.00',  name: 'pStripeFixed', note: '$0.30 flat fee per transaction — absorbed by RAV.' },
];

// Section B — Subscription Pricing
export const SUBSCRIPTIONS: InputRow[] = [
  { label: 'Traveler Plus ($/mo)',     value: 5,  fmt: '$#,##0', name: 'sTravPlus', note: 'Stripe: prod_UHBglcbzfRvApy' },
  { label: 'Traveler Premium ($/mo)',  value: 15, fmt: '$#,##0', name: 'sTravPrem', note: 'Stripe: prod_UHCMIZLyOj2Eqb' },
  { label: 'Owner Pro ($/mo)',         value: 10, fmt: '$#,##0', name: 'sOwnerPro', note: 'Stripe: prod_UHCUFTZBBYMTrz' },
  { label: 'Owner Business ($/mo)',    value: 25, fmt: '$#,##0', name: 'sOwnerBiz', note: 'Stripe: prod_UHCZxftwwwd87K' },
];

// Section C — Growth Assumptions
export const GROWTH: InputRow[] = [
  { label: 'Launch Month (1 = first model month)', value: 5,    fmt: '0',     name: 'gLaunchMo',   note: 'Before this month, revenue = $0. Editable as you refine the launch date.' },
  { label: 'Starting Active Owners at Launch',     value: 3,    fmt: '0',     name: 'gStartOwn',   note: 'Seed owners: co-founders + invited pilot owners.' },
  { label: 'Starting Active Travelers at Launch',  value: 10,   fmt: '0',     name: 'gStartTrav',  note: 'Seed travelers: friends, family, pilot group.' },
  { label: 'Monthly Owner Growth Rate (%)',        value: 0.20, fmt: '0.00%', name: 'gOwnGrowth',  note: 'Month-over-month % increase in active owners (net of churn).' },
  { label: 'Monthly Traveler Growth Rate (%)',     value: 0.30, fmt: '0.00%', name: 'gTravGrowth', note: 'Month-over-month % increase in active travelers (net of churn).' },
  { label: 'Bookings per Active Owner/mo',         value: 0.30, fmt: '0.00',  name: 'gBookPerOwn', note: '0.30 = roughly one booking per owner every ~3 months at launch.' },
  { label: '% Owners — Free Tier',                 value: 0.70, fmt: '0.00%', name: 'gOwn0',       note: 'Must sum to 100% with Pro + Business below.' },
  { label: '% Owners — Pro Tier',                  value: 0.20, fmt: '0.00%', name: 'gOwn1',       note: '% on $10/mo Pro plan.' },
  { label: '% Owners — Business Tier',             value: 0.10, fmt: '0.00%', name: 'gOwn2',       note: '% on $25/mo Business plan.' },
  { label: '% Travelers — Free Tier',              value: 0.80, fmt: '0.00%', name: 'gTrav0',      note: '% on free plan.' },
  { label: '% Travelers — Plus Tier',              value: 0.15, fmt: '0.00%', name: 'gTrav1',      note: '% on $5/mo Plus plan.' },
  { label: '% Travelers — Premium Tier',           value: 0.05, fmt: '0.00%', name: 'gTrav2',      note: '% on $15/mo Premium plan.' },
  { label: 'Booking Mix — Free Owner %',           value: 0.65, fmt: '0.00%', name: 'gMix0',       note: 'Of all bookings, % from free-tier owners.' },
  { label: 'Booking Mix — Pro Owner %',            value: 0.25, fmt: '0.00%', name: 'gMix1',       note: '% from Pro-tier owners.' },
  { label: 'Booking Mix — Business Owner %',       value: 0.10, fmt: '0.00%', name: 'gMix2',       note: '% from Business owners (all three must sum to 100%).' },
];

// Section D — Scenario Multipliers
export const SCENARIOS: InputRow[] = [
  { label: 'Conservative — Booking Volume x', value: 0.5, fmt: '0.00"x"', name: 'scConBook',  note: '50% of base booking volume.' },
  { label: 'Conservative — Growth Rate x',    value: 0.6, fmt: '0.00"x"', name: 'scConGrow',  note: 'Growth rates at 60% of base.' },
  { label: 'Base — Booking Volume x',         value: 1.0, fmt: '0.00"x"', name: 'scBaseBook', note: '100% — matches all base assumptions.' },
  { label: 'Base — Growth Rate x',            value: 1.0, fmt: '0.00"x"', name: 'scBaseGrow', note: '100% growth rates.' },
  { label: 'Optimistic — Booking Volume x',   value: 1.8, fmt: '0.00"x"', name: 'scOptBook',  note: '180% of base booking volume.' },
  { label: 'Optimistic — Growth Rate x',      value: 1.5, fmt: '0.00"x"', name: 'scOptGrow',  note: 'Growth rates at 150% of base.' },
];

// Section E — Planning Horizon
export const HORIZON: InputRow[] = [
  { label: 'Model Horizon (months)', value: 24,         fmt: '0', name: 'gHorizon',    note: '12 or 24 recommended.' },
  { label: 'Model Start Label',      value: 'May 2026', fmt: '@', name: 'gStartLabel', note: 'Cosmetic label for Month 1.' },
];

// Section F — Tax, Cash & Reserves (new in v3.1)
export const RESERVES: InputRow[] = [
  { label: 'Subscription Churn (monthly %)', value: 0.03, fmt: '0.00%',  name: 'gChurn',     note: 'Monthly subscriber attrition. Industry: 2-5% early-stage SaaS. v3.x interprets the tier % inputs as steady-state post-churn (gross sign-ups - churn = net growth in Section C).' },
  { label: 'Starting Cash on Hand ($)',      value: 0,    fmt: '$#,##0', name: 'gStartCash', note: 'Cash in Mercury at Month 1. Pre-funding = $0 or founder loan. Post-funding = your seed raise.' },
  { label: 'Funding Inflow — Month',         value: 0,    fmt: '0',      name: 'gFundMonth', note: 'Month number when seed funding hits the bank. 0 = not raising yet.' },
  { label: 'Funding Inflow — Amount ($)',    value: 0,    fmt: '$#,##0', name: 'gFundAmt',   note: 'Seed round size. Adds to cash in the month above.' },
  { label: 'Founder Comp — $/founder/month', value: 0,    fmt: '$#,##0', name: 'gFndComp',   note: 'Post-funding monthly salary per founder. $3-8K typical seed-stage.' },
  { label: 'Number of Salaried Founders',    value: 0,    fmt: '0',      name: 'gFndCount',  note: 'How many founders draw salary post-funding.' },
  { label: 'Funded? (1=yes, 0=no)',          value: 0,    fmt: '0',      name: 'gFunded',    note: 'Toggle gating founder comp activation.' },
];

// Section G — Hiring Plan (new in v3.2 / Phase 1b)
// Each role has a hire month + burdened monthly cost. Cost includes salary,
// employer payroll tax (~7.65%), benefits (~15-20%), tools, etc.
export const HIRING: InputRow[] = [
  { label: 'First Engineer — Hire Month',    value: 0,    fmt: '0',      name: 'hEngMonth', note: 'Model month when 1st engineer joins. 0 = no hire planned. Activates after funding typically — depends on gFundMonth.' },
  { label: 'First Engineer — Burdened $/mo', value: 12000, fmt: '$#,##0', name: 'hEngCost',  note: 'Total monthly cost: base salary + 7.65% payroll tax + ~15-20% benefits + tools. Senior eng $10-15K/mo burdened at seed stage.' },
  { label: 'First Support — Hire Month',     value: 0,    fmt: '0',      name: 'hSupMonth', note: 'Model month when 1st support hire joins. 0 = no hire planned. Typically Month 8-12 once owner volume justifies.' },
  { label: 'First Support — Burdened $/mo',  value: 6000,  fmt: '$#,##0', name: 'hSupCost',  note: 'Support role burdened cost. $4-8K/mo typical for remote contractor support.' },
  { label: 'First BD — Hire Month',          value: 0,    fmt: '0',      name: 'hBDMonth',  note: 'Model month when 1st BD/growth hire joins. 0 = no hire planned. Triggers after product-market fit signal.' },
  { label: 'First BD — Burdened $/mo',       value: 9000,  fmt: '$#,##0', name: 'hBDCost',   note: 'Business development burdened cost. Often base + commission — model just the base here.' },
];

// Section H — Unit Economics & Cohort Ramp (new in v3.2 / Phase 1b)
export const UNIT_ECON: InputRow[] = [
  { label: 'Cohort Ramp (months to full velocity)', value: 3,    fmt: '0',     name: 'uRampMonths',     note: 'New cohort booking velocity ramps from 0 to gBookPerOwn over this many months. Set 1 = immediate full velocity; 3-6 = gradual onboarding curve.' },
  { label: 'Average Owner Lifetime (months)',       value: 24,   fmt: '0',     name: 'uOwnLife',        note: 'Average months an active owner stays on the platform before churning. Used for LTV calc. 24mo = ~3% monthly churn equivalent.' },
  { label: 'Average Traveler Lifetime (months)',    value: 18,   fmt: '0',     name: 'uTravLife',       note: 'Average months an active traveler stays. Travelers churn faster than owners typically.' },
  { label: 'Voice Overage — $/active traveler/mo',   value: 0.50, fmt: '$0.00', name: 'uVoiceOverage',   note: 'Avg monthly voice overage revenue per non-Premium traveler. Conservative default; scales with adoption of voice features post-launch.' },
];

// ─── Expense rows ────────────────────────────────────────────────────────────
export type ExpenseRow = {
  category: string;
  item: string;
  type: 'One-Time' | 'Recurring';
  amount: number;
  frequency: 'Once' | 'Monthly' | 'Annual' | 'Quarterly';
  startMo: number;
  endMo: number;
  notes: string;
};

export const EXPENSE_CATEGORIES = [
  'Legal & Formation',
  'Operations & Tools',
  'Marketing & Launch',
  'Compliance & Tax',
  'People & Admin',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_PALETTE: Record<ExpenseCategory, { bg: string; fg: string }> = {
  'Legal & Formation':   { bg: 'NAVY',      fg: 'WHITE' },
  'Operations & Tools':  { bg: 'DEEP_TEAL', fg: 'WHITE' },
  'Marketing & Launch':  { bg: 'CORAL',     fg: 'WHITE' },
  'Compliance & Tax':    { bg: 'SLATE',     fg: 'WHITE' },
  'People & Admin':      { bg: 'EMERALD',   fg: 'WHITE' },
};

export const EXPENSES: ExpenseRow[] = [
  // Legal & Formation
  { category: 'Legal & Formation',  item: 'Delaware C-Corp via Stripe Atlas',         type: 'One-Time',  amount: 500,  frequency: 'Once',    startMo: 1,  endMo: 1,  notes: 'Stripe Atlas all-in $500 covers DE C-Corp formation, EIN, registered agent (year 1), Stripe + Mercury referral, stock issuance, 83(b) e-filing.' },
  { category: 'Legal & Formation',  item: 'Registered Agent (years 2+, annual)',      type: 'Recurring', amount: 150,  frequency: 'Annual',  startMo: 13, endMo: 24, notes: 'Stripe Atlas covers year 1. From year 2 onward, ~$150/yr (Atlas renewal) or ~$50-100/yr (Northwest, Harbor).' },
  { category: 'Legal & Formation',  item: 'Startup Attorney — initial consultation', type: 'One-Time',  amount: 800,  frequency: 'Once',    startMo: 1,  endMo: 1,  notes: 'IP assignments, founder agreements, OBA disclosure review (4 founders).' },
  { category: 'Legal & Formation',  item: 'Timeshare Attorney — consultation',       type: 'One-Time',  amount: 1200, frequency: 'Once',    startMo: 1,  endMo: 2,  notes: 'ARDA compliance, marketplace facilitator review, listing T&C. Specialist outside Atlas network.' },
  { category: 'Legal & Formation',  item: 'IP Assignment Agreements (all 4 founders)', type: 'One-Time', amount: 600, frequency: 'Once',    startMo: 1,  endMo: 1,  notes: 'Critical: signed before any code is assigned to the entity. Templates via Atlas; attorney review extra.' },
  { category: 'Legal & Formation',  item: 'Terms of Service & Privacy — legal review', type: 'One-Time', amount: 500, frequency: 'Once',    startMo: 2,  endMo: 2,  notes: 'Issue #80 in RAV GitHub — required before public launch.' },
  { category: 'Legal & Formation',  item: 'Trademark — "Rent-A-Vacation" wordmark',  type: 'One-Time',  amount: 350,  frequency: 'Once',    startMo: 3,  endMo: 3,  notes: 'USPTO TEAS Plus $250 + attorney $100. Class 39 (travel services).' },
  { category: 'Legal & Formation',  item: 'Trademark — "Pay Safe"',                  type: 'One-Time',  amount: 350,  frequency: 'Once',    startMo: 3,  endMo: 3,  notes: 'Escrow service mark. Class 36 (financial services).' },
  { category: 'Legal & Formation',  item: 'Trademark — "TrustShield"',               type: 'One-Time',  amount: 350,  frequency: 'Once',    startMo: 3,  endMo: 3,  notes: 'Owner verification mark. Class 35 (business services).' },

  // Operations & Tools
  { category: 'Operations & Tools', item: 'Claude Max subscription',             type: 'Recurring', amount: 100, frequency: 'Monthly', startMo: 1, endMo: 24, notes: 'Primary AI development tool.' },
  { category: 'Operations & Tools', item: 'Vercel Pro (frontend hosting)',       type: 'Recurring', amount: 20,  frequency: 'Monthly', startMo: 1, endMo: 24, notes: 'Production and preview deployments.' },
  { category: 'Operations & Tools', item: 'Supabase (free -> Pro)',              type: 'Recurring', amount: 25,  frequency: 'Monthly', startMo: 4, endMo: 24, notes: 'Free pre-launch; Pro ~$25/mo when usage grows.' },
  { category: 'Operations & Tools', item: 'VAPI — voice AI (Ask RAVIO)',         type: 'Recurring', amount: 50,  frequency: 'Monthly', startMo: 5, endMo: 24, notes: 'Per-usage. Est. $50/mo at launch. Scales with adoption.' },
  { category: 'Operations & Tools', item: 'OpenRouter — text chat (Chat with RAVIO)', type: 'Recurring', amount: 15, frequency: 'Monthly', startMo: 5, endMo: 24, notes: '10-100x cheaper than VAPI per interaction.' },
  { category: 'Operations & Tools', item: 'Twilio — A2P 10DLC registration',     type: 'One-Time',  amount: 19,  frequency: 'Once',    startMo: 2, endMo: 2,  notes: '$19 one-time. Blocked on LLC/EIN. ~1-2 week approval.' },
  { category: 'Operations & Tools', item: 'Twilio — monthly SMS usage',          type: 'Recurring', amount: 20,  frequency: 'Monthly', startMo: 3, endMo: 24, notes: 'Estimated SMS volume. SMS_TEST_MODE=true until launch.' },
  { category: 'Operations & Tools', item: 'Resend (transactional email)',        type: 'Recurring', amount: 0,   frequency: 'Monthly', startMo: 1, endMo: 24, notes: 'Free tier: 3K emails/mo.' },
  { category: 'Operations & Tools', item: 'Sentry (error monitoring)',           type: 'Recurring', amount: 0,   frequency: 'Monthly', startMo: 1, endMo: 24, notes: 'Free tier pre-launch.' },
  { category: 'Operations & Tools', item: 'PostHog (analytics)',                 type: 'Recurring', amount: 0,   frequency: 'Monthly', startMo: 1, endMo: 24, notes: 'Free <1M events/mo.' },
  { category: 'Operations & Tools', item: 'GitHub Team Plan',                    type: 'Recurring', amount: 4,   frequency: 'Monthly', startMo: 1, endMo: 24, notes: '$4/user/mo — branch protection for private repo.' },
  { category: 'Operations & Tools', item: 'Antigravity IDE',                     type: 'Recurring', amount: 20,  frequency: 'Monthly', startMo: 1, endMo: 24, notes: 'Development IDE subscription.' },
  { category: 'Operations & Tools', item: 'Cursor / Windsurf IDE',               type: 'Recurring', amount: 20,  frequency: 'Monthly', startMo: 1, endMo: 24, notes: 'Additional AI-assisted coding environment.' },
  { category: 'Operations & Tools', item: 'Domain & DNS (Cloudflare)',           type: 'Recurring', amount: 15,  frequency: 'Annual',  startMo: 1, endMo: 24, notes: 'rent-a-vacation.com + Techsilon venture domains.' },
  { category: 'Operations & Tools', item: 'Canva Pro',                           type: 'Recurring', amount: 13,  frequency: 'Monthly', startMo: 1, endMo: 24, notes: 'Marketing design — social graphics, pitch materials.' },
  { category: 'Operations & Tools', item: 'Gamma.app (presentations)',           type: 'Recurring', amount: 8,   frequency: 'Monthly', startMo: 1, endMo: 24, notes: 'Investor pitch deck and stakeholder presentations.' },

  // Marketing & Launch
  { category: 'Marketing & Launch', item: 'Marketing materials (print + digital)', type: 'One-Time',  amount: 500,  frequency: 'Once',    startMo: 4, endMo: 4,  notes: 'One-pagers, brochures, owner acquisition kit.' },
  { category: 'Marketing & Launch', item: 'Conference registration (1 event)',     type: 'One-Time',  amount: 1500, frequency: 'Once',    startMo: 6, endMo: 6,  notes: 'ARDA World, VacationExpo, or equivalent.' },
  { category: 'Marketing & Launch', item: 'Conference travel & accommodation',     type: 'One-Time',  amount: 1000, frequency: 'Once',    startMo: 6, endMo: 6,  notes: 'Flights + hotel for conference.' },
  { category: 'Marketing & Launch', item: 'Conference exhibitor / booth fee',      type: 'One-Time',  amount: 2500, frequency: 'Once',    startMo: 6, endMo: 6,  notes: 'Exhibitor stall — direct owner acquisition.' },
  { category: 'Marketing & Launch', item: 'Social ads — launch month (FB/IG)',     type: 'One-Time',  amount: 500,  frequency: 'Once',    startMo: 5, endMo: 5,  notes: 'Targeted launch-month ads to timeshare owner groups.' },
  { category: 'Marketing & Launch', item: 'Social ads — ongoing (FB/IG)',          type: 'Recurring', amount: 200,  frequency: 'Monthly', startMo: 6, endMo: 24, notes: 'Sustained social media ads post-launch.' },
  { category: 'Marketing & Launch', item: 'Google Ads (keyword targeting)',        type: 'Recurring', amount: 150,  frequency: 'Monthly', startMo: 6, endMo: 24, notes: 'timeshare rental + related keywords.' },
  { category: 'Marketing & Launch', item: 'Apollo.io (owner lead generation)',     type: 'Recurring', amount: 0,    frequency: 'Monthly', startMo: 1, endMo: 24, notes: 'Free tier now; upgrade in growth phase.' },

  // Compliance & Tax
  { category: 'Compliance & Tax', item: 'EIN application (IRS)',                   type: 'One-Time',  amount: 0,    frequency: 'Once',    startMo: 1,  endMo: 1,  notes: 'Free — handled by Stripe Atlas as part of incorporation package.' },
  { category: 'Compliance & Tax', item: 'Business bank account (Mercury)',         type: 'One-Time',  amount: 0,    frequency: 'Once',    startMo: 2,  endMo: 2,  notes: 'Mercury startup banking — no fees, no minimums. Stripe Atlas referral.' },
  { category: 'Compliance & Tax', item: 'Puzzle.io accounting (free tier)',        type: 'Recurring', amount: 0,    frequency: 'Monthly', startMo: 3,  endMo: 24, notes: 'Free <$20K/mo transactions. Graduates to $25 then $50/mo as volume grows.' },
  { category: 'Compliance & Tax', item: 'Stripe Tax activation',                   type: 'Recurring', amount: 0,    frequency: 'Monthly', startMo: 3,  endMo: 24, notes: '0.5% of transactions — scales with revenue, not a flat fee.' },
  { category: 'Compliance & Tax', item: 'CPA — annual tax filing (Form 1120 + DE)', type: 'Recurring', amount: 2000, frequency: 'Annual', startMo: 12, endMo: 24, notes: 'Realistic range $1,500-3,000/yr for C-Corp. Federal Form 1120 + DE franchise + home-state return. Editable — confirm exact price during first engagement.' },
  { category: 'Compliance & Tax', item: 'Delaware franchise tax + annual report',  type: 'Recurring', amount: 450,  frequency: 'Annual',  startMo: 3,  endMo: 24, notes: 'MANDATORY for every DE C-Corp regardless of revenue. ~$400 min + $50 annual report. Due March 1 each year.' },
  { category: 'Compliance & Tax', item: 'Home-state foreign qualification + franchise', type: 'Recurring', amount: 200, frequency: 'Annual', startMo: 3, endMo: 24, notes: 'Required if operating outside DE. FL ~$150/yr. CA ~$800/yr min. Adjust per actual operating state.' },
  { category: 'Compliance & Tax', item: 'R&D Tax Credit prep (Mainstreet/Fondo)',  type: 'Recurring', amount: 0,    frequency: 'Annual',  startMo: 12, endMo: 24, notes: 'NET POSITIVE — specialist takes 20% of credit captured. Typically returns $3K-15K/yr offset against employer payroll tax for software-heavy startups.' },
  { category: 'Compliance & Tax', item: 'D&O Insurance (Directors & Officers)',    type: 'Recurring', amount: 1800, frequency: 'Annual',  startMo: 6,  endMo: 24, notes: '~$1,500-3,000/yr early-stage. Often required by investors. Vouch / Embroker for startup rates.' },
  { category: 'Compliance & Tax', item: 'Tech E&O / Cyber Liability insurance',    type: 'Recurring', amount: 2400, frequency: 'Annual',  startMo: 6,  endMo: 24, notes: '~$2K-4K/yr SaaS marketplace pre-revenue. Often required by enterprise customers.' },
  { category: 'Compliance & Tax', item: 'General Liability insurance',             type: 'Recurring', amount: 600,  frequency: 'Annual',  startMo: 6,  endMo: 24, notes: '~$500-800/yr baseline. Required by some venues for conference exhibit space.' },

  // People & Admin
  { category: 'People & Admin', item: 'Co-founder stipends',                       type: 'Recurring', amount: 0, frequency: 'Monthly', startMo: 1, endMo: 24, notes: '$0 until funded. Post-funding: see INPUTS Section F (Founder Comp).' },
  { category: 'People & Admin', item: 'Founder reimbursements (pre-incorp)',       type: 'One-Time',  amount: 0, frequency: 'Once',    startMo: 1, endMo: 1,  notes: 'Placeholder — fill in actual out-of-pocket pre-incorporation costs once tallied.' },
  { category: 'People & Admin', item: 'Contractor / freelancer (if needed)',       type: 'One-Time',  amount: 0, frequency: 'Once',    startMo: 1, endMo: 1,  notes: 'Placeholder. Common: designer ($500-2K), copywriter, specialist developer.' },
  { category: 'People & Admin', item: 'Qase.io / test management',                 type: 'Recurring', amount: 0, frequency: 'Monthly', startMo: 1, endMo: 24, notes: 'Free tier — 837 test cases imported. Upgrade ($30/mo) only if 4+ active testers.' },
];

// ─── Platform facts (Funding Ask tab) ─────────────────────────────────────────
export const PLATFORM_FACTS: [string, string][] = [
  ['Product Status',   'Built and live at rent-a-vacation.com. Staff Only Mode enabled — not yet public.'],
  ['Tech Stack',       'React 18 · TypeScript · Supabase (PostgreSQL) · Stripe · VAPI · Vercel'],
  ['Test Coverage',    '1,090 automated tests · 0 type errors · 0 lint errors · Clean build'],
  ['Database',         '46 SQL migrations deployed to production. 30 edge functions.'],
  ['Resort Directory', '117 resorts · 351 unit types · 9 brands (Hilton, Marriott, Disney, Wyndham, and more)'],
  ['Marketplace',      'Listings · Wishes · Offers — two-sided negotiation with Name Your Price + Offer mechanic'],
  ['AI Features',      'Ask RAVIO (voice search via VAPI) · Chat with RAVIO (text AI via OpenRouter)'],
  ['Revenue Ready',    'Stripe Connect · PaySafe escrow · cancellation policies · subscription billing built'],
  ['Verification',     'TrustShield owner identity + ownership verification system built'],
  ['Key Blockers',     'Delaware C-Corp (#127) · Legal review ToS/Privacy (#80) · A2P 10DLC SMS'],
  ['Savings Claim',    'Save 20-40% vs resort-direct booking [ARDA industry data — BRAND-LOCK.md approved]'],
  ['Market Size',      '$10.5B vacation ownership industry · 9.9M U.S. households own timeshares [ARDA 2024]'],
];

// ─── Funding timeline milestones ──────────────────────────────────────────────
export const MILESTONES: [string, string, string][] = [
  ['Months 1-2',  'Legal',       'Delaware C-Corp formed. IP Assignments signed (all 4 founders). OBA disclosures filed. Timeshare attorney consulted.'],
  ['Months 2-3',  'Tech',        'Stripe Tax activated. A2P 10DLC registered. Puzzle.io live. All production blockers cleared.'],
  ['Month 4',     'Pre-Launch',  'Beta owner recruitment (invite-only). TrustShield documented. ToS legally reviewed (#80).'],
  ['Month 5',     'Launch',      'Platform opens. First Listings and Wishes live. First Offers submitted. First Stripe payouts.'],
  ['Month 6',     'Marketing',   'First industry conference (ARDA). Exhibitor booth. Direct owner acquisition. First 50+ users.'],
  ['Months 8-10', 'Growth',      '10+ active owners. 50+ completed transactions. First subscription revenue. Referral program active.'],
  ['Month 12',    'Metrics',     'First investor-ready deck: GMV, take rate, Offer acceptance rate, LTV/CAC.'],
  ['Months 18-24','Profitability','Break-even or Series A raise. Possible acquisition conversation with hospitality tech buyer.'],
];
