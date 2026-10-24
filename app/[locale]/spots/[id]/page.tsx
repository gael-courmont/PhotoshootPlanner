import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { PhotoGrid } from "@/components/carousel/PhotoGrid";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { spots } from "@/lib/content";
import { formatDuration } from "@/lib/route";
import { SITE_URL } from "@/lib/site";
import { spotAlternates } from "@/lib/spot-seo";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    spots.map((spot) => ({ locale, id: spot.id })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/spots/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  const spot = spots.find((s) => s.id === id);
  if (!spot) notFound();
  const lang = locale as "en" | "fr";
  const [first] = spot.photos;

  return {
    metadataBase: new URL(SITE_URL),
    title: spot.name[lang],
    description: spot.description[lang],
    alternates: spotAlternates(locale, id, SITE_URL, routing.locales),
    openGraph: {
      title: spot.name[lang],
      description: spot.description[lang],
      locale: lang,
      images: [{ url: first.src, width: first.w, height: first.h, alt: first.alt[lang] }],
    },
  };
}

export default async function SpotPage({
  params,
}: PageProps<"/[locale]/spots/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const spot = spots.find((s) => s.id === id);
  if (!spot) notFound();
  const t = await getTranslations("Spot");
  const lang = locale as "en" | "fr";

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4 md:p-8">
      <Link href="/" className="inline-flex min-h-11 items-center text-sm text-gold-deep underline">
        {t("backToMap")}
      </Link>
      <h1 className="font-serif text-4xl font-semibold">{spot.name[lang]}</h1>
      <p className="text-sm text-ink-soft">
        {t("shootingTime", { duration: formatDuration(spot.shootMinutes) })}
      </p>
      <p>{spot.description[lang]}</p>
      <PhotoGrid photos={spot.photos} />
      <Link
        href={{ pathname: "/", query: { start: spot.id } }}
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 font-medium text-paper"
      >
        {t("planFromHere")}
      </Link>
    </main>
  );
}
