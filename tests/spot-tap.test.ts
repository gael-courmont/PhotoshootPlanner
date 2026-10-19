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

  it("ignores taps on other spots once the start is set and not changing", () => {
    expect(tapAction(sel("120", "a"), "b", false)).toBe("none");
  });

  it("sets a new start on the next tap in change-start mode", () => {
    expect(tapAction(sel("120", "a"), "b", true)).toBe("setStart");
  });

  it("ignores a tap on the current start spot in change-start mode", () => {
    expect(tapAction(sel("120", "a"), "a", true)).toBe("none");
  });
});
