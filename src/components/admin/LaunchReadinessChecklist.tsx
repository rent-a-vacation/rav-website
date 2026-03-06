import { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ClipboardCheck,
  RefreshCw,
  Loader2,
  Rocket,
  ShieldAlert,
  ChevronDown,
  Server,
  CreditCard,
  Shield,
  FileText,
  Activity,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { toast } from "sonner";
import {
  checkSupabaseConnectivity,
  checkSupabaseEnvironment,
  checkStripeMode,
  checkStripeWebhook,
  checkSeedDataOnProd,
  checkEmailSender,
  checkSentryDsn,
  checkGoogleAnalytics,
  checkLegalPages,
  checkStaffOnlyMode,
  checkDnsSsl,
  checkRlsPolicies,
  computeReadinessScore,
  type CheckResult,
} from "@/lib/launchReadiness";

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  infrastructure: { label: "Infrastructure", icon: <Server className="h-4 w-4" /> },
  payments: { label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
  security: { label: "Security", icon: <Shield className="h-4 w-4" /> },
  content: { label: "Content & Legal", icon: <FileText className="h-4 w-4" /> },
  monitoring: { label: "Monitoring", icon: <Activity className="h-4 w-4" /> },
};

function StatusIcon({ status }: { status: CheckResult["status"] }) {
  switch (status) {
    case "pass":
      return <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />;
    case "fail":
      return <XCircle className="h-5 w-5 text-red-600 shrink-0" />;
    case "warn":
      return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
    case "manual":
      return <ClipboardCheck className="h-5 w-5 text-blue-500 shrink-0" />;
  }
}

function StatusBadge({ status }: { status: CheckResult["status"] }) {
  const variants: Record<string, string> = {
    pass: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    fail: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    warn: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    manual: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  };
  const labels: Record<string, string> = {
    pass: "Pass",
    fail: "Fail",
    warn: "Warning",
    manual: "Manual Check",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[status]}`}>
      {labels[status]}
    </span>
  );
}

export function LaunchReadinessChecklist() {
  const { platformStaffOnly, updateSetting, loading: settingsLoading } = useSystemSettings();
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [running, setRunning] = useState(false);
  const [goingLive, setGoingLive] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const runChecks = useCallback(async () => {
    setRunning(true);
    const results: CheckResult[] = [];

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
    const isProd = supabaseUrl?.includes("xzfllqndrlmhclqfybew") ?? false;

    // 1. Supabase connectivity
    try {
      const { error } = await supabase
        .from("system_settings")
        .select("setting_key")
        .limit(1);
      results.push(checkSupabaseConnectivity(!error));
    } catch {
      results.push(checkSupabaseConnectivity(false));
    }

    // 2. Supabase environment
    results.push(checkSupabaseEnvironment(supabaseUrl));

    // 3. Stripe mode (manual)
    results.push(checkStripeMode(supabaseUrl));

    // 4. Stripe webhook (manual)
    results.push(checkStripeWebhook());

    // 5. Seed data on PROD
    try {
      const { data } = await supabase
        .from("profiles")
        .select("email")
        .like("email", "%dev-%@rent-a-vacation.com")
        .limit(1);
      results.push(checkSeedDataOnProd((data?.length ?? 0) > 0, isProd));
    } catch {
      results.push(checkSeedDataOnProd(false, isProd));
    }

    // 6. Email sender (manual)
    results.push(checkEmailSender());

    // 7. Sentry
    results.push(checkSentryDsn(sentryDsn));

    // 8. GA4
    results.push(checkGoogleAnalytics());

    // 9. Legal pages (they exist in code — Terms.tsx, Privacy.tsx)
    results.push(checkLegalPages(true, true));

    // 10. Staff Only Mode
    results.push(checkStaffOnlyMode(platformStaffOnly));

    // 11. DNS/SSL (manual)
    results.push(checkDnsSsl());

    // 12. RLS policies (manual)
    results.push(checkRlsPolicies());

    setChecks(results);
    // Auto-expand categories with failures
    const failCats = new Set(
      results.filter((c) => c.status === "fail").map((c) => c.category)
    );
    setExpandedCategories(failCats);
    setRunning(false);
  }, [platformStaffOnly]);

  // Auto-run on mount
  useEffect(() => {
    if (!settingsLoading) {
      runChecks();
    }
  }, [settingsLoading, runChecks]);

  const score = computeReadinessScore(checks);
  const canGoLive = score.failed === 0 && checks.length > 0;

  const handleGoLive = async () => {
    setGoingLive(true);
    try {
      await updateSetting("platform_staff_only", { enabled: false });
      toast.success("Platform is now LIVE — Staff Only Mode disabled");
      runChecks();
    } catch (error) {
      console.error("Failed to go live:", error);
      toast.error("Failed to disable Staff Only Mode");
    } finally {
      setGoingLive(false);
    }
  };

  const handleRollback = async () => {
    setRollingBack(true);
    try {
      await updateSetting("platform_staff_only", { enabled: true });
      toast.success("Rollback complete — Staff Only Mode re-enabled");
      runChecks();
    } catch (error) {
      console.error("Failed to rollback:", error);
      toast.error("Failed to enable Staff Only Mode");
    } finally {
      setRollingBack(false);
    }
  };

  // Group checks by category
  const grouped = checks.reduce<Record<string, CheckResult[]>>((acc, check) => {
    if (!acc[check.category]) acc[check.category] = [];
    acc[check.category].push(check);
    return acc;
  }, {});

  const categoryOrder = ["infrastructure", "payments", "security", "content", "monitoring"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Launch Readiness</h2>
          <p className="text-muted-foreground">
            Pre-flight checklist for going live
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={runChecks}
          disabled={running}
        >
          {running ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Re-run Checks
        </Button>
      </div>

      {/* Score Summary */}
      {checks.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl font-bold">
                    {score.passed}/{score.total}
                  </span>
                  <span className="text-muted-foreground">checks passing</span>
                </div>
                <Progress value={score.percentage} className="h-3" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" className="bg-green-600">
                  {score.passed} Passed
                </Badge>
                {score.failed > 0 && (
                  <Badge variant="destructive">
                    {score.failed} Failed
                  </Badge>
                )}
                {score.warnings > 0 && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    {score.warnings} Warnings
                  </Badge>
                )}
                {score.manual > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {score.manual} Manual
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checks by Category */}
      {categoryOrder.map((cat) => {
        const catChecks = grouped[cat];
        if (!catChecks) return null;
        const meta = CATEGORY_META[cat];
        const catFails = catChecks.filter((c) => c.status === "fail").length;
        const catPasses = catChecks.filter((c) => c.status === "pass").length;
        const isOpen = expandedCategories.has(cat);

        return (
          <Collapsible key={cat} open={isOpen} onOpenChange={() => toggleCategory(cat)}>
            <Card className={catFails > 0 ? "border-red-300 dark:border-red-800" : ""}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {meta.icon}
                      {meta.label}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({catPasses}/{catChecks.length} passing)
                      </span>
                    </CardTitle>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="divide-y">
                    {catChecks.map((check) => (
                      <div key={check.id} className="flex items-start gap-3 py-3">
                        <StatusIcon status={check.status} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{check.label}</span>
                            <StatusBadge status={check.status} />
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {check.description}
                          </p>
                          {check.detail && (
                            <p className="text-xs text-muted-foreground mt-1 bg-muted/50 rounded px-2 py-1">
                              {check.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}

      {/* Go-Live / Rollback Actions */}
      <Card className={platformStaffOnly ? "border-green-500/50" : "border-amber-500/50"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {platformStaffOnly ? (
              <Rocket className="h-5 w-5 text-green-600" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            )}
            {platformStaffOnly ? "Go Live" : "Platform is LIVE"}
          </CardTitle>
          <CardDescription>
            {platformStaffOnly
              ? "Disable Staff Only Mode to open the platform to all users"
              : "Platform is currently open. Use rollback to re-enable Staff Only Mode if needed."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {platformStaffOnly ? (
            <>
              {/* Go-Live Procedure */}
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium">Before flipping the switch:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Ensure all automated checks above are passing (no red failures)</li>
                  <li>Complete all manual checks (blue items) and verify them yourself</li>
                  <li>Verify Stripe is in live mode with webhook configured</li>
                  <li>Verify no seed/test data exists on PROD</li>
                  <li>Confirm legal pages have been reviewed (#80)</li>
                  <li>Test a complete booking flow on the preview deploy</li>
                </ol>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    disabled={!canGoLive || goingLive}
                  >
                    {goingLive ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Rocket className="h-4 w-4 mr-2" />
                    )}
                    Go Live
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Launch the Platform?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will disable Staff Only Mode. All approved users will be able to
                      access the platform, browse listings, and make real bookings with real
                      payments. You can roll back at any time.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleGoLive}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Yes, Go Live
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {!canGoLive && checks.length > 0 && (
                <p className="text-sm text-red-600">
                  Resolve all failed checks before going live ({score.failed} remaining)
                </p>
              )}
            </>
          ) : (
            <>
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Emergency Rollback
                </p>
                <p className="text-amber-700 dark:text-amber-300">
                  Re-enables Staff Only Mode. All non-RAV-team users will see a "Coming Soon"
                  page. Existing in-progress bookings are not affected — only new access is blocked.
                </p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={rollingBack}>
                    {rollingBack ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 mr-2" />
                    )}
                    Emergency Rollback
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Rollback to Staff Only Mode?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will immediately lock the platform to RAV team members only.
                      Non-staff users will see a "Coming Soon" page on their next navigation.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRollback} className="bg-red-600 hover:bg-red-700">
                      Yes, Enable Staff Only Mode
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
