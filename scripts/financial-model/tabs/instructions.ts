import type { Workbook } from 'exceljs';
import { C } from '../colors.ts';
import { banner, styleCell, setColumnPixelWidths } from '../style.ts';

export function buildInstructionsTab(wb: Workbook): void {
  const ws = wb.addWorksheet('INSTRUCTIONS', { properties: { tabColor: { argb: C.SLATE } } });

  setColumnPixelWidths(ws, [20, 30, 190, 480]);

  ws.getRow(1).height = 52;
  banner(ws, 1, 2, 3, 'HOW TO USE — RAV FINANCIAL MODEL', C.NAVY, C.WHITE, 15, true);
  ws.getRow(2).height = 8;

  type Section = { title: string; color: string; items: [string, string][] };
  const sections: Section[] = [
    {
      title: '1.  INPUTS TAB — START HERE', color: C.DEEP_TEAL, items: [
        ['INPUTS',           'Your control panel. Every amber cell is editable. Change any value and the entire model updates.'],
        ['Section A',        'Platform parameters — pre-loaded from RAV codebase. Commission rates, Stripe fees, avg booking value.'],
        ['Section B',        'Subscription prices — from Stripe sandbox config. Update when production prices are set.'],
        ['Section C',        'Growth assumptions — your best estimates. Includes Launch Month (drives when revenue turns on).'],
        ['Section D',        'Scenario multipliers — how Conservative and Optimistic differ from Base.'],
        ['Section E',        'Planning horizon and model start date label.'],
        ['Section F',        'Tax, Cash & Reserves — churn, starting cash, funding inflow (month + amount), founder comp post-funding. Drives cumulative cash position.'],
      ['Section G (NEW)',  'Hiring Plan — hire month + burdened cost per role (Eng, Support, BD). Auto-adds as a SEPARATE LINE on Revenue Model (Hiring Costs row) and is summed into Net P&L. Note: hiring costs are NOT in the EXPENSES tab and NOT in FUNDING ASK Use of Funds yet (Phase 2 will integrate them). For now, model hiring costs visibility on REVENUE MODEL; account for them in your funding ask manually if you plan to hire pre-revenue.'],
      ['Section H (NEW)',  'Unit Economics & Cohort Ramp — ramp months, owner lifetime, traveler lifetime, voice overage rate. Drives UNIT ECON + cohort booking velocity.'],
      ],
    },
    {
      title: '2.  ADDING EXPENSES', color: C.CORAL, items: [
        ['EXPENSES',         'Pre-populated with 47 known RAV costs. Scroll to green section to add new rows.'],
        ['Amber cells',      'Amount, Start Month, End Month are editable per row.'],
        ['Type dropdown',    'One-Time = appears in Start Month only. Recurring = every month between Start and End.'],
        ['Frequency',        'Monthly / Annual / Quarterly / Once. Annual and Quarterly auto-divide for monthly calc.'],
        ['Monthly $ column', 'Auto-calculated. Do not edit directly.'],
      ],
    },
    {
      title: '3.  REVENUE MODEL', color: C.EMERALD, items: [
        ['REVENUE MODEL',    'Do NOT edit here — all cells pull from INPUTS. Change inputs, this updates.'],
        ['Scenario dropdown','Cell D4. Switch between Conservative / Base / Optimistic.'],
        ['Section 2',        'Monthly Bookings = Offers that convert. GBV = bookings × avg booking value.'],
        ['Section 3',        'Gross Commission = GBV × blended rate. Stripe Fees subtracted (2.9% + $0.30 on whole txn). Net Commission flows to Total Revenue.'],
        ['Section 4',        'Subscription revenue across Owner Pro/Business + Traveler Plus/Premium.'],
        ['Section 5',        'Revenue (green), Costs (red, live from Expenses tab), Net P&L, Cumulative Cash (seeded with Starting Cash + Funding Inflow from INPUTS F).'],
      ],
    },
    {
      title: '4.  BREAK-EVEN', color: C.AMBER, items: [
        ['BREAK-EVEN',       'Month-by-month cumulative cash. Green = profitable, Red = burning cash.'],
        ['KPI row (row 5)',  'One-time costs, monthly burn, break-even month, 6-mo and 12-mo funding needs.'],
        ['Break-even month', 'First month cumulative cash turns positive. "Not in 24mo" if not achieved.'],
        ['Costs',            'Includes both EXPENSES tab totals + Hiring Costs from REVENUE MODEL.'],
      ],
    },
    {
      title: '4b. UNIT ECON (new in v3.2)', color: C.EMERALD, items: [
        ['UNIT ECON',     '24-month rollups for LTV, CAC, payback. Directional — assumes uniform user behavior across cohorts.'],
        ['Owner LTV',     '(Avg monthly net commission + avg monthly subscription rev per owner) × uOwnLife.'],
        ['Traveler LTV',  '(Avg monthly subscription rev + avg voice overage per traveler) × uTravLife.'],
        ['Blended CAC',   'Total marketing spend ÷ net new users over 24 months.'],
        ['LTV / CAC',     'Healthy benchmark > 3:1. Owner ratio typically higher than Traveler.'],
        ['Payback',       'CAC ÷ blended monthly revenue per user. < 12 months is healthy seed-stage.'],
      ],
    },
    {
      title: '4c. SENSITIVITY (new in v3.2)', color: C.NAVY_LIGHT, items: [
        ['SENSITIVITY',       '24-month revenue + profit impact when commission rate, avg booking value, or booking volume change ±20%.'],
        ['Linear assumption', 'Each driver varied alone, holding others at Base. For compounding effects, use the Scenario dropdown on REVENUE MODEL.'],
        ['Use for diligence', 'Pair worst-case from this tab with Conservative scenario to set the funding-ask lower bound.'],
      ],
    },
    {
      title: '4d. TAX RESERVES — CASH-FLOW NOTE', color: C.AMBER, items: [
        ['Lodging + sales tax',  'Once Stripe Tax is activated, RAV collects occupancy/lodging tax from travelers and remits it to state/county/city.'],
        ['Pass-through liability', 'Tax collected sits in the Mercury account briefly but is NOT RAV revenue — it must be remitted on a schedule (typically monthly per state).'],
        ['Treat as cash, not P&L', 'Cumulative Cash Position in REVENUE MODEL may look temporarily inflated by tax floats. The 24-mo Net P&L excludes tax pass-throughs (they neither hit revenue nor expense in this model).'],
        ['When this matters',    'Once monthly bookings × avg occupancy tax > ~$5K/mo, automate via Avalara / TaxJar. Until then, manual remit per state is fine.'],
      ],
    },
    {
      title: '4e. ADDING CHARTS (manual — Phase 2 will automate)', color: C.NAVY_MID, items: [
        ['Why manual',     'The exceljs library that builds this workbook does not yet support chart serialization. Real interactive charts come in Phase 2 when the model moves into /executive-dashboard (web app, recharts library).'],
        ['Revenue vs Costs', 'In Excel: open REVENUE MODEL → select row 34 (TOTAL MONTHLY REVENUE) and row 35 (TOTAL MONTHLY COSTS) from columns D:AA → Insert > Line Chart. Takes 10 seconds.'],
        ['Cumulative Cash',  'Same — select the Cumulative Cash row from D:AA, Insert > Line Chart. Drop a vertical line marker at the break-even month (use the value from BREAK-EVEN tab E5).'],
        ['Sensitivity bars', 'On SENSITIVITY tab: select the 3-driver matrix, Insert > Bar Chart. Useful for investor decks.'],
      ],
    },
    {
      title: '5.  FUNDING ASK', color: C.NAVY, items: [
        ['FUNDING ASK',         'One-page summary. ALL dollar figures auto-populate from INPUTS and EXPENSES — you do not enter Use of Funds amounts manually.'],
        ['THE ASK rows',        'D5 = 6-Month Runway. D6 = 12-Month Runway. D7 = 15% contingency on D6. D8 = D6 + D7 = recommended seed ask.'],
        ['Use of Funds = SUMIFs', 'Each category row sums the matching EXPENSES rows: SUMIFS of one-time amounts + SUMIFS of recurring monthly × 12. Edit EXPENSES, this updates automatically.'],
        ['Want a number to change?', 'Go to EXPENSES tab. Find the row. Edit the Amount cell. Use of Funds + THE ASK + everything else recomputes. The yellow/amber cells on EXPENSES are the editable ones.'],
        ['% of Ask',            'Each category amount ÷ D8 (recommended seed ask). Shows what fraction of the raise each bucket consumes. Useful for investor questions like "what percent goes to legal vs ops vs marketing?"'],
        ['Platform facts',      'Pre-loaded from the RAV codebase. Update as the product evolves (edit data.ts → regenerate).'],
        ['Before meetings',     'Check BRAND-LOCK.md Section 5 (Numerical Claims Registry) before investor conversations.'],
      ],
    },
    {
      title: '5b. EXPENSES → FUNDING ASK FLOW', color: C.CORAL, items: [
        ['Big picture',          'EXPENSES tab is where you specify HOW much you spend on WHAT. FUNDING ASK tab summarizes that into a single number to raise.'],
        ['Categories drive it',  'The 5 buckets on FUNDING ASK (Legal, Ops, Marketing, Compliance, People) correspond 1:1 to the Category column on EXPENSES. Same category names — must match exactly.'],
        ['Operations & Tools',   'SaaS subscriptions you pay every month (Vercel, Supabase, Claude, IDEs, etc.) plus any one-time setup costs. Funding ask uses 12 months of subscription cost.'],
        ['Marketing & Launch',   'Conference booth, ads, marketing materials. 12 months of social/Google ads + one-time launch ads + conference one-time costs.'],
        ['Compliance & Tax',     'CPA filing, Delaware franchise tax, state franchise tax, business insurance (D&O / E&O / GL), Puzzle.io (free for now), R&D tax credit prep. 12 months of recurring + one-time setup.'],
        ['Legal & Formation',    'Atlas $500 + attorney consultations + IP assignments + ToS/Privacy review + trademark filings. Mostly one-time.'],
        ['People & Admin',       'Co-founder stipends + contractor placeholders + test tools. Currently $0 baseline — activate by editing values on EXPENSES.'],
      ],
    },
    {
      title: '6.  BRAND TERMINOLOGY (BRAND-LOCK.md)', color: C.CORAL, items: [
        ['Marketplace',     'Two-sided negotiation platform. Single nav link. Tabs inside = Listings + Wishes.'],
        ['Listing',         'Owner property + dates posted for rent. DB: listings table.'],
        ['Wish',            'Traveler open call — destination, dates, budget. DB: travel_requests. Never "RAV Wish" in UI.'],
        ['Offer',           'Proposed deal at a price. Both directions. DB: listing_bids OR travel_proposals. Never "Bid"/"Proposal" in UI.'],
        ['My Rentals',      'Owner dashboard nav label. Formerly Owner Edge / RAV Edge.'],
        ['RAV Insights',    'Executive dashboard. Formerly RAV Command.'],
        ['RAV Ops',         'Admin operations dashboard. Formerly Admin Dashboard.'],
        ['Savings claim',   'Save 20-40% vs resort-direct [ARDA data]. Never say 50-70% or up to 70%.'],
      ],
    },
    {
      title: '7.  GLOSSARY', color: C.SLATE, items: [
        ['GMV / GBV',       'Gross Merchandise/Booking Value — total dollar value of all bookings.'],
        ['Take Rate',       'RAV commission as % of GBV. Currently ~15% blended.'],
        ['Blended Rate',    'Weighted commission across Free (15%), Pro (13%), Business (10%) tiers.'],
        ['Offer Rate',      'Proportion of Offers submitted that result in confirmed bookings.'],
        ['CAC',             'Customer Acquisition Cost — marketing spend ÷ new users acquired.'],
        ['LTV',             'Lifetime Value — average revenue per user over their platform lifecycle.'],
        ['Runway',          'Months the business can operate before running out of cash.'],
        ['Break-Even',      'Month when monthly revenue first exceeds monthly costs.'],
        ['One-Time Cost',   'Paid once. Appears only in its Start Month.'],
        ['Recurring Cost',  'Paid regularly. Appears every month between Start and End Month.'],
      ],
    },
  ];

  let r = 3;
  sections.forEach((sec) => {
    ws.getRow(r).height = 30;
    const bn = banner(ws, r, 2, 3, sec.title, sec.color as never, C.WHITE, 11, true);
    bn.alignment = { horizontal: 'left', vertical: 'middle' };
    r++;
    sec.items.forEach((item) => {
      ws.getRow(r).height = 30;
      const lblCell = ws.getCell(r, 3);
      styleCell(lblCell, C.TEAL_LIGHT, C.DEEP_TEAL, 10, true, 'left');
      lblCell.value = item[0];
      const valCell = ws.getCell(r, 4);
      styleCell(valCell, C.CREAM, C.NAVY, 10, false, 'left', true);
      valCell.value = item[1];
      r++;
    });
    ws.getRow(r++).height = 10;
  });

  ws.getRow(r).height = 24;
  banner(ws, r, 2, 3, 'Projections are estimates. Not financial or legal advice. Consult qualified advisors.', C.RED_LIGHT, C.RED, 9, false).alignment = { horizontal: 'left', vertical: 'middle' };
}
