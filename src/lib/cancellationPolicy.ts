import { CancellationPolicy } from "@/types/database";
import { addDays, format } from "date-fns";

export interface PolicyRule {
  label: string;
  refundPercent: number;
  color: "green" | "yellow" | "red";
}

export interface PolicyDeadline extends PolicyRule {
  deadlineDate: string; // formatted date string
}

/**
 * Get the refund rules for a cancellation policy.
 */
export function getCancellationPolicyRules(policy: CancellationPolicy): PolicyRule[] {
  switch (policy) {
    case "flexible":
      return [
        { label: "24+ hours before check-in: Full refund", refundPercent: 100, color: "green" },
        { label: "Less than 24 hours: No refund", refundPercent: 0, color: "red" },
      ];
    case "moderate":
      return [
        { label: "5+ days before check-in: Full refund", refundPercent: 100, color: "green" },
        { label: "1-4 days before check-in: 50% refund", refundPercent: 50, color: "yellow" },
        { label: "Less than 24 hours: No refund", refundPercent: 0, color: "red" },
      ];
    case "strict":
      return [
        { label: "7+ days before check-in: 50% refund", refundPercent: 50, color: "yellow" },
        { label: "Less than 7 days: No refund", refundPercent: 0, color: "red" },
      ];
    case "super_strict":
      return [
        { label: "Non-refundable", refundPercent: 0, color: "red" },
      ];
    default:
      return [];
  }
}

/**
 * Get refund deadlines with concrete dates based on check-in date.
 */
export function getCancellationDeadlines(
  policy: CancellationPolicy,
  checkInDate: string | Date
): PolicyDeadline[] {
  // Parse as local midnight to avoid UTC timezone shift
  const checkIn = typeof checkInDate === "string"
    ? new Date(checkInDate + "T00:00:00")
    : checkInDate;
  const fmt = (d: Date) => format(d, "MMM d, yyyy");

  switch (policy) {
    case "flexible": {
      const deadline = addDays(checkIn, -1);
      return [
        { label: `Cancel by ${fmt(deadline)}: Full refund`, refundPercent: 100, color: "green", deadlineDate: fmt(deadline) },
        { label: `After ${fmt(deadline)}: No refund`, refundPercent: 0, color: "red", deadlineDate: fmt(deadline) },
      ];
    }
    case "moderate": {
      const fullDeadline = addDays(checkIn, -5);
      const partialDeadline = addDays(checkIn, -1);
      return [
        { label: `Cancel by ${fmt(fullDeadline)}: Full refund`, refundPercent: 100, color: "green", deadlineDate: fmt(fullDeadline) },
        { label: `${fmt(fullDeadline)} – ${fmt(partialDeadline)}: 50% refund`, refundPercent: 50, color: "yellow", deadlineDate: fmt(partialDeadline) },
        { label: `After ${fmt(partialDeadline)}: No refund`, refundPercent: 0, color: "red", deadlineDate: fmt(partialDeadline) },
      ];
    }
    case "strict": {
      const deadline = addDays(checkIn, -7);
      return [
        { label: `Cancel by ${fmt(deadline)}: 50% refund`, refundPercent: 50, color: "yellow", deadlineDate: fmt(deadline) },
        { label: `After ${fmt(deadline)}: No refund`, refundPercent: 0, color: "red", deadlineDate: fmt(deadline) },
      ];
    }
    case "super_strict":
      return [
        { label: "Non-refundable", refundPercent: 0, color: "red", deadlineDate: "" },
      ];
    default:
      return [];
  }
}

/**
 * Get a Tailwind badge color class for a cancellation policy.
 */
export function getPolicyColor(policy: CancellationPolicy): string {
  switch (policy) {
    case "flexible":
      return "bg-emerald-100 text-emerald-800";
    case "moderate":
      return "bg-amber-100 text-amber-800";
    case "strict":
      return "bg-orange-100 text-orange-800";
    case "super_strict":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
