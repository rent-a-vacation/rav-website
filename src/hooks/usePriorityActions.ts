import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertTriangle,
  CalendarClock,
  Gavel,
  MessageCircle,
  ShieldAlert,
  ClipboardCheck,
  Scale,
  DollarSign,
  UserCheck,
} from "lucide-react";
import type { PriorityAction } from "@/components/dashboard/ActionNeededSection";

// Window used for "imminent check-in" urgency.
const IMMINENT_CHECKIN_DAYS = 7;

function daysFromNow(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(isoDate + "T00:00:00");
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

// ── Traveler ────────────────────────────────────────────────────────────────

export function useTravelerPriorityActions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["priority-actions", "traveler", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<PriorityAction[]> => {
      if (!user) return [];

      // Listings where this traveler has a bid with owner-counter status awaiting their response.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: counterOfferCount } = await (supabase as any)
        .from("listing_bids")
        .select("id", { count: "exact", head: true })
        .eq("renter_id", user.id)
        .eq("status", "counter_offered");

      // Wish-Matched bookings where owner is still securing the reservation — traveler is watching.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: pendingWishBookings } = await (supabase as any)
        .from("bookings")
        .select("id, listing:listings(check_in_date)")
        .eq("renter_id", user.id)
        .eq("source_type", "wish_matched")
        .eq("status", "pending");

      const wishPendingCount = (pendingWishBookings ?? []).length;

      // Active bookings with check-in within IMMINENT_CHECKIN_DAYS.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: confirmedBookings } = await (supabase as any)
        .from("bookings")
        .select("id, listing:listings(check_in_date)")
        .eq("renter_id", user.id)
        .in("status", ["confirmed", "active"]);

      const imminent = ((confirmedBookings ?? []) as Array<{ listing: { check_in_date: string } | null }>).filter(
        (b) => {
          const checkIn = b.listing?.check_in_date;
          if (!checkIn) return false;
          const d = daysFromNow(checkIn);
          return d >= 0 && d <= IMMINENT_CHECKIN_DAYS;
        },
      ).length;

      const actions: PriorityAction[] = [
        {
          id: "counter-offers",
          label: counterOfferCount === 1 ? "counter-offer to review" : "counter-offers to review",
          count: counterOfferCount ?? 0,
          icon: Gavel,
          linkTo: "/my-trips?tab=offers",
          tone: "urgent",
          help: "An owner responded with a different price — review to accept or counter.",
        },
        {
          id: "imminent-checkin",
          label: imminent === 1 ? "check-in this week" : "check-ins this week",
          count: imminent,
          icon: CalendarClock,
          linkTo: "/my-trips?tab=bookings",
          tone: "action",
          help: "Review check-in details and resort contact before you travel.",
        },
        {
          id: "pending-wish-confirmations",
          label: wishPendingCount === 1 ? "Wish-Matched stay pending confirmation" : "Wish-Matched stays pending confirmation",
          count: wishPendingCount,
          icon: CalendarClock,
          linkTo: "/my-trips?tab=bookings",
          tone: "info",
          help: "The owner is securing the resort reservation — you'll be notified when confirmed.",
        },
      ];

      return actions;
    },
    staleTime: 60_000,
  });
}

// ── Owner ───────────────────────────────────────────────────────────────────

export function useOwnerPriorityActions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["priority-actions", "owner", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<PriorityAction[]> => {
      if (!user) return [];

      // Listings with proof_status rejected — owner needs to re-upload.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: proofRejectedCount } = await (supabase as any)
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id)
        .eq("proof_status", "rejected");

      // Bids pending on owner's listings (not yet responded to).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: pendingBidsData } = await (supabase as any)
        .from("listing_bids")
        .select("id, listing:listings!inner(owner_id)")
        .eq("status", "pending")
        .eq("listing.owner_id", user.id);
      const pendingBidsCount = (pendingBidsData ?? []).length;

      // Wish-Matched bookings on owner's listings needing resort confirmation.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: pendingOwnerConfirmsData } = await (supabase as any)
        .from("booking_confirmations")
        .select("id, booking:bookings!inner(listing:listings!inner(owner_id))")
        .eq("owner_confirmation_status", "pending_owner")
        .eq("booking.listing.owner_id", user.id);
      const pendingOwnerConfirmsCount = (pendingOwnerConfirmsData ?? []).length;

      // Unread inquiry messages — use conversation unread counts for the owner.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: unreadConvsData } = await (supabase as any)
        .from("conversations")
        .select("id")
        .eq("owner_id", user.id)
        .gt("owner_unread_count", 0);
      const unreadInquiryCount = (unreadConvsData ?? []).length;

      const actions: PriorityAction[] = [
        {
          id: "proof-rejected",
          label: proofRejectedCount === 1 ? "listing needs re-upload" : "listings need re-upload",
          count: proofRejectedCount ?? 0,
          icon: ShieldAlert,
          linkTo: "/owner-dashboard?tab=my-listings",
          tone: "urgent",
          help: "Reservation proof was rejected — upload a corrected file to keep your listing.",
        },
        {
          id: "pending-owner-confirms",
          label: pendingOwnerConfirmsCount === 1 ? "Wish-Matched booking to confirm" : "Wish-Matched bookings to confirm",
          count: pendingOwnerConfirmsCount,
          icon: CalendarClock,
          linkTo: "/owner-dashboard?tab=bookings-earnings",
          tone: "urgent",
          help: "A traveler accepted your Offer — secure the reservation and submit the confirmation number.",
        },
        {
          id: "pending-bids",
          label: pendingBidsCount === 1 ? "Offer awaiting your response" : "Offers awaiting your response",
          count: pendingBidsCount,
          icon: Gavel,
          linkTo: "/owner-dashboard?tab=my-listings",
          tone: "action",
          help: "Accept, counter, or decline — every Offer has a deadline.",
        },
        {
          id: "unread-inquiries",
          label: unreadInquiryCount === 1 ? "unread traveler message" : "unread traveler messages",
          count: unreadInquiryCount,
          icon: MessageCircle,
          linkTo: "/messages",
          tone: "info",
          help: "Travelers have questions before they book — fast replies close deals.",
        },
      ];

      return actions;
    },
    staleTime: 60_000,
  });
}

// ── Admin ───────────────────────────────────────────────────────────────────

export function useAdminPriorityActions() {
  return useQuery({
    queryKey: ["priority-actions", "admin"],
    queryFn: async (): Promise<PriorityAction[]> => {
      // Pending approvals.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: pendingListingsCount } = await (supabase as any)
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_approval");

      // Proof verifications pending.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: proofPendingCount } = await (supabase as any)
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("proof_status", "submitted");

      // Open disputes (not resolved/closed).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: openDisputesCount } = await (supabase as any)
        .from("disputes")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "investigating", "awaiting_response"]);

      // Pending owner identity verifications.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: ownerVerifPendingCount } = await (supabase as any)
        .from("owner_verifications")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");

      // User approvals pending.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: userApprovalsPending } = await (supabase as any)
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("approval_status", "pending_approval");

      // Escrow awaiting release.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: escrowPendingCount } = await (supabase as any)
        .from("booking_confirmations")
        .select("id", { count: "exact", head: true })
        .eq("escrow_status", "confirmation_submitted");

      const actions: PriorityAction[] = [
        {
          id: "open-disputes",
          label: openDisputesCount === 1 ? "open dispute" : "open disputes",
          count: openDisputesCount ?? 0,
          icon: Scale,
          linkTo: "/admin?tab=disputes",
          tone: "urgent",
          help: "Travelers or owners need a resolution — investigate and close.",
        },
        {
          id: "escrow-pending",
          label: escrowPendingCount === 1 ? "escrow to release" : "escrow releases to review",
          count: escrowPendingCount ?? 0,
          icon: DollarSign,
          linkTo: "/admin?tab=escrow",
          tone: "urgent",
          help: "Owner submitted confirmation — verify and release funds.",
        },
        {
          id: "pending-listings",
          label: pendingListingsCount === 1 ? "listing pending approval" : "listings pending approval",
          count: pendingListingsCount ?? 0,
          icon: ClipboardCheck,
          linkTo: "/admin?tab=listings",
          tone: "action",
          help: "New listings awaiting admin review before going active.",
        },
        {
          id: "proof-pending",
          label: proofPendingCount === 1 ? "reservation proof to verify" : "reservation proofs to verify",
          count: proofPendingCount ?? 0,
          icon: ShieldAlert,
          linkTo: "/admin?tab=listings",
          tone: "action",
          help: "Pre-Booked Stays need proof verification before the listing can go active.",
        },
        {
          id: "user-approvals",
          label: userApprovalsPending === 1 ? "user approval pending" : "user approvals pending",
          count: userApprovalsPending ?? 0,
          icon: UserCheck,
          linkTo: "/admin?tab=pending-approvals",
          tone: "action",
          help: "New account signups awaiting team approval.",
        },
        {
          id: "owner-verif-pending",
          label: ownerVerifPendingCount === 1 ? "owner identity review" : "owner identity reviews",
          count: ownerVerifPendingCount ?? 0,
          icon: AlertTriangle,
          linkTo: "/admin?tab=verifications",
          tone: "info",
          help: "Owner identity documents need review to raise their trust level.",
        },
      ];

      return actions;
    },
    staleTime: 60_000,
  });
}
