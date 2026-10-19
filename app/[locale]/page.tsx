import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { SpotMapLoader } from "@/components/map/SpotMapLoader";
import { spots } from "@/lib/content";

export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <main>
      <SpotMapLoader spots={spots.map(({ id, coords }) => ({ id, coords }))} />
    </main>
  );
}
