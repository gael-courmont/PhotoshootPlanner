import { describe, expect, it } from "vitest";
import { legs, packages, spots } from "@/lib/content";

describe("content", () => {
  it("passes schema validation", () => {
    expect(spots.length).toBeGreaterThan(0);
    expect(packages.length).toBeGreaterThan(0);
  });

  it("has unique spot ids", () => {
    const ids = spots.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("legs", () => {
  it("cover every ordered pair of spots", () => {
    const have = new Set(legs.map((l) => `${l.from}>${l.to}`));
    const missing = spots.flatMap((a) =>
      spots.filter((b) => b.id !== a.id).map((b) => `${a.id}>${b.id}`),
    ).filter((key) => !have.has(key));

    expect(missing).toEqual([]);
  });
});
