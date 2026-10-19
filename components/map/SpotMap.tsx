"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { setWorkerUrl, type MapLibreEvent } from "maplibre-gl";
import { useTranslations } from "next-intl";
import { Map, Marker } from "react-map-gl/maplibre";
import {
  BUILDINGS_LAYER,
  INITIAL_VIEW,
  mapStyleUrl,
} from "@/lib/map-config";

// Turbopack rewrites import.meta.url, so MapLibre cannot derive its worker URL
// itself; point it at the worker file emitted as a static asset.
setWorkerUrl(
  new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href,
);

export type SpotMarker = { id: string; coords: [number, number] };

// Adds extruded buildings below the first label layer, reading the building
// source-layer of whatever stock style is loaded.
function addBuildings({ target: map }: MapLibreEvent) {
  const layers = map.getStyle().layers;
  const building = layers.find(
    (l) => "source-layer" in l && l["source-layer"] === "building",
  );
  if (!building || !("source" in building) || map.getLayer(BUILDINGS_LAYER.id))
    return;
  const firstLabel = layers.find((l) => l.type === "symbol");
  map.addLayer({ ...BUILDINGS_LAYER, source: building.source }, firstLabel?.id);
}

export function SpotMap({ spots }: { spots: SpotMarker[] }) {
  const t = useTranslations("Home");
  const style = mapStyleUrl(process.env.NEXT_PUBLIC_MAPTILER_KEY);

  if (!style) {
    return (
      <div role="alert" className="flex h-dvh items-center justify-center p-6 text-center">
        {t("mapKeyMissing")}
      </div>
    );
  }

  return (
    <Map
      initialViewState={INITIAL_VIEW}
      mapStyle={style}
      onLoad={addBuildings}
      style={{ width: "100vw", height: "100dvh" }}
    >
      {spots.map((spot) => (
        <Marker key={spot.id} longitude={spot.coords[0]} latitude={spot.coords[1]}>
          <div className="size-4 rounded-full border-2 border-white bg-rose-600 shadow" />
        </Marker>
      ))}
    </Map>
  );
}
