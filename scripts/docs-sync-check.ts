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
 * Complements scripts/docs-audit.ts (which checks frontmatter + orphans).
 *
 * Usage:
 *   npx tsx scripts/docs-sync-check.ts            # human-readable report
 *   npx tsx scripts/docs-sync-check.ts --ci       # fails with exit 1 on drift
 *
 * Exit codes:
 *   0 — all four docs current (no drift detected)
 *   1 — drift detected (only in --ci mode)
 */

import { readFileSync, existsSync } from 'fs';
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
