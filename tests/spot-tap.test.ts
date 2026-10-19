import { describe, expect, it } from "vitest";
import type { Selection } from "@/lib/schemas";
import { tapAction } from "@/lib/spot-tap";

const sel = (packageId: string | null, startSpotId: string | null, spotIds: string[] = []): Selection => ({
  packageId,
  startSpotId,
  spotIds,
});

describe("tapAction", () => {
  it("does nothing without a package", () => {
    expect(tapAction(sel(null, null), "a", false)).toBe("none");
  });

  it("sets the start spot on the first tap once a package is picked", () => {
    expect(tapAction(sel("120", null), "a", false)).toBe("setStart");
  });

  it("adds an unselected spot once the start is set", () => {
    expect(tapAction(sel("120", "a"), "b", false)).toBe("addSpot");
  });

  it("removes a selected spot", () => {
    expect(tapAction(sel("120", "a", ["b"]), "b", false)).toBe("removeSpot");
  });

  it("ignores a tap on the start spot outside change-start mode", () => {
    expect(tapAction(sel("120", "a", ["b"]), "a", false)).toBe("none");
  });

  it("makes a selected spot the new start in change-start mode", () => {
    expect(tapAction(sel("120", "a", ["b"]), "b", true)).toBe("setStart");
  });

  it("sets a new start on the next tap in change-start mode", () => {
    expect(tapAction(sel("120", "a"), "b", true)).toBe("setStart");
  });

  it("ignores a tap on the current start spot in change-start mode", () => {
    expect(tapAction(sel("120", "a"), "a", true)).toBe("none");
  });
});
