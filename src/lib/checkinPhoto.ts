// Pure-logic helpers for the optional check-in issue photo upload.
// #461 (PaySafe Gap A) — when a renter reports a check-in issue, they may
// attach a photo (e.g., the locked door, the wrong unit number, the
// not-as-described kitchen). Photo lives in the private `checkin-photos`
// bucket created in migration 066, RLS-scoped under the renter's user id.
//
// Mirrors the shape of src/lib/listingProof.ts so the surrounding pages keep
// a consistent file-validation + storage-path pattern.

export const MAX_CHECKIN_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_CHECKIN_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
] as const;

export interface CheckinPhotoValidationError {
  field: "file" | "mime" | "size";
  message: string;
}

export function validateCheckinPhoto(file: File): CheckinPhotoValidationError | null {
  if (!file) {
    return { field: "file", message: "Please choose a photo to attach." };
  }
  if (
    !(ACCEPTED_CHECKIN_PHOTO_MIME_TYPES as readonly string[]).includes(file.type)
  ) {
    return {
      field: "mime",
      message:
        "Photo must be a JPEG, PNG, or HEIC — that's what most phones produce.",
    };
  }
  if (file.size > MAX_CHECKIN_PHOTO_SIZE_BYTES) {
    return {
      field: "size",
      message:
        "Photo is over 10 MB. Try sending the smaller version your phone offers, or take the photo at lower resolution.",
    };
  }
  return null;
}

/**
 * Build the storage object path for a renter's check-in photo. Path layout
 * aligns with the migration-066 RLS policy (folder prefix = renter's user id).
 *
 * Layout: `{travelerId}/{bookingId}/{timestamp}-{sanitized-filename}`
 */
export function buildCheckinPhotoStoragePath(
  travelerId: string,
  bookingId: string,
  fileName: string,
): string {
  const sanitized = fileName
    .replace(/\.{2,}/g, "")
    .replace(/[/\\]/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${travelerId}/${bookingId}/${Date.now()}-${sanitized}`;
}

/**
 * Friendly label + short help text for the photo-upload UI. Help text stays
 * under ~15 words per the help-text-everywhere rule.
 */
export const CHECKIN_PHOTO_UI_COPY = {
  label: "Attach a photo (optional)",
  helpText:
    "A quick photo helps us resolve the issue faster — JPEG / PNG / HEIC, up to 10 MB.",
  preferenceNote:
    "We never share photos publicly. Only you and the RAV team can see this photo.",
} as const;
