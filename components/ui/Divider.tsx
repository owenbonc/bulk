import { cn } from "./cn";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  /** Indent a horizontal divider from the leading edge, e.g. to line up with row text. */
  inset?: boolean;
  className?: string;
}

/** 1px --line hairline. Use between rows instead of boxing each row. */
export function Divider({ orientation = "horizontal", inset = false, className }: DividerProps) {
  if (orientation === "vertical") {
    return <span role="separator" aria-orientation="vertical" className={cn("w-px shrink-0 self-stretch bg-line", className)} />;
  }
  return <hr className={cn("h-px shrink-0 border-0 bg-line", inset && "ml-4", className)} />;
}
