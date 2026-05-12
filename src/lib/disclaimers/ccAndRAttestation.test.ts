// @vitest-environment jsdom
// @p0
/**
 * Migration audit for Migration 079 — CC&R attestation column (#481).
 *
 * @see docs/legal/compliance-gap-analysis.md — 2026-05-04 brand+ops review
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sqlPath = resolve(
  __dirname,
  "../../../supabase/migrations/079_listings_cc_and_r_attestation.sql",
);
const sql = readFileSync(sqlPath, "utf-8");

describe("Migration 079 — listings.cc_and_r_attested_at column", () => {
  it("adds the column idempotently (IF NOT EXISTS)", () => {
    expect(sql).toMatch(/ALTER TABLE public\.listings\s+ADD COLUMN IF NOT EXISTS cc_and_r_attested_at TIMESTAMPTZ/);
  });

  it("backfills existing listings with approved_at fallback to created_at", () => {
    expect(sql).toMatch(/UPDATE public\.listings\s+SET cc_and_r_attested_at = COALESCE\(approved_at, created_at\)/);
  });

  it("only backfills NULL rows (idempotent re-run)", () => {
    expect(sql).toMatch(/WHERE cc_and_r_attested_at IS NULL/);
  });

  it("creates a partial index on missing-attestation rows for admin queries", () => {
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_listings_missing_cc_and_r_attestation[\s\S]+WHERE cc_and_r_attested_at IS NULL/);
  });

  it("includes a column comment explaining the audit-trail semantics", () => {
    expect(sql).toMatch(/COMMENT ON COLUMN public\.listings\.cc_and_r_attested_at/);
    expect(sql).toMatch(/CC&Rs/);
    expect(sql).toMatch(/RAV records it as an audit trail, does not verify/);
  });

  it("wraps in a transaction", () => {
    expect(sql).toMatch(/^BEGIN;/m);
    expect(sql).toMatch(/^COMMIT;/m);
  });
});
