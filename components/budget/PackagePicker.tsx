"use client";

import { packages } from "@/lib/content";
import { formatDuration } from "@/lib/route";
import { useSelectionStore } from "@/components/selection/SelectionProvider";

export function PackagePicker() {
  const packageId = useSelectionStore((s) => s.selection.packageId);
  const setPackage = useSelectionStore((s) => s.setPackage);

  return (
    <div role="group" aria-label="Package" className="flex gap-2">
      {packages.map((p) => (
        <button
          key={p.id}
          type="button"
          aria-pressed={p.id === packageId}
          onClick={() => setPackage(p.id)}
          className={`rounded border px-3 py-1 ${p.id === packageId ? "bg-black text-white" : "bg-white"}`}
        >
          {formatDuration(p.minutes)}
        </button>
      ))}
    </div>
  );
}
