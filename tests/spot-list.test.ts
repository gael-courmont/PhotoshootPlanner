import { describe, expect, it } from "vitest";
import type { RouteContent } from "@/lib/route";
import type { Leg, Selection, Spot } from "@/lib/schemas";
import { buildSpotList } from "@/lib/spot-list";

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

// Every directed leg from a symmetric table of "ab": minutes.
const legsFrom = (table: Record<string, number>): Leg[] =>
  Object.entries(table).flatMap(([pair, m]) => [leg(pair[0], pair[1], m), leg(pair[1], pair[0], m)]);

// Four spots of 20 minutes each, 10 minutes apart; a 2h package fits all four (110 min).
const content: RouteContent = {
  spots: ["a", "b", "c", "d"].map((id) => spot(id, 20)),
  packages: [
    { id: "60", minutes: 60 },
    { id: "120", minutes: 120 },
  ],
  legs: legsFrom({ ab: 10, ac: 10, ad: 10, bc: 10, bd: 10, cd: 10 }),
};

const sel = (packageId: string | null, startSpotId: string | null, spotIds: string[] = []): Selection => ({
  packageId,
  startSpotId,
  spotIds,
});

const ids = (rows: { spotId: string }[]) => rows.map((r) => r.spotId);

describe("buildSpotList", () => {
  it("lists every spot under More spots when nothing is selected", () => {
    const list = buildSpotList(sel(null, null), content);
    expect(list.route.rows).toEqual([]);
    expect(ids(list.more)).toEqual(["a", "b", "c", "d"]);
    expect(list.more.every((r) => r.badge === null && r.fits)).toBe(true);
  });

  it("keeps spots open to browse with a package but no start spot", () => {
    const list = buildSpotList(sel("120", null), content);
    expect(list.route.rows).toEqual([]);
    expect(ids(list.more)).toEqual(["a", "b", "c", "d"]);
  });

  it("shows the start spot alone with no legs", () => {
    const list = buildSpotList(sel("120", "b"), content);
    expect(list.route.rows).toEqual([
      { spotId: "b", shootMinutes: 20, badge: { kind: "start" }, fits: true },
    ]);
    expect(list.route.legMinutes).toEqual([]);
    expect(list.route.totalMinutes).toBe(20);
    expect(ids(list.more)).toEqual(["a", "c", "d"]);
  });

  it("orders the route with the leg minutes between rows and numbers the stops", () => {
    const list = buildSpotList(sel("120", "a", ["c", "b"]), {
      ...content,
      legs: legsFrom({ ab: 5, ac: 20, ad: 10, bc: 6, bd: 10, cd: 10 }),
    });
    expect(ids(list.route.rows)).toEqual(["a", "b", "c"]);
    expect(list.route.rows.map((r) => r.badge)).toEqual([
      { kind: "start" },
      { kind: "order", number: 2 },
      { kind: "order", number: 3 },
    ]);
    expect(list.route.legMinutes).toEqual([5, 6]);
    // 3 x 20 shooting + 11 walking, as in the budget bar
    expect(list.route.totalMinutes).toBe(71);
  });

  it("puts spots that no longer fit last in More spots, flagged", () => {
    // 60 min: a(20) + 10 + b(20) = 50; adding c would reach 80 > 60, and so would d.
    const list = buildSpotList(sel("60", "a", ["b"]), content);
    expect(ids(list.more)).toEqual(["c", "d"]);
    expect(list.more.every((r) => !r.fits && r.badge?.kind === "doesntFit")).toBe(true);
  });

  it("places fitting spots before non-fitting ones", () => {
    // 60 min: a + b = 50. c (40) cannot fit; d (1, no walking) can.
    const list = buildSpotList(sel("60", "a", ["b"]), {
      ...content,
      spots: [spot("a", 20), spot("b", 20), spot("c", 40), spot("d", 1)],
      legs: legsFrom({ ab: 10, ac: 10, ad: 0, bc: 10, bd: 0, cd: 10 }),
    });
    expect(ids(list.more)).toEqual(["d", "c"]);
    expect(list.more.map((r) => r.fits)).toEqual([true, false]);
  });

  it("never greys a selected spot when the selection is over budget", () => {
    // 60 min with a, b, c selected: 60 shooting + 20 walking = 80 > 60.
    const list = buildSpotList(sel("60", "a", ["b", "c"]), content);
    expect(list.route.rows.every((r) => r.fits)).toBe(true);
    expect(list.route.totalMinutes).toBe(80);
  });
});
