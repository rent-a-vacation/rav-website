// Unified Conversation Layer — utility functions and types
// Session 1: Types + basic utilities
// Session 2: Full hook support utilities

import type { Database } from '@/types/database';

// ============================================================
// Type aliases
// ============================================================

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type ConversationMessage = Database['public']['Tables']['conversation_messages']['Row'];
export type ConversationMessageInsert = Database['public']['Tables']['conversation_messages']['Insert'];
export type ConversationEvent = Database['public']['Tables']['conversation_events']['Row'];

export type ConversationContextType = 'inquiry' | 'booking' | 'bid' | 'travel_request';

export type ConversationEventType =
  | 'inquiry_started'
  | 'booking_requested'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'bid_placed'
  | 'bid_countered'
  | 'bid_accepted'
  | 'bid_rejected'
  | 'bid_expired'
  | 'proposal_sent'
  | 'proposal_accepted'
  | 'proposal_rejected'
  | 'check_in_confirmed'
  | 'review_left';

export type ConversationStatus = 'active' | 'archived' | 'closed';

// Thread item = message or event interleaved by timestamp
export interface ThreadItem {
  id: string;
  item_type: 'message' | 'event';
  sender_id: string | null;
  body: string | null;
  event_type: string | null;
  event_data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

// ============================================================
// Context badge — label + color for inbox display
// ============================================================

export interface ContextBadge {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
}

const CONTEXT_BADGES: Record<ConversationContextType, ContextBadge> = {
  inquiry: { label: 'Inquiry', variant: 'secondary' },
  booking: { label: 'Booking', variant: 'default' },
  bid: { label: 'Bid', variant: 'outline' },
  travel_request: { label: 'Request', variant: 'secondary' },
};

export function getContextBadge(contextType: string): ContextBadge {
  return CONTEXT_BADGES[contextType as ConversationContextType] ?? { label: contextType, variant: 'outline' as const };
}

// ============================================================
// Event formatting — human-readable event text
// ============================================================

export function formatConversationEvent(eventType: string, eventData: Record<string, unknown> = {}): string {
  const amount = eventData.amount != null ? `$${eventData.amount}` : '';
  const checkIn = eventData.check_in ? String(eventData.check_in) : '';
  const checkOut = eventData.check_out ? String(eventData.check_out) : '';
  const dateRange = checkIn && checkOut ? ` for ${checkIn} – ${checkOut}` : checkIn ? ` on ${checkIn}` : '';
  const total = eventData.total != null ? `$${eventData.total}` : '';
  const counter = eventData.counter != null ? `$${eventData.counter}` : '';
  const original = eventData.original != null ? `$${eventData.original}` : amount;

  switch (eventType) {
    case 'inquiry_started':
      return 'Inquiry started';
    case 'booking_requested':
      return `Booking requested${total ? ` · ${total}` : ''}${dateRange}`;
    case 'booking_confirmed':
      return `Booking confirmed${total ? ` · ${total}` : ''}${dateRange}`;
    case 'booking_cancelled':
      return 'Booking cancelled';
    case 'bid_placed':
      return `Bid of ${amount} placed${dateRange}`;
    case 'bid_countered':
      return `Counter-offer: ${counter} (original: ${original})`;
    case 'bid_accepted':
      return `Bid accepted${amount ? ` · ${amount}` : ''}`;
    case 'bid_rejected':
      return 'Bid rejected';
    case 'bid_expired':
      return 'Bid expired';
    case 'proposal_sent':
      return 'Proposal sent';
    case 'proposal_accepted':
      return 'Proposal accepted';
    case 'proposal_rejected':
      return 'Proposal rejected';
    case 'check_in_confirmed':
      return 'Check-in confirmed';
    case 'review_left':
      return 'Review posted';
    default:
      return eventType.replace(/_/g, ' ');
  }
}

// ============================================================
// Conversation title — display name based on context
// ============================================================

export function getConversationTitle(contextType: string, propertyName?: string): string {
  const badge = getContextBadge(contextType);
  return propertyName ? `${badge.label} · ${propertyName}` : badge.label;
}

// ============================================================
// Valid type guards
// ============================================================

const VALID_CONTEXT_TYPES: ConversationContextType[] = ['inquiry', 'booking', 'bid', 'travel_request'];
const VALID_EVENT_TYPES: ConversationEventType[] = [
  'inquiry_started', 'booking_requested', 'booking_confirmed', 'booking_cancelled',
  'bid_placed', 'bid_countered', 'bid_accepted', 'bid_rejected', 'bid_expired',
  'proposal_sent', 'proposal_accepted', 'proposal_rejected',
  'check_in_confirmed', 'review_left',
];

export function isValidContextType(type: string): type is ConversationContextType {
  return VALID_CONTEXT_TYPES.includes(type as ConversationContextType);
}

export function isValidEventType(type: string): type is ConversationEventType {
  return VALID_EVENT_TYPES.includes(type as ConversationEventType);
}
