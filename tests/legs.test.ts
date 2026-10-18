import { describe, expect, it } from "vitest";
import { buildLegs } from "@/lib/legs";
import { legSchema, type Spot } from "@/lib/schemas";
import orsFixture from "./fixtures/ors-foot-walking.json";

const spot = (id: string, lng: number, lat: number): Spot => ({
  id,
  name: { en: id, fr: id },
  description: { en: id, fr: id },
  coords: [lng, lat],
  shootMinutes: 20,
  photos: [],
});

const spots = [spot("a", 2.29, 48.86), spot("b", 2.3, 48.87), spot("c", 2.31, 48.88)];

const replayFixture = async () => orsFixture;

describe("buildLegs", () => {
  it("yields one leg per ordered pair, never a spot to itself", async () => {
    const legs = await buildLegs({ spots, overrides: {}, fetchRoute: replayFixture });

    expect(legs.map((l) => `${l.from}>${l.to}`).sort()).toEqual(
      ["a>b", "a>c", "b>a", "b>c", "c>a", "c>b"],
    );
  });

  it("rounds duration up to whole minutes, with meters from the response", async () => {
    const [leg] = await buildLegs({ spots, overrides: {}, fetchRoute: replayFixture });

    expect(leg.walkMinutes).toBe(16); // 901.2 s = 15.02 min
    expect(leg.meters).toBe(1235);
  });

  it("simplifies geometry and rounds coordinates to 5 decimals", async () => {
    const [leg] = await buildLegs({ spots, overrides: {}, fetchRoute: replayFixture });

    expect(leg.geometry.coordinates).toEqual([
      [2.2876, 48.8616],
      [2.2888, 48.8616],
      [2.2888, 48.8625],
    ]);
  });

  it("produces legs that pass the Leg schema", async () => {
    const legs = await buildLegs({ spots, overrides: {}, fetchRoute: replayFixture });

    for (const leg of legs) expect(() => legSchema.parse(leg)).not.toThrow();
  });
});
