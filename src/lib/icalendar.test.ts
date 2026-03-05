import { describe, it, expect, vi } from 'vitest';
import {
  bookingToEvent,
  listingToEvent,
  generateICalendar,
  type CalendarBooking,
  type CalendarListing,
} from './icalendar';

const mockBooking: CalendarBooking = {
  id: 'booking-1',
  status: 'confirmed',
  total_amount: 1610,
  special_requests: 'Late check-in',
  listing: {
    check_in_date: '2026-06-01',
    check_out_date: '2026-06-08',
    nightly_rate: 200,
    property: {
      resort_name: 'Hilton Hawaiian Village',
      location: 'Honolulu, HI',
      bedrooms: 2,
      bathrooms: 2,
      brand: 'hilton_grand_vacations',
    },
  },
  renter: {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
  },
};

const mockListing: CalendarListing = {
  id: 'listing-1',
  check_in_date: '2026-07-10',
  check_out_date: '2026-07-17',
  status: 'active',
  nightly_rate: 180,
  notes: 'Ocean view unit',
  property: {
    resort_name: 'Marriott Ko Olina',
    location: 'Kapolei, HI',
    bedrooms: 1,
    bathrooms: 1,
    brand: 'marriott_vacations',
  },
};

describe('bookingToEvent', () => {
  it('converts a confirmed booking to a CONFIRMED event', () => {
    const event = bookingToEvent(mockBooking);
    expect(event.uid).toBe('booking-booking-1@rent-a-vacation.com');
    expect(event.summary).toBe('BOOKED: Hilton Hawaiian Village');
    expect(event.location).toBe('Honolulu, HI');
    expect(event.dtstart).toBe('2026-06-01');
    expect(event.dtend).toBe('2026-06-08');
    expect(event.status).toBe('CONFIRMED');
    expect(event.categories).toContain('Booked');
    expect(event.attendeeEmail).toBe('john@example.com');
    expect(event.attendeeName).toBe('John Doe');
  });

  it('includes total amount and special requests in description', () => {
    const event = bookingToEvent(mockBooking);
    expect(event.description).toContain('$1,610');
    expect(event.description).toContain('Late check-in');
    expect(event.description).toContain('2BR/2BA');
  });

  it('handles pending booking as TENTATIVE', () => {
    const pending = { ...mockBooking, status: 'pending' };
    const event = bookingToEvent(pending);
    expect(event.status).toBe('TENTATIVE');
  });

  it('handles booking with no renter info', () => {
    const noRenter = { ...mockBooking, renter: null };
    const event = bookingToEvent(noRenter);
    expect(event.attendeeName).toBe('Guest');
    expect(event.attendeeEmail).toBeUndefined();
    expect(event.description).toContain('Guest');
  });

  it('handles completed booking as CONFIRMED', () => {
    const completed = { ...mockBooking, status: 'completed' };
    const event = bookingToEvent(completed);
    expect(event.status).toBe('CONFIRMED');
  });
});

describe('listingToEvent', () => {
  it('converts an active listing to a CONFIRMED event', () => {
    const event = listingToEvent(mockListing);
    expect(event.uid).toBe('listing-listing-1@rent-a-vacation.com');
    expect(event.summary).toBe('Available: Marriott Ko Olina');
    expect(event.location).toBe('Kapolei, HI');
    expect(event.dtstart).toBe('2026-07-10');
    expect(event.dtend).toBe('2026-07-17');
    expect(event.status).toBe('CONFIRMED');
    expect(event.categories).toContain('Available');
  });

  it('includes nightly rate and notes in description', () => {
    const event = listingToEvent(mockListing);
    expect(event.description).toContain('$180/night');
    expect(event.description).toContain('Ocean view unit');
    expect(event.description).toContain('1BR/1BA');
  });

  it('handles draft listing as TENTATIVE', () => {
    const draft = { ...mockListing, status: 'draft' };
    const event = listingToEvent(draft);
    expect(event.status).toBe('TENTATIVE');
  });

  it('handles listing without nightly rate', () => {
    const noRate = { ...mockListing, nightly_rate: null };
    const event = listingToEvent(noRate);
    expect(event.description).not.toContain('/night');
  });
});

describe('generateICalendar', () => {
  it('generates valid iCal structure', () => {
    const ical = generateICalendar([mockBooking], [mockListing]);
    expect(ical).toContain('BEGIN:VCALENDAR');
    expect(ical).toContain('END:VCALENDAR');
    expect(ical).toContain('VERSION:2.0');
    expect(ical).toContain('PRODID:-//Rent-A-Vacation//RAV Calendar//EN');
    expect(ical).toContain('METHOD:PUBLISH');
  });

  it('includes booking events', () => {
    const ical = generateICalendar([mockBooking], []);
    expect(ical).toContain('BEGIN:VEVENT');
    expect(ical).toContain('END:VEVENT');
    expect(ical).toContain('BOOKED: Hilton Hawaiian Village');
    expect(ical).toContain('DTSTART;VALUE=DATE:20260601');
    expect(ical).toContain('DTEND;VALUE=DATE:20260608');
  });

  it('includes listing events', () => {
    const ical = generateICalendar([], [mockListing]);
    expect(ical).toContain('Available: Marriott Ko Olina');
    expect(ical).toContain('DTSTART;VALUE=DATE:20260710');
  });

  it('excludes cancelled bookings', () => {
    const cancelled = { ...mockBooking, status: 'cancelled' };
    const ical = generateICalendar([cancelled], []);
    expect(ical).not.toContain('BOOKED:');
  });

  it('excludes archived listings', () => {
    const archived = { ...mockListing, status: 'archived' };
    const ical = generateICalendar([], [archived]);
    expect(ical).not.toContain('Available:');
  });

  it('uses custom calendar name', () => {
    const ical = generateICalendar([], [], 'My Calendar');
    expect(ical).toContain('X-WR-CALNAME:My Calendar');
  });

  it('includes ATTENDEE for bookings with renter email', () => {
    const ical = generateICalendar([mockBooking], []);
    expect(ical).toContain('ATTENDEE;CN=John Doe:mailto:john@example.com');
  });

  it('escapes special characters in text fields', () => {
    const booking = {
      ...mockBooking,
      special_requests: 'Pool, spa; and dinner\nreservation',
    };
    const ical = generateICalendar([booking], []);
    expect(ical).toContain('Pool\\, spa\\; and dinner\\nreservation');
  });

  it('generates empty calendar with no events', () => {
    const ical = generateICalendar([], []);
    expect(ical).toContain('BEGIN:VCALENDAR');
    expect(ical).toContain('END:VCALENDAR');
    expect(ical).not.toContain('BEGIN:VEVENT');
  });
});
