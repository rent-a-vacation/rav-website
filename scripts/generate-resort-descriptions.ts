/**
 * WS2 Story 2 — RAV-Branded Description Generator
 *
 * Generates factual, RAV-voiced descriptions from structured data only.
 * Outputs to a preview JSON — does NOT write to the database.
 *
 * Usage:
 *   npx tsx scripts/generate-resort-descriptions.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'node:url';

const BRAND_DISPLAY: Record<string, string> = {
  hilton_grand_vacations: 'Hilton Grand Vacations',
  marriott_vacation_club: 'Marriott Vacation Club',
  disney_vacation_club: 'Disney Vacation Club',
  wyndham_destinations: 'Wyndham Destinations',
  hyatt_residence_club: 'Hyatt Residence Club',
  bluegreen_vacations: 'Bluegreen Vacations',
  holiday_inn_club: 'Holiday Inn Club Vacations',
  worldmark: 'WorldMark by Wyndham',
  other: 'vacation ownership',
};

const STATE_ABBR: Record<string, string> = {
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
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'Oahu': 'HI', 'Maui': 'HI',
};

export interface GeneratedDescription {
  id: string;
  resort_name: string;
  brand: string;
  old_description: string;
  new_description: string;
  word_count: number;
  needs_manual_review: boolean;
  review_reason?: string;
}

export function generateDescription(resort: {
  resort_name: string;
  brand: string;
  location: { city?: string; state?: string; country?: string } | null;
  resort_amenities: string[] | null;
  policies: { check_in?: string; check_out?: string } | null;
  unitTypes: Array<{ bedrooms: number; max_occupancy: number; unit_type_name: string }>;
}): { description: string; needsReview: boolean; reviewReason?: string } {
  const brandDisplay = BRAND_DISPLAY[resort.brand] || resort.brand;
  const city = resort.location?.city || '';
  const rawState = resort.location?.state || '';
  const state = STATE_ABBR[rawState] || rawState;

  if (!city) {
    return { description: '', needsReview: true, reviewReason: 'Missing city in location data' };
  }

  const parts: string[] = [];

  // Opening
  parts.push(`${resort.resort_name} is a ${brandDisplay} resort in ${city}, ${state}.`);

  // Unit types
  const units = resort.unitTypes;
  if (units.length > 0) {
    const bedrooms = units.map((u) => u.bedrooms);
    const minBr = Math.min(...bedrooms);
    const maxBr = Math.max(...bedrooms);
    const maxOcc = Math.max(...units.map((u) => u.max_occupancy));
    if (minBr === maxBr) {
      parts.push(
        `The property offers ${units.length} accommodation ${units.length === 1 ? 'type' : 'types'} with ${minBr === 0 ? 'studio' : `${minBr}-bedroom`} layouts, accommodating up to ${maxOcc} guests.`,
      );
    } else {
      parts.push(
        `The property offers ${units.length} accommodation types, ranging from ${minBr === 0 ? 'studios' : `${minBr}-bedroom units`} to ${maxBr}-bedroom suites, accommodating up to ${maxOcc} guests.`,
      );
    }
  }

  // Amenities
  const amenities = (resort.resort_amenities || []).filter(Boolean);
  if (amenities.length > 0) {
    const top = amenities.slice(0, 4).join(', ');
    if (amenities.length > 4) {
      parts.push(`Guests have access to on-site amenities including ${top}, and more.`);
    } else {
      parts.push(`Guests have access to on-site amenities including ${top}.`);
    }
  }

  // Check-in
  const checkIn = resort.policies?.check_in;
  if (checkIn && checkIn !== 'Not specified') {
    parts.push(`Standard check-in is at ${checkIn}.`);
  }

  // Closing
  parts.push(`${resort.resort_name} is available for booking through Rent-A-Vacation, where verified owners list their weeks directly.`);

  const description = parts.join(' ');
  const wordCount = description.split(/\s+/).length;

  if (wordCount < 40) {
    return { description, needsReview: true, reviewReason: 'Too short — sparse structured data' };
  }

  return { description, needsReview: false };
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials.');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Fetching resorts + unit types...');
  const { data: resorts, error } = await supabase
    .from('resorts')
    .select('id, resort_name, brand, description, location, resort_amenities, policies, resort_unit_types(bedrooms, max_occupancy, unit_type_name)')
    .order('brand');

  if (error || !resorts) {
    console.error('Failed:', error?.message);
    process.exit(1);
  }

  const results: GeneratedDescription[] = [];

  for (const r of resorts) {
    const { description, needsReview, reviewReason } = generateDescription({
      resort_name: r.resort_name,
      brand: r.brand,
      location: r.location as { city?: string; state?: string; country?: string } | null,
      resort_amenities: r.resort_amenities as string[] | null,
      policies: r.policies as { check_in?: string; check_out?: string } | null,
      unitTypes: (r.resort_unit_types || []) as Array<{ bedrooms: number; max_occupancy: number; unit_type_name: string }>,
    });

    results.push({
      id: r.id,
      resort_name: r.resort_name,
      brand: r.brand,
      old_description: (r.description as string) || '',
      new_description: description,
      word_count: description.split(/\s+/).filter(Boolean).length,
      needs_manual_review: needsReview,
      review_reason: reviewReason,
    });
  }

  const generated = results.filter((r) => !r.needs_manual_review).length;
  const needsReview = results.filter((r) => r.needs_manual_review).length;

  const outPath = path.resolve('docs/features/mdm-resort-data/generated-descriptions-preview.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log(`\nPreview written to ${outPath}`);
  console.log(`${generated} descriptions generated, ${needsReview} need manual review`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
