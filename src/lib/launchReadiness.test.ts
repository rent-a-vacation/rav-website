import { describe, it, expect } from "vitest";
import {
  checkSupabaseConnectivity,
  checkSupabaseEnvironment,
  checkSeedDataOnProd,
  checkSentryDsn,
  checkLegalPages,
  checkStaffOnlyMode,
  checkGoogleAnalytics,
  computeReadinessScore,
  type CheckResult,
} from "./launchReadiness";

describe("Launch Readiness Checks", () => {
  describe("checkSupabaseConnectivity", () => {
    it("passes when connected", () => {
      expect(checkSupabaseConnectivity(true).status).toBe("pass");
    });
    it("fails when not connected", () => {
      expect(checkSupabaseConnectivity(false).status).toBe("fail");
    });
  });

  describe("checkSupabaseEnvironment", () => {
    it("passes for PROD project", () => {
      const result = checkSupabaseEnvironment("https://xzfllqndrlmhclqfybew.supabase.co");
      expect(result.status).toBe("pass");
    });
    it("fails for DEV project", () => {
      const result = checkSupabaseEnvironment("https://oukbxqnlxnkainnligfz.supabase.co");
      expect(result.status).toBe("fail");
    });
    it("warns for unknown project", () => {
      const result = checkSupabaseEnvironment("https://other.supabase.co");
      expect(result.status).toBe("warn");
    });
    it("warns when undefined", () => {
      expect(checkSupabaseEnvironment(undefined).status).toBe("warn");
    });
  });

  describe("checkSeedDataOnProd", () => {
    it("fails when test accounts found on PROD", () => {
      expect(checkSeedDataOnProd(true, true).status).toBe("fail");
    });
    it("passes when no test accounts on PROD", () => {
      expect(checkSeedDataOnProd(false, true).status).toBe("pass");
    });
    it("warns when not on PROD", () => {
      expect(checkSeedDataOnProd(true, false).status).toBe("warn");
    });
  });

  describe("checkSentryDsn", () => {
    it("passes when DSN is set", () => {
      expect(checkSentryDsn("https://abc@sentry.io/123").status).toBe("pass");
    });
    it("fails when DSN is undefined", () => {
      expect(checkSentryDsn(undefined).status).toBe("fail");
    });
  });

  describe("checkLegalPages", () => {
    it("warns when both exist (needs legal review)", () => {
      expect(checkLegalPages(true, true).status).toBe("warn");
    });
    it("fails when terms missing", () => {
      expect(checkLegalPages(false, true).status).toBe("fail");
    });
    it("fails when privacy missing", () => {
      expect(checkLegalPages(true, false).status).toBe("fail");
    });
  });

  describe("checkStaffOnlyMode", () => {
    it("warns when staff-only is ON", () => {
      expect(checkStaffOnlyMode(true).status).toBe("warn");
    });
    it("passes when staff-only is OFF", () => {
      expect(checkStaffOnlyMode(false).status).toBe("pass");
    });
  });

  describe("checkGoogleAnalytics", () => {
    it("always passes (hardcoded)", () => {
      expect(checkGoogleAnalytics().status).toBe("pass");
    });
  });

  describe("computeReadinessScore", () => {
    it("computes correct totals", () => {
      const checks: CheckResult[] = [
        { id: "a", category: "infrastructure", label: "", description: "", status: "pass" },
        { id: "b", category: "infrastructure", label: "", description: "", status: "pass" },
        { id: "c", category: "infrastructure", label: "", description: "", status: "fail" },
        { id: "d", category: "infrastructure", label: "", description: "", status: "warn" },
        { id: "e", category: "infrastructure", label: "", description: "", status: "manual" },
      ];
      const score = computeReadinessScore(checks);
      expect(score.total).toBe(5);
      expect(score.passed).toBe(2);
      expect(score.failed).toBe(1);
      expect(score.warnings).toBe(1);
      expect(score.manual).toBe(1);
      expect(score.percentage).toBe(40);
    });

    it("returns 0% for empty array", () => {
      expect(computeReadinessScore([]).percentage).toBe(0);
    });
  });
});
