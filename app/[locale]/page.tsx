import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { MapScreen } from "@/components/map/MapScreen";
import { spots } from "@/lib/content";

export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <main>
      <MapScreen spots={spots.map(({ id, name, coords }) => ({ id, name: name[locale as "en" | "fr"], coords }))} />
    </main>
  );
}
