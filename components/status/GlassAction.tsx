import { CircleCheck } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/components/ui";

/** Clear glass for the big action buttons (brief §3), with a solid fallback under reduced transparency. */
const GLASS =
  "border border-surface/75 bg-surface/50 backdrop-blur-[20px] backdrop-saturate-[1.8] " +
  "shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_8px_24px_-8px_rgb(27_29_20/0.18),0_2px_6px_-2px_rgb(27_29_20/0.08)] " +
  "[@media(prefers-reduced-transparency:reduce)]:bg-surface [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none";

export interface GlassActionProps extends Omit<ComponentPropsWithRef<"button">, "children"> {
  label: string;
  /** Lime price chip on the trailing edge, e.g. "£7.29". */
  price: string;
}

/** 56px glass action button with a bold label and a lime price chip: "Accept and pay · £7.29". */
export function GlassAction({ label, price, className, type = "button", ...rest }: GlassActionProps) {
  return (
    <button
      {...rest}
      type={type}
      className={cn(
        GLASS,
        "relative flex h-14 w-full items-center gap-3 rounded-full pr-2 pl-6 text-left",
        "transition-[scale] duration-100 ease-out active:scale-[0.97]",
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate text-emphasis font-bold text-ink">{label}</span>
      <span className="tnum grid h-10 shrink-0 place-items-center rounded-full bg-accent px-4 text-emphasis font-bold text-on-accent">
        <span className="sr-only">, </span>
        {price}
      </span>
    </button>
  );
}

/** The same glass slab as a non-interactive status, e.g. "Paid, waiting for 2 others". */
export function GlassStatus({ children, icon = <CircleCheck className="text-success" /> }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div role="status" className={cn(GLASS, "flex h-14 w-full items-center justify-center gap-2 rounded-full px-6")}>
      <span className="shrink-0">{icon}</span>
      <span className="tnum truncate text-emphasis font-semibold text-ink">{children}</span>
    </div>
  );
}
