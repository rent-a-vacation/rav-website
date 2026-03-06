import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Check, Loader2, Rocket, Gift } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ActionSuccessCard } from "@/components/ActionSuccessCard";
import { supabase } from "@/lib/supabase";
import { extractReferralCode } from "@/lib/referral";

const Signup = () => {
  usePageMeta('Sign Up', 'Create your free Rent-A-Vacation account to start booking or listing vacation properties.');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    accountType: "renter",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSignupComplete, setIsSignupComplete] = useState(false);
  const [staffOnlyMode, setStaffOnlyMode] = useState(false);
  const [searchParams] = useSearchParams();
  const referralCode = extractReferralCode(searchParams);

  const { signUp, signInWithGoogle, isConfigured } = useAuth();

  // Check if platform is in staff-only mode
  useEffect(() => {
    const checkStaffOnly = async () => {
      try {
        const { data } = await supabase
          .from("system_settings")
          .select("setting_value")
          .eq("setting_key", "platform_staff_only")
          .single();
        if (data?.setting_value && (data.setting_value as Record<string, unknown>).enabled) {
          setStaffOnlyMode(true);
        }
      } catch {
        // fail-open — if we can't check, allow signup
      }
    };
    checkStaffOnly();
  }, []);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConfigured) {
      toast({
        title: "Backend not configured",
        description: "Please set up your environment variables first.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate password requirements
    const hasMinLength = formData.password.length >= 8;
    const hasNumber = /\d/.test(formData.password);
    const hasUppercase = /[A-Z]/.test(formData.password);
    
    if (!hasMinLength || !hasNumber || !hasUppercase) {
      toast({
        title: "Password requirements not met",
        description: "Please ensure your password meets all requirements.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    const { error } = await signUp(formData.email, formData.password, formData.name, formData.accountType, referralCode || undefined);
    setIsLoading(false);
    
    if (error) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setIsSignupComplete(true);
    }
  };

  const passwordRequirements = [
    { label: "At least 8 characters", met: formData.password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(formData.password) },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(formData.password) },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="main-content" className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                Create Your Account
              </h1>
              <p className="text-muted-foreground">
                Join thousands of travelers and owners on Rent-A-Vacation
              </p>
            </div>

            <div className="bg-card rounded-2xl shadow-card-hover p-4 sm:p-6 md:p-8">
              {staffOnlyMode ? (
                <div className="text-center py-8">
                  <Rocket className="w-12 h-12 mx-auto text-primary mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Coming Soon!</h2>
                  <p className="text-muted-foreground mb-4">
                    Rent-A-Vacation is launching soon. We'll notify you when we're live!
                  </p>
                  <Link to="/" className="text-primary font-medium hover:underline">
                    Back to Home
                  </Link>
                </div>
              ) : isSignupComplete ? (
                <ActionSuccessCard
                  title="Account Created!"
                  description={
                    <>
                      <p>We've sent a verification email to <strong>{formData.email}</strong>.</p>
                      <p className="mt-2">Click the link in the email to verify your account, then log in to get started.</p>
                    </>
                  }
                  emailSent
                  actions={[{ label: "Go to Login", onClick: () => navigate("/login") }]}
                />
              ) : (
              <>
              {/* Referral Banner */}
              {referralCode && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
                  <Gift className="h-4 w-4 text-emerald-600 shrink-0" />
                  <p className="text-sm text-emerald-700">
                    You were referred! Sign up to unlock rewards for both you and your referrer.
                  </p>
                </div>
              )}

              {/* Account Type Toggle */}
              <div className="flex bg-muted p-1 rounded-lg mb-6" role="group" aria-label="Account type">
                <button
                  type="button"
                  aria-pressed={formData.accountType === "renter"}
                  onClick={() => setFormData({ ...formData, accountType: "renter" })}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                    formData.accountType === "renter"
                      ? "bg-card shadow-sm text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  I'm a Renter
                </button>
                <button
                  type="button"
                  aria-pressed={formData.accountType === "owner"}
                  onClick={() => setFormData({ ...formData, accountType: "owner" })}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                    formData.accountType === "owner"
                      ? "bg-card shadow-sm text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  I'm an Owner
                </button>
              </div>

              {/* Social Signup */}
              <div className="space-y-3 mb-6">
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  onClick={() => signInWithGoogle()}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or sign up with email</span>
                </div>
              </div>

              {/* Signup Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="signup-name" className="block text-sm font-medium mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="signup-email" className="block text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="signup-password" className="block text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-2"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-2 space-y-1">
                      {passwordRequirements.map((req, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-2 text-xs ${
                            req.met ? "text-primary" : "text-muted-foreground"
                          }`}
                        >
                          <Check className={`w-3 h-3 ${req.met ? "opacity-100" : "opacity-30"}`} />
                          {req.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <input type="checkbox" className="rounded border-border mt-1" required />
                  <span className="text-sm text-muted-foreground">
                    I am 18 years or older and agree to Rent-A-Vacation's{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Log in
                </Link>
              </p>
              </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Signup;
