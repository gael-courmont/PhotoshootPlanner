import { describe, expect, it } from "vitest";
import type { RouteContent } from "@/lib/route";
import type { Leg, Selection, Spot } from "@/lib/schemas";
import { spotAction } from "@/lib/spot-action";

const spot = (id: string, shootMinutes: number): Spot => ({
  id,
  name: { en: id, fr: id },
  description: { en: id, fr: id },
  coords: [2.29, 48.86],
  shootMinutes,
  photos: [],
});

const leg = (from: string, to: string, walkMinutes: number): Leg => ({
  from,
  to,
  walkMinutes,
  meters: 0,
  geometry: { type: "LineString", coordinates: [] },
});

const legsFrom = (table: Record<string, number>): Leg[] =>
  Object.entries(table).flatMap(([pair, m]) => [leg(pair[0], pair[1], m), leg(pair[1], pair[0], m)]);

// Three 20 min spots, 10 min apart: a 1h package fits two (50 min) but not three (80 min).
const content: RouteContent = {
  spots: ["a", "b", "c"].map((id) => spot(id, 20)),
  packages: [
    { id: "60", minutes: 60 },
    { id: "120", minutes: 120 },
  ],
  legs: legsFrom({ ab: 10, ac: 10, bc: 10 }),
};

const sel = (packageId: string | null, startSpotId: string | null, spotIds: string[] = []): Selection => ({
  packageId,
  startSpotId,
  spotIds,
});

describe("spotAction", () => {
  it("disables Start here until a package is picked", () => {
    expect(spotAction(sel(null, null), "a", content)).toEqual({
      primary: { kind: "start", disabled: { reason: "pickPackage" } },
    });
  });

  it("offers Start here once a package is picked", () => {
    expect(spotAction(sel("120", null), "a", content)).toEqual({ primary: { kind: "start" } });
  });

  it("offers nothing on the start spot itself", () => {
    expect(spotAction(sel("120", "a"), "a", content)).toEqual({ primary: null });
  });

  it("offers Add, with Make this the start, on an unselected spot", () => {
    expect(spotAction(sel("120", "a"), "b", content)).toEqual({
      primary: { kind: "add" },
      secondary: { kind: "makeStart" },
    });
  });

  it("offers Remove, with Make this the start, on a selected spot", () => {
    expect(spotAction(sel("120", "a", ["b"]), "b", content)).toEqual({
      primary: { kind: "remove" },
      secondary: { kind: "makeStart" },
    });
  });

  it("disables Add with the budget when the spot doesn't fit", () => {
    const action = spotAction(sel("60", "a", ["b"]), "c", content);
    expect(action.primary).toEqual({ kind: "add", disabled: { reason: "doesntFit", packageMinutes: 60 } });
    expect(action.secondary).toEqual({
      kind: "makeStart",
      disabled: { reason: "doesntFit", packageMinutes: 60 },
    });
  });

  it("keeps Remove and Make this the start enabled on a selected spot over budget", () => {
    // 60 min with a, b, c selected is 80 min: over budget, yet nothing is disabled.
    expect(spotAction(sel("60", "a", ["b", "c"]), "c", content)).toEqual({
      primary: { kind: "remove" },
      secondary: { kind: "makeStart" },
    });
  });

  it("disables Add without a package even when a start spot exists", () => {
    expect(spotAction(sel(null, "a"), "b", content).primary).toEqual({
      kind: "add",
      disabled: { reason: "pickPackage" },
    });
  });
});
