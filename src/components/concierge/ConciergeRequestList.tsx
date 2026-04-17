import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Headphones, Clock, CheckCircle2, MessageSquare, XCircle } from 'lucide-react';
import { useMyConciergeRequests, type ConciergeStatus } from '@/hooks/useConcierge';

const STATUS_CONFIG: Record<ConciergeStatus, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
  open: { label: 'Open', variant: 'secondary', icon: Clock },
  in_progress: { label: 'In Progress', variant: 'default', icon: MessageSquare },
  resolved: { label: 'Resolved', variant: 'outline', icon: CheckCircle2 },
  closed: { label: 'Closed', variant: 'outline', icon: XCircle },
};

export function ConciergeRequestList() {
  const { data: requests = [], isLoading } = useMyConciergeRequests();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <Headphones className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No concierge requests yet.</p>
        <p className="text-muted-foreground text-xs mt-1">
          Use the "Contact Concierge" button to get personalized help.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const config = STATUS_CONFIG[req.status];
        const StatusIcon = config.icon;
        return (
          <Card key={req.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{req.subject}</CardTitle>
                <Badge variant={config.variant} className="text-xs gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {req.category.replace('_', ' ')} &middot;{' '}
                {new Date(req.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>
              {req.resolution_notes && (
                <div className="mt-2 p-2 bg-muted rounded text-xs">
                  <span className="font-medium">Resolution:</span> {req.resolution_notes}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
