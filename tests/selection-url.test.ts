import { describe, expect, it } from "vitest";
import { selectionQuery } from "@/lib/selection-url";

describe("selectionQuery", () => {
  it("is empty for an empty Selection", () => {
    expect(selectionQuery({ packageId: null, startSpotId: null, spotIds: [] })).toEqual({});
  });

  it("carries the package, start and other spots", () => {
    expect(
      selectionQuery({ packageId: "120", startSpotId: "trocadero", spotIds: ["bir-hakeim", "champ-de-mars"] }),
    ).toEqual({ pkg: "120", start: "trocadero", spots: "bir-hakeim,champ-de-mars" });
  });

  it("leaves out what is not set", () => {
    expect(selectionQuery({ packageId: "60", startSpotId: null, spotIds: [] })).toEqual({ pkg: "60" });
  });
});
