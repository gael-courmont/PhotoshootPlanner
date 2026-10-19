"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Fragment, useMemo } from "react";
import { useOpenSpot } from "./OpenSpot";
import { useCustomizer } from "@/components/selection/useCustomizer";
import { legs, packages, spots } from "@/lib/content";
import { formatDuration } from "@/lib/route";
import { buildSpotList, type SpotBadge, type SpotRow } from "@/lib/spot-list";

const content = { spots, packages, legs };
const spotById = new Map(spots.map((s) => [s.id, s]));

function Badge({ badge }: { badge: SpotBadge }) {
  const t = useTranslations("Sheet.list");
  const label =
    badge.kind === "start" ? t("start") : badge.kind === "order" ? String(badge.number) : t("doesntFit");
  const tone = badge.kind === "doesntFit" ? "bg-gray-200 text-gray-600" : "bg-amber-400 text-black";
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{label}</span>;
}

function Row({ row }: { row: SpotRow }) {
  const locale = useLocale() as "en" | "fr";
  const spot = spotById.get(row.spotId)!;
  const photo = spot.photos[0];
  const { open } = useOpenSpot();

  return (
    <li>
      <button
        type="button"
        onClick={() => open(row.spotId)}
        className={`flex min-h-14 w-full items-center gap-3 px-4 py-1 text-left ${row.fits ? "" : "opacity-50"}`}
      >
      {photo && (
        <Image
          src={photo.thumb ?? photo.src}
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-lg bg-gray-100 object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{spot.name[locale]}</p>
        <p className="text-sm text-gray-600">{formatDuration(row.shootMinutes)}</p>
      </div>
      {row.badge && <Badge badge={row.badge} />}
      </button>
    </li>
  );
}

// Every spot, so each is reachable without the map: the walk in order, then the rest.
export function SpotList() {
  const t = useTranslations("Sheet.list");
  const { selection } = useCustomizer();
  const list = useMemo(() => buildSpotList(selection, content), [selection]);
  const { rows, legMinutes, totalMinutes } = list.route;

  return (
    <div className="flex flex-col gap-4 pb-6">
      {rows.length > 0 && (
        <section aria-labelledby="route-heading">
          <h2 id="route-heading" className="px-4 pb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {t("yourRoute")}
          </h2>
          <ul>
            {rows.map((row, i) => (
              <Fragment key={row.spotId}>
                {i > 0 && (
                  <li aria-hidden className="px-4 py-0.5 pl-20 text-xs text-gray-500">
                    {t("walk", { minutes: legMinutes[i - 1] })}
                  </li>
                )}
                <Row row={row} />
              </Fragment>
            ))}
          </ul>
          {totalMinutes !== null && (
            <p className="px-4 pt-2 text-sm font-medium">{t("total", { duration: formatDuration(totalMinutes) })}</p>
          )}
        </section>
      )}
      {list.more.length > 0 && (
        <section aria-labelledby="more-heading">
          <h2 id="more-heading" className="px-4 pb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {rows.length > 0 ? t("moreSpots") : t("allSpots")}
          </h2>
          <ul>
            {list.more.map((row) => (
              <Row key={row.spotId} row={row} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
