import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  generateICalendar,
  downloadICalFile,
  type CalendarBooking,
  type CalendarListing,
} from '@/lib/icalendar';

export function useOwnerCalendarExport() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportCalendar = async () => {
    if (!user) {
      setError('Not authenticated');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      // Fetch owner's listings with property data
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('id, check_in_date, check_out_date, status, nightly_rate, notes, property:properties(resort_name, location, bedrooms, bathrooms, brand)')
        .eq('owner_id', user.id)
        .neq('status', 'archived');

      if (listingsError) throw listingsError;

      // Fetch bookings for owner's listings
      const listingIds = (listings as CalendarListing[] | null)?.map((l) => l.id) || [];
      let bookings: CalendarBooking[] = [];

      if (listingIds.length > 0) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id, status, total_amount, special_requests,
            listing:listings(check_in_date, check_out_date, nightly_rate, property:properties(resort_name, location, bedrooms, bathrooms, brand)),
            renter:profiles(first_name, last_name, email)
          `)
          .in('listing_id', listingIds)
          .neq('status', 'cancelled');

        if (bookingsError) throw bookingsError;
        bookings = (bookingsData as CalendarBooking[]) || [];
      }

      const ical = generateICalendar(
        bookings,
        (listings as CalendarListing[]) || [],
        `RAV Calendar - ${user.email}`
      );

      const filename = `rav-calendar-${new Date().toISOString().slice(0, 10)}.ics`;
      downloadICalFile(ical, filename);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export calendar';
      setError(message);
      console.error('Calendar export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return { exportCalendar, isExporting, error };
}
