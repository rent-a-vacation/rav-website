import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Calendar, MapPin, Edit, Trash2, XCircle, Gavel, Eye, ShieldCheck, Building2 } from "lucide-react";
import { PricingSuggestion } from "@/components/owner/PricingSuggestion";
import { ListingLimitUpsell } from "@/components/subscription/ListingLimitUpsell";
import { useCheckListingLimit } from "@/hooks/useCheckListingLimit";
import { format, formatDistanceToNow, isPast } from "date-fns";
import type { Property, Listing, ListingStatus, CancellationPolicy, Database } from "@/types/database";
import { CANCELLATION_POLICY_LABELS, CANCELLATION_POLICY_DESCRIPTIONS } from "@/types/database";
import { OpenForBiddingDialog } from "@/components/bidding/OpenForBiddingDialog";
import { BidsManagerDialog } from "@/components/bidding/BidsManagerDialog";
import { ActionSuccessCard } from "@/components/ActionSuccessCard";
import { sendListingSubmittedEmail } from "@/lib/email";
import { ListingFairValueBadge } from "@/components/fair-value/ListingFairValueBadge";
import { DemandSignal } from "@/components/bidding/DemandSignal";
import { calculateNights, computeListingPricing } from "@/lib/pricing";

type ListingInsert = Database['public']['Tables']['listings']['Insert'];
type ListingUpdate = Database['public']['Tables']['listings']['Update'];

type ListingWithProperty = Listing & { 
  property: Property;
  open_for_bidding?: boolean;
  bidding_ends_at?: string | null;
  min_bid_amount?: number | null;
  reserve_price?: number | null;
  allow_counter_offers?: boolean;
  cancellation_policy: CancellationPolicy;
};

const STATUS_COLORS: Record<ListingStatus, string> = {
  draft: "bg-gray-500",
  pending_approval: "bg-yellow-500",
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

interface ListingFormData {
  property_id: string;
  check_in_date: string;
  check_out_date: string;
  nightly_rate: number;
  cleaning_fee: number;
  resort_fee: number;
  notes: string;
  cancellation_policy: CancellationPolicy;
}

const initialFormData: ListingFormData = {
  property_id: "",
  check_in_date: "",
  check_out_date: "",
  nightly_rate: 0,
  cleaning_fee: 0,
  resort_fee: 0,
  notes: "",
  cancellation_policy: "moderate",
};

const OwnerListings = () => {
  const { user } = useAuth();
  const { canCreate, currentCount, maxListings, tierName } = useCheckListingLimit();
  const [listings, setListings] = useState<ListingWithProperty[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingListing, setEditingListing] = useState<ListingWithProperty | null>(null);
  const [formData, setFormData] = useState<ListingFormData>(initialFormData);
  const [listingSuccess, setListingSuccess] = useState(false);

  // Bidding dialog states
  const [biddingDialogOpen, setBiddingDialogOpen] = useState(false);
  const [bidsManagerOpen, setBidsManagerOpen] = useState(false);
  const [selectedListingForBidding, setSelectedListingForBidding] = useState<ListingWithProperty | null>(null);

  // Fetch listings and properties
  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", user.id)
        .order("resort_name");

      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);

      // Fetch listings with property details
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select(`
          *,
          property:properties(*)
        `)
        .eq("owner_id", user.id)
        .order("check_in_date", { ascending: true });

      if (listingsError) throw listingsError;
      setListings(listingsData as ListingWithProperty[] || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load listings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.property_id) {
      toast.error("Please select a property");
      return;
    }

    if (new Date(formData.check_out_date) <= new Date(formData.check_in_date)) {
      toast.error("Check-out date must be after check-in date");
      return;
    }

    setIsSaving(true);
    try {
      if (editingListing) {
        // Update existing (only allow editing draft/pending listings)
        if (!["draft", "pending_approval"].includes(editingListing.status)) {
          toast.error("Cannot edit a listing that is already active or booked");
          setIsSaving(false);
          return;
        }

        const nights = calculateNights(formData.check_in_date, formData.check_out_date);
        const pricing = computeListingPricing(formData.nightly_rate, nights);

        const updateData: ListingUpdate = {
          property_id: formData.property_id,
          check_in_date: formData.check_in_date,
          check_out_date: formData.check_out_date,
          nightly_rate: formData.nightly_rate,
          cleaning_fee: formData.cleaning_fee || 0,
          resort_fee: formData.resort_fee || 0,
          owner_price: pricing.ownerPrice,
          rav_markup: pricing.ravMarkup,
          final_price: pricing.finalPrice,
          notes: formData.notes || null,
          cancellation_policy: formData.cancellation_policy,
          status: "pending_approval",
        };

        const { error } = await supabase
          .from("listings")
          .update(updateData as never)
          .eq("id", editingListing.id);

        if (error) throw error;
      } else {
        // Create new
        const newNights = calculateNights(formData.check_in_date, formData.check_out_date);
        const newPricing = computeListingPricing(formData.nightly_rate, newNights);

        const insertData: ListingInsert = {
          property_id: formData.property_id,
          owner_id: user.id,
          check_in_date: formData.check_in_date,
          check_out_date: formData.check_out_date,
          nightly_rate: formData.nightly_rate,
          cleaning_fee: formData.cleaning_fee || 0,
          resort_fee: formData.resort_fee || 0,
          owner_price: newPricing.ownerPrice,
          rav_markup: newPricing.ravMarkup,
          final_price: newPricing.finalPrice,
          notes: formData.notes || null,
          cancellation_policy: formData.cancellation_policy,
          status: "pending_approval",
        };

        const { error } = await supabase
          .from("listings")
          .insert(insertData as never);

        if (error) throw error;
      }

      // Fire confirmation email (fire-and-forget)
      const selectedProperty = properties.find(p => p.id === formData.property_id);
      if (user.email && selectedProperty) {
        const emailNights = calculateNights(formData.check_in_date, formData.check_out_date);
        const emailPricing = computeListingPricing(formData.nightly_rate, emailNights);
        sendListingSubmittedEmail(
          user.email,
          user.user_metadata?.full_name || "",
          {
            resortName: selectedProperty.resort_name,
            location: selectedProperty.location,
            checkIn: formData.check_in_date,
            checkOut: formData.check_out_date,
            price: emailPricing.ownerPrice,
            nightlyRate: formData.nightly_rate,
            nights: emailNights,
          }
        ).catch(console.error);
      }

      setListingSuccess(true);
      fetchData();
    } catch (error: unknown) {
      console.error("Error saving listing:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save listing");
    } finally {
      setIsSaving(false);
    }
  };

  // Open edit dialog
  const handleEdit = (listing: ListingWithProperty) => {
    if (!["draft", "pending_approval"].includes(listing.status)) {
      toast.error("Cannot edit a listing that is already active or booked");
      return;
    }

    setEditingListing(listing);
    const editNights = calculateNights(listing.check_in_date, listing.check_out_date);
    const editNightlyRate = (listing as { nightly_rate?: number }).nightly_rate
      || (editNights > 0 ? Math.round(listing.owner_price / editNights) : 0);
    setFormData({
      property_id: listing.property_id,
      check_in_date: listing.check_in_date,
      check_out_date: listing.check_out_date,
      nightly_rate: editNightlyRate,
      cleaning_fee: (listing as { cleaning_fee?: number }).cleaning_fee || 0,
      resort_fee: (listing as { resort_fee?: number }).resort_fee || 0,
      notes: listing.notes || "",
      cancellation_policy: listing.cancellation_policy || "moderate",
    });
    setIsDialogOpen(true);
  };

  // Handle cancel listing
  const handleCancel = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from("listings")
        .update({ status: "cancelled" } as never)
        .eq("id", listingId);

      if (error) throw error;
      toast.success("Listing cancelled");
      fetchData();
    } catch (error: unknown) {
      console.error("Error cancelling listing:", error);
      toast.error(error instanceof Error ? error.message : "Failed to cancel listing");
    }
  };

  // Handle delete listing
  const handleDelete = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listingId);

      if (error) throw error;
      toast.success("Listing deleted");
      fetchData();
    } catch (error: unknown) {
      console.error("Error deleting listing:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete listing");
    }
  };

  // Reset form on dialog close
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingListing(null);
      setFormData(initialFormData);
      setListingSuccess(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Your Listings</h2>
          <p className="text-muted-foreground">
            Create and manage your rental listings
          </p>
        </div>
        <div className="flex items-center gap-3">
          {maxListings !== null && (
            <span className="text-sm text-muted-foreground">
              {currentCount}/{maxListings} listings
            </span>
          )}
          <Button
            disabled={properties.length === 0}
            onClick={() => {
              if (!canCreate) {
                setUpsellOpen(true);
              } else {
                setIsDialogOpen(true);
              }
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Listing
          </Button>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogContent className="max-w-lg">
            {listingSuccess ? (
              <ActionSuccessCard
                title={editingListing ? "Listing Updated & Resubmitted!" : "Listing Submitted for Review!"}
                description="Our team reviews listings within 24 hours. You'll receive an email when your listing is approved and goes live."
                emailSent
                actions={[{ label: "Done", onClick: () => handleDialogChange(false) }]}
              />
            ) : (
            <>
            <DialogHeader>
              <DialogTitle>
                {editingListing ? "Edit Listing" : "Create New Listing"}
              </DialogTitle>
              <DialogDescription>
                {editingListing
                  ? "Update your listing details"
                  : "Select a property and enter availability dates"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="property">Property</Label>
                <Select
                  value={formData.property_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, property_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.resort_name} - {property.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Don't see your property?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => {
                      handleDialogChange(false);
                      const url = new URL(window.location.href);
                      url.searchParams.set("tab", "properties");
                      window.history.replaceState({}, "", url.toString());
                      window.dispatchEvent(new PopStateEvent("popstate"));
                    }}
                  >
                    Add it in the Properties tab first
                  </button>
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="check_in_date">Check-in Date</Label>
                  <Input
                    id="check_in_date"
                    type="date"
                    value={formData.check_in_date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, check_in_date: e.target.value }))
                    }
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="check_out_date">Check-out Date</Label>
                  <Input
                    id="check_out_date"
                    type="date"
                    value={formData.check_out_date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, check_out_date: e.target.value }))
                    }
                    min={formData.check_in_date || new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              {/* Demand signal — shows matching travel requests */}
              {formData.property_id && formData.check_in_date && (() => {
                const selectedProp = properties.find(p => p.id === formData.property_id);
                return selectedProp ? (
                  <DemandSignal
                    destination={selectedProp.location || selectedProp.resort_name || ""}
                    checkInDate={formData.check_in_date}
                    bedrooms={selectedProp.bedrooms || 1}
                  />
                ) : null;
              })()}

              <div className="space-y-2">
                <Label htmlFor="nightly_rate">Nightly Rate ($)</Label>
                <Input
                  id="nightly_rate"
                  type="number"
                  min={0}
                  step={1}
                  value={formData.nightly_rate || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nightly_rate: parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="Enter your nightly rate"
                  required
                />
                {formData.nightly_rate > 0 && formData.check_in_date && formData.check_out_date && (() => {
                  const formNights = calculateNights(formData.check_in_date, formData.check_out_date);
                  const formPricing = computeListingPricing(formData.nightly_rate, formNights);
                  return formNights > 0 ? (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{formNights} nights x ${formData.nightly_rate}/night</span>
                        <span className="font-medium">${formPricing.ownerPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">RAV service fee (15%)</span>
                        <span>${formPricing.ravMarkup.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>Traveler pays</span>
                        <span>${formPricing.finalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : null;
                })()}
                {(() => {
                  const priceProp = properties.find(p => p.id === formData.property_id);
                  return priceProp ? (
                    <PricingSuggestion
                      currentRate={formData.nightly_rate}
                      brand={priceProp.brand}
                      location={priceProp.location}
                      bedrooms={priceProp.bedrooms}
                      checkInDate={formData.check_in_date}
                    />
                  ) : null;
                })()}
                <p className="text-xs text-muted-foreground">
                  Set your per-night rate. Your earnings and the traveler's total price are computed automatically.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cleaning_fee">Cleaning Fee ($)</Label>
                  <Input
                    id="cleaning_fee"
                    type="number"
                    min={0}
                    step={1}
                    value={formData.cleaning_fee || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, cleaning_fee: parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">Optional. Passed through to you.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resort_fee">Resort Fee ($)</Label>
                  <Input
                    id="resort_fee"
                    type="number"
                    min={0}
                    step={1}
                    value={formData.resort_fee || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, resort_fee: parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">Paid at resort, not collected by RAV.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancellation_policy">Cancellation Policy</Label>
                <Select
                  value={formData.cancellation_policy}
                  onValueChange={(value: CancellationPolicy) =>
                    setFormData((prev) => ({ ...prev, cancellation_policy: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cancellation policy" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CANCELLATION_POLICY_LABELS) as CancellationPolicy[]).map((policy) => (
                      <SelectItem key={policy} value={policy}>
                        <div className="flex flex-col">
                          <span className="font-medium">{CANCELLATION_POLICY_LABELS[policy]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {CANCELLATION_POLICY_DESCRIPTIONS[formData.cancellation_policy]}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Any special notes about this listing..."
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingListing ? "Update" : "Submit for Approval"}
                </Button>
              </DialogFooter>
            </form>
            </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {properties.length === 0 && (
        <Card className="border-dashed mb-6">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-2">No properties registered yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your vacation club property first, then you can create listings for it.
            </p>
            <Button onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set("tab", "properties");
              window.history.replaceState({}, "", url.toString());
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your Property
            </Button>
          </CardContent>
        </Card>
      )}

      {listings.length === 0 && properties.length > 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first listing to start accepting bookings
            </p>
            <Button onClick={() => canCreate ? setIsDialogOpen(true) : setUpsellOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Listing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={
                        listing.status === 'active' && isPast(new Date(listing.check_out_date))
                          ? 'bg-orange-500'
                          : STATUS_COLORS[listing.status]
                      }>
                        {listing.status === 'active' && isPast(new Date(listing.check_out_date))
                          ? 'Expired'
                          : STATUS_LABELS[listing.status]}
                      </Badge>
                      {/* Bidding Status Badge */}
                      {listing.open_for_bidding && listing.bidding_ends_at && (
                        isPast(new Date(listing.bidding_ends_at)) ? (
                          <Badge variant="outline" className="text-muted-foreground">
                            Bidding Ended
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-accent text-accent-foreground">
                            <Gavel className="h-3 w-3 mr-1" />
                            Bidding Open
                          </Badge>
                        )
                      )}
                    </div>
                    <CardTitle className="text-lg">
                      {listing.property?.resort_name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {listing.property?.location}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Final Price</p>
                    <p className="text-xl font-bold">${listing.final_price.toLocaleString()}</p>
                    {listing.rav_markup > 0 && (
                      <p className="text-xs text-muted-foreground">
                        (Your price: ${listing.owner_price.toLocaleString()})
                      </p>
                    )}
                    <ListingFairValueBadge listingId={listing.id} />
                    {/* Bidding End Time */}
                    {listing.open_for_bidding && listing.bidding_ends_at && !isPast(new Date(listing.bidding_ends_at)) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Ends {formatDistanceToNow(new Date(listing.bidding_ends_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(listing.check_in_date), "MMM d, yyyy")} -{" "}
                      {format(new Date(listing.check_out_date), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {CANCELLATION_POLICY_LABELS[listing.cancellation_policy] || 'Moderate'} cancellation
                    </span>
                  </div>
                </div>

                {listing.notes && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {listing.notes}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {/* Bidding Controls */}
                  {listing.status === 'active' && (
                    <>
                      {listing.open_for_bidding && listing.bidding_ends_at && !isPast(new Date(listing.bidding_ends_at)) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedListingForBidding(listing);
                            setBidsManagerOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-3 w-3" />
                          View Bids
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedListingForBidding(listing);
                            setBiddingDialogOpen(true);
                          }}
                        >
                          <Gavel className="mr-2 h-3 w-3" />
                          Open for Bidding
                        </Button>
                      )}
                    </>
                  )}

                  {["draft", "pending_approval"].includes(listing.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(listing)}
                    >
                      <Edit className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                  )}

                  {["draft", "pending_approval", "active"].includes(listing.status) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <XCircle className="mr-2 h-3 w-3" />
                          Cancel
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Listing?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will cancel the listing and it will no longer be available
                            for booking. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Listing</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleCancel(listing.id)}>
                            Cancel Listing
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {["draft", "cancelled"].includes(listing.status) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this listing. This action cannot
                            be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(listing.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Open for Bidding Dialog */}
      {selectedListingForBidding && (
        <OpenForBiddingDialog
          listingId={selectedListingForBidding.id}
          listingPrice={selectedListingForBidding.final_price}
          open={biddingDialogOpen}
          onOpenChange={(open) => {
            setBiddingDialogOpen(open);
            if (!open) {
              setSelectedListingForBidding(null);
              fetchData(); // Refresh listings
            }
          }}
        />
      )}

      {/* Bids Manager Dialog */}
      {selectedListingForBidding && (
        <BidsManagerDialog
          listingId={selectedListingForBidding.id}
          listingTitle={`${selectedListingForBidding.property?.resort_name} - ${format(new Date(selectedListingForBidding.check_in_date), 'MMM d')} to ${format(new Date(selectedListingForBidding.check_out_date), 'MMM d, yyyy')}`}
          open={bidsManagerOpen}
          onOpenChange={(open) => {
            setBidsManagerOpen(open);
            if (!open) setSelectedListingForBidding(null);
          }}
        />
      )}

      {/* Listing Limit Upsell Dialog */}
      {maxListings !== null && tierName && (
        <ListingLimitUpsell
          open={upsellOpen}
          onOpenChange={setUpsellOpen}
          currentCount={currentCount}
          maxListings={maxListings}
          tierName={tierName}
        />
      )}
    </div>
  );
};

export default OwnerListings;
