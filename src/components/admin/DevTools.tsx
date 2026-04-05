import { useState, useCallback } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { Sentry } from "@/lib/sentry";
import {
  RefreshCw,
  Database,
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Loader2,
  Trash2,
  Bug,
  PackagePlus,
  Info,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================
// Types
// ============================================================

interface SeedStatus {
  counts: Record<string, number>;
}

// ============================================================
// Test Account Data
// ============================================================

const TEST_ACCOUNTS = [
  { email: "dev-owner@rent-a-vacation.com", role: "RAV Owner", name: "RAV Dev Owner" },
  { email: "dev-admin@rent-a-vacation.com", role: "RAV Admin", name: "RAV Dev Admin" },
  { email: "dev-staff@rent-a-vacation.com", role: "RAV Staff", name: "RAV Dev Staff" },
  { email: "owner1@rent-a-vacation.com", role: "Property Owner", name: "Alex Rivera (HGV)" },
  { email: "owner2@rent-a-vacation.com", role: "Property Owner", name: "Maria Chen (Marriott)" },
  { email: "owner3@rent-a-vacation.com", role: "Property Owner", name: "James Thompson (Disney)" },
  { email: "owner4@rent-a-vacation.com", role: "Property Owner", name: "Priya Patel (Wyndham)" },
  { email: "owner5@rent-a-vacation.com", role: "Property Owner", name: "Robert Kim (Bluegreen)" },
  { email: "renter001@rent-a-vacation.com", role: "Renter", name: "Sophia Martinez (sample)" },
];

const SEED_PASSWORD = "SeedTest2026!";

const STRIPE_TEST_CARDS = [
  { number: "4242 4242 4242 4242", scenario: "Success", brand: "Visa" },
  { number: "4000 0000 0000 9995", scenario: "Insufficient Funds", brand: "Visa" },
  { number: "4000 0000 0000 0002", scenario: "Generic Decline", brand: "Visa" },
  { number: "4000 0025 0000 3155", scenario: "3D Secure Required", brand: "Visa" },
  { number: "5200 8282 8282 8210", scenario: "Debit (Mastercard)", brand: "Mastercard" },
];

// ============================================================
// Status display tables
// ============================================================

const STATUS_TABLES = [
  "profiles", "user_roles", "properties", "listings", "bookings",
  "booking_confirmations", "cancellation_requests", "listing_bids",
  "travel_requests", "travel_proposals", "notifications",
  "owner_verifications", "owner_agreements", "user_memberships",
  "voice_search_usage", "favorites", "platform_guarantee_fund",
  "checkin_confirmations",
];

// ============================================================
// Component
// ============================================================

export function DevTools() {
  const [status, setStatus] = useState<SeedStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [reseedLoading, setReseedLoading] = useState(false);
  const [reseedLog, setReseedLog] = useState<string[]>([]);
  const [updateLoading, setUpdateLoading] = useState(false);

  const invokeSeedManager = useCallback(async (action: string) => {
    // Get the current session token to pass explicitly
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const { data, error } = await supabase.functions.invoke("seed-manager", {
      body: { action },
      headers,
    });

    if (error) {
      const context = (error as Record<string, unknown>).context;
      if (context && typeof context === "object" && "json" in context) {
        const body = await (context as Response).json().catch(() => null);
        throw new Error(body?.error ?? error.message);
      }
      throw error;
    }
    return data;
  }, []);

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const data = await invokeSeedManager("status");
      setStatus({ counts: data.counts });
    } catch (err) {
      toast.error(`Failed to fetch status: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setStatusLoading(false);
    }
  }, [invokeSeedManager]);

  const handleReseed = useCallback(async () => {
    setReseedLoading(true);
    setReseedLog(["Starting reseed..."]);
    try {
      const data = await invokeSeedManager("reseed");
      setReseedLog(data.log ?? ["Reseed complete"]);
      toast.success(`Reseed complete in ${data.elapsed_seconds}s`);
      setStatus({ counts: data.counts });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setReseedLog(prev => [...prev, `ERROR: ${msg}`]);
      toast.error(`Reseed failed: ${msg}`);
    } finally {
      setReseedLoading(false);
    }
  }, [invokeSeedManager]);

  const handleUpdate = useCallback(async () => {
    setUpdateLoading(true);
    setReseedLog(["Starting incremental update..."]);
    try {
      const data = await invokeSeedManager("update");
      setReseedLog(data.log ?? ["Update complete"]);
      toast.success(`Update complete in ${data.elapsed_seconds}s`);
      setStatus({ counts: data.counts });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setReseedLog(prev => [...prev, `ERROR: ${msg}`]);
      toast.error(`Update failed: ${msg}`);
    } finally {
      setUpdateLoading(false);
    }
  }, [invokeSeedManager]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const lastSeedTimestamp = status?.counts?.["_last_seed_timestamp"];

  return (
    <div className="space-y-6">
      {/* Section 1: Status */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Seed Data Status
              </CardTitle>
              <CardDescription>
                Current row counts across all tables
                {lastSeedTimestamp && typeof lastSeedTimestamp === "string" && (
                  <span className="ml-2">
                    — Last seeded: {new Date(lastSeedTimestamp).toLocaleString()}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStatus}
              disabled={statusLoading}
            >
              {statusLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!status ? (
            <p className="text-sm text-muted-foreground">
              Click Refresh to load current counts.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {STATUS_TABLES.map((table) => (
                <div key={table} className="flex flex-col items-center p-3 rounded-lg border bg-muted/50">
                  <span className="text-xs text-muted-foreground truncate w-full text-center" title={table}>
                    {table.replace(/_/g, " ")}
                  </span>
                  <Badge variant={status.counts[table] > 0 ? "default" : "secondary"} className="mt-1">
                    {status.counts[table] ?? "?"}
                  </Badge>
                </div>
              ))}
              {status.counts.foundation_users !== undefined && (
                <div className="flex flex-col items-center p-3 rounded-lg border bg-green-50 dark:bg-green-950/30">
                  <span className="text-xs text-muted-foreground">foundation</span>
                  <Badge variant="default" className="mt-1 bg-green-600">
                    {status.counts.foundation_users}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Seed Management */}
      <Card className="border-amber-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Seed Data Management
          </CardTitle>
          <CardDescription>
            Manage test data in the DEV database. Foundation users (Layer 1) are always preserved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info: explain the two actions */}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-sm space-y-2 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="space-y-1.5">
                <p className="text-blue-800 dark:text-blue-200">
                  <span className="font-semibold">Reset & Reseed</span> — Wipes all test data and recreates from scratch. Use when you want a clean slate.
                </p>
                <p className="text-blue-800 dark:text-blue-200">
                  <span className="font-semibold">Update Seed Data</span> — Adds new feature data without deleting anything. Use after code updates to get new test data while keeping your manual testing intact.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium text-amber-800 dark:text-amber-200">Reset & Reseed will:</p>
            <ul className="list-disc list-inside text-amber-700 dark:text-amber-300 space-y-1">
              <li>Preserve 8 foundation users (3 RAV + 5 owners)</li>
              <li>Delete all properties, listings, bookings, bids</li>
              <li>Delete all non-foundation auth users (50 renters)</li>
              <li>Recreate 10 properties, 30 listings</li>
              <li>Create 50 renters with 90 completed bookings + pipeline data</li>
            </ul>
            <p className="text-amber-600 dark:text-amber-400 font-medium mt-2">
              Estimated time: 30-60 seconds
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={reseedLoading || updateLoading}>
                  {reseedLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {reseedLoading ? "Reseeding..." : "Reset & Reseed DEV"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset & Reseed DEV Database?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete ALL non-foundation data and regenerate test data.
                    This action cannot be undone. Foundation users are preserved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReseed}>
                    Yes, Reset & Reseed
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={reseedLoading || updateLoading}>
                  {updateLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <PackagePlus className="h-4 w-4 mr-2" />
                  )}
                  {updateLoading ? "Updating..." : "Update Seed Data"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Update Seed Data</AlertDialogTitle>
                  <AlertDialogDescription>
                    Adds missing test data (membership tiers, referral codes, API keys, voice logs) without deleting existing data. Your manual testing data will be preserved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleUpdate}>
                    Update
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Reseed / Update Log */}
          {reseedLog.length > 0 && (
            <div className="bg-slate-950 rounded-lg p-4 max-h-64 overflow-y-auto">
              <pre className="text-xs text-green-400 font-mono space-y-0.5">
                {reseedLog.map((line, i) => (
                  <div key={i} className={line.includes("ERROR") ? "text-red-400" : line.startsWith("===") ? "text-cyan-400 font-bold" : ""}>
                    {line}
                  </div>
                ))}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Test Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Test Accounts
          </CardTitle>
          <CardDescription>
            Foundation accounts for DEV testing. Password for all:{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
              {SEED_PASSWORD}
            </code>
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 h-6 w-6 p-0"
              onClick={() => copyToClipboard(SEED_PASSWORD)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            All @rent-a-vacation.com emails route via Cloudflare catchall to rentavacation0@gmail.com
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TEST_ACCOUNTS.map((account) => (
                  <TableRow key={account.email}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{account.email}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.role.startsWith("RAV") ? "default" : "secondary"}>
                        {account.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => copyToClipboard(account.email)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Sentry Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Sentry Error Test
          </CardTitle>
          <CardDescription>
            Send a test error to Sentry to verify source maps, browser tracing, and session replay are working.
            Check the Sentry dashboard after clicking — the error should appear in Issues with a readable stack trace.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              try {
                throw new Error("Sentry test error from DevTools — verify source maps are working");
              } catch (e) {
                Sentry.captureException(e);
                toast.success("Test error sent to Sentry — check your dashboard");
              }
            }}
          >
            <Bug className="h-4 w-4 mr-2" />
            Send Captured Error
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              Sentry.captureMessage("Sentry test message from DevTools", "info");
              toast.success("Test message sent to Sentry — check your dashboard");
            }}
          >
            Send Test Message
          </Button>
        </CardContent>
      </Card>

      {/* Section 5: Stripe Test Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Test Cards
          </CardTitle>
          <CardDescription>
            Use these card numbers in Stripe test mode. Any future expiry date and any 3-digit CVC.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Card Number</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Scenario</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STRIPE_TEST_CARDS.map((card) => (
                  <TableRow key={card.number}>
                    <TableCell>
                      <code className="text-sm bg-muted px-1.5 py-0.5 rounded font-mono">
                        {card.number}
                      </code>
                    </TableCell>
                    <TableCell>{card.brand}</TableCell>
                    <TableCell>
                      <Badge
                        variant={card.scenario === "Success" ? "default" : "secondary"}
                        className={card.scenario === "Success" ? "bg-green-600" : ""}
                      >
                        {card.scenario}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => copyToClipboard(card.number.replace(/ /g, ""))}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
