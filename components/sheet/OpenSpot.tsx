"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { takeOpenSpot } from "@/lib/open-spot-handoff";

type OpenSpot = { openSpotId: string | null; open: (id: string) => void; close: () => void };

const OpenSpotContext = createContext<OpenSpot | null>(null);

// Which spot's detail is open. UI state only: not in the Selection, not in the URL (ADR 0001).
export function OpenSpotProvider({ children }: { children: React.ReactNode }) {
  const [openSpotId, setOpenSpotId] = useState<string | null>(null);
  // A Locale switch hands the open spot over; unknown ids are ignored by SpotDetail.
  useEffect(() => {
    const handedOver = takeOpenSpot();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage is client-only, so reading it during render would mismatch hydration
    if (handedOver) setOpenSpotId(handedOver);
  }, []);
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
