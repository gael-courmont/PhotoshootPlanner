"use client";

import { useTranslations } from "next-intl";
import { formatDuration, type BudgetStatus, type TimeBudget } from "@/lib/route";

const FILL: Record<BudgetStatus, string> = {
  green: "bg-green",
  amber: "bg-amber",
  red: "bg-red",
};

export function BudgetBar({ budget }: { budget: TimeBudget }) {
  const t = useTranslations("Sheet.budget");
  const { totalMinutes, packageMinutes, ratio, status, shootingMinutes, walkingMinutes } = budget;

  return (
    <div data-status={status}>
      <div>
        {formatDuration(totalMinutes)} / {formatDuration(packageMinutes)}
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-stone">
        <div
          className={`h-full ${FILL[status]}`}
          style={{ width: `${Math.min(ratio, 1) * 100}%` }}
        />
      </div>
      <div className="text-sm">
        {t("shooting")} {formatDuration(shootingMinutes)} · {t("walking")} {formatDuration(walkingMinutes)}
      </div>
    </div>
  );
}
