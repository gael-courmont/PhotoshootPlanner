import type { FeatureCollection, LineString, Point } from "geojson";
import { routeGeoJson, type RouteProps } from "./route-geojson";
import type { Leg } from "./schemas";

type Position = [number, number];

const legKeys = (order: string[]) => order.slice(1).map((id, i) => `${order[i]}>${id}`);

// Keys ("from>to") of the legs in the new route that the old one did not have. Empty when the old
// route had no legs: that is a first load, a restored link or a reset, and the route just appears.
export function legsToReveal(prev: string[], next: string[]): Set<string> {
  if (prev.length === 0) return new Set();
  const before = new Set(legKeys(prev));
  return new Set(legKeys(next).filter((key) => !before.has(key)));
}

const distance = ([x1, y1]: Position, [x2, y2]: Position) => Math.hypot(x2 - x1, y2 - y1);

// The first `progress` (0 to 1) of a line by length. Planar distances are fine at this scale.
export function partialLine(coordinates: Position[], progress: number): Position[] {
  if (progress >= 1) return coordinates;
  const total = coordinates.slice(1).reduce((sum, c, i) => sum + distance(coordinates[i], c), 0);
  let remaining = total * Math.max(progress, 0);
  const out: Position[] = [coordinates[0]];
  for (let i = 1; i < coordinates.length; i++) {
    const length = distance(coordinates[i - 1], coordinates[i]);
    if (remaining >= length) {
      out.push(coordinates[i]);
      remaining -= length;
      continue;
    }
    const f = length === 0 ? 0 : remaining / length;
    const [x1, y1] = coordinates[i - 1];
    const [x2, y2] = coordinates[i];
    out.push([x1 + (x2 - x1) * f, y1 + (y2 - y1) * f]);
    return out;
  }
  return out;
}

// The route with the given legs drawn only `progress` of the way, their labels held back until done.
export function revealRoute(
  order: string[],
  legs: Leg[],
  revealing: Set<string>,
  progress: number,
): FeatureCollection<LineString | Point, RouteProps> {
  const full = routeGeoJson(order, legs);
  if (progress >= 1 || revealing.size === 0) return full;
  const keys = legKeys(order);
  const features = full.features.flatMap((feature, i) => {
    if (!revealing.has(keys[Math.floor(i / 2)])) return [feature];
    if (feature.geometry.type === "Point") return [];
    const coordinates = partialLine(feature.geometry.coordinates as Position[], progress);
    return [{ ...feature, geometry: { type: "LineString" as const, coordinates } }];
  });
  return { ...full, features };
}
