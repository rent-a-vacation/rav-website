// @p0
import { describe, it, expect } from "vitest";
import {
  getDisplayName,
  getRenterDisplayName,
  getOwnerDisplayName,
} from "./displayName";

describe("getDisplayName", () => {
  it("returns fullName when set", () => {
    expect(getDisplayName({ fullName: "Jane Doe" })).toBe("Jane Doe");
  });

  it("trims whitespace-only fullName and falls through", () => {
    expect(
      getDisplayName({ fullName: "   ", email: "jane.doe@example.com", role: "Renter" }),
    ).toBe("Renter Jane D.");
  });

  it("builds name + last initial from email local-part with dot", () => {
    expect(
      getDisplayName({ email: "jane.doe@example.com", role: "Renter" }),
    ).toBe("Renter Jane D.");
  });

  it("handles underscore-separated email local-part", () => {
    expect(
      getDisplayName({ email: "jane_smith@example.com", role: "Owner" }),
    ).toBe("Owner Jane S.");
  });

  it("capitalizes single-token email local-part", () => {
    expect(
      getDisplayName({ email: "jane@example.com", role: "Renter" }),
    ).toBe("Renter Jane");
  });

  it("falls back to user id tail when email is missing", () => {
    expect(
      getDisplayName({ userId: "abc12345-dead-beef-cafe-000000000001", role: "Renter" }),
    ).toBe("Renter #abc123");
  });

  it("strips dashes before slicing id", () => {
    expect(
      getDisplayName({ userId: "a1-b2-c3-d4-e5", role: "Renter" }),
    ).toBe("Renter #a1b2c3");
  });

  it("returns role alone when nothing else is available", () => {
    expect(getDisplayName({ role: "Renter" })).toBe("Renter");
  });

  it("defaults role to User when not provided", () => {
    expect(getDisplayName({ userId: "abc123" })).toBe("User #abc123");
  });

  it("getRenterDisplayName delegates with Renter role", () => {
    expect(
      getRenterDisplayName({ email: "pat.kim@example.com" }),
    ).toBe("Renter Pat K.");
  });

  it("getOwnerDisplayName delegates with Owner role", () => {
    expect(
      getOwnerDisplayName({ fullName: null, userId: "xxxxxxxxxxxx" }),
    ).toBe("Owner #xxxxxx");
  });

  it("prefers fullName even when email + id also set", () => {
    expect(
      getDisplayName({
        fullName: "Sam Rivera",
        email: "sam@example.com",
        userId: "abc",
      }),
    ).toBe("Sam Rivera");
  });

  it("handles email with no local-part tokens (e.g. '@x.com')", () => {
    expect(
      getDisplayName({ email: "@example.com", userId: "abc123def", role: "Renter" }),
    ).toBe("Renter #abc123");
  });
});
