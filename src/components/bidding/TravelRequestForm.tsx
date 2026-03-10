// Travel Request Form - For travelers to post their vacation needs

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateTravelRequest } from '@/hooks/useBidding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, Users, DollarSign, Plus, Sparkles } from 'lucide-react';
import { addDays, format } from 'date-fns';
import type { BudgetPreference, VacationClubBrand } from '@/types/bidding';

const VACATION_BRANDS: { value: VacationClubBrand; label: string }[] = [
  { value: 'hilton_grand_vacations', label: 'Hilton Grand Vacations' },
  { value: 'marriott_vacation_club', label: 'Marriott Vacation Club' },
  { value: 'disney_vacation_club', label: 'Disney Vacation Club' },
  { value: 'wyndham_destinations', label: 'Wyndham Destinations' },
  { value: 'hyatt_residence_club', label: 'Hyatt Residence Club' },
  { value: 'bluegreen_vacations', label: 'Bluegreen Vacations' },
  { value: 'holiday_inn_club', label: 'Holiday Inn Club' },
  { value: 'worldmark', label: 'WorldMark' },
  { value: 'other', label: 'Other' },
];

interface TravelRequestFormDefaults {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
}

interface TravelRequestFormProps {
  onSuccess?: () => void;
  defaultValues?: TravelRequestFormDefaults;
}

export function TravelRequestForm({ onSuccess, defaultValues }: TravelRequestFormProps) {
  const { user } = useAuth();
  const createRequest = useCreateTravelRequest();
  const [open, setOpen] = useState(false);

  // Form state
  const [destinationLocation, setDestinationLocation] = useState(defaultValues?.destination || '');
  const [destinationFlexibility, setDestinationFlexibility] = useState('');
  const [checkInDate, setCheckInDate] = useState(defaultValues?.checkIn || '');
  const [checkOutDate, setCheckOutDate] = useState(defaultValues?.checkOut || '');
  const [datesFlexible, setDatesFlexible] = useState(false);
  const [flexibilityDays, setFlexibilityDays] = useState(3);
  const [guestCount, setGuestCount] = useState(2);
  const [bedroomsNeeded, setBedroomsNeeded] = useState(1);
  const [budgetPreference, setBudgetPreference] = useState<BudgetPreference>('undisclosed');
  const [budgetMin, setBudgetMin] = useState<number | undefined>();
  const [budgetMax, setBudgetMax] = useState<number | undefined>();
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [proposalsDeadline, setProposalsDeadline] = useState(
    format(addDays(new Date(), 14), 'yyyy-MM-dd')
  );

  const resetForm = () => {
    setDestinationLocation('');
    setDestinationFlexibility('');
    setCheckInDate('');
    setCheckOutDate('');
    setDatesFlexible(false);
    setFlexibilityDays(3);
    setGuestCount(2);
    setBedroomsNeeded(1);
    setBudgetPreference('undisclosed');
    setBudgetMin(undefined);
    setBudgetMax(undefined);
    setSpecialRequirements('');
    setProposalsDeadline(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      await createRequest.mutateAsync({
        destination_location: destinationLocation,
        destination_flexibility: destinationFlexibility || undefined,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        dates_flexible: datesFlexible,
        flexibility_days: datesFlexible ? flexibilityDays : 0,
        guest_count: guestCount,
        bedrooms_needed: bedroomsNeeded,
        budget_preference: budgetPreference,
        budget_min: budgetPreference === 'range' ? budgetMin : undefined,
        budget_max: budgetPreference !== 'undisclosed' ? budgetMax : undefined,
        special_requirements: specialRequirements || undefined,
        proposals_deadline: new Date(proposalsDeadline).toISOString(),
      });
      
      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Make a Vacation Wish
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Vacation Wishes
          </DialogTitle>
          <DialogDescription>
            Tell us your dream trip — verified owners compete with personalized proposals!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Destination */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Where do you want to go?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="destination">Destination *</Label>
                <Input
                  id="destination"
                  placeholder="e.g., Orlando, Florida or Maui, Hawaii"
                  value={destinationLocation}
                  onChange={(e) => setDestinationLocation(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flexibility">Flexibility (Optional)</Label>
                <Input
                  id="flexibility"
                  placeholder="e.g., Anywhere in Florida, Beach destinations, etc."
                  value={destinationFlexibility}
                  onChange={(e) => setDestinationFlexibility(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                When are you traveling?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="checkIn">Check-in Date *</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkOut">Check-out Date *</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={checkInDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="flexible">Flexible dates?</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow owners to propose nearby dates
                  </p>
                </div>
                <Switch
                  id="flexible"
                  checked={datesFlexible}
                  onCheckedChange={setDatesFlexible}
                />
              </div>
              {datesFlexible && (
                <div className="space-y-2">
                  <Label htmlFor="flexDays">Flexibility (+/- days)</Label>
                  <Input
                    id="flexDays"
                    type="number"
                    min={1}
                    max={14}
                    value={flexibilityDays}
                    onChange={(e) => setFlexibilityDays(parseInt(e.target.value) || 3)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Party Size */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Who's traveling?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="guests">Number of Guests *</Label>
                  <Input
                    id="guests"
                    type="number"
                    min={1}
                    max={20}
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms Needed *</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min={1}
                    max={10}
                    value={bedroomsNeeded}
                    onChange={(e) => setBedroomsNeeded(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                What's your budget?
              </CardTitle>
              <CardDescription>
                Help owners understand what you're looking to spend
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Budget Preference</Label>
                <Select
                  value={budgetPreference}
                  onValueChange={(v) => setBudgetPreference(v as BudgetPreference)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="undisclosed">Don't show budget (owners bid blind)</SelectItem>
                    <SelectItem value="ceiling">Maximum budget only</SelectItem>
                    <SelectItem value="range">Budget range (min - max)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {budgetPreference === 'range' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin">Minimum ($)</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      min={0}
                      value={budgetMin || ''}
                      onChange={(e) => setBudgetMin(parseFloat(e.target.value) || undefined)}
                      placeholder="e.g., 500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">Maximum ($)</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      min={budgetMin || 0}
                      value={budgetMax || ''}
                      onChange={(e) => setBudgetMax(parseFloat(e.target.value) || undefined)}
                      placeholder="e.g., 1500"
                      required
                    />
                  </div>
                </div>
              )}

              {budgetPreference === 'ceiling' && (
                <div className="space-y-2">
                  <Label htmlFor="budgetCeiling">Maximum Budget ($)</Label>
                  <Input
                    id="budgetCeiling"
                    type="number"
                    min={0}
                    value={budgetMax || ''}
                    onChange={(e) => setBudgetMax(parseFloat(e.target.value) || undefined)}
                    placeholder="e.g., 1500"
                    required
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Special Requirements */}
          <div className="space-y-2">
            <Label htmlFor="requirements">Special Requirements (Optional)</Label>
            <Textarea
              id="requirements"
              value={specialRequirements}
              onChange={(e) => setSpecialRequirements(e.target.value)}
              placeholder="e.g., Pet-friendly, accessible, ocean view, specific amenities..."
              rows={3}
            />
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Accept Proposals Until *</Label>
            <Input
              id="deadline"
              type="date"
              value={proposalsDeadline}
              onChange={(e) => setProposalsDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              max={checkInDate || undefined}
              required
            />
            <p className="text-xs text-muted-foreground">
              Owners can submit proposals until this date
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRequest.isPending}>
              {createRequest.isPending ? 'Posting...' : 'Post Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
