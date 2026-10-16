import { cn } from "./cn";

// Warm tints from the --tint-n tokens in globals.css; text colours clear 4.5:1 on their tint.
const TINT_COUNT = 6;

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
export function Avatar({ name, size = 36, you = false, className }: AvatarProps) {
  const [bg, fg] = you ? ["var(--accent)", "var(--on-accent)"] : tintFor(name);
  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? "?";
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-display font-semibold select-none", className)}
      style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.round(size * 0.42) }}
    >
      {initial}
    </span>
  );
}
