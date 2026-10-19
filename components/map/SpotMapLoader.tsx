"use client";

import dynamic from "next/dynamic";

// MapLibre needs WebGL and window, so it is never server-rendered.
export const SpotMapLoader = dynamic(
  () => import("./SpotMap").then((m) => m.SpotMap),
  { ssr: false },
);
