"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BudgetBar } from "@/components/budget/BudgetBar";
import { PackagePicker } from "@/components/budget/PackagePicker";
import { useSelectionStore } from "@/components/selection/SelectionProvider";
import { useCustomizer } from "@/components/selection/useCustomizer";
import { stepHint } from "@/lib/step-hint";

const CONFIRM_MS = 4000;

// Reset needs a second tap only when spots beyond the Start spot would be lost.
function ResetButton() {
  const t = useTranslations("Sheet");
  const reset = useSelectionStore((s) => s.reset);
  const needsConfirm = useSelectionStore((s) => s.selection.spotIds.length > 0);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <button
      type="button"
      onClick={() => {
        if (needsConfirm && !confirming) return setConfirming(true);
        setConfirming(false);
        reset();
      }}
      className={`min-h-11 shrink-0 rounded px-3 text-sm ${confirming ? "bg-red text-paper" : "text-ink-soft underline"}`}
    >
      {confirming ? t("resetConfirm") : t("reset")}
    </button>
  );
}

// The sheet's always-visible part: Package picker, next-step hint, Time budget bar, Reset.
export function SheetPeek() {
  const t = useTranslations("Sheet");
  const { selection, budget } = useCustomizer();

  return (
    <div className="flex flex-col gap-2 px-4 pb-3">
      <div className="flex items-center justify-between gap-2">
        <PackagePicker />
        <ResetButton />
      </div>
      <p className="text-sm text-ink-soft">{t(`hint.${stepHint(selection)}`)}</p>
      {budget && <BudgetBar budget={budget} />}
    </div>
  );
}
