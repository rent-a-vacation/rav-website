import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { MapPin, Pencil, AlertTriangle } from "lucide-react";

type RegistrationStatus = "not_required" | "pending" | "registered" | "exempt";

interface MarketplaceRegistrationRow {
  state: string;
  registration_status: RegistrationStatus;
  registered_date: string | null;
  first_return_due: string | null;
  last_return_filed: string | null;
  next_return_due: string | null;
  registration_id: string | null;
  notes: string | null;
  updated_at: string;
  updated_by: string | null;
}

const STATUS_LABELS: Record<RegistrationStatus, string> = {
  not_required: "Not required",
  pending: "Pending",
  registered: "Registered",
  exempt: "Exempt",
};

const STATUS_VARIANTS: Record<RegistrationStatus, "default" | "secondary" | "outline" | "destructive"> = {
  not_required: "outline",
  pending: "secondary",
  registered: "default",
  exempt: "outline",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function toDateInputValue(value: string | null): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

interface EditDraft {
  registration_status: RegistrationStatus;
  registered_date: string;
  first_return_due: string;
  last_return_filed: string;
  next_return_due: string;
  registration_id: string;
  notes: string;
}

function rowToDraft(row: MarketplaceRegistrationRow): EditDraft {
  return {
    registration_status: row.registration_status,
    registered_date: toDateInputValue(row.registered_date),
    first_return_due: toDateInputValue(row.first_return_due),
    last_return_filed: toDateInputValue(row.last_return_filed),
    next_return_due: toDateInputValue(row.next_return_due),
    registration_id: row.registration_id ?? "",
    notes: row.notes ?? "",
  };
}

export function AdminMarketplaceRegistrations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<MarketplaceRegistrationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<MarketplaceRegistrationRow | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void load();
    // load is a stable closure that uses no component state on read — safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("marketplace_registrations")
      .select("*")
      .order("state");
    if (error) {
      toast({ title: "Failed to load registrations", description: error.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }
    setRows((data ?? []) as MarketplaceRegistrationRow[]);
    setIsLoading(false);
  }

  const summary = useMemo(() => {
    const counts: Record<RegistrationStatus, number> = {
      not_required: 0,
      pending: 0,
      registered: 0,
      exempt: 0,
    };
    for (const r of rows) counts[r.registration_status] = (counts[r.registration_status] ?? 0) + 1;
    return counts;
  }, [rows]);

  function openEdit(row: MarketplaceRegistrationRow) {
    setEditTarget(row);
    setDraft(rowToDraft(row));
  }

  function closeEdit() {
    setEditTarget(null);
    setDraft(null);
    setConfirmOpen(false);
  }

  async function save() {
    if (!editTarget || !draft || !user) return;
    setIsSaving(true);
    const payload = {
      registration_status: draft.registration_status,
      registered_date: draft.registered_date || null,
      first_return_due: draft.first_return_due || null,
      last_return_filed: draft.last_return_filed || null,
      next_return_due: draft.next_return_due || null,
      registration_id: draft.registration_id.trim() || null,
      notes: draft.notes.trim() || null,
      updated_by: user.id,
    };
    const { error } = await supabase
      .from("marketplace_registrations")
      .update(payload)
      .eq("state", editTarget.state);
    setIsSaving(false);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: `${editTarget.state} registration updated`,
      description: `Status set to ${STATUS_LABELS[draft.registration_status]}.`,
    });
    closeEdit();
    void load();
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Marketplace-facilitator registrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
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
            <MapPin className="h-5 w-5 text-primary" />
            Marketplace-facilitator registrations
          </CardTitle>
          <CardDescription>
            State-by-state tax registration status. Required by Compliance Brief § 3.4 — counsel question C7 fills in
            the values per state. Only RAV admins can change a row's status; every change records who, when, and the
            notes you leave.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {(Object.keys(STATUS_LABELS) as RegistrationStatus[]).map((s) => (
              <div key={s} className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">{STATUS_LABELS[s]}</p>
                <p className="text-2xl font-semibold">{summary[s]}</p>
              </div>
            ))}
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>State</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Next return due</TableHead>
                  <TableHead>Registration ID</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.state} data-state-row={row.state}>
                    <TableCell className="font-mono font-semibold">{row.state}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[row.registration_status]}>
                        {STATUS_LABELS[row.registration_status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(row.registered_date)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(row.next_return_due)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.registration_id ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[260px] truncate" title={row.notes ?? ""}>
                      {row.notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                        <Pencil className="h-4 w-4 mr-1.5" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {editTarget?.state} registration</DialogTitle>
            <DialogDescription>
              Changes record your user ID + timestamp. You'll confirm before save.
            </DialogDescription>
          </DialogHeader>

          {draft && editTarget && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Status</label>
                <Select
                  value={draft.registration_status}
                  onValueChange={(v) => setDraft({ ...draft, registration_status: v as RegistrationStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as RegistrationStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1">Registered date</label>
                  <Input
                    type="date"
                    value={draft.registered_date}
                    onChange={(e) => setDraft({ ...draft, registered_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Next return due</label>
                  <Input
                    type="date"
                    value={draft.next_return_due}
                    onChange={(e) => setDraft({ ...draft, next_return_due: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">First return due</label>
                  <Input
                    type="date"
                    value={draft.first_return_due}
                    onChange={(e) => setDraft({ ...draft, first_return_due: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Last return filed</label>
                  <Input
                    type="date"
                    value={draft.last_return_filed}
                    onChange={(e) => setDraft({ ...draft, last_return_filed: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Registration ID</label>
                <Input
                  placeholder="State-issued account / license number"
                  value={draft.registration_id}
                  onChange={(e) => setDraft({ ...draft, registration_id: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Notes</label>
                <Textarea
                  placeholder="Counsel guidance, filing cadence, rate notes…"
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>
              Cancel
            </Button>
            <Button onClick={() => setConfirmOpen(true)} disabled={!draft}>
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
              Confirm registration change for {editTarget?.state}
            </AlertDialogTitle>
            <AlertDialogDescription>
              You're changing how RAV files marketplace-facilitator taxes for{" "}
              <strong>{editTarget?.state}</strong>: from{" "}
              <strong>{editTarget && STATUS_LABELS[editTarget.registration_status]}</strong> to{" "}
              <strong>{draft && STATUS_LABELS[draft.registration_status]}</strong>. This affects tax behavior at
              platform scale. Your user ID is recorded as the change author.
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
