import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "./cn";

export interface CardProps extends ComponentPropsWithRef<"div"> {
  /** Inner padding: 16px by default, or none for edge-to-edge content. */
  padded?: boolean;
}

/** White card with a 1px --line border and 18px radius. No shadow: cards sit on the page, they do not float. */
export function Card({ padded = true, className, ...rest }: CardProps) {
  return <div {...rest} className={cn("rounded-card border border-line bg-surface", padded && "p-4", className)} />;
}

export type SummaryTone = "default" | "muted" | "accent" | "offer";

const summaryTones: Record<SummaryTone, string> = {
  default: "text-ink",
  muted: "text-ink-2",
  accent: "text-accent-ink",
  offer: "text-offer",
};

export interface SummaryRowProps {
  label: ReactNode;
  value: ReactNode;
  /** Caption under the label, e.g. "when the party fills". */
  hint?: ReactNode;
  /** The total line: larger and bold. */
  strong?: boolean;
  /** Colour of the value. */
  tone?: SummaryTone;
  className?: string;
}

/** One line of a price breakdown: label on the left, tabular value on the right. */
export function SummaryRow({ label, value, hint, strong = false, tone = "default", className }: SummaryRowProps) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", strong ? "text-emphasis font-semibold" : "text-body", className)}>
      <div className="min-w-0">
        <div className={strong ? "text-ink" : "text-ink-2"}>{label}</div>
        {hint && <div className="text-meta font-normal text-ink-3">{hint}</div>}
      </div>
      <div className={cn("tnum shrink-0 text-right", summaryTones[tone])}>{value}</div>
    </div>
  );
}
