"use client";

import {
  parseAsArrayOf,
  parseAsString,
  useQueryStates,
} from "nuqs";
import {
  createContext,
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
  const [store] = useState(() => createSelectionStore({}, known));

  return (
    <SelectionContext.Provider value={store}>
      {/* useQueryStates opts into client rendering, so it lives in its own Suspense boundary to keep pages statically rendered. */}
      <Suspense fallback={null}>
        <UrlSync store={store} />
      </Suspense>
      {children}
    </SelectionContext.Provider>
  );
}

function UrlSync({ store }: { store: SelectionStore }) {
  const [query, setQuery] = useQueryStates(urlParsers, {
    shallow: true,
    history: "replace",
    scroll: false,
  });
  // Always call the latest setQuery from the long-lived subscription.
  const setQueryRef = useRef(setQuery);
  useEffect(() => {
    setQueryRef.current = setQuery;
  });

  useEffect(() => {
    // The URL is read once, here; after that the sync is store -> URL only.
    store.getState().seed({
      packageId: query.pkg,
      startSpotId: query.start,
      spotIds: query.spots ?? [],
    });
    void setQueryRef.current(toUrl(store.getState().selection));
    return store.subscribe((state, prev) => {
      if (state.selection !== prev.selection)
        void setQueryRef.current(toUrl(state.selection));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed from the URL only on mount
  }, [store]);

  return null;
}

export function useSelectionStore<T>(selector: (state: SelectionState) => T): T {
  const store = useContext(SelectionContext);
  if (!store) throw new Error("useSelectionStore needs a SelectionProvider");
  return useStore(store, selector);
}

export const useSelection = () => useSelectionStore((s) => s.selection);
