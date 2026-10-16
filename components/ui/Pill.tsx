import { BadgePercent } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn, positioned } from "./cn";

export type PillTone = "neutral" | "outline" | "accent" | "soft" | "offer" | "success" | "ink";
export type PillSize = "sm" | "md";

const tones: Record<PillTone, string> = {
  neutral: "bg-surface-2 text-ink-2",
  outline: "bg-transparent text-ink-2 ring-1 ring-line-strong ring-inset",
  accent: "bg-accent text-on-accent",
  soft: "bg-accent-soft text-accent-ink",
  offer: "bg-offer-soft text-offer-ink",
  success: "bg-success-soft text-success",
  ink: "bg-ink text-bg",
};

const pillSizes: Record<PillSize, string> = {
  sm: "h-6 gap-1 px-2 text-caption [&_svg]:size-3.5",
  md: "h-7 gap-1.5 px-2.5 text-meta [&_svg]:size-4",
};

export interface PillProps extends Omit<ComponentPropsWithRef<"span">, "children"> {
  tone?: PillTone;
  size?: PillSize;
  /** Leading icon, sized to the pill. */
  icon?: ReactNode;
  children: ReactNode;
}

/** Small status label: "Host", "You're in", "Paid", "Pending", "Offer". Not interactive. */
export function Pill({ tone = "neutral", size = "sm", icon, className, children, ...rest }: PillProps) {
  return (
    <span
      {...rest}
      className={cn(
        "tnum inline-flex shrink-0 items-center rounded-full font-semibold whitespace-nowrap",
        tones[tone],
        pillSizes[size],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export type DealPillSize = "sm" | "md" | "lg";

const dealSizes: Record<DealPillSize, string> = {
  sm: "h-6 gap-1 px-2.5 text-caption [&_svg]:size-3.5",
  md: "h-8 gap-1.5 px-3 text-meta [&_svg]:size-4",
  lg: "h-11 gap-1.5 px-4 text-body [&_svg]:size-[18px]",
};

interface DealPillOwnProps {
  /** The deal's short label, e.g. "25% off". */
  label: string;
  size?: DealPillSize;
  /** Leading percent-badge icon. */
  withIcon?: boolean;
}

export type DealPillProps = DealPillOwnProps &
  (
    | (Omit<ComponentPropsWithRef<"button">, keyof DealPillOwnProps | "children"> & { onClick: NonNullable<ComponentPropsWithRef<"button">["onClick"]> })
    | (Omit<ComponentPropsWithRef<"span">, keyof DealPillOwnProps | "children"> & { onClick?: undefined })
  );

/**
 * The lime deal badge ("25% off"). Renders a button when given `onClick` (e.g. to open the deal sheet),
 * otherwise a static label. Add `ring-3 ring-bg` when it overlaps an image edge.
 */
export function DealPill({ label, size = "md", withIcon = false, className, ...rest }: DealPillProps) {
  const classes = cn(
    "tnum inline-flex shrink-0 items-center rounded-full bg-accent font-semibold whitespace-nowrap text-on-accent",
    dealSizes[size],
    className,
  );
  const content = (
    <>
      {withIcon && <BadgePercent aria-hidden />}
      {label}
    </>
  );

  if (rest.onClick) {
    const { type = "button", ...buttonRest } = rest as ComponentPropsWithRef<"button">;
    return (
      <button
        {...buttonRest}
        type={type}
        className={cn(
          classes,
          positioned(className),
          "transition-[scale,background-color] duration-100 ease-out select-none active:scale-[0.96] active:bg-accent-strong",
          "hover:bg-[#acc22b]",
          size === "sm" && "before:absolute before:-inset-2.5",
          size === "md" && "before:absolute before:-inset-y-1.5 before:inset-x-0",
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <span {...(rest as ComponentPropsWithRef<"span">)} className={classes}>
      {content}
    </span>
  );
}
