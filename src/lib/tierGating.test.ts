import { describe, it, expect } from 'vitest';
import {
  EARLY_ACCESS_HOURS,
  isListingInEarlyAccess,
  canSeeEarlyAccess,
  canSeeExclusiveDeals,
  isOwnerPriorityTier,
  canAccessConcierge,
  hasAccountManager,
} from './tierGating';

describe('tierGating', () => {
  describe('isListingInEarlyAccess', () => {
    const now = new Date('2026-04-16T12:00:00Z');

    it('returns true for listing created 1 hour ago', () => {
      const createdAt = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
      expect(isListingInEarlyAccess(createdAt, now)).toBe(true);
    });

    it('returns true for listing created 47 hours ago', () => {
      const createdAt = new Date(now.getTime() - 47 * 60 * 60 * 1000).toISOString();
      expect(isListingInEarlyAccess(createdAt, now)).toBe(true);
    });

    it('returns false for listing created exactly 48 hours ago', () => {
      const createdAt = new Date(now.getTime() - EARLY_ACCESS_HOURS * 60 * 60 * 1000).toISOString();
      expect(isListingInEarlyAccess(createdAt, now)).toBe(false);
    });

    it('returns false for listing created 72 hours ago', () => {
      const createdAt = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();
      expect(isListingInEarlyAccess(createdAt, now)).toBe(false);
    });

    it('returns false for listing created in the future', () => {
      const createdAt = new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString();
      expect(isListingInEarlyAccess(createdAt, now)).toBe(false);
    });
  });

  describe('canSeeEarlyAccess', () => {
    it('returns false for Free tier (level 0)', () => {
      expect(canSeeEarlyAccess(0)).toBe(false);
    });

    it('returns true for Plus tier (level 1)', () => {
      expect(canSeeEarlyAccess(1)).toBe(true);
    });

    it('returns true for Premium tier (level 2)', () => {
      expect(canSeeEarlyAccess(2)).toBe(true);
    });

    it('returns false for undefined tier', () => {
      expect(canSeeEarlyAccess(undefined)).toBe(false);
    });
  });

  describe('canSeeExclusiveDeals', () => {
    it('returns false for Free tier', () => {
      expect(canSeeExclusiveDeals(0)).toBe(false);
    });

    it('returns false for Plus tier', () => {
      expect(canSeeExclusiveDeals(1)).toBe(false);
    });

    it('returns true for Premium tier', () => {
      expect(canSeeExclusiveDeals(2)).toBe(true);
    });

    it('returns false for undefined tier', () => {
      expect(canSeeExclusiveDeals(undefined)).toBe(false);
    });
  });

  describe('isOwnerPriorityTier', () => {
    it('returns false for Free owner', () => {
      expect(isOwnerPriorityTier(0)).toBe(false);
    });

    it('returns true for Pro owner', () => {
      expect(isOwnerPriorityTier(1)).toBe(true);
    });

    it('returns true for Business owner', () => {
      expect(isOwnerPriorityTier(2)).toBe(true);
    });
  });

  describe('canAccessConcierge', () => {
    it('returns false for Free traveler', () => {
      expect(canAccessConcierge(0, 'traveler')).toBe(false);
    });

    it('returns false for Plus traveler', () => {
      expect(canAccessConcierge(1, 'traveler')).toBe(false);
    });

    it('returns true for Premium traveler', () => {
      expect(canAccessConcierge(2, 'traveler')).toBe(true);
    });

    it('returns false for Business owner (wrong role category)', () => {
      expect(canAccessConcierge(2, 'owner')).toBe(false);
    });

    it('returns false for undefined inputs', () => {
      expect(canAccessConcierge(undefined, undefined)).toBe(false);
    });
  });

  describe('hasAccountManager', () => {
    it('returns false for Free owner', () => {
      expect(hasAccountManager(0, 'owner')).toBe(false);
    });

    it('returns false for Pro owner', () => {
      expect(hasAccountManager(1, 'owner')).toBe(false);
    });

    it('returns true for Business owner', () => {
      expect(hasAccountManager(2, 'owner')).toBe(true);
    });

    it('returns false for Premium traveler (wrong role category)', () => {
      expect(hasAccountManager(2, 'traveler')).toBe(false);
    });

    it('returns false for undefined inputs', () => {
      expect(hasAccountManager(undefined, undefined)).toBe(false);
    });
  });
});
