/**
 * WS2 Story 1 — Resort Data Quality Audit
 *
 * Scores all resort records and generates a markdown report.
 *
 * Usage:
 *   npx tsx scripts/audit-resort-data-quality.ts
 *
 * Requires .env.local with VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY).
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const TEMPLATE_PATTERN = /^A premium vacation ownership resort offering spacious accommodations/;
const GENERIC_PHONE = '+1-800-932-4482';
const PLACEHOLDER_AIRPORT = 'Local airport';

interface ResortAuditResult {
  id: string;
  resort_name: string;
  brand: string;
  city: string;
  quality_score: number;
  flags: string[];
  unit_type_count: number;
}

async function main() {
  console.log('Fetching resorts...');
  const { data: resorts, error } = await supabase
    .from('resorts')
    .select('*, resort_unit_types(id)')
    .order('brand');

  if (error || !resorts) {
    console.error('Failed to fetch resorts:', error?.message);
    process.exit(1);
  }

  // Build per-brand rating map to detect bulk ratings
  const brandRatings = new Map<string, Map<number, number>>();
  for (const r of resorts) {
    if (r.guest_rating == null) continue;
    if (!brandRatings.has(r.brand)) brandRatings.set(r.brand, new Map());
    const counts = brandRatings.get(r.brand)!;
    counts.set(r.guest_rating, (counts.get(r.guest_rating) || 0) + 1);
  }

  const results: ResortAuditResult[] = [];

  for (const r of resorts) {
    const flags: string[] = [];
    const desc = r.description || '';
    const loc = r.location as { city?: string; state?: string } | null;

    if (TEMPLATE_PATTERN.test(desc)) flags.push('TEMPLATE');
    if (desc.length > 0 && desc.length < 80) flags.push('SHORT_DESCRIPTION');

    const airports = (r.nearby_airports as string[]) || [];
    if (airports.some((a: string) => a.includes(PLACEHOLDER_AIRPORT))) flags.push('PLACEHOLDER');

    const contact = r.contact as { phone?: string } | null;
    if (contact?.phone === GENERIC_PHONE) flags.push('GENERIC_PHONE');

    if (r.guest_rating != null) {
      const counts = brandRatings.get(r.brand);
      if (counts) {
        const brandCount = Array.from(counts.values()).reduce((a, b) => a + b, 0);
        const thisRatingCount = counts.get(r.guest_rating) || 0;
        if (brandCount > 3 && thisRatingCount / brandCount > 0.8) flags.push('BULK_RATING');
      }
    }

    if (r.latitude == null || r.longitude == null) flags.push('NO_COORDS');
    if (!r.postal_code) flags.push('NO_POSTAL');

    results.push({
      id: r.id,
      resort_name: r.resort_name,
      brand: r.brand,
      city: loc?.city || '?',
      quality_score: r.data_quality_score ?? 0,
      flags,
      unit_type_count: Array.isArray(r.resort_unit_types) ? r.resort_unit_types.length : 0,
    });
  }

  // Generate report
  const total = results.length;
  const flagCounts: Record<string, number> = {};
  for (const r of results) {
    for (const f of r.flags) {
      flagCounts[f] = (flagCounts[f] || 0) + 1;
    }
  }

  const brandGroups = new Map<string, ResortAuditResult[]>();
  for (const r of results) {
    if (!brandGroups.has(r.brand)) brandGroups.set(r.brand, []);
    brandGroups.get(r.brand)!.push(r);
  }

  const needsAttention = results.filter((r) => r.quality_score < 40);
  const acceptable = results.filter((r) => r.quality_score >= 70);

  let md = `# Resort Data Quality Report\n\n`;
  md += `> Generated: ${new Date().toISOString()}\n>\n`;
  md += `> Total resorts: **${total}**\n\n`;

  md += `## Summary — Flag Distribution\n\n`;
  md += `| Flag | Count | % |\n|------|-------|---|\n`;
  for (const [flag, count] of Object.entries(flagCounts).sort((a, b) => b[1] - a[1])) {
    md += `| ${flag} | ${count} | ${((count / total) * 100).toFixed(0)}% |\n`;
  }

  md += `\n## Per-Brand Breakdown\n\n`;
  for (const [brand, group] of brandGroups) {
    const brandFlags: Record<string, number> = {};
    for (const r of group) {
      for (const f of r.flags) brandFlags[f] = (brandFlags[f] || 0) + 1;
    }
    const avgScore = group.reduce((s, r) => s + r.quality_score, 0) / group.length;
    md += `### ${brand} (${group.length} resorts, avg score ${avgScore.toFixed(1)})\n\n`;
    if (Object.keys(brandFlags).length > 0) {
      md += `| Flag | Count |\n|------|-------|\n`;
      for (const [f, c] of Object.entries(brandFlags)) md += `| ${f} | ${c} |\n`;
    } else {
      md += `No flags.\n`;
    }
    md += `\n`;
  }

  md += `## Needs Immediate Attention (score < 40)\n\n`;
  if (needsAttention.length === 0) {
    md += `None.\n\n`;
  } else {
    md += `| Resort | Brand | City | Score | Flags |\n|--------|-------|------|-------|-------|\n`;
    for (const r of needsAttention) {
      md += `| ${r.resort_name} | ${r.brand} | ${r.city} | ${r.quality_score} | ${r.flags.join(', ')} |\n`;
    }
    md += `\n`;
  }

  md += `## Acceptable (score ≥ 70)\n\n`;
  if (acceptable.length === 0) {
    md += `None.\n\n`;
  } else {
    md += `| Resort | Brand | City | Score | Flags |\n|--------|-------|------|-------|-------|\n`;
    for (const r of acceptable) {
      md += `| ${r.resort_name} | ${r.brand} | ${r.city} | ${r.quality_score} | ${r.flags.join(', ')} |\n`;
    }
    md += `\n`;
  }

  const outPath = path.resolve('docs/features/mdm-resort-data/data-quality-report.md');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, md, 'utf-8');
  console.log(`\nReport written to ${outPath}`);
  console.log(`Total: ${total} resorts`);
  console.log(`Flags: ${Object.entries(flagCounts).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  console.log(`Needs attention (< 40): ${needsAttention.length}`);
  console.log(`Acceptable (≥ 70): ${acceptable.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
