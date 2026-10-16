import { cn } from "@/components/ui/cn";

/** The "big mouth" mark: a lime chomp with one tooth, opening right towards the wordmark. */
const MOUTH =
  "M39 21.5C42.5 21.5 43.5 17 41.5 14.5C38 9 31.5 5 24 5C13 5 5 13.5 5 24.5C5 35 11 43.5 20 43.5H40.5C44.5 43.5 45 38 41.5 37C40.5 36.7 39.5 36.5 38 36.5H24C17.5 36.5 14.5 31 16.5 26.5C18.5 22.5 23 21.5 27 21.5Z";

export interface LogoMarkProps {
  /** Height in px. */
  size?: number;
  className?: string;
}

export function LogoMark({ size = 28, className }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className={cn("shrink-0", className)}>
      <rect x="31.5" y="19.5" width="6.5" height="8.5" rx="2" fill="#fff" stroke="var(--ink)" strokeWidth="2.6" />
      <path d={MOUTH} fill="var(--accent)" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

export interface LogoProps {
  /** Height of the mark in px; the wordmark scales with it. */
  size?: number;
  /** full: mark + BULK wordmark. mark: the mouth alone. */
  variant?: "full" | "mark";
  className?: string;
}

/** Bulk logo. Announced as "Bulk". */
export function Logo({ size = 28, variant = "full", className }: LogoProps) {
  if (variant === "mark") {
    return (
      <span role="img" aria-label="Bulk" className={cn("inline-flex", className)}>
        <LogoMark size={size} />
      </span>
    );
  }

  return (
    <span role="img" aria-label="Bulk" className={cn("inline-flex items-center", className)} style={{ gap: size * 0.18 }}>
      <LogoMark size={size} />
      <span
        aria-hidden
        className="font-display leading-none font-extrabold tracking-[-0.035em] text-ink select-none"
        style={{ fontSize: size * 0.9, fontVariationSettings: '"opsz" 96' }}
      >
        BULK
      </span>
    </span>
  );
}
