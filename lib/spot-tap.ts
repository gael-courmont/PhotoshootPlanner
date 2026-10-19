import type { Selection } from "./schemas";

export type TapAction = "none" | "setStart" | "addSpot" | "removeSpot";

// What tapping a spot marker does. Spots can only be chosen once a Package is picked, and
// other spots only once the Start spot is set.
export function tapAction(selection: Selection, spotId: string, changingStart: boolean): TapAction {
  if (!selection.packageId) return "none";
  if (!selection.startSpotId) return "setStart";
  if (spotId === selection.startSpotId) return "none";
  if (changingStart) return "setStart";
  return selection.spotIds.includes(spotId) ? "removeSpot" : "addSpot";
}
