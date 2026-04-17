import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Headphones, Clock, CheckCircle2, MessageSquare, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useAdminConciergeRequests,
  useUpdateConciergeRequest,
  CONCIERGE_STATUSES,
  type ConciergeStatus,
  type ConciergeRequestWithAssignee,
} from '@/hooks/useConcierge';

const STATUS_COLORS: Record<ConciergeStatus, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
};

const STATUS_ICONS: Record<ConciergeStatus, React.ComponentType<{ className?: string }>> = {
  open: Clock,
  in_progress: MessageSquare,
  resolved: CheckCircle2,
  closed: XCircle,
};

export default function AdminConcierge() {
  const { data: requests = [], isLoading } = useAdminConciergeRequests();
  const updateRequest = useUpdateConciergeRequest();
  const { toast } = useToast();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = filterStatus === 'all'
    ? requests
    : requests.filter((r) => r.status === filterStatus);

  const statusCounts = requests.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const handleStatusChange = async (req: ConciergeRequestWithAssignee, newStatus: ConciergeStatus) => {
    try {
      await updateRequest.mutateAsync({
        id: req.id,
        status: newStatus,
        resolution_notes: newStatus === 'resolved' ? resolutionNotes || undefined : undefined,
      });
      toast({ title: 'Request updated', description: `Status changed to ${newStatus}.` });
      if (newStatus === 'resolved' || newStatus === 'closed') {
        setExpandedId(null);
        setResolutionNotes('');
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update request.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CONCIERGE_STATUSES.map(({ value, label }) => {
          const Icon = STATUS_ICONS[value];
          return (
            <Card key={value} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus(value)}>
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{statusCounts[value] || 0}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Headphones className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-semibold">Concierge Requests</h2>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 ml-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({requests.length})</SelectItem>
            {CONCIERGE_STATUSES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label} ({statusCounts[value] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No requests {filterStatus !== 'all' ? `with status "${filterStatus}"` : 'yet'}.
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Traveler</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => {
                const isExpanded = expandedId === req.id;
                const StatusIcon = STATUS_ICONS[req.status];
                return (
                  <>
                    <TableRow
                      key={req.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setExpandedId(isExpanded ? null : req.id);
                        setResolutionNotes(req.resolution_notes || '');
                      }}
                    >
                      <TableCell className="font-medium">{req.subject}</TableCell>
                      <TableCell className="text-sm">
                        {req.traveler?.full_name || 'Unknown'}
                        <br />
                        <span className="text-xs text-muted-foreground">{req.traveler?.email}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {req.category.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs gap-1 ${STATUS_COLORS[req.status]}`}>
                          <StatusIcon className="h-3 w-3" />
                          {req.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {req.status === 'open' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(req, 'in_progress');
                            }}
                            disabled={updateRequest.isPending}
                          >
                            Take On
                          </Button>
                        )}
                        {req.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(req.id);
                            }}
                          >
                            Resolve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${req.id}-detail`}>
                        <TableCell colSpan={6} className="bg-muted/30">
                          <div className="space-y-3 p-2">
                            <div>
                              <p className="text-sm font-medium mb-1">Description</p>
                              <p className="text-sm text-muted-foreground">{req.description}</p>
                            </div>
                            {(req.status === 'in_progress' || req.status === 'open') && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Resolution Notes</p>
                                <Textarea
                                  value={resolutionNotes}
                                  onChange={(e) => setResolutionNotes(e.target.value)}
                                  rows={2}
                                  placeholder="Describe how the request was resolved..."
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleStatusChange(req, 'resolved')}
                                    disabled={updateRequest.isPending}
                                  >
                                    {updateRequest.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                    Mark Resolved
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(req, 'closed')}
                                    disabled={updateRequest.isPending}
                                  >
                                    Close
                                  </Button>
                                </div>
                              </div>
                            )}
                            {req.resolution_notes && req.status === 'resolved' && (
                              <div className="p-2 bg-green-50 rounded text-sm">
                                <span className="font-medium">Resolution:</span> {req.resolution_notes}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
