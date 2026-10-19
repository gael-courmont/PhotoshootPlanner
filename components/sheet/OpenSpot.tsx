"use client";

import { createContext, useContext, useMemo, useState } from "react";

type OpenSpot = { openSpotId: string | null; open: (id: string) => void; close: () => void };

const OpenSpotContext = createContext<OpenSpot | null>(null);

// Which spot's detail is open. UI state only: not in the Selection, not in the URL (ADR 0001).
export function OpenSpotProvider({ children }: { children: React.ReactNode }) {
  const [openSpotId, setOpenSpotId] = useState<string | null>(null);
  const value = useMemo(
    () => ({ openSpotId, open: setOpenSpotId, close: () => setOpenSpotId(null) }),
    [openSpotId],
  );
  return <OpenSpotContext.Provider value={value}>{children}</OpenSpotContext.Provider>;
}

export function useOpenSpot(): OpenSpot {
  const ctx = useContext(OpenSpotContext);
  if (!ctx) throw new Error("useOpenSpot needs an OpenSpotProvider");
  return ctx;
}
