// Types for the Bidding System
// Includes listing bids, travel requests, proposals, and notifications

import type { VacationClubBrand as VCBrand, Profile, Listing, Property } from './database';

// Re-export for convenience
export type VacationClubBrand = VCBrand;

// ============================================================
// ENUMS
// ============================================================

export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';

export type TravelRequestStatus = 'open' | 'closed' | 'fulfilled' | 'expired' | 'cancelled';

export type BudgetPreference = 'range' | 'ceiling' | 'undisclosed';

export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';

export type NotificationType =
  // Bid-related
  | 'new_bid_received'
  | 'bid_accepted'
  | 'bid_rejected'
  | 'bid_expired'
  | 'bidding_ending_soon'
  // Travel request-related
  | 'new_travel_request_match'
  | 'new_proposal_received'
  | 'proposal_accepted'
  | 'proposal_rejected'
  | 'request_expiring_soon'
  // General
  | 'booking_confirmed'
  | 'payment_received'
  | 'message_received'
  // Role
  | 'role_upgrade_approved';

// ============================================================
// LISTING BIDDING (Owner-initiated)
// ============================================================

export interface ListingBid {
  id: string;
  listing_id: string;
  bidder_id: string;
  status: BidStatus;
  bid_amount: number;
  message: string | null;
  guest_count: number;
  counter_offer_amount: number | null;
  counter_offer_message: string | null;
  requested_check_in: string | null;
  requested_check_out: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

// Extended type with joins
export interface ListingBidWithDetails extends ListingBid {
  listing: Listing & { property: Property; owner?: Pick<Profile, 'id' | 'full_name'> };
  bidder: Profile;
}

// For owner view of bids on their listing
export interface BidOnListing extends ListingBid {
  bidder: Profile;
}

// Extended listing with bidding info
export interface ListingWithBidding extends Listing {
  property: Property;
  open_for_bidding: boolean;
  bidding_ends_at: string | null;
  min_bid_amount: number | null;
  reserve_price: number | null;
  allow_counter_offers: boolean;
  // Computed fields
  bid_count?: number;
  highest_bid?: number;
}

// ============================================================
// TRAVEL REQUESTS (Traveler-initiated)
// ============================================================

export interface TravelRequest {
  id: string;
  traveler_id: string;
  status: TravelRequestStatus;
  // Location
  destination_location: string;
  destination_flexibility: string | null;
  // Dates
  check_in_date: string;
  check_out_date: string;
  dates_flexible: boolean;
  flexibility_days: number;
  // Party
  guest_count: number;
  bedrooms_needed: number;
  // Budget
  budget_preference: BudgetPreference;
  budget_min: number | null;
  budget_max: number | null;
  // Requirements
  special_requirements: string | null;
  preferred_brands: VacationClubBrand[] | null;
  amenities_required: string[] | null;
  // Timing
  source_listing_id: string | null;
  target_owner_only: boolean;
  proposals_deadline: string;
  created_at: string;
  updated_at: string;
}

// Extended with traveler info
export interface TravelRequestWithDetails extends TravelRequest {
  traveler: Profile;
  proposal_count?: number;
}

// ============================================================
// TRAVEL PROPOSALS (Owner response to travel request)
// ============================================================

export interface TravelProposal {
  id: string;
  request_id: string;
  listing_id: string | null;
  property_id: string;
  owner_id: string;
  status: ProposalStatus;
  proposed_price: number;
  message: string | null;
  proposed_check_in: string;
  proposed_check_out: string;
  valid_until: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

// Extended with property and owner info
export interface TravelProposalWithDetails extends TravelProposal {
  property: Property;
  owner: Profile;
  request?: TravelRequest;
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  listing_id: string | null;
  bid_id: string | null;
  request_id: string | null;
  proposal_id: string | null;
  booking_id: string | null;
  read_at: string | null;
  email_sent_at: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_new_bid: boolean;
  email_bid_accepted: boolean;
  email_new_travel_request: boolean;
  email_new_proposal: boolean;
  email_proposal_accepted: boolean;
  email_bidding_ending: boolean;
  email_request_expiring: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// FORM TYPES
// ============================================================

export interface CreateBidInput {
  listing_id: string;
  bid_amount: number;
  message?: string;
  guest_count: number;
  requested_check_in?: string;
  requested_check_out?: string;
}

export interface CreateTravelRequestInput {
  destination_location: string;
  destination_flexibility?: string;
  check_in_date: string;
  check_out_date: string;
  dates_flexible: boolean;
  flexibility_days?: number;
  guest_count: number;
  bedrooms_needed: number;
  budget_preference: BudgetPreference;
  budget_min?: number;
  budget_max?: number;
  special_requirements?: string;
  preferred_brands?: VacationClubBrand[];
  amenities_required?: string[];
  proposals_deadline: string;
  source_listing_id?: string;
  target_owner_only?: boolean;
}

export interface CreateProposalInput {
  request_id: string;
  property_id: string;
  listing_id?: string;
  proposed_price: number;
  message?: string;
  proposed_check_in: string;
  proposed_check_out: string;
  valid_until: string;
}

export interface OpenListingForBiddingInput {
  listing_id: string;
  bidding_ends_at: string;
  min_bid_amount?: number;
  reserve_price?: number;
  allow_counter_offers?: boolean;
}
