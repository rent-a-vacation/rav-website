import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck,
  Loader2,
  MapPin,
  PauseCircle,
  PlayCircle,
  Search,
  Shield,
  Timer,
  User,
  XCircle,
  Zap,
  ExternalLink,
} from "lucide-react";
import { format, differenceInDays, addDays, isPast, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import type {
  BookingConfirmation,
  Booking,
  Listing,
  Property,
  Profile,
  EscrowStatus,
  OwnerConfirmationStatus
} from "@/types/database";
import { AdminEntityLink } from "./AdminEntityLink";
import { DateRangeFilter } from "./DateRangeFilter";
import { AgeBadge } from "./AgeBadge";
import { ListingTypeBadge } from "@/components/marketplace/ListingTypeBadge";

interface EscrowWithDetails extends BookingConfirmation {
  booking: Booking & {
    listing: Listing & { property: Property };
    renter: Profile;
  };
  owner: Profile;
}

const ESCROW_STATUS_CONFIG: Record<EscrowStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending_confirmation: { 
    label: "Awaiting Confirmation", 
    color: "bg-yellow-500", 
    icon: <Clock className="h-4 w-4" /> 
  },
  confirmation_submitted: { 
    label: "Needs Verification", 
    color: "bg-blue-500", 
    icon: <FileCheck className="h-4 w-4" /> 
  },
  verified: { 
    label: "Verified", 
    color: "bg-green-500", 
    icon: <CheckCircle2 className="h-4 w-4" /> 
  },
  released: { 
    label: "Funds Released", 
    color: "bg-primary", 
    icon: <Shield className="h-4 w-4" /> 
  },
  refunded: { 
    label: "Refunded", 
    color: "bg-red-500", 
    icon: <XCircle className="h-4 w-4" /> 
  },
  disputed: { 
    label: "Disputed", 
    color: "bg-destructive", 
    icon: <AlertTriangle className="h-4 w-4" /> 
  },
};

const OWNER_CONFIRMATION_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending_owner: { label: "Pending", variant: "secondary" },
  owner_confirmed: { label: "Confirmed", variant: "default" },
  owner_timed_out: { label: "Timed Out", variant: "destructive" },
  owner_declined: { label: "Declined", variant: "destructive" },
};

const AdminEscrow = ({ initialSearch = "", onNavigateToEntity }: { initialSearch?: string; onNavigateToEntity?: (tab: string, search?: string) => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [escrows, setEscrows] = useState<EscrowWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowWithDetails | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isAutoReleasing, setIsAutoReleasing] = useState(false);
  const [holdingEscrowId, setHoldingEscrowId] = useState<string | null>(null);
  const [escrowReleaseTarget, setEscrowReleaseTarget] = useState<EscrowWithDetails | null>(null);

  const fetchEscrows = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("booking_confirmations")
        .select(`
          *,
          booking:bookings(
            *,
            listing:listings(
              *,
              property:properties(*)
            ),
            renter:profiles(*)
          ),
          owner:profiles!booking_confirmations_owner_id_fkey(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEscrows(data as EscrowWithDetails[] || []);
    } catch (error) {
      console.error("Error fetching escrows:", error);
      toast({
        title: "Error",
        description: "Failed to load escrow data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEscrows();
  }, [fetchEscrows]);

  const handleVerifyConfirmation = async () => {
    if (!selectedEscrow || !user) return;

    setIsSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("booking_confirmations")
        .update({
          verified_by_rav: true,
          rav_verifier_id: user.id,
          rav_verified_at: new Date().toISOString(),
          rav_verification_notes: verificationNotes || null,
          escrow_status: "verified",
        })
        .eq("id", selectedEscrow.id);

      if (error) throw error;

      toast({
        title: "Confirmation Verified",
        description: "The resort confirmation has been verified.",
      });

      setIsDetailsDialogOpen(false);
      fetchEscrows();
    } catch (error) {
      console.error("Error verifying confirmation:", error);
      toast({
        title: "Error",
        description: "Failed to verify confirmation.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseFunds = (escrow: EscrowWithDetails) => {
    setEscrowReleaseTarget(escrow);
  };

  const confirmReleaseFunds = async () => {
    if (!user || !escrowReleaseTarget) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("booking_confirmations")
        .update({
          escrow_status: "released",
          escrow_released_at: new Date().toISOString(),
        })
        .eq("id", escrowReleaseTarget.id);

      if (error) throw error;

      // Also update the booking payout status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("bookings")
        .update({
          payout_status: "processing",
        })
        .eq("id", escrowReleaseTarget.booking_id);

      toast({
        title: "Funds Released",
        description: "Escrow funds have been released for payout processing.",
      });

      fetchEscrows();
    } catch (error) {
      console.error("Error releasing funds:", error);
      toast({
        title: "Error",
        description: "Failed to release funds.",
        variant: "destructive",
      });
    } finally {
      setEscrowReleaseTarget(null);
    }
  };

  const handleRefund = async (escrow: EscrowWithDetails) => {
    if (!user) return;

    const reason = window.prompt("Enter refund reason:");
    if (!reason) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("booking_confirmations")
        .update({
          escrow_status: "refunded",
          escrow_refunded_at: new Date().toISOString(),
          rav_verification_notes: `Refunded: ${reason}`,
        })
        .eq("id", escrow.id);

      if (error) throw error;

      toast({
        title: "Refund Initiated",
        description: "Escrow funds have been marked for refund to the renter.",
      });

      fetchEscrows();
    } catch (error) {
      console.error("Error initiating refund:", error);
      toast({
        title: "Error",
        description: "Failed to initiate refund.",
        variant: "destructive",
      });
    }
  };

  const handleAutoRelease = async () => {
    setIsAutoReleasing(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "process-escrow-release"
      );

      if (fnError) throw new Error(fnError.message);

      const result = data as { released: number; payouts_initiated: number; skipped: number; errors?: string[] };
      toast({
        title: "Auto-Release Complete",
        description: `Released: ${result.released}, Payouts: ${result.payouts_initiated}, Skipped: ${result.skipped}${
          result.errors?.length ? ` (${result.errors.length} errors)` : ""
        }`,
      });

      fetchEscrows();
    } catch (error) {
      console.error("Auto-release error:", error);
      toast({
        title: "Auto-Release Failed",
        description: error instanceof Error ? error.message : "Failed to run auto-release.",
        variant: "destructive",
      });
    } finally {
      setIsAutoReleasing(false);
    }
  };

  const handleToggleHold = async (escrow: EscrowWithDetails) => {
    if (!user) return;

    const isCurrentlyHeld = escrow.payout_held;

    if (!isCurrentlyHeld) {
      const reason = window.prompt("Enter reason for holding this payout:");
      if (!reason) return;

      setHoldingEscrowId(escrow.id);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("booking_confirmations")
          .update({
            payout_held: true,
            payout_held_reason: reason,
            payout_held_by: user.id,
          })
          .eq("id", escrow.id);

        if (error) throw error;

        toast({
          title: "Payout Held",
          description: "This escrow will be skipped by auto-release until unhold.",
        });
        fetchEscrows();
      } catch (error) {
        console.error("Hold error:", error);
        toast({
          title: "Error",
          description: "Failed to hold payout.",
          variant: "destructive",
        });
      } finally {
        setHoldingEscrowId(null);
      }
    } else {
      setHoldingEscrowId(escrow.id);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("booking_confirmations")
          .update({
            payout_held: false,
            payout_held_reason: null,
            payout_held_by: null,
          })
          .eq("id", escrow.id);

        if (error) throw error;

        toast({
          title: "Hold Removed",
          description: "This escrow is now eligible for auto-release.",
        });
        fetchEscrows();
      } catch (error) {
        console.error("Unhold error:", error);
        toast({
          title: "Error",
          description: "Failed to remove hold.",
          variant: "destructive",
        });
      } finally {
        setHoldingEscrowId(null);
      }
    }
  };

  const canReleaseFunds = (escrow: EscrowWithDetails) => {
    // Can release if verified and checkout date + 5 days has passed
    if (escrow.escrow_status !== "verified") return false;
    
    const checkoutDate = new Date(escrow.booking?.listing?.check_out_date);
    const releaseDate = addDays(checkoutDate, 5);
    return isPast(releaseDate);
  };

  const getDaysUntilRelease = (escrow: EscrowWithDetails) => {
    const checkoutDate = new Date(escrow.booking?.listing?.check_out_date);
    const releaseDate = addDays(checkoutDate, 5);
    return differenceInDays(releaseDate, new Date());
  };

  // Filter escrows
  const filteredEscrows = escrows.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      e.owner?.full_name?.toLowerCase().includes(q) ||
      e.owner?.email?.toLowerCase().includes(q) ||
      e.resort_confirmation_number?.toLowerCase().includes(q) ||
      e.booking?.listing?.property?.resort_name?.toLowerCase().includes(q) ||
      e.booking_id?.toLowerCase().includes(q) ||
      e.booking?.renter?.full_name?.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "all" || e.escrow_status === statusFilter;

    const matchesSource = sourceFilter === "all" ||
      ((e.booking as Record<string, unknown> | undefined)?.source_type ?? "pre_booked") === sourceFilter;

    const matchesDateRange = !dateRange?.from || isWithinInterval(
      new Date(e.created_at),
      { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to || dateRange.from) }
    );

    return matchesSearch && matchesStatus && matchesSource && matchesDateRange;
  });

  // Stats
  const pendingCount = escrows.filter((e) => e.escrow_status === "pending_confirmation").length;
  const needsVerificationCount = escrows.filter((e) => e.escrow_status === "confirmation_submitted").length;
  const verifiedCount = escrows.filter((e) => e.escrow_status === "verified").length;
  const readyForReleaseCount = escrows.filter((e) => canReleaseFunds(e)).length;
  const totalEscrowValue = escrows
    .filter((e) => !["released", "refunded"].includes(e.escrow_status))
    .reduce((sum, e) => sum + e.escrow_amount, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Escrow Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage booking escrow funds
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleAutoRelease}
            disabled={isAutoReleasing}
          >
            {isAutoReleasing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {isAutoReleasing ? "Running..." : "Run Auto-Release"}
          </Button>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending_confirmation">Awaiting Confirmation</SelectItem>
              <SelectItem value="confirmation_submitted">Needs Verification</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="released">Released</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="pre_booked">Pre-Booked Stay</SelectItem>
              <SelectItem value="wish_matched">Wish-Matched Stay</SelectItem>
            </SelectContent>
          </Select>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, resort, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Awaiting</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{needsVerificationCount}</p>
                <p className="text-sm text-muted-foreground">To Verify</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verifiedCount}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{readyForReleaseCount}</p>
                <p className="text-sm text-muted-foreground">Ready to Release</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/50 rounded-lg">
                <DollarSign className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalEscrowValue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">In Escrow</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Escrow Table */}
      <Card>
        <CardContent className="p-0">
          {filteredEscrows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No escrow records found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "Try different filters"
                  : "No active escrow records"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner / Property</TableHead>
                  <TableHead>Renter</TableHead>
                  <TableHead>Confirmation #</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Owner Status</TableHead>
                  <TableHead>Escrow Status</TableHead>
                  <TableHead>Deadline / Release</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEscrows.map((escrow) => {
                  const isReadyForRelease = canReleaseFunds(escrow);
                  const daysUntilRelease = getDaysUntilRelease(escrow);
                  
                  return (
                    <TableRow key={escrow.id}>
                      <TableCell>
                        <div>
                          <AdminEntityLink tab="users" search={escrow.owner?.email || ""} onNavigate={onNavigateToEntity}>
                            <p className="font-medium">{escrow.owner?.full_name || "Unknown"}</p>
                          </AdminEntityLink>
                          <p className="text-sm text-muted-foreground">
                            {escrow.booking?.listing?.property?.resort_name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <AdminEntityLink tab="users" search={escrow.booking?.renter?.email || ""} onNavigate={onNavigateToEntity}>
                            <p className="font-medium">{escrow.booking?.renter?.full_name || "Guest"}</p>
                          </AdminEntityLink>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(escrow.booking?.listing?.check_in_date), "MMM d")} -{" "}
                            {format(new Date(escrow.booking?.listing?.check_out_date), "MMM d")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {escrow.resort_confirmation_number ? (
                          <span className="font-mono">{escrow.resort_confirmation_number}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">${escrow.escrow_amount.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        {escrow.owner_confirmation_status ? (
                          <Badge variant={OWNER_CONFIRMATION_CONFIG[escrow.owner_confirmation_status]?.variant ?? "outline"}>
                            {OWNER_CONFIRMATION_CONFIG[escrow.owner_confirmation_status]?.label ?? "—"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge className={`${ESCROW_STATUS_CONFIG[escrow.escrow_status].color} flex items-center gap-1 w-fit`}>
                            {ESCROW_STATUS_CONFIG[escrow.escrow_status].icon}
                            {ESCROW_STATUS_CONFIG[escrow.escrow_status].label}
                          </Badge>
                          <ListingTypeBadge
                            type={((escrow.booking as Record<string, unknown> | undefined)?.source_type as "pre_booked" | "wish_matched") ?? "pre_booked"}
                            size="sm"
                          />
                          {escrow.payout_held && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600 w-fit text-xs">
                              <PauseCircle className="h-3 w-3 mr-1" />
                              Held
                            </Badge>
                          )}
                          {escrow.auto_released && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600 w-fit text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Auto-released
                            </Badge>
                          )}
                          {["pending_confirmation", "confirmation_submitted"].includes(escrow.escrow_status) && (
                            <AgeBadge date={escrow.created_at} useHours thresholds={{ warning: 1, critical: 3 }} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {escrow.escrow_status === "pending_confirmation" ? (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Timer className="h-4 w-4" />
                            <span className="text-sm">
                              {format(new Date(escrow.confirmation_deadline), "MMM d, h:mm a")}
                            </span>
                          </div>
                        ) : escrow.escrow_status === "verified" ? (
                          escrow.payout_held ? (
                            <div>
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                <PauseCircle className="h-3 w-3 mr-1" />
                                Held
                              </Badge>
                              {escrow.payout_held_reason && (
                                <p className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate" title={escrow.payout_held_reason}>
                                  {escrow.payout_held_reason}
                                </p>
                              )}
                            </div>
                          ) : isReadyForRelease ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Ready to Release
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {daysUntilRelease} days until release
                            </span>
                          )
                        ) : escrow.escrow_released_at ? (
                          <span className="text-sm text-muted-foreground">
                            Released {format(new Date(escrow.escrow_released_at), "MMM d")}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {escrow.escrow_status === "confirmation_submitted" && (
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setSelectedEscrow(escrow);
                                setVerificationNotes("");
                                setIsDetailsDialogOpen(true);
                              }}
                            >
                              Verify
                            </Button>
                          )}
                          {escrow.escrow_status === "verified" && (
                            <Button
                              size="sm"
                              variant={escrow.payout_held ? "default" : "outline"}
                              onClick={() => handleToggleHold(escrow)}
                              disabled={holdingEscrowId === escrow.id}
                            >
                              {holdingEscrowId === escrow.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : escrow.payout_held ? (
                                <PlayCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <PauseCircle className="h-3 w-3 mr-1" />
                              )}
                              {escrow.payout_held ? "Unhold" : "Hold"}
                            </Button>
                          )}
                          {isReadyForRelease && !escrow.payout_held && (
                            <Button
                              size="sm"
                              onClick={() => handleReleaseFunds(escrow)}
                            >
                              Release Funds
                            </Button>
                          )}
                          {["pending_confirmation", "confirmation_submitted", "verified"].includes(escrow.escrow_status) && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleRefund(escrow)}
                            >
                              Refund
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Verify Resort Confirmation</DialogTitle>
            <DialogDescription>
              Review the confirmation details and verify with the resort
            </DialogDescription>
          </DialogHeader>
          {selectedEscrow && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Resort</Label>
                  <p className="font-medium">{selectedEscrow.booking?.listing?.property?.resort_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="font-medium">{selectedEscrow.booking?.listing?.property?.location}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Confirmation #</Label>
                  <p className="font-mono font-medium">{selectedEscrow.resort_confirmation_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Escrow Amount</Label>
                  <p className="font-medium">${selectedEscrow.escrow_amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Check-in</Label>
                  <p className="font-medium">
                    {format(new Date(selectedEscrow.booking?.listing?.check_in_date), "PPP")}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Check-out</Label>
                  <p className="font-medium">
                    {format(new Date(selectedEscrow.booking?.listing?.check_out_date), "PPP")}
                  </p>
                </div>
              </div>

              {selectedEscrow.resort_contact_name && (
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-muted-foreground">Resort Contact</Label>
                  <p className="font-medium">{selectedEscrow.resort_contact_name}</p>
                  {selectedEscrow.resort_contact_phone && (
                    <p className="text-sm text-muted-foreground">{selectedEscrow.resort_contact_phone}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="verification-notes">Verification Notes</Label>
                <Textarea
                  id="verification-notes"
                  placeholder="Add notes about the verification process..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDetailsDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyConfirmation}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Verifying..." : "Confirm Verification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Release Funds Confirmation Dialog */}
      <AlertDialog open={!!escrowReleaseTarget} onOpenChange={(open) => { if (!open) setEscrowReleaseTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release Escrow Funds?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {escrowReleaseTarget && (
                  <div className="rounded-md border p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Owner</span>
                      <span className="font-medium">
                        {escrowReleaseTarget.owner?.full_name || escrowReleaseTarget.owner?.email || "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-semibold text-foreground">
                        ${escrowReleaseTarget.escrow_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Booking ID</span>
                      <span className="font-mono text-xs">{escrowReleaseTarget.booking_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-in</span>
                      <span>{format(new Date(escrowReleaseTarget.booking?.listing?.check_in_date), "PPP")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-out</span>
                      <span>{format(new Date(escrowReleaseTarget.booking?.listing?.check_out_date), "PPP")}</span>
                    </div>
                  </div>
                )}
                <p className="text-destructive font-medium">
                  This action cannot be undone. Funds will be released to the owner.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReleaseFunds}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Release Funds
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminEscrow;
