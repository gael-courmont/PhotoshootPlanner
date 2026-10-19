"use client";

import {
  parseAsArrayOf,
  parseAsString,
  useQueryStates,
} from "nuqs";
import { createContext, useContext, useEffect, useState } from "react";
import { useStore } from "zustand";
import type { Selection } from "@/lib/schemas";
import {
  createSelectionStore,
  type KnownIds,
  type SelectionState,
} from "@/lib/selection-store";

type SelectionStore = ReturnType<typeof createSelectionStore>;

const SelectionContext = createContext<SelectionStore | null>(null);

// Key order is the URL param order: pkg, start, spots.
const urlParsers = {
  pkg: parseAsString,
  start: parseAsString,
  spots: parseAsArrayOf(parseAsString),
};

const toUrl = (s: Selection) => ({
  pkg: s.packageId,
  start: s.startSpotId,
  spots: s.spotIds.length ? s.spotIds : null,
});

export function SelectionProvider({
  known,
  children,
}: {
  known: KnownIds;
  children: React.ReactNode;
}) {
  const [query, setQuery] = useQueryStates(urlParsers, {
    shallow: true,
    history: "replace",
    scroll: false,
  });

  // The URL is read once, here; after that the sync is store -> URL only.
  const [store] = useState(() =>
    createSelectionStore(
      {
        packageId: query.pkg,
        startSpotId: query.start,
        spotIds: query.spots ?? [],
      },
      known,
    ),
  );

  useEffect(() => {
    // Normalise the URL to the sanitized seed, then mirror every change.
    void setQuery(toUrl(store.getState().selection));
    return store.subscribe((state, prev) => {
      if (state.selection !== prev.selection) void setQuery(toUrl(state.selection));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setQuery identity changes with the URL; we only want to subscribe once
  }, [store]);

  return (
    <SelectionContext.Provider value={store}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelectionStore<T>(selector: (state: SelectionState) => T): T {
  const store = useContext(SelectionContext);
  if (!store) throw new Error("useSelectionStore needs a SelectionProvider");
  return useStore(store, selector);
}

export const useSelection = () => useSelectionStore((s) => s.selection);
