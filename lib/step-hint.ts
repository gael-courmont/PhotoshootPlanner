import type { Selection } from "./schemas";

export type StepHint = "pickPackage" | "tapToStart" | "addSpots";

// The one-line nudge for the next step of the flow.
export function stepHint(selection: Selection): StepHint {
  if (!selection.packageId) return "pickPackage";
  if (!selection.startSpotId) return "tapToStart";
  return "addSpots";
}
