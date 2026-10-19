import { describe, expect, it } from "vitest";
import { stepHint } from "@/lib/step-hint";

describe("stepHint", () => {
  it("asks for a package first", () => {
    expect(stepHint({ packageId: null, startSpotId: null, spotIds: [] })).toBe("pickPackage");
  });

  it("asks for a start spot once a package is picked", () => {
    expect(stepHint({ packageId: "120", startSpotId: null, spotIds: [] })).toBe("tapToStart");
  });

  it("asks for more spots once the start spot is set", () => {
    expect(stepHint({ packageId: "120", startSpotId: "a", spotIds: [] })).toBe("addSpots");
  });
});
