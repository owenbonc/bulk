/** Joins class names, skipping falsy values. Later classes do not override earlier ones by order; avoid passing conflicting utilities. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * "relative" unless the caller already positions the element (absolute, fixed, sticky), so components that
 * need a positioning context for hit areas or badges can still be placed absolutely.
 */
export function positioned(className?: string): string {
  return className && /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(className) ? "" : "relative";
}
