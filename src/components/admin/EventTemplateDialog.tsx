/**
 * Add/Edit dialog for seasonal_events (event templates).
 * Used from the Templates tab in Admin Notification Center.
 * GitHub Issue: #338
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

export interface EventTemplate {
  id?: string;
  name: string;
  slug: string | null;
  icon: string | null;
  category: string;
  recurrence_type: string;
  typical_month: number | null;
  is_nationwide: boolean;
  is_location_fixed: boolean;
  search_destinations: string[];
  active: boolean;
  notes: string | null;
}

const CATEGORIES = [
  { value: "major_holidays", label: "Major Holidays" },
  { value: "school_breaks", label: "School Breaks" },
  { value: "sports_events", label: "Sports Events" },
  { value: "local_events", label: "Local / Cultural Events" },
  { value: "weather_peak_season", label: "Weather / Peak Season" },
];

const RECURRENCE_TYPES = [
  { value: "annual_fixed", label: "Annual fixed (same dates each year)" },
  { value: "annual_floating", label: "Annual floating (dates shift yearly)" },
  { value: "one_time", label: "One-time event" },
];

function emptyTemplate(): EventTemplate {
  return {
    name: "",
    slug: null,
    icon: "Sparkles",
    category: "local_events",
    recurrence_type: "annual_fixed",
    typical_month: null,
    is_nationwide: false,
    is_location_fixed: true,
    search_destinations: [],
    active: true,
    notes: null,
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: EventTemplate | null;
  onSaved: () => void;
}

export function EventTemplateDialog({ open, onOpenChange, initial, onSaved }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState<EventTemplate>(emptyTemplate());
  const [destinationsInput, setDestinationsInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const tmpl = initial ?? emptyTemplate();
      setForm(tmpl);
      setDestinationsInput((tmpl.search_destinations ?? []).join(", "));
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const destinations = destinationsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      slug: form.slug?.trim() || slugify(form.name),
      icon: form.icon || "Sparkles",
      category: form.category,
      recurrence_type: form.recurrence_type,
      typical_month: form.typical_month,
      is_nationwide: form.is_nationwide,
      is_location_fixed: form.is_location_fixed,
      search_destinations: destinations,
      active: form.active,
      notes: form.notes,
    };

    const { error } = form.id
      ? await supabase.from("seasonal_events").update(payload).eq("id", form.id)
      : await supabase.from("seasonal_events").insert(payload);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: form.id ? "Template updated" : "Template created" });
      onOpenChange(false);
      onSaved();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit Event Template" : "New Event Template"}</DialogTitle>
          <DialogDescription>
            Templates define the event itself. Use the Event Calendar tab to add specific-year dates (instances).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="ev-name">Name</Label>
            <Input
              id="ev-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Sundance Film Festival"
            />
          </div>

          <div>
            <Label htmlFor="ev-slug">Slug (URL-safe, unique)</Label>
            <Input
              id="ev-slug"
              value={form.slug ?? ""}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder={slugify(form.name) || "auto-generated-from-name"}
            />
            <p className="text-xs text-muted-foreground mt-1">Leave blank to auto-generate from name.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recurrence</Label>
              <Select value={form.recurrence_type} onValueChange={(v) => setForm({ ...form, recurrence_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECURRENCE_TYPES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ev-icon">Icon (Lucide name)</Label>
              <Input
                id="ev-icon"
                value={form.icon ?? ""}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="e.g. Film, Trophy, Sun"
              />
            </div>
            <div>
              <Label htmlFor="ev-month">Typical month (1-12)</Label>
              <Input
                id="ev-month"
                type="number"
                min={1}
                max={12}
                value={form.typical_month ?? ""}
                onChange={(e) =>
                  setForm({ ...form, typical_month: e.target.value ? Number(e.target.value) : null })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ev-destinations">Search destinations (comma-separated)</Label>
            <Input
              id="ev-destinations"
              value={destinationsInput}
              onChange={(e) => setDestinationsInput(e.target.value)}
              placeholder="e.g. Park City, Vail, Aspen"
              disabled={form.is_nationwide}
            />
            <p className="text-xs text-muted-foreground mt-1">
              City or region names used to match listings to this event. Disabled for nationwide events.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="ev-nationwide">Nationwide event</Label>
              <Switch
                id="ev-nationwide"
                checked={form.is_nationwide}
                onCheckedChange={(v) => setForm({ ...form, is_nationwide: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ev-active">Active</Label>
              <Switch
                id="ev-active"
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ev-notes">Notes (internal)</Label>
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
            {saving ? "Saving..." : form.id ? "Save changes" : "Create template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
