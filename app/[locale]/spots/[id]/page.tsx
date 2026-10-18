import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { spots } from "@/lib/content";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    spots.map((spot) => ({ locale, id: spot.id })),
  );
}

export default async function SpotPage({
  params,
}: PageProps<"/[locale]/spots/[id]">) {
  const { locale, id } = await params;
  const spot = spots.find((s) => s.id === id);
  if (!spot) notFound();

  return (
    <main className="p-6">
      <h1 className="text-2xl">{spot.name[locale as "en" | "fr"]}</h1>
    </main>
  );
}
