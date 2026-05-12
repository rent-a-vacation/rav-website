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
import { AlertTriangle, ShieldAlert, ExternalLink, MessageSquare } from "lucide-react";

type ReportStatus =
  | "pending"
  | "investigating"
  | "resolved_confirmed"
  | "resolved_corrected"
  | "dismissed_no_issue"
  | "dismissed_spam";

interface AccuracyReportRow {
  id: string;
  listing_id: string;
  reporter_id: string | null;
  reporter_email: string | null;
  reporter_name: string | null;
  category: string;
  description: string;
  status: ReportStatus;
  resolution_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: "Pending",
  investigating: "Investigating",
  resolved_confirmed: "Resolved — confirmed",
  resolved_corrected: "Resolved — corrected",
  dismissed_no_issue: "Dismissed — no issue",
  dismissed_spam: "Dismissed — spam",
};

const STATUS_VARIANTS: Record<ReportStatus, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "destructive",
  investigating: "secondary",
  resolved_confirmed: "default",
  resolved_corrected: "default",
  dismissed_no_issue: "outline",
  dismissed_spam: "outline",
};

const CATEGORY_LABELS: Record<string, string> = {
  photos: "Photos",
  description: "Description",
  amenities: "Amenities",
  pricing: "Pricing",
  availability: "Availability",
  location: "Location",
  cancellation_policy: "Cancellation policy",
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

export function AdminListingAccuracyReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<AccuracyReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("pending");
  const [editTarget, setEditTarget] = useState<AccuracyReportRow | null>(null);
  const [draftStatus, setDraftStatus] = useState<ReportStatus>("investigating");
  const [draftNotes, setDraftNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("listing_accuracy_reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load reports", description: error.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }
    setRows((data ?? []) as AccuracyReportRow[]);
    setIsLoading(false);
  }

  const summary = useMemo(() => {
    const counts: Record<ReportStatus, number> = {
      pending: 0,
      investigating: 0,
      resolved_confirmed: 0,
      resolved_corrected: 0,
      dismissed_no_issue: 0,
      dismissed_spam: 0,
    };
    for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return counts;
  }, [rows]);

  const filteredRows = useMemo(
    () => (statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter)),
    [rows, statusFilter],
  );

  function openEdit(row: AccuracyReportRow) {
    setEditTarget(row);
    setDraftStatus(row.status === "pending" ? "investigating" : row.status);
    setDraftNotes(row.resolution_notes ?? "");
  }

  function closeEdit() {
    setEditTarget(null);
    setDraftStatus("investigating");
    setDraftNotes("");
    setConfirmOpen(false);
  }

  async function save() {
    if (!editTarget || !user) return;
    setIsSaving(true);
    const isResolution = draftStatus.startsWith("resolved_") || draftStatus.startsWith("dismissed_");
    const payload: Record<string, unknown> = {
      status: draftStatus,
      resolution_notes: draftNotes.trim() || null,
    };
    if (isResolution) {
      payload.resolved_at = new Date().toISOString();
      payload.resolved_by = user.id;
    } else {
      payload.resolved_at = null;
      payload.resolved_by = null;
    }
    const { error } = await supabase
      .from("listing_accuracy_reports")
      .update(payload)
      .eq("id", editTarget.id);
    setIsSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Report updated",
      description: `Status set to ${STATUS_LABELS[draftStatus]}.`,
    });
    closeEdit();
    void load();
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Listing accuracy reports</CardTitle>
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
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Listing accuracy reports
          </CardTitle>
          <CardDescription>
            Pre-booking complaints from guests browsing the marketplace. Investigate, then mark as
            confirmed/corrected/dismissed. Required by Palmer v. FantaSea Resorts (2025) — RAV's
            liability hinges on a working complaint intake.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
            {(Object.keys(STATUS_LABELS) as ReportStatus[]).map((s) => (
              <div key={s} className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground truncate" title={STATUS_LABELS[s]}>
                  {STATUS_LABELS[s]}
                </p>
                <p className="text-2xl font-semibold">{summary[s]}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-muted-foreground">Filter:</span>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReportStatus | "all")}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(Object.keys(STATUS_LABELS) as ReportStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-2">{filteredRows.length} shown</span>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Listing</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                        <a
                          href={`/listings/${row.listing_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 font-mono text-xs"
                        >
                          {row.listing_id.slice(0, 8)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-sm">
                        {CATEGORY_LABELS[row.category] ?? row.category}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.reporter_id ? "Authed user" : row.reporter_email ?? "Anonymous"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[row.status]}>{STATUS_LABELS[row.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[320px]">
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
        <DialogContent className="max-w-lg" data-testid="triage-dialog">
          <DialogHeader>
            <DialogTitle>Triage report</DialogTitle>
            <DialogDescription>
              Resolution records your user ID + timestamp. You'll confirm before save.
            </DialogDescription>
          </DialogHeader>

          {editTarget && (
            <div className="space-y-3">
              <div className="rounded-lg bg-muted/30 p-3 text-xs space-y-1">
                <p>
                  <strong>Listing:</strong>{" "}
                  <a
                    href={`/listings/${editTarget.listing_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-mono"
                  >
                    {editTarget.listing_id}
                  </a>
                </p>
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
                  <strong>Description:</strong>
                </p>
                <p className="whitespace-pre-wrap text-muted-foreground">{editTarget.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">New status</label>
                <Select value={draftStatus} onValueChange={(v) => setDraftStatus(v as ReportStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as ReportStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Resolution notes</label>
                <Textarea
                  placeholder="What did you find? What action was taken with the host?"
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  rows={4}
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
              Confirm triage decision
            </AlertDialogTitle>
            <AlertDialogDescription>
              Setting status to <strong>{STATUS_LABELS[draftStatus]}</strong>. Your user ID is recorded
              as the resolver. This is an auditable change tied to a guest's report — confirm only when
              you've actually investigated.
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
