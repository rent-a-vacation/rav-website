import { describe, it, expect, vi } from 'vitest';

const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({ supabase: mockSupabase }));

const mockUser = vi.hoisted(() => ({ id: 'user-1', email: 'test@example.com' }));
vi.mock('./useAuth', () => ({
  useAuth: () => ({ user: mockUser, hasRole: () => false, isRavTeam: () => false }),
}));

import {
  CONCIERGE_CATEGORIES,
  CONCIERGE_STATUSES,
} from './useConcierge';

describe('useConcierge', () => {
  describe('CONCIERGE_CATEGORIES', () => {
    it('defines 4 categories', () => {
      expect(CONCIERGE_CATEGORIES).toHaveLength(4);
      const values = CONCIERGE_CATEGORIES.map((c) => c.value);
      expect(values).toContain('general');
      expect(values).toContain('booking_help');
      expect(values).toContain('complaint');
      expect(values).toContain('recommendation');
    });
  });

  describe('CONCIERGE_STATUSES', () => {
    it('defines 4 statuses', () => {
      expect(CONCIERGE_STATUSES).toHaveLength(4);
      const values = CONCIERGE_STATUSES.map((s) => s.value);
      expect(values).toContain('open');
      expect(values).toContain('in_progress');
      expect(values).toContain('resolved');
      expect(values).toContain('closed');
    });
  });

  describe('category labels', () => {
    it('all categories have human-readable labels', () => {
      for (const cat of CONCIERGE_CATEGORIES) {
        expect(cat.label.length).toBeGreaterThan(0);
        expect(cat.label).not.toBe(cat.value);
      }
    });
  });

  describe('status labels', () => {
    it('all statuses have human-readable labels', () => {
      for (const status of CONCIERGE_STATUSES) {
        expect(status.label.length).toBeGreaterThan(0);
      }
    });
  });
});
