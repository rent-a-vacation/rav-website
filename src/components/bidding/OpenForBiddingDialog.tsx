// Open for Bidding Dialog - For owners to enable bidding on their listings

import { useState } from 'react';
import { useOpenListingForBidding } from '@/hooks/useBidding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Gavel, DollarSign, Clock, Info } from 'lucide-react';
import { addDays, format } from 'date-fns';

interface OpenForBiddingDialogProps {
  listingId: string;
  listingPrice: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpenForBiddingDialog({ 
  listingId, 
  listingPrice, 
  open, 
  onOpenChange 
}: OpenForBiddingDialogProps) {
  const openForBidding = useOpenListingForBidding();
  
  const [biddingEndsAt, setBiddingEndsAt] = useState(
    format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm")
  );
  const [minBidAmount, setMinBidAmount] = useState<number | undefined>();
  const [reservePrice, setReservePrice] = useState<number | undefined>();
  const [allowCounterOffers, setAllowCounterOffers] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await openForBidding.mutateAsync({
        listing_id: listingId,
        bidding_ends_at: new Date(biddingEndsAt).toISOString(),
        min_bid_amount: minBidAmount,
        reserve_price: reservePrice,
        allow_counter_offers: allowCounterOffers,
      });
      
      onOpenChange(false);
    } catch {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-primary" />
            Open Listing for Bidding
          </DialogTitle>
          <DialogDescription>
            Allow travelers to submit competitive bids on your listing
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Price Info */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Current listing price</p>
            <p className="text-xl font-bold">${listingPrice.toLocaleString()}</p>
          </div>

          {/* Bidding End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Bidding Ends At *
            </Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={biddingEndsAt}
              onChange={(e) => setBiddingEndsAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Set when Offers will close
            </p>
          </div>

          {/* Minimum Offer */}
          <div className="space-y-2">
            <Label htmlFor="minBid" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Minimum Offer (Optional)
            </Label>
            <Input
              id="minBid"
              type="number"
              min={0}
              value={minBidAmount || ''}
              onChange={(e) => setMinBidAmount(parseFloat(e.target.value) || undefined)}
              placeholder={`e.g., ${Math.round(listingPrice * 0.7)}`}
            />
            <p className="text-xs text-muted-foreground">
              Offers below this amount won't be accepted.
            </p>
          </div>

          {/* Reserve Price */}
          <div className="space-y-2">
            <Label htmlFor="reserve" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Reserve Price (Optional)
            </Label>
            <Input
              id="reserve"
              type="number"
              min={minBidAmount || 0}
              value={reservePrice || ''}
              onChange={(e) => setReservePrice(parseFloat(e.target.value) || undefined)}
              placeholder={`e.g., ${Math.round(listingPrice * 0.9)}`}
            />
            <p className="text-xs text-muted-foreground">
              You're not obligated to accept bids below this price (hidden from bidders)
            </p>
          </div>

          {/* Counter Offers */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="counterOffers">Allow Counter Offers</Label>
              <p className="text-xs text-muted-foreground">
                Respond to bids with your own price
              </p>
            </div>
            <Switch
              id="counterOffers"
              checked={allowCounterOffers}
              onCheckedChange={setAllowCounterOffers}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={openForBidding.isPending}>
              {openForBidding.isPending ? 'Enabling...' : 'Enable Bidding'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
