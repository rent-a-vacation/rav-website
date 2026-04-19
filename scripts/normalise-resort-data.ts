/**
 * WS2 Stories 3, 4, 5 — Data Normalisation + MDM Field Population
 *
 * Normalises location data, populates data_quality_score, and verifies data_source.
 *
 * Usage:
 *   npx tsx scripts/normalise-resort-data.ts             # dry-run (default)
 *   npx tsx scripts/normalise-resort-data.ts --apply      # write changes to DB
 *   npx tsx scripts/normalise-resort-data.ts --populate-scores  # also compute & store quality scores
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const POPULATE_SCORES = args.includes('--populate-scores');

// ── Mapping tables ──────────────────────────────────────────────

export const COUNTRY_MAP: Record<string, string> = {
  'United States': 'US', 'United States of America': 'US', 'USA': 'US',
  'Canada': 'CA', 'Mexico': 'MX', 'Japan': 'JP', 'United Kingdom': 'GB',
  'France': 'FR', 'Italy': 'IT', 'Spain': 'ES', 'Australia': 'AU',
  'Portugal': 'PT', 'Brazil': 'BR', 'Costa Rica': 'CR', 'Dominican Republic': 'DO',
  'Bahamas': 'BS', 'Jamaica': 'JM', 'Barbados': 'BB', 'Aruba': 'AW',
};

export const STATE_MAP: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY',
  'Oahu': 'HI', 'Maui': 'HI', 'Big Island': 'HI', 'Kauai': 'HI',
};

export function normaliseTime(t: string): string {
  const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return t;
  let hours = parseInt(match[1], 10);
  const mins = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${mins}`;
}

interface ChangeEntry {
  resort_name: string;
  field: string;
  old_value: string;
  new_value: string;
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`Mode: ${APPLY ? 'APPLY (writing to DB)' : 'DRY-RUN (no writes)'}`);
  if (POPULATE_SCORES) console.log('Will also populate data_quality_score.');

  const { data: resorts, error } = await supabase
    .from('resorts')
    .select('id, resort_name, brand, location, policies, data_source, data_quality_score')
    .order('brand');

  if (error || !resorts) {
    console.error('Failed:', error?.message);
    process.exit(1);
  }

  const changes: ChangeEntry[] = [];
  let dataSourcePatched = 0;

  for (const r of resorts) {
    const loc = (r.location || {}) as Record<string, string>;
    const policies = (r.policies || {}) as Record<string, string>;
    const updates: Record<string, unknown> = {};
    let locChanged = false;
    let polChanged = false;

    // Country normalisation
    if (loc.country && COUNTRY_MAP[loc.country]) {
      const newVal = COUNTRY_MAP[loc.country];
      if (newVal !== loc.country) {
        changes.push({ resort_name: r.resort_name, field: 'location.country', old_value: loc.country, new_value: newVal });
        loc.country = newVal;
        locChanged = true;
      }
    }

    // State normalisation
    if (loc.state && STATE_MAP[loc.state]) {
      const newVal = STATE_MAP[loc.state];
      if (newVal !== loc.state) {
        changes.push({ resort_name: r.resort_name, field: 'location.state', old_value: loc.state, new_value: newVal });
        loc.state = newVal;
        locChanged = true;
      }
    }

    // Rebuild full_address after normalisation
    if (locChanged) {
      loc.full_address = [loc.city, loc.state, loc.country].filter(Boolean).join(', ');
      updates.location = loc;
    }

    // Check-in / check-out time normalisation
    if (policies.check_in) {
      const normalised = normaliseTime(policies.check_in);
      if (normalised !== policies.check_in) {
        changes.push({ resort_name: r.resort_name, field: 'policies.check_in', old_value: policies.check_in, new_value: normalised });
        policies.check_in = normalised;
        polChanged = true;
      }
    }
    if (policies.check_out) {
      const normalised = normaliseTime(policies.check_out);
      if (normalised !== policies.check_out) {
        changes.push({ resort_name: r.resort_name, field: 'policies.check_out', old_value: policies.check_out, new_value: normalised });
        policies.check_out = normalised;
        polChanged = true;
      }
    }
    if (polChanged) updates.policies = policies;

    // Story 5: data_source
    if (!r.data_source) {
      updates.data_source = 'web_scrape_2026';
      dataSourcePatched++;
    }

    if (APPLY && Object.keys(updates).length > 0) {
      const { error: uErr } = await supabase.from('resorts').update(updates).eq('id', r.id);
      if (uErr) console.error(`  Error updating ${r.resort_name}:`, uErr.message);
    }
  }

  // Story 4: populate quality scores
  const scores: number[] = [];
  if (POPULATE_SCORES) {
    console.log('\nPopulating data_quality_score...');
    for (const r of resorts) {
      const { data, error: rpcErr } = await supabase.rpc('calculate_resort_data_quality', { p_resort_id: r.id });
      if (rpcErr) {
        console.error(`  RPC error for ${r.resort_name}:`, rpcErr.message);
        continue;
      }
      const score = typeof data === 'number' ? data : 0;
      scores.push(score);

      if (APPLY) {
        await supabase.from('resorts').update({ data_quality_score: score }).eq('id', r.id);
      }
    }

    if (scores.length > 0) {
      const min = Math.min(...scores);
      const max = Math.max(...scores);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      console.log(`Updated ${scores.length} records. Score range: ${min}–${max}. Average: ${avg.toFixed(1)}.`);
    }
  }

  // Write change log
  let md = `# Normalisation Log\n\n`;
  md += `> Generated: ${new Date().toISOString()}\n`;
  md += `> Mode: ${APPLY ? 'APPLIED' : 'DRY-RUN'}\n\n`;

  md += `## Summary\n\n`;
  md += `- ${changes.length} field changes ${APPLY ? 'applied' : 'identified (dry-run)'}\n`;
  md += `- ${dataSourcePatched} records with null data_source ${APPLY ? 'patched' : 'would be patched'}\n`;
  if (scores.length > 0) {
    md += `- ${scores.length} quality scores ${APPLY ? 'written' : 'computed (dry-run)'}\n`;
  }

  if (changes.length > 0) {
    md += `\n## Changes\n\n`;
    md += `| Resort | Field | Old | New |\n|--------|-------|-----|-----|\n`;
    for (const c of changes) {
      md += `| ${c.resort_name} | ${c.field} | ${c.old_value} | ${c.new_value} |\n`;
    }
  }

  const outPath = path.resolve('docs/features/mdm-resort-data/normalisation-log.md');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, md, 'utf-8');
  console.log(`\nLog written to ${outPath}`);
  console.log(`${changes.length} changes ${APPLY ? 'applied' : 'identified (dry-run — pass --apply to write)'}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
