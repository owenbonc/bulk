const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const gbpWhole = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

const MINUS = "−";

export interface FormatPriceOptions {
  /** Drop ".00" on whole pounds: 2400 → "£24", 729 → "£7.29". */
  trim?: boolean;
  /** Prefix a typographic minus, for discounts: "−£4.00". */
  negative?: boolean;
}

/** Formats integer pence as pounds: 729 → "£7.29". */
export function formatPrice(pence: number, { trim = false, negative = false }: FormatPriceOptions = {}): string {
  const abs = Math.abs(pence);
  const text = trim && abs % 100 === 0 ? gbpWhole.format(abs / 100) : gbp.format(abs / 100);
  return negative || pence < 0 ? `${MINUS}${text}` : text;
}

/** Formats a duration as a clock: 724000 → "12:04", 3_900_000 → "1:05:00". Rounds up so "0:00" only shows at zero. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** Spoken form of a duration for screen readers: "12 minutes 4 seconds". */
export function describeDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const parts: string[] = [];
  if (m > 0) parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  if (s > 0 || m === 0) parts.push(`${s} second${s === 1 ? "" : "s"}`);
  return parts.join(" ");
}
