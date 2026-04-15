// @vitest-environment jsdom
// @p0
/**
 * Tests for useConversations hook utilities and query key factory.
 * GitHub Issue: #298
 */

import { describe, it, expect } from 'vitest';
import { conversationKeys } from './useConversations';
import {
  getContextBadge,
  formatConversationEvent,
  getConversationTitle,
  getOtherParticipant,
  isValidContextType,
  isValidEventType,
} from '@/lib/conversations';

// ============================================================
// Query key factory
// ============================================================

describe('conversationKeys', () => {
  it('generates list keys with user ID and status', () => {
    expect(conversationKeys.list('user-1', 'active')).toEqual([
      'conversations', 'list', 'user-1', 'active',
    ]);
  });

  it('generates list keys without status', () => {
    expect(conversationKeys.list('user-1')).toEqual([
      'conversations', 'list', 'user-1', undefined,
    ]);
  });

  it('generates detail key', () => {
    expect(conversationKeys.detail('conv-abc')).toEqual([
      'conversations', 'detail', 'conv-abc',
    ]);
  });

  it('generates thread key', () => {
    expect(conversationKeys.thread('conv-abc')).toEqual([
      'conversations', 'thread', 'conv-abc',
    ]);
  });

  it('generates unread count key', () => {
    expect(conversationKeys.unreadCount('user-1')).toEqual([
      'conversations', 'unread-count', 'user-1',
    ]);
  });

  it('all keys share the same root for partial invalidation', () => {
    const all = conversationKeys.all;
    expect(conversationKeys.list('u', 'active').slice(0, 1)).toEqual(all);
    expect(conversationKeys.detail('d').slice(0, 1)).toEqual(all);
    expect(conversationKeys.thread('t').slice(0, 1)).toEqual(all);
    expect(conversationKeys.unreadCount('u').slice(0, 1)).toEqual(all);
  });
});

// ============================================================
// getOtherParticipant
// ============================================================

describe('getOtherParticipant', () => {
  const conversation = {
    owner_id: 'owner-1',
    traveler_id: 'traveler-1',
    owner: { id: 'owner-1', full_name: 'Alice Owner', avatar_url: '/alice.jpg' },
    traveler: { id: 'traveler-1', full_name: 'Bob Traveler', avatar_url: '/bob.jpg' },
  };

  it('returns traveler when current user is owner', () => {
    const other = getOtherParticipant(conversation, 'owner-1');
    expect(other.id).toBe('traveler-1');
    expect(other.full_name).toBe('Bob Traveler');
  });

  it('returns owner when current user is traveler', () => {
    const other = getOtherParticipant(conversation, 'traveler-1');
    expect(other.id).toBe('owner-1');
    expect(other.full_name).toBe('Alice Owner');
  });

  it('falls back to ID-only when join data is missing', () => {
    const minimal = { owner_id: 'o-1', traveler_id: 't-1' };
    const other = getOtherParticipant(minimal, 'o-1');
    expect(other.id).toBe('t-1');
    expect(other.full_name).toBeUndefined();
  });
});

// ============================================================
// Utility functions (extended from Session 1)
// ============================================================

describe('getContextBadge', () => {
  it('returns correct variant for booking', () => {
    expect(getContextBadge('booking').variant).toBe('default');
  });

  it('returns correct variant for bid', () => {
    expect(getContextBadge('bid').variant).toBe('outline');
  });
});

describe('formatConversationEvent', () => {
  it('formats bid_accepted with amount', () => {
    expect(formatConversationEvent('bid_accepted', { amount: 950 }))
      .toBe('Offer accepted · $950');
  });

  it('formats booking_requested with total and date range', () => {
    expect(formatConversationEvent('booking_requested', {
      total: 2000,
      check_in: '2026-07-01',
      check_out: '2026-07-08',
    })).toBe('Booking requested · $2000 for 2026-07-01 – 2026-07-08');
  });

  it('formats proposal events without data', () => {
    expect(formatConversationEvent('proposal_accepted')).toBe('Offer accepted');
    expect(formatConversationEvent('proposal_rejected')).toBe('Offer declined');
  });
});

describe('getConversationTitle', () => {
  it('combines context label with resort name', () => {
    expect(getConversationTitle('bid', 'Hilton Orlando'))
      .toBe('Offer · Hilton Orlando');
  });
});

describe('isValidContextType', () => {
  it('validates all 4 context types', () => {
    expect(isValidContextType('inquiry')).toBe(true);
    expect(isValidContextType('booking')).toBe(true);
    expect(isValidContextType('bid')).toBe(true);
    expect(isValidContextType('travel_request')).toBe(true);
    expect(isValidContextType('chat')).toBe(false);
  });
});

describe('isValidEventType', () => {
  it('validates all 14 event types', () => {
    const validTypes = [
      'inquiry_started', 'booking_requested', 'booking_confirmed', 'booking_cancelled',
      'bid_placed', 'bid_countered', 'bid_accepted', 'bid_rejected', 'bid_expired',
      'proposal_sent', 'proposal_accepted', 'proposal_rejected',
      'check_in_confirmed', 'review_left',
    ];
    for (const t of validTypes) {
      expect(isValidEventType(t)).toBe(true);
    }
    expect(isValidEventType('invalid')).toBe(false);
  });
});
