import { describe, expect, it } from "vitest";
import { spotAlternates, spotPath, spotSitemap } from "@/lib/spot-seo";

const site = "https://example.com";
const locales = ["en", "fr"] as const;

describe("spotPath", () => {
  it("prefixes the Locale", () => {
    expect(spotPath("fr", "trocadero")).toBe("/fr/spots/trocadero");
  });
});

describe("spotAlternates", () => {
  it("points the canonical at the page's own Locale and lists every Locale", () => {
    expect(spotAlternates("fr", "trocadero", site, locales)).toEqual({
      canonical: "https://example.com/fr/spots/trocadero",
      languages: {
        en: "https://example.com/en/spots/trocadero",
        fr: "https://example.com/fr/spots/trocadero",
        "x-default": "https://example.com/en/spots/trocadero",
      },
    });
  });
});

describe("spotSitemap", () => {
  it("lists every spot page in every Locale with its alternates", () => {
    const entries = spotSitemap(["a", "b"], site, locales);
    expect(entries.map((e) => e.url)).toEqual([
      "https://example.com/en/spots/a",
      "https://example.com/fr/spots/a",
      "https://example.com/en/spots/b",
      "https://example.com/fr/spots/b",
    ]);
    expect(entries[0].alternates?.languages).toEqual({
      en: "https://example.com/en/spots/a",
      fr: "https://example.com/fr/spots/a",
    });
  });
});
