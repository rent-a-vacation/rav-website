"""
Generate a dated composite snapshot of RAV's financial model state.

Output: docs/exports/RAV-financials-snapshot-YYYY-MM-DD.md

This is a composite. The actual financial model is .xlsx (gitignored —
confidential) plus the TS source at `scripts/financial-model/`. This snapshot
documents the SHAPE + INPUTS + git refs of the model, NOT the projection
numbers (which are confidential).

Sources composed:
- docs/financials/README.md            (model index)
- docs/RAV-PRICING-TAXES-ACCOUNTING.md (pricing inputs that feed the model)
- src/config/commission.ts             (commission inputs)
- scripts/financial-model/             (TS source — file inventory)
- src/lib/financial-model/             (calc + data shared with web dashboard)
- src/pages/FinancialModelDashboard.tsx (web rendering)
- docs/PROJECT-HUB.md                  (DEC-014, DEC-041, DEC-043)
"""

from __future__ import annotations

import os
import re

from _compose import (
    disclaimer,
    extract_dec_entries,
    extract_frontmatter,
    frontmatter_block,
    git_ref_for,
    head_sha,
    read_doc_safe,
    repo_path,
    source_table,
    today_iso,
    today_long,
    write_snapshot,
)


FINANCIAL_DEC_IDS = ["DEC-014", "DEC-041", "DEC-043"]


def list_financial_model_ts_files() -> list[str]:
    """Walk scripts/financial-model/ and list every .ts file, repo-relative."""
    base = repo_path("scripts/financial-model")
    if not os.path.isdir(base):
        return []
    out = []
    for root, _dirs, files in os.walk(base):
        for fn in files:
            if fn.endswith(".ts"):
                full = os.path.join(root, fn)
                rel = os.path.relpath(full, repo_path(""))
                out.append(rel.replace(os.sep, "/"))
    return sorted(out)


def list_lib_financial_model_files() -> list[str]:
    base = repo_path("src/lib/financial-model")
    if not os.path.isdir(base):
        return []
    out = []
    for root, _dirs, files in os.walk(base):
        for fn in files:
            if fn.endswith(".ts") or fn.endswith(".tsx"):
                full = os.path.join(root, fn)
                rel = os.path.relpath(full, repo_path(""))
                out.append(rel.replace(os.sep, "/"))
    return sorted(out)


def latest_xlsx_artifact() -> tuple[str, str]:
    """Return (filename, mtime_iso) for the most-recent .xlsx in docs/financials/.

    Returns ("(none)", "") if no .xlsx present. (.xlsx files are gitignored —
    so this is a local-disk inspection.)
    """
    base = repo_path("docs/financials")
    if not os.path.isdir(base):
        return "(none)", ""
    candidates = [
        (fn, os.path.getmtime(os.path.join(base, fn)))
        for fn in os.listdir(base)
        if fn.endswith(".xlsx")
    ]
    if not candidates:
        return "(none)", ""
    candidates.sort(key=lambda x: x[1], reverse=True)
    fn, mtime = candidates[0]
    from datetime import datetime
    return fn, datetime.fromtimestamp(mtime).isoformat(timespec="seconds")


def extract_input_assumptions() -> str:
    """Pull a small structural summary from scripts/financial-model/data.ts.

    Lists exported const names so reader can see the model's input shape
    without exposing actual numbers.
    """
    text = read_doc_safe("scripts/financial-model/data.ts")
    if not text:
        return "_(scripts/financial-model/data.ts not found)_\n"
    # Find top-level `export const X` and `export type X`
    consts = re.findall(r"^export\s+const\s+(\w+)", text, re.MULTILINE)
    types = re.findall(r"^export\s+(?:type|interface)\s+(\w+)", text, re.MULTILINE)
    lines = ["**Exported types:**\n"]
    for t in sorted(set(types)):
        lines.append(f"- `{t}`")
    lines.append("\n**Exported constants (input groupings):**\n")
    for c in sorted(set(consts)):
        lines.append(f"- `{c}`")
    return "\n".join(lines) + "\n"


def render_dec_excerpts() -> str:
    hub = read_doc_safe("docs/PROJECT-HUB.md")
    if not hub:
        return "_(PROJECT-HUB.md not readable)_\n"
    entries = extract_dec_entries(hub, FINANCIAL_DEC_IDS)
    if not entries:
        return "_(no DEC entries matched — check PROJECT-HUB heading format)_\n"
    parts = []
    for dec_id, body in entries:
        parts.append(f"<details><summary><b>{dec_id}</b> — extracted from PROJECT-HUB.md</summary>\n\n")
        parts.append(body)
        parts.append("\n</details>\n")
    return "\n".join(parts)


def generate_financials() -> str:
    today = today_iso()
    long_date = today_long()
    head = head_sha() or "unknown"

    sources: list[tuple[str, str, object]] = [
        ("Financial model index", "docs/financials/README.md", git_ref_for(repo_path("docs/financials/README.md"))),
        ("Pricing inputs (canonical)", "docs/RAV-PRICING-TAXES-ACCOUNTING.md", git_ref_for(repo_path("docs/RAV-PRICING-TAXES-ACCOUNTING.md"))),
        ("Commission constants", "src/config/commission.ts", git_ref_for(repo_path("src/config/commission.ts"))),
        ("Build entry", "scripts/financial-model/build.ts", git_ref_for(repo_path("scripts/financial-model/build.ts"))),
        ("Typed inputs", "scripts/financial-model/data.ts", git_ref_for(repo_path("scripts/financial-model/data.ts"))),
        ("Web dashboard", "src/pages/FinancialModelDashboard.tsx", git_ref_for(repo_path("src/pages/FinancialModelDashboard.tsx"))),
        ("Shared calc lib", "src/lib/financial-model/calc.ts", git_ref_for(repo_path("src/lib/financial-model/calc.ts"))),
        ("Shared data lib", "src/lib/financial-model/data.ts", git_ref_for(repo_path("src/lib/financial-model/data.ts"))),
    ]

    fm_index_text = read_doc_safe("docs/financials/README.md")
    fm_meta = extract_frontmatter(fm_index_text or "")

    ts_files = list_financial_model_ts_files()
    lib_files = list_lib_financial_model_files()
    xlsx_name, xlsx_mtime = latest_xlsx_artifact()

    body = []
    body.append(frontmatter_block(change_type=f"snapshot-financials-{today}"))
    body.append(f"# RAV Financial Model Snapshot — {long_date}\n\n")
    body.append(
        f"> Snapshot of the **shape + inputs + verification refs** of the financial model "
        f"as of `{head}` ({long_date}). Projection numbers themselves are confidential — "
        f"the `.xlsx` artifact is gitignored.\n\n"
    )
    body.append(disclaimer())
    body.append("\n---\n\n")

    body.append("## 1. Source documents (canonical)\n\n")
    body.append(source_table(sources))
    body.append("\n")

    body.append("## 2. Snapshot of model index\n\n")
    body.append(
        f"- **`docs/financials/README.md` last_updated:** {fm_meta.get('last_updated', 'unknown')}\n"
        f"- **change_type:** {fm_meta.get('change_type', 'unknown')}\n"
        f"- **Build command:** `npm run financials:build`\n"
        f"- **Web dashboard route:** `/executive-dashboard/financial-model` "
        f"(`rav_owner` only) — see [`src/pages/FinancialModelDashboard.tsx`](../../src/pages/FinancialModelDashboard.tsx)\n"
        f"- **Latest local `.xlsx` artifact:** `{xlsx_name}`"
        + (f" (modified {xlsx_mtime})" if xlsx_mtime else "")
        + " — _gitignored, confidential_\n"
    )
    body.append("\n")

    body.append("## 3. Model input shape (from `scripts/financial-model/data.ts`)\n\n")
    body.append(extract_input_assumptions())
    body.append("\n")

    body.append("## 4. Generator inventory\n\n")
    body.append("**TypeScript build (`scripts/financial-model/`):**\n\n")
    for f in ts_files:
        body.append(f"- [`{f}`](../../{f})\n")
    body.append("\n**Shared with web dashboard (`src/lib/financial-model/`):**\n\n")
    for f in lib_files:
        body.append(f"- [`{f}`](../../{f})\n")
    body.append("\n")

    body.append("## 5. Decision excerpts (filtered to financial-model topics)\n\n")
    body.append(render_dec_excerpts())
    body.append("\n")

    body.append("## 6. Verification trail\n\n")
    body.append(
        "- **Snapshot generated by:** `docs/exports/generate_financials.py`\n"
        f"- **HEAD at snapshot time:** `{head}`\n"
        f"- **Snapshot date:** {long_date}\n"
        "- **Confidential outputs not embedded** — `.xlsx` artifacts are gitignored. "
        "This snapshot only describes the model's shape, inputs, and where to "
        "regenerate it.\n"
    )

    body.append("\n---\n\n")
    body.append(
        "*Composite snapshot. RAV Financial Model. "
        f"Generated {long_date}. See `docs/INDEX.md` for navigation.*\n"
    )

    return write_snapshot(f"RAV-financials-snapshot-{today}.md", "".join(body))


if __name__ == "__main__":
    generate_financials()
