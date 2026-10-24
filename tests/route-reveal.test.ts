import { describe, expect, it } from "vitest";
import { legsToReveal, partialLine, revealRoute } from "@/lib/route-reveal";
import type { Leg } from "@/lib/schemas";

const leg = (from: string, to: string, coordinates: [number, number][]): Leg => ({
  from,
  to,
  walkMinutes: 5,
  meters: 0,
  geometry: { type: "LineString", coordinates },
});

describe("legsToReveal", () => {
  it("is the legs of the new route that the old one lacked", () => {
    expect([...legsToReveal(["a", "b"], ["a", "b", "c"])]).toEqual(["b>c"]);
  });

  it("is empty when the old route was empty, so a restored link just appears", () => {
    expect(legsToReveal([], ["a", "b", "c"]).size).toBe(0);
  });

  it("is empty when nothing was added", () => {
    expect(legsToReveal(["a", "b", "c"], ["a", "b"]).size).toBe(0);
    expect(legsToReveal(["a", "b", "c"], ["a", "b", "c"]).size).toBe(0);
  });

  it("reveals the first leg once a second spot joins the start", () => {
    expect([...legsToReveal(["a"], ["a", "b"])]).toEqual(["a>b"]);
  });

  it("reveals every leg that changed when the order changes", () => {
    expect([...legsToReveal(["a", "b", "c"], ["a", "c", "b"])].sort()).toEqual(["a>c", "c>b"]);
  });
});

describe("partialLine", () => {
  const line: [number, number][] = [[0, 0], [10, 0], [10, 10]];

  it("keeps the whole line at progress 1 and nothing at 0", () => {
    expect(partialLine(line, 1)).toEqual(line);
    expect(partialLine(line, 0)).toEqual([[0, 0], [0, 0]]);
  });

  it("cuts at a fraction of the line's length", () => {
    expect(partialLine(line, 0.25)).toEqual([[0, 0], [5, 0]]);
    expect(partialLine(line, 0.75)).toEqual([[0, 0], [10, 0], [10, 5]]);
  });
});

describe("revealRoute", () => {
  const legs = [
    leg("a", "b", [[0, 0], [10, 0]]),
    leg("b", "c", [[10, 0], [10, 10]]),
  ];

  it("draws only part of the new legs and holds back their labels", () => {
    const { features } = revealRoute(["a", "b", "c"], legs, new Set(["b>c"]), 0.5);
    const lines = features.filter((f) => f.geometry.type === "LineString");
    const points = features.filter((f) => f.geometry.type === "Point");
    expect(lines[0].geometry).toEqual(legs[0].geometry);
    expect(lines[1].geometry).toEqual({ type: "LineString", coordinates: [[10, 0], [10, 5]] });
    expect(points).toHaveLength(1);
  });

  it("is the full route at progress 1", () => {
    const { features } = revealRoute(["a", "b", "c"], legs, new Set(["b>c"]), 1);
    expect(features).toHaveLength(4);
    expect(features[2].geometry).toEqual(legs[1].geometry);
  });
});
