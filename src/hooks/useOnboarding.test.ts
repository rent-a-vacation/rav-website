// @vitest-environment jsdom
// @p0
import { describe, it, expect } from 'vitest';
import { needsOnboarding } from './useOnboarding';
import type { Profile } from '@/types/database';

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-1',
    email: 'test@example.com',
    full_name: 'Test User',
    approval_status: 'approved',
    approved_at: '2026-04-01T00:00:00Z',
    approved_by: 'admin-1',
    avatar_url: null,
    phone: null,
    rejection_reason: null,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
    stripe_account_id: null,
    stripe_charges_enabled: null,
    stripe_onboarding_complete: null,
    stripe_payouts_enabled: null,
    annual_maintenance_fees: null,
    maintenance_fee_updated_at: null,
    deletion_requested_at: null,
    deletion_scheduled_for: null,
    deletion_reason: null,
    is_anonymized: false,
    is_seed_foundation: null,
    admin_notes: null as never,
    onboarding_completed_at: null,
    current_terms_version: null,
    current_privacy_version: null,
    ...overrides,
  } as Profile;
}

describe('needsOnboarding', () => {
  it('returns false for RAV team members (even if approved + not onboarded)', () => {
    const profile = makeProfile({ onboarding_completed_at: null });
    expect(needsOnboarding(profile, true)).toBe(false);
  });

  it('returns false for already-onboarded users', () => {
    const profile = makeProfile({ onboarding_completed_at: '2026-04-05T00:00:00Z' });
    expect(needsOnboarding(profile, false)).toBe(false);
  });

  it('returns true for newly approved users with null onboarding_completed_at', () => {
    const profile = makeProfile({ onboarding_completed_at: null });
    expect(needsOnboarding(profile, false)).toBe(true);
  });

  it('returns false when profile is null', () => {
    expect(needsOnboarding(null, false)).toBe(false);
  });

  it('returns false when user is pending_approval', () => {
    const profile = makeProfile({ approval_status: 'pending_approval' });
    expect(needsOnboarding(profile, false)).toBe(false);
  });

  it('returns false when user is rejected', () => {
    const profile = makeProfile({ approval_status: 'rejected' });
    expect(needsOnboarding(profile, false)).toBe(false);
  });
});
