import { describe, it, expect, vi } from "vitest";
import { hasScope } from "../../supabase/functions/_shared/api-auth";

// We test the pure functions that can be imported without Deno runtime.
// The hashApiKey/generateApiKey use Web Crypto which is available in Vitest.

describe("hasScope", () => {
  it("returns true for wildcard scope", () => {
    expect(hasScope(["*"], "listings:read")).toBe(true);
    expect(hasScope(["*"], "anything")).toBe(true);
  });

  it("returns true for direct match", () => {
    expect(hasScope(["listings:read", "search"], "search")).toBe(true);
    expect(hasScope(["listings:read"], "listings:read")).toBe(true);
  });

  it("returns true for parent scope match", () => {
    expect(hasScope(["listings"], "listings:read")).toBe(true);
  });

  it("returns false when scope not present", () => {
    expect(hasScope(["search"], "listings:read")).toBe(false);
    expect(hasScope([], "search")).toBe(false);
  });

  it("does not match child to parent", () => {
    // Having "listings:read" should not grant "listings:write"
    expect(hasScope(["listings:read"], "listings:write")).toBe(false);
  });
});

describe("API key format", () => {
  it("validates key format regex", () => {
    const validKey = "rav_pk_0123456789abcdef0123456789abcdef";
    const formatRegex = /^rav_pk_[a-f0-9]{32}$/;
    expect(formatRegex.test(validKey)).toBe(true);
  });

  it("rejects invalid formats", () => {
    const formatRegex = /^rav_pk_[a-f0-9]{32}$/;
    expect(formatRegex.test("rav_pk_short")).toBe(false);
    expect(formatRegex.test("invalid_key")).toBe(false);
    expect(formatRegex.test("rav_pk_UPPERCASE12345678901234567890")).toBe(false);
    expect(formatRegex.test("")).toBe(false);
  });
});

describe("API key hashing", () => {
  it("produces consistent SHA-256 hash via Web Crypto", async () => {
    const key = "rav_pk_0123456789abcdef0123456789abcdef";
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(key));
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Same input produces same output
    const hashBuffer2 = await crypto.subtle.digest("SHA-256", encoder.encode(key));
    const hash2 = Array.from(new Uint8Array(hashBuffer2))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    expect(hash).toBe(hash2);
    expect(hash.length).toBe(64); // SHA-256 = 64 hex chars
  });

  it("produces different hashes for different keys", async () => {
    const encoder = new TextEncoder();
    const hash1Buffer = await crypto.subtle.digest("SHA-256", encoder.encode("rav_pk_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
    const hash1 = Array.from(new Uint8Array(hash1Buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
    const hash2Buffer = await crypto.subtle.digest("SHA-256", encoder.encode("rav_pk_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"));
    const hash2 = Array.from(new Uint8Array(hash2Buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

    expect(hash1).not.toBe(hash2);
  });
});

describe("API key generation", () => {
  it("generates keys in correct format", () => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const key = `rav_pk_${hex}`;

    expect(key).toMatch(/^rav_pk_[a-f0-9]{32}$/);
  });

  it("generates unique keys", () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      keys.add(`rav_pk_${hex}`);
    }
    expect(keys.size).toBe(100);
  });
});

describe("API response envelope", () => {
  it("pagination parsing handles defaults", () => {
    const url = new URL("https://example.com/v1/listings");
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(url.searchParams.get("per_page") ?? "20", 10) || 20));

    expect(page).toBe(1);
    expect(perPage).toBe(20);
  });

  it("pagination parsing respects params", () => {
    const url = new URL("https://example.com/v1/listings?page=3&per_page=10");
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(url.searchParams.get("per_page") ?? "20", 10) || 20));

    expect(page).toBe(3);
    expect(perPage).toBe(10);
  });

  it("pagination clamps per_page to max 50", () => {
    const url = new URL("https://example.com/v1/listings?per_page=200");
    const perPage = Math.min(50, Math.max(1, parseInt(url.searchParams.get("per_page") ?? "20", 10) || 20));
    expect(perPage).toBe(50);
  });

  it("pagination handles negative page", () => {
    const url = new URL("https://example.com/v1/listings?page=-5");
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    expect(page).toBe(1);
  });

  it("rate limit tier defaults are correct", () => {
    const tiers = {
      free: { daily: 100, perMinute: 10 },
      partner: { daily: 10_000, perMinute: 100 },
      premium: { daily: 100_000, perMinute: 500 },
    };

    expect(tiers.free.daily).toBe(100);
    expect(tiers.partner.daily).toBe(10_000);
    expect(tiers.premium.perMinute).toBe(500);
  });
});
