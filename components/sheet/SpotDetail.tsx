"use client";

import { useLocale, useTranslations } from "next-intl";
import { PhotoCarousel } from "@/components/carousel/PhotoCarousel";
import { useSelectionStore } from "@/components/selection/SelectionProvider";
import { useCustomizer } from "@/components/selection/useCustomizer";
import { legs, packages, spots } from "@/lib/content";
import { formatDuration } from "@/lib/route";
import { spotAction, type SpotActionButton } from "@/lib/spot-action";

const content = { spots, packages, legs };

function ActionButton({
  button,
  spotId,
  primary,
}: {
  button: SpotActionButton;
  spotId: string;
  primary: boolean;
}) {
  const t = useTranslations("Spot");
  const setStart = useSelectionStore((s) => s.setStart);
  const addSpot = useSelectionStore((s) => s.addSpot);
  const removeSpot = useSelectionStore((s) => s.removeSpot);
  const { disabled } = button;
  const run = { start: setStart, makeStart: setStart, add: addSpot, remove: removeSpot }[button.kind];
  const reason =
    disabled?.reason === "pickPackage"
      ? t("pickPackageFirst")
      : disabled
        ? t("doesntFit", { duration: formatDuration(disabled.packageMinutes) })
        : null;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={!!disabled}
        aria-describedby={reason ? `reason-${button.kind}` : undefined}
        onClick={() => run(spotId)}
        className={`min-h-11 rounded-lg px-4 font-medium disabled:opacity-50 ${primary ? "bg-ink text-paper" : "border border-ink"}`}
      >
        {t(`action.${button.kind}`)}
      </button>
      {reason && (
        <p id={`reason-${button.kind}`} className="text-sm text-ink-soft">
          {reason}
        </p>
      )}
    </div>
  );
}

// Everything about one spot, plus the only controls that change the Selection from the map side.
export function SpotDetail({ spotId }: { spotId: string }) {
  const t = useTranslations("Spot");
  const locale = useLocale() as "en" | "fr";
  const { selection } = useCustomizer();
  const spot = spots.find((s) => s.id === spotId);
  if (!spot) return null;
  const action = spotAction(selection, spotId, content);

  return (
    <div className="flex flex-col gap-3 pb-6">
      <PhotoCarousel key={spotId} photos={spot.photos} />
      <div className="flex flex-col gap-2 px-4">
        <h2 className="font-serif text-3xl font-semibold">{spot.name[locale]}</h2>
        <p className="text-sm text-ink-soft">{t("shootingTime", { duration: formatDuration(spot.shootMinutes) })}</p>
        <p>{spot.description[locale]}</p>
        {action.primary && <ActionButton button={action.primary} spotId={spotId} primary />}
        {action.secondary && <ActionButton button={action.secondary} spotId={spotId} primary={false} />}
      </div>
    </div>
  );
}
