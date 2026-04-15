// @vitest-environment jsdom
// @p0
/**
 * Integration tests for the unified conversation layer.
 * Validates end-to-end patterns across types, hooks, and utilities.
 * GitHub Issue: #306 (Story J)
 */

import { describe, it, expect } from 'vitest';
import {
  getContextBadge,
  formatConversationEvent,
  getConversationTitle,
  getOtherParticipant,
  isValidContextType,
  isValidEventType,
  type ConversationContextType,
  type ConversationEventType,
} from './conversations';

describe('conversation layer integration', () => {
  describe('context → event type mapping', () => {
    const contextToEvents: Record<ConversationContextType, ConversationEventType[]> = {
      inquiry: ['inquiry_started'],
      booking: ['booking_requested', 'booking_confirmed', 'booking_cancelled'],
      bid: ['bid_placed', 'bid_countered', 'bid_accepted', 'bid_rejected', 'bid_expired'],
      travel_request: ['proposal_sent', 'proposal_accepted', 'proposal_rejected'],
    };

    it('every context type has at least one valid event type', () => {
      for (const [context, events] of Object.entries(contextToEvents)) {
        expect(isValidContextType(context)).toBe(true);
        for (const event of events) {
          expect(isValidEventType(event)).toBe(true);
        }
      }
    });

    it('every event type produces non-empty formatted text', () => {
      const allEvents: ConversationEventType[] = [
        'inquiry_started', 'booking_requested', 'booking_confirmed', 'booking_cancelled',
        'bid_placed', 'bid_countered', 'bid_accepted', 'bid_rejected', 'bid_expired',
        'proposal_sent', 'proposal_accepted', 'proposal_rejected',
        'check_in_confirmed', 'review_left',
      ];
      for (const eventType of allEvents) {
        const text = formatConversationEvent(eventType);
        expect(text.length).toBeGreaterThan(0);
        expect(text).not.toContain('_'); // Should be human-readable
      }
    });
  });

  describe('inbox display helpers', () => {
    it('every context type has a badge with a label', () => {
      const types: ConversationContextType[] = ['inquiry', 'booking', 'bid', 'travel_request'];
      for (const type of types) {
        const badge = getContextBadge(type);
        expect(badge.label.length).toBeGreaterThan(0);
        expect(['default', 'secondary', 'outline', 'destructive']).toContain(badge.variant);
      }
    });

    it('conversation title includes property name when provided', () => {
      const title = getConversationTitle('booking', 'Hilton Grand Islander');
      expect(title).toContain('Booking');
      expect(title).toContain('Hilton Grand Islander');
    });

    it('conversation title works without property name', () => {
      const title = getConversationTitle('bid');
      expect(title).toBe('Offer');
    });
  });

  describe('participant resolution', () => {
    const conv = {
      owner_id: 'owner-abc',
      traveler_id: 'traveler-xyz',
      owner: { id: 'owner-abc', full_name: 'Owner Name' },
      traveler: { id: 'traveler-xyz', full_name: 'Traveler Name' },
    };

    it('resolves correctly for both participants', () => {
      expect(getOtherParticipant(conv, 'owner-abc').id).toBe('traveler-xyz');
      expect(getOtherParticipant(conv, 'traveler-xyz').id).toBe('owner-abc');
    });

    it('never returns the current user as the other participant', () => {
      const other1 = getOtherParticipant(conv, 'owner-abc');
      expect(other1.id).not.toBe('owner-abc');
      const other2 = getOtherParticipant(conv, 'traveler-xyz');
      expect(other2.id).not.toBe('traveler-xyz');
    });
  });
});
