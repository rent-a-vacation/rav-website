"""Render a Markdown file to a styled PDF.

Usage:
    python scripts/md-to-pdf.py <input.md> [output.pdf]
    python scripts/md-to-pdf.py <input.md> --footer-left "CONFIDENTIAL"
    python scripts/md-to-pdf.py <input.md> --no-footer

Defaults:
    output      → same path as input with .pdf extension
    title       → first H1 in the file, falling back to the filename stem
    footer      → page numbers in the bottom-right (Page X of Y)

Page breaks:
    Insert `<!-- pagebreak -->` on its own line in the markdown to force a new page.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import pymupdf
from markdown_pdf import MarkdownPdf, Section

CSS = """
body { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.5; font-size: 11pt; }
h1 { color: #0d6b5c; border-bottom: 2px solid #0d6b5c; padding-bottom: 6px; }
h2 { color: #0d6b5c; margin-top: 28px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
h3 { color: #115e59; margin-top: 20px; }
h4 { color: #115e59; }
code { background: #f3f4f6; padding: 1px 5px; border-radius: 3px; font-size: 90%; font-family: Consolas, "Courier New", monospace; }
pre { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 5px; padding: 10px; font-size: 9pt; overflow-x: auto; }
pre code { background: transparent; padding: 0; }
table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 10pt; }
th, td { border: 1px solid #e5e7eb; padding: 6px 9px; text-align: left; vertical-align: top; }
th { background: #f0fdfa; color: #0d6b5c; }
blockquote { border-left: 4px solid #e86a4a; color: #4b5563; margin: 12px 0; padding: 4px 12px; background: #fffaf6; }
a { color: #0d6b5c; text-decoration: none; }
hr { border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0; }
ul, ol { margin: 6px 0 10px 20px; }
li { margin: 2px 0; }
"""

PAGEBREAK_RE = re.compile(r"^<!--\s*pagebreak\s*-->\s*$", re.MULTILINE | re.IGNORECASE)


def strip_frontmatter(text: str) -> str:
    return re.sub(r"^---\n.*?\n---\n", "", text, count=1, flags=re.DOTALL)


def first_h1(text: str, fallback: str) -> str:
    match = re.search(r"^#\s+(.+)$", text, flags=re.MULTILINE)
    return match.group(1).strip() if match else fallback


def split_on_pagebreak(text: str) -> list[str]:
    parts = PAGEBREAK_RE.split(text)
    return [p.strip() for p in parts if p.strip()]


def add_footer(pdf_path: Path, left: str, center: str, right_template: str, font_size: int = 8) -> None:
    """Open the saved PDF and add footer text on every page."""
    doc = pymupdf.open(str(pdf_path))
    total = doc.page_count
    margin_y = 24
    margin_x = 50
    color = (0.4, 0.4, 0.4)

    for i, page in enumerate(doc, start=1):
        rect = page.rect
        y = rect.height - margin_y

        if left:
            page.insert_text((margin_x, y), left, fontsize=font_size, color=color)
        if center:
            text_width = pymupdf.get_text_length(center, fontsize=font_size)
            page.insert_text(((rect.width - text_width) / 2, y), center, fontsize=font_size, color=color)
        if right_template:
            text = right_template.format(i=i, total=total)
            text_width = pymupdf.get_text_length(text, fontsize=font_size)
            page.insert_text((rect.width - text_width - margin_x, y), text, fontsize=font_size, color=color)

    tmp_path = pdf_path.with_suffix(pdf_path.suffix + ".tmp")
    doc.save(str(tmp_path), garbage=4, deflate=True)
    doc.close()
    tmp_path.replace(pdf_path)


def render(
    src: Path,
    dst: Path,
    title: str | None,
    author: str | None,
    subject: str | None,
    toc_level: int,
) -> str:
    raw = strip_frontmatter(src.read_text(encoding="utf-8"))
    doc_title = title or first_h1(raw, src.stem)

    pdf = MarkdownPdf(toc_level=toc_level, optimize=True)
    pdf.meta["title"] = doc_title
    if author:
        pdf.meta["author"] = author
    if subject:
        pdf.meta["subject"] = subject

    sections = split_on_pagebreak(raw)
    for idx, section_text in enumerate(sections):
        pdf.add_section(Section(section_text, toc=(idx == 0)), user_css=CSS)

    pdf.save(str(dst))
    return doc_title


def main() -> None:
    parser = argparse.ArgumentParser(description="Render a Markdown file to a styled PDF.")
    parser.add_argument("input", type=Path, help="Path to the source Markdown file")
    parser.add_argument("output", type=Path, nargs="?", default=None,
                        help="Output PDF path (defaults to <input>.pdf)")
    parser.add_argument("--title", default=None, help="PDF title metadata (defaults to first H1)")
    parser.add_argument("--author", default=None, help="PDF author metadata")
    parser.add_argument("--subject", default=None, help="PDF subject metadata")
    parser.add_argument("--toc-level", type=int, default=2, help="Heading depth for TOC (default 2)")
    parser.add_argument("--footer-left", default="", help="Footer text on the bottom-left of each page")
    parser.add_argument("--footer-center", default="", help="Footer text on the bottom-center of each page")
    parser.add_argument("--footer-right", default="Page {i} of {total}",
                        help="Footer text on the bottom-right; supports {i} and {total} placeholders")
    parser.add_argument("--no-footer", action="store_true", help="Disable all footer rendering")
    args = parser.parse_args()

    src: Path = args.input.resolve()
    if not src.exists():
        sys.exit(f"missing source: {src}")

    dst: Path = (args.output or src.with_suffix(".pdf")).resolve()
    dst.parent.mkdir(parents=True, exist_ok=True)

    doc_title = render(src, dst, args.title, args.author, args.subject, args.toc_level)

    if not args.no_footer:
        add_footer(dst, args.footer_left, args.footer_center, args.footer_right)

    print(f"Wrote {dst} ({dst.stat().st_size // 1024} KB) — {doc_title!r}")


if __name__ == "__main__":
    main()
