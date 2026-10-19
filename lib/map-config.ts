import type {
  FillExtrusionLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from "maplibre-gl";

// Stock MapTiler style; the custom brand style replaces it in M4.
export const MAP_STYLE_ID = "streets-v2";

export const INITIAL_VIEW = {
  longitude: 2.2945,
  latitude: 48.8584,
  zoom: 15.5,
  pitch: 50,
  bearing: 0,
};

export function mapStyleUrl(key: string | undefined): string | null {
  if (!key) return null;
  return `https://api.maptiler.com/maps/${MAP_STYLE_ID}/style.json?key=${key}`;
}

// `source` is filled in at load time from the style, so any stock style works.
export const BUILDINGS_LAYER: Omit<FillExtrusionLayerSpecification, "source"> = {
  id: "buildings-3d",
  type: "fill-extrusion",
  "source-layer": "building",
  minzoom: 14,
  paint: {
    "fill-extrusion-color": "#d8d4cc",
    "fill-extrusion-height": ["get", "render_height"],
    "fill-extrusion-base": ["get", "render_min_height"],
    "fill-extrusion-opacity": 0.85,
  },
};

// The route source holds a line per Leg and a point at its middle vertex for the label.
export const ROUTE_LINE_LAYER: Omit<LineLayerSpecification, "source"> = {
  id: "route-line",
  type: "line",
  filter: ["==", ["geometry-type"], "LineString"],
  layout: { "line-cap": "round", "line-join": "round" },
  paint: { "line-color": "#e11d48", "line-width": 4 },
};

export const ROUTE_LABEL_LAYER: Omit<SymbolLayerSpecification, "source"> = {
  id: "route-labels",
  type: "symbol",
  filter: ["==", ["geometry-type"], "Point"],
  layout: {
    "text-field": ["concat", ["to-string", ["get", "walkMinutes"]], " min"],
    "text-font": ["Noto Sans Regular"],
    "text-size": 13,
    "text-allow-overlap": true,
  },
  paint: { "text-color": "#111827", "text-halo-color": "#ffffff", "text-halo-width": 2 },
};
