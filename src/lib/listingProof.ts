// Pure-logic helpers for the Pre-Booked listing proof workflow.
// #376 — owner uploads resort-reservation proof at list-creation time;
// admin verifies before the listing becomes active.

import type { Database } from "@/types/database";

export type ListingProofStatus = Database["public"]["Enums"]["listing_proof_status"];
export type ListingSourceType = Database["public"]["Enums"]["listing_source_type"];

/**
 * Only Pre-Booked listings require proof at list-creation time. Wish-Matched
 * listings collect their confirmation post-acceptance via booking_confirmations.
 */
export function isProofRequired(sourceType: ListingSourceType): boolean {
  return sourceType === "pre_booked";
}

export const PROOF_STATUS_LABELS: Record<ListingProofStatus, string> = {
  not_required: "Not required",
  required: "Awaiting upload",
  submitted: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
};

/**
 * Tailwind class string mapping proof status to a consistent badge color.
 * Exported as strings (not a component) so both owner and admin surfaces
 * render the same visual treatment without importing each other.
 */
export const PROOF_STATUS_BADGE_CLASSES: Record<ListingProofStatus, string> = {
  not_required: "bg-slate-100 text-slate-600",
  required: "bg-amber-100 text-amber-800",
  submitted: "bg-blue-100 text-blue-800",
  verified: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
};

/**
 * Short guiding copy for each status, shown under the badge on admin +
 * owner surfaces. Must stay under ~15 words per the help-text-everywhere rule.
 */
export const PROOF_STATUS_DESCRIPTIONS: Record<ListingProofStatus, string> = {
  not_required:
    "Wish-Matched listings confirm after a traveler accepts the Offer.",
  required: "Owner needs to upload a reservation proof before we can verify.",
  submitted: "Admin review pending — we'll confirm this with the resort.",
  verified: "Admin confirmed the reservation is genuine.",
  rejected: "Previous upload was rejected. Owner needs to re-upload with a correct file.",
};

async function readAsArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
  // Browsers + modern jsdom expose File.arrayBuffer(); fall back to FileReader
  // for older test envs.
  if (typeof (file as Blob).arrayBuffer === "function") {
    return (file as Blob).arrayBuffer();
  }
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file as Blob);
  });
}

/**
 * Compute SHA-256 hash of a File using the Web Crypto API. Used to enforce
 * cross-owner dedup — the same proof PDF cannot be reused on a different
 * owner's listing (migration 064 adds a UNIQUE index on this column).
 * Returns a lowercase hex string.
 */
export async function hashFile(file: File | Blob): Promise<string> {
  const buffer = await readAsArrayBuffer(file);
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const MAX_PROOF_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_PROOF_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export interface ProofFileValidationError {
  field: "file" | "mime" | "size";
  message: string;
}

export function validateProofFile(file: File): ProofFileValidationError | null {
  if (!file) {
    return { field: "file", message: "Please choose a file to upload." };
  }
  if (!(ACCEPTED_PROOF_MIME_TYPES as readonly string[]).includes(file.type)) {
    return {
      field: "mime",
      message: "File must be a PDF, JPEG, or PNG — that's what resort confirmation emails typically come as.",
    };
  }
  if (file.size > MAX_PROOF_FILE_SIZE_BYTES) {
    return {
      field: "size",
      message: "File is over 10 MB. Most resort confirmations are well under this — try saving the email as PDF without attachments.",
    };
  }
  return null;
}

/**
 * Build the storage object path for a given owner's proof file. Path layout
 * aligns with the migration-064 RLS policy (folder prefix = owner's user id).
 */
export function buildProofStoragePath(ownerId: string, listingId: string, fileName: string): string {
  // Strip path-traversal sequences first, then replace anything that isn't a
  // safe character set.
  const sanitized = fileName
    .replace(/\.{2,}/g, "") // collapse any "..", "...", etc.
    .replace(/[/\\]/g, "_") // path separators → underscore
    .replace(/[^a-zA-Z0-9._-]/g, "_"); // everything else non-safe → underscore
  return `${ownerId}/${listingId}/${Date.now()}-${sanitized}`;
}
