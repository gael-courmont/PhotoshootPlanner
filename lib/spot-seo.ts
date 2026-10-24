import type { MetadataRoute } from "next";

export const spotPath = (locale: string, id: string) => `/${locale}/spots/${id}`;

const absolute = (siteUrl: string, locale: string, id: string) => siteUrl + spotPath(locale, id);

// Canonical URL of a Spot page in its own Locale, and the same page in every Locale for `hreflang`.
export function spotAlternates(
  locale: string,
  id: string,
  siteUrl: string,
  locales: readonly string[],
) {
  return {
    canonical: absolute(siteUrl, locale, id),
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, absolute(siteUrl, l, id)])),
      "x-default": absolute(siteUrl, locales[0], id),
    },
  };
}

// One entry per Spot page and Locale, each pointing at its siblings.
export function spotSitemap(
  spotIds: string[],
  siteUrl: string,
  locales: readonly string[],
): MetadataRoute.Sitemap {
  return spotIds.flatMap((id) =>
    locales.map((locale) => ({
      url: absolute(siteUrl, locale, id),
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, absolute(siteUrl, l, id)])),
      },
    })),
  );
}
