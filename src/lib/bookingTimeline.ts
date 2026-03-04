import type { BookingStatus } from "@/types/database";

export type TimelineStepStatus = "complete" | "active" | "upcoming";

export interface TimelineStep {
  id: string;
  title: string;
  description: string;
  status: TimelineStepStatus;
}

interface BookingTimelineInput {
  status: BookingStatus;
  created_at: string;
  check_in_date: string;
  check_out_date: string;
  hasReview?: boolean;
}

/**
 * Compute the booking lifecycle timeline steps from booking state.
 *
 * 5 steps:
 *  1. Payment Confirmed
 *  2. Owner Confirmation
 *  3. Check-in Details
 *  4. Check-in Day
 *  5. Leave Review
 */
export function computeBookingTimeline(input: BookingTimelineInput): TimelineStep[] {
  const { status, check_in_date, check_out_date, hasReview } = input;

  const now = new Date();
  const checkIn = new Date(check_in_date + "T00:00:00");
  const checkOut = new Date(check_out_date + "T00:00:00");

  // Cancelled — step 1 complete, rest upcoming
  if (status === "cancelled") {
    return [
      { id: "payment", title: "Payment Confirmed", description: "Your payment has been processed.", status: "complete" },
      { id: "owner", title: "Owner Confirmation", description: "Booking was cancelled.", status: "upcoming" },
      { id: "details", title: "Check-in Details", description: "Check-in instructions from the owner.", status: "upcoming" },
      { id: "checkin", title: "Check-in Day", description: "Your vacation begins!", status: "upcoming" },
      { id: "review", title: "Leave a Review", description: "Share your experience.", status: "upcoming" },
    ];
  }

  // Completed
  if (status === "completed") {
    return [
      { id: "payment", title: "Payment Confirmed", description: "Your payment has been processed.", status: "complete" },
      { id: "owner", title: "Owner Confirmation", description: "The owner confirmed your reservation.", status: "complete" },
      { id: "details", title: "Check-in Details", description: "Check-in instructions were provided.", status: "complete" },
      { id: "checkin", title: "Check-in Day", description: "Stay completed.", status: "complete" },
      { id: "review", title: "Leave a Review", description: hasReview ? "Thanks for your review!" : "Share your experience.", status: hasReview ? "complete" : "active" },
    ];
  }

  // Pending — waiting for owner confirmation
  if (status === "pending") {
    return [
      { id: "payment", title: "Payment Confirmed", description: "Your payment has been processed.", status: "complete" },
      { id: "owner", title: "Owner Confirmation", description: "Waiting for the owner to confirm (usually within 48 hours).", status: "active" },
      { id: "details", title: "Check-in Details", description: "You'll receive check-in instructions.", status: "upcoming" },
      { id: "checkin", title: "Check-in Day", description: "Your vacation begins!", status: "upcoming" },
      { id: "review", title: "Leave a Review", description: "Share your experience.", status: "upcoming" },
    ];
  }

  // Confirmed — determine which sub-step is active based on dates
  const isAfterCheckOut = now >= checkOut;
  const isAfterCheckIn = now >= checkIn;

  if (isAfterCheckOut) {
    // Stay over but not marked completed yet
    return [
      { id: "payment", title: "Payment Confirmed", description: "Your payment has been processed.", status: "complete" },
      { id: "owner", title: "Owner Confirmation", description: "The owner confirmed your reservation.", status: "complete" },
      { id: "details", title: "Check-in Details", description: "Check-in instructions were provided.", status: "complete" },
      { id: "checkin", title: "Check-in Day", description: "Stay completed.", status: "complete" },
      { id: "review", title: "Leave a Review", description: "Share your experience.", status: "active" },
    ];
  }

  if (isAfterCheckIn) {
    // Currently staying
    return [
      { id: "payment", title: "Payment Confirmed", description: "Your payment has been processed.", status: "complete" },
      { id: "owner", title: "Owner Confirmation", description: "The owner confirmed your reservation.", status: "complete" },
      { id: "details", title: "Check-in Details", description: "Check-in instructions were provided.", status: "complete" },
      { id: "checkin", title: "Check-in Day", description: "Enjoy your stay!", status: "active" },
      { id: "review", title: "Leave a Review", description: "Share your experience.", status: "upcoming" },
    ];
  }

  // Confirmed, before check-in
  return [
    { id: "payment", title: "Payment Confirmed", description: "Your payment has been processed.", status: "complete" },
    { id: "owner", title: "Owner Confirmation", description: "The owner confirmed your reservation.", status: "complete" },
    { id: "details", title: "Check-in Details", description: "You'll receive check-in instructions before arrival.", status: "active" },
    { id: "checkin", title: "Check-in Day", description: "Your vacation begins!", status: "upcoming" },
    { id: "review", title: "Leave a Review", description: "Share your experience.", status: "upcoming" },
  ];
}
