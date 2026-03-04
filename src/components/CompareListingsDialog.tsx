import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ExternalLink } from "lucide-react";
import type { ActiveListing } from "@/hooks/useListings";
import { buildComparisonRows } from "@/lib/compareListings";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CompareListingsDialogProps {
  listings: ActiveListing[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: (id: string) => void;
}

export function CompareListingsDialog({
  listings,
  open,
  onOpenChange,
  onRemove,
}: CompareListingsDialogProps) {
  const rows = buildComparisonRows(listings);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Properties ({listings.length})</DialogTitle>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 font-medium text-muted-foreground w-28" />
                {listings.map((listing) => {
                  const image = listing.property.images?.[0] || listing.property.resort?.main_image_url || null;
                  return (
                    <th key={listing.id} className="p-2 text-center min-w-[180px]">
                      <div className="relative">
                        <button
                          onClick={() => onRemove(listing.id)}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center"
                          aria-label="Remove from comparison"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {image && (
                          <img
                            src={image}
                            alt=""
                            className="w-full h-24 object-cover rounded-lg mb-2"
                          />
                        )}
                        <Link
                          to={`/property/${listing.id}`}
                          className="text-xs text-primary hover:underline flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Property
                        </Link>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t">
                  <td className="p-2 font-medium text-muted-foreground text-xs whitespace-nowrap">
                    {row.label}
                  </td>
                  {row.values.map((value, i) => (
                    <td
                      key={i}
                      className={cn(
                        "p-2 text-center text-sm",
                        row.bestIndex === i && "font-semibold"
                      )}
                    >
                      <span className="flex items-center justify-center gap-1">
                        {value}
                        {row.bestIndex === i && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-emerald-100 text-emerald-800">
                            Best
                          </Badge>
                        )}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
