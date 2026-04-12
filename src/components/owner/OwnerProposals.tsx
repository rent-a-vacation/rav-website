// Owner Proposals Tab - For property owners to view and manage their proposals

import { useMyProposals } from '@/hooks/useBidding';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MessageSquare, 
  MapPin, 
  Calendar, 
  DollarSign,
  Clock,
  Check,
  X,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning',
  accepted: 'bg-success',
  rejected: 'bg-muted',
  expired: 'bg-muted',
  withdrawn: 'bg-muted',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  accepted: <Check className="h-3 w-3" />,
  rejected: <X className="h-3 w-3" />,
  expired: <Clock className="h-3 w-3" />,
  withdrawn: <X className="h-3 w-3" />,
};

export function OwnerProposals() {
  const { data: proposals, isLoading } = useMyProposals();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!proposals || proposals.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No proposals yet</h3>
          <p className="text-muted-foreground text-center">
            Browse travel requests and submit proposals to potential renters
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => (
        <Card key={proposal.id}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={STATUS_COLORS[proposal.status]}>
                    {STATUS_ICONS[proposal.status]}
                    <span className="ml-1">{proposal.status}</span>
                  </Badge>
                </div>
                
                <h3 className="font-semibold text-lg">
                  {proposal.request?.destination_location || 'RAV Wish'}
                </h3>
                
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  Proposed: {proposal.property?.resort_name}
                </p>
                
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(proposal.proposed_check_in), 'MMM d')} - 
                    {format(new Date(proposal.proposed_check_out), 'MMM d, yyyy')}
                  </span>
                </div>

                {proposal.message && (
                  <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                    "{proposal.message}"
                  </div>
                )}
              </div>

              <div className="text-right">
                <p className="text-sm text-muted-foreground">Your price</p>
                <p className="text-2xl font-bold">${proposal.proposed_price.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Valid until {format(new Date(proposal.valid_until), 'MMM d')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Submitted {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
