// Bid Form Component - For travelers to bid on listings open for bidding
// Supports two modes: 'bid' (standard) and 'date-proposal' (propose different dates)

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateBid } from '@/hooks/useBidding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Gavel, DollarSign, Users, Clock, LogIn, Calendar } from 'lucide-react';
import { ActionSuccessCard } from '@/components/ActionSuccessCard';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import type { ListingWithBidding } from '@/types/bidding';
import { calculateNights, computeListingPricing } from '@/lib/pricing';
import { trackEvent } from '@/lib/posthog';
import { useGetOrCreateConversation, useInsertConversationEvent } from '@/hooks/useConversations';

type BidMode = 'bid' | 'date-proposal';

interface BidFormDialogProps {
  listing: ListingWithBidding;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: BidMode;
}

export function BidFormDialog({ listing, open, onOpenChange, mode = 'bid' }: BidFormDialogProps) {
  const { user } = useAuth();
  const createBid = useCreateBid();
  const getOrCreateConversation = useGetOrCreateConversation();
  const insertEvent = useInsertConversationEvent();

  const [bidAmount, setBidAmount] = useState<number>(listing.min_bid_amount || listing.owner_price);
  const [guestCount, setGuestCount] = useState<number>(1);
  const [message, setMessage] = useState('');
  const [bidSuccess, setBidSuccess] = useState(false);
  const [submittedBidAmount, setSubmittedBidAmount] = useState(0);

  // Date proposal fields
  const [proposedCheckIn, setProposedCheckIn] = useState('');
  const [proposedCheckOut, setProposedCheckOut] = useState('');

  const nightlyRate = (listing as { nightly_rate?: number }).nightly_rate || 0;
  const proposedNights = proposedCheckIn && proposedCheckOut
    ? calculateNights(proposedCheckIn, proposedCheckOut)
    : 0;

  // Auto-compute bid amount from nightly rate when in date-proposal mode
  useEffect(() => {
    if (mode === 'date-proposal' && nightlyRate > 0 && proposedNights > 0) {
      const pricing = computeListingPricing(nightlyRate, proposedNights);
      setBidAmount(pricing.finalPrice);
    }
  }, [mode, nightlyRate, proposedNights]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      return;
    }

    if (mode === 'bid' && listing.min_bid_amount && bidAmount < listing.min_bid_amount) {
      return;
    }

    try {
      await createBid.mutateAsync({
        listing_id: listing.id,
        bid_amount: bidAmount,
        guest_count: guestCount,
        message: message || undefined,
        ...(mode === 'date-proposal' && proposedCheckIn && proposedCheckOut
          ? { requested_check_in: proposedCheckIn, requested_check_out: proposedCheckOut }
          : {}),
      });

      setSubmittedBidAmount(bidAmount);
      setBidSuccess(true);

      // Wire to unified conversation layer (fire-and-forget)
      getOrCreateConversation.mutate({
        ownerId: listing.owner_id,
        travelerId: user.id,
        propertyId: listing.property_id,
        listingId: listing.id,
        contextType: 'bid',
      }, {
        onSuccess: (conversationId) => {
          insertEvent.mutate({
            conversationId,
            eventType: 'bid_placed',
            eventData: {
              amount: bidAmount,
              check_in: proposedCheckIn || listing.check_in_date,
              check_out: proposedCheckOut || listing.check_out_date,
            },
          });
        },
      });

      trackEvent("bid_placed", {
        listing_id: listing.id,
        bid_amount: bidAmount,
        mode,
        guest_count: guestCount,
      });
    } catch {
      // Error handled in hook
    }
  };

  const timeRemaining = listing.bidding_ends_at
    ? formatDistanceToNow(new Date(listing.bidding_ends_at), { addSuffix: true })
    : null;

  // Defensive: if dialog opens without auth, show sign-in prompt
  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5 text-primary" />
              Sign In Required
            </DialogTitle>
            <DialogDescription>
              You need to sign in before making an offer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setBidSuccess(false);
      setBidAmount(listing.min_bid_amount || listing.owner_price);
      setGuestCount(1);
      setMessage('');
      setProposedCheckIn('');
      setProposedCheckOut('');
    }
  };

  const isDateProposal = mode === 'date-proposal';
  const dialogTitle = isDateProposal ? 'Request Different Dates' : 'Make Your Offer';
  const dialogIcon = isDateProposal ? Calendar : Gavel;
  const DialogIcon = dialogIcon;
  const successTitle = isDateProposal ? 'Date Request Submitted!' : 'Offer Submitted!';
  const successDescription = isDateProposal
    ? 'The property owner will review your proposed dates and respond. You\'ll be notified when they accept, reject, or counter your offer.'
    : 'The property owner will review your offer and respond. You\'ll be notified when they accept, reject, or counter your offer.';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        {bidSuccess ? (
          <ActionSuccessCard
            icon={dialogIcon}
            iconClassName="text-primary"
            title={successTitle}
            description={successDescription}
            referenceLabel="Offer Amount"
            referenceValue={`$${submittedBidAmount.toLocaleString()}`}
            actions={[{ label: "Done", onClick: () => handleOpenChange(false) }]}
          />
        ) : (
        <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DialogIcon className="h-5 w-5 text-primary" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {listing.property?.resort_name} - {listing.property?.location}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {/* Listing Info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-in</span>
              <span className="font-medium">{format(new Date(listing.check_in_date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-out</span>
              <span className="font-medium">{format(new Date(listing.check_out_date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Listed Price</span>
              <span className="font-medium">${listing.final_price.toLocaleString()}</span>
            </div>
            {nightlyRate > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nightly Rate</span>
                <span className="font-medium">${nightlyRate}/night</span>
              </div>
            )}
            {listing.min_bid_amount && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minimum Offer</span>
                <span className="font-medium text-primary">${listing.min_bid_amount.toLocaleString()}</span>
              </div>
            )}
            {listing.highest_bid && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Highest Offer</span>
                <span className="font-bold text-accent">${listing.highest_bid.toLocaleString()}</span>
              </div>
            )}
          </div>

          {timeRemaining && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Offer window closes {timeRemaining}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date proposal fields */}
          {isDateProposal && (
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800">Propose your preferred dates</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="proposedCheckIn" className="text-xs">Check-in</Label>
                  <Input
                    id="proposedCheckIn"
                    type="date"
                    value={proposedCheckIn}
                    onChange={(e) => setProposedCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="proposedCheckOut" className="text-xs">Check-out</Label>
                  <Input
                    id="proposedCheckOut"
                    type="date"
                    value={proposedCheckOut}
                    onChange={(e) => setProposedCheckOut(e.target.value)}
                    min={proposedCheckIn || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
              {proposedNights > 0 && nightlyRate > 0 && (
                <p className="text-xs text-blue-700">
                  {proposedNights} night{proposedNights > 1 ? 's' : ''} x ${nightlyRate}/night = ${(nightlyRate * proposedNights).toLocaleString()}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bidAmount">
              {isDateProposal ? 'Total Offer Amount ($)' : 'Your Offer Amount ($)'}
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="bidAmount"
                type="number"
                min={listing.min_bid_amount || 1}
                step={1}
                value={bidAmount}
                onChange={(e) => setBidAmount(parseFloat(e.target.value) || 0)}
                className="pl-9"
                required
              />
            </div>
            {!isDateProposal && listing.min_bid_amount && bidAmount < listing.min_bid_amount && (
              <p className="text-xs text-destructive">
                Minimum offer is ${listing.min_bid_amount.toLocaleString()}
              </p>
            )}
            {isDateProposal && nightlyRate > 0 && proposedNights > 0 && (
              <p className="text-xs text-muted-foreground">
                Auto-computed from nightly rate. You can adjust this amount.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestCount">Number of Guests</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="guestCount"
                type="number"
                min={1}
                max={listing.property?.sleeps || 10}
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                className="pl-9"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Max guests: {listing.property?.sleeps || 'N/A'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isDateProposal
                ? "Explain why these dates work better for you..."
                : "Add a message to the property owner..."}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createBid.isPending
                || (!isDateProposal && listing.min_bid_amount ? bidAmount < listing.min_bid_amount : false)
                || (isDateProposal && (!proposedCheckIn || !proposedCheckOut || proposedNights <= 0))
              }
            >
              {createBid.isPending ? 'Submitting...' : isDateProposal ? 'Submit Proposal' : 'Submit Offer'}
            </Button>
          </DialogFooter>
        </form>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
