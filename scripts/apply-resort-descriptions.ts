/**
 * Apply approved generated descriptions to the resorts table.
 * Reads from generated-descriptions-preview.json and updates each resort's description.
 *
 * Usage:
 *   npx tsx scripts/apply-resort-descriptions.ts                    # DEV (default)
 *   npx tsx scripts/apply-resort-descriptions.ts --prod             # PROD
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const isProd = process.argv.includes('--prod');

const supabaseUrl = isProd
  ? 'https://xzfllqndrlmhclqfybew.supabase.co'
  : (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);

const supabaseKey = isProd
  ? process.env.SUPABASE_PROD_SERVICE_ROLE_KEY
  : process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(`Missing credentials for ${isProd ? 'PROD' : 'DEV'}.`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface GeneratedDescription {
  id: string;
  resort_name: string;
  new_description: string;
  needs_manual_review: boolean;
}

async function main() {
  const previewPath = path.resolve('docs/features/mdm-resort-data/generated-descriptions-preview.json');
  const descriptions: GeneratedDescription[] = JSON.parse(fs.readFileSync(previewPath, 'utf-8'));

  const toApply = descriptions.filter(d => !d.needs_manual_review && d.new_description);
  console.log(`Applying ${toApply.length} descriptions to ${isProd ? 'PROD' : 'DEV'}...`);

  let success = 0;
  let failed = 0;

  for (const d of toApply) {
    const { error } = await supabase
      .from('resorts')
      .update({ description: d.new_description })
      .eq('resort_name', d.resort_name);

    if (error) {
      console.error(`  Failed: ${d.resort_name} — ${error.message}`);
      failed++;
    } else {
      success++;
    }
  }

  console.log(`\nDone. ${success} updated, ${failed} failed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
