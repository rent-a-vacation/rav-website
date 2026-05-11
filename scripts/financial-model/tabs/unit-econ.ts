import type { Workbook } from 'exceljs';
import { C } from '../colors.ts';
import { banner, styleCell, secHead, note, lbl, addNote, setColumnPixelWidths } from '../style.ts';

/**
 * UNIT ECONOMICS tab — directional CAC, LTV, payback metrics derived from
 * the 24-month projection. Uses INDEX/MATCH against row labels in REVENUE
 * MODEL so this tab survives row reordering in revenue.ts.
 *
 * NOTE: this is a "ballpark" view, not investor-grade cohort accounting.
 * For diligence-grade unit econ, cohort-level LTV/CAC tracking would
 * require restructuring the model around cohort vintages. Adequate for
 * pre-revenue planning + first investor conversations.
 */

// INDEX/MATCH wrapper — pulls a whole row from REVENUE MODEL by label,
// returning either SUM of all 24 monthly columns or just one month.
const matchRow = (label: string) =>
  `INDEX('REVENUE MODEL'!D:AA,MATCH("${label}",'REVENUE MODEL'!C:C,0),0)`;

const sumRow = (label: string) => `SUM(${matchRow(label)})`;

export function buildUnitEconTab(wb: Workbook): void {
  const ws = wb.addWorksheet('UNIT ECON', { properties: { tabColor: { argb: C.EMERALD } } });

  setColumnPixelWidths(ws, [20, 30, 320, 160, 320]);

  ws.getRow(1).height = 52;
  banner(ws, 1, 2, 4, 'RAV UNIT ECONOMICS — LTV, CAC, Payback', C.NAVY, C.EMERALD, 16, true);
  ws.getRow(2).height = 22;
  banner(ws, 2, 2, 4, '24-month projection averages. Directional, not cohort-grade — see note at bottom.', C.EMERALD_LITE, C.EMERALD, 9, false);
  ws.getRow(3).height = 8;

  let r = 4;

  // ─── Section 1: Lifetime Value ────────────────────────────────────────────
  secHead(ws, r++, 2, 4, '  1.  LIFETIME VALUE (LTV)  —  derived from 24-month totals × user lifetime');

  // Helper for one metric row: label | value | inline hint | optional hover.
  // The hover is OPTIONAL and should only be supplied when it adds info
  // beyond what's visible inline — e.g., breaking down what's actually in
  // a totaled number, or pointing to business context the formula doesn't
  // capture. Don't supply a hover just for the sake of having one.
  const metric = (label: string, formula: string, fmt: string, hint: string, highlight = false, hover?: string) => {
    ws.getRow(r).height = 26;
    const lblCell = ws.getCell(r, 3);
    styleCell(lblCell, highlight ? C.DEEP_TEAL : C.SAND, highlight ? C.WHITE : C.NAVY, 10, highlight, 'left');
    lblCell.value = label;
    const valCell = ws.getCell(r, 4);
    styleCell(valCell, highlight ? C.EMERALD : C.TEAL_LIGHT, highlight ? C.WHITE : C.NAVY, highlight ? 12 : 10, true, 'right');
    valCell.value = { formula } as never;
    valCell.numFmt = fmt;
    if (hover) addNote(valCell, hover);
    const hintCell = ws.getCell(r, 5);
    styleCell(hintCell, C.WHITE, C.SLATE, 9, false, 'left', true);
    hintCell.value = hint;
    r++;
  };

  // Owner LTV
  ws.getRow(r).height = 24;
  ws.mergeCells(r, 3, r, 4);
  const ownHdr = ws.getCell(r, 3);
  styleCell(ownHdr, C.TEAL_MID, C.NAVY, 10, true, 'left');
  ownHdr.value = '  Owner Side';
  r++;

  metric('24-mo Total Net Commission Revenue', sumRow('Net Commission Revenue'), '$#,##0', 'Sum of monthly Net Commission across 24 months', false,
    'Calculation: sum of the Net Commission Revenue row from REVENUE MODEL across months 1-24.\n\nIn plain terms: total commission RAV keeps from bookings over 24 months, after Stripe processing fees. On a $2,000 booking at 15%, RAV gets ~$300 gross, ~$233 net after Stripe (~$67 fee).');
  metric('24-mo Sum of Active Owner-Months', sumRow('Active Owners'), '#,##0.0', 'SUM of monthly Active Owners count (proxy for owner exposure)', false,
    'Calculation: sum of the Active Owners count across all 24 monthly columns on REVENUE MODEL.\n\nIn plain terms: total owner-months of activity. If 5 owners are each active for 12 months, that\'s 60 owner-months. Used as the denominator for per-owner metrics.');
  metric('Avg Net Commission per Owner-Month', `IFERROR(${sumRow('Net Commission Revenue')}/${sumRow('Active Owners')},0)`, '$#,##0.00', 'Per-owner monthly contribution from booking commission', false,
    'Calculation: (24-mo Total Net Commission) ÷ (24-mo Sum of Active Owner-Months).\n\nIn plain terms: how much commission each active owner generates per month, on average. The core per-owner economic contribution. To raise: grow per-owner booking frequency (gBookPerOwn) or commission rate.');
  metric('24-mo Total Owner Subscription Rev', `${sumRow('    Owner Pro subscriptions')}+${sumRow('    Owner Business subscriptions')}`, '$#,##0', 'Owner Pro + Owner Business subscription revenue', false,
    'Calculation: sum of the Owner Pro + Owner Business subscription rows on REVENUE MODEL across 24 months.\n\nIn plain terms: money owners pay for paid tier features. Pro = $10/mo, Business = $25/mo. Free-tier owners contribute $0. Shift the mix on INPUTS C rows 36-37 to grow this.');
  metric('Avg Owner Subscription Rev / Owner-Month', `IFERROR((${sumRow('    Owner Pro subscriptions')}+${sumRow('    Owner Business subscriptions')})/${sumRow('Active Owners')},0)`, '$#,##0.00', 'Per-owner monthly subscription revenue', false,
    'Calculation: (24-mo Total Owner Subscription Rev) ÷ (24-mo Sum of Active Owner-Months).\n\nIn plain terms: average monthly subscription revenue per active owner, blended across all tiers. Smaller than commission per owner but more predictable. 100% Free-tier base zeros this out.');
  metric('Owner LTV', `(IFERROR(${sumRow('Net Commission Revenue')}/${sumRow('Active Owners')},0)+IFERROR((${sumRow('    Owner Pro subscriptions')}+${sumRow('    Owner Business subscriptions')})/${sumRow('Active Owners')},0))*uOwnLife`, '$#,##0', '(Avg monthly revenue per owner) × Average Owner Lifetime (uOwnLife)', true,
    'Calculation: (Avg commission per owner-month + Avg subscription per owner-month) × uOwnLife (default 24 months).\n\nIn plain terms: total revenue RAV expects from each owner over their entire platform lifetime. The headline marketplace metric. To raise: extend uOwnLife (INPUTS H), grow bookings, or raise commission rate.');

  r++;

  // Traveler LTV
  ws.getRow(r).height = 24;
  ws.mergeCells(r, 3, r, 4);
  const travHdr = ws.getCell(r, 3);
  styleCell(travHdr, C.TEAL_MID, C.NAVY, 10, true, 'left');
  travHdr.value = '  Traveler Side';
  r++;

  metric('24-mo Total Traveler Subscription Rev', `${sumRow('    Traveler Plus subscriptions')}+${sumRow('    Traveler Premium subscriptions')}`, '$#,##0', 'Traveler Plus + Premium subscription revenue', false,
    'Calculation: sum of Traveler Plus + Traveler Premium subscription rows on REVENUE MODEL across 24 months.\n\nIn plain terms: money travelers pay for paid tiers. Plus = $5/mo, Premium = $15/mo. Premium gets unlimited voice — the natural upsell hook when Plus users hit voice quota.');
  metric('24-mo Sum of Active Traveler-Months', sumRow('Active Travelers'), '#,##0.0', 'SUM of monthly Active Travelers', false,
    'Calculation: sum of the Active Travelers count across all 24 monthly columns on REVENUE MODEL.\n\nIn plain terms: total traveler-months of activity. Denominator for per-traveler metrics. Travelers typically outnumber owners ~3:1, so this absolute number is much larger.');
  metric('Avg Traveler Sub Rev / Traveler-Month', `IFERROR((${sumRow('    Traveler Plus subscriptions')}+${sumRow('    Traveler Premium subscriptions')})/${sumRow('Active Travelers')},0)`, '$#,##0.00', 'Per-traveler monthly subscription revenue', false,
    'Calculation: (24-mo Total Traveler Subscription Rev) ÷ (24-mo Sum of Active Traveler-Months).\n\nIn plain terms: average monthly subscription per active traveler. Smaller than owner equivalent because tier prices are lower ($5/$15 vs $10/$25). Mostly $0 if user base is heavily Free-tier.');
  metric('24-mo Voice Overage Revenue', sumRow('    Voice Overage Revenue'), '$#,##0', 'Voice/AI overage from non-Premium travelers', false,
    'Calculation: sum of the Voice Overage Revenue row from REVENUE MODEL across 24 months. Per month: Active Travelers × (1 − gTrav2 Premium %) × uVoiceOverage.\n\nIn plain terms: revenue from voice-AI usage by non-Premium travelers. Modeled conservatively at $0.50/traveler/mo. Could be 2-5x higher with strong voice adoption.');
  metric('Avg Voice Rev / Traveler-Month', `IFERROR(${sumRow('    Voice Overage Revenue')}/${sumRow('Active Travelers')},0)`, '$#,##0.00', 'Per-traveler monthly voice overage', false,
    'Calculation: (24-mo Voice Overage Revenue) ÷ (24-mo Sum of Active Traveler-Months).\n\nIn plain terms: average voice overage per active traveler per month. Flat-rate input — doesn\'t scale with usage. To raise: bump uVoiceOverage (INPUTS H) or shift travelers to Premium where voice is bundled.');
  metric('Traveler LTV', `(IFERROR((${sumRow('    Traveler Plus subscriptions')}+${sumRow('    Traveler Premium subscriptions')})/${sumRow('Active Travelers')},0)+IFERROR(${sumRow('    Voice Overage Revenue')}/${sumRow('Active Travelers')},0))*uTravLife`, '$#,##0', '(Avg monthly revenue per traveler) × Avg Traveler Lifetime (uTravLife)', true,
    'Calculation: (Avg subscription per traveler-month + Avg voice overage per traveler-month) × uTravLife (default 18 months).\n\nIn plain terms: total revenue from each traveler over their platform lifetime. Usually lower than Owner LTV — travelers pay smaller subscriptions and churn faster (18mo vs 24mo).');

  r += 2;

  // ─── Section 2: CAC ───────────────────────────────────────────────────────
  secHead(ws, r++, 2, 4, '  2.  CUSTOMER ACQUISITION COST (CAC)  —  Blended');

  // Marketing spend (one-time + monthly × 24)
  metric('24-mo Total Marketing Spend',
    `SUMIFS(EXPENSES!F:F,EXPENSES!C:C,"Marketing & Launch",EXPENSES!E:E,"One-Time")+SUMIFS(EXPENSES!J:J,EXPENSES!C:C,"Marketing & Launch",EXPENSES!E:E,"Recurring")*24`,
    '$#,##0', 'One-time marketing + (monthly recurring marketing × 24 months)', false,
    'Calculation: SUMIFS on EXPENSES — one-time Marketing rows (full amount) + recurring Marketing rows (monthly × 24).\n\nIn plain terms: every dollar spent attracting new users. Conference dominates one-time (registration + travel + booth = ~$5K). Sustained ads at ~$350/mo (social $200 + Google $150). Edit Marketing rows on EXPENSES to shift.');

  metric('Net New Owners (24mo)',
    `INDEX('REVENUE MODEL'!AA:AA,MATCH("Active Owners",'REVENUE MODEL'!C:C,0))-INDEX('REVENUE MODEL'!D:D,MATCH("Active Owners",'REVENUE MODEL'!C:C,0))`,
    '#,##0.0', 'Active Owners (Mo 24) − Active Owners (Mo 1). Under-counts due to churn.', false,
    'Calculation: Active Owners count at Mo 24 (column AA on REVENUE MODEL) minus Active Owners at Mo 1 (column D).\n\nIn plain terms: how many MORE owners exist at the end of the model vs the start. Simple delta — does NOT count owners who joined then churned within the 24 months. Used as a CAC denominator approximation.');

  metric('Net New Travelers (24mo)',
    `INDEX('REVENUE MODEL'!AA:AA,MATCH("Active Travelers",'REVENUE MODEL'!C:C,0))-INDEX('REVENUE MODEL'!D:D,MATCH("Active Travelers",'REVENUE MODEL'!C:C,0))`,
    '#,##0.0', 'Active Travelers (Mo 24) − Active Travelers (Mo 1). Under-counts due to churn.', false,
    'Calculation: Active Travelers count at Mo 24 minus Active Travelers at Mo 1. Same logic as Net New Owners.\n\nIn plain terms: more active travelers at end vs start. Typically much larger than Net New Owners — traveler signup friction is lower. Net of churn within the window, not gross acquisitions.');

  // CAC = total marketing / total new users (blended)
  metric('Blended CAC',
    `IFERROR((SUMIFS(EXPENSES!F:F,EXPENSES!C:C,"Marketing & Launch",EXPENSES!E:E,"One-Time")+SUMIFS(EXPENSES!J:J,EXPENSES!C:C,"Marketing & Launch",EXPENSES!E:E,"Recurring")*24)/((INDEX('REVENUE MODEL'!AA:AA,MATCH("Active Owners",'REVENUE MODEL'!C:C,0))-INDEX('REVENUE MODEL'!D:D,MATCH("Active Owners",'REVENUE MODEL'!C:C,0)))+(INDEX('REVENUE MODEL'!AA:AA,MATCH("Active Travelers",'REVENUE MODEL'!C:C,0))-INDEX('REVENUE MODEL'!D:D,MATCH("Active Travelers",'REVENUE MODEL'!C:C,0)))),0)`,
    '$#,##0', 'Total marketing spend ÷ total net new users. Healthy benchmark: < 1/3 of LTV.', true,
    'Calculation: (24-mo Total Marketing Spend) ÷ (Net New Owners + Net New Travelers).\n\nIn plain terms: average dollar cost to acquire one new user. If this exceeds 1/3 of LTV you\'re spending more than you\'ll recover — unsustainable. Improve via organic growth (referrals), conversion, channel mix.');

  r += 2;

  // ─── Section 3: LTV/CAC + Payback ────────────────────────────────────────
  secHead(ws, r++, 2, 4, '  3.  LTV/CAC RATIO + PAYBACK PERIOD');
  ws.getRow(r).height = 22;
  note(ws, r++, 2, 4, 'Healthy SaaS benchmark: LTV/CAC > 3:1, payback < 12 months. Lower ratios = burn-funded growth.');

  // Row references for cross-section formulas. Use a BOUNDED range ($D$1:$D$30)
  // rather than D:D — Excel treats whole-column references that include the
  // formula's own row as circular, even though INDEX resolves to a specific
  // cell that's not the formula itself. Rows 1-30 cover all the data rows
  // (Owner LTV at 11, Traveler LTV at 23, Blended CAC at 26) while excluding
  // the LTV/CAC + Payback formulas below at rows 32+.
  const lookupRange = '$D$1:$D$30';
  const labelRange  = '$C$1:$C$30';
  const ownerLtvRef = `INDEX(${lookupRange},MATCH("Owner LTV",${labelRange},0))`;
  const travLtvRef  = `INDEX(${lookupRange},MATCH("Traveler LTV",${labelRange},0))`;
  const cacRef      = `INDEX(${lookupRange},MATCH("Blended CAC",${labelRange},0))`;

  metric('Owner LTV / CAC', `IFERROR(${ownerLtvRef}/${cacRef},0)`, '0.00"x"', 'Owner LTV ÷ Blended CAC. >3x is healthy.', true,
    'Calculation: Owner LTV ÷ Blended CAC (both above on this tab).\n\nIn plain terms: for every $1 RAV spends acquiring an owner, this many dollars come back over their lifetime. 3x = healthy seed-stage. 5x+ = exceptional. Below 1x = unsustainable. Improve via higher Owner LTV or lower CAC.');
  metric('Traveler LTV / CAC', `IFERROR(${travLtvRef}/${cacRef},0)`, '0.00"x"', 'Traveler LTV ÷ Blended CAC. Travelers churn faster — lower ratio expected.', true,
    'Calculation: Traveler LTV ÷ Blended CAC.\n\nIn plain terms: same ratio for travelers. Usually lower than the owner ratio — travelers pay smaller subscriptions and churn faster. Should still cover acquisition cost (>1x). Below 1x = traveler side is structurally unprofitable.');

  // Payback months = CAC / blended monthly revenue per user
  // Blended monthly rev per user = (Total Revenue / Total User-Months)
  const totUserMonths = `(${sumRow('Active Owners')}+${sumRow('Active Travelers')})`;
  const blendedMRPU = `IFERROR(${sumRow('TOTAL MONTHLY REVENUE')}/${totUserMonths},0)`;
  metric('Blended Monthly Revenue per User', blendedMRPU, '$#,##0.00', 'Total 24-mo revenue ÷ total user-months.', false,
    'Calculation: (24-mo Total Monthly Revenue from REVENUE MODEL) ÷ (Active Owner-Months + Active Traveler-Months).\n\nIn plain terms: average revenue RAV earns per active user per month, blended across all types. Aggregates all revenue divided by all user-months. Drops over time if growth outpaces monetization.');
  metric('Payback Period (months)', `IFERROR(${cacRef}/${blendedMRPU},0)`, '0.0" mo"', 'CAC ÷ Monthly Revenue per User. <12mo is healthy seed-stage.', true,
    'Calculation: Blended CAC ÷ Blended Monthly Revenue per User.\n\nIn plain terms: how many months until RAV earns back the cost of acquiring a single user. <12mo = healthy at seed stage. 12-18mo = acceptable. >24mo = burn-funded growth, needs deeper pockets or higher LTV.');

  r += 2;

  // Footer note
  ws.getRow(r).height = 60;
  banner(ws, r, 2, 4, 'Directional metrics — assumes uniform user behavior, ignores cohort vintages. For investor diligence, request cohort retention curves and per-channel CAC. Voice overage revenue is included in Total Monthly Revenue but excluded from Owner LTV (attributed to travelers).', C.AMBER_LIGHT, C.AMBER, 9, false);
}
