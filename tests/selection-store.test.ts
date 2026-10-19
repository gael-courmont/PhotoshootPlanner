import { describe, expect, it } from "vitest";
import { createSelectionStore } from "@/lib/selection-store";

const known = {
  packageIds: ["1h", "2h"],
  spotIds: ["a", "b", "c", "d"],
};

const seeded = (initial: Parameters<typeof createSelectionStore>[0]) =>
  createSelectionStore(initial, known);

describe("seeding", () => {
  it("keeps a valid selection as given", () => {
    const store = seeded({ packageId: "2h", startSpotId: "a", spotIds: ["b", "c"] });
    expect(store.getState().selection).toEqual({
      packageId: "2h",
      startSpotId: "a",
      spotIds: ["b", "c"],
    });
  });

  it("starts empty when nothing is given", () => {
    expect(seeded({}).getState().selection).toEqual({
      packageId: null,
      startSpotId: null,
      spotIds: [],
    });
  });

  it("drops an unknown package id", () => {
    expect(seeded({ packageId: "9h" }).getState().selection.packageId).toBeNull();
  });

  it("drops unknown spot ids", () => {
    const { selection } = seeded({
      startSpotId: "a",
      spotIds: ["b", "zzz", "c"],
    }).getState();
    expect(selection.spotIds).toEqual(["b", "c"]);
  });

  it("drops an unknown start spot, and with it all other spots", () => {
    const { selection } = seeded({
      startSpotId: "zzz",
      spotIds: ["b", "c"],
    }).getState();
    expect(selection.startSpotId).toBeNull();
    expect(selection.spotIds).toEqual([]);
  });

  it("drops all other spots when there is no start spot", () => {
    expect(seeded({ spotIds: ["b"] }).getState().selection.spotIds).toEqual([]);
  });

  it("removes duplicate spot ids, keeping first occurrence order", () => {
    const { selection } = seeded({
      startSpotId: "a",
      spotIds: ["c", "b", "c", "b"],
    }).getState();
    expect(selection.spotIds).toEqual(["c", "b"]);
  });

  it("removes the start spot from the other spots", () => {
    const { selection } = seeded({
      startSpotId: "a",
      spotIds: ["b", "a"],
    }).getState();
    expect(selection.spotIds).toEqual(["b"]);
  });
});

describe("actions", () => {
  it("picking a package never touches the spots", () => {
    const store = seeded({ startSpotId: "a", spotIds: ["b"] });
    store.getState().setPackage("1h");
    expect(store.getState().selection).toEqual({
      packageId: "1h",
      startSpotId: "a",
      spotIds: ["b"],
    });
  });

  it("setting the start on an empty selection starts the walk", () => {
    const store = seeded({});
    store.getState().setStart("a");
    expect(store.getState().selection.startSpotId).toBe("a");
  });

  it("setting the start to a selected spot swaps it with the previous start", () => {
    const store = seeded({ startSpotId: "a", spotIds: ["b", "c"] });
    store.getState().setStart("b");
    expect(store.getState().selection).toMatchObject({
      startSpotId: "b",
      spotIds: ["c", "a"],
    });
  });

  it("setting a new start keeps the previous start as a selected spot", () => {
    const store = seeded({ startSpotId: "a", spotIds: ["b"] });
    store.getState().setStart("d");
    expect(store.getState().selection).toMatchObject({
      startSpotId: "d",
      spotIds: ["b", "a"],
    });
  });

  it("ignores an unknown start", () => {
    const store = seeded({ startSpotId: "a" });
    store.getState().setStart("zzz");
    expect(store.getState().selection.startSpotId).toBe("a");
  });

  it("adding a spot without a start is a no-op", () => {
    const store = seeded({});
    store.getState().addSpot("b");
    expect(store.getState().selection.spotIds).toEqual([]);
  });

  it("adds spots in insertion order, ignoring the start, duplicates and unknown ids", () => {
    const store = seeded({ startSpotId: "a" });
    const { addSpot } = store.getState();
    addSpot("c");
    addSpot("b");
    addSpot("c");
    addSpot("a");
    addSpot("zzz");
    expect(store.getState().selection.spotIds).toEqual(["c", "b"]);
  });

  it("removes a spot", () => {
    const store = seeded({ startSpotId: "a", spotIds: ["b", "c"] });
    store.getState().removeSpot("b");
    expect(store.getState().selection.spotIds).toEqual(["c"]);
  });

  it("cannot remove the start spot", () => {
    const store = seeded({ startSpotId: "a", spotIds: ["b"] });
    store.getState().removeSpot("a");
    expect(store.getState().selection).toMatchObject({
      startSpotId: "a",
      spotIds: ["b"],
    });
  });

  it("reset clears everything", () => {
    const store = seeded({ packageId: "2h", startSpotId: "a", spotIds: ["b"] });
    store.getState().reset();
    expect(store.getState().selection).toEqual({
      packageId: null,
      startSpotId: null,
      spotIds: [],
    });
  });
});

describe("no-op actions", () => {
  it("keep the same selection when nothing changes", () => {
    const store = seeded({ packageId: "2h", startSpotId: "a", spotIds: ["b"] });
    const before = store.getState().selection;
    store.getState().setPackage("2h");
    store.getState().removeSpot("a");
    store.getState().removeSpot("d");
    expect(store.getState().selection).toBe(before);
  });
});

describe("seed", () => {
  it("replaces the selection with a sanitized one", () => {
    const store = seeded({});
    store.getState().seed({ packageId: "1h", startSpotId: "a", spotIds: ["b", "zzz"] });
    expect(store.getState().selection).toEqual({
      packageId: "1h",
      startSpotId: "a",
      spotIds: ["b"],
    });
  });
});
