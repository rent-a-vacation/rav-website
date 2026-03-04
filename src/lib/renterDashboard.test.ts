import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeRenterOverview, getCheckInCountdown } from './renterDashboard';

describe('computeRenterOverview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-04T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts upcoming bookings correctly', () => {
    const bookings = [
      { status: 'confirmed', check_in_date: '2026-03-10' },
      { status: 'confirmed', check_in_date: '2026-04-15' },
      { status: 'cancelled', check_in_date: '2026-03-20' },
      { status: 'completed', check_in_date: '2025-12-01' },
    ];
    const result = computeRenterOverview(bookings, [], []);
    expect(result.upcomingCount).toBe(2);
  });

  it('counts active bids and open requests', () => {
    const bids = [
      { status: 'pending' },
      { status: 'accepted' },
      { status: 'pending' },
    ];
    const requests = [
      { status: 'open' },
      { status: 'closed' },
      { status: 'open' },
    ];
    const result = computeRenterOverview([], bids, requests);
    expect(result.activeBidCount).toBe(2);
    expect(result.openRequestCount).toBe(2);
  });

  it('returns nearest check-in date', () => {
    const bookings = [
      { status: 'confirmed', check_in_date: '2026-04-15' },
      { status: 'confirmed', check_in_date: '2026-03-10' },
      { status: 'confirmed', check_in_date: '2026-05-01' },
    ];
    const result = computeRenterOverview(bookings, [], []);
    expect(result.nextCheckIn).toBe('2026-03-10');
  });

  it('returns null nextCheckIn when no upcoming bookings', () => {
    const result = computeRenterOverview([], [], []);
    expect(result.nextCheckIn).toBeNull();
  });
});

describe('getCheckInCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-04T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Today!" for today\'s check-in', () => {
    // check-in at midnight local time, now is noon → still within 24h
    expect(getCheckInCountdown('2026-03-05')).toBe('Today!');
  });

  it('returns days for near dates', () => {
    expect(getCheckInCountdown('2026-03-09')).toBe('4 days');
  });

  it('returns weeks for further dates', () => {
    expect(getCheckInCountdown('2026-03-25')).toBe('2 weeks');
  });

  it('returns "Already checked in" for past dates', () => {
    expect(getCheckInCountdown('2026-03-01')).toBe('Already checked in');
  });
});
