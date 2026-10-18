import { describe, expect, it } from "vitest";
import { hashSpots, shouldRebuild } from "@/lib/legs";
import { spots } from "@/lib/content";

describe("shouldRebuild", () => {
  const hash = hashSpots(spots);

  it("rebuilds when no hash is stored", () => {
    expect(shouldRebuild({ spots, storedHash: null, force: false })).toBe(true);
  });

  it("skips when the stored hash matches the spots", () => {
    expect(shouldRebuild({ spots, storedHash: hash, force: false })).toBe(false);
  });

  it("rebuilds when the spots changed", () => {
    const changed = [{ ...spots[0], shootMinutes: spots[0].shootMinutes + 5 }, ...spots.slice(1)];
    expect(shouldRebuild({ spots: changed, storedHash: hash, force: false })).toBe(true);
  });

  it("rebuilds with force even when the hash matches", () => {
    expect(shouldRebuild({ spots, storedHash: hash, force: true })).toBe(true);
  });
});
