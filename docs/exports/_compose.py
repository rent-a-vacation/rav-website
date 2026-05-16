"""
Shared helpers for composite snapshot generators (--accounting, --financials,
--security-posture). Used by `/generate-docs` skill.

Design principle: snapshots LINK + QUOTE canonical sources. They never
duplicate content. Every section names its source and includes a git ref
so the reader can verify what was extracted at snapshot time.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, Optional

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))


def repo_path(relative: str) -> str:
    """Resolve a repo-relative path to absolute."""
    return os.path.join(PROJECT_ROOT, relative)


def today_iso() -> str:
    """YYYY-MM-DD."""
    return datetime.now().strftime("%Y-%m-%d")


def today_long() -> str:
    """May 15, 2026."""
    return datetime.now().strftime("%B %d, %Y")


def now_iso() -> str:
    """ISO 8601 UTC-ish for frontmatter."""
    return datetime.now().strftime("%Y-%m-%dT%H:%M:%S")


@dataclass(frozen=True)
class GitRef:
    sha: str
    date: str
    subject: str

    def render(self) -> str:
        return f"`{self.sha}` ({self.date}) — {self.subject}"


def git_ref_for(path: str) -> Optional[GitRef]:
    """Return short SHA + date + subject for the most recent commit touching `path`.

    Returns None if the file isn't tracked or git isn't available.
    """
    if not os.path.exists(path):
        return None
    try:
        out = subprocess.check_output(
            ["git", "log", "-1", "--format=%h|%cs|%s", "--", path],
            cwd=PROJECT_ROOT,
            stderr=subprocess.DEVNULL,
        ).decode("utf-8").strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    if not out:
        return None
    parts = out.split("|", 2)
    if len(parts) != 3:
        return None
    return GitRef(sha=parts[0], date=parts[1], subject=parts[2])


def head_sha() -> Optional[str]:
    """Short SHA of HEAD."""
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=PROJECT_ROOT,
            stderr=subprocess.DEVNULL,
        ).decode("utf-8").strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None


def read_doc(relative: str) -> str:
    """Read a repo-relative file. Raises FileNotFoundError if missing — failing
    fast is correct for snapshot composition."""
    full = repo_path(relative)
    with open(full, "r", encoding="utf-8") as f:
        return f.read()


def read_doc_safe(relative: str) -> Optional[str]:
    """Read a repo-relative file or return None if missing."""
    try:
        return read_doc(relative)
    except FileNotFoundError:
        return None


def extract_frontmatter(text: str) -> dict[str, str]:
    """Extract simple key: "value" YAML frontmatter. Returns {} if no frontmatter."""
    if not text.startswith("---\n"):
        return {}
    end = text.find("\n---\n", 4)
    if end == -1:
        return {}
    block = text[4:end]
    out: dict[str, str] = {}
    for line in block.splitlines():
        m = re.match(r"^(\w+):\s*\"?([^\"]*)\"?\s*$", line)
        if m:
            out[m.group(1)] = m.group(2)
    return out


def extract_section(text: str, heading: str, level: int = 2) -> Optional[str]:
    """Extract a markdown section by its heading. Returns the section text
    INCLUDING the heading line, or None if not found.

    `level` is the number of `#` in the heading (default 2 = `## Heading`).
    The section ends at the next heading of the same or shallower level.
    """
    prefix = "#" * level + " "
    target_line = prefix + heading
    lines = text.splitlines()
    start = -1
    for i, line in enumerate(lines):
        if line.strip() == target_line.strip():
            start = i
            break
    if start == -1:
        return None
    end = len(lines)
    for i in range(start + 1, len(lines)):
        line = lines[i]
        m = re.match(r"^(#+)\s+", line)
        if m and len(m.group(1)) <= level:
            end = i
            break
    return "\n".join(lines[start:end]).rstrip() + "\n"


def extract_dec_entries(project_hub_text: str, dec_ids: Iterable[str]) -> list[tuple[str, str]]:
    """Extract DEC-### entries from PROJECT-HUB.md.

    Returns list of (dec_id, body_text) tuples. Body includes the heading.
    """
    out: list[tuple[str, str]] = []
    for dec_id in dec_ids:
        # DEC headings look like: ### DEC-043: Commission Rate Runtime Architecture ...
        pattern = re.compile(rf"^###\s+{re.escape(dec_id)}\b.*$", re.MULTILINE)
        m = pattern.search(project_hub_text)
        if not m:
            continue
        start = m.start()
        # find the next ### heading or --- separator
        rest = project_hub_text[m.end():]
        next_h = re.search(r"\n###\s+", rest)
        next_sep = re.search(r"\n---\n", rest)
        end_offsets = [x.start() for x in [next_h, next_sep] if x is not None]
        if end_offsets:
            end = m.end() + min(end_offsets)
        else:
            end = len(project_hub_text)
        out.append((dec_id, project_hub_text[start:end].rstrip() + "\n"))
    return out


def gh_issue_list(label: Optional[str] = None, search: Optional[str] = None, limit: int = 50) -> list[dict]:
    """Call `gh issue list ... --json number,title,state,labels,milestone,url`.

    Returns parsed list. Empty list on error (skipped silently — snapshot still
    generates without live GH data).
    """
    cmd = [
        "gh", "issue", "list",
        "--repo", "rent-a-vacation/rav-website",
        "--state", "open",
        "--limit", str(limit),
        "--json", "number,title,state,labels,milestone,url",
    ]
    if label:
        cmd.extend(["--label", label])
    if search:
        cmd.extend(["--search", search])
    try:
        out = subprocess.check_output(
            cmd, cwd=PROJECT_ROOT, stderr=subprocess.DEVNULL, timeout=30
        ).decode("utf-8")
        return json.loads(out)
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired, json.JSONDecodeError):
        return []


def gh_issue_get(number: int) -> Optional[dict]:
    """Fetch a single issue by number."""
    try:
        out = subprocess.check_output(
            [
                "gh", "issue", "view", str(number),
                "--repo", "rent-a-vacation/rav-website",
                "--json", "number,title,state,labels,milestone,url",
            ],
            cwd=PROJECT_ROOT, stderr=subprocess.DEVNULL, timeout=30,
        ).decode("utf-8")
        return json.loads(out)
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired, json.JSONDecodeError):
        return None


def write_snapshot(filename: str, content: str) -> str:
    """Write a snapshot to docs/exports/. Returns the absolute path written."""
    output_path = os.path.join(SCRIPT_DIR, filename)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated: {output_path}")
    return output_path


def frontmatter_block(change_type: str, status: str = "active") -> str:
    """Standard frontmatter block for snapshot files."""
    sha = head_sha() or "unknown"
    return (
        "---\n"
        f'last_updated: "{now_iso()}"\n'
        f'change_ref: "{sha}"\n'
        f'change_type: "{change_type}"\n'
        f'status: "{status}"\n'
        f'doc_kind: "snapshot"\n'
        "---\n\n"
    )


def source_table(sources: list[tuple[str, str, Optional[GitRef]]]) -> str:
    """Render a source-of-truth table.

    `sources` is a list of (label, repo_path, git_ref) tuples.
    """
    lines = [
        "| Source (canonical) | Path | Last commit |",
        "|---|---|---|",
    ]
    for label, path, ref in sources:
        ref_text = ref.render() if ref else "_(not tracked or missing)_"
        lines.append(f"| {label} | [`{path}`](../../{path}) | {ref_text} |")
    return "\n".join(lines) + "\n"


def disclaimer() -> str:
    return (
        "> **Composite snapshot — read-only.** This file links and quotes from "
        "the canonical sources above. It is regenerated on demand by "
        "`/generate-docs` and is **not** a source of truth itself. To change "
        "anything in this snapshot, edit the canonical source. To refresh, run "
        "the relevant `npm run docs:gen:*` script.\n"
    )
