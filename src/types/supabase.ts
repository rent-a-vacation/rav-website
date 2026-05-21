export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_user_id: string
          after_value: Json | null
          before_value: Json | null
          created_at: string
          entity_key: string
          entity_type: string
          id: string
          notes: string | null
        }
        Insert: {
          action: string
          actor_user_id: string
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string
          entity_key: string
          entity_type: string
          id?: string
          notes?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string
          entity_key?: string
          entity_type?: string
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          allowed_ips: string[] | null
          created_at: string
          daily_limit: number
          daily_usage: number
          daily_usage_reset_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          owner_user_id: string
          per_minute_limit: number
          revoked_at: string | null
          scopes: string[]
          tier: string
          updated_at: string
        }
        Insert: {
          allowed_ips?: string[] | null
          created_at?: string
          daily_limit?: number
          daily_usage?: number
          daily_usage_reset_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          owner_user_id: string
          per_minute_limit?: number
          revoked_at?: string | null
          scopes?: string[]
          tier?: string
          updated_at?: string
        }
        Update: {
          allowed_ips?: string[] | null
          created_at?: string
          daily_limit?: number
          daily_usage?: number
          daily_usage_reset_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          owner_user_id?: string
          per_minute_limit?: number
          revoked_at?: string | null
          scopes?: string[]
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_request_log: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip_address: string | null
          key_id: string | null
          method: string
          response_time_ms: number | null
          status_code: number | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: string | null
          key_id?: string | null
          method?: string
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string | null
          key_id?: string | null
          method?: string
          response_time_ms?: number | null
          status_code?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_request_log_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_confirmations: {
        Row: {
          auto_released: boolean | null
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
          payout_held: boolean | null
          payout_held_by: string | null
          payout_held_reason: string | null
          rav_verification_notes: string | null
          rav_verified_at: string | null
          rav_verifier_id: string | null
          resort_confirmation_number: string | null
          resort_contact_name: string | null
          resort_contact_phone: string | null
          updated_at: string
          verified_by_rav: boolean
        }
        Insert: {
          auto_released?: boolean | null
          booking_id: string
          confirmation_deadline: string
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
          payout_held?: boolean | null
          payout_held_by?: string | null
          payout_held_reason?: string | null
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
          auto_released?: boolean | null
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
          owner_confirmation_deadline?: string | null
          owner_confirmation_status?: string | null
          owner_confirmed_at?: string | null
          owner_declined_at?: string | null
          owner_extension_requested_at?: string[] | null
          owner_id?: string
          payout_held?: boolean | null
          payout_held_by?: string | null
          payout_held_reason?: string | null
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
          {
            foreignKeyName: "booking_confirmations_payout_held_by_fkey"
            columns: ["payout_held_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_messages: {
        Row: {
          body: string
          booking_id: string
          created_at: string
          id: string
          is_read: boolean
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          booking_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          booking_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_messages_sender_id_fkey"
            columns: ["sender_id"]
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
          commission_rate_applied: number | null
          conversation_id: string | null
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
          commission_rate_applied?: number | null
          conversation_id?: string | null
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
          commission_rate_applied?: number | null
          conversation_id?: string | null
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
            foreignKeyName: "bookings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "bookings_travel_proposal_id_fkey"
            columns: ["travel_proposal_id"]
            isOneToOne: false
            referencedRelation: "travel_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours_config: {
        Row: {
          end_hour: number
          federal_holidays: string[]
          id: number
          start_hour: number
          timezone: string
          updated_at: string
          weekend_days: number[]
        }
        Insert: {
          end_hour?: number
          federal_holidays?: string[]
          id?: number
          start_hour?: number
          timezone?: string
          updated_at?: string
          weekend_days?: number[]
        }
        Update: {
          end_hour?: number
          federal_holidays?: string[]
          id?: number
          start_hour?: number
          timezone?: string
          updated_at?: string
          weekend_days?: number[]
        }
        Relationships: []
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
      checkin_confirmations: {
        Row: {
          booking_id: string
          confirmation_deadline: string
          confirmed_arrival: boolean | null
          confirmed_at: string | null
          confirmed_at_source:
            | Database["public"]["Enums"]["checkin_confirmation_source"]
            | null
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
          confirmed_at_source?:
            | Database["public"]["Enums"]["checkin_confirmation_source"]
            | null
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
          confirmed_at_source?:
            | Database["public"]["Enums"]["checkin_confirmation_source"]
            | null
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
      concierge_requests: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string | null
          description: string
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          subject: string
          traveler_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string | null
          description: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          traveler_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          traveler_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concierge_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concierge_requests_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_events: {
        Row: {
          conversation_id: string
          created_at: string
          event_data: Json
          event_type: string
          id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
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
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
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
          context_id: string | null
          context_type: string
          created_at: string
          id: string
          last_message_at: string | null
          listing_id: string | null
          owner_id: string
          owner_unread_count: number
          property_id: string
          status: string
          traveler_id: string
          traveler_unread_count: number
          updated_at: string
        }
        Insert: {
          context_id?: string | null
          context_type: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          listing_id?: string | null
          owner_id: string
          owner_unread_count?: number
          property_id: string
          status?: string
          traveler_id: string
          traveler_unread_count?: number
          updated_at?: string
        }
        Update: {
          context_id?: string | null
          context_type?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          listing_id?: string | null
          owner_id?: string
          owner_unread_count?: number
          property_id?: string
          status?: string
          traveler_id?: string
          traveler_unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_owner_id_fkey"
            columns: ["owner_id"]
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
            foreignKeyName: "conversations_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_messages: {
        Row: {
          created_at: string
          dispute_id: string
          id: string
          is_internal: boolean
          message: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          dispute_id: string
          id?: string
          is_internal?: boolean
          message: string
          sender_id: string
        }
        Update: {
          created_at?: string
          dispute_id?: string
          id?: string
          is_internal?: boolean
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_messages_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          booking_id: string
          category: Database["public"]["Enums"]["dispute_category"]
          created_at: string
          description: string
          evidence_urls: string[] | null
          id: string
          priority: Database["public"]["Enums"]["dispute_priority"]
          refund_amount: number | null
          refund_reference: string | null
          reported_user_id: string | null
          reporter_id: string
          resolution_alerted_at: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          sla_resolution_minutes: number | null
          sla_triage_minutes: number | null
          source: Database["public"]["Enums"]["dispute_source"]
          status: Database["public"]["Enums"]["dispute_status"]
          stripe_dispute_id: string | null
          triage_alerted_at: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          booking_id: string
          category?: Database["public"]["Enums"]["dispute_category"]
          created_at?: string
          description: string
          evidence_urls?: string[] | null
          id?: string
          priority?: Database["public"]["Enums"]["dispute_priority"]
          refund_amount?: number | null
          refund_reference?: string | null
          reported_user_id?: string | null
          reporter_id: string
          resolution_alerted_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_resolution_minutes?: number | null
          sla_triage_minutes?: number | null
          source?: Database["public"]["Enums"]["dispute_source"]
          status?: Database["public"]["Enums"]["dispute_status"]
          stripe_dispute_id?: string | null
          triage_alerted_at?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          booking_id?: string
          category?: Database["public"]["Enums"]["dispute_category"]
          created_at?: string
          description?: string
          evidence_urls?: string[] | null
          id?: string
          priority?: Database["public"]["Enums"]["dispute_priority"]
          refund_amount?: number | null
          refund_reference?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          resolution_alerted_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_resolution_minutes?: number | null
          sla_triage_minutes?: number | null
          source?: Database["public"]["Enums"]["dispute_source"]
          status?: Database["public"]["Enums"]["dispute_status"]
          stripe_dispute_id?: string | null
          triage_alerted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_instances: {
        Row: {
          auto_generated: boolean
          created_at: string
          date_confirmed: boolean
          destination: Database["public"]["Enums"]["destination_bucket"] | null
          end_date: string | null
          event_date: string
          event_id: string
          id: string
          notes: string | null
          priority: string
          reminder_12wk: string | null
          reminder_2wk: string | null
          reminder_6wk: string | null
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          auto_generated?: boolean
          created_at?: string
          date_confirmed?: boolean
          destination?: Database["public"]["Enums"]["destination_bucket"] | null
          end_date?: string | null
          event_date: string
          event_id: string
          id?: string
          notes?: string | null
          priority?: string
          reminder_12wk?: string | null
          reminder_2wk?: string | null
          reminder_6wk?: string | null
          status?: string
          updated_at?: string
          year: number
        }
        Update: {
          auto_generated?: boolean
          created_at?: string
          date_confirmed?: boolean
          destination?: Database["public"]["Enums"]["destination_bucket"] | null
          end_date?: string | null
          event_date?: string
          event_id?: string
          id?: string
          notes?: string | null
          priority?: string
          reminder_12wk?: string | null
          reminder_2wk?: string | null
          reminder_6wk?: string | null
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_instances_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "seasonal_events"
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
      financial_model_scenarios: {
        Row: {
          created_at: string
          expense_overrides: Json
          id: string
          is_shared: boolean
          multiplier: string
          name: string
          overrides: Json
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expense_overrides?: Json
          id?: string
          is_shared?: boolean
          multiplier?: string
          name: string
          overrides?: Json
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expense_overrides?: Json
          id?: string
          is_shared?: boolean
          multiplier?: string
          name?: string
          overrides?: Json
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      fraud_reports: {
        Row: {
          booking_id: string | null
          category: string
          created_at: string
          description: string
          evidence_urls: string[] | null
          id: string
          internal_notes: string | null
          listing_id: string | null
          reported_user_id: string | null
          reporter_email: string | null
          reporter_id: string | null
          reporter_name: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          category: string
          created_at?: string
          description: string
          evidence_urls?: string[] | null
          id?: string
          internal_notes?: string | null
          listing_id?: string | null
          reported_user_id?: string | null
          reporter_email?: string | null
          reporter_id?: string | null
          reporter_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          category?: string
          created_at?: string
          description?: string
          evidence_urls?: string[] | null
          id?: string
          internal_notes?: string | null
          listing_id?: string | null
          reported_user_id?: string | null
          reporter_email?: string | null
          reporter_id?: string | null
          reporter_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_messages: {
        Row: {
          body: string
          created_at: string | null
          id: string
          inquiry_id: string
          is_read: boolean | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          inquiry_id: string
          is_read?: boolean | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          inquiry_id?: string
          is_read?: boolean | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_messages_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "listing_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_accuracy_reports: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          listing_id: string
          reporter_email: string | null
          reporter_id: string | null
          reporter_name: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          listing_id: string
          reporter_email?: string | null
          reporter_id?: string | null
          reporter_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          listing_id?: string
          reporter_email?: string | null
          reporter_id?: string | null
          reporter_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_accuracy_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_bids: {
        Row: {
          bid_amount: number
          bidder_id: string
          conversation_id: string | null
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
          conversation_id?: string | null
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
          conversation_id?: string | null
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
            foreignKeyName: "listing_bids_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
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
      listing_inquiries: {
        Row: {
          asker_id: string
          conversation_id: string | null
          created_at: string | null
          id: string
          listing_id: string
          owner_id: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          asker_id: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          listing_id: string
          owner_id: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          asker_id?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string
          owner_id?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_inquiries_asker_id_fkey"
            columns: ["asker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_inquiries_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_inquiries_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          admin_edit_notes: string | null
          admin_phone_verification_notes: string | null
          allow_counter_offers: boolean
          approved_at: string | null
          approved_by: string | null
          bidding_ends_at: string | null
          cancellation_policy: Database["public"]["Enums"]["cancellation_policy"]
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          cc_and_r_attested_at: string | null
          check_in_date: string
          check_out_date: string
          cleaning_fee: number | null
          confirmation_proof_hash: string | null
          confirmation_proof_path: string | null
          confirmation_verified_at: string | null
          confirmation_verified_by: string | null
          created_at: string
          final_price: number
          id: string
          idle_alert_30d_sent_at: string | null
          idle_alert_60d_sent_at: string | null
          idle_alert_opt_out: boolean | null
          is_exclusive_deal: boolean | null
          last_edited_at: string | null
          last_edited_by: string | null
          min_bid_amount: number | null
          nightly_rate: number
          notes: string | null
          open_for_bidding: boolean
          owner_attestation_accepted_at: string | null
          owner_id: string
          owner_price: number
          previous_nightly_rate: number | null
          price_changed_at: string | null
          proof_rejected_reason: string | null
          proof_status: Database["public"]["Enums"]["listing_proof_status"]
          property_id: string
          rav_markup: number
          rejection_reason: string | null
          reserve_price: number | null
          resort_confirmation_number: string | null
          resort_fee: number | null
          source_type: Database["public"]["Enums"]["listing_source_type"]
          state: string | null
          status: Database["public"]["Enums"]["listing_status"]
          updated_at: string
        }
        Insert: {
          admin_edit_notes?: string | null
          admin_phone_verification_notes?: string | null
          allow_counter_offers?: boolean
          approved_at?: string | null
          approved_by?: string | null
          bidding_ends_at?: string | null
          cancellation_policy?: Database["public"]["Enums"]["cancellation_policy"]
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cc_and_r_attested_at?: string | null
          check_in_date: string
          check_out_date: string
          cleaning_fee?: number | null
          confirmation_proof_hash?: string | null
          confirmation_proof_path?: string | null
          confirmation_verified_at?: string | null
          confirmation_verified_by?: string | null
          created_at?: string
          final_price: number
          id?: string
          idle_alert_30d_sent_at?: string | null
          idle_alert_60d_sent_at?: string | null
          idle_alert_opt_out?: boolean | null
          is_exclusive_deal?: boolean | null
          last_edited_at?: string | null
          last_edited_by?: string | null
          min_bid_amount?: number | null
          nightly_rate?: number
          notes?: string | null
          open_for_bidding?: boolean
          owner_attestation_accepted_at?: string | null
          owner_id: string
          owner_price: number
          previous_nightly_rate?: number | null
          price_changed_at?: string | null
          proof_rejected_reason?: string | null
          proof_status?: Database["public"]["Enums"]["listing_proof_status"]
          property_id: string
          rav_markup?: number
          rejection_reason?: string | null
          reserve_price?: number | null
          resort_confirmation_number?: string | null
          resort_fee?: number | null
          source_type?: Database["public"]["Enums"]["listing_source_type"]
          state?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
        }
        Update: {
          admin_edit_notes?: string | null
          admin_phone_verification_notes?: string | null
          allow_counter_offers?: boolean
          approved_at?: string | null
          approved_by?: string | null
          bidding_ends_at?: string | null
          cancellation_policy?: Database["public"]["Enums"]["cancellation_policy"]
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cc_and_r_attested_at?: string | null
          check_in_date?: string
          check_out_date?: string
          cleaning_fee?: number | null
          confirmation_proof_hash?: string | null
          confirmation_proof_path?: string | null
          confirmation_verified_at?: string | null
          confirmation_verified_by?: string | null
          created_at?: string
          final_price?: number
          id?: string
          idle_alert_30d_sent_at?: string | null
          idle_alert_60d_sent_at?: string | null
          idle_alert_opt_out?: boolean | null
          is_exclusive_deal?: boolean | null
          last_edited_at?: string | null
          last_edited_by?: string | null
          min_bid_amount?: number | null
          nightly_rate?: number
          notes?: string | null
          open_for_bidding?: boolean
          owner_attestation_accepted_at?: string | null
          owner_id?: string
          owner_price?: number
          previous_nightly_rate?: number | null
          price_changed_at?: string | null
          proof_rejected_reason?: string | null
          proof_status?: Database["public"]["Enums"]["listing_proof_status"]
          property_id?: string
          rav_markup?: number
          rejection_reason?: string | null
          reserve_price?: number | null
          resort_confirmation_number?: string | null
          resort_fee?: number | null
          source_type?: Database["public"]["Enums"]["listing_source_type"]
          state?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_confirmation_verified_by_fkey"
            columns: ["confirmation_verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_last_edited_by_fkey"
            columns: ["last_edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      marketplace_registrations: {
        Row: {
          first_return_due: string | null
          last_return_filed: string | null
          next_return_due: string | null
          notes: string | null
          registered_date: string | null
          registration_id: string | null
          registration_status: string
          state: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          first_return_due?: string | null
          last_return_filed?: string | null
          next_return_due?: string | null
          notes?: string | null
          registered_date?: string | null
          registration_id?: string | null
          registration_status?: string
          state: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          first_return_due?: string | null
          last_return_filed?: string | null
          next_return_due?: string | null
          notes?: string | null
          registered_date?: string | null
          registration_id?: string | null
          registration_status?: string
          state?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
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
      notification_catalog: {
        Row: {
          active: boolean
          category: string
          channel_email_allowed: boolean
          channel_in_app_allowed: boolean
          channel_sms_allowed: boolean
          created_at: string
          default_email: boolean
          default_in_app: boolean
          default_sms: boolean
          description: string
          display_name: string
          id: string
          opt_out_level: string
          sort_order: number
          type_key: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          channel_email_allowed?: boolean
          channel_in_app_allowed?: boolean
          channel_sms_allowed?: boolean
          created_at?: string
          default_email?: boolean
          default_in_app?: boolean
          default_sms?: boolean
          description: string
          display_name: string
          id?: string
          opt_out_level: string
          sort_order?: number
          type_key: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          channel_email_allowed?: boolean
          channel_in_app_allowed?: boolean
          channel_sms_allowed?: boolean
          created_at?: string
          default_email?: boolean
          default_in_app?: boolean
          default_sms?: boolean
          description?: string
          display_name?: string
          id?: string
          opt_out_level?: string
          sort_order?: number
          type_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_delivery_log: {
        Row: {
          channel: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          instance_id: string | null
          message_body: string
          notification_id: string | null
          phone_e164: string | null
          recipient_email: string | null
          reminder_type: string | null
          resend_message_id: string | null
          sent_at: string | null
          status: string
          subject_or_title: string | null
          test_mode: boolean
          twilio_message_sid: string | null
          type_key: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          instance_id?: string | null
          message_body: string
          notification_id?: string | null
          phone_e164?: string | null
          recipient_email?: string | null
          reminder_type?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string
          subject_or_title?: string | null
          test_mode?: boolean
          twilio_message_sid?: string | null
          type_key: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          instance_id?: string | null
          message_body?: string
          notification_id?: string | null
          phone_e164?: string | null
          recipient_email?: string | null
          reminder_type?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string
          subject_or_title?: string | null
          test_mode?: boolean
          twilio_message_sid?: string | null
          type_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_delivery_log_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "event_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_delivery_log_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_delivery_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          account_manager_id: string | null
          admin_notes: Json | null
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
          is_active_duty_military: boolean | null
          is_anonymized: boolean
          is_seed_foundation: boolean | null
          maintenance_fee_updated_at: string | null
          onboarding_completed_at: string | null
          phone: string | null
          phone_e164: string | null
          phone_verified: boolean
          rejection_reason: string | null
          sms_opted_in: boolean
          sms_opted_in_at: string | null
          sms_opted_out_at: string | null
          stripe_account_id: string | null
          stripe_charges_enabled: boolean | null
          stripe_onboarding_complete: boolean | null
          stripe_payouts_enabled: boolean | null
          tax_address_line1: string | null
          tax_address_line2: string | null
          tax_business_name: string | null
          tax_city: string | null
          tax_id_last4: string | null
          tax_id_type: string | null
          tax_state: string | null
          tax_zip: string | null
          updated_at: string
          w9_submitted_at: string | null
        }
        Insert: {
          account_manager_id?: string | null
          admin_notes?: Json | null
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
          is_active_duty_military?: boolean | null
          is_anonymized?: boolean
          is_seed_foundation?: boolean | null
          maintenance_fee_updated_at?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          phone_e164?: string | null
          phone_verified?: boolean
          rejection_reason?: string | null
          sms_opted_in?: boolean
          sms_opted_in_at?: string | null
          sms_opted_out_at?: string | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_complete?: boolean | null
          stripe_payouts_enabled?: boolean | null
          tax_address_line1?: string | null
          tax_address_line2?: string | null
          tax_business_name?: string | null
          tax_city?: string | null
          tax_id_last4?: string | null
          tax_id_type?: string | null
          tax_state?: string | null
          tax_zip?: string | null
          updated_at?: string
          w9_submitted_at?: string | null
        }
        Update: {
          account_manager_id?: string | null
          admin_notes?: Json | null
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
          is_active_duty_military?: boolean | null
          is_anonymized?: boolean
          is_seed_foundation?: boolean | null
          maintenance_fee_updated_at?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          phone_e164?: string | null
          phone_verified?: boolean
          rejection_reason?: string | null
          sms_opted_in?: boolean
          sms_opted_in_at?: string | null
          sms_opted_out_at?: string | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_complete?: boolean | null
          stripe_payouts_enabled?: boolean | null
          tax_address_line1?: string | null
          tax_address_line2?: string | null
          tax_business_name?: string | null
          tax_city?: string | null
          tax_id_last4?: string | null
          tax_id_type?: string | null
          tax_state?: string | null
          tax_zip?: string | null
          updated_at?: string
          w9_submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_account_manager_id_fkey"
            columns: ["account_manager_id"]
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
          last_edited_at: string | null
          last_edited_by: string | null
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
          last_edited_at?: string | null
          last_edited_by?: string | null
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
          last_edited_at?: string | null
          last_edited_by?: string | null
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
            foreignKeyName: "properties_last_edited_by_fkey"
            columns: ["last_edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      rate_limit_entries: {
        Row: {
          created_at: string
          endpoint: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: never
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_limit_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
          reward_amount: number
          reward_type: string
          status: string
          updated_at: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
          reward_amount?: number
          reward_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string
          referrer_id?: string
          reward_amount?: number
          reward_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resort_external_ids: {
        Row: {
          created_at: string | null
          external_id: string
          id: string
          resort_id: string
          system_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          external_id: string
          id?: string
          resort_id: string
          system_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          external_id?: string
          id?: string
          resort_id?: string
          system_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resort_external_ids_resort_id_fkey"
            columns: ["resort_id"]
            isOneToOne: false
            referencedRelation: "resort_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resort_external_ids_resort_id_fkey"
            columns: ["resort_id"]
            isOneToOne: false
            referencedRelation: "resorts"
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
          min_stay_nights: number | null
          resort_id: string | null
          smoking_policy: string | null
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
          min_stay_nights?: number | null
          resort_id?: string | null
          smoking_policy?: string | null
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
          min_stay_nights?: number | null
          resort_id?: string | null
          smoking_policy?: string | null
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
          attraction_tags: string[] | null
          brand: Database["public"]["Enums"]["vacation_club_brand"]
          contact: Json | null
          created_at: string | null
          data_quality_score: number | null
          data_source: string | null
          description: string | null
          guest_rating: number | null
          id: string
          is_active: boolean
          latitude: number | null
          location: Json
          longitude: number | null
          main_image_url: string | null
          nearby_airports: string[] | null
          policies: Json | null
          postal_code: string | null
          resort_amenities: string[] | null
          resort_name: string
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          additional_images?: string[] | null
          attraction_tags?: string[] | null
          brand: Database["public"]["Enums"]["vacation_club_brand"]
          contact?: Json | null
          created_at?: string | null
          data_quality_score?: number | null
          data_source?: string | null
          description?: string | null
          guest_rating?: number | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          location: Json
          longitude?: number | null
          main_image_url?: string | null
          nearby_airports?: string[] | null
          policies?: Json | null
          postal_code?: string | null
          resort_amenities?: string[] | null
          resort_name: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          additional_images?: string[] | null
          attraction_tags?: string[] | null
          brand?: Database["public"]["Enums"]["vacation_club_brand"]
          contact?: Json | null
          created_at?: string | null
          data_quality_score?: number | null
          data_source?: string | null
          description?: string | null
          guest_rating?: number | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          location?: Json
          longitude?: number | null
          main_image_url?: string | null
          nearby_airports?: string[] | null
          policies?: Json | null
          postal_code?: string | null
          resort_amenities?: string[] | null
          resort_name?: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resorts_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          booking_id: string
          created_at: string
          flagged: boolean
          flagged_reason: string | null
          id: string
          is_published: boolean
          listing_id: string
          owner_id: string
          owner_responded_at: string | null
          owner_response: string | null
          property_id: string
          rating: number
          rating_accuracy: number | null
          rating_cleanliness: number | null
          rating_communication: number | null
          rating_location: number | null
          rating_value: number | null
          reviewer_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          booking_id: string
          created_at?: string
          flagged?: boolean
          flagged_reason?: string | null
          id?: string
          is_published?: boolean
          listing_id: string
          owner_id: string
          owner_responded_at?: string | null
          owner_response?: string | null
          property_id: string
          rating: number
          rating_accuracy?: number | null
          rating_cleanliness?: number | null
          rating_communication?: number | null
          rating_location?: number | null
          rating_value?: number | null
          reviewer_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          booking_id?: string
          created_at?: string
          flagged?: boolean
          flagged_reason?: string | null
          id?: string
          is_published?: boolean
          listing_id?: string
          owner_id?: string
          owner_responded_at?: string | null
          owner_response?: string | null
          property_id?: string
          rating?: number
          rating_accuracy?: number | null
          rating_cleanliness?: number | null
          rating_communication?: number | null
          rating_location?: number | null
          rating_value?: number | null
          reviewer_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      saved_searches: {
        Row: {
          created_at: string | null
          criteria: Json
          id: string
          last_notified_at: string | null
          name: string | null
          notify_email: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          criteria: Json
          id?: string
          last_notified_at?: string | null
          name?: string | null
          notify_email?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          criteria?: Json
          id?: string
          last_notified_at?: string | null
          name?: string | null
          notify_email?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seasonal_events: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["event_category"]
          created_at: string
          icon: string | null
          id: string
          is_location_fixed: boolean
          is_nationwide: boolean
          name: string
          notes: string | null
          recurrence_type: Database["public"]["Enums"]["recurrence_type"]
          search_destinations: string[]
          slug: string | null
          sms_template_12wk: string | null
          sms_template_2wk: string | null
          sms_template_6wk: string | null
          typical_month: number | null
          typical_week: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: Database["public"]["Enums"]["event_category"]
          created_at?: string
          icon?: string | null
          id?: string
          is_location_fixed?: boolean
          is_nationwide?: boolean
          name: string
          notes?: string | null
          recurrence_type: Database["public"]["Enums"]["recurrence_type"]
          search_destinations?: string[]
          slug?: string | null
          sms_template_12wk?: string | null
          sms_template_2wk?: string | null
          sms_template_6wk?: string | null
          typical_month?: number | null
          typical_week?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["event_category"]
          created_at?: string
          icon?: string | null
          id?: string
          is_location_fixed?: boolean
          is_nationwide?: boolean
          name?: string
          notes?: string | null
          recurrence_type?: Database["public"]["Enums"]["recurrence_type"]
          search_destinations?: string[]
          slug?: string | null
          sms_template_12wk?: string | null
          sms_template_2wk?: string | null
          sms_template_6wk?: string | null
          typical_month?: number | null
          typical_week?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      sla_targets: {
        Row: {
          business_hours_only: boolean
          category: Database["public"]["Enums"]["dispute_category"]
          description: string | null
          first_response_minutes: number
          resolution_minutes: number
          triage_minutes: number
          updated_at: string
        }
        Insert: {
          business_hours_only?: boolean
          category: Database["public"]["Enums"]["dispute_category"]
          description?: string | null
          first_response_minutes: number
          resolution_minutes: number
          triage_minutes: number
          updated_at?: string
        }
        Update: {
          business_hours_only?: boolean
          category?: Database["public"]["Enums"]["dispute_category"]
          description?: string | null
          first_response_minutes?: number
          resolution_minutes?: number
          triage_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      sms_suppression_log: {
        Row: {
          created_at: string
          id: string
          instance_id: string | null
          owner_id: string
          suppression_reason: string
        }
        Insert: {
          created_at?: string
          id?: string
          instance_id?: string | null
          owner_id: string
          suppression_reason: string
        }
        Update: {
          created_at?: string
          id?: string
          instance_id?: string | null
          owner_id?: string
          suppression_reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_suppression_log_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "event_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_suppression_log_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_conversations: {
        Row: {
          assistant_message_count: number
          classifier_context_detected:
            | Database["public"]["Enums"]["support_chat_context"]
            | null
          classifier_context_used: Database["public"]["Enums"]["support_chat_context"]
          classifier_dismissed: boolean
          created_at: string
          ended_at: string | null
          escalated_at: string | null
          escalated_to_dispute_id: string | null
          id: string
          last_turn_at: string
          rating_submitted_at: string | null
          route_context: Database["public"]["Enums"]["support_chat_context"]
          started_at: string
          tool_call_count: number
          updated_at: string
          user_id: string
          user_message_count: number
          user_rating: number | null
        }
        Insert: {
          assistant_message_count?: number
          classifier_context_detected?:
            | Database["public"]["Enums"]["support_chat_context"]
            | null
          classifier_context_used: Database["public"]["Enums"]["support_chat_context"]
          classifier_dismissed?: boolean
          created_at?: string
          ended_at?: string | null
          escalated_at?: string | null
          escalated_to_dispute_id?: string | null
          id?: string
          last_turn_at?: string
          rating_submitted_at?: string | null
          route_context: Database["public"]["Enums"]["support_chat_context"]
          started_at?: string
          tool_call_count?: number
          updated_at?: string
          user_id: string
          user_message_count?: number
          user_rating?: number | null
        }
        Update: {
          assistant_message_count?: number
          classifier_context_detected?:
            | Database["public"]["Enums"]["support_chat_context"]
            | null
          classifier_context_used?: Database["public"]["Enums"]["support_chat_context"]
          classifier_dismissed?: boolean
          created_at?: string
          ended_at?: string | null
          escalated_at?: string | null
          escalated_to_dispute_id?: string | null
          id?: string
          last_turn_at?: string
          rating_submitted_at?: string | null
          route_context?: Database["public"]["Enums"]["support_chat_context"]
          started_at?: string
          tool_call_count?: number
          updated_at?: string
          user_id?: string
          user_message_count?: number
          user_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "support_conversations_escalated_to_dispute_id_fkey"
            columns: ["escalated_to_dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_docs: {
        Row: {
          audience: string[]
          body: string | null
          created_at: string
          doc_type: Database["public"]["Enums"]["support_doc_type"]
          frontmatter: Json
          id: string
          legal_review_required: boolean
          reviewed_by: string | null
          reviewed_date: string | null
          search_tsv: unknown
          sections: Json
          slug: string
          source_path: string
          source_sha: string | null
          status: Database["public"]["Enums"]["support_doc_status"]
          tags: string[]
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          audience?: string[]
          body?: string | null
          created_at?: string
          doc_type: Database["public"]["Enums"]["support_doc_type"]
          frontmatter?: Json
          id?: string
          legal_review_required?: boolean
          reviewed_by?: string | null
          reviewed_date?: string | null
          search_tsv?: unknown
          sections?: Json
          slug: string
          source_path: string
          source_sha?: string | null
          status?: Database["public"]["Enums"]["support_doc_status"]
          tags?: string[]
          title: string
          updated_at?: string
          version?: string
        }
        Update: {
          audience?: string[]
          body?: string | null
          created_at?: string
          doc_type?: Database["public"]["Enums"]["support_doc_type"]
          frontmatter?: Json
          id?: string
          legal_review_required?: boolean
          reviewed_by?: string | null
          reviewed_date?: string | null
          search_tsv?: unknown
          sections?: Json
          slug?: string
          source_path?: string
          source_sha?: string | null
          status?: Database["public"]["Enums"]["support_doc_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          model: string | null
          tokens_used: number | null
          tool_args: Json | null
          tool_name: string | null
          tool_result_json: Json | null
          turn_index: number
          turn_type: Database["public"]["Enums"]["support_turn_type"]
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          model?: string | null
          tokens_used?: number | null
          tool_args?: Json | null
          tool_name?: string | null
          tool_result_json?: Json | null
          turn_index: number
          turn_type: Database["public"]["Enums"]["support_turn_type"]
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          model?: string | null
          tokens_used?: number | null
          tool_args?: Json | null
          tool_name?: string | null
          tool_result_json?: Json | null
          turn_index?: number
          turn_type?: Database["public"]["Enums"]["support_turn_type"]
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
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
      terms_acceptance_log: {
        Row: {
          acceptance_method: string
          accepted_at: string
          age_verified: boolean
          created_at: string
          id: string
          ip_address: unknown
          privacy_accepted: boolean
          privacy_version: string
          terms_accepted: boolean
          terms_version: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          acceptance_method: string
          accepted_at?: string
          age_verified?: boolean
          created_at?: string
          id?: string
          ip_address?: unknown
          privacy_accepted?: boolean
          privacy_version: string
          terms_accepted?: boolean
          terms_version: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          acceptance_method?: string
          accepted_at?: string
          age_verified?: boolean
          created_at?: string
          id?: string
          ip_address?: unknown
          privacy_accepted?: boolean
          privacy_version?: string
          terms_accepted?: boolean
          terms_version?: string
          user_agent?: string | null
          user_id?: string
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
          conversation_id: string | null
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
          conversation_id?: string | null
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
          conversation_id?: string | null
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
            foreignKeyName: "travel_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
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
          admin_override: boolean | null
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
          admin_override?: boolean | null
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
          admin_override?: boolean | null
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
      user_notification_preferences: {
        Row: {
          channel: string
          enabled: boolean
          id: string
          type_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          enabled: boolean
          id?: string
          type_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          enabled?: boolean
          id?: string
          type_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      calculate_resort_data_quality: {
        Args: { p_resort_id: string }
        Returns: number
      }
      can_access_platform: { Args: { _user_id: string }; Returns: boolean }
      can_owner_create_listing: {
        Args: { _listing_value: number; _owner_id: string }
        Returns: boolean
      }
      can_resolve_dispute: {
        Args: {
          p_category: Database["public"]["Enums"]["dispute_category"]
          p_user_id: string
        }
        Returns: boolean
      }
      can_use_voice_search: { Args: { _user_id: string }; Returns: boolean }
      check_listing_limit: { Args: { _owner_id: string }; Returns: boolean }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_max_requests: number
          p_user_id: string
          p_window_seconds?: number
        }
        Returns: boolean
      }
      cleanup_old_voice_usage: { Args: never; Returns: number }
      extend_owner_confirmation_deadline: {
        Args: { p_booking_confirmation_id: string; p_owner_id: string }
        Returns: Json
      }
      generate_event_instances_for_year: {
        Args: { p_source_year?: number; p_year: number }
        Returns: {
          confirmed_count: number
          created_count: number
          skipped_count: number
          unconfirmed_count: number
        }[]
      }
      get_api_key_stats: {
        Args: { p_days?: number; p_key_id: string }
        Returns: {
          avg_response_time_ms: number
          day: string
          endpoint: string
          error_count: number
          request_count: number
        }[]
      }
      get_bid_count: { Args: { _listing_id: string }; Returns: number }
      get_conversation_thread: {
        Args: { p_conversation_id: string }
        Returns: {
          body: string
          created_at: string
          event_data: Json
          event_type: string
          id: string
          item_type: string
          read_at: string
          sender_id: string
        }[]
      }
      get_curated_events: {
        Args: { p_year?: number }
        Returns: {
          category: Database["public"]["Enums"]["event_category"]
          end_date: string
          icon: string
          id: string
          is_nationwide: boolean
          name: string
          recurrence_type: Database["public"]["Enums"]["recurrence_type"]
          search_destinations: string[]
          slug: string
          start_date: string
          year: number
        }[]
      }
      get_dynamic_pricing_data: {
        Args: {
          p_bedrooms: number
          p_brand: string
          p_check_in_date: string
          p_location: string
        }
        Returns: Json
      }
      get_highest_bid: { Args: { _listing_id: string }; Returns: number }
      get_notification_center_stats: { Args: never; Returns: Json }
      get_notification_preference: {
        Args: { p_channel: string; p_type_key: string; p_user_id: string }
        Returns: boolean
      }
      get_or_create_conversation: {
        Args: {
          p_context_id?: string
          p_context_type?: string
          p_listing_id?: string
          p_owner_id: string
          p_property_id: string
          p_traveler_id: string
        }
        Returns: string
      }
      get_or_create_referral_code: { Args: never; Returns: string }
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
      get_owner_portfolio_summary: {
        Args: { p_owner_id: string }
        Returns: {
          active_listing_count: number
          avg_nightly_rate: number
          brand: string
          listing_count: number
          location: string
          property_id: string
          resort_name: string
          total_bookings: number
          total_revenue: number
        }[]
      }
      get_owner_profile_summary: { Args: { _owner_id: string }; Returns: Json }
      get_owner_trust_level: {
        Args: { _owner_id: string }
        Returns: Database["public"]["Enums"]["owner_trust_level"]
      }
      get_platform_commission_rate: { Args: never; Returns: Json }
      get_property_review_summary: {
        Args: { p_property_id: string }
        Returns: {
          avg_accuracy: number
          avg_cleanliness: number
          avg_communication: number
          avg_location: number
          avg_rating: number
          avg_value: number
          review_count: number
        }[]
      }
      get_proposal_count: { Args: { _request_id: string }; Returns: number }
      get_referral_stats: { Args: never; Returns: Json }
      get_subscription_metrics: { Args: never; Returns: Json }
      get_support_metrics: {
        Args: { date_from: string; date_to: string }
        Returns: {
          deflected_count: number
          deflection_pct: number
          ended_conversations: number
          escalated_count: number
          escalation_pct: number
          median_response_ms: number
          negative_rating_count: number
          positive_rating_count: number
          rated_count: number
          total_conversations: number
        }[]
      }
      get_tier_by_stripe_price: {
        Args: { _stripe_price_id: string }
        Returns: {
          commission_discount_pct: number
          id: string
          max_active_listings: number
          monthly_price_cents: number
          role_category: string
          tier_key: string
          tier_level: number
          tier_name: string
          voice_quota_daily: number
        }[]
      }
      get_unread_message_counts: {
        Args: { p_user_id: string }
        Returns: {
          booking_id: string
          unread_count: number
        }[]
      }
      get_upcoming_reminders: {
        Args: { p_days_ahead?: number }
        Returns: {
          destination: Database["public"]["Enums"]["destination_bucket"]
          event_date: string
          event_name: string
          instance_id: string
          priority: string
          reminder_date: string
          reminder_type: string
        }[]
      }
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
      increment_api_key_usage: { Args: { p_key_id: string }; Returns: boolean }
      increment_voice_search_count: {
        Args: { _user_id: string }
        Returns: undefined
      }
      insert_conversation_event: {
        Args: {
          p_conversation_id: string
          p_event_data?: Json
          p_event_type: string
        }
        Returns: string
      }
      is_property_owner: { Args: { _user_id: string }; Returns: boolean }
      is_rav_team: { Args: { _user_id: string }; Returns: boolean }
      is_wish_matched_booking: {
        Args: { p_booking_id: string }
        Returns: boolean
      }
      list_api_keys: {
        Args: never
        Returns: {
          allowed_ips: string[]
          created_at: string
          daily_limit: number
          daily_usage: number
          expires_at: string
          id: string
          is_active: boolean
          key_prefix: string
          last_used_at: string
          name: string
          owner_email: string
          owner_user_id: string
          per_minute_limit: number
          revoked_at: string
          scopes: string[]
          tier: string
        }[]
      }
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
      mark_conversation_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      owns_listing: {
        Args: { _listing_id: string; _user_id: string }
        Returns: boolean
      }
      owns_travel_request: {
        Args: { _request_id: string; _user_id: string }
        Returns: boolean
      }
      record_referral: {
        Args: { p_new_user_id: string; p_referral_code: string }
        Returns: undefined
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
      session63_supabase_url: { Args: never; Returns: string }
      update_owner_trust_level: {
        Args: { _owner_id: string }
        Returns: Database["public"]["Enums"]["owner_trust_level"]
      }
      validate_api_key: {
        Args: { p_key_hash: string }
        Returns: {
          allowed_ips: string[]
          daily_limit: number
          daily_usage: number
          daily_usage_reset_at: string
          key_id: string
          name: string
          owner_user_id: string
          per_minute_limit: number
          scopes: string[]
          tier: string
        }[]
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
      checkin_confirmation_source: "renter" | "auto" | "rav_admin"
      destination_bucket:
        | "orlando"
        | "miami"
        | "las_vegas"
        | "maui_hawaii"
        | "myrtle_beach"
        | "colorado"
        | "new_york"
        | "nashville"
      dispute_category:
        | "property_not_as_described"
        | "access_issues"
        | "safety_concerns"
        | "cleanliness"
        | "cancellation_dispute"
        | "payment_dispute"
        | "owner_no_show"
        | "other"
        | "renter_damage"
        | "renter_no_show"
        | "unauthorized_guests"
        | "rule_violation"
        | "late_checkout"
      dispute_priority: "low" | "medium" | "high" | "critical"
      dispute_source: "user_filed" | "ravio_support"
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
      event_category:
        | "major_holidays"
        | "school_breaks"
        | "sports_events"
        | "local_events"
        | "weather_peak_season"
      listing_proof_status:
        | "not_required"
        | "required"
        | "submitted"
        | "verified"
        | "rejected"
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
      recurrence_type: "annual_fixed" | "annual_floating" | "one_time"
      support_chat_context:
        | "rentals"
        | "property-detail"
        | "bidding"
        | "support"
        | "general"
      support_doc_status: "active" | "draft" | "archived"
      support_doc_type: "policy" | "faq" | "process" | "guide"
      support_turn_type:
        | "user"
        | "assistant"
        | "tool_call"
        | "tool_result"
        | "error"
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      agreement_status: ["pending", "active", "suspended", "terminated"],
      app_role: [
        "rav_owner",
        "rav_admin",
        "rav_staff",
        "property_owner",
        "renter",
      ],
      bid_status: ["pending", "accepted", "rejected", "expired", "withdrawn"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      budget_preference: ["range", "ceiling", "undisclosed"],
      cancellation_policy: ["flexible", "moderate", "strict", "super_strict"],
      cancellation_status: [
        "pending",
        "approved",
        "denied",
        "counter_offer",
        "completed",
      ],
      checkin_confirmation_source: ["renter", "auto", "rav_admin"],
      destination_bucket: [
        "orlando",
        "miami",
        "las_vegas",
        "maui_hawaii",
        "myrtle_beach",
        "colorado",
        "new_york",
        "nashville",
      ],
      dispute_category: [
        "property_not_as_described",
        "access_issues",
        "safety_concerns",
        "cleanliness",
        "cancellation_dispute",
        "payment_dispute",
        "owner_no_show",
        "other",
        "renter_damage",
        "renter_no_show",
        "unauthorized_guests",
        "rule_violation",
        "late_checkout",
      ],
      dispute_priority: ["low", "medium", "high", "critical"],
      dispute_source: ["user_filed", "ravio_support"],
      dispute_status: [
        "open",
        "investigating",
        "awaiting_response",
        "resolved_full_refund",
        "resolved_partial_refund",
        "resolved_no_refund",
        "closed",
      ],
      escrow_status: [
        "pending_confirmation",
        "confirmation_submitted",
        "verified",
        "released",
        "refunded",
        "disputed",
      ],
      event_category: [
        "major_holidays",
        "school_breaks",
        "sports_events",
        "local_events",
        "weather_peak_season",
      ],
      listing_proof_status: [
        "not_required",
        "required",
        "submitted",
        "verified",
        "rejected",
      ],
      listing_source_type: ["pre_booked", "wish_matched"],
      listing_status: [
        "draft",
        "pending_approval",
        "active",
        "booked",
        "completed",
        "cancelled",
      ],
      notification_type: [
        "new_bid_received",
        "bid_accepted",
        "bid_rejected",
        "bid_expired",
        "bidding_ending_soon",
        "new_travel_request_match",
        "new_proposal_received",
        "proposal_accepted",
        "proposal_rejected",
        "request_expiring_soon",
        "booking_confirmed",
        "payment_received",
        "message_received",
        "travel_request_expiring_soon",
        "travel_request_matched",
      ],
      owner_trust_level: ["new", "verified", "trusted", "premium"],
      payout_status: ["pending", "processing", "paid", "failed"],
      proposal_status: [
        "pending",
        "accepted",
        "rejected",
        "expired",
        "withdrawn",
      ],
      recurrence_type: ["annual_fixed", "annual_floating", "one_time"],
      support_chat_context: [
        "rentals",
        "property-detail",
        "bidding",
        "support",
        "general",
      ],
      support_doc_status: ["active", "draft", "archived"],
      support_doc_type: ["policy", "faq", "process", "guide"],
      support_turn_type: [
        "user",
        "assistant",
        "tool_call",
        "tool_result",
        "error",
      ],
      travel_request_status: [
        "open",
        "closed",
        "fulfilled",
        "expired",
        "cancelled",
      ],
      vacation_club_brand: [
        "hilton_grand_vacations",
        "marriott_vacation_club",
        "disney_vacation_club",
        "wyndham_destinations",
        "hyatt_residence_club",
        "bluegreen_vacations",
        "holiday_inn_club",
        "worldmark",
        "other",
      ],
      verification_doc_type: [
        "timeshare_deed",
        "membership_certificate",
        "resort_contract",
        "points_statement",
        "government_id",
        "utility_bill",
        "other",
      ],
      verification_status: [
        "pending",
        "under_review",
        "approved",
        "rejected",
        "expired",
      ],
    },
  },
} as const
