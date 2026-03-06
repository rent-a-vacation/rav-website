import { describe, it, expect } from "vitest";
import {
  buildReferralLink,
  extractReferralCode,
  referralConversionRate,
  formatRewardText,
  type ReferralStats,
} from "./referral";

describe("buildReferralLink", () => {
  it("builds a link with the code as ref param", () => {
    const link = buildReferralLink("ABC12345");
    expect(link).toContain("/signup?ref=ABC12345");
  });

  it("encodes special characters in the code", () => {
    const link = buildReferralLink("A+B C");
    expect(link).toContain("ref=A%2BB%20C");
  });
});

describe("extractReferralCode", () => {
  it("extracts a valid code from search params", () => {
    const params = new URLSearchParams("ref=ABC12345");
    expect(extractReferralCode(params)).toBe("ABC12345");
  });

  it("uppercases the code", () => {
    const params = new URLSearchParams("ref=abc12345");
    expect(extractReferralCode(params)).toBe("ABC12345");
  });

  it("returns null when no ref param", () => {
    const params = new URLSearchParams("");
    expect(extractReferralCode(params)).toBeNull();
  });

  it("returns null for codes shorter than 4 characters", () => {
    const params = new URLSearchParams("ref=AB");
    expect(extractReferralCode(params)).toBeNull();
  });

  it("trims whitespace", () => {
    const params = new URLSearchParams("ref=  ABC12345  ");
    expect(extractReferralCode(params)).toBe("ABC12345");
  });
});

describe("referralConversionRate", () => {
  it("returns 0 for no referrals", () => {
    const stats: ReferralStats = {
      totalReferrals: 0,
      convertedReferrals: 0,
      pendingReferrals: 0,
      totalReward: 0,
      rewardType: "commission_discount",
    };
    expect(referralConversionRate(stats)).toBe(0);
  });

  it("calculates correct percentage", () => {
    const stats: ReferralStats = {
      totalReferrals: 10,
      convertedReferrals: 3,
      pendingReferrals: 7,
      totalReward: 3,
      rewardType: "commission_discount",
    };
    expect(referralConversionRate(stats)).toBe(30);
  });

  it("rounds to nearest integer", () => {
    const stats: ReferralStats = {
      totalReferrals: 3,
      convertedReferrals: 1,
      pendingReferrals: 2,
      totalReward: 1,
      rewardType: "commission_discount",
    };
    expect(referralConversionRate(stats)).toBe(33); // 33.33 → 33
  });
});

describe("formatRewardText", () => {
  it("formats commission discount", () => {
    expect(formatRewardText("commission_discount", 1)).toBe("1% commission discount");
    expect(formatRewardText("commission_discount", 2.5)).toBe("2.5% commission discount");
  });

  it("formats credit in dollars", () => {
    expect(formatRewardText("credit", 2500)).toBe("$25.00 credit");
    expect(formatRewardText("credit", 0)).toBe("$0.00 credit");
  });
});
