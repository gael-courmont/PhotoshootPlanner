"use client";

import { useMemo } from "react";
import { legs, packages, spots } from "@/lib/content";
import { nonFittingSpotIds, timeBudget } from "@/lib/route";
import { useSelection } from "./SelectionProvider";

const content = { spots, packages, legs };

// The derived view of the Selection: Route, Time budget and spots that no longer fit.
export function useCustomizer() {
  const selection = useSelection();
  return useMemo(() => {
    const budget = timeBudget(selection, content);
    return {
      selection,
      budget,
      route: budget?.order ?? [],
      nonFittingSpotIds: nonFittingSpotIds(selection, content),
    };
  }, [selection]);
}
