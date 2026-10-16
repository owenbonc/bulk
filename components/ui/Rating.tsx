import { Star } from "lucide-react";
import { cn } from "./cn";

export interface RatingProps {
  /** Average rating out of 5, shown with one decimal ("4.6"). */
  value: number;
  /** Number of reviews, shown in brackets ("(250)"). */
  count?: number;
  /** Word after the number, e.g. "Good" or "Excellent". */
  label?: string;
  className?: string;
}

/**
 * Restaurant rating: filled star, number, optional label and review count ("★ 4.6 Good (250)").
 * One size (13px) and colour on every screen; read aloud as a sentence.
 */
export function Rating({ value, count, label, className }: RatingProps) {
  const spoken = `Rated ${value.toFixed(1)} out of 5${label ? `, ${label}` : ""}${count !== undefined ? `, ${count} reviews` : ""}`;
  return (
    <span className={cn("tnum inline-flex shrink-0 items-center gap-1 text-meta whitespace-nowrap text-ink-2", className)}>
      <span className="sr-only">{spoken}</span>
      <Star aria-hidden className="size-3.5 shrink-0 fill-accent-ink text-accent-ink" />
      <span aria-hidden className="font-semibold text-ink">
        {value.toFixed(1)}
      </span>
      {label && <span aria-hidden>{label}</span>}
      {count !== undefined && <span aria-hidden>({count})</span>}
    </span>
  );
}
