// Travel Request Card - Displays a travel request for owners to view and submit proposals

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Bed,
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { ProposalFormDialog } from './ProposalFormDialog';
import type { TravelRequestWithDetails } from '@/types/bidding';

interface TravelRequestCardProps {
  request: TravelRequestWithDetails;
  showProposalButton?: boolean;
}

export function TravelRequestCard({ request, showProposalButton = true }: TravelRequestCardProps) {
  const { user, isPropertyOwner } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);

  const stayDuration = differenceInDays(
    new Date(request.check_out_date), 
    new Date(request.check_in_date)
  );

  const timeRemaining = formatDistanceToNow(new Date(request.proposals_deadline), { addSuffix: true });
  const isExpiringSoon = differenceInDays(new Date(request.proposals_deadline), new Date()) <= 3;

  const getBudgetDisplay = () => {
    switch (request.budget_preference) {
      case 'range':
        return `$${request.budget_min?.toLocaleString()} - $${request.budget_max?.toLocaleString()}`;
      case 'ceiling':
        return `Up to $${request.budget_max?.toLocaleString()}`;
      case 'undisclosed':
      default:
        return 'Budget not disclosed';
    }
  };

  const initials = request.traveler?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <>
      <Card className="overflow-hidden hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={request.traveler?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  {request.destination_location}
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {request.guest_count} guest{request.guest_count > 1 ? 's' : ''} • 
                  <Bed className="h-3 w-3 ml-1" />
                  {request.bedrooms_needed} BR
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <Badge 
                variant={isExpiringSoon ? 'destructive' : 'secondary'}
                className="mb-1"
              >
                <Clock className="h-3 w-3 mr-1" />
                {timeRemaining}
              </Badge>
              {request.proposal_count !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {request.proposal_count} proposal{request.proposal_count !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3 space-y-3">
          {/* Dates */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(request.check_in_date), 'MMM d')} - {format(new Date(request.check_out_date), 'MMM d, yyyy')}
            </span>
            <Badge variant="outline" className="ml-auto">
              {stayDuration} night{stayDuration > 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Flexibility */}
          {request.dates_flexible && (
            <p className="text-xs text-muted-foreground">
              ± {request.flexibility_days} days flexible
            </p>
          )}

          {/* Budget */}
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className={request.budget_preference === 'undisclosed' ? 'text-muted-foreground italic' : 'font-medium'}>
              {getBudgetDisplay()}
            </span>
          </div>

          {/* Expanded Details */}
          {expanded && (
            <div className="pt-3 border-t space-y-3 animate-fade-in">
              {request.destination_flexibility && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Also considering: </span>
                  {request.destination_flexibility}
                </div>
              )}
              {request.special_requirements && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Requirements: </span>
                  {request.special_requirements}
                </div>
              )}
              {request.preferred_brands && request.preferred_brands.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {request.preferred_brands.map((brand) => (
                    <Badge key={brand} variant="outline" className="text-xs">
                      {brand.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0 flex justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Less details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                More details
              </>
            )}
          </Button>

          {showProposalButton && isPropertyOwner() && user?.id !== request.traveler_id && (
            <Button onClick={() => setProposalOpen(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Offer
            </Button>
          )}
        </CardFooter>
      </Card>

      <ProposalFormDialog
        request={request}
        open={proposalOpen}
        onOpenChange={setProposalOpen}
      />
    </>
  );
}
