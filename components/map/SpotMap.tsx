"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { setWorkerUrl, type MapLibreEvent } from "maplibre-gl";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import { Layer, Map, Marker, Source, type MapRef } from "react-map-gl/maplibre";
import { useOpenSpot } from "@/components/sheet/OpenSpot";
import { useMediaQuery } from "@/components/sheet/useMediaQuery";
import { useCustomizer } from "@/components/selection/useCustomizer";
import {
  BUILDINGS_LAYER,
  FLY_MS,
  INITIAL_VIEW,
  REDUCED_MOTION_QUERY,
  ROUTE_LABEL_LAYER,
  ROUTE_LINE_LAYER,
  mapStyleUrl,
} from "@/lib/map-config";
import { useRouteReveal } from "./useRouteReveal";
import { PhotoMarker } from "./PhotoMarker";
import { PEEK_PX, SIDEBAR_PX, SIDEBAR_QUERY } from "@/lib/sheet-layout";

// Turbopack rewrites import.meta.url, so MapLibre cannot derive its worker URL
// itself; point it at the worker file emitted as a static asset.
setWorkerUrl(
  new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href,
);

export type SpotMarker = { id: string; name: string; coords: [number, number]; thumbnail: string | null };

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
  const { selection, route, nonFittingSpotIds } = useCustomizer();
  const routeData = useRouteReveal(route);
  const { openSpotId, open } = useOpenSpot();
  const mapRef = useRef<MapRef>(null);
  const isSidebar = useMediaQuery(SIDEBAR_QUERY);
  // Keeps the camera centred on the part of the map the sheet or sidebar leaves visible.
  const padding = useMemo(
    () => (isSidebar ? { left: SIDEBAR_PX, top: 0, right: 0, bottom: 0 } : { left: 0, top: 0, right: 0, bottom: PEEK_PX }),
    [isSidebar],
  );

  useEffect(() => {
    mapRef.current?.setPadding(padding);
  }, [padding]);

  // Fly to a spot when it is opened, centred on the visible map area. The spot already open at
  // mount (handed over by a Locale switch) is not flown to.
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const lastOpened = useRef(openSpotId);
  useEffect(() => {
    if (openSpotId === lastOpened.current) return;
    lastOpened.current = openSpotId;
    const spot = spots.find((s) => s.id === openSpotId);
    if (!spot) return;
    mapRef.current?.flyTo({ center: spot.coords, padding, duration: reducedMotion ? 0 : FLY_MS });
  }, [openSpotId, spots, padding, reducedMotion]);

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
      ref={mapRef}
      initialViewState={{ ...INITIAL_VIEW, padding }}
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
          <PhotoMarker
            spot={spot}
            routeIndex={route.indexOf(spot.id)}
            isStart={spot.id === selection.startSpotId}
            fits={!nonFittingSpotIds.includes(spot.id)}
            onOpen={() => open(spot.id)}
          />
        </Marker>
      ))}
    </Map>
  );
}
