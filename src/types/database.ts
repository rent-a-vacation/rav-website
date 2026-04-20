// Database types for Rent-A-Vacation
// Auto-generated from Supabase schema via `npx supabase gen types typescript`
// with backward-compatible type aliases and display helpers appended.
//
// To regenerate: npx supabase gen types typescript --project-id oukbxqnlxnkainnligfz
// Then reconcile with the convenience types at the bottom of this file.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      conversation_events: {
        Row: {
          id: string
          conversation_id: string
          event_type: string
          event_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          event_type: string
          event_data?: Json
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          event_type?: string
          event_data?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          body: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          body: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          body?: string
          read_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          id: string
          owner_id: string
          traveler_id: string
          property_id: string
          listing_id: string | null
          context_type: string
          context_id: string | null
          status: string
          owner_unread_count: number
          traveler_unread_count: number
          last_message_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          traveler_id: string
          property_id: string
          listing_id?: string | null
          context_type: string
          context_id?: string | null
          status?: string
          owner_unread_count?: number
          traveler_unread_count?: number
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          traveler_id?: string
          property_id?: string
          listing_id?: string | null
          context_type?: string
          context_id?: string | null
          status?: string
          owner_unread_count?: number
          traveler_unread_count?: number
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_confirmations: {
        Row: {
          booking_id: string
          confirmation_deadline: string
          confirmation_screenshot_path: string | null
          confirmation_submitted_at: string | null
          created_at: string
          escrow_amount: number
          escrow_refunded_at: string | null
          escrow_released_at: string | null
          escrow_status: Database["public"]["Enums"]["escrow_status"]
          extensions_used: number | null
          id: string
          listing_id: string
          owner_confirmation_deadline: string | null
          owner_confirmation_status: string | null
          owner_confirmed_at: string | null
          owner_declined_at: string | null
          owner_extension_requested_at: string[] | null
          owner_id: string
          rav_verification_notes: string | null
          rav_verified_at: string | null
          rav_verifier_id: string | null
          resort_confirmation_number: string | null
          resort_contact_name: string | null
          resort_contact_phone: string | null
          auto_released: boolean
          payout_held: boolean
          payout_held_by: string | null
          payout_held_reason: string | null
          updated_at: string
          verified_by_rav: boolean
        }
        Insert: {
          auto_released?: boolean
          booking_id: string
          confirmation_deadline: string
          payout_held?: boolean
          payout_held_by?: string | null
          payout_held_reason?: string | null
          confirmation_screenshot_path?: string | null
          confirmation_submitted_at?: string | null
          created_at?: string
          escrow_amount: number
          escrow_refunded_at?: string | null
          escrow_released_at?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"]
          extensions_used?: number | null
          id?: string
          listing_id: string
          owner_confirmation_deadline?: string | null
          owner_confirmation_status?: string | null
          owner_confirmed_at?: string | null
          owner_declined_at?: string | null
          owner_extension_requested_at?: string[] | null
          owner_id: string
          rav_verification_notes?: string | null
          rav_verified_at?: string | null
          rav_verifier_id?: string | null
          resort_confirmation_number?: string | null
          resort_contact_name?: string | null
          resort_contact_phone?: string | null
          updated_at?: string
          verified_by_rav?: boolean
        }
        Update: {
          auto_released?: boolean
          booking_id?: string
          confirmation_deadline?: string
          confirmation_screenshot_path?: string | null
          confirmation_submitted_at?: string | null
          created_at?: string
          escrow_amount?: number
          escrow_refunded_at?: string | null
          escrow_released_at?: string | null
          escrow_status?: Database["public"]["Enums"]["escrow_status"]
          extensions_used?: number | null
          id?: string
          listing_id?: string
          payout_held?: boolean
          payout_held_by?: string | null
          payout_held_reason?: string | null
          owner_confirmation_deadline?: string | null
          owner_confirmation_status?: string | null
          owner_confirmed_at?: string | null
          owner_declined_at?: string | null
          owner_extension_requested_at?: string[] | null
          owner_id?: string
          rav_verification_notes?: string | null
          rav_verified_at?: string | null
          rav_verifier_id?: string | null
          resort_confirmation_number?: string | null
          resort_contact_name?: string | null
          resort_contact_phone?: string | null
          updated_at?: string
          verified_by_rav?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "booking_confirmations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_confirmations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_confirmations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          base_amount: number | null
          cleaning_fee: number | null
          created_at: string
          guest_count: number
          id: string
          listing_id: string
          owner_payout: number
          paid_at: string | null
          payment_intent_id: string | null
          payout_date: string | null
          payout_notes: string | null
          payout_reference: string | null
          payout_status: Database["public"]["Enums"]["payout_status"] | null
          rav_commission: number
          renter_id: string
          service_fee: number | null
          source_type: Database["public"]["Enums"]["listing_source_type"]
          special_requests: string | null
          status: Database["public"]["Enums"]["booking_status"]
          stripe_tax_calculation_id: string | null
          stripe_transfer_id: string | null
          tax_amount: number | null
          tax_jurisdiction: string | null
          tax_rate: number | null
          total_amount: number
          travel_proposal_id: string | null
          updated_at: string
        }
        Insert: {
          base_amount?: number | null
          cleaning_fee?: number | null
          created_at?: string
          guest_count?: number
          id?: string
          listing_id: string
          owner_payout: number
          paid_at?: string | null
          payment_intent_id?: string | null
          payout_date?: string | null
          payout_notes?: string | null
          payout_reference?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"] | null
          rav_commission: number
          renter_id: string
          service_fee?: number | null
          source_type?: Database["public"]["Enums"]["listing_source_type"]
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_tax_calculation_id?: string | null
          stripe_transfer_id?: string | null
          tax_amount?: number | null
          tax_jurisdiction?: string | null
          tax_rate?: number | null
          total_amount: number
          travel_proposal_id?: string | null
          updated_at?: string
        }
        Update: {
          base_amount?: number | null
          cleaning_fee?: number | null
          created_at?: string
          guest_count?: number
          id?: string
          listing_id?: string
          owner_payout?: number
          paid_at?: string | null
          payment_intent_id?: string | null
          payout_date?: string | null
          payout_notes?: string | null
          payout_reference?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"] | null
          rav_commission?: number
          renter_id?: string
          service_fee?: number | null
          source_type?: Database["public"]["Enums"]["listing_source_type"]
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_tax_calculation_id?: string | null
          stripe_transfer_id?: string | null
          tax_amount?: number | null
          tax_jurisdiction?: string | null
          tax_rate?: number | null
          total_amount?: number
          travel_proposal_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_requests: {
        Row: {
          booking_id: string
          counter_offer_amount: number | null
          created_at: string
          days_until_checkin: number
          final_refund_amount: number | null
          id: string
          owner_response: string | null
          policy_refund_amount: number
          reason: string
          refund_processed_at: string | null
          refund_reference: string | null
          requested_refund_amount: number
          requester_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["cancellation_status"]
          updated_at: string
        }
        Insert: {
          booking_id: string
          counter_offer_amount?: number | null
          created_at?: string
          days_until_checkin: number
          final_refund_amount?: number | null
          id?: string
          owner_response?: string | null
          policy_refund_amount: number
          reason: string
          refund_processed_at?: string | null
          refund_reference?: string | null
          requested_refund_amount: number
          requester_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["cancellation_status"]
          updated_at?: string
        }
        Update: {
          booking_id?: string
          counter_offer_amount?: number | null
          created_at?: string
          days_until_checkin?: number
          final_refund_amount?: number | null
          id?: string
          owner_response?: string | null
          policy_refund_amount?: number
          reason?: string
          refund_processed_at?: string | null
          refund_reference?: string | null
          requested_refund_amount?: number
          requester_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["cancellation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_messages: {
        Row: {
          id: string
          dispute_id: string
          sender_id: string
          message: string
          is_internal: boolean
          created_at: string
        }
        Insert: {
          id?: string
          dispute_id: string
          sender_id: string
          message: string
          is_internal?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          dispute_id?: string
          sender_id?: string
          message?: string
          is_internal?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_messages_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          id: string
          booking_id: string
          reporter_id: string
          reported_user_id: string | null
          category: Database["public"]["Enums"]["dispute_category"]
          priority: Database["public"]["Enums"]["dispute_priority"]
          status: Database["public"]["Enums"]["dispute_status"]
          description: string
          evidence_urls: string[]
          resolution_notes: string | null
          resolved_by: string | null
          resolved_at: string | null
          refund_amount: number | null
          refund_reference: string | null
          assigned_to: string | null
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          reporter_id: string
          reported_user_id?: string | null
          category?: Database["public"]["Enums"]["dispute_category"]
          priority?: Database["public"]["Enums"]["dispute_priority"]
          status?: Database["public"]["Enums"]["dispute_status"]
          description: string
          evidence_urls?: string[]
          resolution_notes?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          refund_amount?: number | null
          refund_reference?: string | null
          assigned_to?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          reporter_id?: string
          reported_user_id?: string | null
          category?: Database["public"]["Enums"]["dispute_category"]
          priority?: Database["public"]["Enums"]["dispute_priority"]
          status?: Database["public"]["Enums"]["dispute_status"]
          description?: string
          evidence_urls?: string[]
          resolution_notes?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          refund_amount?: number | null
          refund_reference?: string | null
          assigned_to?: string | null
          admin_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_confirmations: {
        Row: {
          booking_id: string
          confirmation_deadline: string
          confirmed_arrival: boolean | null
          confirmed_at: string | null
          created_at: string
          id: string
          issue_description: string | null
          issue_reported: boolean
          issue_reported_at: string | null
          issue_type: string | null
          photo_uploaded_at: string | null
          resolution_notes: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          traveler_id: string
          updated_at: string
          verification_photo_path: string | null
        }
        Insert: {
          booking_id: string
          confirmation_deadline: string
          confirmed_arrival?: boolean | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          issue_description?: string | null
          issue_reported?: boolean
          issue_reported_at?: string | null
          issue_type?: string | null
          photo_uploaded_at?: string | null
          resolution_notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          traveler_id: string
          updated_at?: string
          verification_photo_path?: string | null
        }
        Update: {
          booking_id?: string
          confirmation_deadline?: string
          confirmed_arrival?: boolean | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          issue_description?: string | null
          issue_reported?: boolean
          issue_reported_at?: string | null
          issue_type?: string | null
          photo_uploaded_at?: string | null
          resolution_notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          traveler_id?: string
          updated_at?: string
          verification_photo_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkin_confirmations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_confirmations_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: []
      }
      listing_bids: {
        Row: {
          bid_amount: number
          bidder_id: string
          counter_offer_amount: number | null
          counter_offer_message: string | null
          created_at: string
          guest_count: number
          id: string
          listing_id: string
          message: string | null
          requested_check_in: string | null
          requested_check_out: string | null
          responded_at: string | null
          status: Database["public"]["Enums"]["bid_status"]
          updated_at: string
        }
        Insert: {
          bid_amount: number
          bidder_id: string
          counter_offer_amount?: number | null
          counter_offer_message?: string | null
          created_at?: string
          guest_count?: number
          id?: string
          listing_id: string
          message?: string | null
          requested_check_in?: string | null
          requested_check_out?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["bid_status"]
          updated_at?: string
        }
        Update: {
          bid_amount?: number
          bidder_id?: string
          counter_offer_amount?: number | null
          counter_offer_message?: string | null
          created_at?: string
          guest_count?: number
          id?: string
          listing_id?: string
          message?: string | null
          requested_check_in?: string | null
          requested_check_out?: string | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["bid_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_bids_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_bids_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          allow_counter_offers: boolean
          approved_at: string | null
          approved_by: string | null
          bidding_ends_at: string | null
          cancellation_policy: Database["public"]["Enums"]["cancellation_policy"]
          check_in_date: string
          check_out_date: string
          cleaning_fee: number | null
          created_at: string
          final_price: number
          id: string
          min_bid_amount: number | null
          nightly_rate: number
          notes: string | null
          open_for_bidding: boolean
          owner_id: string
          owner_price: number
          property_id: string
          rav_markup: number
          reserve_price: number | null
          resort_fee: number | null
          source_type: Database["public"]["Enums"]["listing_source_type"]
          status: Database["public"]["Enums"]["listing_status"]
          updated_at: string
        }
        Insert: {
          allow_counter_offers?: boolean
          approved_at?: string | null
          approved_by?: string | null
          bidding_ends_at?: string | null
          cancellation_policy?: Database["public"]["Enums"]["cancellation_policy"]
          check_in_date: string
          check_out_date: string
          cleaning_fee?: number | null
          created_at?: string
          final_price: number
          id?: string
          min_bid_amount?: number | null
          nightly_rate?: number
          notes?: string | null
          open_for_bidding?: boolean
          owner_id: string
          owner_price: number
          property_id: string
          rav_markup?: number
          reserve_price?: number | null
          resort_fee?: number | null
          source_type?: Database["public"]["Enums"]["listing_source_type"]
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
        }
        Update: {
          allow_counter_offers?: boolean
          approved_at?: string | null
          approved_by?: string | null
          bidding_ends_at?: string | null
          cancellation_policy?: Database["public"]["Enums"]["cancellation_policy"]
          check_in_date?: string
          check_out_date?: string
          cleaning_fee?: number | null
          created_at?: string
          final_price?: number
          id?: string
          min_bid_amount?: number | null
          nightly_rate?: number
          notes?: string | null
          open_for_bidding?: boolean
          owner_id?: string
          owner_price?: number
          property_id?: string
          rav_markup?: number
          reserve_price?: number | null
          resort_fee?: number | null
          source_type?: Database["public"]["Enums"]["listing_source_type"]
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_tiers: {
        Row: {
          commission_discount_pct: number
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_default: boolean
          max_active_listings: number | null
          monthly_price_cents: number
          role_category: string
          stripe_price_id: string | null
          tier_key: string
          tier_level: number
          tier_name: string
          updated_at: string | null
          voice_quota_daily: number
        }
        Insert: {
          commission_discount_pct?: number
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_default?: boolean
          max_active_listings?: number | null
          monthly_price_cents?: number
          role_category: string
          stripe_price_id?: string | null
          tier_key: string
          tier_level?: number
          tier_name: string
          updated_at?: string | null
          voice_quota_daily?: number
        }
        Update: {
          commission_discount_pct?: number
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_default?: boolean
          max_active_listings?: number | null
          monthly_price_cents?: number
          role_category?: string
          stripe_price_id?: string | null
          tier_key?: string
          tier_level?: number
          tier_name?: string
          updated_at?: string | null
          voice_quota_daily?: number
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_bid_accepted: boolean
          email_bidding_ending: boolean
          email_booking_cancelled: boolean
          email_booking_confirmed: boolean
          email_marketing: boolean
          email_new_bid: boolean
          email_new_proposal: boolean
          email_new_travel_request: boolean
          email_payout_sent: boolean
          email_product_updates: boolean
          email_proposal_accepted: boolean
          email_request_expiring: boolean
          id: string
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_bid_accepted?: boolean
          email_bidding_ending?: boolean
          email_booking_cancelled?: boolean
          email_booking_confirmed?: boolean
          email_marketing?: boolean
          email_new_bid?: boolean
          email_new_proposal?: boolean
          email_new_travel_request?: boolean
          email_payout_sent?: boolean
          email_product_updates?: boolean
          email_proposal_accepted?: boolean
          email_request_expiring?: boolean
          id?: string
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_bid_accepted?: boolean
          email_bidding_ending?: boolean
          email_booking_cancelled?: boolean
          email_booking_confirmed?: boolean
          email_marketing?: boolean
          email_new_bid?: boolean
          email_new_proposal?: boolean
          email_new_travel_request?: boolean
          email_payout_sent?: boolean
          email_product_updates?: boolean
          email_proposal_accepted?: boolean
          email_request_expiring?: boolean
          id?: string
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          bid_id: string | null
          booking_id: string | null
          created_at: string
          email_sent_at: string | null
          id: string
          listing_id: string | null
          message: string
          proposal_id: string | null
          read_at: string | null
          request_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          bid_id?: string | null
          booking_id?: string | null
          created_at?: string
          email_sent_at?: string | null
          id?: string
          listing_id?: string | null
          message: string
          proposal_id?: string | null
          read_at?: string | null
          request_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          bid_id?: string | null
          booking_id?: string | null
          created_at?: string
          email_sent_at?: string | null
          id?: string
          listing_id?: string | null
          message?: string
          proposal_id?: string | null
          read_at?: string | null
          request_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "listing_bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "travel_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "travel_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_agreements: {
        Row: {
          commission_rate: number
          created_at: string
          effective_date: string
          expiry_date: string | null
          id: string
          markup_allowed: boolean
          max_markup_percent: number | null
          owner_id: string
          status: Database["public"]["Enums"]["agreement_status"]
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          commission_rate: number
          created_at?: string
          effective_date: string
          expiry_date?: string | null
          id?: string
          markup_allowed?: boolean
          max_markup_percent?: number | null
          owner_id: string
          status?: Database["public"]["Enums"]["agreement_status"]
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          effective_date?: string
          expiry_date?: string | null
          id?: string
          markup_allowed?: boolean
          max_markup_percent?: number | null
          owner_id?: string
          status?: Database["public"]["Enums"]["agreement_status"]
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      owner_verifications: {
        Row: {
          average_rating: number | null
          cancellation_count: number
          created_at: string
          dispute_count: number
          id: string
          kyc_provider: string | null
          kyc_reference_id: string | null
          kyc_verified: boolean
          kyc_verified_at: string | null
          max_active_listings: number
          max_listing_value: number
          owner_id: string
          phone_number: string | null
          phone_verified: boolean
          phone_verified_at: string | null
          rejection_reason: string | null
          security_deposit_amount: number | null
          security_deposit_paid: boolean
          security_deposit_paid_at: string | null
          security_deposit_required: boolean
          successful_stays: number
          total_bookings: number
          trust_level: Database["public"]["Enums"]["owner_trust_level"]
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          average_rating?: number | null
          cancellation_count?: number
          created_at?: string
          dispute_count?: number
          id?: string
          kyc_provider?: string | null
          kyc_reference_id?: string | null
          kyc_verified?: boolean
          kyc_verified_at?: string | null
          max_active_listings?: number
          max_listing_value?: number
          owner_id: string
          phone_number?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          rejection_reason?: string | null
          security_deposit_amount?: number | null
          security_deposit_paid?: boolean
          security_deposit_paid_at?: string | null
          security_deposit_required?: boolean
          successful_stays?: number
          total_bookings?: number
          trust_level?: Database["public"]["Enums"]["owner_trust_level"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          average_rating?: number | null
          cancellation_count?: number
          created_at?: string
          dispute_count?: number
          id?: string
          kyc_provider?: string | null
          kyc_reference_id?: string | null
          kyc_verified?: boolean
          kyc_verified_at?: string | null
          max_active_listings?: number
          max_listing_value?: number
          owner_id?: string
          phone_number?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          rejection_reason?: string | null
          security_deposit_amount?: number | null
          security_deposit_paid?: boolean
          security_deposit_paid_at?: string | null
          security_deposit_required?: boolean
          successful_stays?: number
          total_bookings?: number
          trust_level?: Database["public"]["Enums"]["owner_trust_level"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_verifications_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_guarantee_fund: {
        Row: {
          booking_id: string | null
          claim_id: string | null
          claim_reason: string | null
          claimed_amount: number | null
          claimed_at: string | null
          contribution_amount: number
          contribution_percentage: number
          created_at: string
          id: string
        }
        Insert: {
          booking_id?: string | null
          claim_id?: string | null
          claim_reason?: string | null
          claimed_amount?: number | null
          claimed_at?: string | null
          contribution_amount: number
          contribution_percentage?: number
          created_at?: string
          id?: string
        }
        Update: {
          booking_id?: string | null
          claim_id?: string | null
          claim_reason?: string | null
          claimed_amount?: number | null
          claimed_at?: string | null
          contribution_amount?: number
          contribution_percentage?: number
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_guarantee_fund_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          annual_maintenance_fees: number | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string
          current_privacy_version: string | null
          current_terms_version: string | null
          deletion_reason: string | null
          deletion_requested_at: string | null
          deletion_scheduled_for: string | null
          email: string
          full_name: string | null
          id: string
          is_anonymized: boolean
          is_seed_foundation: boolean | null
          maintenance_fee_updated_at: string | null
          onboarding_completed_at: string | null
          phone: string | null
          rejection_reason: string | null
          stripe_account_id: string | null
          stripe_charges_enabled: boolean | null
          stripe_onboarding_complete: boolean | null
          stripe_payouts_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          annual_maintenance_fees?: number | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          current_privacy_version?: string | null
          current_terms_version?: string | null
          deletion_reason?: string | null
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          email: string
          full_name?: string | null
          id: string
          is_anonymized?: boolean
          is_seed_foundation?: boolean | null
          maintenance_fee_updated_at?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          rejection_reason?: string | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_complete?: boolean | null
          stripe_payouts_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          annual_maintenance_fees?: number | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          current_privacy_version?: string | null
          current_terms_version?: string | null
          deletion_reason?: string | null
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_anonymized?: boolean
          is_seed_foundation?: boolean | null
          maintenance_fee_updated_at?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          rejection_reason?: string | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_complete?: boolean | null
          stripe_payouts_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      terms_acceptance_log: {
        Row: {
          id: string
          user_id: string
          terms_version: string
          privacy_version: string
          terms_accepted: boolean
          privacy_accepted: boolean
          age_verified: boolean
          accepted_at: string
          acceptance_method: string
          user_agent: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          terms_version: string
          privacy_version: string
          terms_accepted?: boolean
          privacy_accepted?: boolean
          age_verified?: boolean
          accepted_at?: string
          acceptance_method: string
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          terms_version?: string
          privacy_version?: string
          terms_accepted?: boolean
          privacy_accepted?: boolean
          age_verified?: boolean
          accepted_at?: string
          acceptance_method?: string
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_acceptance_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          amenities: string[] | null
          bathrooms: number
          bedrooms: number
          brand: Database["public"]["Enums"]["vacation_club_brand"]
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          location: string
          owner_id: string
          resort_id: string | null
          resort_name: string
          sleeps: number
          unit_type_id: string | null
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          bathrooms?: number
          bedrooms?: number
          brand: Database["public"]["Enums"]["vacation_club_brand"]
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          location: string
          owner_id: string
          resort_id?: string | null
          resort_name: string
          sleeps?: number
          unit_type_id?: string | null
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          bathrooms?: number
          bedrooms?: number
          brand?: Database["public"]["Enums"]["vacation_club_brand"]
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          location?: string
          owner_id?: string
          resort_id?: string | null
          resort_name?: string
          sleeps?: number
          unit_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_resort_id_fkey"
            columns: ["resort_id"]
            isOneToOne: false
            referencedRelation: "resort_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_resort_id_fkey"
            columns: ["resort_id"]
            isOneToOne: false
            referencedRelation: "resorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_unit_type_id_fkey"
            columns: ["unit_type_id"]
            isOneToOne: false
            referencedRelation: "resort_unit_types"
            referencedColumns: ["id"]
          },
        ]
      }
      resort_unit_types: {
        Row: {
          bathrooms: number
          bedding_config: string | null
          bedrooms: number
          created_at: string | null
          features: Json | null
          id: string
          kitchen_type: string | null
          max_occupancy: number
          resort_id: string | null
          square_footage: number | null
          unit_amenities: string[] | null
          unit_type_name: string
          updated_at: string | null
        }
        Insert: {
          bathrooms: number
          bedding_config?: string | null
          bedrooms: number
          created_at?: string | null
          features?: Json | null
          id?: string
          kitchen_type?: string | null
          max_occupancy: number
          resort_id?: string | null
          square_footage?: number | null
          unit_amenities?: string[] | null
          unit_type_name: string
          updated_at?: string | null
        }
        Update: {
          bathrooms?: number
          bedding_config?: string | null
          bedrooms?: number
          created_at?: string | null
          features?: Json | null
          id?: string
          kitchen_type?: string | null
          max_occupancy?: number
          resort_id?: string | null
          square_footage?: number | null
          unit_amenities?: string[] | null
          unit_type_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resort_unit_types_resort_id_fkey"
            columns: ["resort_id"]
            isOneToOne: false
            referencedRelation: "resort_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resort_unit_types_resort_id_fkey"
            columns: ["resort_id"]
            isOneToOne: false
            referencedRelation: "resorts"
            referencedColumns: ["id"]
          },
        ]
      }
      resorts: {
        Row: {
          additional_images: string[] | null
          brand: Database["public"]["Enums"]["vacation_club_brand"]
          contact: Json | null
          created_at: string | null
          description: string | null
          guest_rating: number | null
          id: string
          location: Json
          main_image_url: string | null
          nearby_airports: string[] | null
          policies: Json | null
          resort_amenities: string[] | null
          resort_name: string
          updated_at: string | null
        }
        Insert: {
          additional_images?: string[] | null
          brand: Database["public"]["Enums"]["vacation_club_brand"]
          contact?: Json | null
          created_at?: string | null
          description?: string | null
          guest_rating?: number | null
          id?: string
          location: Json
          main_image_url?: string | null
          nearby_airports?: string[] | null
          policies?: Json | null
          resort_amenities?: string[] | null
          resort_name: string
          updated_at?: string | null
        }
        Update: {
          additional_images?: string[] | null
          brand?: Database["public"]["Enums"]["vacation_club_brand"]
          contact?: Json | null
          created_at?: string | null
          description?: string | null
          guest_rating?: number | null
          id?: string
          location?: Json
          main_image_url?: string | null
          nearby_airports?: string[] | null
          policies?: Json | null
          resort_amenities?: string[] | null
          resort_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      role_upgrade_requests: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          rejection_reason: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_upgrade_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      travel_proposals: {
        Row: {
          created_at: string
          id: string
          listing_id: string | null
          message: string | null
          owner_id: string
          property_id: string
          proposed_check_in: string
          proposed_check_out: string
          proposed_price: number
          request_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          updated_at: string
          valid_until: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id?: string | null
          message?: string | null
          owner_id: string
          property_id: string
          proposed_check_in: string
          proposed_check_out: string
          proposed_price: number
          request_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          updated_at?: string
          valid_until: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string | null
          message?: string | null
          owner_id?: string
          property_id?: string
          proposed_check_in?: string
          proposed_check_out?: string
          proposed_price?: number
          request_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          updated_at?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_proposals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_proposals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_proposals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_proposals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "travel_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_requests: {
        Row: {
          amenities_required: string[] | null
          bedrooms_needed: number
          budget_max: number | null
          budget_min: number | null
          budget_preference: Database["public"]["Enums"]["budget_preference"]
          check_in_date: string
          check_out_date: string
          created_at: string
          dates_flexible: boolean
          destination_flexibility: string | null
          destination_location: string
          flexibility_days: number | null
          guest_count: number
          id: string
          preferred_brands: string[] | null
          proposals_deadline: string
          source_listing_id: string | null
          special_requirements: string | null
          status: Database["public"]["Enums"]["travel_request_status"]
          target_owner_only: boolean
          traveler_id: string
          updated_at: string
        }
        Insert: {
          amenities_required?: string[] | null
          bedrooms_needed?: number
          budget_max?: number | null
          budget_min?: number | null
          budget_preference?: Database["public"]["Enums"]["budget_preference"]
          check_in_date: string
          check_out_date: string
          created_at?: string
          dates_flexible?: boolean
          destination_flexibility?: string | null
          destination_location: string
          flexibility_days?: number | null
          guest_count?: number
          id?: string
          preferred_brands?: string[] | null
          proposals_deadline: string
          source_listing_id?: string | null
          special_requirements?: string | null
          status?: Database["public"]["Enums"]["travel_request_status"]
          target_owner_only?: boolean
          traveler_id: string
          updated_at?: string
        }
        Update: {
          amenities_required?: string[] | null
          bedrooms_needed?: number
          budget_max?: number | null
          budget_min?: number | null
          budget_preference?: Database["public"]["Enums"]["budget_preference"]
          check_in_date?: string
          check_out_date?: string
          created_at?: string
          dates_flexible?: boolean
          destination_flexibility?: string | null
          destination_location?: string
          flexibility_days?: number | null
          guest_count?: number
          id?: string
          preferred_brands?: string[] | null
          proposals_deadline?: string
          source_listing_id?: string | null
          special_requirements?: string | null
          status?: Database["public"]["Enums"]["travel_request_status"]
          target_owner_only?: boolean
          traveler_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_requests_source_listing_id_fkey"
            columns: ["source_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_requests_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_memberships: {
        Row: {
          admin_notes: string | null
          admin_override: boolean
          cancelled_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          started_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          admin_override?: boolean
          cancelled_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          admin_override?: boolean
          cancelled_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_memberships_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "membership_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_documents: {
        Row: {
          doc_type: Database["public"]["Enums"]["verification_doc_type"]
          expires_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          owner_id: string
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          uploaded_at: string
          verification_id: string
        }
        Insert: {
          doc_type: Database["public"]["Enums"]["verification_doc_type"]
          expires_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          owner_id: string
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          uploaded_at?: string
          verification_id: string
        }
        Update: {
          doc_type?: Database["public"]["Enums"]["verification_doc_type"]
          expires_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          owner_id?: string
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          uploaded_at?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "owner_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_search_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          latency_ms: number | null
          results_count: number
          search_params: Json
          source: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          results_count?: number
          search_params?: Json
          source?: string
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          results_count?: number
          search_params?: Json
          source?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_search_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_search_usage: {
        Row: {
          created_at: string | null
          id: string
          last_search_at: string | null
          search_count: number | null
          search_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_search_at?: string | null
          search_count?: number | null
          search_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_search_at?: string | null
          search_count?: number | null
          search_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_user_overrides: {
        Row: {
          created_at: string | null
          created_by: string | null
          custom_quota_daily: number | null
          id: string
          reason: string | null
          updated_at: string | null
          user_id: string
          voice_disabled: boolean
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          custom_quota_daily?: number | null
          id?: string
          reason?: string | null
          updated_at?: string | null
          user_id: string
          voice_disabled?: boolean
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          custom_quota_daily?: number | null
          id?: string
          reason?: string | null
          updated_at?: string | null
          user_id?: string
          voice_disabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "voice_user_overrides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_user_overrides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      resort_summary: {
        Row: {
          brand: Database["public"]["Enums"]["vacation_club_brand"] | null
          city: string | null
          country: string | null
          guest_rating: number | null
          id: string | null
          max_bedrooms: number | null
          max_occupancy: number | null
          min_bedrooms: number | null
          min_occupancy: number | null
          resort_name: string | null
          state: string | null
          unit_type_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_role_upgrade: {
        Args: { _approved_by: string; _request_id: string }
        Returns: boolean
      }
      approve_user: {
        Args: { _approved_by: string; _user_id: string }
        Returns: boolean
      }
      calculate_fair_value_score: {
        Args: { p_listing_id: string }
        Returns: Json
      }
      calculate_policy_refund: {
        Args: {
          _days_until_checkin: number
          _policy: Database["public"]["Enums"]["cancellation_policy"]
          _total_amount: number
        }
        Returns: number
      }
      can_access_platform: { Args: { _user_id: string }; Returns: boolean }
      can_owner_create_listing: {
        Args: { _listing_value: number; _owner_id: string }
        Returns: boolean
      }
      can_use_voice_search: { Args: { _user_id: string }; Returns: boolean }
      cleanup_old_voice_usage: { Args: never; Returns: number }
      extend_owner_confirmation_deadline: {
        Args: { p_booking_confirmation_id: string; p_owner_id: string }
        Returns: Json
      }
      get_bid_count: { Args: { _listing_id: string }; Returns: number }
      get_highest_bid: { Args: { _listing_id: string }; Returns: number }
      get_owner_commission_rate: {
        Args: { _owner_id: string }
        Returns: number
      }
      get_owner_dashboard_stats: { Args: { p_owner_id: string }; Returns: Json }
      get_owner_monthly_earnings: {
        Args: { p_owner_id: string }
        Returns: {
          booking_count: number
          earnings: number
          month: string
        }[]
      }
      get_owner_trust_level: {
        Args: { _owner_id: string }
        Returns: Database["public"]["Enums"]["owner_trust_level"]
      }
      get_proposal_count: { Args: { _request_id: string }; Returns: number }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      get_user_voice_quota: { Args: { _user_id: string }; Returns: number }
      get_voice_search_count: { Args: { _user_id: string }; Returns: number }
      get_voice_searches_remaining: {
        Args: { _user_id: string }
        Returns: number
      }
      get_voice_top_users: {
        Args: { _days?: number; _limit?: number }
        Returns: {
          email: string
          error_count: number
          full_name: string
          last_search_at: string
          success_count: number
          success_rate: number
          total_searches: number
          user_id: string
        }[]
      }
      get_voice_usage_stats: {
        Args: { _days?: number }
        Returns: {
          avg_latency_ms: number
          avg_results_count: number
          error_count: number
          no_results_count: number
          search_date: string
          success_count: number
          timeout_count: number
          total_searches: number
          unique_users: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_voice_search_count: {
        Args: { _user_id: string }
        Returns: undefined
      }
      is_property_owner: { Args: { _user_id: string }; Returns: boolean }
      is_rav_team: { Args: { _user_id: string }; Returns: boolean }
      log_voice_search: {
        Args: {
          _error_message?: string
          _latency_ms?: number
          _results_count?: number
          _search_params?: Json
          _source?: string
          _status?: string
        }
        Returns: string
      }
      owns_listing: {
        Args: { _listing_id: string; _user_id: string }
        Returns: boolean
      }
      owns_travel_request: {
        Args: { _request_id: string; _user_id: string }
        Returns: boolean
      }
      reject_role_upgrade: {
        Args: { _reason?: string; _rejected_by: string; _request_id: string }
        Returns: boolean
      }
      reject_user: {
        Args: { _reason?: string; _rejected_by: string; _user_id: string }
        Returns: boolean
      }
      request_role_upgrade: {
        Args: {
          _reason?: string
          _requested_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: string
      }
      update_owner_trust_level: {
        Args: { _owner_id: string }
        Returns: Database["public"]["Enums"]["owner_trust_level"]
      }
    }
    Enums: {
      agreement_status: "pending" | "active" | "suspended" | "terminated"
      app_role:
        | "rav_owner"
        | "rav_admin"
        | "rav_staff"
        | "property_owner"
        | "renter"
      bid_status: "pending" | "accepted" | "rejected" | "expired" | "withdrawn"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      budget_preference: "range" | "ceiling" | "undisclosed"
      cancellation_policy: "flexible" | "moderate" | "strict" | "super_strict"
      cancellation_status:
        | "pending"
        | "approved"
        | "denied"
        | "counter_offer"
        | "completed"
      dispute_category:
        | "property_not_as_described"
        | "access_issues"
        | "safety_concerns"
        | "cleanliness"
        | "cancellation_dispute"
        | "payment_dispute"
        | "owner_no_show"
        | "other"
      dispute_priority: "low" | "medium" | "high" | "critical"
      dispute_status:
        | "open"
        | "investigating"
        | "awaiting_response"
        | "resolved_full_refund"
        | "resolved_partial_refund"
        | "resolved_no_refund"
        | "closed"
      escrow_status:
        | "pending_confirmation"
        | "confirmation_submitted"
        | "verified"
        | "released"
        | "refunded"
        | "disputed"
      listing_source_type: "pre_booked" | "wish_matched"
      listing_status:
        | "draft"
        | "pending_approval"
        | "active"
        | "booked"
        | "completed"
        | "cancelled"
      notification_type:
        | "new_bid_received"
        | "bid_accepted"
        | "bid_rejected"
        | "bid_expired"
        | "bidding_ending_soon"
        | "new_travel_request_match"
        | "new_proposal_received"
        | "proposal_accepted"
        | "proposal_rejected"
        | "request_expiring_soon"
        | "booking_confirmed"
        | "payment_received"
        | "message_received"
        | "travel_request_expiring_soon"
        | "travel_request_matched"
      owner_trust_level: "new" | "verified" | "trusted" | "premium"
      payout_status: "pending" | "processing" | "paid" | "failed"
      proposal_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "expired"
        | "withdrawn"
      travel_request_status:
        | "open"
        | "closed"
        | "fulfilled"
        | "expired"
        | "cancelled"
      vacation_club_brand:
        | "hilton_grand_vacations"
        | "marriott_vacation_club"
        | "disney_vacation_club"
        | "wyndham_destinations"
        | "hyatt_residence_club"
        | "bluegreen_vacations"
        | "holiday_inn_club"
        | "worldmark"
        | "other"
      verification_doc_type:
        | "timeshare_deed"
        | "membership_certificate"
        | "resort_contract"
        | "points_statement"
        | "government_id"
        | "utility_bill"
        | "other"
      verification_status:
        | "pending"
        | "under_review"
        | "approved"
        | "rejected"
        | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================================
// ENUM TYPE ALIASES (backward-compatible standalone types)
// ============================================================

export type AppRole = Database['public']['Enums']['app_role'];
export type ListingStatus = Database['public']['Enums']['listing_status'];
export type ListingSourceType = Database['public']['Enums']['listing_source_type'];
export type BookingStatus = Database['public']['Enums']['booking_status'];
export type PayoutStatus = Database['public']['Enums']['payout_status'];
export type AgreementStatus = Database['public']['Enums']['agreement_status'];
export type CancellationPolicy = Database['public']['Enums']['cancellation_policy'];
export type CancellationStatus = Database['public']['Enums']['cancellation_status'];
export type OwnerTrustLevel = Database['public']['Enums']['owner_trust_level'];
export type VerificationDocType = Database['public']['Enums']['verification_doc_type'];
export type VerificationStatus = Database['public']['Enums']['verification_status'];
export type EscrowStatus = Database['public']['Enums']['escrow_status'];
export type VacationClubBrand = Database['public']['Enums']['vacation_club_brand'];
export type BidStatus = Database['public']['Enums']['bid_status'];
export type BudgetPreference = Database['public']['Enums']['budget_preference'];
export type NotificationType = Database['public']['Enums']['notification_type'];
export type ProposalStatus = Database['public']['Enums']['proposal_status'];
export type TravelRequestStatus = Database['public']['Enums']['travel_request_status'];

export type OwnerConfirmationStatus =
  | 'pending_owner'
  | 'owner_confirmed'
  | 'owner_timed_out'
  | 'owner_declined';

export type ApprovalStatus = 'pending_approval' | 'approved' | 'rejected';

export type RoleUpgradeStatus = 'pending' | 'approved' | 'rejected';

export type MembershipStatus = 'active' | 'cancelled' | 'expired' | 'pending';

export type RoleCategory = 'traveler' | 'owner';

// ============================================================
// MANUALLY-TYPED INTERFACES (typed JSON fields)
// These provide proper typing for JSONB columns that the
// auto-generator represents as `Json`.
// ============================================================

export interface MembershipTier {
  id: string;
  tier_key: string;
  role_category: RoleCategory;
  tier_name: string;
  tier_level: number;
  monthly_price_cents: number;
  voice_quota_daily: number;
  commission_discount_pct: number;
  max_active_listings: number | null;
  features: string[];
  description: string | null;
  is_default: boolean;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserMembership {
  id: string;
  user_id: string;
  tier_id: string;
  status: MembershipStatus;
  started_at: string;
  expires_at: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  cancelled_at: string | null;
  admin_override: boolean;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserMembershipWithTier extends UserMembership {
  tier: MembershipTier;
}

export interface RoleUpgradeRequest {
  id: string;
  user_id: string;
  requested_role: AppRole;
  status: RoleUpgradeStatus;
  reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resort {
  id: string;
  brand: VacationClubBrand;
  resort_name: string;
  location: {
    city: string;
    state: string;
    country: string;
    full_address: string;
  };
  description: string | null;
  contact: {
    phone: string;
    email: string;
    website: string;
  } | null;
  resort_amenities: string[];
  attraction_tags: string[];
  policies: {
    check_in: string;
    check_out: string;
    parking: string;
    pets: string;
  } | null;
  nearby_airports: string[];
  guest_rating: number | null;
  main_image_url: string | null;
  additional_images: string[];
  // MDM governance fields (WS1 — migration 20260415)
  is_active: boolean;
  data_source: string | null;
  data_quality_score: number | null;
  verified_by: string | null;
  verified_at: string | null;
  // Geocoding (WS1)
  latitude: number | null;
  longitude: number | null;
  postal_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResortUnitType {
  id: string;
  resort_id: string;
  unit_type_name: string;
  bedrooms: number;
  bathrooms: number;
  max_occupancy: number;
  square_footage: number | null;
  kitchen_type: string | null;
  bedding_config: string | null;
  features: {
    balcony: boolean;
    view_type: string;
    washer_dryer: boolean;
    accessible: boolean;
  } | null;
  unit_amenities: string[];
  // OTA standard fields (WS1)
  min_stay_nights: number;
  smoking_policy: string;
  created_at: string;
  updated_at: string;
}

export interface ResortExternalId {
  id: string;
  resort_id: string;
  system_name: string;
  external_id: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// CONVENIENCE ROW TYPE ALIASES
// ============================================================

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type Property = Database['public']['Tables']['properties']['Row'];
export type OwnerAgreement = Database['public']['Tables']['owner_agreements']['Row'];
export type Listing = Database['public']['Tables']['listings']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type CancellationRequest = Database['public']['Tables']['cancellation_requests']['Row'];
export type OwnerVerification = Database['public']['Tables']['owner_verifications']['Row'];
export type VerificationDocument = Database['public']['Tables']['verification_documents']['Row'];
export type BookingConfirmation = Database['public']['Tables']['booking_confirmations']['Row'];
export type CheckinConfirmation = Database['public']['Tables']['checkin_confirmations']['Row'];
export type Favorite = Database['public']['Tables']['favorites']['Row'];
export type SystemSetting = Database['public']['Tables']['system_settings']['Row'];
export type PlatformGuaranteeFund = Database['public']['Tables']['platform_guarantee_fund']['Row'];
export type VoiceSearchUsage = Database['public']['Tables']['voice_search_usage']['Row'];

// ============================================================
// EXTENDED TYPES WITH JOINS
// ============================================================

export type ListingWithProperty = Listing & {
  property: Property;
};

export type BookingWithDetails = Booking & {
  listing: ListingWithProperty;
  renter: Profile;
};

export type CancellationRequestWithDetails = CancellationRequest & {
  booking: BookingWithDetails;
};

export type OwnerVerificationWithDocs = OwnerVerification & {
  documents: VerificationDocument[];
};

// ============================================================
// DISPLAY HELPERS
// ============================================================

export const CANCELLATION_POLICY_LABELS: Record<CancellationPolicy, string> = {
  flexible: 'Flexible',
  moderate: 'Moderate',
  strict: 'Strict',
  super_strict: 'Super Strict',
};

export const CANCELLATION_POLICY_DESCRIPTIONS: Record<CancellationPolicy, string> = {
  flexible: 'Full refund up to 24 hours before check-in',
  moderate: 'Full refund 5+ days before, 50% refund 1-4 days before',
  strict: '50% refund 7+ days before, no refund after',
  super_strict: 'No refunds after booking is confirmed',
};

export const TRUST_LEVEL_LABELS: Record<OwnerTrustLevel, string> = {
  new: 'New Owner',
  verified: 'Verified',
  trusted: 'Trusted',
  premium: 'Premium',
};

export const TRUST_LEVEL_DESCRIPTIONS: Record<OwnerTrustLevel, string> = {
  new: 'Just getting started, limited listings allowed',
  verified: 'Documents verified, building reputation',
  trusted: '3+ successful stays, good standing',
  premium: '10+ stays, zero issues, priority support',
};

export const ESCROW_STATUS_LABELS: Record<EscrowStatus, string> = {
  pending_confirmation: 'Awaiting Confirmation',
  confirmation_submitted: 'Under Review',
  verified: 'Verified',
  released: 'Released',
  refunded: 'Refunded',
  disputed: 'Disputed',
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
};

export const ROLE_LABELS: Record<AppRole, string> = {
  rav_owner: 'RAV Owner',
  rav_admin: 'RAV Admin',
  rav_staff: 'RAV Staff',
  property_owner: 'Property Owner',
  renter: 'Renter',
};

export const ROLE_COLORS: Record<AppRole, string> = {
  rav_owner: 'bg-purple-500',
  rav_admin: 'bg-blue-500',
  rav_staff: 'bg-cyan-500',
  property_owner: 'bg-green-500',
  renter: 'bg-gray-500',
};

/**
 * Signup account types map to DB roles via the `handle_new_user()` trigger:
 *   'renter'  -> renter role,          role_category 'traveler'
 *   'owner'   -> property_owner role,  role_category 'owner'
 */
export type AccountType = 'renter' | 'owner';

// ============================================================
// AUTO-GENERATED HELPER TYPES
// ============================================================

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never
