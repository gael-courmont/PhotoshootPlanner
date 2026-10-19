import { describe, expect, it } from "vitest";
import { legs as realLegs, packages as realPackages, spots as realSpots } from "@/lib/content";
import {
  formatDuration,
  nonFittingSpotIds,
  routeOrder,
  timeBudget,
  type RouteContent,
} from "@/lib/route";
import type { Leg, Package, Selection, Spot } from "@/lib/schemas";

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

// Builds every directed leg from a symmetric table of "ab": minutes.
const legsFrom = (table: Record<string, number>): Leg[] =>
  Object.entries(table).flatMap(([pair, m]) => [
    leg(pair[0], pair[1], m),
    leg(pair[1], pair[0], m),
  ]);

const pkg = (minutes: number): Package => ({ id: String(minutes), minutes });

const content = (
  spotMinutes: Record<string, number>,
  table: Record<string, number>,
  packageMinutes: number[] = [100],
): RouteContent => ({
  spots: Object.entries(spotMinutes).map(([id, m]) => spot(id, m)),
  packages: packageMinutes.map(pkg),
  legs: legsFrom(table),
});

const select = (packageId: string | null, startSpotId: string | null, spotIds: string[] = []): Selection => ({
  packageId,
  startSpotId,
  spotIds,
});

describe("routeOrder", () => {
  const c = content({ a: 10, b: 10, c: 10, d: 10 }, { ab: 5, ac: 5, ad: 5, bc: 1, bd: 9, cd: 1 });

  it("is empty without a start spot", () => {
    expect(routeOrder(select("100", null, ["b"]), c)).toEqual([]);
  });

  it("is just the start spot when nothing else is selected", () => {
    expect(routeOrder(select("100", "a"), c)).toEqual(["a"]);
  });

  it("keeps the start first and orders the rest to minimize walking", () => {
    // a>b>c>d walks 5+1+1; a>d>c>b walks 5+1+1; insertion order breaks that tie.
    expect(routeOrder(select("100", "a", ["d", "b", "c"]), c)).toEqual(["a", "d", "c", "b"]);
  });

  it("goes to insertion order on ties", () => {
    const tied = content({ a: 10, b: 10, c: 10 }, { ab: 5, ac: 5, bc: 5 });
    expect(routeOrder(select("100", "a", ["c", "b"]), tied)).toEqual(["a", "c", "b"]);
    expect(routeOrder(select("100", "a", ["b", "c"]), tied)).toEqual(["a", "b", "c"]);
  });

  it("uses the directed legs, so a one-way difference changes the order", () => {
    const asymmetric: RouteContent = {
      spots: [spot("a", 10), spot("b", 10), spot("c", 10)],
      packages: [pkg(100)],
      legs: [
        leg("a", "b", 1), leg("b", "a", 1),
        leg("a", "c", 1), leg("c", "a", 1),
        leg("b", "c", 20), leg("c", "b", 2),
      ],
    };
    // a>b>c = 21, a>c>b = 3
    expect(routeOrder(select("100", "a", ["b", "c"]), asymmetric)).toEqual(["a", "c", "b"]);
  });

  it("throws when a needed leg is missing", () => {
    const missing: RouteContent = { ...c, legs: c.legs.filter((l) => !(l.from === "a" && l.to === "b")) };
    expect(() => routeOrder(select("100", "a", ["b"]), missing)).toThrow(/a.*b/);
  });
});

describe("timeBudget", () => {
  const c = content({ a: 20, b: 20, c: 20 }, { ab: 10, ac: 10, bc: 10 }, [100, 60]);

  it("returns nothing without a package", () => {
    expect(timeBudget(select(null, "a", ["b"]), c)).toBeNull();
  });

  it("counts only the start spot's shooting time until others are added", () => {
    expect(timeBudget(select("100", "a"), c)).toEqual({
      order: ["a"],
      shootingMinutes: 20,
      walkingMinutes: 0,
      totalMinutes: 20,
      packageMinutes: 100,
      ratio: 0.2,
      status: "green",
    });
  });

  it("returns order, totals and ratio for a route", () => {
    const budget = timeBudget(select("100", "a", ["b", "c"]), c);
    expect(budget).toMatchObject({
      shootingMinutes: 60,
      walkingMinutes: 20,
      totalMinutes: 80,
      packageMinutes: 100,
      ratio: 0.8,
      status: "green",
    });
  });

  it("is green just under 90% and amber at exactly 90%", () => {
    // Three spots with 10 min legs: walking is 20, so shooting 69 gives 89 and 70 gives 90.
    const at = (shoot: number) => {
      const c3 = content({ a: shoot - 44, b: 22, c: 22 }, { ab: 10, ac: 10, bc: 10 }, [100]);
      return timeBudget(select("100", "a", ["b", "c"]), c3);
    };
    expect(at(69)).toMatchObject({ totalMinutes: 89, status: "green" });
    expect(at(70)).toMatchObject({ totalMinutes: 90, status: "amber" });
  });

  it("is amber at exactly 100% and red above", () => {
    const full = content({ a: 40, b: 20, c: 20 }, { ab: 10, ac: 10, bc: 10 }, [100]);
    expect(timeBudget(select("100", "a", ["b", "c"]), full)).toMatchObject({ ratio: 1, status: "amber" });
    const over = content({ a: 41, b: 20, c: 20 }, { ab: 10, ac: 10, bc: 10 }, [100]);
    expect(timeBudget(select("100", "a", ["b", "c"]), over)?.status).toBe("red");
  });

  it("goes red when a shorter package is picked, keeping the selection", () => {
    expect(timeBudget(select("60", "a", ["b", "c"]), c)?.status).toBe("red");
  });

  it("throws when a needed leg is missing", () => {
    expect(() =>
      timeBudget(select("100", "a", ["b"]), { ...c, legs: [] }),
    ).toThrow();
  });
});

describe("nonFittingSpotIds", () => {
  const c = content({ a: 20, b: 20, c: 20, d: 50 }, { ab: 10, ac: 10, ad: 10, bc: 10, bd: 10, cd: 10 }, [100]);

  it("reports nothing without a package", () => {
    expect(nonFittingSpotIds(select(null, "a"), c)).toEqual([]);
  });

  it("reports nothing without a start spot", () => {
    expect(nonFittingSpotIds(select("100", null), c)).toEqual([]);
  });

  it("reports unselected spots that would push the route over 100%", () => {
    // a+d = 20+50+10 = 80 fits; a+b+d = 20+20+50+20 = 110 is over.
    expect(nonFittingSpotIds(select("100", "a"), c)).toEqual([]);
    expect(nonFittingSpotIds(select("100", "a", ["b"]), c)).toEqual(["d"]);
    expect(nonFittingSpotIds(select("100", "a", ["b", "c"]), c)).toEqual(["d"]);
  });

  it("does not report a spot that lands exactly on 100%", () => {
    const exact = content({ a: 40, b: 50 }, { ab: 10 }, [100]);
    expect(nonFittingSpotIds(select("100", "a"), exact)).toEqual([]);
  });

  it("never reports selected spots, even when the route is over budget", () => {
    expect(nonFittingSpotIds(select("100", "a", ["b", "c", "d"]), c)).toEqual([]);
  });

  it("reports every unselected spot once the route is already over budget", () => {
    const tight = content({ a: 60, b: 60, c: 5 }, { ab: 5, ac: 5, bc: 5 }, [100]);
    expect(nonFittingSpotIds(select("100", "a", ["b"]), tight)).toEqual(["c"]);
  });
});

describe("formatDuration", () => {
  it.each([
    [120, "2h"],
    [60, "1h"],
    [112, "1h52"],
    [65, "1h05"],
    [45, "45min"],
    [1, "1min"],
    [0, "0min"],
  ])("formats %i minutes as %s", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});

describe("real content", () => {
  it("2h from Trocadéro plus two spots walks Bir-Hakeim then Champ-de-Mars", () => {
    const real: RouteContent = { spots: realSpots, packages: realPackages, legs: realLegs };
    const selection = select("120", "trocadero", ["champ-de-mars", "bir-hakeim"]);

    expect(routeOrder(selection, real)).toEqual(["trocadero", "bir-hakeim", "champ-de-mars"]);
    expect(timeBudget(selection, real)).toMatchObject({
      shootingMinutes: 65,
      walkingMinutes: 25,
      totalMinutes: 90,
      packageMinutes: 120,
      ratio: 0.75,
      status: "green",
    });
  });
});
