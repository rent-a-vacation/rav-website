import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Sparkles } from "lucide-react";
import type { ListingSourceType } from "@/types/database";

/**
 * Visual identifier for the two marketplace flows (DEC-034).
 * Always renders — even pre_booked (the default) — so the distinction is
 * part of the mental model users see consistently across the app.
 */
interface ListingTypeBadgeProps {
  type: ListingSourceType;
  size?: "sm" | "md";
  className?: string;
}

const CONFIG: Record<ListingSourceType, {
  label: string;
  icon: React.ReactNode;
  className: string;
  title: string;
}> = {
  pre_booked: {
    label: "Pre-Booked Stay",
    icon: <CalendarCheck className="h-3 w-3" />,
    className:
      "border-emerald-500/50 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    title:
      "Owner has the resort reservation already — this stay is ready to book and confirmed immediately on payment.",
  },
  wish_matched: {
    label: "Wish-Matched Stay",
    icon: <Sparkles className="h-3 w-3" />,
    className:
      "border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    title:
      "This stay matched a traveler's Wish. Owner will confirm the resort reservation after booking is accepted.",
  },
};

export function ListingTypeBadge({ type, size = "md", className = "" }: ListingTypeBadgeProps) {
  const config = CONFIG[type];
  return (
    <Badge
      variant="outline"
      title={config.title}
      className={[
        "gap-1",
        config.className,
        size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}
