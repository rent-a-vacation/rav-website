import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Crown,
  Star,
  Trash2,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import type { OwnerTrustLevel, VerificationStatus, VerificationDocType } from "@/types/database";
import { TRUST_LEVEL_LABELS } from "@/types/database";

interface VerificationData {
  id: string;
  owner_id: string;
  trust_level: OwnerTrustLevel;
  verification_status: VerificationStatus;
  kyc_verified: boolean;
  phone_verified: boolean;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

interface VerificationDocument {
  id: string;
  verification_id: string;
  owner_id: string;
  doc_type: VerificationDocType;
  file_name: string;
  file_path: string;
  file_size: number | null;
  uploaded_at: string;
  status: VerificationStatus;
}

const DOCUMENT_TYPES: { value: VerificationDocType; label: string; description: string }[] = [
  { value: "timeshare_deed", label: "Property Deed", description: "Official deed or title document" },
  { value: "membership_certificate", label: "Membership Contract", description: "Vacation club membership agreement" },
  { value: "points_statement", label: "Annual Statement", description: "Recent maintenance fee statement" },
  { value: "government_id", label: "Government ID", description: "Passport, driver's license, or national ID" },
  { value: "other", label: "Other Supporting Document", description: "Any other relevant documentation" },
];

const getTrustLevelIcon = (level: OwnerTrustLevel) => {
  switch (level) {
    case "premium": return <Crown className="h-5 w-5 text-primary" />;
    case "trusted": return <Star className="h-5 w-5 text-primary" />;
    case "verified": return <CheckCircle2 className="h-5 w-5 text-primary" />;
    default: return <Shield className="h-5 w-5 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: VerificationStatus) => {
  switch (status) {
    case "approved":
      return <Badge variant="default">Approved</Badge>;
    case "under_review":
      return <Badge variant="secondary">Under Review</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
};

export const OwnerVerification = () => {
  const { user } = useAuth();
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<VerificationDocType>("timeshare_deed");

  useEffect(() => {
    if (user) {
      fetchVerificationData();
    }
  }, [user]);

  const fetchVerificationData = async () => {
    if (!user) return;
    
    try {
      // Fetch or create verification record
      const { data: verificationData, error } = await supabase
        .from("owner_verifications")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!verificationData) {
        // No verification record exists, create one
        const insertData = { owner_id: user.id };
        const { data: newVerification, error: createError } = await supabase
          .from("owner_verifications")
          .insert(insertData as never)
          .select()
          .single();

        if (createError) throw createError;
        setVerification(newVerification as unknown as VerificationData);
        setDocuments([]);
      } else {
        setVerification(verificationData as unknown as VerificationData);

        // Fetch documents if verification exists
        const { data: docsData, error: docsError } = await supabase
          .from("verification_documents")
          .select("*")
          .eq("verification_id", (verificationData as { id: string }).id)
          .order("uploaded_at", { ascending: false });

        if (docsError) throw docsError;
        setDocuments((docsData as unknown as VerificationDocument[]) || []);
      }
    } catch (error) {
      console.error("Error fetching verification data:", error);
      toast.error("Failed to load verification data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !verification || !user) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload PDF, JPG, PNG, or WebP files.");
      return;
    }

    setIsUploading(true);
    try {
      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${verification.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      // Create document record
      const insertDocData = {
        owner_id: user.id,
        verification_id: verification.id,
        doc_type: selectedDocType,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
      };
      const { data: docRecord, error: docError } = await supabase
        .from("verification_documents")
        .insert(insertDocData as never)
        .select()
        .single();

      if (docError) throw docError;

      setDocuments([docRecord as unknown as VerificationDocument, ...documents]);
      toast.success("Document uploaded successfully");
      
      // Reset file input
      event.target.value = "";
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (doc: VerificationDocument) => {
    try {
      // Delete from storage
      await supabase.storage
        .from("verification-documents")
        .remove([doc.file_path]);

      // Delete record
      const { error } = await supabase
        .from("verification_documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;

      setDocuments(documents.filter(d => d.id !== doc.id));
      toast.success("Document deleted");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleViewDocument = async (doc: VerificationDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from("verification-documents")
        .createSignedUrl(doc.file_path, 60); // 60 seconds expiry

      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Error viewing document:", error);
      toast.error("Failed to open document");
    }
  };

  const handleSubmitForReview = async () => {
    if (!verification || documents.length === 0) {
      toast.error("Please upload at least one document before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = { 
        verification_status: "under_review" as VerificationStatus,
      };
      const { error } = await supabase
        .from("owner_verifications")
        .update(updateData as never)
        .eq("id", verification.id);

      if (error) throw error;

      setVerification({
        ...verification,
        verification_status: "under_review" as VerificationStatus,
      });

      toast.success("Verification submitted! Our team will review your documents within 1-2 business days. You'll receive an email when the review is complete.");
    } catch (error) {
      console.error("Error submitting verification:", error);
      toast.error("Failed to submit verification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgress = () => {
    if (!verification) return 0;
    let progress = 0;
    if (verification.kyc_verified) progress += 25;
    if (documents.length > 0) progress += 25;
    if (verification.phone_verified) progress += 25;
    if (verification.verification_status === "approved") progress += 25;
    return progress;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getTrustLevelIcon(verification?.trust_level || "new")}
              <div>
                <CardTitle>TrustShield Status</CardTitle>
                <CardDescription>
                  {TRUST_LEVEL_LABELS[verification?.trust_level || "new"]} Owner
                </CardDescription>
              </div>
            </div>
            {verification && getStatusBadge(verification.verification_status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Verification Progress</span>
              <span>{getProgress()}%</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="flex items-center gap-2">
              {verification?.kyc_verified ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">KYC Verified</span>
            </div>
            <div className="flex items-center gap-2">
              {documents.length > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">Documents ({documents.length})</span>
            </div>
            <div className="flex items-center gap-2">
              {verification?.phone_verified ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">Phone Verified</span>
            </div>
            <div className="flex items-center gap-2">
              {verification?.verification_status === "approved" ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm">Approved</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rejection Alert */}
      {verification?.verification_status === "rejected" && verification.rejection_reason && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Verification Rejected</AlertTitle>
          <AlertDescription>
            {verification.rejection_reason}
            <p className="mt-2 text-sm">
              Please upload corrected documents and resubmit for review.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Under Review Notice */}
      {verification?.verification_status === "under_review" && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Under Review</AlertTitle>
          <AlertDescription>
            Your verification is being reviewed by our team. This typically takes 1-2 business days.
            You'll receive an email once the review is complete.
          </AlertDescription>
        </Alert>
      )}

      {/* Approved Notice */}
      {verification?.verification_status === "approved" && (
        <Alert className="border-primary/50 bg-primary/10">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertTitle>TrustShield Verified</AlertTitle>
          <AlertDescription>
            Congratulations! Your ownership has been verified. You can now list up to{" "}
            {verification.trust_level === "premium" ? 20 : 
             verification.trust_level === "trusted" ? 10 : 
             verification.trust_level === "verified" ? 5 : 3} active listings.
          </AlertDescription>
        </Alert>
      )}

      {/* Document Upload Section */}
      {verification?.verification_status !== "approved" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Documents
            </CardTitle>
            <CardDescription>
              Upload ownership documents to verify your vacation club membership.
              Accepted formats: PDF, JPG, PNG, WebP (max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="docType">Document Type</Label>
                <select
                  id="docType"
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value as VerificationDocType)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {DOCUMENT_TYPES.find(t => t.value === selectedDocType)?.description}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                {isUploading && (
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {DOCUMENT_TYPES.find(t => t.value === doc.doc_type)?.label || doc.doc_type}
                        {doc.file_size && ` • ${(doc.file_size / 1024).toFixed(1)} KB`}
                        {doc.status === "approved" && " • ✓ Verified"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDocument(doc)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {verification?.verification_status !== "approved" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDocument(doc)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {verification?.verification_status === "pending" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Shield className="h-12 w-12 text-primary" />
              <div>
                <h3 className="font-semibold text-lg">Ready to Submit?</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  Once you've uploaded your ownership documents, submit for review.
                  Our team will verify your documents within 1-2 business days.
                </p>
              </div>
              <Button 
                size="lg" 
                onClick={handleSubmitForReview}
                disabled={documents.length === 0 || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit for Verification"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resubmit for rejected */}
      {verification?.verification_status === "rejected" && (
        <div className="flex justify-center">
          <Button 
            size="lg" 
            onClick={handleSubmitForReview}
            disabled={documents.length === 0 || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Resubmit for Review"}
          </Button>
        </div>
      )}

      {/* Trust Level Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>TrustShield Levels</CardTitle>
          <CardDescription>
            Build your TrustShield reputation to unlock more features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(["new", "verified", "trusted", "premium"] as OwnerTrustLevel[]).map((level) => (
              <div
                key={level}
                className={`p-4 rounded-lg border ${
                  verification?.trust_level === level 
                    ? "border-primary bg-primary/5" 
                    : "border-border"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getTrustLevelIcon(level)}
                  <span className="font-medium">{TRUST_LEVEL_LABELS[level]}</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Max {level === "new" ? 3 : level === "verified" ? 5 : level === "trusted" ? 10 : 20} listings</li>
                  <li>• {level === "new" ? "Basic" : level === "verified" ? "Priority" : "Featured"} support</li>
                  {level !== "new" && <li>• Verified badge</li>}
                  {(level === "trusted" || level === "premium") && <li>• Lower fees</li>}
                  {level === "premium" && <li>• Premium placement</li>}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
