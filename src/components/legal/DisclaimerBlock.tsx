import { cn } from "@/lib/utils";
import { DISCLAIMERS, type DisclaimerId } from "@/lib/disclaimers/registry";

export type DisclaimerVariant = "full" | "compact" | "minimal";

interface DisclaimerBlockProps {
  /** ID from the central disclaimer registry — e.g. "8.1", "8.8", "trademark". */
  id: DisclaimerId;
  /** Render style. `full` includes title; `compact` is title + text in a tinted box; `minimal` is text only. */
  variant?: DisclaimerVariant;
  /** Tailwind class string appended to the block. */
  className?: string;
  /** Optional `data-testid` override (defaults to `disclaimer-{id}`). */
  testId?: string;
}

/**
 * Renders a legally-required disclaimer pulled from the central registry
 * (`src/lib/disclaimers/registry.ts`). All disclaimer text in the application
 * MUST flow through this component — no hardcoded inline disclaimer strings.
 *
 * @see docs/legal/attorney-meeting-compliance-status.md
 * @see docs/legal/compliance-gap-analysis.md item I-1
 */
export function DisclaimerBlock({
  id,
  variant = "compact",
  className,
  testId,
}: DisclaimerBlockProps) {
  const disclaimer = DISCLAIMERS[id];
  if (!disclaimer) {
    if (typeof console !== "undefined") {
      console.warn(`[DisclaimerBlock] Unknown disclaimer id: ${id}`);
    }
    return null;
  }

  const dataId = testId ?? `disclaimer-${id}`;

  if (variant === "minimal") {
    return (
      <p
        data-testid={dataId}
        data-disclaimer-id={disclaimer.id}
        className={cn("text-xs text-muted-foreground leading-relaxed", className)}
      >
        {disclaimer.text}
      </p>
    );
  }

  if (variant === "full") {
    return (
      <section
        data-testid={dataId}
        data-disclaimer-id={disclaimer.id}
        className={cn(
          "rounded-xl border border-border bg-card p-6 text-foreground",
          className,
        )}
        aria-labelledby={`disclaimer-title-${disclaimer.id}`}
      >
        <h3
          id={`disclaimer-title-${disclaimer.id}`}
          className="font-display text-lg font-semibold mb-3"
        >
          {disclaimer.title}
        </h3>
        <p className="text-muted-foreground leading-relaxed">{disclaimer.text}</p>
      </section>
    );
  }

  // compact (default)
  return (
    <div
      data-testid={dataId}
      data-disclaimer-id={disclaimer.id}
      className={cn(
        "rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground",
        className,
      )}
    >
      <p className="font-medium text-foreground mb-1">{disclaimer.title}</p>
      <p>{disclaimer.text}</p>
    </div>
  );
}
