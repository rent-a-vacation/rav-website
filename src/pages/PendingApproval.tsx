import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Home, Mail, Shield, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const DRAFT_STORAGE_KEY = "rav-list-property-draft";

export default function PendingApproval() {
  const { user, profile, signOut, isRavTeam } = useAuth();
  const navigate = useNavigate();

  const isRejected = profile?.approval_status === "rejected";

  const [hasDraft] = useState(() => {
    try {
      return !!localStorage.getItem(DRAFT_STORAGE_KEY);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (isRavTeam()) {
      navigate("/rentals");
    } else if (profile?.approval_status === "approved") {
      navigate("/rentals");
    }
  }, [user, profile, isRavTeam, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`mx-auto w-12 h-12 ${isRejected ? "bg-destructive/10" : "bg-primary/10"} rounded-full flex items-center justify-center mb-4`}>
            {isRejected ? (
              <XCircle className="w-6 h-6 text-destructive" />
            ) : (
              <Clock className="w-6 h-6 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isRejected ? "Account Not Approved" : "Account Pending Approval"}
          </CardTitle>
          <CardDescription>
            {isRejected
              ? "Your account was not approved at this time"
              : "Your account is currently being reviewed by our team"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rejection Reason */}
          {isRejected && profile?.rejection_reason && (
            <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="destructive" className="text-xs">Reason</Badge>
              </div>
              <p className="text-sm">{profile.rejection_reason}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Please address the above and contact support to resubmit.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {!isRejected && (
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm">Why the wait?</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    We're currently in beta and carefully reviewing all new
                    accounts to ensure the best experience for our community.
                  </p>
                </div>
              </div>
            )}

            {/* Listing draft CTA — non-rejected users only */}
            {!isRejected && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Home className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Get your listing ready</h3>
                    <p className="text-sm text-muted-foreground">
                      Set up your property and listing now so it goes live as soon as you're approved.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1"
                      onClick={() => navigate("/list-property")}
                    >
                      {hasDraft ? "Continue Setting Up My Listing" : "Set Up My First Listing"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium text-sm">
                  {isRejected ? "Need help?" : "What happens next?"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRejected ? (
                    <>
                      Contact us at{" "}
                      <a href="mailto:support@rent-a-vacation.com" className="text-primary hover:underline">
                        support@rent-a-vacation.com
                      </a>{" "}
                      to discuss your account.
                    </>
                  ) : (
                    <>
                      You'll receive an email at{" "}
                      <strong>{profile?.email}</strong> within 24 hours once your
                      account is approved.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Questions? Contact us at{" "}
              <a
                href="mailto:support@rent-a-vacation.com"
                className="text-primary hover:underline"
              >
                support@rent-a-vacation.com
              </a>
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
