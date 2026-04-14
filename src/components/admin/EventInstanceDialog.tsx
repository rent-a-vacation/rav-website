/**
 * Add/Edit dialog for event_instances (specific-year dates).
 * Used from Event Calendar tab in Admin Notification Center.
 * Issue #338.
 */

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface EventInstance {
  id?: string;
  event_id: string;
  destination: string | null;
  year: number;
  event_date: string;
  end_date: string | null;
  priority: string;
  status: string;
  date_confirmed: boolean;
  notes: string | null;
}

interface SeasonalEventOption {
  id: string;
  name: string;
}

const DESTINATION_OPTIONS = [
  { value: "", label: "— None (search-only event) —" },
  { value: "orlando", label: "Orlando" },
  { value: "miami", label: "Miami" },
  { value: "las_vegas", label: "Las Vegas" },
  { value: "maui_hawaii", label: "Maui / Hawaii" },
  { value: "myrtle_beach", label: "Myrtle Beach" },
  { value: "colorado", label: "Colorado" },
  { value: "new_york", label: "New York" },
  { value: "nashville", label: "Nashville" },
];

const PRIORITY_OPTIONS = ["urgent", "high", "medium", "plan"];
const STATUS_OPTIONS = ["active", "cancelled", "past"];

function emptyInstance(year: number): EventInstance {
  return {
    event_id: "",
    destination: null,
    year,
    event_date: `${year}-01-01`,
    end_date: null,
    priority: "medium",
    status: "active",
    date_confirmed: false,
    notes: null,
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: EventInstance | null;
  defaultYear: number;
  onSaved: () => void;
}

export function EventInstanceDialog({ open, onOpenChange, initial, defaultYear, onSaved }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<EventInstance>(emptyInstance(defaultYear));
  const [templates, setTemplates] = useState<SeasonalEventOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ?? emptyInstance(defaultYear));
      supabase
        .from("seasonal_events")
        .select("id, name")
        .eq("active", true)
        .order("name")
        .then(({ data }) => setTemplates((data ?? []) as SeasonalEventOption[]));
    }
  }, [open, initial, defaultYear]);

  const handleSave = async () => {
    if (!form.event_id) {
      toast({ title: "Select a template", variant: "destructive" });
      return;
    }
    if (!form.event_date) {
      toast({ title: "Event date required", variant: "destructive" });
      return;
    }
    if (form.end_date && form.end_date < form.event_date) {
      toast({ title: "End date must be on or after start date", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      event_id: form.event_id,
      destination: form.destination || null,
      year: form.year,
      event_date: form.event_date,
      end_date: form.end_date || null,
      priority: form.priority,
      status: form.status,
      date_confirmed: form.date_confirmed,
      notes: form.notes,
    };

    const { error } = form.id
      ? await supabase.from("event_instances").update(payload).eq("id", form.id)
      : await supabase.from("event_instances").insert(payload);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: form.id ? "Instance updated" : "Instance created" });
      onOpenChange(false);
      onSaved();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit Event Instance" : "New Event Instance"}</DialogTitle>
          <DialogDescription>
            Specific-year date for an event template. Leave destination blank for search-only events (no SMS).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Event Template</Label>
            <Select
              value={form.event_id}
              onValueChange={(v) => setForm({ ...form, event_id: v })}
              disabled={!!form.id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Destination (for SMS)</Label>
              <Select
                value={form.destination ?? ""}
                onValueChange={(v) => setForm({ ...form, destination: v || null })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DESTINATION_OPTIONS.map((d) => (
                    <SelectItem key={d.value || "none"} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ev-year">Year</Label>
              <Input
                id="ev-year"
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ev-start">Start date</Label>
              <Input
                id="ev-start"
                type="date"
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ev-end">End date (optional)</Label>
              <Input
                id="ev-end"
                type="date"
                value={form.end_date ?? ""}
                onChange={(e) => setForm({ ...form, end_date: e.target.value || null })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="ev-confirmed">Date confirmed</Label>
            <Switch
              id="ev-confirmed"
              checked={form.date_confirmed}
              onCheckedChange={(v) => setForm({ ...form, date_confirmed: v })}
            />
          </div>

          <div>
            <Label htmlFor="ev-notes">Notes</Label>
            <Textarea
              id="ev-notes"
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : form.id ? "Save changes" : "Create instance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
