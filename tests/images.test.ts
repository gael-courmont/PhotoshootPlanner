import { describe, expect, it } from "vitest";
import { fitWithin, mergePhotos, photoPaths } from "@/lib/images";
import type { Spot } from "@/lib/schemas";

type Photo = Spot["photos"][number];

describe("fitWithin", () => {
  it("scales a landscape photo to the long edge", () => {
    expect(fitWithin(2000, 1000, 1000)).toEqual({ w: 1000, h: 500 });
  });

  it("scales a portrait photo to the long edge", () => {
    expect(fitWithin(1000, 2000, 160)).toEqual({ w: 80, h: 160 });
  });

  it("never upscales", () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ w: 800, h: 600 });
  });

  it("rounds to whole pixels", () => {
    expect(fitWithin(3, 2, 2)).toEqual({ w: 2, h: 1 });
  });
});

describe("photoPaths", () => {
  it("names the files after the source photo, under the spot", () => {
    expect(photoPaths("trocadero", "Sunset View 01.JPG")).toEqual({
      src: "/spots/trocadero/sunset-view-01.webp",
      thumb: "/spots/trocadero/sunset-view-01-thumb.webp",
    });
  });
});

const photo = (src: string, alt = ""): Photo => ({
  src,
  alt: { en: alt, fr: alt },
  w: 1,
  h: 1,
});

describe("mergePhotos", () => {
  it("keeps the alt text the photographer already wrote", () => {
    const existing = [photo("/spots/a/one.webp", "A bridge")];
    const generated = [{ ...photo("/spots/a/one.webp"), w: 1600, h: 1067, thumb: "/spots/a/one-thumb.webp" }];
    expect(mergePhotos(existing, generated)).toEqual([
      { ...photo("/spots/a/one.webp", "A bridge"), w: 1600, h: 1067, thumb: "/spots/a/one-thumb.webp" },
    ]);
  });

  it("leaves alt text empty for a new photo and follows the generated order", () => {
    const existing = [photo("/spots/a/two.webp", "Two")];
    const generated = [photo("/spots/a/one.webp"), photo("/spots/a/two.webp")];
    expect(mergePhotos(existing, generated).map((p) => [p.src, p.alt.en])).toEqual([
      ["/spots/a/one.webp", ""],
      ["/spots/a/two.webp", "Two"],
    ]);
  });
});
