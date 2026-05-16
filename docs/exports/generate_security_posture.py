"""
Generate a dated composite snapshot of RAV's security posture.

Output: docs/exports/RAV-security-posture-YYYY-MM-DD.md

Composes the SECURITY-RISK-LOG with live npm audit + dependabot state +
recent security commits. The canonical doc remains `docs/SECURITY-RISK-LOG.md`
— this snapshot adds the live signals at point-in-time.

Sources composed:
- docs/SECURITY-RISK-LOG.md       (canonical triage state)
- npm audit --omit=dev --json     (live runtime alerts)
- npm audit --json (all)          (live including dev)
- gh api dependabot alerts        (live state per GitHub)
- git log --grep="security"       (recent security commits)
"""

from __future__ import annotations

import json
import subprocess

from _compose import (
    PROJECT_ROOT,
    disclaimer,
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


def npm_audit_summary(omit_dev: bool = False) -> dict:
    """Run npm audit --json. Returns the parsed metadata block, or empty dict.

    Uses shell=True on Windows because `npm` is a .cmd shim there.
    """
    import os as _os
    cmd_str = "npm audit --json" + (" --omit=dev" if omit_dev else "")
    try:
        proc = subprocess.run(
            cmd_str,
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=180,
            shell=True,
        )
        # npm audit returns non-zero when vulnerabilities exist — that's expected.
        # Parse stdout regardless.
        if not proc.stdout:
            return {}
        data = json.loads(proc.stdout)
        meta = data.get("metadata", {})
        return meta
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired, json.JSONDecodeError):
        return {}


def render_audit_table(meta_runtime: dict, meta_all: dict) -> str:
    def vuln_row(label: str, key: str) -> str:
        rt = meta_runtime.get("vulnerabilities", {}).get(key, "?")
        al = meta_all.get("vulnerabilities", {}).get(key, "?")
        return f"| {label} | {rt} | {al} |"

    if not meta_runtime and not meta_all:
        return "_(npm audit unavailable at snapshot time)_\n"

    lines = [
        "| Severity | Runtime (`--omit=dev`) | All (incl. dev) |",
        "|---|---|---|",
        vuln_row("Critical", "critical"),
        vuln_row("High", "high"),
        vuln_row("Moderate", "moderate"),
        vuln_row("Low", "low"),
        vuln_row("Info", "info"),
    ]
    rt_total = meta_runtime.get("vulnerabilities", {}).get("total", "?")
    al_total = meta_all.get("vulnerabilities", {}).get("total", "?")
    lines.append(f"| **Total** | **{rt_total}** | **{al_total}** |")
    return "\n".join(lines) + "\n"


def dependabot_alerts_summary() -> str:
    """Pull open dependabot alert count via gh CLI."""
    try:
        out = subprocess.check_output(
            [
                "gh", "api",
                "repos/rent-a-vacation/rav-website/dependabot/alerts",
                "--paginate",
                "-q", '[.[] | select(.state == "open")] | length',
            ],
            cwd=PROJECT_ROOT, stderr=subprocess.DEVNULL, timeout=60,
        ).decode("utf-8").strip()
        return f"Open dependabot alerts: **{out}** (GitHub state)"
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        return "_(dependabot state unavailable — gh CLI not authenticated for security:read scope?)_"


def recent_security_commits(limit: int = 15) -> str:
    """Last N security-related commits."""
    try:
        out = subprocess.check_output(
            [
                "git", "log", "--no-merges", f"-{limit}",
                "--grep=security",
                "--grep=CVE",
                "--grep=audit",
                "-i",
                "--format=%h | %cs | %s",
            ],
            cwd=PROJECT_ROOT, stderr=subprocess.DEVNULL,
        ).decode("utf-8").strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "_(git log unavailable)_\n"
    if not out:
        return "_(no security-tagged commits in recent history)_\n"
    lines = ["| SHA | Date | Subject |", "|---|---|---|"]
    for line in out.splitlines():
        parts = [p.strip() for p in line.split("|", 2)]
        if len(parts) == 3:
            subj = parts[2].replace("|", "\\|")
            lines.append(f"| `{parts[0]}` | {parts[1]} | {subj} |")
    return "\n".join(lines) + "\n"


def risk_log_summary() -> str:
    text = read_doc_safe("docs/SECURITY-RISK-LOG.md")
    if not text:
        return "_(SECURITY-RISK-LOG.md missing)_\n"
    fm = extract_frontmatter(text)
    return (
        f"- **Last updated:** {fm.get('last_updated', 'unknown')}\n"
        f"- **change_type:** {fm.get('change_type', 'unknown')}\n"
        f"- **status:** {fm.get('status', 'unknown')}\n"
        f"- **Lines:** {len(text.splitlines())}\n"
        f"- **Full content:** [`docs/SECURITY-RISK-LOG.md`](../SECURITY-RISK-LOG.md)\n"
    )


def generate_security_posture() -> str:
    today = today_iso()
    long_date = today_long()
    head = head_sha() or "unknown"

    sources: list[tuple[str, str, object]] = [
        ("Security risk log (canonical)", "docs/SECURITY-RISK-LOG.md", git_ref_for(repo_path("docs/SECURITY-RISK-LOG.md"))),
        ("Package manifest", "package.json", git_ref_for(repo_path("package.json"))),
        ("Lockfile", "package-lock.json", git_ref_for(repo_path("package-lock.json"))),
        ("Dependabot config", ".github/dependabot.yml", git_ref_for(repo_path(".github/dependabot.yml"))),
    ]

    print("Running npm audit (this can take ~30-60s)...")
    meta_runtime = npm_audit_summary(omit_dev=True)
    meta_all = npm_audit_summary(omit_dev=False)

    body = []
    body.append(frontmatter_block(change_type=f"snapshot-security-{today}"))
    body.append(f"# RAV Security Posture Snapshot — {long_date}\n\n")
    body.append(f"> Snapshot of security state as of `{head}` ({long_date}). Composes the canonical risk log with live npm audit + dependabot signals.\n\n")
    body.append(disclaimer())
    body.append("\n---\n\n")

    body.append("## 1. Source documents (canonical)\n\n")
    body.append(source_table(sources))
    body.append("\n")

    body.append("## 2. SECURITY-RISK-LOG.md state\n\n")
    body.append(risk_log_summary())
    body.append("\n")

    body.append("## 3. Live npm audit (at snapshot time)\n\n")
    body.append(render_audit_table(meta_runtime, meta_all))
    body.append("\n")

    body.append("## 4. Dependabot (GitHub) state\n\n")
    body.append(dependabot_alerts_summary())
    body.append("\n\n")

    body.append("## 5. Recent security-tagged commits (last 15)\n\n")
    body.append(recent_security_commits(15))
    body.append("\n")

    body.append("## 6. Verification trail\n\n")
    body.append(
        "- **Snapshot generated by:** `docs/exports/generate_security_posture.py`\n"
        f"- **HEAD at snapshot time:** `{head}`\n"
        f"- **Snapshot date:** {long_date}\n"
        "- **npm audit + dependabot are live signals** at the moment this script "
        "ran. The canonical triage state lives in `docs/SECURITY-RISK-LOG.md` — "
        "this snapshot does not replace it.\n"
    )

    body.append("\n---\n\n")
    body.append(
        "*Composite snapshot. RAV security posture. "
        f"Generated {long_date}. See `docs/INDEX.md` for navigation.*\n"
    )

    return write_snapshot(f"RAV-security-posture-{today}.md", "".join(body))


if __name__ == "__main__":
    generate_security_posture()
