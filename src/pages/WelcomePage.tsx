import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useCompleteOnboarding } from "@/hooks/useOnboarding";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  FileText,
  Building2,
  Home,
  Search,
  Gavel,
  Send,
  LayoutDashboard,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } from "@/lib/termsVersions";

export default function WelcomePage() {
  usePageMeta({
    title: "Welcome",
    description: "Welcome to Rent-A-Vacation — complete your account setup",
  });

  const { user, profile, isRavTeam, isPropertyOwner } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const completeOnboarding = useCompleteOnboarding();

  const [step, setStep] = useState<1 | 2>(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Redirect guards
  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (isRavTeam()) {
      navigate("/rentals");
    } else if (profile?.approval_status === "pending_approval" || profile?.approval_status === "rejected") {
      navigate("/pending-approval");
    } else if (profile?.onboarding_completed_at && step === 1) {
      // Already onboarded — skip to the appropriate dashboard
      navigate(isPropertyOwner() ? "/owner-dashboard" : "/my-trips");
    }
  }, [user, profile, isRavTeam, isPropertyOwner, navigate, step]);

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const isOwner = isPropertyOwner();

  const handleContinue = async () => {
    if (!termsAccepted || !privacyAccepted) return;

    try {
      await completeOnboarding.mutateAsync();
      setStep(2);
    } catch (error) {
      toast({
        title: "Failed to complete onboarding",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSkipToApp = () => {
    navigate(isOwner ? "/owner-dashboard" : "/my-trips");
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/50" data-testid="welcome-page">
      <Header />

      <main id="main-content" className="flex-1 flex items-center justify-center px-4 pt-20 pb-12 md:pt-24">
        <Card className="w-full max-w-2xl">
          {step === 1 && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-2xl">
                  Welcome to Rent-A-Vacation, {firstName}!
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Your account has been approved. Before you get started, please review and accept our current Terms of Service and Privacy Policy.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <Link
                    to="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    Read Terms of Service
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  <Link
                    to="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    Read Privacy Policy
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-border mt-1"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      aria-label={`I accept the Terms of Service version ${CURRENT_TERMS_VERSION}`}
                    />
                    <span className="text-sm">
                      I have read and accept the <strong>Terms of Service</strong> (Version {CURRENT_TERMS_VERSION})
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-border mt-1"
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      aria-label={`I accept the Privacy Policy version ${CURRENT_PRIVACY_VERSION}`}
                    />
                    <span className="text-sm">
                      I have read and accept the <strong>Privacy Policy</strong> (Version {CURRENT_PRIVACY_VERSION})
                    </span>
                  </label>
                </div>

                <Button
                  onClick={handleContinue}
                  disabled={!termsAccepted || !privacyAccepted || completeOnboarding.isPending}
                  className="w-full"
                  size="lg"
                >
                  {completeOnboarding.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  {isOwner ? (
                    <Building2 className="w-7 h-7 text-primary" />
                  ) : (
                    <Home className="w-7 h-7 text-primary" />
                  )}
                </div>
                <CardTitle className="text-2xl">
                  {isOwner
                    ? "You're set up as a Property Owner"
                    : "You're set up as a Traveler"}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Here&apos;s what you can do on Rent-A-Vacation:
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {isOwner ? (
                  <>
                    <Link
                      to="/list-property"
                      className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">List Your First Property</p>
                        <p className="text-xs text-muted-foreground">Share your timeshare and earn income</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </Link>

                    <Link
                      to="/owner-dashboard"
                      className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <LayoutDashboard className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Go to Owner&apos;s Edge</p>
                        <p className="text-xs text-muted-foreground">Your dashboard for earnings & analytics</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </Link>

                    <Link
                      to="/bidding?tab=requests"
                      className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Send className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Browse Vacation Wishes</p>
                        <p className="text-xs text-muted-foreground">See what travelers are looking for</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/rentals"
                      className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Search className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Start Exploring</p>
                        <p className="text-xs text-muted-foreground">Browse 117 resorts across 8 destinations</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </Link>

                    <Link
                      to="/bidding"
                      className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Gavel className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Name Your Price</p>
                        <p className="text-xs text-muted-foreground">Bid on any open listing</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </Link>

                    <Link
                      to="/bidding?tab=requests"
                      className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Send className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Post a Vacation Wish</p>
                        <p className="text-xs text-muted-foreground">Tell owners what you want</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </Link>
                  </>
                )}

                <Button
                  variant="ghost"
                  onClick={handleSkipToApp}
                  className="w-full mt-4"
                >
                  Skip for now — Go to {isOwner ? "Owner's Edge" : "My Trips"}
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  );
}
