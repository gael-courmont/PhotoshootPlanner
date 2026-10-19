import { describe, expect, it } from "vitest";
import {
  BUILDINGS_LAYER,
  INITIAL_VIEW,
  mapStyleUrl,
} from "@/lib/map-config";

describe("mapStyleUrl", () => {
  it("builds the MapTiler style URL from the key", () => {
    expect(mapStyleUrl("abc")).toBe(
      "https://api.maptiler.com/maps/streets-v2/style.json?key=abc",
    );
  });

  it("returns null when the key is missing or blank", () => {
    expect(mapStyleUrl(undefined)).toBeNull();
    expect(mapStyleUrl("")).toBeNull();
  });
});

describe("INITIAL_VIEW", () => {
  it("is centred on the Eiffel Tower, pitched", () => {
    expect(INITIAL_VIEW).toEqual({
      longitude: 2.2945,
      latitude: 48.8584,
      zoom: 15.5,
      pitch: 50,
      bearing: 0,
    });
  });
});

describe("BUILDINGS_LAYER", () => {
  it("extrudes the style's building source-layer from zoom 14", () => {
    expect(BUILDINGS_LAYER.type).toBe("fill-extrusion");
    expect(BUILDINGS_LAYER["source-layer"]).toBe("building");
    expect(BUILDINGS_LAYER.minzoom).toBe(14);
  });
});
