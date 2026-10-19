"use client";

import { formatDuration, type BudgetStatus, type TimeBudget } from "@/lib/route";

const FILL: Record<BudgetStatus, string> = {
  green: "bg-green-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

export function BudgetBar({ budget }: { budget: TimeBudget }) {
  const { totalMinutes, packageMinutes, ratio, status, shootingMinutes, walkingMinutes } = budget;

  return (
    <div data-status={status}>
      <div>
        {formatDuration(totalMinutes)} / {formatDuration(packageMinutes)}
      </div>
      <div className="h-2 w-full overflow-hidden rounded bg-gray-200">
        <div
          className={`h-full ${FILL[status]}`}
          style={{ width: `${Math.min(ratio, 1) * 100}%` }}
        />
      </div>
      <div className="text-sm">
        Shooting {formatDuration(shootingMinutes)} · Walking {formatDuration(walkingMinutes)}
      </div>
    </div>
  );
}
