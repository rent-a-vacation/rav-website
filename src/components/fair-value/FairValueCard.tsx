import { useFairValueScore } from '@/hooks/useFairValueScore';
import { FairValueBadge } from './FairValueBadge';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FairValueCardProps {
  listingId: string;
  viewerRole: 'owner' | 'traveler';
}

const OWNER_MESSAGES = {
  below_market: 'Your price is below the typical range. Consider raising your ask to maximize earnings.',
  fair_value: 'Your price is well-aligned with current demand. Good positioning for strong Offer activity.',
  above_market: 'Your price is above the typical range for similar listings. You may receive fewer Offers.',
} as const;

const TRAVELER_MESSAGES = {
  below_market: 'This listing is priced below comparable properties. Strong value at this price.',
  fair_value: 'This listing is priced within the normal range for comparable properties.',
  above_market: 'This listing is priced above comparable properties. Offers may be accepted below the asking price.',
} as const;

export function FairValueCard({ listingId, viewerRole }: FairValueCardProps) {
  const { data, isLoading } = useFairValueScore(listingId);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border p-4 space-y-3 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-5 w-24 bg-muted rounded-full" />
        <div className="h-3 w-48 bg-muted rounded" />
        <div className="h-3 w-56 bg-muted rounded" />
      </div>
    );
  }

  if (!data || data.tier === 'insufficient_data') return null;

  const messages = viewerRole === 'owner' ? OWNER_MESSAGES : TRAVELER_MESSAGES;

  return (
    <div className="bg-card rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">RAV SmartPrice</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="More info">
              <HelpCircle className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs leading-relaxed">
              Calculated from accepted Offer prices for comparable listings — same destination, bedroom count, and similar dates — over the past 90 days.
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Why it matters: Helps owners price competitively and gives travelers confidence they're seeing a fair price.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <FairValueBadge tier={data.tier} />

      {data.range_low != null && data.range_high != null && (
        <div>
          <p className="text-sm text-foreground">
            Market Range: ${data.range_low.toLocaleString()} – ${data.range_high.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            Based on {data.comparable_count} comparable bookings
          </p>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {messages[data.tier]}
      </p>

      {data.tier !== 'fair_value' && data.avg_accepted_bid != null && (
        <p className="text-xs text-muted-foreground">
          Average accepted Offer: ${data.avg_accepted_bid.toLocaleString()}
        </p>
      )}
    </div>
  );
}
