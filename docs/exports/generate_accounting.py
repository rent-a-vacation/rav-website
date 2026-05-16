"""
Generate a dated composite snapshot of RAV's accounting & tax framework.

Output: docs/exports/RAV-accounting-snapshot-YYYY-MM-DD.md

This is a composite — it links to canonical sources rather than duplicating
their content. Per the no-doc-duplication rule, snapshots quote/link/extract
but never become a parallel source of truth.

Sources composed:
- docs/RAV-PRICING-TAXES-ACCOUNTING.md  (the framework)
- docs/payments/PAYSAFE-COMPLIANCE.md   (compliance posture)
- docs/payments/PAYSAFE-FLOW-SPEC.md    (flow spec)
- docs/financials/README.md             (financial model location)
- src/lib/pricing.ts                    (pricing fns)
- src/config/commission.ts              (commission constants)
- docs/PROJECT-HUB.md                   (DEC entries: 022, 038, 039, 041, 043)
- gh issues (live)                      (open accounting follow-ups)

Run:    python docs/exports/generate_accounting.py
Or:     npm run docs:gen:accounting
Or:     /generate-docs --accounting   (via skill)
"""

from __future__ import annotations

import re

from _compose import (
    disclaimer,
    extract_dec_entries,
    extract_frontmatter,
    frontmatter_block,
    gh_issue_get,
    gh_issue_list,
    git_ref_for,
    head_sha,
    read_doc,
    read_doc_safe,
    repo_path,
    source_table,
    today_iso,
    today_long,
    write_snapshot,
)


ACCOUNTING_DEC_IDS = ["DEC-022", "DEC-038", "DEC-039", "DEC-041", "DEC-043"]

ACCOUNTING_ISSUE_NUMBERS = [127, 63, 65, 509, 531, 532]


def extract_commission_constants() -> dict[str, str]:
    """Pull DEFAULT_COMMISSION values from src/config/commission.ts at snapshot time.

    Returns dict with base/pro/business as percent strings, or 'unknown' if not parsable.
    """
    text = read_doc_safe("src/config/commission.ts") or ""
    out = {"base": "unknown", "proDiscount": "unknown", "businessDiscount": "unknown"}
    for key in out.keys():
        m = re.search(rf"{key}:\s*([\d.]+),", text)
        if m:
            try:
                pct = float(m.group(1)) * 100
                out[key] = f"{pct:g}%"
            except ValueError:
                pass
    return out


def render_open_issues() -> str:
    """Render open accounting follow-up issues with live state."""
    lines = ["| # | Title | Labels | Milestone |", "|---|---|---|---|"]
    found = 0
    for num in ACCOUNTING_ISSUE_NUMBERS:
        issue = gh_issue_get(num)
        if not issue:
            continue
        found += 1
        labels = ", ".join(l["name"] for l in issue.get("labels", [])) or "_none_"
        milestone = (issue.get("milestone") or {}).get("title", "_unscheduled_")
        title = issue.get("title", "?").replace("|", "\\|")
        lines.append(f"| [#{num}]({issue.get('url', '#')}) | {title} | {labels} | {milestone} |")
    if found == 0:
        return "_(gh CLI unavailable or no issues retrieved at snapshot time)_\n"
    return "\n".join(lines) + "\n"


def render_dec_excerpts() -> str:
    """Pull the DEC entries that touch accounting from PROJECT-HUB."""
    hub = read_doc_safe("docs/PROJECT-HUB.md")
    if not hub:
        return "_(PROJECT-HUB.md not readable)_\n"
    entries = extract_dec_entries(hub, ACCOUNTING_DEC_IDS)
    if not entries:
        return "_(no DEC entries matched — check PROJECT-HUB heading format)_\n"
    parts = []
    for dec_id, body in entries:
        parts.append(f"<details><summary><b>{dec_id}</b> — extracted from PROJECT-HUB.md</summary>\n\n")
        parts.append(body)
        parts.append("\n</details>\n")
    return "\n".join(parts)


def pricing_doc_summary() -> str:
    """Summarize the canonical PRICING-TAXES doc by extracting its frontmatter
    + first-section heading. Don't duplicate body content."""
    text = read_doc_safe("docs/RAV-PRICING-TAXES-ACCOUNTING.md")
    if not text:
        return "_(canonical doc missing)_\n"
    fm = extract_frontmatter(text)
    # Pull the version-line under the H1 (first blockquote)
    version_line = ""
    for line in text.splitlines():
        if line.startswith("> **Version:**"):
            version_line = line
            break
    return (
        f"- **Version:** {version_line.removeprefix('> **Version:**').strip() or 'unknown'}\n"
        f"- **Frontmatter `last_updated`:** {fm.get('last_updated', 'unknown')}\n"
        f"- **Frontmatter `change_type`:** {fm.get('change_type', 'unknown')}\n"
        f"- **See full doc:** [`docs/RAV-PRICING-TAXES-ACCOUNTING.md`](../RAV-PRICING-TAXES-ACCOUNTING.md)\n"
    )


def generate_accounting() -> str:
    today = today_iso()
    long_date = today_long()
    head = head_sha() or "unknown"

    sources: list[tuple[str, str, object]] = [
        ("Pricing, taxes, accounting framework", "docs/RAV-PRICING-TAXES-ACCOUNTING.md", git_ref_for(repo_path("docs/RAV-PRICING-TAXES-ACCOUNTING.md"))),
        ("PaySafe compliance posture", "docs/payments/PAYSAFE-COMPLIANCE.md", git_ref_for(repo_path("docs/payments/PAYSAFE-COMPLIANCE.md"))),
        ("PaySafe flow specification", "docs/payments/PAYSAFE-FLOW-SPEC.md", git_ref_for(repo_path("docs/payments/PAYSAFE-FLOW-SPEC.md"))),
        ("Financial model index", "docs/financials/README.md", git_ref_for(repo_path("docs/financials/README.md"))),
        ("Pricing utilities (code)", "src/lib/pricing.ts", git_ref_for(repo_path("src/lib/pricing.ts"))),
        ("Commission constants (code)", "src/config/commission.ts", git_ref_for(repo_path("src/config/commission.ts"))),
        ("Commission rate runtime hook", "src/hooks/useCommissionRate.ts", git_ref_for(repo_path("src/hooks/useCommissionRate.ts"))),
        ("Commission edge fn helper", "supabase/functions/_shared/commission.ts", git_ref_for(repo_path("supabase/functions/_shared/commission.ts"))),
        ("Cancellation policy refund math", "src/lib/cancellationPolicy.ts", git_ref_for(repo_path("src/lib/cancellationPolicy.ts"))),
    ]

    constants = extract_commission_constants()

    body = []
    body.append(frontmatter_block(change_type=f"snapshot-accounting-{today}"))
    body.append(f"# RAV Accounting Snapshot — {long_date}\n\n")
    body.append(f"> Snapshot of the accounting + tax + escrow framework as of `{head}` ({long_date}).\n\n")
    body.append(disclaimer())
    body.append("\n---\n\n")

    body.append("## 1. Source documents (canonical)\n\n")
    body.append(source_table(sources))
    body.append("\n")

    body.append("## 2. Snapshot of canonical-doc state\n\n")
    body.append(pricing_doc_summary())
    body.append("\n")

    body.append("## 3. Live commission constants (extracted from `src/config/commission.ts`)\n\n")
    body.append(
        "| Constant | Value (live at snapshot time) | Effective rate |\n"
        "|---|---|---|\n"
        f"| `DEFAULT_COMMISSION.base` | {constants['base']} | Free owner: **{constants['base']}** |\n"
        f"| `DEFAULT_COMMISSION.proDiscount` | {constants['proDiscount']} pp off base | Pro owner: derived |\n"
        f"| `DEFAULT_COMMISSION.businessDiscount` | {constants['businessDiscount']} pp off base | Business owner: derived |\n"
    )
    body.append(
        "\n_Runtime override: admins can change the live rate via `system_settings.platform_commission_rate` "
        "(read by `useCommissionRate()` hook + `getCommissionRate()` edge fn helper). "
        "Each booking persists `commission_rate_applied` so historical accounting is preserved (see DEC-043 below)._\n\n"
    )

    body.append("## 4. Decision excerpts (filtered to accounting topics)\n\n")
    body.append("DEC entries pulled from `docs/PROJECT-HUB.md` at snapshot time.\n\n")
    body.append(render_dec_excerpts())
    body.append("\n")

    body.append("## 5. Open follow-up issues (live from GitHub)\n\n")
    body.append(render_open_issues())
    body.append("\n")

    body.append("## 6. Verification trail\n\n")
    body.append(
        "- **Snapshot generated by:** `docs/exports/generate_accounting.py` "
        "(run via `npm run docs:gen:accounting` or `/generate-docs --accounting`)\n"
        f"- **HEAD at snapshot time:** `{head}`\n"
        f"- **Snapshot date:** {long_date}\n"
        "- **No duplication of canonical content** — every fact in this snapshot is "
        "either (a) a link to a canonical doc, (b) a quote from a canonical doc, "
        "or (c) a value extracted live from code. To change anything, edit the "
        "canonical source and regenerate.\n"
    )

    body.append("\n---\n\n")
    body.append(
        "*Composite snapshot. RAV Accounting framework. "
        f"Generated {long_date}. See `docs/INDEX.md` for navigation.*\n"
    )

    return write_snapshot(f"RAV-accounting-snapshot-{today}.md", "".join(body))


if __name__ == "__main__":
    generate_accounting()
