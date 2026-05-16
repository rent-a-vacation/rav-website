"""
Generate the investor FAQ — Q&A markdown for founder conversations with
advisors / mentors / potential investors.

Output: docs/exports/RAV-investor-faq-YYYY-MM-DD.md

Answers ~10 questions an investor actually asks. Each answer is pulled live
from the same financial model the .xlsx + web dashboard use — never out of
sync. Format is literal Q + A so the founder can read straight from it.

Companion to:
- /generate-docs --pitch-brief (narrative)
- /generate-docs --spend-brief (cost summary)
- npm run financials:build (.xlsx + this FAQ — bundled by default)

Run:  python docs/exports/generate_investor_faq.py
Or:   npm run docs:gen:investor-faq
Or:   /generate-docs --investor-faq
"""

from __future__ import annotations

import json
import subprocess

from _compose import (
    PROJECT_ROOT,
    disclaimer,
    frontmatter_block,
    git_ref_for,
    head_sha,
    repo_path,
    source_table,
    today_iso,
    today_long,
    write_snapshot,
)


def dump_faq() -> dict:
    """Run the TS dump script and parse the JSON output."""
    try:
        out = subprocess.check_output(
            "npx tsx scripts/financial-model/dump-investor-faq.ts",
            cwd=PROJECT_ROOT,
            shell=True,
            timeout=120,
        ).decode("utf-8")
        return json.loads(out)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, json.JSONDecodeError) as e:
        raise RuntimeError(f"Failed to dump investor FAQ data: {e}")


def fmt_money(n: float) -> str:
    if abs(n) >= 1_000_000 and abs(n - round(n)) < 0.01:
        return f"${round(n / 1000):,}K"
    if abs(n) >= 100 and abs(n - round(n)) < 0.01:
        return f"${round(n):,}"
    return f"${n:,.0f}" if abs(n) >= 100 else f"${n:,.2f}"


def fmt_pct(n: float, decimals: int = 0) -> str:
    """Format a percent. Handle floating-point artifacts (e.g., 7.999... -> 8%)."""
    rounded = round(n, decimals)
    if decimals == 0:
        return f"{int(rounded)}%"
    return f"{rounded:.{decimals}f}%"


def render_q(num: int, question: str, answer: str) -> str:
    return f"### Q{num}. {question}\n\n{answer}\n\n"


def generate_investor_faq() -> str:
    today = today_iso()
    long_date = today_long()
    head = head_sha() or "unknown"

    d = dump_faq()

    sources = [
        ("Financial model — all inputs", "src/lib/financial-model/data.ts", git_ref_for(repo_path("src/lib/financial-model/data.ts"))),
        ("Projection calculator", "src/lib/financial-model/calc.ts", git_ref_for(repo_path("src/lib/financial-model/calc.ts"))),
        ("Commission constants", "src/config/commission.ts", git_ref_for(repo_path("src/config/commission.ts"))),
        ("FAQ dump script", "scripts/financial-model/dump-investor-faq.ts", git_ref_for(repo_path("scripts/financial-model/dump-investor-faq.ts"))),
        ("Pricing & accounting framework", "docs/RAV-PRICING-TAXES-ACCOUNTING.md", git_ref_for(repo_path("docs/RAV-PRICING-TAXES-ACCOUNTING.md"))),
    ]

    base = next((p for p in d["projections"] if p["scenario"] == "Base"), None)
    conservative = next((p for p in d["projections"] if p["scenario"] == "Conservative"), None)
    optimistic = next((p for p in d["projections"] if p["scenario"] == "Optimistic"), None)

    body: list[str] = []
    body.append(frontmatter_block(change_type=f"snapshot-investor-faq-{today}"))
    body.append(f"# RAV — Investor FAQ — {long_date}\n\n")
    body.append(
        f"> 10 questions an investor actually asks, answered from the same live model "
        f"the .xlsx + `/executive-dashboard/financial-model` use. Pre-launch posture: "
        f"all projections are forward-looking; actuals not yet live (model month 1 = May 2026; "
        f"today is **{d['today_calendar_label']}**, model month **{d['today_model_month']}**).\n\n"
    )
    body.append(disclaimer())
    body.append("\n---\n\n")

    # Q1 — Commission structure
    commission = d["commission"]
    eff = commission["effective_rates_pct"]
    body.append(render_q(
        1,
        "What is RAV's commission structure?",
        f"**{fmt_pct(commission['base_pct'])} base commission** on every booking, with tier discounts:\n\n"
        f"- **Free Owner:** {fmt_pct(eff['free'])} effective\n"
        f"- **Owner Pro ($10/mo subscription):** {fmt_pct(eff['pro'])} effective ({fmt_pct(commission['pro_discount_pp'])} discount off base)\n"
        f"- **Owner Business ($25/mo subscription):** {fmt_pct(eff['business'])} effective ({fmt_pct(commission['business_discount_pp'])} discount off base)\n\n"
        f"Live source: `{commission['runtime_source']}`. Admin-editable via the System Settings tab "
        f"(audit-logged per change). Every booking persists the rate that was in effect at booking time "
        f"(`bookings.commission_rate_applied`), so historical accounting is preserved when rates change."
    ))

    # Q2 — Subscription tiers
    subs_lines = "\n".join(
        f"- **{s['label'].replace(' ($/mo)', '')}:** ${s['price_usd']}/mo"
        for s in d["subscriptions"]
    )
    body.append(render_q(
        2,
        "What are RAV's subscription tiers and pricing?",
        f"Four paid tiers + free:\n\n"
        f"- **Traveler Free:** $0/mo\n"
        f"{subs_lines}\n\n"
        f"Traveler tiers gate voice-search quota and other discovery features. Owner tiers gate "
        f"listing limits + commission discount. All managed via Stripe subscriptions (Customer Portal "
        f"for self-service). Source of truth for prices is the `membership_tiers` DB table — frontend "
        f"reads via `useMembership` hooks (no hardcoded prices in code)."
    ))

    # Q3 — Monthly burn
    burn = d["burn"]
    top_cats_lines = "\n".join(
        f"  - {c['category']}: {fmt_money(c['amount'])} ({c['pct']:.0f}%)"
        for c in burn["top_categories"]
    )
    body.append(render_q(
        3,
        "What's RAV's monthly burn right now and going forward?",
        f"**Today ({d['today_calendar_label']}): {fmt_money(burn['today_total'])}/mo.** Front-loaded "
        f"with one-time legal/formation costs (~$2,500 for Delaware C-Corp via Stripe Atlas + "
        f"attorney consultation + trademarks).\n\n"
        f"**Steady-state burn (post-incorporation, recurring only): {fmt_money(burn['steady_state'])}/mo.**\n\n"
        f"Top cost categories this month:\n{top_cats_lines}\n\n"
        f"What's NOT in this number: founder salaries ($0 until funded), Stripe processing fees "
        f"(variable, % of GMV), Stripe Tax (0.5% per transaction, variable), hires (none planned "
        f"pre-funding)."
    ))

    # Q4 — Break-even
    def be_line(p):
        if p["breakEvenMonth"] is None:
            return f"**{p['scenario']}:** Does not break even in the 24-month horizon (needs more cash or growth)."
        return f"**{p['scenario']}:** Month {p['breakEvenMonth']} ({p['breakEvenLabel']}) — cumulative cash crosses zero."

    body.append(render_q(
        4,
        "When does RAV break even?",
        f"Per scenario in the 24-month model:\n\n"
        f"- {be_line(conservative)}\n"
        f"- {be_line(base)}\n"
        f"- {be_line(optimistic)}\n\n"
        f"Break-even is defined as the model month where **cumulative cash on hand crosses zero** "
        f"(cumulative revenue − cumulative costs >= starting cash + funding inflow). The 24-month "
        f"horizon means we don't see further out without re-projecting; if a scenario doesn't break "
        f"even in 24mo, it does require a funding round to extend runway."
    ))

    # Q5 — 24-month GBV + revenue
    body.append(render_q(
        5,
        "What's the projected GMV and revenue at 24 months?",
        f"All in USD; per scenario over 24 months:\n\n"
        f"| Scenario | GBV (gross booking value) | Net commission revenue | Total revenue | Total costs | Net profit/(loss) |\n"
        f"|---|---|---|---|---|---|\n"
        + "".join(
            f"| {p['scenario']} | {fmt_money(p['totalGBV24mo'])} | {fmt_money(p['totalCommissionNet24mo'])} | "
            f"{fmt_money(p['totalRevenue24mo'])} | {fmt_money(p['totalCosts24mo'])} | "
            f"{fmt_money(p['totalProfit24mo'])} |\n"
            for p in [conservative, base, optimistic]
        )
        + f"\n*Total revenue* = net commission + subscription revenue + voice-overage revenue. "
        f"*GBV* is the gross dollars travelers pay (RAV keeps commission; rest flows to owners as "
        f"payout). These are forward projections from the model — actuals will be live once launch "
        f"happens (Month 5, around Sep 2026)."
    ))

    # Q6 — Revenue mix
    base_blended = (base or {}).get("blendedCommissionRate", 0) * 100 if base else 0
    body.append(render_q(
        6,
        "What's the revenue mix — commission vs. subscription?",
        f"Three revenue streams:\n\n"
        f"1. **Commission per booking** — {fmt_pct(commission['base_pct'])} base, tier-discounted. "
        f"Base scenario shows a **blended rate of {base_blended:.1f}%** across all bookings (weighted by Free/Pro/Business owner mix).\n"
        f"2. **Subscription revenue** — recurring MRR from Plus/Premium/Pro/Business tiers ($5-$25/mo).\n"
        f"3. **Voice-overage revenue** — per-traveler/mo for voice usage beyond tier quota (Plus/Free).\n\n"
        f"Commission is the dominant revenue stream once booking volume scales. Subscriptions are the "
        f"steady-floor revenue (predictable MRR). Voice-overage is incremental and adoption-dependent."
    ))

    # Q7 — Funding ask
    funding = d["funding"]
    if funding["amount_usd"] > 0 and funding["month"] > 0:
        funding_answer = (
            f"**Funding inflow modeled:** {fmt_money(funding['amount_usd'])} arriving in Model Month "
            f"{funding['month']} ({funding['month_calendar_label']}).\n\n"
            f"**Starting cash on hand:** {fmt_money(funding['starting_cash'])}.\n\n"
            f"**Founder comp post-funding:** {fmt_money(funding['founder_comp_per_month'])}/founder/mo "
            f"× {int(funding['founder_count'])} founder(s) = "
            f"{fmt_money(funding['founder_comp_per_month'] * funding['founder_count'])}/mo.\n\n"
            f"What the funding buys: ~{int(funding['amount_usd'] / 50000)} 'founder-months' at the modeled "
            f"comp rate, plus hiring slots in the model (engineer, support, BD — currently dormant)."
        )
    else:
        funding_answer = (
            f"**No funding round currently modeled.** Founders are operating on:\n\n"
            f"- Starting cash: {fmt_money(funding['starting_cash'])} (likely founder loan or self-funded)\n"
            f"- Founder comp: {fmt_money(funding['founder_comp_per_month'])}/founder/mo "
            f"(${int(funding['founder_comp_per_month'])} = $0 → founders unpaid until funded)\n"
            f"- Founded? **{'Yes' if funding['funded_flag'] else 'No (toggle in model)'}**\n\n"
            f"Funding ask scope: the model has slots for funding inflow + founder comp + 3 hire roles "
            f"(engineer ~$12K/mo burdened, support ~$6K/mo, BD ~$9K/mo). All dormant pending a raise "
            f"decision. Edit `src/lib/financial-model/data.ts` Sections F-G to set funding amount + hire months."
        )

    body.append(render_q(7, "What's RAV's funding ask?", funding_answer))

    # Q8 — User/booking growth
    def snap_row(p, mo: int):
        snap = next((s for s in p["snapshots"] if s["month"] == mo), None)
        if not snap:
            return f"| {p['scenario']} | Mo {mo} | _no data_ | _no data_ | _no data_ |"
        return (
            f"| {p['scenario']} | Mo {snap['month']} ({snap['calendarLabel']}) | "
            f"{snap['activeOwners']:.0f} | {snap['activeTravelers']:.0f} | {snap['bookings']:.1f} |"
        )

    body.append(render_q(
        8,
        "How many users and bookings does the model project?",
        f"Per-scenario snapshots at Month 6, 12, 18, 24:\n\n"
        f"| Scenario | Month | Active owners | Active travelers | Bookings (that month) |\n"
        f"|---|---|---|---|---|\n"
        + "".join(
            "\n".join(snap_row(p, mo) for mo in [6, 12, 18, 24]) + "\n"
            for p in [conservative, base, optimistic]
        )
        + f"\nGrowth rates are model assumptions — defaults: 20% MoM owners, 30% MoM travelers, "
        f"0.3 bookings/owner/month. Edit `src/lib/financial-model/data.ts` Section C to tune these. "
        f"Each owner is assumed to stay active ~24 months (per Section H unit econ). Each booking is "
        f"~7 nights × ${d['context']['avg_booking_value']:,.0f} avg booking value."
    ))

    # Q9 — Cost structure (lighter than --spend-brief; just top categories)
    body.append(render_q(
        9,
        "What's RAV's cost structure?",
        f"Five expense categories, totaling {len(d.get('burn', {}).get('top_categories', []))} categories with spend today:\n\n"
        + "".join(
            f"- **{c['category']}:** {fmt_money(c['amount'])}/mo today ({c['pct']:.0f}% of current burn)\n"
            for c in burn["top_categories"]
        )
        + f"\nNote: Month 1 ({d['today_calendar_label']}) is heavily weighted toward Legal & Formation "
        f"due to one-time incorporation costs (DE C-Corp via Stripe Atlas, attorney, trademarks). "
        f"Once those clear, the steady-state run-rate is **{fmt_money(burn['steady_state'])}/mo** and "
        f"is dominated by Operations & Tools (Vercel, Supabase, AI APIs, IDE subscriptions). "
        f"For a per-row breakdown of all ~47 expense items, see `/generate-docs --spend-brief` or "
        f"the `EXPENSES` section in `scripts/financial-model/data.ts`."
    ))

    # Q10 — Unit economics
    ue = d["unit_econ"]
    body.append(render_q(
        10,
        "What are the unit economics — owner LTV, traveler LTV, cohort ramp?",
        f"From the financial model's Section H:\n\n"
        f"- **Average owner lifetime:** {int(ue['avg_owner_lifetime_months'])} months "
        f"(~{100 / ue['avg_owner_lifetime_months']:.0f}% monthly churn equivalent)\n"
        f"- **Average traveler lifetime:** {int(ue['avg_traveler_lifetime_months'])} months\n"
        f"- **Cohort ramp:** new cohorts hit full booking velocity over "
        f"{int(ue['cohort_ramp_months'])} month(s) (gradual onboarding curve)\n"
        f"- **Voice-overage revenue:** ${ue['voice_overage_per_traveler_per_month']:.2f} per "
        f"active non-Premium traveler per month (conservative; scales with adoption post-launch)\n\n"
        f"**Owner LTV** ≈ owner lifetime × bookings/mo × avg booking value × commission rate. "
        f"At Base scenario assumptions (24mo lifetime × 0.3 bookings/mo × $2,000/booking × "
        f"{base_blended:.1f}% blended rate) that's ~${24 * 0.3 * 2000 * base_blended/100:,.0f} "
        f"per owner. **Traveler LTV** is harder to pin pre-launch; we'll know better once we have "
        f"real cohort data (#545 = live actuals overlay)."
    ))

    body.append("\n---\n\n")
    body.append("## What this FAQ does NOT cover\n\n")
    body.append(
        "- **Detailed P&L** — see the `.xlsx` (regenerate with `npm run financials:build`)\n"
        "- **Per-month projections** — see `/executive-dashboard/financial-model` web tool\n"
        "- **Marketplace mechanics + product** — see `/generate-docs --pitch-brief`\n"
        "- **Compliance / legal posture** — see `docs/payments/PAYSAFE-COMPLIANCE.md`\n"
        "- **Burn-only summary** — see `/generate-docs --spend-brief`\n"
        "- **Live actuals vs. forecast** — pending Stage 2b (issue #545)\n\n"
    )

    body.append("## Sources\n\n")
    body.append(source_table(sources))
    body.append("\n")

    body.append("## Verification trail\n\n")
    body.append(
        f"- **Generated by:** `docs/exports/generate_investor_faq.py` "
        f"(via `npm run docs:gen:investor-faq`, `/generate-docs --investor-faq`, or bundled with `npm run financials:build`)\n"
        f"- **HEAD at snapshot time:** `{head}`\n"
        f"- **Snapshot date:** {long_date}\n"
        f"- **Data dump timestamp:** {d['generated_at']}\n"
        f"- **Pre-launch posture:** model month 1 = May 2026 (today = model month {d['today_model_month']}); "
        f"all projection numbers are forward-looking until launch (Month 5).\n"
    )
    body.append("\n---\n\n")
    body.append(
        "_Founder-facing brief for investor conversations. "
        f"Companion to `RAV-pitch-brief-{today}.md` (narrative) and `RAV-spend-brief-{today}.md` (cost summary)._\n"
    )

    return write_snapshot(f"RAV-investor-faq-{today}.md", "".join(body))


if __name__ == "__main__":
    generate_investor_faq()
