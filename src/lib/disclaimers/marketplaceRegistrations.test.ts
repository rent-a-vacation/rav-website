// @vitest-environment jsdom
// @p0
/**
 * Migration audit for Migration 075 — marketplace-facilitator registrations
 * tracker (#488). Reads the SQL file and asserts the key clauses are present:
 * table + 51-jurisdiction seed + status enum + RLS + indexes.
 *
 * @see docs/legal/compliance-gap-analysis.md item P-5
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sqlPath = resolve(
  __dirname,
  "../../../supabase/migrations/075_marketplace_registrations.sql",
);
const sql = readFileSync(sqlPath, "utf-8");

describe("Migration 075 — marketplace_registrations table", () => {
  it("creates the public.marketplace_registrations table (idempotent via IF NOT EXISTS)", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.marketplace_registrations/);
  });

  it("makes state the primary key with a 2-letter uppercase format constraint", () => {
    expect(sql).toMatch(/state TEXT PRIMARY KEY CHECK \(state ~ '\^\[A-Z\]\{2\}\$'\)/);
  });

  it("constrains registration_status to the four documented values", () => {
    expect(sql).toMatch(/CHECK \(registration_status IN \('not_required', 'pending', 'registered', 'exempt'\)\)/);
  });

  it("defaults registration_status to 'not_required'", () => {
    expect(sql).toMatch(/registration_status TEXT NOT NULL DEFAULT 'not_required'/);
  });

  it("seeds all 50 states + DC (51 jurisdictions) idempotently via ON CONFLICT DO NOTHING", () => {
    // Spot-check a few states; full state list is documented in the migration source
    for (const state of ["AL", "AK", "CA", "FL", "HI", "NV", "AZ", "NY", "TX", "DC", "WY"]) {
      expect(sql).toContain(`('${state}')`);
    }
    expect(sql).toMatch(/ON CONFLICT \(state\) DO NOTHING/);
  });

  it("creates an updated_at touch trigger via CREATE OR REPLACE FUNCTION", () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.touch_marketplace_registrations_updated_at/);
    expect(sql).toMatch(/CREATE TRIGGER marketplace_registrations_updated_at\s+BEFORE UPDATE/);
  });

  it("enables row-level security", () => {
    expect(sql).toMatch(/ALTER TABLE public\.marketplace_registrations ENABLE ROW LEVEL SECURITY/);
  });

  it("grants SELECT to any RAV team member via is_rav_team()", () => {
    expect(sql).toMatch(/"RAV team can read marketplace registrations"/);
    expect(sql).toMatch(/public\.is_rav_team\(auth\.uid\(\)\)/);
  });

  it("restricts UPDATE to rav_admin / rav_owner only", () => {
    expect(sql).toMatch(/"RAV admins can update marketplace registrations"/);
    expect(sql).toMatch(/ur\.role IN \('rav_admin', 'rav_owner'\)/);
  });

  it("does NOT expose INSERT or DELETE via RLS (fixed-membership table)", () => {
    expect(sql).not.toMatch(/CREATE POLICY[^"]+FOR INSERT[^"]+marketplace_registrations/);
    expect(sql).not.toMatch(/CREATE POLICY[^"]+FOR DELETE[^"]+marketplace_registrations/);
  });

  it("indexes status for the 'show pending registrations' admin query", () => {
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_marketplace_registrations_status/);
  });

  it("indexes next_return_due as a partial index for upcoming-return queries", () => {
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_marketplace_registrations_next_return_due/);
    expect(sql).toMatch(/WHERE next_return_due IS NOT NULL/);
  });

  it("wraps everything in a transaction", () => {
    expect(sql).toMatch(/^BEGIN;/m);
    expect(sql).toMatch(/^COMMIT;/m);
  });
});
