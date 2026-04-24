import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Calendar, MapPin, Search, Check, X, DollarSign, Loader2, Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import type { Listing, Property, Profile, ListingStatus } from "@/types/database";
import { AdminEntityLink, type AdminNavigationProps } from "./AdminEntityLink";
import { AgeBadge } from "./AgeBadge";
import AdminListingEditDialog from "./AdminListingEditDialog";
import { ProofVerifyDialog } from "./ProofVerifyDialog";
import {
  PROOF_STATUS_LABELS,
  PROOF_STATUS_BADGE_CLASSES,
} from "@/lib/listingProof";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Gavel, HelpCircle, Shield } from "lucide-react";

const REJECTION_TEMPLATES = [
  "Incomplete property details",
  "Photos do not meet quality standards",
  "Pricing appears unrealistic",
  "Duplicate listing",
];

interface ListingWithDetails extends Listing {
  property: Property;
  owner: Profile;
}

const STATUS_COLORS: Record<ListingStatus, string> = {
  draft: "bg-gray-500",
  pending_approval: "bg-orange-500",
  active: "bg-green-500",
  booked: "bg-blue-500",
  completed: "bg-purple-500",
  cancelled: "bg-red-500",
};

const STATUS_LABELS: Record<ListingStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  active: "Active",
  booked: "Booked",
  completed: "Completed",
  cancelled: "Cancelled",
};

const AdminListings = ({ initialSearch = "", onNavigateToEntity }: AdminNavigationProps) => {
  const { user, isRavAdmin } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<ListingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingListingId, setRejectingListingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkRejecting, setIsBulkRejecting] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [editListing, setEditListing] = useState<ListingWithDetails | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // #376 proof verify dialog
  const [proofListing, setProofListing] = useState<ListingWithDetails | null>(null);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);

  useEffect(() => {
    if (initialSearch) setSearchQuery(initialSearch);
  }, [initialSearch]);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          property:properties(*),
          owner:profiles!listings_owner_id_fkey(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setListings(data as ListingWithDetails[] || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const sendApprovalEmail = async (ownerId: string, action: "approved" | "rejected") => {
    try {
      await supabase.functions.invoke("send-approval-email", {
        body: {
          user_id: ownerId,
          action,
          email_type: "user_approval",
        },
      });
    } catch (err) {
      console.error("Failed to send listing approval email:", err);
    }
  };

  const handleApprove = async (listingId: string) => {
    try {
      const listing = listings.find((l) => l.id === listingId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("listings")
        .update({
          status: "active",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", listingId);

      if (error) throw error;

      // Send approval email to listing owner (non-blocking)
      if (listing?.owner?.id) {
        sendApprovalEmail(listing.owner.id, "approved");
      }

      // Trigger travel request matching (fire-and-forget)
      supabase.functions.invoke("match-travel-requests", {
        body: { listing_id: listingId },
      }).catch((err) => console.error("Match trigger failed:", err));

      toast({
        title: "Listing Approved",
        description: "The listing is now active and visible to renters.",
      });

      fetchListings();
    } catch (error) {
      console.error("Error approving listing:", error);
      toast({
        title: "Error",
        description: "Failed to approve listing.",
        variant: "destructive",
      });
    }
  };

  const openRejectDialog = (listingId: string) => {
    setRejectingListingId(listingId);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingListingId || !rejectionReason.trim()) return;

    try {
      const listing = listings.find((l) => l.id === rejectingListingId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("listings")
        .update({
          status: "cancelled",
          rejection_reason: rejectionReason.trim(),
        })
        .eq("id", rejectingListingId);

      if (error) throw error;

      // Send rejection email to listing owner (non-blocking)
      if (listing?.owner?.id) {
        sendApprovalEmail(listing.owner.id, "rejected");
      }

      toast({
        title: "Listing Rejected",
        description: "The listing has been rejected with a reason.",
      });

      setRejectDialogOpen(false);
      setRejectingListingId(null);
      fetchListings();
    } catch (error) {
      console.error("Error rejecting listing:", error);
      toast({
        title: "Error",
        description: "Failed to reject listing.",
        variant: "destructive",
      });
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    let successCount = 0;

    for (const id of selectedIds) {
      try {
        const listing = listings.find((l) => l.id === id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("listings")
          .update({
            status: "active",
            approved_by: user?.id,
            approved_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (error) throw error;
        successCount++;

        // Send approval email (non-blocking)
        if (listing?.owner?.id) {
          sendApprovalEmail(listing.owner.id, "approved");
        }

        // Trigger travel request matching (fire-and-forget)
        supabase.functions.invoke("match-travel-requests", {
          body: { listing_id: id },
        }).catch((err) => console.error("Match trigger failed:", err));
      } catch (error) {
        console.error(`Error approving listing ${id}:`, error);
      }
    }

    toast({
      title: "Bulk Approve Complete",
      description: `${successCount} of ${selectedIds.size} listings approved.`,
    });
    setSelectedIds(new Set());
    setIsBulkProcessing(false);
    fetchListings();
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0 || !rejectionReason.trim()) return;
    setIsBulkProcessing(true);
    let successCount = 0;

    for (const id of selectedIds) {
      try {
        const listing = listings.find((l) => l.id === id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("listings")
          .update({
            status: "cancelled",
            rejection_reason: rejectionReason.trim(),
          })
          .eq("id", id);

        if (error) throw error;
        successCount++;

        if (listing?.owner?.id) {
          sendApprovalEmail(listing.owner.id, "rejected");
        }
      } catch (error) {
        console.error(`Error rejecting listing ${id}:`, error);
      }
    }

    toast({
      title: "Bulk Reject Complete",
      description: `${successCount} of ${selectedIds.size} listings rejected.`,
    });
    setSelectedIds(new Set());
    setIsBulkProcessing(false);
    setRejectDialogOpen(false);
    setIsBulkRejecting(false);
    fetchListings();
  };

  const openBulkRejectDialog = () => {
    setIsBulkRejecting(true);
    setRejectingListingId(null);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const uniqueOwners = useMemo(() => {
    const ownerMap = new Map<string, { id: string; full_name: string; email: string }>();
    for (const l of listings) {
      if (l.owner?.id && !ownerMap.has(l.owner.id)) {
        ownerMap.set(l.owner.id, {
          id: l.owner.id,
          full_name: l.owner.full_name || "Unknown",
          email: l.owner.email || "",
        });
      }
    }
    return Array.from(ownerMap.values()).sort((a, b) =>
      a.full_name.localeCompare(b.full_name)
    );
  }, [listings]);

  const filteredListings = listings.filter((l) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      l.property?.resort_name?.toLowerCase().includes(q) ||
      l.property?.location?.toLowerCase().includes(q) ||
      l.owner?.full_name?.toLowerCase().includes(q) ||
      l.owner?.email?.toLowerCase().includes(q) ||
      l.id.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    const matchesOwner = ownerFilter === "all" || l.owner?.id === ownerFilter;

    return matchesSearch && matchesStatus && matchesOwner;
  });

  const pendingCount = listings.filter((l) => l.status === "pending_approval").length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">All Listings</h2>
          <p className="text-muted-foreground">
            {listings.length} listings • {pendingCount} pending approval
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              {uniqueOwners.map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>
                  {owner.full_name} ({owner.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, location, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No listings found</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || statusFilter !== "all" ? "Try different filters" : "No listings have been created yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        filteredListings.filter((l) => l.status === "pending_approval").length > 0 &&
                        filteredListings
                          .filter((l) => l.status === "pending_approval")
                          .every((l) => selectedIds.has(l.id))
                      }
                      onCheckedChange={(checked) => {
                        const pendingIds = filteredListings
                          .filter((l) => l.status === "pending_approval")
                          .map((l) => l.id);
                        if (checked) {
                          setSelectedIds(new Set([...selectedIds, ...pendingIds]));
                        } else {
                          const next = new Set(selectedIds);
                          pendingIds.forEach((id) => next.delete(id));
                          setSelectedIds(next);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1">
                        Model
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Direct booking vs. open for Offers. Bidding Open means travelers can submit Offers until the deadline.
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1">
                        Proof
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Reservation proof verification status. Only Pre-Booked Stays require proof — Wish-Matched confirm post-acceptance.
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      {listing.status === "pending_approval" ? (
                        <Checkbox
                          checked={selectedIds.has(listing.id)}
                          onCheckedChange={() => toggleSelected(listing.id)}
                        />
                      ) : (
                        <span />
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{listing.property?.resort_name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {listing.property?.location}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AdminEntityLink tab="users" search={listing.owner?.email || ""} onNavigate={onNavigateToEntity}>
                        <p className="text-sm font-medium">{listing.owner?.full_name || "Unknown"}</p>
                      </AdminEntityLink>
                      <p className="text-xs text-muted-foreground">{listing.owner?.email}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {format(new Date(listing.check_in_date), "MMM d")} -{" "}
                        {format(new Date(listing.check_out_date), "MMM d, yyyy")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-medium">${listing.final_price.toLocaleString()}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Owner: ${listing.owner_price.toLocaleString()} • Markup: ${listing.rav_markup.toLocaleString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {listing.open_for_bidding ? (
                        <Badge variant="outline" className="border-amber-400 text-amber-700">
                          <Gavel className="h-3 w-3 mr-1" />
                          Bidding
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-400 text-emerald-700">
                          Direct
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={PROOF_STATUS_BADGE_CLASSES[listing.proof_status ?? "not_required"]}
                      >
                        {PROOF_STATUS_LABELS[listing.proof_status ?? "not_required"]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge className={STATUS_COLORS[listing.status]}>
                          {STATUS_LABELS[listing.status]}
                        </Badge>
                        {listing.status === "pending_approval" && (
                          <AgeBadge date={listing.created_at} thresholds={{ warning: 2, critical: 5 }} />
                        )}
                        {listing.status === "cancelled" && listing.rejection_reason && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate" title={listing.rejection_reason}>
                            {listing.rejection_reason}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(listing.proof_status === "submitted" || listing.proof_status === "rejected") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-primary"
                            onClick={() => {
                              setProofListing(listing);
                              setProofDialogOpen(true);
                            }}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            {listing.proof_status === "rejected" ? "View Proof" : "Verify Proof"}
                          </Button>
                        )}
                        {listing.status === "pending_approval" && (() => {
                          const proofBlocksApprove =
                            listing.source_type === "pre_booked" &&
                            listing.proof_status !== "verified";
                          return (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-600 hover:text-green-700"
                                      onClick={() => handleApprove(listing.id)}
                                      disabled={proofBlocksApprove}
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {proofBlocksApprove && (
                                  <TooltipContent side="top">
                                    Reservation proof must be verified before this Pre-Booked Stay can go active.
                                  </TooltipContent>
                                )}
                              </Tooltip>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => openRejectDialog(listing.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          );
                        })()}
                        {isRavAdmin() && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditListing(listing);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg px-6 py-3 flex items-center gap-4">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleBulkApprove}
            disabled={isBulkProcessing}
          >
            {isBulkProcessing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            Approve All
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={openBulkRejectDialog}
            disabled={isBulkProcessing}
          >
            <X className="h-4 w-4 mr-1" />
            Reject All
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={(open) => {
        setRejectDialogOpen(open);
        if (!open) setIsBulkRejecting(false);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isBulkRejecting ? `Reject ${selectedIds.size} Listings` : "Reject Listing"}
            </DialogTitle>
            <DialogDescription>
              {isBulkRejecting
                ? `Provide a reason for rejecting ${selectedIds.size} listings. All owners will see this.`
                : "Provide a reason for rejecting this listing. The owner will see this."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-wrap gap-2">
              {REJECTION_TEMPLATES.map((template) => (
                <Button
                  key={template}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setRejectionReason(
                    rejectionReason ? `${rejectionReason}\n${template}` : template
                  )}
                >
                  {template}
                </Button>
              ))}
            </div>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={isBulkRejecting ? handleBulkReject : handleReject}
              disabled={!rejectionReason.trim() || isBulkProcessing}
            >
              {isBulkProcessing ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : null}
              {isBulkRejecting ? `Reject ${selectedIds.size} Listings` : "Reject Listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminListingEditDialog
        listing={editListing}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSaved={fetchListings}
      />

      <ProofVerifyDialog
        listing={proofListing}
        open={proofDialogOpen}
        onOpenChange={(open) => {
          setProofDialogOpen(open);
          if (!open) setProofListing(null);
        }}
        onVerified={fetchListings}
        onRejected={fetchListings}
      />
    </div>
  );
};

export default AdminListings;
