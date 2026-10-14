import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const buttonBase =
  "inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";
const variants = {
  primary: "bg-emerald-600 text-white hover:bg-emerald-700",
  secondary: "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50",
};

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: keyof typeof variants }) {
  return <button className={`${buttonBase} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: keyof typeof variants }) {
  return <Link className={`${buttonBase} ${variants[variant]} ${className}`} {...props} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-stone-200 bg-white p-4 ${className}`}>{children}</div>;
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function Countdown({ until, now, label = "left" }: { until: number; now: number; label?: string }) {
  return (
    <span className="font-mono tabular-nums">
      {formatDuration(until - now)} {label}
    </span>
  );
}

export function Row({ left, right, strong }: { left: ReactNode; right: ReactNode; strong?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${strong ? "font-semibold" : "text-stone-600"}`}>
      <span>{left}</span>
      <span className="tabular-nums">{right}</span>
    </div>
  );
}
