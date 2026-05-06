// @vitest-environment jsdom
// @p0
/**
 * Migration audit for the listings.state denormalized column (#486).
 *
 * Reads the SQL migration file directly and asserts the key clauses are
 * present — same pattern as the disclaimer placement audit. The runtime
 * effect is verified manually via DEV after `supabase db push`; this test
 * protects against an accidental edit that breaks the architectural intent
 * (e.g., dropping the CHECK constraint, the index, or the backfill query).
 *
 * @see docs/legal/compliance-gap-analysis.md item P-1
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = resolve(
  __dirname,
  "../../../supabase/migrations/074_listings_state_field.sql",
);
const sql = readFileSync(migrationPath, "utf-8");

describe("Migration 074 — listings.state column", () => {
  it("adds the state column on listings (idempotent via IF NOT EXISTS)", () => {
    expect(sql).toMatch(/ALTER TABLE public\.listings\s+ADD COLUMN IF NOT EXISTS state TEXT/);
  });

  it("backfills via property → resort join (listings.property_id = properties.id, properties.resort_id = resorts.id)", () => {
    expect(sql).toMatch(/UPDATE public\.listings/);
    expect(sql).toMatch(/FROM public\.properties/);
    expect(sql).toMatch(/JOIN public\.resorts/);
    expect(sql).toMatch(/p\.resort_id = r\.id/);
    expect(sql).toMatch(/l\.property_id = p\.id/);
    expect(sql).toMatch(/upper\(r\.location->>'state'\)/);
  });

  it("only backfills NULL rows (won't overwrite existing state values)", () => {
    expect(sql).toMatch(/l\.state IS NULL/);
  });

  it("adds a CHECK constraint enforcing 2-letter uppercase state codes (or NULL)", () => {
    expect(sql).toMatch(/CONSTRAINT listings_state_format/);
    expect(sql).toMatch(/CHECK \(state IS NULL OR state ~ '\^\[A-Z\]\{2\}\$'\)/);
  });

  it("creates a partial index on state (excluding NULL rows)", () => {
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_listings_state/);
    expect(sql).toMatch(/WHERE state IS NOT NULL/);
  });

  it("includes a column comment documenting the architecture + follow-up", () => {
    expect(sql).toMatch(/COMMENT ON COLUMN public\.listings\.state/);
  });

  it("wraps everything in a transaction (BEGIN / COMMIT)", () => {
    expect(sql).toMatch(/^BEGIN;/m);
    expect(sql).toMatch(/^COMMIT;/m);
  });
});
