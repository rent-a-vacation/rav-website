/**
 * Admin Event Templates tab — CRUD for seasonal_events.
 * Issue #338.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Edit2, Archive, ArchiveRestore } from "lucide-react";
import { EventTemplateDialog, type EventTemplate } from "./EventTemplateDialog";

interface TemplateRow extends EventTemplate {
  id: string;
}

export function AdminEventTemplates() {
  const { toast } = useToast();
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [confirmRetire, setConfirmRetire] = useState<TemplateRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("seasonal_events")
      .select("*")
      .order("typical_month", { ascending: true, nullsFirst: false })
      .order("name");
    if (error) {
      toast({ title: "Load failed", description: error.message, variant: "destructive" });
    } else {
      setRows((data ?? []) as TemplateRow[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActive = async (row: TemplateRow) => {
    const next = !row.active;
    const { error } = await supabase
      .from("seasonal_events")
      .update({ active: next })
      .eq("id", row.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, active: next } : r)));
      toast({ title: next ? "Template reactivated" : "Template retired" });
    }
    setConfirmRetire(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Event templates define recurring events. Add specific-year dates in the Event Calendar tab.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Template
        </Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Recurrence</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Destinations</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No event templates yet. Click "New Template" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} className={row.active ? "" : "opacity-50"}>
                    <TableCell className="text-sm font-medium">{row.name}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {row.slug ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline">{row.category}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{row.recurrence_type}</TableCell>
                    <TableCell className="text-xs">
                      {row.is_nationwide ? (
                        <Badge variant="outline" className="bg-blue-50">Nationwide</Badge>
                      ) : (
                        <Badge variant="outline">Destination-scoped</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-40 truncate">
                      {(row.search_destinations ?? []).join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={row.active ? "bg-green-50" : "bg-gray-50"}>
                        {row.active ? "Active" : "Retired"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Edit"
                          onClick={() => {
                            setEditing(row);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title={row.active ? "Retire" : "Reactivate"}
                          onClick={() =>
                            row.active ? setConfirmRetire(row) : handleToggleActive(row)
                          }
                        >
                          {row.active ? (
                            <Archive className="h-3.5 w-3.5" />
                          ) : (
                            <ArchiveRestore className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <EventTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSaved={load}
      />

      <AlertDialog open={!!confirmRetire} onOpenChange={() => setConfirmRetire(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retire event template?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmRetire?.name}" will be hidden from renter-facing search and SMS dispatch.
              Existing instances are preserved and can be reactivated later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmRetire && handleToggleActive(confirmRetire)}>
              Retire
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
