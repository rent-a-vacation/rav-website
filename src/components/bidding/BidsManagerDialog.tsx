// Bids Manager - For owners to view and respond to bids on their listings

import { useState } from 'react';
import { useBidsForListing, useUpdateBidStatus } from '@/hooks/useBidding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Gavel, 
  Check, 
  X, 
  MessageSquare,
  Users,
  DollarSign,
  Clock,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { BidOnListing } from '@/types/bidding';
import { getRenterDisplayName } from '@/lib/displayName';

interface BidsManagerDialogProps {
  listingId: string;
  listingTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BidsManagerDialog({ 
  listingId, 
  listingTitle,
  open, 
  onOpenChange 
}: BidsManagerDialogProps) {
  const { data: bids, isLoading } = useBidsForListing(open ? listingId : undefined);
  const updateStatus = useUpdateBidStatus();
  
  const [counterOfferBidId, setCounterOfferBidId] = useState<string | null>(null);
  const [counterOfferAmount, setCounterOfferAmount] = useState<number>(0);
  const [counterOfferMessage, setCounterOfferMessage] = useState('');

  const handleAccept = async (bidId: string) => {
    await updateStatus.mutateAsync({ bidId, status: 'accepted' });
  };

  const handleReject = async (bidId: string) => {
    await updateStatus.mutateAsync({ bidId, status: 'rejected' });
  };

  const handleCounterOffer = async (bidId: string) => {
    await updateStatus.mutateAsync({ 
      bidId, 
      status: 'pending', // Keep as pending with counter
      counterOfferAmount,
      counterOfferMessage,
    });
    setCounterOfferBidId(null);
    setCounterOfferAmount(0);
    setCounterOfferMessage('');
  };

  const pendingBids = bids?.filter(b => b.status === 'pending') || [];
  const otherBids = bids?.filter(b => b.status !== 'pending') || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-primary" />
            Manage Offers
          </DialogTitle>
          <DialogDescription>
            {listingTitle}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : bids && bids.length > 0 ? (
          <div className="space-y-6">
            {/* Pending Bids */}
            {pendingBids.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Pending Offers ({pendingBids.length})
                </h4>
                {pendingBids.map((bid) => (
                  <BidCard
                    key={bid.id}
                    bid={bid}
                    onAccept={() => handleAccept(bid.id)}
                    onReject={() => handleReject(bid.id)}
                    onCounterOffer={() => {
                      setCounterOfferBidId(bid.id);
                      setCounterOfferAmount(bid.bid_amount);
                    }}
                    isUpdating={updateStatus.isPending}
                  />
                ))}
              </div>
            )}

            {/* Other Bids */}
            {otherBids.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Past Offers ({otherBids.length})
                </h4>
                {otherBids.map((bid) => (
                  <BidCard key={bid.id} bid={bid} showActions={false} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No bids received yet</p>
          </div>
        )}

        {/* Counter Offer Dialog */}
        {counterOfferBidId && (
          <Dialog open={!!counterOfferBidId} onOpenChange={() => setCounterOfferBidId(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Make a Counter Offer</DialogTitle>
                <DialogDescription>
                  Suggest a different price to the bidder
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Counter Offer ($)</label>
                  <Input
                    type="number"
                    min={0}
                    value={counterOfferAmount}
                    onChange={(e) => setCounterOfferAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message (Optional)</label>
                  <Input
                    value={counterOfferMessage}
                    onChange={(e) => setCounterOfferMessage(e.target.value)}
                    placeholder="e.g., I can do this price if you book today"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCounterOfferBidId(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleCounterOffer(counterOfferBidId)}
                  disabled={updateStatus.isPending}
                >
                  Send Counter Offer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Individual Bid Card
interface BidCardProps {
  bid: BidOnListing;
  onAccept?: () => void;
  onReject?: () => void;
  onCounterOffer?: () => void;
  isUpdating?: boolean;
  showActions?: boolean;
}

function BidCard({ 
  bid, 
  onAccept, 
  onReject, 
  onCounterOffer, 
  isUpdating,
  showActions = true 
}: BidCardProps) {
  const bidderName = getRenterDisplayName({
    fullName: bid.bidder?.full_name,
    email: bid.bidder?.email,
    userId: bid.bidder?.id ?? bid.bidder_id,
  });
  const initials = bidderName
    .replace(/^(Renter|Owner|User)\s+/, '')
    .replace(/^#/, '')
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const statusColors: Record<string, string> = {
    pending: 'bg-warning',
    accepted: 'bg-success',
    rejected: 'bg-muted',
    expired: 'bg-muted',
    withdrawn: 'bg-muted',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Bidder Info */}
          <Avatar className="h-10 w-10">
            <AvatarImage src={bid.bidder?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{bidderName}</span>
              <Badge className={statusColors[bid.status]}>
                {bid.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {bid.guest_count} guest{bid.guest_count > 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
              </span>
            </div>

            {bid.message && (
              <p className="text-sm mt-2 p-2 bg-muted/50 rounded">
                "{bid.message}"
              </p>
            )}

            {bid.counter_offer_amount && (
              <div className="mt-2 p-2 bg-accent/10 rounded text-sm">
                <span className="font-medium">Counter offer sent: </span>
                ${bid.counter_offer_amount.toLocaleString()}
                {bid.counter_offer_message && ` - "${bid.counter_offer_message}"`}
              </div>
            )}

            {bid.requested_check_in && bid.requested_check_out && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                <span className="font-medium">Different dates proposed: </span>
                {new Date(bid.requested_check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' – '}
                {new Date(bid.requested_check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {(() => {
                  const days = Math.ceil(
                    (new Date(bid.requested_check_out).getTime() - new Date(bid.requested_check_in).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return days > 0 ? ` (${days} night${days > 1 ? 's' : ''})` : '';
                })()}
              </div>
            )}
          </div>

          {/* Bid Amount & Actions */}
          <div className="text-right">
            <p className="text-2xl font-bold">${bid.bid_amount.toLocaleString()}</p>
            
            {showActions && bid.status === 'pending' && (
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCounterOffer}
                  disabled={isUpdating}
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Counter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onReject}
                  disabled={isUpdating}
                >
                  <X className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={onAccept}
                  disabled={isUpdating}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Accept
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
