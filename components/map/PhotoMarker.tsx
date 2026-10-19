"use client";

import Image from "next/image";
import type { SpotMarker } from "./SpotMap";

// A round photo thumbnail. Selected spots get a gold ring and their order number, the Start
// spot a flag, and spots that no longer fit stay greyed.
export function PhotoMarker({
  spot,
  routeIndex,
  isStart,
  fits,
  onOpen,
}: {
  spot: SpotMarker;
  routeIndex: number;
  isStart: boolean;
  fits: boolean;
  onOpen: () => void;
}) {
  const selected = routeIndex >= 0;
  const ring = selected ? "ring-4 ring-amber-400" : "ring-2 ring-white";

  return (
    <button
      type="button"
      aria-label={spot.name}
      onClick={onOpen}
      className="relative flex size-11 items-center justify-center rounded-full"
    >
      <span
        className={`block size-11 overflow-hidden rounded-full bg-gray-300 shadow-md ${ring} ${fits ? "" : "opacity-60 grayscale"}`}
      >
        {spot.thumbnail && (
          <Image src={spot.thumbnail} alt="" width={44} height={44} className="size-full object-cover" />
        )}
      </span>
      {selected && !isStart && (
        <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-black">
          {routeIndex + 1}
        </span>
      )}
      {isStart && (
        <span aria-hidden className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-amber-400 text-sm">
          🚩
        </span>
      )}
    </button>
  );
}
