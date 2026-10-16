"use client";

import { MapPin, Navigation, UtensilsCrossed } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_OUT, cn } from "@/components/ui";
import { deliveryProgress, useFrameNow } from "@/lib/store";
import type { OrderRequest, PickupPoint, Restaurant } from "@/lib/types";

const W = 343;
const H = 176;

type Point = readonly [number, number];

/**
 * The courier's route along the streets, restaurant → collection point. Both marker labels sit above their
 * markers, so the route reaches each marker from below or the side and never runs under a label, and both
 * markers sit far enough from the top edge for their label to stay inside the map.
 */
const ROUTE: Point[] = [
  [44, 138],
  [180, 138],
  [180, 108],
  [252, 108],
  [252, 80],
  [306, 80],
];

/** Stylised street grid: [x1, y1, x2, y2, width]. */
const STREETS: [number, number, number, number, number][] = [
  [0, 34, W, 34, 10],
  [0, 80, W, 80, 10],
  [0, 138, W, 138, 10],
  [44, 0, 44, H, 8],
  [180, 0, 180, H, 10],
  [306, 0, 306, 80, 6],
  [180, 108, W, 108, 6],
  [252, 80, 252, H, 6],
  [96, 80, 96, H, 6],
  [306, 80, W, 116, 6],
];

/** A small park between the streets: [x, y, width, height]. */
const PARK = [58, 46, 108, 22] as const;

/** Point at fraction `t` (0–1) along a polyline, plus the polyline travelled so far. */
function along(points: Point[], t: number): { at: Point; travelled: Point[] } {
  const segments = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  const total = segments.reduce((a, b) => a + b, 0);
  let left = Math.min(1, Math.max(0, t)) * total;
  const travelled: Point[] = [points[0]];
  for (let i = 0; i < segments.length; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    if (left <= segments[i]) {
      const f = segments[i] === 0 ? 0 : left / segments[i];
      const at: Point = [ax + (bx - ax) * f, ay + (by - ay) * f];
      travelled.push(at);
      return { at, travelled };
    }
    left -= segments[i];
    travelled.push(points[i + 1]);
  }
  return { at: points[points.length - 1], travelled };
}

const toPath = (points: readonly Point[]) => points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");

export interface LiveMapProps {
  request: OrderRequest;
  restaurant: Restaurant;
  pickup: PickupPoint;
}

/**
 * Simulated delivery map: a stylised street grid (no real tiles) with the restaurant and the
 * collection point, a dotted route, and the courier moving along it frame by frame, driven by
 * `deliveryProgress`.
 */
export function LiveMap({ request, restaurant, pickup }: LiveMapProps) {
  const now = useFrameNow(request.status === "out_for_delivery");
  const reduce = useReducedMotion();
  const progress = deliveryProgress(request, now);
  const { at, travelled } = along(ROUTE, progress);
  const start = ROUTE[0];
  const end = ROUTE[ROUTE.length - 1];
  const tenths = Math.round(progress * 10) * 10;

  return (
    <div
      role="img"
      aria-label={`Simulated delivery map. The courier is ${tenths}% of the way from ${restaurant.name} to ${pickup.name}.`}
      className="relative isolate overflow-hidden rounded-card border border-line bg-surface-2"
      style={{ aspectRatio: `${W} / ${H}` }}
    >
      <svg aria-hidden viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full">
        <rect x={PARK[0]} y={PARK[1]} width={PARK[2]} height={PARK[3]} rx={8} fill="var(--success-soft)" />
        <rect x={PARK[0]} y={PARK[1]} width={PARK[2]} height={PARK[3]} rx={8} fill="none" stroke="var(--success)" strokeOpacity={0.12} />
        <g stroke="var(--surface)" strokeLinecap="round">
          {STREETS.map(([x1, y1, x2, y2, w]) => (
            <line key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={w} />
          ))}
        </g>

        <path d={toPath(ROUTE)} fill="none" stroke="var(--ink-3)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0 7" />
        <path d={toPath(travelled)} fill="none" stroke="var(--accent-ink)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />

        <g transform={`translate(${at[0]} ${at[1]})`}>
          {!reduce && (
            <motion.circle
              r={8}
              fill="var(--accent)"
              initial={{ opacity: 0.55, scale: 1 }}
              animate={{ opacity: 0, scale: 2.4 }}
              transition={{ duration: 1.6, ease: EASE_OUT, repeat: Infinity }}
            />
          )}
          <circle r={9} fill="var(--surface)" />
          <circle r={6.5} fill="var(--accent)" stroke="var(--ink)" strokeWidth={2} />
        </g>
      </svg>

      <Marker point={start} label={restaurant.name} align="start" className="bg-ink text-bg">
        <UtensilsCrossed />
      </Marker>
      <Marker point={end} label={pickup.name} align="end" className="bg-accent text-on-accent">
        <MapPin />
      </Marker>

      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-surface/90 px-2 py-1 text-caption font-semibold text-ink-2 shadow-thumb">
        <Navigation aria-hidden className="size-3.5 text-accent-ink" />
        Simulated delivery
      </span>
    </div>
  );
}

/**
 * A map marker with its name above it. `align` anchors the label to the marker's left edge (`start`), centre
 * or right edge (`end`), so a marker near a side keeps its label inside the map.
 */
function Marker({
  point,
  label,
  align = "center",
  className,
  children,
}: {
  point: Point;
  label: string;
  align?: "start" | "center" | "end";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{ left: `${(point[0] / W) * 100}%`, top: `${(point[1] / H) * 100}%` }}
    >
      <span
        className={cn(
          "absolute top-0 left-0 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-float ring-2 ring-surface [&_svg]:size-4",
          className,
        )}
      >
        {children}
      </span>
      <span
        className={cn(
          "absolute bottom-5 rounded-full bg-surface/90 px-2 py-0.5 text-caption font-semibold whitespace-nowrap text-ink",
          align === "start" ? "left-0 -translate-x-4" : align === "center" ? "left-0 -translate-x-1/2" : "right-0 translate-x-4",
        )}
      >
        {label}
      </span>
    </div>
  );
}
