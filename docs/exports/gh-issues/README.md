---
last_updated: "2026-04-25T00:00:00"
change_ref: "manual-edit"
change_type: "manual-edit"
status: "active"
---

# GitHub Open-Issues Export

A snapshot of every open issue in `rent-a-vacation/rav-website`, formatted for stakeholders who can't (or won't) work in GitHub directly.

## Files

| File | Purpose |
|------|---------|
| `rav-open-issues-<YYYY-MM-DD>.xlsx` | The branded Excel report (share this) |
| `_issues-raw.json` | Raw `gh issue list` output used to build the report |
| `_discussions-raw.json` | Raw GraphQL response of all open Discussions |
| `build_xlsx.py` | Generator script — pure Python + `openpyxl` |
| `fetch_discussions.sh` | Pulls Discussions via the GitHub GraphQL API |

## Workbook layout

- **Open Issues** — one row per open Issue. Columns: #, Title, Priority, Type, Area, Milestone, Labels, Assignees, Author, Comments, Created, Updated, URL, Summary. Issue # and URL columns are clickable. Header row is frozen and auto-filtered.
- **Action Items (Discussions)** — one row per open Discussion in the GitHub Discussions area. The team uses Discussions as a TODO / action-items board, so each row represents one item. Columns: #, Title, Category (chip-colored: Announcements/General/Ideas/Polls/Q&A/Show and tell), Author, Comments, Created, Last activity, URL, Body excerpt.
- **Open Checkboxes (Discussions)** — one row per unchecked `- [ ]` line found inside a Discussion body, comment, or reply. Done items (`- [x]`) are excluded. Empty if no Discussion uses checkbox markdown.
- **Summary** — rollups by priority, type, area, milestone, and label (Issues only).
- **Legend** — what each priority chip color means.

## Branding applied

Colors come from `docs/brand-assets/BRAND-STYLE-GUIDE.md`:

| Use | Color |
|-----|-------|
| Title bar | Deep Teal `#1C7268` |
| Subtitle bar | Warm Coral `#E8703A` |
| Column headers | Dark Navy `#1D2E38` |
| Row banding | Warm Cream `#F8F6F3` |
| Priority chips | `blocked`=Red · `pre-launch`=Coral · `post-launch`=Teal · `post-beta`=Amber · `future`=Sand · `unscheduled`=Muted |

## Regenerating

```bash
# Issues
gh issue list --repo rent-a-vacation/rav-website --state open --limit 1000 \
  --json number,title,state,labels,milestone,assignees,author,createdAt,updatedAt,url,body,comments \
  > docs/exports/gh-issues/_issues-raw.json

# Discussions (GraphQL — gh CLI has no first-class `gh discussion` command)
bash docs/exports/gh-issues/fetch_discussions.sh

# Build the workbook (writes both Issues and Discussions tabs)
python docs/exports/gh-issues/build_xlsx.py
```

The script names the output with today's date. If the file is already open in Excel the new run writes a timestamped copy alongside it instead of erroring.

## Sharing with the team

Claude Code does not have Google Drive write access in this environment, so the file is saved here. To put it in the team Drive folder:

1. Open the target folder: <https://drive.google.com/drive/folders/1-JJWBc2twZ0h1CgKTevcPrOvGkySeCrX>
2. Drag `rav-open-issues-<YYYY-MM-DD>.xlsx` from this folder into the browser, OR click **+ New → File upload**.
3. (Optional) Right-click the uploaded file → **Open with → Google Sheets** for online editing — formatting is preserved.
