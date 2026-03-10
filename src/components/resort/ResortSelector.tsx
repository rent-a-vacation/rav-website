import { useState, useEffect } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { supabase } from "@/lib/supabase";
import type { Resort, VacationClubBrand } from "@/types/database";
import { MapPin, Star, Loader2 } from "lucide-react";

type ResortSummary = Pick<
  Resort,
  "id" | "brand" | "resort_name" | "location" | "guest_rating"
>;

interface ResortSelectorProps {
  selectedBrand: VacationClubBrand;
  onResortSelect: (resort: ResortSummary) => void;
  selectedResortId?: string | null;
}

export function ResortSelector({
  selectedBrand,
  onResortSelect,
  selectedResortId,
}: ResortSelectorProps) {
  const [resorts, setResorts] = useState<ResortSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedBrand) {
      loadResorts();
    } else {
      setResorts([]);
    }
  }, [selectedBrand]);

  async function loadResorts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("resorts")
      .select("id, brand, resort_name, location, guest_rating")
      .eq("brand", selectedBrand)
      .order("resort_name");

    if (error) {
      console.error("Error loading resorts:", error.message);
    }
    setResorts((data as ResortSummary[]) || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading resorts...</span>
      </div>
    );
  }

  if (!selectedBrand) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Select a vacation club brand first.
      </div>
    );
  }

  return (
    <Command className="border rounded-md">
      <CommandInput placeholder={`ResortIQ — search ${resorts.length} resorts...`} />
      <CommandList>
        <CommandEmpty>No resorts found.</CommandEmpty>
        <CommandGroup>
          {resorts.map((resort) => (
            <CommandItem
              key={resort.id}
              value={resort.resort_name}
              onSelect={() => onResortSelect(resort)}
              className={
                selectedResortId === resort.id
                  ? "bg-accent"
                  : ""
              }
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{resort.resort_name}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {resort.location.city}, {resort.location.state}
                  {resort.guest_rating && (
                    <>
                      <span className="mx-1">-</span>
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      {resort.guest_rating}
                    </>
                  )}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
