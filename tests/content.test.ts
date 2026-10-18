import { describe, expect, it } from "vitest";
import { packages, spots } from "@/lib/content";

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
