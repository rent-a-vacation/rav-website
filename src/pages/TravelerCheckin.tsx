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
  Camera,
  CheckCircle2,
  Clock,
  Home,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Phone,
  ThumbsUp,
  X,
  XCircle,
} from "lucide-react";
import { format, isPast, differenceInHours } from "date-fns";
import type { Booking, Listing, Property, Profile } from "@/types/database";
import {
  validateCheckinPhoto,
  buildCheckinPhotoStoragePath,
  CHECKIN_PHOTO_UI_COPY,
} from "@/lib/checkinPhoto";

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
  verification_photo_path: string | null;
  photo_uploaded_at: string | null;
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoSignedUrls, setPhotoSignedUrls] = useState<Record<string, string>>({});

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
    if (!selectedCheckin || !user) return;

    setIsSubmitting(true);
    try {
      if (confirmationType === "success") {
        const { data, error } = await supabase.functions.invoke("confirm-checkin", {
          body: {
            bookingId: selectedCheckin.booking_id,
            action: "confirm",
          },
        });
        if (error) throw error;
        if (data && (data as { success?: boolean }).success === false) {
          throw new Error((data as { error?: string }).error ?? "Failed to confirm");
        }

        toast({
          title: (data as { alreadyConfirmed?: boolean }).alreadyConfirmed
            ? "Check-in already confirmed"
            : "Check-in confirmed!",
          description: "Thanks for letting us know — enjoy your stay.",
        });
      } else {
        if (!issueType || !issueDescription.trim()) {
          toast({
            title: "Missing details",
            description: "Please select an issue type and provide details.",
            variant: "destructive",
          });
          return;
        }
        if (issueDescription.trim().length < 10) {
          toast({
            title: "Description is too short",
            description: "Add at least 10 characters so the team can act on it.",
            variant: "destructive",
          });
          return;
        }

        // Optional photo upload — non-fatal if it fails (we still want the
        // text report to land even if storage is flaky).
        let uploadedPhotoPath: string | null = null;
        if (photoFile) {
          const validationError = validateCheckinPhoto(photoFile);
          if (validationError) {
            toast({
              title: "Photo can't be uploaded",
              description: validationError.message,
              variant: "destructive",
            });
            return;
          }
          const path = buildCheckinPhotoStoragePath(
            user.id,
            selectedCheckin.booking_id,
            photoFile.name,
          );
          const { error: uploadError } = await supabase.storage
            .from("checkin-photos")
            .upload(path, photoFile, {
              contentType: photoFile.type,
              upsert: false,
            });
          if (uploadError) {
            console.error("Photo upload failed (non-fatal):", uploadError);
            toast({
              title: "Photo couldn't upload",
              description:
                "We'll still record your report — you can attach a photo later.",
              variant: "destructive",
            });
          } else {
            uploadedPhotoPath = path;
          }
        }

        const { data, error } = await supabase.functions.invoke("confirm-checkin", {
          body: {
            bookingId: selectedCheckin.booking_id,
            action: "report_issue",
            issueType,
            issueDescription: issueDescription.trim(),
            verificationPhotoPath: uploadedPhotoPath,
          },
        });
        if (error) throw error;
        if (data && (data as { success?: boolean }).success === false) {
          throw new Error((data as { error?: string }).error ?? "Failed to submit");
        }

        toast({
          title: "Issue reported",
          description: "We've recorded your report and the RAV team will be in touch.",
        });
      }

      setIsConfirmDialogOpen(false);
      setIsReportDialogOpen(false);
      resetIssueForm();
      fetchCheckins();
    } catch (error) {
      console.error("Error updating checkin:", error);
      const message =
        error instanceof Error ? error.message : "Failed to submit. Please try again.";
      toast({ title: "Submission failed", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetIssueForm = () => {
    setIssueType("");
    setIssueDescription("");
    setPhotoFile(null);
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
      setPhotoPreviewUrl(null);
    }
  };

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setPhotoFile(null);
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      setPhotoPreviewUrl(null);
      return;
    }
    const validationError = validateCheckinPhoto(file);
    if (validationError) {
      toast({
        title: "Photo can't be used",
        description: validationError.message,
        variant: "destructive",
      });
      return;
    }
    setPhotoFile(file);
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl(null);
  };

  const openConfirmDialog = (checkin: CheckinWithDetails) => {
    setSelectedCheckin(checkin);
    setConfirmationType("success");
    resetIssueForm();
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

  // Generate signed URLs for any verification photos in issue cards
  useEffect(() => {
    const paths = issueCheckins
      .map((c) => c.verification_photo_path)
      .filter((p): p is string => !!p && !photoSignedUrls[p]);
    if (paths.length === 0) return;
    let cancelled = false;
    (async () => {
      const updates: Record<string, string> = {};
      for (const path of paths) {
        const { data } = await supabase.storage
          .from("checkin-photos")
          .createSignedUrl(path, 3600);
        if (data?.signedUrl) updates[path] = data.signedUrl;
      }
      if (!cancelled && Object.keys(updates).length > 0) {
        setPhotoSignedUrls((prev) => ({ ...prev, ...updates }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueCheckins.length]);

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
                          resetIssueForm();
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
                  {checkin.verification_photo_path && photoSignedUrls[checkin.verification_photo_path] && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-border max-w-xs">
                      <a
                        href={photoSignedUrls[checkin.verification_photo_path]}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={photoSignedUrls[checkin.verification_photo_path]}
                          alt="Submitted with your report"
                          className="w-full max-h-40 object-cover bg-muted"
                        />
                      </a>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground bg-muted">
                        <ImageIcon className="h-3 w-3" />
                        Submitted with your report
                      </div>
                    </div>
                  )}
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
              <p className="text-xs text-muted-foreground">
                At least 10 characters so the RAV team can act on the report.
              </p>
            </div>

            {/* Optional photo upload — #461 Gap A */}
            <div className="space-y-2">
              <Label htmlFor="issue-photo">{CHECKIN_PHOTO_UI_COPY.label}</Label>
              {photoPreviewUrl ? (
                <div className="relative rounded-lg border border-border overflow-hidden">
                  <img
                    src={photoPreviewUrl}
                    alt="Selected verification photo"
                    className="w-full max-h-48 object-contain bg-muted"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={removePhoto}
                    aria-label="Remove photo"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="issue-photo"
                  className="flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Camera className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">Tap to add a photo</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {CHECKIN_PHOTO_UI_COPY.helpText}
                  </span>
                </label>
              )}
              <input
                id="issue-photo"
                type="file"
                accept="image/jpeg,image/png,image/heic"
                className="sr-only"
                onChange={onPhotoChange}
              />
              <p className="text-xs text-muted-foreground">
                {CHECKIN_PHOTO_UI_COPY.preferenceNote}
              </p>
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
