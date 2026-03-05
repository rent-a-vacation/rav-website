import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2 } from "lucide-react";
import type { Property, VacationClubBrand } from "@/types/database";

const BRAND_OPTIONS: { value: VacationClubBrand; label: string }[] = [
  { value: "hilton_grand_vacations", label: "Hilton Grand Vacations" },
  { value: "marriott_vacation_club", label: "Marriott Vacation Club" },
  { value: "disney_vacation_club", label: "Disney Vacation Club" },
  { value: "wyndham_destinations", label: "Wyndham Destinations" },
  { value: "hyatt_residence_club", label: "Hyatt Residence Club" },
  { value: "bluegreen_vacations", label: "Bluegreen Vacations" },
  { value: "holiday_inn_club", label: "Holiday Inn Club" },
  { value: "worldmark", label: "WorldMark" },
  { value: "other", label: "Other" },
];

interface AdminPropertyEditDialogProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const AdminPropertyEditDialog = ({
  property,
  open,
  onOpenChange,
  onSaved,
}: AdminPropertyEditDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [brand, setBrand] = useState<VacationClubBrand>("other");
  const [resortName, setResortName] = useState("");
  const [location, setLocation] = useState("");
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [sleeps, setSleeps] = useState(2);
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState("");

  // Populate form when property changes or dialog opens
  useEffect(() => {
    if (open && property) {
      setBrand(property.brand);
      setResortName(property.resort_name);
      setLocation(property.location);
      setBedrooms(property.bedrooms);
      setBathrooms(property.bathrooms);
      setSleeps(property.sleeps);
      setDescription(property.description || "");
      setAmenities((property.amenities || []).join(", "));
    }
  }, [open, property]);

  const handleSave = async () => {
    if (!property || !user) return;

    setIsSaving(true);
    try {
      const amenitiesArray = amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      const { error } = await supabase
        .from("properties")
        .update({
          brand,
          resort_name: resortName,
          location,
          bedrooms,
          bathrooms,
          sleeps,
          description: description || null,
          amenities: amenitiesArray.length > 0 ? amenitiesArray : null,
          last_edited_by: user.id,
          last_edited_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq("id", property.id);

      if (error) throw error;

      toast({
        title: "Property updated",
        description: `${resortName} has been updated successfully.`,
      });
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating property:", error);
      toast({
        title: "Error",
        description: "Failed to update property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!property) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Property</DialogTitle>
          <DialogDescription>
            Admin edit for property owned by {property.owner_id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Select value={brand} onValueChange={(v) => setBrand(v as VacationClubBrand)}>
              <SelectTrigger id="brand">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BRAND_OPTIONS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resort-name">Resort Name</Label>
            <Input
              id="resort-name"
              value={resortName}
              onChange={(e) => setResortName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                min={0}
                value={bedrooms}
                onChange={(e) => setBedrooms(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                min={0}
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sleeps">Sleeps</Label>
              <Input
                id="sleeps"
                type="number"
                min={1}
                value={sleeps}
                onChange={(e) => setSleeps(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amenities">Amenities (comma-separated)</Label>
            <Input
              id="amenities"
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              placeholder="Pool, Kitchen, WiFi, Parking"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !resortName || !location}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPropertyEditDialog;
