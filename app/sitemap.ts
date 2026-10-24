import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { spots } from "@/lib/content";
import { SITE_URL } from "@/lib/site";
import { spotSitemap } from "@/lib/spot-seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return spotSitemap(
    spots.map((s) => s.id),
    SITE_URL,
    routing.locales,
  );
}
