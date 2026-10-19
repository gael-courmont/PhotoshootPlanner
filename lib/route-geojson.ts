import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import type { Leg } from "./schemas";

export type RouteProps = { walkMinutes: number };

// One line feature per Leg of the ordered route, each carrying its walking minutes, plus a
// point feature at the Leg's middle vertex to hang the minutes label on.
export function routeGeoJson(order: string[], legs: Leg[]): FeatureCollection<LineString | Point, RouteProps> {
  const byPair = new Map(legs.map((l) => [`${l.from}>${l.to}`, l]));
  const features: Feature<LineString | Point, RouteProps>[] = [];
  for (let i = 1; i < order.length; i++) {
    const leg = byPair.get(`${order[i - 1]}>${order[i]}`);
    if (!leg) throw new Error(`Missing leg ${order[i - 1]} to ${order[i]}`);
    const { coordinates } = leg.geometry;
    const properties = { walkMinutes: leg.walkMinutes };
    features.push({ type: "Feature", properties, geometry: leg.geometry });
    features.push({
      type: "Feature",
      properties,
      geometry: { type: "Point", coordinates: coordinates[Math.floor(coordinates.length / 2)] },
    });
  }
  return { type: "FeatureCollection", features };
}
