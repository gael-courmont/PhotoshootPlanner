"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { setWorkerUrl, type MapLibreEvent } from "maplibre-gl";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Layer, Map, Marker, Source } from "react-map-gl/maplibre";
import { useSelectionStore } from "@/components/selection/SelectionProvider";
import { useCustomizer } from "@/components/selection/useCustomizer";
import {
  BUILDINGS_LAYER,
  INITIAL_VIEW,
  ROUTE_LABEL_LAYER,
  ROUTE_LINE_LAYER,
  mapStyleUrl,
} from "@/lib/map-config";
import { routeGeoJson } from "@/lib/route-geojson";
import { tapAction } from "@/lib/spot-tap";
import { legs } from "@/lib/content";

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

export function SpotMap({
  spots,
  changingStart,
  onStartChanged,
}: {
  spots: SpotMarker[];
  changingStart: boolean;
  onStartChanged: () => void;
}) {
  const t = useTranslations("Home");
  const { selection, route, nonFittingSpotIds } = useCustomizer();
  const setStart = useSelectionStore((s) => s.setStart);
  const addSpot = useSelectionStore((s) => s.addSpot);
  const removeSpot = useSelectionStore((s) => s.removeSpot);
  const routeData = useMemo(() => routeGeoJson(route, legs), [route]);

  const onTap = (spotId: string) => {
    switch (tapAction(selection, spotId, changingStart)) {
      case "setStart":
        setStart(spotId);
        onStartChanged();
        break;
      case "addSpot":
        addSpot(spotId);
        break;
      case "removeSpot":
        removeSpot(spotId);
        break;
    }
  };
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
      <Source id="route" type="geojson" data={routeData}>
        <Layer {...ROUTE_LINE_LAYER} />
        <Layer {...ROUTE_LABEL_LAYER} />
      </Source>
      {spots.map((spot) => (
        <Marker key={spot.id} longitude={spot.coords[0]} latitude={spot.coords[1]}>
          <button type="button" aria-label={spot.id} onClick={() => onTap(spot.id)} className="flex flex-col items-center">
            {spot.id === selection.startSpotId && <span aria-label="Start">🚩</span>}
            <span
              className={`size-4 rounded-full border-2 border-white shadow ${nonFittingSpotIds.includes(spot.id) ? "bg-gray-400" : "bg-rose-600"}`}
            />
          </button>
        </Marker>
      ))}
    </Map>
  );
}
