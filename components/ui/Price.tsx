import { cn } from "./cn";
import { formatPrice } from "./format";

export interface PriceProps {
  /** Price in integer pence. */
  pence: number;
  /** Pre-sale price in pence. When higher than `pence`, the price shows in --offer with this struck through. */
  originalPence?: number;
  /** Drop ".00" on whole pounds. */
  trim?: boolean;
  /** Render as a discount: "−£4.00". */
  negative?: boolean;
  className?: string;
  /** Classes for the struck-through original price. */
  originalClassName?: string;
}

/** Formatted price with tabular digits. Handles sale prices: "£8.59 ~~£14.00~~". */
export function Price({ pence, originalPence, trim, negative, className, originalClassName }: PriceProps) {
  const onSale = originalPence !== undefined && originalPence > pence;
  const now = formatPrice(pence, { trim, negative });

  if (!onSale) return <span className={cn("tnum", className)}>{now}</span>;

  const was = formatPrice(originalPence, { trim });
  return (
    <span className={cn("tnum inline-flex items-baseline gap-1.5", className)}>
      <span className="text-offer">
        <span className="sr-only">Now </span>
        {now}
      </span>
      <s className={cn("text-[0.87em] font-normal text-ink-3 decoration-1", originalClassName)}>
        <span className="sr-only">, was </span>
        {was}
      </s>
    </span>
  );
}
