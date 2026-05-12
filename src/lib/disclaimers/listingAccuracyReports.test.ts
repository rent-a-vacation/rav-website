// @vitest-environment jsdom
// @p0
/**
 * Migration audit for Migration 077 — listing accuracy reports (#491).
 *
 * @see docs/legal/compliance-gap-analysis.md item P-14
 * @see Palmer v. FantaSea Resorts, NJ App. Div. (2025)
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sqlPath = resolve(
  __dirname,
  "../../../supabase/migrations/077_listing_accuracy_reports.sql",
);
const sql = readFileSync(sqlPath, "utf-8");

describe("Migration 077 — listing_accuracy_reports table", () => {
  it("creates the table idempotently", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.listing_accuracy_reports/);
  });

  it("uses UUID PK with gen_random_uuid()", () => {
    expect(sql).toMatch(/id UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)/);
  });

  it("FK listing_id → listings.id with ON DELETE CASCADE", () => {
    expect(sql).toMatch(/listing_id UUID NOT NULL REFERENCES public\.listings\(id\) ON DELETE CASCADE/);
  });

  it("allows anonymous reports (reporter_id nullable) but requires contact info", () => {
    expect(sql).toMatch(/reporter_id UUID REFERENCES auth\.users\(id\) ON DELETE SET NULL/);
    expect(sql).toMatch(/CONSTRAINT listing_accuracy_reports_anon_contact CHECK \(/);
    expect(sql).toMatch(/reporter_id IS NOT NULL OR reporter_email IS NOT NULL/);
  });

  it("enforces 8 category values", () => {
    expect(sql).toMatch(/'photos', 'description', 'amenities', 'pricing', 'availability'/);
    expect(sql).toMatch(/'location', 'cancellation_policy', 'other'/);
  });

  it("enforces description length 10..5000", () => {
    expect(sql).toMatch(/CHECK \(length\(description\) BETWEEN 10 AND 5000\)/);
  });

  it("enforces status enum with 6 values", () => {
    expect(sql).toMatch(/'pending', 'investigating', 'resolved_confirmed', 'resolved_corrected', 'dismissed_no_issue', 'dismissed_spam'/);
  });

  it("creates updated_at trigger via CREATE OR REPLACE FUNCTION", () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.touch_listing_accuracy_reports_updated_at/);
    expect(sql).toMatch(/CREATE TRIGGER listing_accuracy_reports_updated_at/);
  });

  it("enables row-level security", () => {
    expect(sql).toMatch(/ALTER TABLE public\.listing_accuracy_reports ENABLE ROW LEVEL SECURITY/);
  });

  it("allows INSERT from both anon and authenticated, but blocks impersonation", () => {
    expect(sql).toMatch(/CREATE POLICY "Anyone can submit an accuracy report"/);
    expect(sql).toMatch(/TO anon, authenticated/);
    // Auth users must be themselves; anon must have NULL reporter_id
    expect(sql).toMatch(/auth\.uid\(\) IS NOT NULL AND reporter_id = auth\.uid\(\)/);
    expect(sql).toMatch(/auth\.uid\(\) IS NULL AND reporter_id IS NULL/);
  });

  it("authenticated reporters can read their own reports", () => {
    expect(sql).toMatch(/"Reporters can read their own reports"/);
    expect(sql).toMatch(/USING \(reporter_id = auth\.uid\(\)\)/);
  });

  it("RAV team can read + update all reports via is_rav_team()", () => {
    expect(sql).toMatch(/"RAV team can read all accuracy reports"/);
    expect(sql).toMatch(/"RAV team can update accuracy reports"/);
    expect(sql).toMatch(/public\.is_rav_team\(auth\.uid\(\)\)/);
  });

  it("does NOT expose DELETE via RLS", () => {
    expect(sql).not.toMatch(/CREATE POLICY[^"]+FOR DELETE[^"]+listing_accuracy_reports/);
  });

  it("creates indexes on listing_id, status, created_at, plus a partial pending index", () => {
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_listing_accuracy_reports_listing_id/);
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_listing_accuracy_reports_status/);
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_listing_accuracy_reports_created_at/);
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_listing_accuracy_reports_pending[\s\S]+WHERE status = 'pending'/);
  });

  it("wraps in a transaction", () => {
    expect(sql).toMatch(/^BEGIN;/m);
    expect(sql).toMatch(/^COMMIT;/m);
  });
});
