import type { Spot } from "./schemas";

type Photo = Spot["photos"][number];

export const SRC_LONG_EDGE = 1600;
export const THUMB_LONG_EDGE = 160;
export const BLUR_LONG_EDGE = 16;
export const THUMB_MAX_BYTES = 30 * 1024;

// Scales to the long edge, keeping the aspect ratio, never upscaling.
export function fitWithin(w: number, h: number, longEdge: number): { w: number; h: number } {
  const scale = Math.min(1, longEdge / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
}

// Public URLs of a photo's optimised file and thumbnail, from its source file name.
export function photoPaths(spotId: string, fileName: string): { src: string; thumb: string } {
  const stem = fileName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return { src: `/spots/${spotId}/${stem}.webp`, thumb: `/spots/${spotId}/${stem}-thumb.webp` };
}

// The generated photos in their order, with the alt text already written for any photo kept.
export function mergePhotos(existing: Photo[], generated: Photo[]): Photo[] {
  const alt = new Map(existing.map((p) => [p.src, p.alt]));
  return generated.map((p) => ({ ...p, alt: alt.get(p.src) ?? p.alt }));
}
