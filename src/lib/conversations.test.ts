// @vitest-environment jsdom
// @p0
import { describe, it, expect } from 'vitest';
import {
  getContextBadge,
  formatConversationEvent,
  getConversationTitle,
  isValidContextType,
  isValidEventType,
} from './conversations';

describe('conversations utilities', () => {
  // ---- Type validation ----

  describe('isValidContextType', () => {
    it('accepts all valid context types', () => {
      expect(isValidContextType('inquiry')).toBe(true);
      expect(isValidContextType('booking')).toBe(true);
      expect(isValidContextType('bid')).toBe(true);
      expect(isValidContextType('travel_request')).toBe(true);
    });

    it('rejects invalid context types', () => {
      expect(isValidContextType('unknown')).toBe(false);
      expect(isValidContextType('')).toBe(false);
      expect(isValidContextType('message')).toBe(false);
    });
  });

  describe('isValidEventType', () => {
    it('accepts all valid event types', () => {
      expect(isValidEventType('inquiry_started')).toBe(true);
      expect(isValidEventType('booking_confirmed')).toBe(true);
      expect(isValidEventType('bid_placed')).toBe(true);
      expect(isValidEventType('bid_countered')).toBe(true);
      expect(isValidEventType('proposal_sent')).toBe(true);
      expect(isValidEventType('review_left')).toBe(true);
    });

    it('rejects invalid event types', () => {
      expect(isValidEventType('unknown')).toBe(false);
      expect(isValidEventType('booking_started')).toBe(false);
    });
  });

  // ---- Context badge ----

  describe('getContextBadge', () => {
    it('returns correct badge for each context type', () => {
      expect(getContextBadge('inquiry')).toEqual({ label: 'Inquiry', variant: 'secondary' });
      expect(getContextBadge('booking')).toEqual({ label: 'Booking', variant: 'default' });
      expect(getContextBadge('bid')).toEqual({ label: 'Bid', variant: 'outline' });
      expect(getContextBadge('travel_request')).toEqual({ label: 'Request', variant: 'secondary' });
    });

    it('returns fallback for unknown context type', () => {
      const badge = getContextBadge('unknown_type');
      expect(badge.label).toBe('unknown_type');
      expect(badge.variant).toBe('outline');
    });
  });

  // ---- Event formatting ----

  describe('formatConversationEvent', () => {
    it('formats bid_placed with amount and dates', () => {
      const result = formatConversationEvent('bid_placed', {
        amount: 890,
        check_in: '2026-06-01',
        check_out: '2026-06-08',
      });
      expect(result).toBe('Bid of $890 placed for 2026-06-01 – 2026-06-08');
    });

    it('formats booking_confirmed with total', () => {
      const result = formatConversationEvent('booking_confirmed', {
        booking_id: 'abc',
        total: 1850,
        check_in: '2026-06-01',
      });
      expect(result).toBe('Booking confirmed · $1850 on 2026-06-01');
    });

    it('formats bid_countered with counter and original', () => {
      const result = formatConversationEvent('bid_countered', {
        original: 890,
        counter: 950,
      });
      expect(result).toBe('Counter-offer: $950 (original: $890)');
    });

    it('formats simple events without data', () => {
      expect(formatConversationEvent('inquiry_started')).toBe('Inquiry started');
      expect(formatConversationEvent('booking_cancelled')).toBe('Booking cancelled');
      expect(formatConversationEvent('proposal_sent')).toBe('Proposal sent');
      expect(formatConversationEvent('review_left')).toBe('Review posted');
    });

    it('handles unknown event types gracefully', () => {
      expect(formatConversationEvent('some_custom_event')).toBe('some custom event');
    });
  });

  // ---- Conversation title ----

  describe('getConversationTitle', () => {
    it('returns label with property name', () => {
      expect(getConversationTitle('booking', 'Tuscany Village')).toBe('Booking · Tuscany Village');
      expect(getConversationTitle('inquiry', 'MarBrisa Resort')).toBe('Inquiry · MarBrisa Resort');
    });

    it('returns just the label without property name', () => {
      expect(getConversationTitle('bid')).toBe('Bid');
      expect(getConversationTitle('travel_request')).toBe('Request');
    });
  });
});
