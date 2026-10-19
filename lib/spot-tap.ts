import type { Selection } from "./schemas";

export type TapAction = "none" | "setStart";

// What tapping a spot marker does. Spots can only be chosen once a Package is picked.
export function tapAction(selection: Selection, spotId: string, changingStart: boolean): TapAction {
  if (!selection.packageId) return "none";
  if (!selection.startSpotId) return "setStart";
  if (changingStart && spotId !== selection.startSpotId) return "setStart";
  return "none";
}
