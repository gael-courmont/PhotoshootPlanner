"use client";

import { useTranslations } from "next-intl";
import { packages } from "@/lib/content";
import { formatDuration } from "@/lib/route";
import { useSelectionStore } from "@/components/selection/SelectionProvider";

export function PackagePicker() {
  const t = useTranslations("Sheet");
  const packageId = useSelectionStore((s) => s.selection.packageId);
  const setPackage = useSelectionStore((s) => s.setPackage);

  return (
    <div role="group" aria-label={t("package")} className="flex gap-2">
      {packages.map((p) => (
        <button
          key={p.id}
          type="button"
          aria-pressed={p.id === packageId}
          onClick={() => setPackage(p.id)}
          className={`min-h-11 min-w-11 rounded border px-3 ${p.id === packageId ? "bg-black text-white" : "bg-white"}`}
        >
          {formatDuration(p.minutes)}
        </button>
      ))}
    </div>
  );
}
