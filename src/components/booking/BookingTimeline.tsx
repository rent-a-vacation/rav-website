import { CheckCircle2, Circle, Dot } from "lucide-react";
import type { TimelineStep } from "@/lib/bookingTimeline";
import { cn } from "@/lib/utils";

interface BookingTimelineProps {
  steps: TimelineStep[];
  compact?: boolean;
}

const STEP_ICON = {
  complete: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
  active: <Dot className="h-5 w-5 text-primary animate-pulse" />,
  upcoming: <Circle className="h-5 w-5 text-muted-foreground/40" />,
} as const;

const LINE_CLASS = {
  complete: "bg-emerald-500",
  active: "bg-primary/30",
  upcoming: "bg-muted-foreground/20",
} as const;

export function BookingTimeline({ steps, compact }: BookingTimelineProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1 w-full">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            <div
              className={cn(
                "flex items-center justify-center shrink-0",
                step.status === "complete" && "text-emerald-600",
                step.status === "active" && "text-primary",
                step.status === "upcoming" && "text-muted-foreground/40"
              )}
              title={step.title}
            >
              {step.status === "complete" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : step.status === "active" ? (
                <Dot className="h-4 w-4 animate-pulse" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-0.5 flex-1 mx-0.5 rounded-full", LINE_CLASS[step.status])} />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.id} className="flex gap-3">
          {/* Icon + Line */}
          <div className="flex flex-col items-center">
            <div className="shrink-0">{STEP_ICON[step.status]}</div>
            {i < steps.length - 1 && (
              <div className={cn("w-0.5 flex-1 my-1 rounded-full min-h-[24px]", LINE_CLASS[step.status])} />
            )}
          </div>

          {/* Content */}
          <div className={cn("pb-4", i === steps.length - 1 && "pb-0")}>
            <p
              className={cn(
                "text-sm font-medium leading-5",
                step.status === "upcoming" && "text-muted-foreground"
              )}
            >
              {step.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
