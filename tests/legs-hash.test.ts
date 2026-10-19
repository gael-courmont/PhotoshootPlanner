import { describe, expect, it } from "vitest";
import { hashInputs, shouldRebuild } from "@/lib/legs";
import { spots } from "@/lib/content";
import type { Leg } from "@/lib/schemas";

const legFor = (from: string, to: string): Leg => ({
  from,
  to,
  walkMinutes: 5,
  meters: 100,
  geometry: { type: "LineString", coordinates: [] },
});
const allLegs = spots.flatMap((a) => spots.filter((b) => b.id !== a.id).map((b) => legFor(a.id, b.id)));

describe("shouldRebuild", () => {
  const overrides = {};
  const base = { spots, overrides, legs: allLegs, force: false };
  const storedHash = hashInputs(spots, overrides);

  it("rebuilds when no hash is stored", () => {
    expect(shouldRebuild({ ...base, storedHash: null })).toBe(true);
  });

  it("skips when hash matches and legs cover every pair", () => {
    expect(shouldRebuild({ ...base, storedHash })).toBe(false);
  });

  it("rebuilds when spot coordinates changed", () => {
    const moved = [{ ...spots[0], coords: [0, 0] as [number, number] }, ...spots.slice(1)];
    expect(shouldRebuild({ ...base, spots: moved, storedHash })).toBe(true);
  });

  it("ignores changes that do not affect routing", () => {
    const edited = [{ ...spots[0], shootMinutes: spots[0].shootMinutes + 5 }, ...spots.slice(1)];
    expect(shouldRebuild({ ...base, spots: edited, storedHash })).toBe(false);
  });

  it("is not affected by spot order", () => {
    expect(shouldRebuild({ ...base, spots: [...spots].reverse(), storedHash })).toBe(false);
  });

  it("rebuilds when overrides changed", () => {
    const changed = { "a>b": { walkMinutes: 14 } };
    expect(shouldRebuild({ ...base, overrides: changed, storedHash })).toBe(true);
  });

  it("rebuilds when the legs file is missing a pair, even if the hash matches", () => {
    expect(shouldRebuild({ ...base, legs: allLegs.slice(1), storedHash })).toBe(true);
  });

  it("rebuilds with force even when everything matches", () => {
    expect(shouldRebuild({ ...base, storedHash, force: true })).toBe(true);
  });
});
