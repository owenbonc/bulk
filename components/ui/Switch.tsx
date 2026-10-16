"use client";

import { useId, type ReactNode } from "react";
import { cn } from "./cn";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Visible label to the left of the switch. When omitted, pass `aria-label`. */
  label?: ReactNode;
  /** Secondary line under the label. */
  description?: ReactNode;
  "aria-label"?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * iOS-style toggle (role="switch"). With `label`, the whole row is the tap target.
 * The thumb stretches slightly while pressed.
 */
export function Switch({ checked, onCheckedChange, label, description, disabled = false, className, ...aria }: SwitchProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const descId = `${id}-desc`;

  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ? undefined : aria["aria-label"]}
      aria-labelledby={label ? labelId : undefined}
      aria-describedby={description ? descId : undefined}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "group/switch relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full p-[2px]",
        "transition-colors duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-40",
        "before:absolute before:-inset-y-1.5 before:-inset-x-0",
        checked ? "bg-accent" : "bg-[#dedac9]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "block h-[27px] w-[27px] rounded-full bg-white shadow-thumb",
          "transition-[translate,scale] duration-200 ease-out group-active/switch:scale-x-[1.15]",
          checked ? "translate-x-5 origin-right" : "translate-x-0 origin-left",
        )}
      />
    </button>
  );

  if (!label) return <span className={cn("inline-flex", className)}>{control}</span>;

  // The label forwards clicks on its text to the switch natively.
  return (
    <label className={cn("flex min-h-11 items-center gap-4", disabled ? "cursor-not-allowed" : "cursor-pointer", className)}>
      <span className="min-w-0 flex-1 select-none">
        <span id={labelId} className="block text-body font-medium text-ink">
          {label}
        </span>
        {description && (
          <span id={descId} className="mt-0.5 block text-meta text-ink-2">
            {description}
          </span>
        )}
      </span>
      {control}
    </label>
  );
}
