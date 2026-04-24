import { describe, it, expect } from "vitest";
import {
  isProofRequired,
  PROOF_STATUS_LABELS,
  PROOF_STATUS_BADGE_CLASSES,
  PROOF_STATUS_DESCRIPTIONS,
  validateProofFile,
  buildProofStoragePath,
  hashFile,
  MAX_PROOF_FILE_SIZE_BYTES,
} from "./listingProof";

describe("isProofRequired @p0", () => {
  it("requires proof for pre_booked", () => {
    expect(isProofRequired("pre_booked")).toBe(true);
  });
  it("does not require proof for wish_matched (proof is post-acceptance)", () => {
    expect(isProofRequired("wish_matched")).toBe(false);
  });
});

describe("status dictionaries are exhaustive and consistent", () => {
  const statuses = [
    "not_required",
    "required",
    "submitted",
    "verified",
    "rejected",
  ] as const;

  it.each(statuses)("has label, badge class, and description for %s", (status) => {
    expect(PROOF_STATUS_LABELS[status]).toBeTruthy();
    expect(PROOF_STATUS_BADGE_CLASSES[status]).toBeTruthy();
    expect(PROOF_STATUS_DESCRIPTIONS[status]).toBeTruthy();
  });

  it("descriptions stay under ~15 words per the help-text-everywhere rule", () => {
    for (const status of statuses) {
      const wordCount = PROOF_STATUS_DESCRIPTIONS[status].split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(18);
    }
  });
});

describe("validateProofFile", () => {
  function makeFile(name: string, type: string, size: number): File {
    return new File([new Uint8Array(size)], name, { type });
  }

  it("accepts a PDF under 10 MB", () => {
    expect(validateProofFile(makeFile("proof.pdf", "application/pdf", 1024))).toBeNull();
  });

  it("accepts JPEG and PNG", () => {
    expect(validateProofFile(makeFile("a.jpg", "image/jpeg", 1024))).toBeNull();
    expect(validateProofFile(makeFile("a.png", "image/png", 1024))).toBeNull();
  });

  it("rejects unsupported MIME types with helpful copy", () => {
    const err = validateProofFile(makeFile("a.docx", "application/msword", 1024));
    expect(err?.field).toBe("mime");
    expect(err?.message).toMatch(/PDF, JPEG, or PNG/);
  });

  it("rejects files over the 10 MB cap with helpful copy", () => {
    const err = validateProofFile(
      makeFile("big.pdf", "application/pdf", MAX_PROOF_FILE_SIZE_BYTES + 1),
    );
    expect(err?.field).toBe("size");
    expect(err?.message).toMatch(/10 MB/);
  });
});

describe("buildProofStoragePath", () => {
  it("scopes the path under the owner's user id (matches RLS folder check)", () => {
    const path = buildProofStoragePath("owner-123", "listing-abc", "conf.pdf");
    expect(path.startsWith("owner-123/listing-abc/")).toBe(true);
  });

  it("sanitizes dangerous characters in file names", () => {
    const path = buildProofStoragePath("o1", "l1", "../../etc/passwd");
    expect(path).not.toContain("..");
    expect(path).not.toContain("/etc/");
  });
});

describe("hashFile", () => {
  it("produces a 64-character lowercase hex SHA-256", async () => {
    const file = new File(["hello world"], "test.txt", { type: "text/plain" });
    const hash = await hashFile(file);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is stable for the same content", async () => {
    const a = new File(["same"], "a.txt", { type: "text/plain" });
    const b = new File(["same"], "b.txt", { type: "text/plain" });
    expect(await hashFile(a)).toBe(await hashFile(b));
  });

  it("differs when content differs", async () => {
    const a = new File(["one"], "a.txt", { type: "text/plain" });
    const b = new File(["two"], "b.txt", { type: "text/plain" });
    expect(await hashFile(a)).not.toBe(await hashFile(b));
  });
});
