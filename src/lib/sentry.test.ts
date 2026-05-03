import { describe, it, expect } from "vitest";
import { beforeSend } from "./sentry";

type SentryEvent = Parameters<typeof beforeSend>[0];

const evt = (overrides: Partial<SentryEvent> = {}): SentryEvent =>
  ({ ...overrides }) as SentryEvent;

describe("sentry beforeSend", () => {
  it("drops EvalError events (issue #473)", () => {
    const event = evt({
      exception: { values: [{ type: "EvalError", value: "Refused to evaluate a string as JavaScript" }] },
    });
    expect(beforeSend(event)).toBeNull();
  });

  it("drops events whose exception message mentions unsafe-eval", () => {
    const event = evt({
      exception: {
        values: [
          {
            type: "Error",
            value:
              "Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source",
          },
        ],
      },
    });
    expect(beforeSend(event)).toBeNull();
  });

  it("drops events whose top-level message mentions Content Security Policy", () => {
    const event = evt({ message: "Content Security Policy violation: script-src" });
    expect(beforeSend(event)).toBeNull();
  });

  it("drops events whose message mentions Refused to evaluate", () => {
    const event = evt({ message: "Refused to evaluate a string as JavaScript" });
    expect(beforeSend(event)).toBeNull();
  });

  it("passes through unrelated errors", () => {
    const event = evt({
      exception: { values: [{ type: "TypeError", value: "Cannot read property 'foo' of undefined" }] },
      message: "TypeError: Cannot read property 'foo' of undefined",
    });
    expect(beforeSend(event)).not.toBeNull();
  });

  it("strips PII (ip_address + email) from passed-through events", () => {
    const event = evt({
      exception: { values: [{ type: "TypeError", value: "Something broke" }] },
      user: { id: "user-123", ip_address: "1.2.3.4", email: "ap@parikh.com" },
    });
    const result = beforeSend(event);
    expect(result).not.toBeNull();
    expect(result?.user?.id).toBe("user-123");
    expect(result?.user?.ip_address).toBeUndefined();
    expect(result?.user?.email).toBeUndefined();
  });
});
