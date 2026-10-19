"use client";

import { Sheet } from "@/components/sheet/Sheet";
import { SpotMapLoader } from "./SpotMapLoader";
import type { SpotMarker } from "./SpotMap";

export function MapScreen({ spots }: { spots: SpotMarker[] }) {
  return (
    <>
      <SpotMapLoader spots={spots} />
      <Sheet />
    </>
  );
}
