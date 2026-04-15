/**
 * Display-name utilities for user-facing labels when a profile's
 * `full_name` is missing. Used across bid/offer and messaging surfaces
 * so we never show a literal "Anonymous" or an empty string.
 *
 * Priority:
 *  1. If `full_name` is set and non-empty → return it
 *  2. Else if email is available → "Renter J.D." (first + last initials)
 *     or "Renter j***@example.com" as a safer alternative
 *  3. Else if user id is available → "Renter #a1b2c3"
 *  4. Else → the provided `role` prefix alone (e.g. "Renter")
 */

export type RoleLabel = "Renter" | "Owner" | "User";

interface DisplayNameInput {
  fullName?: string | null;
  email?: string | null;
  userId?: string | null;
  role?: RoleLabel;
}

/**
 * Build a human-readable display name with a role prefix when the profile
 * does not have `full_name` populated.
 */
export function getDisplayName({
  fullName,
  email,
  userId,
  role = "User",
}: DisplayNameInput): string {
  const trimmed = fullName?.trim();
  if (trimmed) return trimmed;

  // Try to construct initials from an email local-part like "jane.doe@x.com"
  // → "Jane D." · "j.doe" → "J. D." · single-name → capitalized first word
  if (email && email.includes("@")) {
    const local = email.split("@")[0] ?? "";
    const tokens = local
      .split(/[._\-+]/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (tokens.length >= 2) {
      const first = capitalize(tokens[0]);
      const lastInitial = (tokens[tokens.length - 1][0] ?? "").toUpperCase();
      return `${role} ${first} ${lastInitial}.`;
    }
    if (tokens.length === 1 && tokens[0]) {
      return `${role} ${capitalize(tokens[0])}`;
    }
  }

  if (userId) {
    const tail = userId.replace(/-/g, "").slice(0, 6);
    if (tail) return `${role} #${tail}`;
  }

  return role;
}

/**
 * Convenience helpers — avoids passing `role` at every call site.
 */
export const getRenterDisplayName = (input: Omit<DisplayNameInput, "role">) =>
  getDisplayName({ ...input, role: "Renter" });

export const getOwnerDisplayName = (input: Omit<DisplayNameInput, "role">) =>
  getDisplayName({ ...input, role: "Owner" });

function capitalize(word: string): string {
  if (!word) return "";
  return word[0].toUpperCase() + word.slice(1).toLowerCase();
}
