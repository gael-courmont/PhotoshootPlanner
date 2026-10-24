import { parseAsArrayOf, parseAsString } from "nuqs";
import type { Selection } from "./schemas";

// Key order is the URL param order: pkg, start, spots.
export const urlParsers = {
  pkg: parseAsString,
  start: parseAsString,
  spots: parseAsArrayOf(parseAsString),
};

export const toUrl = (s: Selection) => ({
  pkg: s.packageId,
  start: s.startSpotId,
  spots: s.spotIds.length ? s.spotIds : null,
});

// The Selection as URL query params, for a link that must carry it to another page.
export function selectionQuery(s: Selection): Record<string, string> {
  const { pkg, start, spots } = toUrl(s);
  return {
    ...(pkg && { pkg }),
    ...(start && { start }),
    ...(spots && { spots: spots.join(",") }),
  };
}
