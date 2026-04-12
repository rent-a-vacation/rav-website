// "Inspired By" Travel Request Dialog
// Wraps TravelRequestForm with pre-filled defaults from a listing

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateTravelRequest } from '@/hooks/useBidding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, MapPin, Calendar, Users, LogIn } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { Link } from 'react-router-dom';
import { ActionSuccessCard } from '@/components/ActionSuccessCard';
import type { ActiveListing } from '@/hooks/useListings';

interface InspiredTravelRequestDialogProps {
  listing: ActiveListing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InspiredTravelRequestDialog({ listing, open, onOpenChange }: InspiredTravelRequestDialogProps) {
  const { user } = useAuth();
  const createRequest = useCreateTravelRequest();

  const prop = listing.property;
  const location = prop.resort?.location
    ? `${prop.resort.location.city}, ${prop.resort.location.state}`
    : prop.location;
  const resortName = prop.resort?.resort_name || prop.resort_name;

  // Form state — pre-filled from listing
  const [destination, setDestination] = useState(location);
  const [checkIn, setCheckIn] = useState(listing.check_in_date);
  const [checkOut, setCheckOut] = useState(listing.check_out_date);
  const [guestCount, setGuestCount] = useState(prop.sleeps || 2);
  const [bedrooms, setBedrooms] = useState(prop.bedrooms || 1);
  const [datesFlexible, setDatesFlexible] = useState(true);
  const [flexibilityDays, setFlexibilityDays] = useState(7);
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [targetOwnerOnly, setTargetOwnerOnly] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createRequest.mutateAsync({
        destination_location: destination,
        check_in_date: checkIn,
        check_out_date: checkOut,
        dates_flexible: datesFlexible,
        flexibility_days: datesFlexible ? flexibilityDays : 0,
        guest_count: guestCount,
        bedrooms_needed: bedrooms,
        budget_preference: 'undisclosed',
        proposals_deadline: new Date(addDays(new Date(), 14)).toISOString(),
        special_requirements: specialRequirements || undefined,
        source_listing_id: listing.id,
        target_owner_only: targetOwnerOnly,
      });

      setSuccess(true);
    } catch {
      // Error handled in hook
    }
  };

  // Auth guard
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
              You need to sign in to post a travel request.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button asChild><Link to="/login">Sign In</Link></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {success ? (
          <ActionSuccessCard
            icon={Sparkles}
            iconClassName="text-accent"
            title="RAV Wish Posted!"
            description="Property owners will be notified and can send you proposals. You'll receive a notification when proposals come in."
            actions={[{ label: "Done", onClick: () => handleOpenChange(false) }]}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Find Something Similar
              </DialogTitle>
              <DialogDescription>
                Inspired by {resortName} listing
              </DialogDescription>
            </DialogHeader>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              Post a travel request based on this listing. Owners with similar properties will send you offers.
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inspired-destination" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Destination
                </Label>
                <Input
                  id="inspired-destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="inspired-checkin" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Check-in
                  </Label>
                  <Input
                    id="inspired-checkin"
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inspired-checkout" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Check-out
                  </Label>
                  <Input
                    id="inspired-checkout"
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="inspired-flexible">Flexible dates?</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow owners to propose nearby dates (+/- {flexibilityDays} days)
                  </p>
                </div>
                <Switch
                  id="inspired-flexible"
                  checked={datesFlexible}
                  onCheckedChange={setDatesFlexible}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="inspired-guests" className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> Guests
                  </Label>
                  <Input
                    id="inspired-guests"
                    type="number"
                    min={1}
                    max={20}
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inspired-bedrooms">Bedrooms</Label>
                  <Input
                    id="inspired-bedrooms"
                    type="number"
                    min={1}
                    max={10}
                    value={bedrooms}
                    onChange={(e) => setBedrooms(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="inspired-owner-only">Send to this owner first</Label>
                  <p className="text-xs text-muted-foreground">
                    Only notify the owner of this listing initially
                  </p>
                </div>
                <Switch
                  id="inspired-owner-only"
                  checked={targetOwnerOnly}
                  onCheckedChange={setTargetOwnerOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inspired-requirements">Special Requirements (Optional)</Label>
                <Textarea
                  id="inspired-requirements"
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  placeholder="Any specific needs or preferences..."
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRequest.isPending}>
                  {createRequest.isPending ? 'Posting...' : 'Post Request'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
