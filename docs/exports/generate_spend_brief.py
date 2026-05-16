"""
Generate a 1-page founder-facing spend brief.

Output: docs/exports/RAV-spend-brief-YYYY-MM-DD.md

Purpose: high-level "what we expect to spend" anchor for conversations with
advisors / mentors / warm intros. Not the full .xlsx detail. Designed to be
readable in 60-90 seconds.

Composes from src/lib/financial-model/data.ts via the dump-spend-summary.ts
helper (Node script that imports the canonical EXPENSES rows and returns a
summary as JSON). Same data the .xlsx model uses — no duplication.

Run:  python docs/exports/generate_spend_brief.py
Or:   npm run docs:gen:spend-brief
Or:   /generate-docs --spend-brief  (via skill)
"""

from __future__ import annotations

import json
import os
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


def dump_summary() -> dict:
    """Run the TS dump script and parse the JSON output."""
    try:
        out = subprocess.check_output(
            "npx tsx scripts/financial-model/dump-spend-summary.ts",
            cwd=PROJECT_ROOT,
            shell=True,
            timeout=120,
        ).decode("utf-8")
        return json.loads(out)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, json.JSONDecodeError) as e:
        raise RuntimeError(f"Failed to dump spend summary: {e}")


def fmt_money(n: float) -> str:
    """$1,234 or $1,234.56 — drops cents for round dollars over $100."""
    if abs(n) >= 100 and abs(n - round(n)) < 0.01:
        return f"${round(n):,}"
    return f"${n:,.2f}"


def render_top_categories(rows: list[dict]) -> str:
    nonzero = [r for r in rows if r["amount"] > 0]
    if not nonzero:
        return "_(no recurring spend in this period)_\n"
    lines = ["| # | Category | $/mo | % of total |", "|---|---|---|---|"]
    for i, r in enumerate(nonzero, 1):
        lines.append(
            f"| {i} | {r['category']} | {fmt_money(r['amount'])} | {r['pct']:.0f}% |"
        )
    return "\n".join(lines) + "\n"


def render_curve(rows: list[dict]) -> str:
    if not rows:
        return "_(no curve data)_\n"
    lines = ["| Point | When | Monthly spend |", "|---|---|---|"]
    for r in rows:
        lines.append(f"| {r['label'].split(' (')[0]} | {r['label'].split(' (')[1].rstrip(')')} | {fmt_money(r['total'])} |")
    return "\n".join(lines) + "\n"


def generate_spend_brief() -> str:
    today = today_iso()
    long_date = today_long()
    head = head_sha() or "unknown"

    summary = dump_summary()

    recurring = summary["today_recurring_vs_onetime"]["recurring"]
    onetime = summary["today_recurring_vs_onetime"]["oneTime"]
    total_today = summary["today_total_monthly_burn"]
    steady_curve = [c for c in summary["curve"] if c["month"] >= 4]
    if steady_curve:
        steady_avg = sum(c["total"] for c in steady_curve) / len(steady_curve)
    else:
        steady_avg = recurring

    sources = [
        ("Financial model — EXPENSES rows", "src/lib/financial-model/data.ts", git_ref_for(repo_path("src/lib/financial-model/data.ts"))),
        ("Spend summary dump script", "scripts/financial-model/dump-spend-summary.ts", git_ref_for(repo_path("scripts/financial-model/dump-spend-summary.ts"))),
        ("Financial model index", "docs/financials/README.md", git_ref_for(repo_path("docs/financials/README.md"))),
    ]

    body: list[str] = []
    body.append(frontmatter_block(change_type=f"snapshot-spend-brief-{today}"))
    body.append(f"# RAV — Expected Spend (Brief) — {long_date}\n\n")
    body.append(
        f"> One-pager for advisor / mentor / warm-intro conversations. "
        f"Snapshot of what RAV expects to spend — current run-rate + 12-month curve. "
        f"For the full model, see `/executive-dashboard/financial-model` (or the gitignored `.xlsx`).\n\n"
    )
    body.append("---\n\n")

    body.append("## At a glance\n\n")
    body.append(
        f"- **Today's monthly run-rate:** **{fmt_money(total_today)}/mo** "
        f"({fmt_money(recurring)} recurring + {fmt_money(onetime)} one-time amortized into this month)\n"
        f"- **Steady-state run-rate (months 4-13):** **~{fmt_money(steady_avg)}/mo** — after the one-time incorporation + legal costs clear\n"
        f"- **No payroll** yet. Co-founder stipends = $0 until funded. Hiring plan dormant.\n"
        f"- **No revenue dependency in the spend curve** — costs are infrastructure + tools + legal + insurance, scaling gently with growth.\n"
    )
    body.append("\n")

    body.append(f"## Where the money goes today (Month {summary['model_month_today']})\n\n")
    body.append(render_top_categories(summary["today_top_5_categories"]))
    body.append("\n")

    body.append("## 12-month spend curve\n\n")
    body.append(render_curve(summary["curve"]))
    body.append(
        "\n_Why month 1 is higher than the others: ~$2,500 in one-time legal & formation costs "
        "(DE C-Corp via Stripe Atlas, attorney consultation, trademarks). These don't recur. "
        "Steady-state ops & tooling spend is ~$200-300/mo; once launch ads + insurance start, it lifts to ~$1,100/mo._\n\n"
    )

    body.append("## What's NOT in this number\n\n")
    body.append(
        "- **Founder salaries** ($0 until funded — see model Section F)\n"
        "- **Stripe processing fees** (variable, % of GMV — netted against revenue)\n"
        "- **Stripe Tax** (0.5% per transaction — variable with revenue)\n"
        "- **Hires** (none planned pre-funding; engineer + admin slots exist in model but inactive)\n"
        "- **Funding inflow / cash balance** — that's the runway view, not the spend view. See the .xlsx model for runway calc.\n"
    )
    body.append("\n")

    body.append("## How this brief is generated\n\n")
    body.append(
        "Pulled live from `src/lib/financial-model/data.ts` (the same EXPENSES rows the "
        "`.xlsx` financial model and the `/executive-dashboard/financial-model` web tool use). "
        "Regenerate any time the model changes by running `npm run docs:gen:spend-brief` or "
        "`/generate-docs --spend-brief`.\n\n"
    )

    body.append("---\n\n")
    body.append("## Sources\n\n")
    body.append(source_table(sources))
    body.append("\n")

    body.append("## Verification trail\n\n")
    body.append(
        f"- **Generated by:** `docs/exports/generate_spend_brief.py` "
        f"(via `npm run docs:gen:spend-brief` or `/generate-docs --spend-brief`)\n"
        f"- **HEAD at snapshot time:** `{head}`\n"
        f"- **Snapshot date:** {long_date}\n"
        f"- **Total expense rows in model:** {summary['total_expense_rows']}\n"
        f"- **Data dump script timestamp:** {summary['generated_at']}\n"
    )
    body.append("\n---\n\n")
    body.append(
        "_Founder-facing brief. Not for public distribution. "
        f"For the conversational pitch ('what is RAV'), see `RAV-pitch-brief-{today}.md`._\n"
    )

    return write_snapshot(f"RAV-spend-brief-{today}.md", "".join(body))


if __name__ == "__main__":
    generate_spend_brief()
