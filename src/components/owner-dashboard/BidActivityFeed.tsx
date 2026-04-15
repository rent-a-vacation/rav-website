import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowDownLeft, CheckCircle, XCircle, ArrowLeftRight, CalendarCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { BidEvent } from '@/types/ownerDashboard';

interface BidActivityFeedProps {
  events: BidEvent[] | undefined;
  isLoading: boolean;
}

const EVENT_CONFIG = {
  new_bid: { icon: ArrowDownLeft, color: 'text-amber-500', label: 'New bid received' },
  accepted: { icon: CheckCircle, color: 'text-emerald-500', label: 'Bid accepted' },
  rejected: { icon: XCircle, color: 'text-red-500', label: 'Bid rejected' },
  counter_offer: { icon: ArrowLeftRight, color: 'text-blue-500', label: 'Counter offer sent' },
  booking_confirmed: { icon: CalendarCheck, color: 'text-emerald-600', label: 'Booking confirmed' },
} as const;

export function BidActivityFeed({ events, isLoading }: BidActivityFeedProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Offer Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="bids">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Bid Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {!events?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No bid activity yet. Your bid events will appear here.
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const config = EVENT_CONFIG[event.event_type];
              const Icon = config.icon;

              return (
                <Link
                  key={event.id}
                  to={`/property/${event.listing_id}`}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Icon className={`h-4 w-4 mt-0.5 ${config.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{config.label}</span>
                      {' — '}
                      <span className="text-muted-foreground">{event.property_name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.event_type === 'new_bid' && (
                        <>Traveler {event.traveler_initial}. offered ${event.amount.toLocaleString()} · </>
                      )}
                      {event.event_type !== 'new_bid' && (
                        <>${event.amount.toLocaleString()} · </>
                      )}
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
