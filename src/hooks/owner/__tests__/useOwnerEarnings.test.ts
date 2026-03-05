import { describe, it, expect } from 'vitest';
import { fillMissingMonths } from '../useOwnerEarnings';
import type { MonthlyEarning } from '@/types/ownerDashboard';

describe('fillMissingMonths @p0', () => {
  it('returns 12 entries for empty input', () => {
    const result = fillMissingMonths([]);
    expect(result).toHaveLength(12);
  });

  it('fills gaps with zero-valued entries', () => {
    const result = fillMissingMonths([]);
    for (const entry of result) {
      expect(entry.earnings).toBe(0);
      expect(entry.booking_count).toBe(0);
    }
  });

  it('preserves existing data points', () => {
    // Use the same date construction as fillMissingMonths to avoid timezone issues
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStr = d.toISOString().slice(0, 10);

    const thisMonth: MonthlyEarning = {
      month: monthStr,
      earnings: 1500,
      booking_count: 3,
    };
    const result = fillMissingMonths([thisMonth]);
    expect(result).toHaveLength(12);

    // The preserved entry should appear somewhere in the result with its data
    const preserved = result.find((r) => r.earnings === 1500);
    expect(preserved).toBeDefined();
    expect(preserved!.booking_count).toBe(3);
  });

  it('orders entries chronologically (oldest first)', () => {
    const result = fillMissingMonths([]);
    const dates = result.map((r) => new Date(r.month).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeGreaterThan(dates[i - 1]);
    }
  });

  it('handles multiple data points across months', () => {
    const now = new Date();
    const data: MonthlyEarning[] = [
      {
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
        earnings: 500,
        booking_count: 1,
      },
      {
        month: new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().slice(0, 10),
        earnings: 800,
        booking_count: 2,
      },
    ];
    const result = fillMissingMonths(data);
    expect(result).toHaveLength(12);

    const nonZero = result.filter((r) => r.earnings > 0);
    expect(nonZero).toHaveLength(2);
  });
});
