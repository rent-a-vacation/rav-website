/**
 * /sdlc-docs — Documentation Sync Watchdog
 *
 * Diff-aware doc-sync checker. Cross-references PR-wide file changes against
 * scripts/source-doc-map.json (canonical mapping) + applies heuristic rules
 * (UserGuide drift, flow-manifest drift, seed-manager drift, SECURITY-RISK-LOG
 * triggers). Distinguishes warn-mode (never blocks) from gate-mode (blocks PRs).
 *
 * Complements scripts/docs-audit.ts (frontmatter + last-commit check). This
 * script is PR-aware: it diffs against the merge base, not just HEAD~1.
 *
 * Usage:
 *   npx tsx scripts/sdlc-docs.ts audit [--gate|--warn] [--base <ref>]
 *   npx tsx scripts/sdlc-docs.ts report
 *
 * Modes:
 *   --warn   Never exit non-zero. Print findings; use on dev push.
 *   --gate   Exit 1 if any GATING rule fails. Use on PR to main.
 *
 * Default base: origin/main (PR's target).
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

// ── Types ────────────────────────────────────────────────────────────────────

interface SourceDocMapping {
  source: string[];
  docs: string[];
}

interface MapFile {
  mappings: SourceDocMapping[];
}

type Severity = 'gate' | 'warn' | 'info';

interface Finding {
  rule: string;
  severity: Severity;
  message: string;
  suggested_action?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const MAP_FILE = 'scripts/source-doc-map.json';

// Heuristic rule triggers
const USER_GUIDE_PATH = 'src/pages/UserGuide.tsx';
const FAQ_PATH = 'src/pages/FAQ.tsx';
const APP_ROUTER_PATH = 'src/App.tsx';
const FLOWS_DIR = 'src/flows';
const SEED_MANAGER_PATH = 'supabase/functions/seed-manager/index.ts';
const SECURITY_RISK_LOG = 'docs/SECURITY-RISK-LOG.md';

// SECURITY-RISK-LOG trigger paths (any change here suggests log entry)
const SECURITY_TRIGGER_PATHS = [
  'package.json',
  'package-lock.json',
  'supabase/functions/_shared/auth.ts',
  '.github/workflows/',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function matchesGlob(filePath: string, pattern: string): boolean {
  // Same simple glob algorithm as docs-audit.ts
  const regexStr = pattern
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*');
  return new RegExp(`^${regexStr}$`).test(filePath);
}

function gitChangedFiles(base: string): string[] {
  // PR-wide diff: everything on this branch since it diverged from base.
  // Falls back to HEAD~1..HEAD if base ref isn't fetched.
  try {
    const out = execSync(
      `git diff --name-only --diff-filter=ACMR ${base}...HEAD`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return out.split('\n').filter(Boolean);
  } catch {
    try {
      const out = execSync(
        `git diff --name-only --diff-filter=ACMR HEAD~1..HEAD`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
      return out.split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }
}

function loadSourceDocMap(): MapFile {
  if (!existsSync(MAP_FILE)) {
    return { mappings: [] };
  }
  return JSON.parse(readFileSync(MAP_FILE, 'utf-8'));
}

function getAllFiles(dir: string, ext?: string): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...getAllFiles(full, ext));
    } else if (!ext || entry.name.endsWith(ext)) {
      // Normalize path separator for cross-platform glob matching
      out.push(full.replace(/\\/g, '/'));
    }
  }
  return out;
}

// ── Rules ────────────────────────────────────────────────────────────────────

/**
 * GATING rule: source-doc-map drift.
 *
 * When a source file mapped in source-doc-map.json changes, the mapped doc
 * MUST be updated in the same PR (or its frontmatter `change_type` should
 * acknowledge the change). Otherwise the PR risks shipping code-doc drift.
 */
function ruleSourceDocMap(changed: string[]): Finding[] {
  const findings: Finding[] = [];
  const map = loadSourceDocMap();
  for (const mapping of map.mappings) {
    const sourceChanged = changed.filter((file) =>
      mapping.source.some((pattern) => matchesGlob(file, pattern))
    );
    if (sourceChanged.length === 0) continue;

    const docsChanged = mapping.docs.filter((doc) => changed.includes(doc));
    const docsMissing = mapping.docs.filter((doc) => !changed.includes(doc));

    if (docsMissing.length === 0) continue;

    // Trim source list for readability
    const sourceSample = sourceChanged.slice(0, 3).join(', ') +
      (sourceChanged.length > 3 ? ` (+${sourceChanged.length - 3} more)` : '');

    for (const doc of docsMissing) {
      findings.push({
        rule: 'source-doc-map',
        severity: 'gate',
        message: `Source changed: ${sourceSample} → mapped doc not updated: ${doc}`,
        suggested_action: `Update ${doc} (or add a comment justifying why the change doesn't affect it), then re-push.`,
      });
    }
  }
  return findings;
}

/**
 * WARN rule: UserGuide drift.
 *
 * If a user-facing page (src/pages/*.tsx) changes — but UserGuide.tsx + FAQ.tsx
 * don't — that often means user-visible behavior shipped without doc update.
 * Heuristic; many page changes are internal (state, layout) and don't need it.
 */
function ruleUserGuideDrift(changed: string[]): Finding[] {
  const findings: Finding[] = [];

  const pageChanges = changed.filter(
    (f) =>
      f.startsWith('src/pages/') &&
      f.endsWith('.tsx') &&
      f !== USER_GUIDE_PATH &&
      f !== FAQ_PATH &&
      !f.includes('.test.') &&
      // skip admin/owner-only pages — those aren't in user guide
      !f.startsWith('src/pages/admin/') &&
      !f.startsWith('src/pages/owner/') &&
      !f.startsWith('src/pages/settings/')
  );

  if (pageChanges.length === 0) return findings;

  const userGuideChanged = changed.includes(USER_GUIDE_PATH);
  const faqChanged = changed.includes(FAQ_PATH);

  if (!userGuideChanged && !faqChanged) {
    findings.push({
      rule: 'user-guide-drift',
      severity: 'warn',
      message: `${pageChanges.length} user-facing page(s) changed but UserGuide.tsx + FAQ.tsx untouched: ${pageChanges.slice(0, 3).join(', ')}${pageChanges.length > 3 ? '...' : ''}`,
      suggested_action: `Audit whether user-visible behavior changed. If yes, update src/pages/UserGuide.tsx and/or src/pages/FAQ.tsx in this PR.`,
    });
  }

  return findings;
}

/**
 * WARN rule: flow manifest drift.
 *
 * If App.tsx changes, suggest checking src/flows/ manifests so the
 * /architecture page diagrams stay synced.
 */
function ruleFlowManifestDrift(changed: string[]): Finding[] {
  const findings: Finding[] = [];

  if (!changed.includes(APP_ROUTER_PATH)) return findings;

  const flowsChanged = changed.some((f) => f.startsWith(FLOWS_DIR + '/'));
  if (!flowsChanged) {
    findings.push({
      rule: 'flow-manifest-drift',
      severity: 'warn',
      message: `${APP_ROUTER_PATH} changed (likely route changes) but no src/flows/ manifest was updated.`,
      suggested_action: `If a new route was added, append a step to the appropriate src/flows/<lifecycle>.ts file. The /architecture page auto-renders from manifests.`,
    });
  }

  return findings;
}

/**
 * WARN rule: seed-manager drift.
 *
 * New migration with new tables should be reflected in seed-manager so DEV
 * has realistic test data for admin dashboards.
 */
function ruleSeedManagerDrift(changed: string[]): Finding[] {
  const findings: Finding[] = [];

  const newMigrations = changed.filter(
    (f) => f.startsWith('supabase/migrations/') && f.endsWith('.sql')
  );
  if (newMigrations.length === 0) return findings;

  // Heuristic: any new migration creates the suggestion. Caller decides.
  const seedChanged = changed.includes(SEED_MANAGER_PATH);

  // Determine if new migrations likely add tables (vs. just RLS/index)
  let hasTableCreate = false;
  for (const mig of newMigrations) {
    if (!existsSync(mig)) continue;
    const content = readFileSync(mig, 'utf-8');
    if (/CREATE\s+TABLE/i.test(content)) {
      hasTableCreate = true;
      break;
    }
  }

  if (hasTableCreate && !seedChanged) {
    findings.push({
      rule: 'seed-manager-drift',
      severity: 'warn',
      message: `${newMigrations.length} new migration(s) include CREATE TABLE but ${SEED_MANAGER_PATH} was not updated.`,
      suggested_action: `Add seed rows for the new tables so DEV admin dashboards have realistic test data. See CLAUDE.md "Seed Manager Convention".`,
    });
  }

  return findings;
}

/**
 * WARN rule: SECURITY-RISK-LOG triggers.
 *
 * Changes to dependencies, auth, RLS, or CI workflows should usually be
 * reflected in SECURITY-RISK-LOG.md. The log is the audit trail.
 */
function ruleSecurityRiskLog(changed: string[]): Finding[] {
  const findings: Finding[] = [];

  const triggers = changed.filter((f) =>
    SECURITY_TRIGGER_PATHS.some((trigger) =>
      trigger.endsWith('/') ? f.startsWith(trigger) : f === trigger
    )
  );

  // Also flag RLS-related migrations
  const rlsMigrations = changed.filter((f) => {
    if (!f.startsWith('supabase/migrations/') || !f.endsWith('.sql')) return false;
    if (/rls|policy|security/i.test(f)) return true;
    if (!existsSync(f)) return false;
    const content = readFileSync(f, 'utf-8');
    return /CREATE\s+POLICY|ALTER\s+POLICY|SECURITY\s+DEFINER/i.test(content);
  });

  const allTriggers = [...new Set([...triggers, ...rlsMigrations])];
  if (allTriggers.length === 0) return findings;

  const logChanged = changed.includes(SECURITY_RISK_LOG);
  if (!logChanged) {
    findings.push({
      rule: 'security-risk-log-trigger',
      severity: 'warn',
      message: `Security-relevant change(s) detected but ${SECURITY_RISK_LOG} not updated: ${allTriggers.slice(0, 3).join(', ')}${allTriggers.length > 3 ? '...' : ''}`,
      suggested_action: `If the change affects threat surface (new dep, auth flow, RLS rule), add a triage entry to SECURITY-RISK-LOG.md. If it's hygiene only, ignore this warning.`,
    });
  }

  return findings;
}

// ── Report subcommand ────────────────────────────────────────────────────────

function runReport(): void {
  console.log('\n📋 /sdlc-docs report');
  console.log('═'.repeat(72));

  // 1. Stale-doc list (>30 days last_updated)
  const docs = getAllFiles('docs', '.md');
  const stale: Array<{ file: string; days: number; status: string }> = [];
  for (const file of docs) {
    try {
      const content = readFileSync(file, 'utf-8');
      const { data } = matter(content);
      if (!data.last_updated) continue;
      if (data.status === 'archived') continue;
      const days = Math.floor(
        (Date.now() - new Date(data.last_updated).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (days > 30) {
        stale.push({ file, days, status: data.status ?? '(no status)' });
      }
    } catch {
      // skip unparseable
    }
  }
  stale.sort((a, b) => b.days - a.days);

  console.log(`\n📅 Stale docs (>30 days): ${stale.length}`);
  for (const s of stale.slice(0, 15)) {
    console.log(`   ${s.days}d  ${s.file}`);
  }
  if (stale.length > 15) console.log(`   ... and ${stale.length - 15} more`);

  // 2. Features missing README
  const featuresRoot = 'docs/features';
  const missingReadmes: string[] = [];
  if (existsSync(featuresRoot)) {
    for (const entry of readdirSync(featuresRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const readmePath = join(featuresRoot, entry.name, 'README.md');
      if (!existsSync(readmePath)) {
        missingReadmes.push(entry.name);
      }
    }
  }
  console.log(`\n📁 docs/features/ folders missing README: ${missingReadmes.length}`);
  for (const m of missingReadmes) console.log(`   - ${m}`);

  // 3. Archived-status docs not in archive/ folder
  const misfiledArchive: string[] = [];
  for (const file of docs) {
    if (file.includes('/archive/')) continue;
    try {
      const { data } = matter(readFileSync(file, 'utf-8'));
      if (data.status === 'archived') misfiledArchive.push(file);
    } catch {
      // skip
    }
  }
  console.log(`\n📦 Archived-status docs NOT in docs/archive/: ${misfiledArchive.length}`);
  for (const m of misfiledArchive) console.log(`   - ${m}`);

  console.log('\n' + '═'.repeat(72));
  console.log('Done.\n');
}

// ── Audit subcommand ─────────────────────────────────────────────────────────

interface AuditOptions {
  mode: 'warn' | 'gate';
  base: string;
}

function runAudit(opts: AuditOptions): void {
  const changed = gitChangedFiles(opts.base);

  console.log('\n📋 /sdlc-docs audit');
  console.log('═'.repeat(72));
  console.log(`Mode: ${opts.mode}`);
  console.log(`Base: ${opts.base}`);
  console.log(`Changed files: ${changed.length}`);
  console.log('═'.repeat(72));

  if (changed.length === 0) {
    console.log('\n✅ No changes since base — nothing to check.\n');
    return;
  }

  const allFindings: Finding[] = [
    ...ruleSourceDocMap(changed),
    ...ruleUserGuideDrift(changed),
    ...ruleFlowManifestDrift(changed),
    ...ruleSeedManagerDrift(changed),
    ...ruleSecurityRiskLog(changed),
  ];

  const gating = allFindings.filter((f) => f.severity === 'gate');
  const warnings = allFindings.filter((f) => f.severity === 'warn');

  // Print gating first
  if (gating.length > 0) {
    console.log(`\n🛑 GATING (${gating.length}):`);
    for (const f of gating) {
      console.log(`\n   [${f.rule}] ${f.message}`);
      if (f.suggested_action) console.log(`   → ${f.suggested_action}`);
    }
  }

  // Then warnings
  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
    for (const f of warnings) {
      console.log(`\n   [${f.rule}] ${f.message}`);
      if (f.suggested_action) console.log(`   → ${f.suggested_action}`);
    }
  }

  if (gating.length === 0 && warnings.length === 0) {
    console.log('\n✅ No drift detected.\n');
    return;
  }

  console.log('\n' + '═'.repeat(72));
  console.log(`Summary: ${gating.length} gating, ${warnings.length} warnings.`);

  // Exit code
  if (opts.mode === 'gate' && gating.length > 0) {
    console.log('\n❌ GATE FAILED — fix gating findings before merging to main.\n');
    process.exit(1);
  }

  if (opts.mode === 'warn') {
    if (gating.length > 0 || warnings.length > 0) {
      console.log('\n💡 Warn mode — these would block at PR-to-main gate. Address before opening PR.\n');
    }
    return; // never exit non-zero in warn mode
  }

  // gate mode, no gating findings
  console.log('\n✅ Gate passed.\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2);
  const subcommand = args[0];

  if (!subcommand || subcommand === '--help' || subcommand === '-h') {
    console.log(`
/sdlc-docs — Documentation Sync Watchdog

Usage:
  npx tsx scripts/sdlc-docs.ts audit [--gate|--warn] [--base <ref>]
  npx tsx scripts/sdlc-docs.ts report

Subcommands:
  audit    Diff-aware drift check (source-doc-map + heuristic rules)
  report   Health snapshot: stale docs, missing READMEs, misfiled archives

Audit modes:
  --warn   Never exit non-zero. Print findings; suitable for dev-push CI.
  --gate   Exit 1 if any gating rule fails. Suitable for PR-to-main CI.

Audit options:
  --base <ref>   Base ref for diff (default: origin/main)
`);
    return;
  }

  if (subcommand === 'audit') {
    const mode: 'warn' | 'gate' = args.includes('--gate') ? 'gate' : 'warn';
    const baseIdx = args.indexOf('--base');
    const base = baseIdx >= 0 && args[baseIdx + 1] ? args[baseIdx + 1] : 'origin/main';
    runAudit({ mode, base });
    return;
  }

  if (subcommand === 'report') {
    runReport();
    return;
  }

  console.error(`Unknown subcommand: ${subcommand}. Run with --help for usage.`);
  process.exit(2);
}

main();
