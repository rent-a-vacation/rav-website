import { differenceInDays, differenceInWeeks, differenceInHours } from 'date-fns';

interface BookingLike {
  status: string;
  check_in_date: string;
}

interface BidLike {
  status: string;
}

interface RequestLike {
  status: string;
}

export interface RenterOverview {
  upcomingCount: number;
  activeBidCount: number;
  openRequestCount: number;
  nextCheckIn: string | null;
}

/**
 * Compute a renter's overview statistics from their data.
 */
export function computeRenterOverview(
  bookings: BookingLike[],
  bids: BidLike[],
  requests: RequestLike[],
): RenterOverview {
  const now = new Date();

  const upcoming = bookings.filter(
    (b) =>
      (b.status === 'pending' || b.status === 'confirmed') &&
      new Date(b.check_in_date + 'T00:00:00') >= now,
  );

  const activeBids = bids.filter((b) => b.status === 'pending');
  const openRequests = requests.filter((r) => r.status === 'open');

  // Find the nearest upcoming check-in
  const sorted = [...upcoming].sort(
    (a, b) =>
      new Date(a.check_in_date + 'T00:00:00').getTime() -
      new Date(b.check_in_date + 'T00:00:00').getTime(),
  );

  return {
    upcomingCount: upcoming.length,
    activeBidCount: activeBids.length,
    openRequestCount: openRequests.length,
    nextCheckIn: sorted[0]?.check_in_date ?? null,
  };
}

/**
 * Format a check-in countdown as a human-readable string.
 */
export function getCheckInCountdown(checkInDate: string): string {
  const now = new Date();
  const checkIn = new Date(checkInDate + 'T00:00:00');
  const hours = differenceInHours(checkIn, now);

  if (hours < 0) return 'Already checked in';
  if (hours < 24) return 'Today!';
  if (hours < 48) return 'Tomorrow';

  const days = differenceInDays(checkIn, now);
  if (days < 7) return `${days} days`;

  const weeks = differenceInWeeks(checkIn, now);
  if (weeks < 5) return `${weeks} week${weeks !== 1 ? 's' : ''}`;

  return `${days} days`;
}
