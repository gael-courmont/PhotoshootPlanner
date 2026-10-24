"use client";

import { useLocale, useTranslations } from "next-intl";
import { useOpenSpot } from "@/components/sheet/OpenSpot";
import { useSelection } from "@/components/selection/SelectionProvider";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { stashOpenSpot } from "@/lib/open-spot-handoff";
import { selectionQuery } from "@/lib/selection-url";

// Switches to the other Locale. The URL is only a one-way mirror (ADR 0001) and a switch remounts
// the page, so the link carries the Selection as query and the open spot is handed over separately.
export function LanguageToggle() {
  const t = useTranslations("Language");
  const locale = useLocale();
  const selection = useSelection();
  const { openSpotId } = useOpenSpot();
  const target = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;

  return (
    <Link
      href={{ pathname: "/", query: selectionQuery(selection) }}
      locale={target}
      lang={target}
      hrefLang={target}
      aria-label={t(target)}
      onClick={() => stashOpenSpot(openSpotId)}
      className="fixed top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-paper text-sm font-semibold text-ink uppercase shadow-md"
    >
      {target}
    </Link>
  );
}
