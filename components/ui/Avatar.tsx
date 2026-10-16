import { cn } from "./cn";

// Warm tints from the --tint-n tokens in globals.css; text colours clear 4.5:1 on their tint.
const TINT_COUNT = 6;

// Initials snap to the nearest step of the type scale.
const TYPE_SCALE = [11, 12, 14, 15, 18, 24, 28];

function tintFor(name: string): [string, string] {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const n = (h % TINT_COUNT) + 1;
  return [`var(--tint-${n}-bg)`, `var(--tint-${n}-fg)`];
}

export interface AvatarProps {
  name: string;
  /** Diameter in px. */
  size?: number;
  /** Highlight as the current user (lime). */
  you?: boolean;
  className?: string;
}

/** First initial in a tinted circle. The tint is stable per name. */
export function Avatar({ name, size = 32, you = false, className }: AvatarProps) {
  const [bg, fg] = you ? ["var(--accent)", "var(--on-accent)"] : tintFor(name);
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? "?";
  const target = size * 0.42;
  const fontSize = TYPE_SCALE.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-display font-semibold select-none", className)}
      style={{ width: size, height: size, background: bg, color: fg, fontSize }}
    >
      {initial}
    </span>
  );
}
