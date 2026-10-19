"use client";

import { useCustomizer } from "@/components/selection/useCustomizer";
import { BudgetBar } from "./BudgetBar";
import { PackagePicker } from "./PackagePicker";

// Throwaway fixed panel until the M3 sheet; its parts move there unchanged.
export function BudgetPanel() {
  const { budget } = useCustomizer();

  return (
    <div className="fixed inset-x-0 bottom-0 flex flex-col gap-3 bg-white p-4 shadow-lg">
      <PackagePicker />
      {budget && <BudgetBar budget={budget} />}
    </div>
  );
}
