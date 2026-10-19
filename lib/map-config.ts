import type { FillExtrusionLayerSpecification } from "maplibre-gl";

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
