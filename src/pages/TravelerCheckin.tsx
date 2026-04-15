import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Home,
  Loader2,
  MapPin,
  Phone,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { format, isPast, differenceInHours } from "date-fns";
import type { Booking, Listing, Property, Profile } from "@/types/database";

interface CheckinConfirmation {
  id: string;
  booking_id: string;
  traveler_id: string;
  confirmed_arrival: boolean | null;
  confirmed_at: string | null;
  confirmation_deadline: string;
  issue_reported: boolean;
  issue_type: string | null;
  issue_description: string | null;
  issue_reported_at: string | null;
  resolved: boolean;
  created_at: string;
}

interface CheckinWithDetails extends CheckinConfirmation {
  booking: Booking & {
    listing: Listing & { property: Property };
  };
}

const ISSUE_TYPES = [
  { value: "no_access", label: "Cannot access the property" },
  { value: "wrong_unit", label: "Wrong unit or property" },
  { value: "not_as_described", label: "Property not as described" },
  { value: "cleanliness", label: "Cleanliness issues" },
  { value: "amenities_missing", label: "Missing amenities" },
  { value: "safety_concern", label: "Safety concern" },
  { value: "other", label: "Other issue" },
];

const TravelerCheckin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [checkins, setCheckins] = useState<CheckinWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCheckin, setSelectedCheckin] = useState<CheckinWithDetails | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [confirmationType, setConfirmationType] = useState<"success" | "issue">("success");
  const [issueType, setIssueType] = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  const bookingId = searchParams.get("booking");

  const fetchCheckins = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from("checkin_confirmations")
        .select(`
          *,
          booking:bookings(
            *,
            listing:listings(
              *,
              property:properties(*)
            )
          )
        `)
        .eq("traveler_id", user.id)
        .order("confirmation_deadline", { ascending: true });

      if (bookingId) {
        query = query.eq("booking_id", bookingId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCheckins(data as CheckinWithDetails[] || []);
    } catch (error) {
      console.error("Error fetching checkins:", error);
      toast({
        title: "Error",
        description: "Failed to load check-in confirmations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, bookingId, toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?redirect=/checkin");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCheckins();
    }
  }, [user, fetchCheckins]);

  const handleConfirmArrival = async () => {
    if (!selectedCheckin) return;

    setIsSubmitting(true);
    try {
      if (confirmationType === "success") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("checkin_confirmations")
          .update({
            confirmed_arrival: true,
            confirmed_at: new Date().toISOString(),
            issue_reported: false,
          })
          .eq("id", selectedCheckin.id);

        if (error) throw error;

        toast({
          title: "Check-in Confirmed!",
          description: "Thank you for confirming your arrival. Enjoy your stay!",
        });
      } else {
        // Report issue
        if (!issueType || !issueDescription.trim()) {
          toast({
            title: "Error",
            description: "Please select an issue type and provide details.",
            variant: "destructive",
          });
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("checkin_confirmations")
          .update({
            confirmed_arrival: false,
            confirmed_at: new Date().toISOString(),
            issue_reported: true,
            issue_type: issueType,
            issue_description: issueDescription.trim(),
            issue_reported_at: new Date().toISOString(),
          })
          .eq("id", selectedCheckin.id);

        if (error) throw error;

        toast({
          title: "Issue Reported",
          description: "We've received your report and will contact you shortly.",
        });
      }

      setIsConfirmDialogOpen(false);
      setIsReportDialogOpen(false);
      fetchCheckins();
    } catch (error) {
      console.error("Error updating checkin:", error);
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openConfirmDialog = (checkin: CheckinWithDetails) => {
    setSelectedCheckin(checkin);
    setConfirmationType("success");
    setIssueType("");
    setIssueDescription("");
    setIsConfirmDialogOpen(true);
  };

  const getTimeRemaining = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const hoursRemaining = differenceInHours(deadlineDate, new Date());

    if (isPast(deadlineDate)) {
      return { expired: true, text: "Deadline passed", urgent: true };
    }

    if (hoursRemaining < 6) {
      return { expired: false, text: `${hoursRemaining}h remaining`, urgent: true };
    }

    return { expired: false, text: `${hoursRemaining}h remaining`, urgent: false };
  };

  // Filter checkins
  const pendingCheckins = checkins.filter(
    (c) => c.confirmed_arrival === null && !isPast(new Date(c.confirmation_deadline))
  );
  const confirmedCheckins = checkins.filter((c) => c.confirmed_arrival === true);
  const issueCheckins = checkins.filter((c) => c.issue_reported === true);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading check-in confirmations...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Page Header */}
      <header className="border-b border-border/60 bg-card mt-16 md:mt-20">
        <div className="container mx-auto px-4 py-5 md:py-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight">Check-in Confirmation</h1>
              <p className="text-sm text-muted-foreground">
                Confirm your arrival within 24 hours of check-in.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8 max-w-3xl">
        {/* Pending Checkins */}
        {pendingCheckins.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Action Required ({pendingCheckins.length})
            </h2>
            {pendingCheckins.map((checkin) => {
              const timeInfo = getTimeRemaining(checkin.confirmation_deadline);
              return (
                <Card 
                  key={checkin.id} 
                  className={timeInfo.urgent ? "border-yellow-500" : ""}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {checkin.booking?.listing?.property?.resort_name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {checkin.booking?.listing?.property?.location}
                        </CardDescription>
                      </div>
                      <Badge className={timeInfo.urgent ? "bg-yellow-500" : "bg-blue-500"}>
                        <Clock className="mr-1 h-3 w-3" />
                        {timeInfo.text}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {format(new Date(checkin.booking?.listing?.check_in_date), "EEEE, MMMM d")}
                          </p>
                          <p className="text-sm text-muted-foreground">Check-in date</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Home className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {checkin.booking?.listing?.property?.bedrooms} BR • Sleeps {checkin.booking?.listing?.property?.sleeps}
                          </p>
                          <p className="text-sm text-muted-foreground">Property details</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Please confirm your check-in within 24 hours of arrival. This helps protect your booking and ensures escrow funds are processed correctly.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        className="flex-1" 
                        onClick={() => openConfirmDialog(checkin)}
                      >
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        Confirm Check-in
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedCheckin(checkin);
                          setConfirmationType("issue");
                          setIssueType("");
                          setIssueDescription("");
                          setIsReportDialogOpen(true);
                        }}
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Report Issue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Confirmed Checkins */}
        {confirmedCheckins.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Confirmed ({confirmedCheckins.length})
            </h2>
            {confirmedCheckins.map((checkin) => (
              <Card key={checkin.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {checkin.booking?.listing?.property?.resort_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {checkin.booking?.listing?.property?.location}
                      </CardDescription>
                    </div>
                    <Badge className="bg-green-500">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Checked In
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(checkin.booking?.listing?.check_in_date), "MMM d")} -{" "}
                      {format(new Date(checkin.booking?.listing?.check_out_date), "MMM d, yyyy")}
                    </span>
                    {checkin.confirmed_at && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Confirmed {format(new Date(checkin.confirmed_at), "MMM d 'at' h:mm a")}</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Issues Reported */}
        {issueCheckins.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Issues Reported ({issueCheckins.length})
            </h2>
            {issueCheckins.map((checkin) => (
              <Card key={checkin.id} className="border-destructive">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {checkin.booking?.listing?.property?.resort_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {checkin.booking?.listing?.property?.location}
                      </CardDescription>
                    </div>
                    <Badge variant={checkin.resolved ? "outline" : "destructive"}>
                      {checkin.resolved ? (
                        <>
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Resolved
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-1 h-3 w-3" />
                          Issue Pending
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-destructive/10 rounded-lg">
                    <p className="font-medium text-destructive mb-1">
                      {ISSUE_TYPES.find((t) => t.value === checkin.issue_type)?.label || checkin.issue_type}
                    </p>
                    <p className="text-sm text-muted-foreground">{checkin.issue_description}</p>
                  </div>
                  {!checkin.resolved && (
                    <p className="text-sm text-muted-foreground mt-3">
                      Our team is reviewing your issue and will contact you shortly.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {checkins.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No check-ins required</h3>
              <p className="text-muted-foreground text-center max-w-md">
                When you have upcoming bookings, you'll be able to confirm your check-in here.
              </p>
              <Button className="mt-4" onClick={() => navigate("/rentals")}>
                Browse Rentals
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Confirm Success Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Check-in</DialogTitle>
            <DialogDescription>
              Confirm that you have successfully arrived at{" "}
              {selectedCheckin?.booking?.listing?.property?.resort_name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Everything looks good?
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    By confirming, you acknowledge that you've checked in and the property matches the listing description.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmArrival}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Confirm Check-in
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Issue Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>
              Let us know what went wrong with your check-in
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Issue Type</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issue-description">Describe the Issue</Label>
              <Textarea
                id="issue-description"
                placeholder="Please provide details about the issue..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Need immediate help?
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    For urgent issues, contact our support team at support@rent-a-vacation.com
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsReportDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmArrival}
              disabled={isSubmitting || !issueType || !issueDescription.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TravelerCheckin;
