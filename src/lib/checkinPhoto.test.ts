import { describe, it, expect } from "vitest";
import {
  validateCheckinPhoto,
  buildCheckinPhotoStoragePath,
  CHECKIN_PHOTO_UI_COPY,
  MAX_CHECKIN_PHOTO_SIZE_BYTES,
  ACCEPTED_CHECKIN_PHOTO_MIME_TYPES,
} from "./checkinPhoto";

function makeFile(name: string, type: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe("validateCheckinPhoto @p0", () => {
  it("accepts JPEG, PNG, and HEIC under 10 MB", () => {
    expect(validateCheckinPhoto(makeFile("a.jpg", "image/jpeg", 1024))).toBeNull();
    expect(validateCheckinPhoto(makeFile("a.png", "image/png", 1024))).toBeNull();
    expect(validateCheckinPhoto(makeFile("a.heic", "image/heic", 1024))).toBeNull();
  });

  it("rejects non-image MIME types with friendly copy", () => {
    const err = validateCheckinPhoto(
      makeFile("doc.pdf", "application/pdf", 1024),
    );
    expect(err?.field).toBe("mime");
    expect(err?.message).toMatch(/JPEG, PNG, or HEIC/);
  });

  it("rejects files over the 10 MB cap with friendly copy", () => {
    const err = validateCheckinPhoto(
      makeFile("big.jpg", "image/jpeg", MAX_CHECKIN_PHOTO_SIZE_BYTES + 1),
    );
    expect(err?.field).toBe("size");
    expect(err?.message).toMatch(/10 MB/);
  });

  it("accepts files exactly at the size cap", () => {
    const err = validateCheckinPhoto(
      makeFile("right.png", "image/png", MAX_CHECKIN_PHOTO_SIZE_BYTES),
    );
    expect(err).toBeNull();
  });

  it("exposes the accepted MIME list as a readonly tuple", () => {
    expect(ACCEPTED_CHECKIN_PHOTO_MIME_TYPES).toContain("image/jpeg");
    expect(ACCEPTED_CHECKIN_PHOTO_MIME_TYPES).toContain("image/png");
    expect(ACCEPTED_CHECKIN_PHOTO_MIME_TYPES).toContain("image/heic");
    expect(ACCEPTED_CHECKIN_PHOTO_MIME_TYPES).toHaveLength(3);
  });
});

describe("buildCheckinPhotoStoragePath", () => {
  it("scopes the path under the traveler's user id (matches RLS folder check)", () => {
    const path = buildCheckinPhotoStoragePath("user-123", "bk-abc", "door.jpg");
    expect(path.startsWith("user-123/bk-abc/")).toBe(true);
  });

  it("includes a timestamp prefix so re-uploads do not collide", () => {
    const a = buildCheckinPhotoStoragePath("u", "b", "x.jpg");
    expect(a).toMatch(/^u\/b\/\d+-x\.jpg$/);
  });

  it("sanitizes path-traversal sequences in the filename", () => {
    const path = buildCheckinPhotoStoragePath("u", "b", "../../etc/passwd");
    expect(path).not.toContain("..");
    expect(path).not.toMatch(/\/etc\/passwd$/);
  });

  it("replaces unsafe characters with underscores", () => {
    const path = buildCheckinPhotoStoragePath("u", "b", "my photo (final)!.jpg");
    // Spaces, parens, and exclamation are not in the safe set
    expect(path.endsWith(".jpg")).toBe(true);
    expect(path).not.toMatch(/[() !]/);
  });
});

describe("CHECKIN_PHOTO_UI_COPY help-text-everywhere rule", () => {
  it("keeps help text concise (~15 words)", () => {
    const helpWords = CHECKIN_PHOTO_UI_COPY.helpText.split(/\s+/).length;
    expect(helpWords).toBeLessThanOrEqual(20);

    const noteWords = CHECKIN_PHOTO_UI_COPY.preferenceNote.split(/\s+/).length;
    expect(noteWords).toBeLessThanOrEqual(20);
  });

  it("provides a label, help text, and preference note", () => {
    expect(CHECKIN_PHOTO_UI_COPY.label).toBeTruthy();
    expect(CHECKIN_PHOTO_UI_COPY.helpText).toBeTruthy();
    expect(CHECKIN_PHOTO_UI_COPY.preferenceNote).toBeTruthy();
  });
});
