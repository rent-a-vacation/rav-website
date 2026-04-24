import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/**
 * Priority action item rendered as a compact tile on a dashboard landing view.
 * #381 — "surface what matters first" principle. Each tile is one click from
 * the detail destination; admins/owners/travelers shouldn't hunt through tabs.
 */
export interface PriorityAction {
  id: string;
  label: string;
  count: number;
  icon: LucideIcon;
  linkTo: string;
  /** Short muted subtext under the label — the "why this needs attention". */
  help: string;
  /**
   * Visual urgency tone:
   *   urgent   — red/orange — time-critical (e.g. expiring offer deadline)
   *   action   — amber       — needs a decision
   *   info     — blue        — informational but worth noticing
   */
  tone: "urgent" | "action" | "info";
}

interface ActionNeededSectionProps {
  title?: string;
  emptyMessage?: string;
  emptyCtaLabel?: string;
  emptyCtaLink?: string;
  actions: PriorityAction[];
  isLoading?: boolean;
}

const TONE_CLASSES: Record<PriorityAction["tone"], string> = {
  urgent: "border-red-300 bg-red-50 text-red-800 hover:bg-red-100",
  action: "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100",
  info: "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100",
};

const TONE_ICON_BG: Record<PriorityAction["tone"], string> = {
  urgent: "bg-red-100",
  action: "bg-amber-100",
  info: "bg-blue-100",
};

export function ActionNeededSection({
  title = "Action Needed",
  emptyMessage = "You're all caught up.",
  emptyCtaLabel,
  emptyCtaLink,
  actions,
  isLoading = false,
}: ActionNeededSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground tracking-wide uppercase">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const filtered = actions.filter((a) => a.count > 0);

  if (filtered.length === 0) {
    return (
      <Card className="bg-emerald-50/50 border-emerald-200">
        <CardContent className="pt-6 pb-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-emerald-800">{emptyMessage}</p>
          {emptyCtaLabel && emptyCtaLink && (
            <Link
              to={emptyCtaLink}
              className="inline-flex items-center gap-1 mt-3 text-sm text-emerald-700 hover:text-emerald-900 underline"
            >
              {emptyCtaLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground tracking-wide uppercase">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((action) => (
          <Link
            key={action.id}
            to={action.linkTo}
            className={cn(
              "group flex items-start gap-3 rounded-lg border-2 p-3 transition-colors",
              TONE_CLASSES[action.tone],
            )}
          >
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0", TONE_ICON_BG[action.tone])}>
              <action.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="font-bold text-lg leading-none">{action.count}</span>
                <span className="text-sm font-medium truncate">{action.label}</span>
              </div>
              <p className="text-xs opacity-80 leading-snug">{action.help}</p>
            </div>
            <ArrowRight className="h-4 w-4 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
