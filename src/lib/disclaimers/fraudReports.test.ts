// @vitest-environment jsdom
// @p0
/**
 * Migration audit for Migration 078 — fraud_reports (#492).
 *
 * @see docs/legal/compliance-gap-analysis.md item P-15
 * @see FTC v. Carroll et al., Fed. Dist. Ct. (2026)
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sqlPath = resolve(
  __dirname,
  "../../../supabase/migrations/078_fraud_reports.sql",
);
const sql = readFileSync(sqlPath, "utf-8");

describe("Migration 078 — fraud_reports table", () => {
  it("creates the table idempotently", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.fraud_reports/);
  });

  it("all three context FKs (listing_id, reported_user_id, booking_id) are nullable", () => {
    expect(sql).toMatch(/listing_id UUID REFERENCES public\.listings\(id\) ON DELETE SET NULL/);
    expect(sql).toMatch(/reported_user_id UUID REFERENCES auth\.users\(id\) ON DELETE SET NULL/);
    expect(sql).toMatch(/booking_id UUID REFERENCES public\.bookings\(id\) ON DELETE SET NULL/);
  });

  it("anon reports require email (anon_contact CHECK)", () => {
    expect(sql).toMatch(/CONSTRAINT fraud_reports_anon_contact CHECK \(/);
    expect(sql).toMatch(/reporter_id IS NOT NULL OR reporter_email IS NOT NULL/);
  });

  it("enforces 8 category values including timeshare_exit_scheme (FTC v. Carroll)", () => {
    for (const cat of [
      "payment_fraud",
      "identity_fraud",
      "fake_listing",
      "phishing",
      "scam_pattern",
      "unauthorized_access",
      "timeshare_exit_scheme",
      "other",
    ]) {
      expect(sql).toContain(`'${cat}'`);
    }
  });

  it("enforces severity enum (low/medium/high/critical) with high default", () => {
    expect(sql).toMatch(/severity TEXT NOT NULL DEFAULT 'high'/);
    expect(sql).toMatch(/CHECK \(severity IN \('low', 'medium', 'high', 'critical'\)\)/);
  });

  it("enforces description length 20..10000", () => {
    expect(sql).toMatch(/CHECK \(length\(description\) BETWEEN 20 AND 10000\)/);
  });

  it("status enum includes escalation paths (legal + law enforcement)", () => {
    expect(sql).toMatch(/'escalated_to_legal'/);
    expect(sql).toMatch(/'escalated_to_law_enforcement'/);
  });

  it("status enum includes both resolved and dismissed terminal states", () => {
    expect(sql).toMatch(/'resolved_action_taken'/);
    expect(sql).toMatch(/'resolved_no_fraud_found'/);
    expect(sql).toMatch(/'dismissed_spam'/);
    expect(sql).toMatch(/'dismissed_duplicate'/);
  });

  it("has internal_notes column separate from resolution_notes (admin-only)", () => {
    expect(sql).toMatch(/internal_notes TEXT/);
    expect(sql).toMatch(/resolution_notes TEXT/);
  });

  it("creates updated_at trigger", () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.touch_fraud_reports_updated_at/);
    expect(sql).toMatch(/CREATE TRIGGER fraud_reports_updated_at/);
  });

  it("enables row-level security", () => {
    expect(sql).toMatch(/ALTER TABLE public\.fraud_reports ENABLE ROW LEVEL SECURITY/);
  });

  it("allows INSERT from anon + authenticated with no impersonation", () => {
    expect(sql).toMatch(/"Anyone can submit a fraud report"/);
    expect(sql).toMatch(/TO anon, authenticated/);
    expect(sql).toMatch(/auth\.uid\(\) IS NOT NULL AND reporter_id = auth\.uid\(\)/);
    expect(sql).toMatch(/auth\.uid\(\) IS NULL AND reporter_id IS NULL/);
  });

  it("read access restricted to admins ONLY (stricter than accuracy reports)", () => {
    expect(sql).toMatch(/"RAV admins can read all fraud reports"/);
    expect(sql).toMatch(/ur\.role IN \('rav_admin', 'rav_owner'\)/);
    // Should NOT have a rav_staff or is_rav_team based read policy
    expect(sql).not.toMatch(/public\.is_rav_team[^"]+FOR SELECT/);
  });

  it("authenticated reporters can read their own reports", () => {
    expect(sql).toMatch(/"Reporters can read their own fraud reports"/);
    expect(sql).toMatch(/USING \(reporter_id = auth\.uid\(\)\)/);
  });

  it("only RAV admin/owner can UPDATE", () => {
    expect(sql).toMatch(/"RAV admins can update fraud reports"/);
  });

  it("does NOT expose DELETE via RLS", () => {
    expect(sql).not.toMatch(/CREATE POLICY[^"]+FOR DELETE[^"]+fraud_reports/);
  });

  it("creates indexes including a critical-open partial index for triage dashboards", () => {
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_fraud_reports_status/);
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_fraud_reports_severity/);
    expect(sql).toMatch(/idx_fraud_reports_critical_open[\s\S]+WHERE severity = 'critical' AND status IN \('pending', 'investigating'\)/);
  });

  it("wraps in a transaction", () => {
    expect(sql).toMatch(/^BEGIN;/m);
    expect(sql).toMatch(/^COMMIT;/m);
  });
});
