import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isListingIdle,
  getUrgencyLevel,
  needs60dAlert,
  needs30dAlert,
  getIdleListingActions,
  formatIdleAlertEmail,
} from './idleListingAlerts';
import type { IdleListingInfo } from './idleListingAlerts';

describe('isListingIdle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-04T12:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  it('returns true for active listing with 0 bids within threshold', () => {
    expect(
      isListingIdle({ check_in_date: '2026-04-15', bid_count: 0, status: 'active' }, 60)
    ).toBe(true);
  });

  it('returns false for listing with bids', () => {
    expect(
      isListingIdle({ check_in_date: '2026-04-15', bid_count: 2, status: 'active' }, 60)
    ).toBe(false);
  });

  it('returns false for listing beyond threshold', () => {
    expect(
      isListingIdle({ check_in_date: '2026-06-15', bid_count: 0, status: 'active' }, 60)
    ).toBe(false);
  });

  it('returns false for non-active listing', () => {
    expect(
      isListingIdle({ check_in_date: '2026-04-15', bid_count: 0, status: 'booked' }, 60)
    ).toBe(false);
  });

  it('returns false for past check-in date', () => {
    expect(
      isListingIdle({ check_in_date: '2026-03-01', bid_count: 0, status: 'active' }, 60)
    ).toBe(false);
  });
});

describe('getUrgencyLevel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-04T12:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  it('returns 30d for listings within 30 days', () => {
    expect(getUrgencyLevel({ check_in_date: '2026-03-25' })).toBe('30d');
  });

  it('returns 60d for listings beyond 30 days', () => {
    expect(getUrgencyLevel({ check_in_date: '2026-04-15' })).toBe('60d');
  });
});

describe('needs60dAlert / needs30dAlert', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-04T12:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  const baseListing: IdleListingInfo = {
    id: 'lst-1',
    check_in_date: '2026-04-15',
    bid_count: 0,
    status: 'active',
    idle_alert_60d_sent_at: null,
    idle_alert_30d_sent_at: null,
    idle_alert_opt_out: false,
    nightly_rate: 200,
  };

  it('needs 60d alert when not sent and idle', () => {
    expect(needs60dAlert(baseListing)).toBe(true);
  });

  it('does not need 60d alert when already sent', () => {
    expect(needs60dAlert({ ...baseListing, idle_alert_60d_sent_at: '2026-03-01' })).toBe(false);
  });

  it('does not need alert when opted out', () => {
    expect(needs60dAlert({ ...baseListing, idle_alert_opt_out: true })).toBe(false);
    expect(needs30dAlert({ ...baseListing, idle_alert_opt_out: true, check_in_date: '2026-03-25' })).toBe(false);
  });

  it('needs 30d alert for close check-in', () => {
    const closeListing = { ...baseListing, check_in_date: '2026-03-25' };
    expect(needs30dAlert(closeListing)).toBe(true);
  });
});

describe('getIdleListingActions', () => {
  it('returns action suggestions', () => {
    const actions = getIdleListingActions({ nightly_rate: 200, bid_count: 0 });
    expect(actions.length).toBeGreaterThanOrEqual(3);
    expect(actions.map((a) => a.type)).toContain('reduce_price');
    expect(actions.map((a) => a.type)).toContain('enable_bidding');
  });
});

describe('formatIdleAlertEmail', () => {
  it('formats 60d email correctly', () => {
    const result = formatIdleAlertEmail(
      { resort_name: 'Maui Beach Resort', check_in_date: '2026-04-15', nightly_rate: 200, id: 'lst-1' },
      '60d'
    );
    expect(result.subject).toContain('Maui Beach Resort');
    expect(result.subject).toContain('60 days');
    expect(result.html).toContain('$200/night');
    expect(result.html).toContain('/property/lst-1');
  });

  it('formats 30d email with urgency', () => {
    const result = formatIdleAlertEmail(
      { resort_name: 'Hilton Waikoloa', check_in_date: '2026-03-25', nightly_rate: 150, id: 'lst-2' },
      '30d'
    );
    expect(result.subject).toContain('⚠️');
    expect(result.subject).toContain('30 days');
    expect(result.html).toContain('urgent');
  });
});
