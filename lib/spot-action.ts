import { nonFittingSpotIds, type RouteContent } from "./route";
import type { Selection } from "./schemas";

export type SpotActionKind = "start" | "makeStart" | "add" | "remove";

export type SpotActionButton = {
  kind: SpotActionKind;
  disabled?: { reason: "pickPackage" } | { reason: "doesntFit"; packageMinutes: number };
};

export type SpotAction = {
  // The spot detail's main button; null on the Start spot itself.
  primary: SpotActionButton | null;
  // Make this the start, offered next to Add or Remove once a Start spot exists.
  secondary?: SpotActionButton;
};

// What the spot detail offers for a spot. Spots can always be opened; choosing them needs a
// Package, and adding one needs it to fit the Time budget. Remove is never disabled.
export function spotAction(selection: Selection, spotId: string, content: RouteContent): SpotAction {
  const { packageId, startSpotId, spotIds } = selection;
  if (spotId === startSpotId) return { primary: null };

  const packageMinutes = content.packages.find((p) => p.id === packageId)?.minutes;
  const selected = spotIds.includes(spotId);
  const disabled: SpotActionButton["disabled"] =
    packageMinutes === undefined
      ? { reason: "pickPackage" }
      : !selected && nonFittingSpotIds(selection, content).includes(spotId)
        ? { reason: "doesntFit", packageMinutes }
        : undefined;
  const button = (kind: SpotActionKind): SpotActionButton => (disabled ? { kind, disabled } : { kind });

  if (!startSpotId) return { primary: button("start") };
  if (selected) {
    return {
      primary: { kind: "remove" },
      secondary: packageMinutes === undefined ? button("makeStart") : { kind: "makeStart" },
    };
  }
  return { primary: button("add"), secondary: button("makeStart") };
}
