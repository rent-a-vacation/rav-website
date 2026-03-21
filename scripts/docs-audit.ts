/**
 * Documentation Audit Script
 *
 * Validates frontmatter on all docs/*.md files and cross-references
 * source-to-doc mapping to detect staleness.
 *
 * Usage:
 *   npx tsx scripts/docs-audit.ts [--ci]
 *
 * --ci flag: exits with code 1 on errors (for CI pipeline)
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { execSync } from 'child_process';
import matter from 'gray-matter';

// ── Types ────────────────────────────────────────────────────────────────────

interface AuditResult {
  file: string;
  errors: string[];
  warnings: string[];
}

interface SourceDocMapping {
  source: string[];
  docs: string[];
}

interface MapFile {
  mappings: SourceDocMapping[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const DOCS_DIRS = ['docs', 'handoffs'];
const MAP_FILE = 'scripts/source-doc-map.json';
const REQUIRED_FIELDS = ['last_updated', 'change_ref', 'change_type', 'status'];
const VALID_STATUSES = ['active', 'archived', 'draft'];
const STALENESS_DAYS = 30;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAllMdFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllMdFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

function getChangedFilesSince(days: number): string[] {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];
    const output = execSync(
      `git log --since="${sinceStr}" --name-only --pretty=format: --diff-filter=ACMR`,
      { encoding: 'utf-8' }
    );
    return [...new Set(output.split('\n').filter(Boolean))];
  } catch {
    return [];
  }
}

function getChangedFilesInCommit(): string[] {
  try {
    const output = execSync(
      'git diff --name-only HEAD~1..HEAD --diff-filter=ACMR 2>/dev/null || git diff --name-only --cached --diff-filter=ACMR',
      { encoding: 'utf-8' }
    );
    return output.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function matchesGlob(filePath: string, pattern: string): boolean {
  // Simple glob matching: ** matches any path, * matches any segment
  const regexStr = pattern
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*');
  return new RegExp(`^${regexStr}$`).test(filePath);
}

// ── Audit Logic ──────────────────────────────────────────────────────────────

function validateFrontmatter(filePath: string): AuditResult {
  const result: AuditResult = { file: filePath, errors: [], warnings: [] };
  const content = readFileSync(filePath, 'utf-8');

  // Check if file has frontmatter at all
  if (!content.startsWith('---')) {
    result.errors.push('Missing YAML frontmatter');
    return result;
  }

  try {
    const { data } = matter(content);

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!data[field]) {
        result.errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate status
    if (data.status && !VALID_STATUSES.includes(data.status)) {
      result.errors.push(`Invalid status "${data.status}" — must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    // Validate last_updated is a parseable date
    if (data.last_updated) {
      const parsed = new Date(data.last_updated);
      if (isNaN(parsed.getTime())) {
        result.errors.push(`Invalid last_updated date: "${data.last_updated}"`);
      } else {
        // Staleness warning (skip archived)
        const daysSince = (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24);
        if (data.status !== 'archived' && daysSince > STALENESS_DAYS) {
          result.warnings.push(`Doc is ${Math.floor(daysSince)} days old (last updated: ${data.last_updated})`);
        }
      }
    }
  } catch (e) {
    result.errors.push(`Failed to parse frontmatter: ${(e as Error).message}`);
  }

  return result;
}

function checkSourceDocMapping(): AuditResult[] {
  if (!existsSync(MAP_FILE)) return [];

  const map: MapFile = JSON.parse(readFileSync(MAP_FILE, 'utf-8'));
  const changedFiles = getChangedFilesInCommit();
  const results: AuditResult[] = [];

  if (changedFiles.length === 0) return [];

  for (const mapping of map.mappings) {
    // Check if any source files in this mapping were changed
    const sourceChanged = changedFiles.some((changed) =>
      mapping.source.some((pattern) => matchesGlob(changed, pattern))
    );

    if (!sourceChanged) continue;

    // Check if any of the mapped docs were also changed
    const docsChanged = mapping.docs.some((doc) => changedFiles.includes(doc));

    if (!docsChanged) {
      const changedSources = changedFiles.filter((changed) =>
        mapping.source.some((pattern) => matchesGlob(changed, pattern))
      );
      for (const doc of mapping.docs) {
        results.push({
          file: doc,
          errors: [],
          warnings: [
            `Source file(s) changed (${changedSources.slice(0, 3).join(', ')}${changedSources.length > 3 ? '...' : ''}) but this doc was not updated`,
          ],
        });
      }
    }
  }

  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const isCI = process.argv.includes('--ci');
  const allFiles = DOCS_DIRS.flatMap((dir) => getAllMdFiles(dir));
  const results: AuditResult[] = [];

  // 1. Validate frontmatter on all docs
  for (const file of allFiles) {
    results.push(validateFrontmatter(file));
  }

  // 2. Cross-reference source-to-doc mapping
  results.push(...checkSourceDocMapping());

  // 3. Report
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const cleanFiles = results.filter((r) => r.errors.length === 0 && r.warnings.length === 0).length;

  console.log('\n📋 Documentation Audit Report');
  console.log('═'.repeat(50));
  console.log(`Files scanned: ${allFiles.length}`);
  console.log(`Clean: ${cleanFiles} | Errors: ${totalErrors} | Warnings: ${totalWarnings}`);
  console.log('═'.repeat(50));

  // Print errors first
  for (const r of results) {
    if (r.errors.length > 0) {
      console.log(`\n❌ ${r.file}`);
      for (const err of r.errors) {
        console.log(`   ERROR: ${err}`);
      }
    }
  }

  // Then warnings
  for (const r of results) {
    if (r.warnings.length > 0 && r.errors.length === 0) {
      console.log(`\n⚠️  ${r.file}`);
      for (const warn of r.warnings) {
        console.log(`   WARNING: ${warn}`);
      }
    }
  }

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('\n✅ All documentation files pass audit checks.');
  }

  console.log('');

  // CI mode: exit 1 on errors only (not warnings)
  if (isCI && totalErrors > 0) {
    process.exit(1);
  }
}

main();
