/**
 * Documentation Sync Check
 *
 * Detects semantic staleness in the four docs that /sdlc status and
 * every future session rely on for "current state" context:
 *
 *   1. docs/PROJECT-HUB.md         — latest Session handoff number
 *   2. docs/PRIORITY-ROADMAP.md    — "as of Session NN" header
 *   3. docs/testing/TESTING-STATUS.md — total test count
 *   4. docs/LAUNCH-READINESS.md    — change_type frontmatter
 *
 * Also validates docs/support/**\/*.md frontmatter + legal-review freshness
 * (Phase 22 — DEC-036).
 *
 * Also enforces DEC-040 (themed milestones, not sequential phases): any
 * "Phase 23+" reference in docs/**\/*.md fails the check unless it appears
 * in the allowlist (the historical archive and the DEC-040 entry itself).
 *
 * Complements scripts/docs-audit.ts (which checks frontmatter + orphans).
 *
 * Usage:
 *   npx tsx scripts/docs-sync-check.ts            # human-readable report
 *   npx tsx scripts/docs-sync-check.ts --ci       # fails with exit 1 on drift
 *
 * Exit codes:
 *   0 — all checks pass (no drift detected)
 *   1 — drift detected (only in --ci mode)
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { execSync } from 'child_process';
import matter from 'gray-matter';

// ── Types ────────────────────────────────────────────────────────────────────

interface CheckResult {
  doc: string;
  status: 'ok' | 'warn' | 'error';
  message: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const DOCS = {
  hub: 'docs/PROJECT-HUB.md',
  roadmap: 'docs/PRIORITY-ROADMAP.md',
  testing: 'docs/testing/TESTING-STATUS.md',
  launch: 'docs/LAUNCH-READINESS.md',
} as const;

// Allow 1 session of drift between roadmap and hub (normal mid-session state)
const ROADMAP_MAX_DRIFT = 1;
// Test count drift tolerance — ±5% allows for small additions without a full refresh
const TEST_COUNT_DRIFT_PCT = 0.05;
// LAUNCH-READINESS change_type must have been bumped within the last N sessions
const LAUNCH_MAX_SESSION_DRIFT = 3;

// DEC-040 — Phase numbering is retired at Phase 22.
// New "Phase 23"/"Phase 24"/… references in docs are blocked unless they
// appear in this allowlist (historical archive + the DEC-040 entry itself).
const PHASE_NUMBERING_MAX = 22;
const PHASE_NUMBERING_ALLOWLIST = [
  'docs/COMPLETED-PHASES.md', // historical archive — keeps old phase mentions intact
  'docs/exports/',            // pre-DEC-040 exported snapshots
] as const;

// Support docs (Phase 22)
const SUPPORT_DOCS_ROOT = 'docs/support';
const SUPPORT_DOC_REQUIRED_FIELDS = [
  'title',
  'doc_type',
  'audience',
  'version',
  'legal_review_required',
  'status',
] as const;
const SUPPORT_DOC_TYPES = ['policy', 'faq', 'process', 'guide'] as const;
const SUPPORT_DOC_STATUSES = ['active', 'draft', 'archived'] as const;
const SUPPORT_LEGAL_STALENESS_DAYS = 90;

const isCi = process.argv.includes('--ci');

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseSessionFromText(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  return match ? parseInt(match[1], 10) : null;
}

function readFrontmatter(file: string): Record<string, unknown> | null {
  if (!existsSync(file)) return null;
  const content = readFileSync(file, 'utf-8');
  const parsed = matter(content);
  return parsed.data;
}

function getLatestSessionFromGit(): number {
  try {
    const log = execSync('git log --all --format="%s%n%b" -n 50', { encoding: 'utf-8' });
    const sessions: number[] = [];
    for (const match of log.matchAll(/[Ss]ession[\s-](\d+)/g)) {
      const n = parseInt(match[1], 10);
      if (Number.isFinite(n) && n < 200) sessions.push(n);
    }
    return sessions.length ? Math.max(...sessions) : 0;
  } catch {
    return 0;
  }
}

function getActualTestCount(): number | null {
  const junitPath = 'test-results/junit.xml';
  if (!existsSync(junitPath)) return null;
  try {
    const xml = readFileSync(junitPath, 'utf-8');
    // Root <testsuites tests="NNN" …>
    const match = xml.match(/<testsuites[^>]+tests="(\d+)"/);
    return match ? parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}

function sessionFromChangeType(changeType: unknown): number | null {
  if (typeof changeType !== 'string') return null;
  const match = changeType.match(/session-(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

// ── Checks ───────────────────────────────────────────────────────────────────

function checkProjectHub(latestSession: number): CheckResult {
  if (!existsSync(DOCS.hub)) {
    return { doc: DOCS.hub, status: 'error', message: 'File missing' };
  }
  const content = readFileSync(DOCS.hub, 'utf-8');
  const hubSession = parseSessionFromText(
    content,
    /Session Handoff \(Sessions \d+-(\d+)\)/,
  );
  if (hubSession === null) {
    return {
      doc: DOCS.hub,
      status: 'error',
      message: 'Could not find `Session Handoff (Sessions 25-NN)` header — expected format lost',
    };
  }
  if (hubSession < latestSession) {
    return {
      doc: DOCS.hub,
      status: 'error',
      message: `Header says Session ${hubSession} but git history references Session ${latestSession} (drift ${latestSession - hubSession})`,
    };
  }
  return {
    doc: DOCS.hub,
    status: 'ok',
    message: `Session Handoff at ${hubSession}, matches git history`,
  };
}

function checkPriorityRoadmap(latestSession: number): CheckResult {
  if (!existsSync(DOCS.roadmap)) {
    return { doc: DOCS.roadmap, status: 'error', message: 'File missing' };
  }
  const content = readFileSync(DOCS.roadmap, 'utf-8');
  const roadmapSession = parseSessionFromText(
    content,
    /as of [^—]+—\s*Session (\d+)/i,
  );
  if (roadmapSession === null) {
    return {
      doc: DOCS.roadmap,
      status: 'error',
      message: 'Could not find `as of … Session NN` header',
    };
  }
  const drift = latestSession - roadmapSession;
  if (drift > ROADMAP_MAX_DRIFT) {
    return {
      doc: DOCS.roadmap,
      status: 'error',
      message: `Header says Session ${roadmapSession} but git is at ${latestSession} (drift ${drift}, max allowed ${ROADMAP_MAX_DRIFT})`,
    };
  }
  return {
    doc: DOCS.roadmap,
    status: 'ok',
    message: `Session ${roadmapSession} (git at ${latestSession}, drift ${drift})`,
  };
}

function checkTestingStatus(): CheckResult {
  if (!existsSync(DOCS.testing)) {
    return { doc: DOCS.testing, status: 'error', message: 'File missing' };
  }
  const content = readFileSync(DOCS.testing, 'utf-8');
  const claimed = parseSessionFromText(content, /\|\s*\*\*Total tests\*\*\s*\|\s*(\d+)/);
  if (claimed === null) {
    return {
      doc: DOCS.testing,
      status: 'error',
      message: 'Could not find `| **Total tests** | NNN |` row',
    };
  }
  const actual = getActualTestCount();
  if (actual === null || actual === 0) {
    return {
      doc: DOCS.testing,
      status: 'warn',
      message:
        actual === 0
          ? `Claims ${claimed} tests; test-results/junit.xml reports 0 (likely a targeted vitest run overwrote it — run \`npm run test\` to refresh)`
          : `Claims ${claimed} tests; no test-results/junit.xml to compare against (run \`npm run test\` first to enable the check)`,
    };
  }
  const driftPct = Math.abs(actual - claimed) / actual;
  if (driftPct > TEST_COUNT_DRIFT_PCT) {
    return {
      doc: DOCS.testing,
      status: 'error',
      message: `Claims ${claimed} tests; actual run has ${actual} (drift ${(driftPct * 100).toFixed(1)}%, max ${(TEST_COUNT_DRIFT_PCT * 100).toFixed(0)}%)`,
    };
  }
  return {
    doc: DOCS.testing,
    status: 'ok',
    message: `${claimed} tests claimed, ${actual} actual (drift ${(driftPct * 100).toFixed(1)}%)`,
  };
}

function checkLaunchReadiness(latestSession: number): CheckResult {
  if (!existsSync(DOCS.launch)) {
    return { doc: DOCS.launch, status: 'error', message: 'File missing' };
  }
  const fm = readFrontmatter(DOCS.launch);
  if (!fm) {
    return { doc: DOCS.launch, status: 'error', message: 'Missing frontmatter' };
  }
  const fmSession = sessionFromChangeType(fm.change_type);
  if (fmSession === null) {
    return {
      doc: DOCS.launch,
      status: 'warn',
      message: `\`change_type: "${fm.change_type}"\` does not follow session-NN format — cannot verify currency`,
    };
  }
  const drift = latestSession - fmSession;
  if (drift > LAUNCH_MAX_SESSION_DRIFT) {
    return {
      doc: DOCS.launch,
      status: 'error',
      message: `change_type references Session ${fmSession}; git is at ${latestSession} (drift ${drift}, max allowed ${LAUNCH_MAX_SESSION_DRIFT})`,
    };
  }
  return {
    doc: DOCS.launch,
    status: 'ok',
    message: `change_type at session-${fmSession} (git at ${latestSession}, drift ${drift})`,
  };
}

function checkSupportDocs(): CheckResult[] {
  if (!existsSync(SUPPORT_DOCS_ROOT)) {
    return [
      {
        doc: SUPPORT_DOCS_ROOT,
        status: 'ok',
        message: 'Not present yet — Phase 22 A1 not shipped',
      },
    ];
  }

  const files = walkMarkdown(SUPPORT_DOCS_ROOT);
  if (files.length === 0) {
    return [
      {
        doc: SUPPORT_DOCS_ROOT,
        status: 'warn',
        message: 'Folder exists but contains no markdown files',
      },
    ];
  }

  const issues: CheckResult[] = [];
  let ok = 0;

  for (const file of files) {
    const fm = readFrontmatter(file);
    if (!fm) {
      issues.push({
        doc: file,
        status: 'error',
        message: 'Missing frontmatter',
      });
      continue;
    }

    const missing = SUPPORT_DOC_REQUIRED_FIELDS.filter(
      (f) => fm[f] === undefined || fm[f] === null,
    );
    if (missing.length > 0) {
      issues.push({
        doc: file,
        status: 'error',
        message: `Missing required frontmatter fields: ${missing.join(', ')}`,
      });
      continue;
    }

    if (!SUPPORT_DOC_TYPES.includes(fm.doc_type as (typeof SUPPORT_DOC_TYPES)[number])) {
      issues.push({
        doc: file,
        status: 'error',
        message: `Invalid doc_type "${fm.doc_type}" — must be one of: ${SUPPORT_DOC_TYPES.join(', ')}`,
      });
      continue;
    }

    if (!SUPPORT_DOC_STATUSES.includes(fm.status as (typeof SUPPORT_DOC_STATUSES)[number])) {
      issues.push({
        doc: file,
        status: 'error',
        message: `Invalid status "${fm.status}" — must be one of: ${SUPPORT_DOC_STATUSES.join(', ')}`,
      });
      continue;
    }

    if (!Array.isArray(fm.audience) || fm.audience.length === 0) {
      issues.push({
        doc: file,
        status: 'error',
        message: 'audience must be a non-empty array',
      });
      continue;
    }

    // Archived docs skip remaining semantic checks
    if (fm.status === 'archived') {
      ok++;
      continue;
    }

    // Legal-review rules
    if (fm.legal_review_required === true && fm.status === 'active') {
      if (!fm.reviewed_by || !fm.reviewed_date) {
        issues.push({
          doc: file,
          status: 'error',
          message:
            'legal_review_required + status=active but reviewed_by/reviewed_date is null — cannot publish without lawyer sign-off',
        });
        continue;
      }
      // Staleness check
      const lastUpdated = fm.last_updated;
      if (typeof lastUpdated === 'string') {
        const updated = new Date(lastUpdated);
        const ageDays = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays > SUPPORT_LEGAL_STALENESS_DAYS) {
          issues.push({
            doc: file,
            status: 'warn',
            message: `Legal-reviewed doc is ${Math.round(ageDays)} days old (threshold ${SUPPORT_LEGAL_STALENESS_DAYS}). Consider review refresh.`,
          });
          continue;
        }
      }
    }

    ok++;
  }

  if (issues.length === 0) {
    return [
      {
        doc: SUPPORT_DOCS_ROOT,
        status: 'ok',
        message: `${ok} support docs validated — all frontmatter compliant`,
      },
    ];
  }

  return [
    {
      doc: SUPPORT_DOCS_ROOT,
      status: 'ok',
      message: `${ok}/${files.length} valid (${issues.length} flagged below)`,
    },
    ...issues,
  ];
}

function isDec040MetaReference(lines: string[], idx: number): boolean {
  // A Phase 23+ mention is allowed if it's a meta-reference to DEC-040.
  // Two ways that's true:
  //   1. Inside the DEC-040 section (walk upward to nearest `### DEC-NNN`)
  //   2. Within ±10 lines of any "DEC-040" mention (covers handoff entries,
  //      revision-history rows, and inline rule citations)
  for (let i = idx; i >= 0; i--) {
    const line = lines[i];
    const decMatch = line.match(/^###\s+DEC-(\d+)/);
    if (decMatch) {
      if (decMatch[1] === '040') return true;
      break; // hit a different DEC heading — stop section-walk
    }
    if (/^##\s+/.test(line)) break;
  }
  const start = Math.max(0, idx - 10);
  const end = Math.min(lines.length, idx + 10);
  for (let i = start; i < end; i++) {
    if (/DEC-040/.test(lines[i])) return true;
  }
  return false;
}

function checkPhaseNumbering(): CheckResult[] {
  // DEC-040 guard: any "Phase 23"/"Phase 24"/… in docs/**/*.md fails CI.
  // Allowlist covers the historical archive and exported snapshots.
  const docsRoot = 'docs';
  if (!existsSync(docsRoot)) {
    return [{ doc: 'docs', status: 'ok', message: 'docs/ folder absent — skipping' }];
  }

  const files = walkMarkdown(docsRoot);
  const offenders: { file: string; line: number; phase: number; text: string }[] = [];

  for (const file of files) {
    if (PHASE_NUMBERING_ALLOWLIST.some((prefix) => file.startsWith(prefix))) continue;

    const content = readFileSync(file, 'utf-8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, idx) => {
      // Match "Phase NN" where NN is 23+. Captures both bare "Phase 23"
      // and milestone-shaped "Phase 23: …" / "phase-23".
      for (const m of line.matchAll(/\bPhase[\s-](\d{2,3})\b/gi)) {
        const n = parseInt(m[1], 10);
        if (n > PHASE_NUMBERING_MAX) {
          // Skip the DEC-040 entry itself — it explicitly cites "Phase 23"
          // as the thing not to do. Walk upward to the nearest section
          // heading; if it's DEC-040, the mention is intentional.
          if (isDec040MetaReference(lines, idx)) continue;
          offenders.push({ file, line: idx + 1, phase: n, text: line.trim() });
        }
      }
    });
  }

  if (offenders.length === 0) {
    return [
      {
        doc: 'docs/**/*.md (Phase numbering)',
        status: 'ok',
        message: `No Phase ${PHASE_NUMBERING_MAX + 1}+ references — DEC-040 themed-milestone convention holds`,
      },
    ];
  }

  return [
    {
      doc: 'docs/**/*.md (Phase numbering)',
      status: 'error',
      message:
        `Found ${offenders.length} reference(s) to Phase ${PHASE_NUMBERING_MAX + 1}+ — DEC-040 retired sequential phase numbering. ` +
        `Use a themed milestone instead. Offenders:\n` +
        offenders
          .slice(0, 10)
          .map((o) => `       • ${o.file}:${o.line} — "Phase ${o.phase}" in: ${o.text.slice(0, 100)}`)
          .join('\n') +
        (offenders.length > 10 ? `\n       … and ${offenders.length - 10} more` : ''),
    },
  ];
}

function walkMarkdown(root: string): string[] {
  const out: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stats = statSync(full);
      if (stats.isDirectory()) {
        stack.push(full);
      } else if (entry.endsWith('.md')) {
        out.push(relative(process.cwd(), full).replace(/\\/g, '/'));
      }
    }
  }
  return out.sort();
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  const latestSession = getLatestSessionFromGit();

  if (latestSession === 0) {
    console.log('⚠️  Could not infer latest session from git history — skipping currency checks.');
    process.exit(0);
  }

  const results: CheckResult[] = [
    checkProjectHub(latestSession),
    checkPriorityRoadmap(latestSession),
    checkTestingStatus(),
    checkLaunchReadiness(latestSession),
    ...checkSupportDocs(),
    ...checkPhaseNumbering(),
  ];

  const errors = results.filter((r) => r.status === 'error');
  const warnings = results.filter((r) => r.status === 'warn');

  console.log('\n📄 Documentation Sync Check');
  console.log(`Latest session (from git): ${latestSession}\n`);

  for (const r of results) {
    const icon = r.status === 'ok' ? '✅' : r.status === 'warn' ? '⚠️ ' : '❌';
    console.log(`${icon}  ${r.doc}`);
    console.log(`     ${r.message}\n`);
  }

  console.log('─'.repeat(72));
  console.log(
    `Summary: ${results.length - errors.length - warnings.length} ok, ${warnings.length} warn, ${errors.length} error`,
  );

  if (errors.length > 0) {
    console.log(
      '\n💡 Fix suggestions:\n' +
        '   • Update the flagged file(s) with current session/test count\n' +
        '   • Re-run `npm run docs:sync-check` to verify\n' +
        '   • See Phase 6 checklist in CLAUDE.md for the full doc-update flow',
    );
    if (isCi) process.exit(1);
  }
}

main();
