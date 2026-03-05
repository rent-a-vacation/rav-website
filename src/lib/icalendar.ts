/**
 * iCalendar (.ics) generation utility for owner calendar export.
 *
 * Generates RFC 5545 compliant iCalendar files from bookings and listings.
 * No external dependencies — uses string concatenation for zero-dep iCal output.
 */

export interface CalendarEvent {
  uid: string;
  summary: string;
  description: string;
  location: string;
  dtstart: string; // YYYY-MM-DD
  dtend: string; // YYYY-MM-DD
  status: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
  categories: string[];
  attendeeName?: string;
  attendeeEmail?: string;
}

export interface CalendarBooking {
  id: string;
  status: string;
  total_amount?: number | null;
  special_requests?: string | null;
  listing: {
    check_in_date: string;
    check_out_date: string;
    nightly_rate?: number | null;
    property: {
      resort_name: string;
      location: string;
      bedrooms: number;
      bathrooms: number;
      brand?: string | null;
    };
  };
  renter?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
}

export interface CalendarListing {
  id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  nightly_rate?: number | null;
  notes?: string | null;
  property: {
    resort_name: string;
    location: string;
    bedrooms: number;
    bathrooms: number;
    brand?: string | null;
  };
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function formatDateToIcal(dateStr: string): string {
  // All-day events use VALUE=DATE format: YYYYMMDD
  return dateStr.replace(/-/g, '');
}

function nowTimestamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function bookingToEvent(booking: CalendarBooking): CalendarEvent {
  const prop = booking.listing.property;
  const renterName = booking.renter
    ? [booking.renter.first_name, booking.renter.last_name].filter(Boolean).join(' ') || 'Guest'
    : 'Guest';

  const statusMap: Record<string, 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED'> = {
    confirmed: 'CONFIRMED',
    completed: 'CONFIRMED',
    pending: 'TENTATIVE',
    cancelled: 'CANCELLED',
  };

  const lines = [
    `Guest: ${renterName}`,
    booking.renter?.email ? `Email: ${booking.renter.email}` : '',
    `Status: ${booking.status}`,
    booking.total_amount ? `Total: $${booking.total_amount.toLocaleString()}` : '',
    `${prop.bedrooms}BR/${prop.bathrooms}BA`,
    booking.special_requests ? `Requests: ${booking.special_requests}` : '',
  ].filter(Boolean);

  return {
    uid: `booking-${booking.id}@rent-a-vacation.com`,
    summary: `BOOKED: ${prop.resort_name}`,
    description: lines.join('\n'),
    location: prop.location,
    dtstart: booking.listing.check_in_date,
    dtend: booking.listing.check_out_date,
    status: statusMap[booking.status] || 'TENTATIVE',
    categories: ['Booked', booking.status],
    attendeeName: renterName,
    attendeeEmail: booking.renter?.email || undefined,
  };
}

export function listingToEvent(listing: CalendarListing): CalendarEvent {
  const prop = listing.property;
  const rate = listing.nightly_rate ? `$${listing.nightly_rate}/night` : '';

  const statusMap: Record<string, 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED'> = {
    active: 'CONFIRMED',
    draft: 'TENTATIVE',
    archived: 'CANCELLED',
  };

  const lines = [
    `${prop.bedrooms}BR/${prop.bathrooms}BA`,
    rate,
    prop.brand ? `Brand: ${prop.brand}` : '',
    listing.notes ? `Notes: ${listing.notes}` : '',
  ].filter(Boolean);

  return {
    uid: `listing-${listing.id}@rent-a-vacation.com`,
    summary: `Available: ${prop.resort_name}`,
    description: lines.join('\n'),
    location: prop.location,
    dtstart: listing.check_in_date,
    dtend: listing.check_out_date,
    status: statusMap[listing.status] || 'TENTATIVE',
    categories: ['Available', listing.status],
  };
}

function eventToVEvent(event: CalendarEvent): string {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${nowTimestamp()}`,
    `DTSTART;VALUE=DATE:${formatDateToIcal(event.dtstart)}`,
    `DTEND;VALUE=DATE:${formatDateToIcal(event.dtend)}`,
    `SUMMARY:${escapeICalText(event.summary)}`,
    `DESCRIPTION:${escapeICalText(event.description)}`,
    `LOCATION:${escapeICalText(event.location)}`,
    `STATUS:${event.status}`,
    `CATEGORIES:${event.categories.join(',')}`,
  ];

  if (event.attendeeEmail) {
    const cn = event.attendeeName ? `;CN=${escapeICalText(event.attendeeName)}` : '';
    lines.push(`ATTENDEE${cn}:mailto:${event.attendeeEmail}`);
  }

  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

export function generateICalendar(
  bookings: CalendarBooking[],
  listings: CalendarListing[],
  calendarName = 'Rent-A-Vacation Owner Calendar'
): string {
  const events: CalendarEvent[] = [];

  // Add bookings (exclude cancelled)
  for (const booking of bookings) {
    if (booking.status !== 'cancelled') {
      events.push(bookingToEvent(booking));
    }
  }

  // Add available listings (exclude archived and booked ones)
  const bookedListingIds = new Set(
    bookings
      .filter((b) => b.status !== 'cancelled')
      .map((b) => b.listing ? (b as unknown as { listing_id: string }).listing_id : '')
      .filter(Boolean)
  );

  for (const listing of listings) {
    if (listing.status !== 'archived' && !bookedListingIds.has(listing.id)) {
      events.push(listingToEvent(listing));
    }
  }

  const vevents = events.map(eventToVEvent).join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rent-A-Vacation//RAV Calendar//EN',
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    vevents,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICalFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
