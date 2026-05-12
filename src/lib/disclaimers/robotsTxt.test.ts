// @vitest-environment jsdom
// @p0
/**
 * robots.txt content audit (#482, 2026-05-04 review gap #3).
 *
 * The shipped robots.txt is the authoritative policy for permitted automated
 * access. Terms § 7.1 cross-references it. Drift between the two is a legal
 * risk — this test pins the load-bearing rules.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const robotsPath = resolve(__dirname, "../../../public/robots.txt");
const robotsTxt = readFileSync(robotsPath, "utf-8");

describe("public/robots.txt", () => {
  it("references the sitemap", () => {
    expect(robotsTxt).toMatch(/Sitemap:\s*https:\/\/rent-a-vacation\.com\/sitemap\.xml/);
  });

  describe("allowed search engines", () => {
    for (const bot of ["Googlebot", "Bingbot", "DuckDuckBot", "BraveBot"]) {
      it(`explicitly names ${bot} with Allow: /`, () => {
        // Each section starts with `User-agent: <bot>` followed by `Allow: /`
        const re = new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?Allow:\\s*/`);
        expect(robotsTxt).toMatch(re);
      });

      it(`disallows /admin for ${bot} (admin areas off-limits even to allowed bots)`, () => {
        // Find the bot's section and confirm it contains a Disallow: /admin line
        const idx = robotsTxt.indexOf(`User-agent: ${bot}`);
        expect(idx).toBeGreaterThanOrEqual(0);
        // Take the section until the next "User-agent:" or end of file
        const nextIdx = robotsTxt.indexOf("User-agent:", idx + 1);
        const section = nextIdx > 0 ? robotsTxt.slice(idx, nextIdx) : robotsTxt.slice(idx);
        expect(section).toMatch(/Disallow:\s*\/admin/);
        expect(section).toMatch(/Disallow:\s*\/api/);
        expect(section).toMatch(/Disallow:\s*\/checkout/);
      });
    }
  });

  describe("unknown-crawler (User-agent: *) policy", () => {
    // Find the catch-all section
    const idx = robotsTxt.lastIndexOf("User-agent: *");
    const section = idx >= 0 ? robotsTxt.slice(idx) : "";

    it("disallows /admin, /api, /listings, /rentals for unknown bots", () => {
      for (const path of ["/admin", "/api", "/listings", "/rentals"]) {
        expect(section).toMatch(new RegExp(`Disallow:\\s*${path.replace("/", "\\/")}`));
      }
    });

    it("disallows account / booking / dashboard paths for unknown bots", () => {
      for (const path of [
        "/owner-dashboard",
        "/executive-dashboard",
        "/checkout",
        "/booking-success",
        "/account",
        "/my-bookings",
        "/my-bids",
      ]) {
        expect(section).toMatch(new RegExp(`Disallow:\\s*${path.replace("/", "\\/")}`));
      }
    });

    it("does NOT carry an explicit Allow line for unknown bots", () => {
      // The wildcard section should only deny — no broad Allow that would override
      expect(section).not.toMatch(/^Allow:\s*\//m);
    });
  });
});
