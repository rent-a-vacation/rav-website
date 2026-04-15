// Proposal Form Dialog - For property owners to submit proposals for travel requests

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateProposal } from '@/hooks/useBidding';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Calendar, DollarSign, MessageSquare, Home } from 'lucide-react';
import { format, addDays } from 'date-fns';
import type { TravelRequestWithDetails } from '@/types/bidding';
import type { Property } from '@/types/database';

interface ProposalFormDialogProps {
  request: TravelRequestWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProposalFormDialog({ request, open, onOpenChange }: ProposalFormDialogProps) {
  const { user } = useAuth();
  const createProposal = useCreateProposal();
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [proposedPrice, setProposedPrice] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [proposedCheckIn, setProposedCheckIn] = useState(request.check_in_date);
  const [proposedCheckOut, setProposedCheckOut] = useState(request.check_out_date);
  const [validUntil, setValidUntil] = useState(
    format(addDays(new Date(), 1), 'yyyy-MM-dd')
  );

  // Fetch owner's properties
  useEffect(() => {
    const fetchProperties = async () => {
      if (!user) return;
      
      setIsLoadingProperties(true);
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', user.id)
          .order('resort_name');

        if (error) throw error;
        setProperties(data || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setIsLoadingProperties(false);
      }
    };

    if (open) {
      fetchProperties();
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedPropertyId) return;

    try {
      await createProposal.mutateAsync({
        request_id: request.id,
        property_id: selectedPropertyId,
        proposed_price: proposedPrice,
        message: message || undefined,
        proposed_check_in: proposedCheckIn,
        proposed_check_out: proposedCheckOut,
        valid_until: new Date(validUntil).toISOString(),
      });
      
      onOpenChange(false);
      resetForm();
    } catch {
      // Error handled in hook
    }
  };

  const resetForm = () => {
    setSelectedPropertyId('');
    setProposedPrice(0);
    setMessage('');
    setProposedCheckIn(request.check_in_date);
    setProposedCheckOut(request.check_out_date);
    setValidUntil(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  const getBudgetHint = () => {
    switch (request.budget_preference) {
      case 'range':
        return `Renter's budget: $${request.budget_min?.toLocaleString()} - $${request.budget_max?.toLocaleString()}`;
      case 'ceiling':
        return `Renter's max budget: $${request.budget_max?.toLocaleString()}`;
      default:
        return 'Budget not disclosed - price competitively!';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Send an Offer
          </DialogTitle>
          <DialogDescription>
            Pitch your property for this Wish.
          </DialogDescription>
        </DialogHeader>

        {/* Request Summary */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{request.destination_location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(request.check_in_date), 'MMM d')} - 
                {format(new Date(request.check_out_date), 'MMM d, yyyy')}
              </span>
              {request.dates_flexible && (
                <span className="text-muted-foreground">(± {request.flexibility_days} days)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground italic">{getBudgetHint()}</span>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Property Selection */}
          <div className="space-y-2">
            <Label htmlFor="property">Select Your Property *</Label>
            <Select
              value={selectedPropertyId}
              onValueChange={setSelectedPropertyId}
              disabled={isLoadingProperties}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingProperties ? 'Loading...' : 'Choose a property'} />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      {property.resort_name} - {property.location}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {properties.length === 0 && !isLoadingProperties && (
              <p className="text-xs text-destructive">
                You need to add a property first before submitting proposals.
              </p>
            )}
          </div>

          {/* Selected Property Info */}
          {selectedProperty && (
            <div className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">
              {selectedProperty.bedrooms} BR • {selectedProperty.bathrooms} BA • 
              Sleeps {selectedProperty.sleeps} • {selectedProperty.brand.replace(/_/g, ' ')}
            </div>
          )}

          {/* Proposed Dates */}
          {request.dates_flexible && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="propCheckIn">Proposed Check-in</Label>
                <Input
                  id="propCheckIn"
                  type="date"
                  value={proposedCheckIn}
                  onChange={(e) => setProposedCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propCheckOut">Proposed Check-out</Label>
                <Input
                  id="propCheckOut"
                  type="date"
                  value={proposedCheckOut}
                  onChange={(e) => setProposedCheckOut(e.target.value)}
                  min={proposedCheckIn}
                  required
                />
              </div>
            </div>
          )}

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Your Proposed Price ($) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="price"
                type="number"
                min={1}
                step={1}
                value={proposedPrice || ''}
                onChange={(e) => setProposedPrice(parseFloat(e.target.value) || 0)}
                className="pl-9"
                placeholder="Total price for the stay"
                required
              />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message to Renter</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe why your property is a great fit, any special offers, etc."
              rows={3}
            />
          </div>

          {/* Valid Until */}
          <div className="space-y-2">
            <Label htmlFor="validUntil">Offer Valid Until *</Label>
            <Input
              id="validUntil"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            <p className="text-xs text-muted-foreground">
              Renter must accept before this date
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createProposal.isPending || !selectedPropertyId || proposedPrice <= 0}
            >
              {createProposal.isPending ? 'Sending...' : 'Send Offer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
