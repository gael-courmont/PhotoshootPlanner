import { describe, expect, it } from "vitest";
import { legs } from "@/lib/content";
import { routeGeoJson } from "@/lib/route-geojson";
import type { Leg } from "@/lib/schemas";

const leg = (from: string, to: string, walkMinutes: number, coordinates: [number, number][]): Leg => ({
  from,
  to,
  walkMinutes,
  meters: 0,
  geometry: { type: "LineString", coordinates },
});

describe("routeGeoJson", () => {
  const fixture = [
    leg("a", "b", 5, [[0, 0], [1, 1], [2, 2]]),
    leg("b", "c", 7, [[2, 2], [3, 3], [4, 4], [5, 5]]),
  ];

  it("is empty for a route with fewer than two spots", () => {
    expect(routeGeoJson([], fixture).features).toEqual([]);
    expect(routeGeoJson(["a"], fixture).features).toEqual([]);
  });

  it("has a line feature per leg in route order, carrying its walking minutes", () => {
    const lines = routeGeoJson(["a", "b", "c"], fixture).features.filter((f) => f.geometry.type === "LineString");
    expect(lines.map((f) => f.properties.walkMinutes)).toEqual([5, 7]);
    expect(lines[0].geometry).toEqual(fixture[0].geometry);
  });

  it("puts a label point at each leg's middle vertex", () => {
    const points = routeGeoJson(["a", "b", "c"], fixture).features.filter((f) => f.geometry.type === "Point");
    expect(points.map((f) => [f.geometry.type === "Point" && f.geometry.coordinates, f.properties.walkMinutes])).toEqual([
      [[1, 1], 5],
      [[4, 4], 7],
    ]);
  });

  it("uses the directed leg for the order given", () => {
    const real = routeGeoJson(["bir-hakeim", "trocadero"], legs).features[0];
    expect(real.properties.walkMinutes).toBe(13);
  });

  it("throws when a leg is missing", () => {
    expect(() => routeGeoJson(["a", "c"], fixture)).toThrow(/a.*c/);
  });
});
