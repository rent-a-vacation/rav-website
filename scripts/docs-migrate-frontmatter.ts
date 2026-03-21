/**
 * One-time migration: Add YAML frontmatter to all docs/*.md files
 *
 * Usage:
 *   npx tsx scripts/docs-migrate-frontmatter.ts [--dry-run]
 *
 * Uses git log to determine accurate last_updated dates.
 * Historical/export/handoff docs are marked as "archived".
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import matter from 'gray-matter';

// ── Config ───────────────────────────────────────────────────────────────────

const DOCS_DIRS = ['docs', 'handoffs'];
const DRY_RUN = process.argv.includes('--dry-run');

// Patterns that indicate archived/historical docs
const ARCHIVED_PATTERNS = [
  /exports\//,
  /handoffs\//,
  /SESSION\d+-TASK/i,
  /PHASE\d+-.*-TASK/i,
  /UPDATED-SESSION/i,
  /archive\//,
  /TRANSITION-GUIDE/,
];

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

function getLastGitDate(filePath: string): string {
  try {
    const output = execSync(`git log -1 --format=%aI -- "${filePath}"`, {
      encoding: 'utf-8',
    }).trim();
    if (output) {
      // Convert to simplified ISO format without timezone
      const date = new Date(output);
      return date.toISOString().replace(/\.\d{3}Z$/, '');
    }
  } catch {
    // fallback
  }
  return new Date().toISOString().replace(/\.\d{3}Z$/, '');
}

function getLastGitSha(filePath: string): string {
  try {
    const output = execSync(`git log -1 --format=%h -- "${filePath}"`, {
      encoding: 'utf-8',
    }).trim();
    if (output) return output;
  } catch {
    // fallback
  }
  return '0000000';
}

function isArchived(filePath: string): boolean {
  return ARCHIVED_PATTERNS.some((p) => p.test(filePath));
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const allFiles = DOCS_DIRS.flatMap((dir) => getAllMdFiles(dir));

  let migrated = 0;
  let skipped = 0;

  console.log(`\n📄 Docs Frontmatter Migration ${DRY_RUN ? '(DRY RUN)' : ''}`);
  console.log('═'.repeat(50));
  console.log(`Found ${allFiles.length} markdown files\n`);

  for (const file of allFiles) {
    const content = readFileSync(file, 'utf-8');

    // Skip if already has frontmatter
    if (content.startsWith('---')) {
      try {
        const { data } = matter(content);
        if (data.last_updated) {
          console.log(`  SKIP (has frontmatter): ${file}`);
          skipped++;
          continue;
        }
      } catch {
        // Has --- but not valid frontmatter, proceed
      }
    }

    const lastUpdated = getLastGitDate(file);
    const changeRef = getLastGitSha(file);
    const status = isArchived(file) ? 'archived' : 'active';

    const frontmatter = [
      '---',
      `last_updated: "${lastUpdated}"`,
      `change_ref: "${changeRef}"`,
      `change_type: "session-39-docs-update"`,
      `status: "${status}"`,
      '---',
      '',
    ].join('\n');

    const newContent = frontmatter + content;

    if (DRY_RUN) {
      console.log(`  WOULD MIGRATE (${status}): ${file}`);
    } else {
      writeFileSync(file, newContent, 'utf-8');
      console.log(`  MIGRATED (${status}): ${file}`);
    }
    migrated++;
  }

  console.log('\n' + '═'.repeat(50));
  console.log(`Migrated: ${migrated} | Skipped: ${skipped} | Total: ${allFiles.length}`);
  if (DRY_RUN) {
    console.log('(Dry run — no files were modified)');
  }
  console.log('');
}

main();
