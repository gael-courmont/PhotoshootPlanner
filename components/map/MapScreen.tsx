"use client";

import { OpenSpotProvider } from "@/components/sheet/OpenSpot";
import { Sheet } from "@/components/sheet/Sheet";
import { SpotMapLoader } from "./SpotMapLoader";
import type { SpotMarker } from "./SpotMap";

export function MapScreen({ spots }: { spots: SpotMarker[] }) {
  return (
    <OpenSpotProvider>
      <SpotMapLoader spots={spots} />
      <Sheet />
    </OpenSpotProvider>
  );
}
