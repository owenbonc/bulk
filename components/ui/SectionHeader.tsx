"use client";

import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "./cn";
import { IconButton } from "./IconButton";

export interface SectionHeaderProps {
  title: string;
  /** Shown after the title: "Highlights · 4". */
  count?: number;
  /** Shows a round arrow button on the right (e.g. to scroll a carousel). */
  onArrowClick?: () => void;
  /** Accessible name for the arrow button. Defaults to "More {title}". */
  arrowLabel?: string;
  /** Custom trailing content instead of the arrow. */
  action?: ReactNode;
  /** Heading level. */
  as?: "h2" | "h3";
  id?: string;
  className?: string;
}

/** Section title in the display face with an optional count and trailing arrow button. */
export function SectionHeader({ title, count, onArrowClick, arrowLabel, action, as: Heading = "h2", id, className }: SectionHeaderProps) {
  const trailing =
    action ??
    (onArrowClick && (
      <IconButton aria-label={arrowLabel ?? `More ${title}`} size="sm" variant="outline" onClick={onArrowClick}>
        <ArrowRight />
      </IconButton>
    ));

  return (
    <div className={cn("flex min-h-11 items-center justify-between gap-3", className)}>
      <Heading id={id} className="font-display text-section font-semibold text-ink">
        {title}
        {count !== undefined && <span className="tnum font-sans text-body font-normal tracking-normal text-ink-3"> · {count}</span>}
      </Heading>
      {trailing}
    </div>
  );
}
