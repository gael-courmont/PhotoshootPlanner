"use client";

import { useState } from "react";
import { BudgetPanel } from "@/components/budget/BudgetPanel";
import { SpotMapLoader } from "./SpotMapLoader";
import type { SpotMarker } from "./SpotMap";

// Owns the change-start mode shared by the map taps and the panel button.
export function MapScreen({ spots }: { spots: SpotMarker[] }) {
  const [changingStart, setChangingStart] = useState(false);

  return (
    <>
      <SpotMapLoader spots={spots} changingStart={changingStart} onStartChanged={() => setChangingStart(false)} />
      <BudgetPanel
        changingStart={changingStart}
        onToggleChangeStart={() => setChangingStart((v) => !v)}
        onReset={() => setChangingStart(false)}
      />
    </>
  );
}
