import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { BusinessMetrics, MonthlyMetric, BidActivityPoint, BidSpreadPoint, RevenueWaterfallPoint } from '@/types/executive';
import { DEFAULT_COMMISSION } from '@/config/commission';

// Executive Dashboard derives historical commission revenue from existing
// bookings. Once `bookings.commission_rate_applied` is back-filled, this
// helper can switch to the per-booking persisted rate. For now we use the
// central build-time default (issue #510).
const COMMISSION_RATE = DEFAULT_COMMISSION.base;

async function fetchBusinessMetrics(): Promise<BusinessMetrics> {
  if (!isSupabaseConfigured()) {
    return emptyMetrics();
  }

  // Fetch all data in parallel
  const [bookingsRes, listingsRes, profilesRes, bidsRes] = await Promise.all([
    supabase.from('bookings').select('id, total_amount, created_at, status'),
    supabase.from('listings').select('id, status'),
    supabase.from('profiles').select('id, created_at, approval_status'),
    supabase.from('listing_bids').select('id, bid_amount, status, created_at'),
  ]);

  const bookings = bookingsRes.data || [];
  const listings = listingsRes.data || [];
  const profiles = profilesRes.data || [];
  const bids = bidsRes.data || [];

  // Core metrics
  const confirmedBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'completed'
  );
  const totalGmv = confirmedBookings.reduce(
    (sum, b) => sum + (b.total_amount || 0),
    0
  );
  const platformRevenue = totalGmv * COMMISSION_RATE;
  const activeListings = listings.filter((l) => l.status === 'active').length;

  // User counts
  const approvedProfiles = profiles.filter(
    (p) => p.approval_status === 'approved'
  );
  const totalUsers = approvedProfiles.length;

  // Monthly signups (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const monthlySignups = profiles.filter(
    (p) => new Date(p.created_at) >= thirtyDaysAgo
  ).length;

  // Monthly breakdown (last 6 months)
  const monthlyData = buildMonthlyData(confirmedBookings);
  const bidActivity = buildBidActivity(bids);
  const bidSpread = buildBidSpread(bids, confirmedBookings);
  const revenueWaterfall = buildRevenueWaterfall(confirmedBookings);

  return {
    totalGmv,
    platformRevenue,
    activeListings,
    totalOwners: Math.ceil(totalUsers * 0.25), // approximate from profiles
    totalRenters: Math.ceil(totalUsers * 0.75),
    monthlySignups,
    monthlyData,
    bidActivity,
    bidSpread,
    revenueWaterfall,
  };
}

function buildMonthlyData(
  bookings: Array<{ total_amount: number | null; created_at: string }>
): MonthlyMetric[] {
  const months = getLastNMonths(6);
  const grouped: Record<string, { gmv: number; bookings: number }> = {};

  months.forEach((m) => (grouped[m] = { gmv: 0, bookings: 0 }));

  bookings.forEach((b) => {
    const key = formatMonthKey(b.created_at);
    if (grouped[key]) {
      grouped[key].gmv += b.total_amount || 0;
      grouped[key].bookings += 1;
    }
  });

  return months.map((month) => ({
    month,
    gmv: grouped[month].gmv,
    revenue: grouped[month].gmv * COMMISSION_RATE,
    bookings: grouped[month].bookings,
  }));
}

function buildBidActivity(
  bids: Array<{ status: string | null; created_at: string }>
): BidActivityPoint[] {
  const months = getLastNMonths(6);
  const grouped: Record<string, { placed: number; accepted: number }> = {};

  months.forEach((m) => (grouped[m] = { placed: 0, accepted: 0 }));

  bids.forEach((b) => {
    const key = formatMonthKey(b.created_at);
    if (grouped[key]) {
      grouped[key].placed += 1;
      if (b.status === 'accepted') {
        grouped[key].accepted += 1;
      }
    }
  });

  return months.map((month) => ({
    month,
    bidsPlaced: grouped[month].placed,
    bidsAccepted: grouped[month].accepted,
  }));
}

function buildBidSpread(
  bids: Array<{ bid_amount: number | null; created_at: string }>,
  bookings: Array<{ total_amount: number | null; created_at: string }>
): BidSpreadPoint[] {
  const months = getLastNMonths(6);
  // Calculate avg spread as (avg listing price - avg bid) / avg listing price
  const avgBookingPrice =
    bookings.length > 0
      ? bookings.reduce((s, b) => s + (b.total_amount || 0), 0) / bookings.length
      : 0;

  const grouped: Record<string, number[]> = {};
  months.forEach((m) => (grouped[m] = []));

  bids.forEach((b) => {
    const key = formatMonthKey(b.created_at);
    if (grouped[key] && b.bid_amount) {
      grouped[key].push(b.bid_amount);
    }
  });

  return months.map((month) => {
    const amounts = grouped[month];
    const avg = amounts.length > 0 ? amounts.reduce((s, v) => s + v, 0) / amounts.length : 0;
    const sorted = [...amounts].sort((a, b) => a - b);
    const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
    const spread = avgBookingPrice > 0 ? ((avgBookingPrice - avg) / avgBookingPrice) * 100 : 0;
    const medianSpread = avgBookingPrice > 0 ? ((avgBookingPrice - median) / avgBookingPrice) * 100 : 0;

    return { month, avgSpread: Math.max(0, spread), medianSpread: Math.max(0, medianSpread) };
  });
}

function buildRevenueWaterfall(
  bookings: Array<{ total_amount: number | null; created_at: string }>
): RevenueWaterfallPoint[] {
  const months = getLastNMonths(6);
  const grouped: Record<string, number> = {};

  months.forEach((m) => (grouped[m] = 0));

  bookings.forEach((b) => {
    const key = formatMonthKey(b.created_at);
    if (grouped[key] !== undefined) {
      grouped[key] += b.total_amount || 0;
    }
  });

  return months.map((month) => ({
    month,
    ownerPayout: grouped[month] * (1 - COMMISSION_RATE),
    commission: grouped[month] * COMMISSION_RATE,
  }));
}

function getLastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString('en-US', { month: 'short', year: '2-digit' }));
  }
  return months;
}

function formatMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
}

function emptyMetrics(): BusinessMetrics {
  return {
    totalGmv: 0,
    platformRevenue: 0,
    activeListings: 0,
    totalOwners: 0,
    totalRenters: 0,
    monthlySignups: 0,
    monthlyData: [],
    bidActivity: [],
    bidSpread: [],
    revenueWaterfall: [],
  };
}

export function useBusinessMetrics() {
  return useQuery({
    queryKey: ['executive', 'business-metrics'],
    queryFn: fetchBusinessMetrics,
    staleTime: 5 * 60 * 1000, // 5 min
    refetchOnWindowFocus: false,
  });
}
