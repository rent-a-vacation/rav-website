import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  MessageSquare,
  DollarSign,
  Send,
  Loader2,
  Eye,
  XCircle,
} from "lucide-react";
import type { Database, Profile } from "@/types/database";
import { AdminEntityLink, type AdminNavigationProps } from "./AdminEntityLink";
import { AgeBadge } from "./AgeBadge";

type DisputeStatus = Database["public"]["Enums"]["dispute_status"];
type DisputeCategory = Database["public"]["Enums"]["dispute_category"];
type DisputePriority = Database["public"]["Enums"]["dispute_priority"];
type DisputeSource = Database["public"]["Enums"]["dispute_source"];

interface DisputeWithDetails {
  id: string;
  booking_id: string;
  reporter_id: string;
  reported_user_id: string | null;
  category: DisputeCategory;
  priority: DisputePriority;
  status: DisputeStatus;
  source: DisputeSource;
  description: string;
  evidence_urls: string[];
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  refund_amount: number | null;
  refund_reference: string | null;
  assigned_to: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  reporter: { full_name: string | null; email?: string } | null;
  reported_user: { full_name: string | null } | null;
  booking: {
    id: string;
    total_amount: number;
    status: string;
    payment_intent_id: string | null;
    listing: {
      id: string;
      property: { resort_name: string } | null;
    } | null;
  } | null;
}

interface DisputeMessage {
  id: string;
  dispute_id: string;
  sender_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  sender: { full_name: string | null } | null;
}

const CATEGORY_LABELS: Record<DisputeCategory, string> = {
  property_not_as_described: "Property Not as Described",
  access_issues: "Access Issues",
  safety_concerns: "Safety Concerns",
  cleanliness: "Cleanliness",
  cancellation_dispute: "Cancellation Dispute",
  payment_dispute: "Payment Dispute",
  owner_no_show: "Owner No-Show",
  other: "Other",
};

const STATUS_LABELS: Record<DisputeStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  awaiting_response: "Awaiting Response",
  resolved_full_refund: "Resolved (Full Refund)",
  resolved_partial_refund: "Resolved (Partial Refund)",
  resolved_no_refund: "Resolved (No Refund)",
  closed: "Closed",
};

const PRIORITY_COLORS: Record<DisputePriority, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const STATUS_COLORS: Record<DisputeStatus, string> = {
  open: "bg-red-100 text-red-700",
  investigating: "bg-yellow-100 text-yellow-800",
  awaiting_response: "bg-purple-100 text-purple-700",
  resolved_full_refund: "bg-green-100 text-green-700",
  resolved_partial_refund: "bg-green-100 text-green-700",
  resolved_no_refund: "bg-slate-100 text-slate-700",
  closed: "bg-slate-100 text-slate-600",
};

const AdminDisputes = ({ initialSearch = "", onNavigateToEntity }: AdminNavigationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [disputes, setDisputes] = useState<DisputeWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [ravTeamMembers, setRavTeamMembers] = useState<Pick<Profile, "id" | "full_name">[]>([]);

  useEffect(() => {
    if (initialSearch) setSearchTerm(initialSearch);
  }, [initialSearch]);

  // Detail dialog
  const [selectedDispute, setSelectedDispute] = useState<DisputeWithDetails | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Resolution dialog
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveStatus, setResolveStatus] = useState<DisputeStatus>("resolved_no_refund");
  const [refundAmount, setRefundAmount] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const fetchDisputes = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any).from("disputes")
        .select(`
          *,
          reporter:profiles!disputes_reporter_id_fkey(full_name),
          reported_user:profiles!disputes_reported_user_id_fkey(full_name),
          booking:bookings(
            id,
            total_amount,
            status,
            payment_intent_id,
            listing:listings(
              id,
              property:properties(resort_name)
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (statusFilter === "active") {
        query = query.in("status", ["open", "investigating", "awaiting_response"]);
      } else if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDisputes(data || []);
    } catch (error) {
      toast({
        title: "Failed to load disputes",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const fetchMessages = useCallback(
    async (disputeId: string) => {
      setMessagesLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any).from("dispute_messages").select(`
            *,
            sender:profiles!dispute_messages_sender_id_fkey(full_name)
          `)
          .eq("dispute_id", disputeId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch {
        toast({
          title: "Failed to load messages",
          variant: "destructive",
        });
      } finally {
        setMessagesLoading(false);
      }
    },
    [toast]
  );

  const handleOpenDetail = (dispute: DisputeWithDetails) => {
    setSelectedDispute(dispute);
    fetchMessages(dispute.id);
  };

  const handleSendMessage = async () => {
    if (!selectedDispute || !newMessage.trim() || !user) return;

    setIsSendingMessage(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("dispute_messages").insert({
          dispute_id: selectedDispute.id,
          sender_id: user.id,
          message: newMessage.trim(),
          is_internal: isInternalNote,
        });

      if (error) throw error;

      setNewMessage("");
      setIsInternalNote(false);
      fetchMessages(selectedDispute.id);
      toast({ title: isInternalNote ? "Internal note added" : "Message sent" });
    } catch {
      toast({ title: "Failed to send message", variant: "destructive" });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (disputeId: string, newStatus: DisputeStatus) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("disputes").update({ status: newStatus }).eq("id", disputeId);

      if (error) throw error;
      toast({ title: `Status updated to ${STATUS_LABELS[newStatus]}` });
      fetchDisputes();
      if (selectedDispute?.id === disputeId) {
        setSelectedDispute({ ...selectedDispute, status: newStatus });
      }
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const handleUpdatePriority = async (disputeId: string, newPriority: DisputePriority) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("disputes").update({ priority: newPriority }).eq("id", disputeId);

      if (error) throw error;
      toast({ title: `Priority updated to ${newPriority}` });
      fetchDisputes();
    } catch {
      toast({ title: "Failed to update priority", variant: "destructive" });
    }
  };

  const handleResolve = async () => {
    if (!selectedDispute || !user) return;

    setIsResolving(true);
    try {
      const amount = parseFloat(refundAmount) || 0;
      const { data, error } = await supabase.functions.invoke("process-dispute-refund", {
        body: {
          disputeId: selectedDispute.id,
          refundAmount: amount,
          resolutionNotes: resolutionNotes.trim(),
          status: resolveStatus,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Resolution failed");

      toast({
        title: "Dispute resolved",
        description: amount > 0
          ? `Refund of $${amount.toFixed(2)} processed.`
          : "Dispute closed without refund.",
      });

      setShowResolveDialog(false);
      setSelectedDispute(null);
      setRefundAmount("");
      setResolutionNotes("");
      fetchDisputes();
    } catch (error) {
      toast({
        title: "Failed to resolve dispute",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsResolving(false);
    }
  };

  // Fetch RAV team members for assignment dropdown
  useEffect(() => {
    const fetchTeam = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["rav_owner", "rav_admin", "rav_staff"]);
      if (data && data.length > 0) {
        const ids = [...new Set(data.map((r: { user_id: string }) => r.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ids);
        if (profiles) setRavTeamMembers(profiles);
      }
    };
    fetchTeam();
  }, []);

  const handleAssign = async (disputeId: string, assigneeId: string | null) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("disputes")
        .update({ assigned_to: assigneeId })
        .eq("id", disputeId);
      if (error) throw error;
      const name = assigneeId
        ? ravTeamMembers.find((m) => m.id === assigneeId)?.full_name || "team member"
        : "nobody";
      toast({ title: `Dispute assigned to ${name}` });
      fetchDisputes();
    } catch {
      toast({ title: "Failed to assign dispute", variant: "destructive" });
    }
  };

  // Stats
  const openCount = disputes.filter((d) => d.status === "open").length;
  const investigatingCount = disputes.filter((d) => d.status === "investigating").length;
  const criticalCount = disputes.filter((d) => d.priority === "critical" && !d.resolved_at).length;
  const resolvedThisMonth = disputes.filter((d) => {
    if (!d.resolved_at) return false;
    const resolved = new Date(d.resolved_at);
    const now = new Date();
    return resolved.getMonth() === now.getMonth() && resolved.getFullYear() === now.getFullYear();
  }).length;

  // Filtered disputes
  const filteredDisputes = disputes.filter((d) => {
    const matchesSearch = !searchTerm ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.reporter?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.booking?.listing?.property?.resort_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.id.includes(searchTerm);

    const matchesAssignment =
      assignmentFilter === "all" ||
      (assignmentFilter === "mine" && d.assigned_to === user?.id) ||
      (assignmentFilter === "unassigned" && !d.assigned_to);

    const matchesSource = sourceFilter === "all" || d.source === sourceFilter;

    return matchesSearch && matchesAssignment && matchesSource;
  });

  const isResolved = (status: DisputeStatus) =>
    ["resolved_full_refund", "resolved_partial_refund", "resolved_no_refund", "closed"].includes(
      status
    );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
            <p className="text-2xl font-bold">{openCount}</p>
            <p className="text-xs text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Search className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{investigatingCount}</p>
            <p className="text-xs text-muted-foreground">Investigating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <XCircle className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{criticalCount}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{resolvedThisMonth}</p>
            <p className="text-xs text-muted-foreground">Resolved This Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active (Open / Investigating)</SelectItem>
            <SelectItem value="all">All Disputes</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="awaiting_response">Awaiting Response</SelectItem>
            <SelectItem value="resolved_full_refund">Resolved (Full Refund)</SelectItem>
            <SelectItem value="resolved_partial_refund">Resolved (Partial)</SelectItem>
            <SelectItem value="resolved_no_refund">Resolved (No Refund)</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Assignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="mine">My Disputes</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="user_filed">User-Filed</SelectItem>
            <SelectItem value="ravio_support">RAVIO Support</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, resort, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Disputes Table */}
      {filteredDisputes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Scale className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No disputes found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reporter</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Resort</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDisputes.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <AdminEntityLink tab="users" search={dispute.reporter?.email || ""} onNavigate={onNavigateToEntity}>
                          <p className="font-medium text-sm">
                            {dispute.reporter?.full_name || "Unknown"}
                          </p>
                        </AdminEntityLink>
                        {dispute.source === "ravio_support" && (
                          <Badge variant="outline" className="h-5 text-[10px] font-medium border-primary/40 text-primary">
                            via RAVIO
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {dispute.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">{CATEGORY_LABELS[dispute.category]}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">
                      {dispute.booking?.listing?.property?.resort_name || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={dispute.priority}
                      onValueChange={(v) =>
                        handleUpdatePriority(dispute.id, v as DisputePriority)
                      }
                    >
                      <SelectTrigger className="h-7 w-24 text-xs">
                        <Badge className={`${PRIORITY_COLORS[dispute.priority]} text-xs`}>
                          {dispute.priority}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${STATUS_COLORS[dispute.status]} text-xs`}>
                      {STATUS_LABELS[dispute.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <AgeBadge date={dispute.created_at} thresholds={{ warning: 2, critical: 5 }} />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={dispute.assigned_to || "unassigned"}
                      onValueChange={(v) => handleAssign(dispute.id, v === "unassigned" ? null : v)}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <SelectValue>
                          {dispute.assigned_to
                            ? ravTeamMembers.find((m) => m.id === dispute.assigned_to)?.full_name || "Assigned"
                            : "Unassigned"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {user && (
                          <SelectItem value={user.id}>Me</SelectItem>
                        )}
                        {ravTeamMembers
                          .filter((m) => m.id !== user?.id)
                          .map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.full_name || "Unknown"}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDetail(dispute)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!isResolved(dispute.status) && dispute.status !== "investigating" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(dispute.id, "investigating")}
                        >
                          Investigate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Detail / Message Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDispute && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Dispute: {CATEGORY_LABELS[selectedDispute.category]}
                </DialogTitle>
                <DialogDescription>
                  Filed by {selectedDispute.reporter?.full_name || "Unknown"} on{" "}
                  {new Date(selectedDispute.created_at).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status & Priority */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={STATUS_COLORS[selectedDispute.status]}>
                    {STATUS_LABELS[selectedDispute.status]}
                  </Badge>
                  <Badge className={PRIORITY_COLORS[selectedDispute.priority]}>
                    Priority: {selectedDispute.priority}
                  </Badge>
                  {selectedDispute.source === "ravio_support" && (
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      Opened via RAVIO
                    </Badge>
                  )}
                  {selectedDispute.refund_amount != null && selectedDispute.refund_amount > 0 && (
                    <Badge className="bg-green-100 text-green-700">
                      Refund: ${selectedDispute.refund_amount.toFixed(2)}
                    </Badge>
                  )}
                </div>

                {/* Booking Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Booking Details</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p>
                      <strong>Resort:</strong>{" "}
                      {selectedDispute.booking?.listing?.property?.resort_name || "Unknown"}
                    </p>
                    <p>
                      <strong>Booking Total:</strong> $
                      {selectedDispute.booking?.total_amount?.toFixed(2) || "0.00"}
                    </p>
                    <p>
                      <strong>Booking Status:</strong> {selectedDispute.booking?.status || "—"}
                    </p>
                    <p>
                      <strong>Payment ID:</strong>{" "}
                      {selectedDispute.booking?.payment_intent_id || "No payment"}
                    </p>
                  </CardContent>
                </Card>

                {/* Description */}
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-3 rounded-lg">
                    {selectedDispute.description}
                  </p>
                </div>

                {/* Evidence */}
                {selectedDispute.evidence_urls.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Evidence ({selectedDispute.evidence_urls.length} file{selectedDispute.evidence_urls.length !== 1 ? "s" : ""})</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedDispute.evidence_urls.map((url, i) => {
                        const isImage = /\.(jpe?g|png|webp)(\?|$)/i.test(url);
                        return (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                          >
                            {isImage ? (
                              <img
                                src={url}
                                alt={`Evidence ${i + 1}`}
                                className="w-20 h-20 object-cover"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-muted flex flex-col items-center justify-center text-muted-foreground">
                                <span className="text-lg">PDF</span>
                                <span className="text-xs">#{i + 1}</span>
                              </div>
                            )}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Resolution Notes */}
                {selectedDispute.resolution_notes && (
                  <div>
                    <Label className="text-sm font-medium">Resolution Notes</Label>
                    <p className="text-sm text-muted-foreground mt-1 bg-green-50 p-3 rounded-lg">
                      {selectedDispute.resolution_notes}
                    </p>
                  </div>
                )}

                {/* Messages Thread */}
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Communication ({messages.length})
                  </Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {messagesLoading ? (
                      <Skeleton className="h-20 w-full" />
                    ) : messages.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4 text-center">
                        No messages yet.
                      </p>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg text-sm ${
                            msg.is_internal
                              ? "bg-yellow-50 border border-yellow-200"
                              : "bg-muted/50"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-xs">
                              {msg.sender?.full_name || "Unknown"}
                              {msg.is_internal && (
                                <Badge variant="outline" className="ml-2 text-[10px]">
                                  Internal
                                </Badge>
                              )}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{msg.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Send Message */}
                  {!isResolved(selectedDispute.status) && (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={2}
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={isInternalNote}
                            onChange={(e) => setIsInternalNote(e.target.checked)}
                            className="rounded"
                          />
                          Internal note (not visible to user)
                        </label>
                        <Button
                          size="sm"
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || isSendingMessage}
                        >
                          {isSendingMessage ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-1" />
                              Send
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {!isResolved(selectedDispute.status) && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {selectedDispute.status === "open" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleUpdateStatus(selectedDispute.id, "investigating")
                        }
                      >
                        <Search className="h-4 w-4 mr-1" />
                        Start Investigation
                      </Button>
                    )}
                    {selectedDispute.status === "investigating" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleUpdateStatus(selectedDispute.id, "awaiting_response")
                        }
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Await Response
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => {
                        setResolveStatus("resolved_no_refund");
                        setRefundAmount("");
                        setResolutionNotes("");
                        setShowResolveDialog(true);
                      }}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Resolve Dispute
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              {selectedDispute && (
                <>
                  Booking total: $
                  {selectedDispute.booking?.total_amount?.toFixed(2) || "0.00"}.{" "}
                  Choose a resolution and optional refund amount.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resolution</Label>
              <Select
                value={resolveStatus}
                onValueChange={(v) => setResolveStatus(v as DisputeStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved_full_refund">Full Refund</SelectItem>
                  <SelectItem value="resolved_partial_refund">Partial Refund</SelectItem>
                  <SelectItem value="resolved_no_refund">No Refund</SelectItem>
                  <SelectItem value="closed">Close Without Resolution</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(resolveStatus === "resolved_full_refund" ||
              resolveStatus === "resolved_partial_refund") && (
              <div className="space-y-2">
                <Label htmlFor="refund_amount">Refund Amount ($)</Label>
                <Input
                  id="refund_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedDispute?.booking?.total_amount || 0}
                  value={
                    resolveStatus === "resolved_full_refund"
                      ? selectedDispute?.booking?.total_amount?.toFixed(2) || ""
                      : refundAmount
                  }
                  onChange={(e) => setRefundAmount(e.target.value)}
                  disabled={resolveStatus === "resolved_full_refund"}
                  placeholder="Enter refund amount"
                />
                {resolveStatus === "resolved_full_refund" && (
                  <p className="text-xs text-muted-foreground">
                    Full refund of booking total will be processed.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="resolution_notes">Resolution Notes</Label>
              <Textarea
                id="resolution_notes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe the resolution..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleResolve} disabled={isResolving}>
                {isResolving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Resolution"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDisputes;
