/**
 * Marks a floating tool (the demo controls panel) that stays usable over open sheets and popups: pressing
 * inside an element with this attribute never dismisses a Sheet or Popup.
 */
export const PASS_THROUGH_ATTR = "data-pass-through-layer";

/** True when the event target sits inside a pass-through layer. */
export function isPassThrough(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(`[${PASS_THROUGH_ATTR}]`) !== null;
}
