import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionTone = "default" | "muted" | "primary" | "warm";
type SectionSpacing = "sm" | "md" | "lg";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: SectionTone;
  spacing?: SectionSpacing;
  bordered?: boolean;
  containerClassName?: string;
  fullBleed?: boolean;
}

const toneClass: Record<SectionTone, string> = {
  default: "bg-background text-foreground",
  muted: "bg-muted/40 text-foreground",
  primary: "bg-primary text-primary-foreground",
  warm: "bg-gradient-warm text-foreground",
};

const spacingClass: Record<SectionSpacing, string> = {
  sm: "py-10 md:py-12",
  md: "py-12 md:py-16",
  lg: "py-16 md:py-20",
};

export const Section = forwardRef<HTMLElement, SectionProps>(
  (
    {
      tone = "default",
      spacing = "md",
      bordered = false,
      containerClassName,
      fullBleed = false,
      className,
      children,
      ...rest
    },
    ref,
  ) => (
    <section
      ref={ref}
      className={cn(
        toneClass[tone],
        spacingClass[spacing],
        bordered && "border-t border-border/60",
        className,
      )}
      {...rest}
    >
      {fullBleed ? (
        children
      ) : (
        <div className={cn("container mx-auto px-4", containerClassName)}>
          {children}
        </div>
      )}
    </section>
  ),
);
Section.displayName = "Section";

interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const titleSizeClass: Record<NonNullable<SectionHeaderProps["size"]>, string> = {
  sm: "text-xl md:text-2xl",
  md: "text-2xl md:text-3xl",
  lg: "text-3xl md:text-4xl",
};

export const SectionHeader = ({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  className,
  size = "md",
}: SectionHeaderProps) => {
  const isCenter = align === "center";
  return (
    <div
      className={cn(
        "mb-8 md:mb-10",
        isCenter
          ? "text-center max-w-2xl mx-auto"
          : "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn(isCenter ? "" : "max-w-2xl")}>
        {eyebrow && (
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </div>
        )}
        <h2
          className={cn(
            "font-display font-bold text-foreground tracking-tight",
            titleSizeClass[size],
          )}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {!isCenter && action && <div className="shrink-0">{action}</div>}
      {isCenter && action && <div className="mt-6">{action}</div>}
    </div>
  );
};
