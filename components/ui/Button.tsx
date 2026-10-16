"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import type { ComponentPropsWithRef, MouseEvent, ReactNode } from "react";
import { cn, positioned } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none " +
  "transition-[scale,background-color,color,box-shadow] duration-100 ease-out active:scale-[0.97] " +
  "disabled:cursor-not-allowed disabled:active:scale-100 aria-disabled:cursor-not-allowed aria-disabled:active:scale-100 " +
  "data-loading:pointer-events-none";

// Hover only on enabled controls; disabled and aria-disabled fall back to the quiet surface.
const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-accent active:bg-accent-strong hover:not-disabled:not-aria-disabled:bg-[#acc22b] " +
    "disabled:bg-surface-2 disabled:text-ink-3 aria-disabled:bg-surface-2 aria-disabled:text-ink-3",
  secondary:
    "bg-surface text-ink ring-1 ring-line ring-inset active:bg-surface-2 hover:not-disabled:not-aria-disabled:bg-[#fcfbf7] " +
    "disabled:text-ink-3 aria-disabled:text-ink-3",
  ghost:
    "bg-transparent text-ink active:bg-ink/[0.06] hover:not-disabled:not-aria-disabled:bg-ink/[0.04] " +
    "disabled:text-ink-3 aria-disabled:text-ink-3",
  danger:
    "bg-transparent text-offer active:bg-offer-soft hover:not-disabled:not-aria-disabled:bg-offer-soft/60 " +
    "disabled:text-ink-3 aria-disabled:text-ink-3",
};

const sizes: Record<ButtonSize, string> = {
  // 36px visual with the hit area extended to 44px.
  sm: "h-9 px-3.5 text-meta before:absolute before:-inset-y-1 before:inset-x-0 [&_svg]:size-4",
  md: "h-12 px-5 text-body [&_svg]:size-[18px]",
  lg: "h-14 px-6 text-emphasis",
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the container width. */
  block?: boolean;
}

function styleFor({ variant = "primary", size = "md", block = false }: ButtonStyleOptions): string {
  return cn(base, variants[variant], sizes[size], block && "w-full");
}

/** Class string for elements that should look like a Button without being one. */
export function buttonClasses(options: ButtonStyleOptions = {}): string {
  return cn(styleFor(options), "relative");
}

interface OwnProps extends ButtonStyleOptions {
  /** Shows a spinner in place of the label, keeps the width, and ignores presses. */
  loading?: boolean;
  /** Icon before the label. */
  icon?: ReactNode;
  /** Content pinned to the trailing edge, e.g. the price on a full-width CTA. */
  trailing?: ReactNode;
}

type AsButton = OwnProps & Omit<ComponentPropsWithRef<"button">, keyof OwnProps> & { href?: undefined };
type AsLink = OwnProps &
  Omit<ComponentPropsWithRef<typeof Link>, keyof OwnProps | "href"> & { href: string; disabled?: boolean };

export type ButtonProps = AsButton | AsLink;

function Content({ loading, icon, trailing, children }: Pick<OwnProps, "loading" | "icon" | "trailing"> & { children?: ReactNode }) {
  return (
    <>
      <span
        className={cn(
          "inline-flex min-w-0 flex-1 items-center gap-2 transition-[opacity,filter] duration-200 ease-out",
          trailing !== undefined ? "justify-between" : "justify-center",
          loading && "opacity-0 blur-[2px]",
        )}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          {icon}
          {children !== undefined && children !== null && <span className="truncate">{children}</span>}
        </span>
        {trailing !== undefined && <span className="tnum shrink-0">{trailing}</span>}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center" aria-hidden>
          <LoaderCircle className="size-5 animate-spin" />
        </span>
      )}
    </>
  );
}

/**
 * Pill button. Primary is the lime action, secondary a white pill with a hairline, ghost text-only,
 * danger a quiet tomato text button. Pass `href` to render a Next.js Link with the same styling.
 */
export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { variant, size, block, loading, icon, trailing, disabled, className, children, href, onClick, ...rest } = props;
    const inert = disabled || loading;
    return (
      <Link
        {...rest}
        href={href}
        aria-disabled={disabled || undefined}
        aria-busy={loading || undefined}
        data-loading={loading || undefined}
        tabIndex={inert ? -1 : rest.tabIndex}
        onClick={(e: MouseEvent<HTMLAnchorElement>) => {
          if (inert) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
        className={cn(styleFor({ variant, size, block }), positioned(className), className)}
      >
        <Content loading={loading} icon={icon} trailing={trailing}>
          {children}
        </Content>
      </Link>
    );
  }

  const { variant, size, block, loading, icon, trailing, className, children, onClick, type = "button", ...rest } = props;
  return (
    <button
      {...rest}
      type={type}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      onClick={(e) => {
        if (loading) return;
        onClick?.(e);
      }}
      className={cn(styleFor({ variant, size, block }), positioned(className), className)}
    >
      <Content loading={loading} icon={icon} trailing={trailing}>
        {children}
      </Content>
    </button>
  );
}
