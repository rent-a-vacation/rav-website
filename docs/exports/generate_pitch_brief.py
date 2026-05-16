"""
Generate a 1-2 page founder-facing pitch brief for RAV.

Output: docs/exports/RAV-pitch-brief-YYYY-MM-DD.md

Purpose: "what is RAV / what business are we in" anchor for conversations with
advisors / mentors / warm intros. NOT a technical platform overview (that's
`/generate-docs --operating-model`). NOT investor deck (that's separate).
Designed to be readable in 60-90 seconds.

Composes a curated business-language narrative + live facts from
src/lib/financial-model/data.ts (PLATFORM_FACTS + MILESTONES).

Run:  python docs/exports/generate_pitch_brief.py
Or:   npm run docs:gen:pitch-brief
Or:   /generate-docs --pitch-brief
"""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

from _compose import (
    PROJECT_ROOT,
    frontmatter_block,
    git_ref_for,
    head_sha,
    repo_path,
    source_table,
    today_iso,
    today_long,
    write_snapshot,
)


def dump_facts() -> dict:
    """Run the TS dump script and parse the JSON output."""
    try:
        out = subprocess.check_output(
            "npx tsx scripts/financial-model/dump-platform-facts.ts",
            cwd=PROJECT_ROOT,
            shell=True,
            timeout=120,
        ).decode("utf-8")
        return json.loads(out)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, json.JSONDecodeError) as e:
        raise RuntimeError(f"Failed to dump platform facts: {e}")


def live_test_count() -> str:
    """Read test count from docs/testing/TESTING-STATUS.md (canonical source).

    The canonical doc uses a markdown table: `| **Total tests** | 1778 |`.
    """
    path = Path(PROJECT_ROOT) / "docs" / "testing" / "TESTING-STATUS.md"
    if not path.exists():
        return "—"
    text = path.read_text(encoding="utf-8")
    # Match the markdown table row for "Total tests"
    m = re.search(r"\*\*Total\s+tests\*\*\s*\|\s*(\d{3,5})", text)
    if m:
        return f"{int(m.group(1)):,}"
    # Fallback: any 'NNNN tests' or 'Total tests: NNNN' pattern
    m = re.search(r"[Tt]otal\s+tests?[\s:|*]+(\d{3,5})", text)
    if m:
        return f"{int(m.group(1)):,}"
    return "—"


def live_migration_count() -> int:
    """Count *.sql files in supabase/migrations/."""
    p = Path(PROJECT_ROOT) / "supabase" / "migrations"
    if not p.is_dir():
        return 0
    return sum(1 for f in p.iterdir() if f.name.endswith(".sql"))


def live_edge_function_count() -> int:
    """Count subdirs in supabase/functions/ (excluding _shared)."""
    p = Path(PROJECT_ROOT) / "supabase" / "functions"
    if not p.is_dir():
        return 0
    return sum(1 for d in p.iterdir() if d.is_dir() and not d.name.startswith("_"))


def live_app_version() -> str:
    """Read package.json version."""
    p = Path(PROJECT_ROOT) / "package.json"
    if not p.exists():
        return "?"
    pkg = json.loads(p.read_text(encoding="utf-8"))
    return pkg.get("version", "?")


def render_facts_table(facts: list[dict]) -> str:
    """Render PLATFORM_FACTS as a clean table."""
    if not facts:
        return "_(no facts loaded)_\n"
    lines = ["| What | Where we are |", "|---|---|"]
    for f in facts:
        label = f["label"].replace("|", "\\|")
        value = f["value"].replace("|", "\\|")
        lines.append(f"| **{label}** | {value} |")
    return "\n".join(lines) + "\n"


def render_milestones_table(milestones: list[dict]) -> str:
    if not milestones:
        return "_(no milestones loaded)_\n"
    lines = ["| When | Theme | What happens |", "|---|---|---|"]
    for m in milestones:
        when = m["when"].replace("|", "\\|")
        theme = m["theme"].replace("|", "\\|")
        desc = m["description"].replace("|", "\\|")
        lines.append(f"| {when} | **{theme}** | {desc} |")
    return "\n".join(lines) + "\n"


def generate_pitch_brief() -> str:
    today = today_iso()
    long_date = today_long()
    head = head_sha() or "unknown"

    dump = dump_facts()
    facts = dump["facts"]
    milestones = dump["milestones"]

    # Live values
    test_count = live_test_count()
    mig_count = live_migration_count()
    edge_count = live_edge_function_count()
    version = live_app_version()

    sources = [
        ("Platform facts + milestones", "src/lib/financial-model/data.ts", git_ref_for(repo_path("src/lib/financial-model/data.ts"))),
        ("Pricing & accounting framework", "docs/RAV-PRICING-TAXES-ACCOUNTING.md", git_ref_for(repo_path("docs/RAV-PRICING-TAXES-ACCOUNTING.md"))),
        ("Brand & terminology", "docs/brand-assets/BRAND-LOCK.md", git_ref_for(repo_path("docs/brand-assets/BRAND-LOCK.md"))),
        ("Test status", "docs/testing/TESTING-STATUS.md", git_ref_for(repo_path("docs/testing/TESTING-STATUS.md"))),
    ]

    body: list[str] = []
    body.append(frontmatter_block(change_type=f"snapshot-pitch-brief-{today}"))

    body.append(f"# Rent-A-Vacation (RAV) — Founder Pitch Brief — {long_date}\n\n")
    body.append(
        f"> One-page primer for advisor / mentor / warm-intro conversations. "
        f"Designed to be read in 60-90 seconds. For the high-level financials, "
        f"see the companion brief: `RAV-spend-brief-{today}.md`.\n\n"
    )
    body.append("---\n\n")

    body.append("## What RAV is\n\n")
    body.append(
        "**Rent-A-Vacation (RAV) is a two-sided marketplace for vacation-club and timeshare week rentals.** "
        "Owners of unused timeshare weeks list them; travelers discover, negotiate, and book those weeks — "
        "with transparent per-night pricing, traveler-side bidding, and platform-held escrow that protects "
        "both sides until the traveler physically checks in.\n\n"
    )

    body.append("## The business we're in\n\n")
    body.append(
        "The U.S. vacation-ownership (timeshare) industry is **$10.5 billion**, with roughly **9.9 million households** "
        "owning timeshares (ARDA 2024). Owners frequently can't use every week they own, and existing rental options "
        "are fragmented: Facebook groups, classifieds, legacy resale sites. None offer pricing transparency, traveler "
        "trust, or owner-friendly negotiation. **Travelers** looking for vacation-club inventory have no efficient way "
        "to discover it. **RAV sits in that gap** — a purpose-built peer-to-peer marketplace with the trust "
        "infrastructure (escrow, identity verification, dispute resolution) that the existing channels lack.\n\n"
    )

    body.append("## How RAV works — two listing models\n\n")
    body.append(
        "RAV runs **two distinct listing models** in production today. Most marketplaces only run Model 2. "
        "**Model 1 is the differentiator.**\n\n"
        "### Model 1 — RAV Wishes (reverse marketplace) — *the differentiator*\n\n"
        "The traveler posts the trip they want — destination, dates (with flexibility), budget range, bedrooms, "
        "amenities. Owners with matching inventory submit **Offers** (price + dates they can fulfill). When the "
        "traveler accepts an Offer, RAV gives the owner a **60-minute countdown** to lock in the actual resort "
        "confirmation (up to two 30-min extensions). If the owner misses the deadline, the traveler is "
        "automatically refunded — they're never left without a stay. **Nobody else in vacation-club rental does "
        "this.**\n\n"
        "### Model 2 — Traditional Pre-Booked Listing\n\n"
        "The owner already holds a confirmed resort week and lists it directly with proof-of-booking. The listing "
        "can be a **fixed price** OR opted into **bidding** (owner sets reserve price + decides whether counter-"
        "offers are allowed). Travelers can buy at the listed price, submit a bid, or counter the owner's counter. "
        "Reduces price-discovery friction and increases the chance of a deal closing.\n\n"
    )

    body.append("## What makes RAV different\n\n")
    body.append(
        "- **Smart matching.** When a new listing is approved, RAV's `match-travel-requests` edge function "
        "auto-scans open Wishes by destination, dates (±30 days + flexibility), bedrooms, budget, and brand — "
        "and notifies the relevant parties. Owners see live demand signals while creating a listing.\n"
        "- **PaySafe escrow.** Stripe holds the funds through Stripe Connect; RAV releases to the owner 5 days "
        "after check-out, with the traveler confirming arrival. RAV is **not** a money services business — Stripe "
        "carries that compliance load.\n"
        "- **TrustShield owner verification.** Identity + ownership proof flow built. Tiered verification.\n"
        "- **AI-native discovery.** *Ask RAVIO* (voice search via VAPI) and *Chat with RAVIO* (text via "
        "OpenRouter) complement traditional search. Voice quota tiered by membership.\n"
        "- **Marketplace facilitator.** RAV handles occupancy/sales tax via Stripe Tax (code ready, pending "
        "Delaware C-Corp formation).\n"
        "- **Revenue model.** 12% commission per booking (10% Pro / 8% Business tier discounts) + four subscription "
        "tiers (Plus $5 / Premium $15 / Pro $10 / Business $25).\n\n"
    )

    body.append("## Where we are right now\n\n")
    body.append(render_facts_table(facts))
    body.append("\n")
    body.append(
        f"_Live platform stats at this snapshot:_ **{test_count} automated tests**, "
        f"**{mig_count} database migrations**, **{edge_count} edge functions**, "
        f"app version **{version}**. Verified facts (CLAUDE.md): 117 resorts, "
        f"12% commission rate, 4 co-founders.\n\n"
    )

    body.append("## Funding-timeline milestones (from the financial model)\n\n")
    body.append(render_milestones_table(milestones))
    body.append("\n")

    body.append("## Team posture\n\n")
    body.append(
        "Four co-founders. **No payroll yet** — co-founder stipends activate post-funding. Built and operated "
        "AI-first: the platform was authored across ~68 documented sessions using Claude (Anthropic) as the "
        "primary development tool, with a structured SDLC, documentation framework, and per-PR doc-sync watchdog "
        "(see `/sdlc`, `/sdlc-docs`, `/generate-docs` skills in the repo). Capital efficient by design — see the "
        "spend brief for current run-rate.\n\n"
    )

    body.append("## What's NOT in this brief\n\n")
    body.append(
        "- **Financials** — see companion `RAV-spend-brief-<date>.md` (run `/generate-docs --spend-brief`)\n"
        "- **Full platform inventory** — see `/generate-docs --operating-model` for the technical deep-dive\n"
        "- **Compliance posture** — see `docs/payments/PAYSAFE-COMPLIANCE.md` for the legal model\n"
        "- **Investor metrics / GMV / take rate** — that becomes meaningful post-launch (Month 12 milestone)\n\n"
    )

    body.append("---\n\n")
    body.append("## Sources\n\n")
    body.append(source_table(sources))
    body.append("\n")

    body.append("## Verification trail\n\n")
    body.append(
        f"- **Generated by:** `docs/exports/generate_pitch_brief.py`\n"
        f"- **HEAD at snapshot time:** `{head}`\n"
        f"- **Snapshot date:** {long_date}\n"
        f"- **Facts dump timestamp:** {dump['generated_at']}\n"
        f"- **No content duplication** — narrative is curated for this brief; facts/milestones quoted from canonical "
        f"`src/lib/financial-model/data.ts`. Regenerate any time the model evolves.\n"
    )
    body.append("\n---\n\n")
    body.append(
        "_Founder-facing brief. Friendly-but-not-public. For the website-facing "
        "version, see the homepage at rent-a-vacation.com._\n"
    )

    return write_snapshot(f"RAV-pitch-brief-{today}.md", "".join(body))


if __name__ == "__main__":
    generate_pitch_brief()
