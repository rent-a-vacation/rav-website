import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog";
import { ShieldAlert, ExternalLink, MessageSquare, AlertTriangle } from "lucide-react";

type FraudStatus =
  | "pending"
  | "investigating"
  | "escalated_to_legal"
  | "escalated_to_law_enforcement"
  | "resolved_action_taken"
  | "resolved_no_fraud_found"
  | "dismissed_spam"
  | "dismissed_duplicate";

type Severity = "low" | "medium" | "high" | "critical";

interface FraudReportRow {
  id: string;
  listing_id: string | null;
  reported_user_id: string | null;
  booking_id: string | null;
  reporter_id: string | null;
  reporter_email: string | null;
  reporter_name: string | null;
  category: string;
  severity: Severity;
  description: string;
  status: FraudStatus;
  resolution_notes: string | null;
  internal_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_LABELS: Record<FraudStatus, string> = {
  pending: "Pending",
  investigating: "Investigating",
  escalated_to_legal: "Escalated — legal",
  escalated_to_law_enforcement: "Escalated — law enforcement",
  resolved_action_taken: "Resolved — action taken",
  resolved_no_fraud_found: "Resolved — no fraud",
  dismissed_spam: "Dismissed — spam",
  dismissed_duplicate: "Dismissed — duplicate",
};

const STATUS_VARIANTS: Record<FraudStatus, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "destructive",
  investigating: "secondary",
  escalated_to_legal: "destructive",
  escalated_to_law_enforcement: "destructive",
  resolved_action_taken: "default",
  resolved_no_fraud_found: "outline",
  dismissed_spam: "outline",
  dismissed_duplicate: "outline",
};

const SEVERITY_VARIANTS: Record<Severity, "default" | "secondary" | "outline" | "destructive"> = {
  critical: "destructive",
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

const CATEGORY_LABELS: Record<string, string> = {
  payment_fraud: "Payment fraud",
  identity_fraud: "Identity fraud",
  fake_listing: "Fake listing",
  phishing: "Phishing",
  scam_pattern: "Scam pattern",
  unauthorized_access: "Unauthorized access",
  timeshare_exit_scheme: "Exit scheme",
  other: "Other",
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function AdminFraudReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<FraudReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FraudStatus | "all">("pending");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [editTarget, setEditTarget] = useState<FraudReportRow | null>(null);
  const [draftStatus, setDraftStatus] = useState<FraudStatus>("investigating");
  const [draftSeverity, setDraftSeverity] = useState<Severity>("high");
  const [draftResolution, setDraftResolution] = useState("");
  const [draftInternal, setDraftInternal] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("fraud_reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load fraud reports", description: error.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }
    setRows((data ?? []) as FraudReportRow[]);
    setIsLoading(false);
  }

  const summary = useMemo(() => {
    return {
      critical_open: rows.filter((r) => r.severity === "critical" && (r.status === "pending" || r.status === "investigating")).length,
      pending: rows.filter((r) => r.status === "pending").length,
      investigating: rows.filter((r) => r.status === "investigating").length,
      escalated: rows.filter((r) => r.status.startsWith("escalated_")).length,
      resolved: rows.filter((r) => r.status.startsWith("resolved_")).length,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (severityFilter !== "all" && r.severity !== severityFilter) return false;
      return true;
    });
  }, [rows, statusFilter, severityFilter]);

  function openEdit(row: FraudReportRow) {
    setEditTarget(row);
    setDraftStatus(row.status === "pending" ? "investigating" : row.status);
    setDraftSeverity(row.severity);
    setDraftResolution(row.resolution_notes ?? "");
    setDraftInternal(row.internal_notes ?? "");
  }

  function closeEdit() {
    setEditTarget(null);
    setConfirmOpen(false);
  }

  async function save() {
    if (!editTarget || !user) return;
    setIsSaving(true);
    const isTerminal = draftStatus.startsWith("resolved_") || draftStatus.startsWith("dismissed_");
    const payload: Record<string, unknown> = {
      status: draftStatus,
      severity: draftSeverity,
      resolution_notes: draftResolution.trim() || null,
      internal_notes: draftInternal.trim() || null,
    };
    if (isTerminal) {
      payload.resolved_at = new Date().toISOString();
      payload.resolved_by = user.id;
    } else if (!editTarget.status.startsWith("resolved_") && !editTarget.status.startsWith("dismissed_")) {
      payload.resolved_at = null;
      payload.resolved_by = null;
    }
    const { error } = await supabase
      .from("fraud_reports")
      .update(payload)
      .eq("id", editTarget.id);
    setIsSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Fraud report updated",
      description: `Status set to ${STATUS_LABELS[draftStatus]}.`,
    });
    closeEdit();
    void load();
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fraud reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Fraud reports
          </CardTitle>
          <CardDescription>
            Senior-admin-only triage. Reports may be filed against listings, hosts, bookings, or
            generically against the platform. Compliance brief § 3.6 + FTC v. Carroll (2026)
            enforcement context — all critical-severity reports need attention within 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-xs text-destructive font-medium">Critical open</p>
              <p className="text-2xl font-bold text-destructive">{summary.critical_open}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold">{summary.pending}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Investigating</p>
              <p className="text-2xl font-semibold">{summary.investigating}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Escalated</p>
              <p className="text-2xl font-semibold">{summary.escalated}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Resolved</p>
              <p className="text-2xl font-semibold">{summary.resolved}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FraudStatus | "all")}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(Object.keys(STATUS_LABELS) as FraudStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as Severity | "all")}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">{filteredRows.length} shown</span>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No reports in this view.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => (
                    <TableRow key={row.id} data-report-id={row.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(row.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={SEVERITY_VARIANTS[row.severity]} className="uppercase text-xs">
                          {row.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {CATEGORY_LABELS[row.category] ?? row.category}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.listing_id ? (
                          <a
                            href={`/listings/${row.listing_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 font-mono"
                          >
                            listing {row.listing_id.slice(0, 8)}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : row.reported_user_id ? (
                          <span className="font-mono text-muted-foreground">
                            user {row.reported_user_id.slice(0, 8)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">general</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.reporter_id ? "Authed user" : row.reporter_email ?? "Anonymous"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[row.status]} className="text-xs">
                          {STATUS_LABELS[row.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[260px]">
                        <span className="line-clamp-2" title={row.description}>
                          {row.description}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                          <MessageSquare className="h-4 w-4 mr-1.5" />
                          Triage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-xl" data-testid="fraud-triage-dialog">
          <DialogHeader>
            <DialogTitle>Triage fraud report</DialogTitle>
            <DialogDescription>
              Senior-admin action — recorded with your user ID + timestamp. You'll confirm before save.
            </DialogDescription>
          </DialogHeader>

          {editTarget && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/30 p-3 text-xs space-y-1">
                <p>
                  <strong>Reporter:</strong>{" "}
                  {editTarget.reporter_id
                    ? `Authenticated user (${editTarget.reporter_id.slice(0, 8)})`
                    : editTarget.reporter_email
                      ? `${editTarget.reporter_name ?? "Anonymous"} <${editTarget.reporter_email}>`
                      : "Anonymous (no contact)"}
                </p>
                <p>
                  <strong>Category:</strong> {CATEGORY_LABELS[editTarget.category] ?? editTarget.category}
                </p>
                <p>
                  <strong>Filed at:</strong> {formatDateTime(editTarget.created_at)}
                </p>
                <p>
                  <strong>Description:</strong>
                </p>
                <p className="whitespace-pre-wrap text-muted-foreground">{editTarget.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Status</label>
                  <Select value={draftStatus} onValueChange={(v) => setDraftStatus(v as FraudStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_LABELS) as FraudStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Severity</label>
                  <Select value={draftSeverity} onValueChange={(v) => setDraftSeverity(v as Severity)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Resolution notes (visible to reporter)</label>
                <Textarea
                  placeholder="Externally-visible summary of action taken."
                  value={draftResolution}
                  onChange={(e) => setDraftResolution(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Internal notes <span className="text-muted-foreground">(admin only)</span>
                </label>
                <Textarea
                  placeholder="Pattern matches, law-enforcement coordination, internal escalation notes."
                  value={draftInternal}
                  onChange={(e) => setDraftInternal(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={() => setConfirmOpen(true)} disabled={!draftStatus}>
              Save…
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm fraud-triage decision
            </AlertDialogTitle>
            <AlertDialogDescription>
              Setting status to <strong>{STATUS_LABELS[draftStatus]}</strong>, severity{" "}
              <strong>{draftSeverity}</strong>. Your user ID is recorded as the actor. Fraud-report
              changes are auditable; confirm only when you've completed the investigative work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={save} disabled={isSaving}>
              {isSaving ? "Saving…" : "I understand — save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
