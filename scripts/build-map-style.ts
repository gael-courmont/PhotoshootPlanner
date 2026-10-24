// Recolours the stock MapTiler streets-v2 style with the "Paris dusk" palette and writes public/map-style.json.
// The MapTiler key is replaced by the __KEY__ placeholder so the file can be committed.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const STOCK_URL = "https://api.maptiler.com/maps/streets-v2/style.json";
const KEY_PLACEHOLDER = "__KEY__";
const outFile = path.join(__dirname, "..", "public", "map-style.json");

// Mirrors the tokens in app/[locale]/globals.css.
const C = {
  cream: "#f4ede0",
  paper: "#fbf8f2",
  stone: "#e6dcc8",
  sage: "#cbd3b6",
  seine: "#6f8fa3",
  ink: "#1e2a33",
  inkSoft: "#5a6670",
  gold: "#c19a3e",
  muted: "#a39d90",
};

// Map-only shades, more saturated than the site tokens so features stand out from the cream ground.
const M = {
  water: "#5f95b8",
  park: "#b2cb94",
  wood: "#9dbb80",
  building: "#dccbaa",
  buildingEdge: "#c4b087",
  casing: "#d6c8aa",
  highway: "#f2d484",
  highwayEdge: "#b98a2c",
  path: "#bfae8f",
};

type Paint = Record<string, unknown>;
type Layer = { id: string; type: string; paint?: Paint; layout?: Record<string, unknown>; [k: string]: unknown };
type Style = { layers: Layer[]; sources: Record<string, { url?: string }>; glyphs?: string; [k: string]: unknown };

// Layer id -> paint overrides. Whole values are replaced, which also drops the
// zoom stops and expressions the stock style uses on some of these colours.
const LAYER_PAINT: Record<string, Paint> = {
  Background: { "background-color": C.cream },

  // Land use and land cover
  Meadow: { "fill-color": M.park },
  Scrub: { "fill-color": M.park },
  Crop: { "fill-color": C.cream },
  Forest: { "fill-color": M.wood },
  Wood: { "fill-color": M.wood },
  Grass: { "fill-color": M.park },
  Stadium: { "fill-color": M.park },
  Cemetery: { "fill-color": M.park },
  Residential: { "fill-color": C.cream },
  Industrial: { "fill-color": M.casing },
  Glacier: { "fill-color": C.paper },
  Sand: { "fill-color": C.stone },
  "Airport zone": { "fill-color": C.stone },
  Hospital: { "fill-color": C.stone },
  School: { "fill-color": C.stone },
  Pedestrian: { "fill-color": C.paper },

  // Water
  "River tunnel": { "line-color": M.water },
  River: { "line-color": M.water },
  "Water intermittent": { "fill-color": M.water, "fill-opacity": 0.6 },
  Water: { "fill-color": M.water },
  Aqueduct: { "line-color": M.water },
  "Aqueduct outline": { "line-color": C.muted },

  // Roads: paper fills on stone casings, gold for the big ones
  "Minor road outline": { "line-color": M.casing },
  "Major road outline": { "line-color": M.highwayEdge },
  "Highway outline": { "line-color": M.highwayEdge },
  "Minor road": { "line-color": C.paper },
  "Major road": { "line-color": C.gold },
  Highway: { "line-color": M.highway },
  "Road under construction": { "line-color": C.muted },
  "Path outline": { "line-color": C.cream },
  "Path minor": { "line-color": M.path },
  Path: { "line-color": M.path },
  "Bridge outline": { "line-color": M.casing },
  Bridge: { "fill-color": C.paper },
  Pier: { "fill-color": C.paper },
  "Pier road": { "line-color": C.paper },
  "Tunnel outline": { "line-color": C.cream },
  Tunnel: { "line-color": C.stone },
  "Footway tunnel outline": { "line-color": C.cream },
  "Footway tunnel": { "line-color": C.muted },
  "Ferry line": { "line-color": C.seine },
  Aeroway: { "line-color": C.paper },
  Heliport: { "fill-color": C.paper },
  Cablecar: { "line-color": C.paper },
  "Cablecar dash": { "line-color": C.muted },

  // Rail
  "Railway tunnel": { "line-color": C.muted },
  "Railway tunnel hatching": { "line-color": C.muted },
  "Major rail": { "line-color": C.muted },
  "Major rail hatching": { "line-color": C.muted },
  "Minor rail": { "line-color": C.muted },
  "Minor rail hatching": { "line-color": C.muted },

  // Buildings
  Building: { "fill-color": M.building, "fill-outline-color": M.buildingEdge },
  "Building 3D": { "fill-extrusion-color": M.building },

  // Borders
  "Other border": { "line-color": C.muted },
  "Disputed border": { "line-color": C.muted },
  "Country border": { "line-color": C.muted },

  // Label exceptions: seine blue is too light for text on cream, so water labels use ink-soft.
  "River labels": { "text-color": C.inkSoft },
  "Ocean labels": { "text-color": C.inkSoft },
  "Lake labels": { "text-color": C.inkSoft },
  Ferry: { "text-color": C.inkSoft },
  "Highway shield": { "icon-color": C.paper, "icon-halo-color": C.inkSoft },
  "Highway shield (US)": { "icon-color": C.paper, "icon-halo-color": C.inkSoft },
  "Highway shield interstate top (US)": { "icon-color": C.paper, "icon-halo-color": C.inkSoft },
  "Highway shield interstate (US)": { "icon-color": C.paper, "icon-halo-color": C.inkSoft },
  "Town labels": { "icon-color": C.paper, "icon-halo-color": C.inkSoft },
  "City labels": { "icon-color": C.paper, "icon-halo-color": C.inkSoft },
  "Capital city labels": { "icon-color": C.paper, "icon-halo-color": C.inkSoft },
};

// Every other symbol layer (road names, places, POIs, ...) gets these.
const SYMBOL_DEFAULTS: Paint = {
  "text-color": C.ink,
  "text-halo-color": C.cream,
  "icon-color": C.inkSoft,
  "icon-halo-color": C.cream,
};
// Secondary labels read softer than place and road names.
const SOFT_TEXT_LAYERS = new Set(["Housenumber", "Gondola", "State labels", "Airport gate", "Oneway"]);

function recolour(layer: Layer): Layer {
  const paint = { ...layer.paint };
  const override = LAYER_PAINT[layer.id] ?? {};

  if (layer.type === "symbol") {
    for (const [prop, value] of Object.entries(SYMBOL_DEFAULTS)) {
      if (prop in paint) paint[prop] = value;
    }
    if (SOFT_TEXT_LAYERS.has(layer.id) && "text-color" in paint) paint["text-color"] = C.inkSoft;
  }
  Object.assign(paint, override);
  return { ...layer, paint };
}

function loadEnvKey(): string | undefined {
  if (process.env.NEXT_PUBLIC_MAPTILER_KEY) return process.env.NEXT_PUBLIC_MAPTILER_KEY;
  const envPath = path.join(__dirname, "..", ".env");
  if (!existsSync(envPath)) return undefined;
  const line = readFileSync(envPath, "utf8")
    .split("\n")
    .find((l) => l.startsWith("NEXT_PUBLIC_MAPTILER_KEY="));
  return line?.slice("NEXT_PUBLIC_MAPTILER_KEY=".length).trim() || undefined;
}

async function main() {
  const key = loadEnvKey();
  if (!key) {
    console.error("NEXT_PUBLIC_MAPTILER_KEY is not set (env or .env).");
    process.exit(1);
  }

  const res = await fetch(`${STOCK_URL}?key=${key}`);
  if (!res.ok) {
    console.error(`Could not fetch the stock style: HTTP ${res.status}`);
    process.exit(1);
  }
  const stock = (await res.json()) as Style;

  const known = new Set(stock.layers.map((l) => l.id));
  const unknown = Object.keys(LAYER_PAINT).filter((id) => !known.has(id));
  if (unknown.length) console.warn(`Overrides for layers not in the stock style: ${unknown.join(", ")}`);

  const style: Style = { ...stock, name: "Paris dusk", id: "paris-dusk", layers: stock.layers.map(recolour) };
  writeFileSync(outFile, JSON.stringify(style, null, 2).replaceAll(key, KEY_PLACEHOLDER) + "\n");
  console.log(`Wrote ${path.relative(process.cwd(), outFile)} (${style.layers.length} layers)`);
}

main();
