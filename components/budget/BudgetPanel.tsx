"use client";

import { useSelectionStore } from "@/components/selection/SelectionProvider";
import { useCustomizer } from "@/components/selection/useCustomizer";
import { BudgetBar } from "./BudgetBar";
import { PackagePicker } from "./PackagePicker";

// Throwaway fixed panel until the M3 sheet; its parts move there unchanged.
export function BudgetPanel({
  changingStart,
  onToggleChangeStart,
  onReset,
}: {
  changingStart: boolean;
  onToggleChangeStart: () => void;
  onReset: () => void;
}) {
  const { selection, budget } = useCustomizer();
  const reset = useSelectionStore((s) => s.reset);

  return (
    <div className="fixed inset-x-0 bottom-0 flex flex-col gap-3 bg-white p-4 shadow-lg">
      <PackagePicker />
      {selection.packageId && !selection.startSpotId && <p>Tap a spot to start your photowalk.</p>}
      {budget && <BudgetBar budget={budget} />}
      <div className="flex gap-2">
        {selection.startSpotId && (
          <button type="button" aria-pressed={changingStart} onClick={onToggleChangeStart} className="rounded border px-3 py-1">
            {changingStart ? "Tap a new start" : "Change start"}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            reset();
            onReset();
          }}
          className="rounded border px-3 py-1"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
