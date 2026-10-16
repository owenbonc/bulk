import { Clock } from "lucide-react";
import { cn } from "@/components/ui";
import type { Restaurant } from "@/lib/types";

/** "25–35 min" */
export function etaText(restaurant: Restaurant): string {
  const [lo, hi] = restaurant.etaMin;
  return `${lo}–${hi} min`;
}

/** "Just now", "4 min ago", "2 h ago". */
export function timeAgo(at: number, now: number): string {
  const min = Math.floor(Math.max(0, now - at) / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  return `${Math.floor(min / 60)} h ago`;
}

/** Clock icon + delivery window, in the Rating's 12px secondary style. */
export function Eta({ restaurant, className }: { restaurant: Restaurant; className?: string }) {
  return (
    <span className={cn("tnum inline-flex shrink-0 items-center gap-1 text-meta whitespace-nowrap text-ink-2", className)}>
      <Clock aria-hidden className="size-3.5 shrink-0" />
      <span className="sr-only">Delivers in </span>
      {etaText(restaurant)}
    </span>
  );
}
