import { createStore } from "zustand/vanilla";
import type { Selection } from "@/lib/schemas";

// URL-shaped input: anything may be missing or unknown.
export type RawSelection = {
  packageId?: string | null;
  startSpotId?: string | null;
  spotIds?: string[];
};

export type KnownIds = { packageIds: string[]; spotIds: string[] };

export type SelectionState = {
  selection: Selection;
  setPackage: (packageId: string) => void;
  setStart: (spotId: string) => void;
  addSpot: (spotId: string) => void;
  removeSpot: (spotId: string) => void;
  reset: () => void;
};

function sanitize(raw: RawSelection, known: KnownIds): Selection {
  const packageId =
    raw.packageId && known.packageIds.includes(raw.packageId)
      ? raw.packageId
      : null;
  const startSpotId =
    raw.startSpotId && known.spotIds.includes(raw.startSpotId)
      ? raw.startSpotId
      : null;
  const spotIds = startSpotId
    ? [...new Set(raw.spotIds ?? [])].filter(
        (id) => id !== startSpotId && known.spotIds.includes(id),
      )
    : [];
  return { packageId, startSpotId, spotIds };
}

const EMPTY: Selection = { packageId: null, startSpotId: null, spotIds: [] };

export function createSelectionStore(raw: RawSelection, known: KnownIds) {
  return createStore<SelectionState>()((set) => ({
    selection: sanitize(raw, known),
    setPackage: (packageId) => {
      if (!known.packageIds.includes(packageId)) return;
      set(({ selection }) => ({ selection: { ...selection, packageId } }));
    },
    setStart: (spotId) => {
      if (!known.spotIds.includes(spotId)) return;
      set(({ selection }) => {
        const { startSpotId } = selection;
        if (startSpotId === spotId) return {};
        const spotIds = selection.spotIds.filter((id) => id !== spotId);
        if (startSpotId) spotIds.push(startSpotId);
        return { selection: { ...selection, startSpotId: spotId, spotIds } };
      });
    },
    addSpot: (spotId) => {
      if (!known.spotIds.includes(spotId)) return;
      set(({ selection }) => {
        if (
          !selection.startSpotId ||
          selection.startSpotId === spotId ||
          selection.spotIds.includes(spotId)
        )
          return {};
        return {
          selection: { ...selection, spotIds: [...selection.spotIds, spotId] },
        };
      });
    },
    removeSpot: (spotId) =>
      set(({ selection }) => ({
        selection: {
          ...selection,
          spotIds: selection.spotIds.filter((id) => id !== spotId),
        },
      })),
    reset: () => set({ selection: EMPTY }),
  }));
}
