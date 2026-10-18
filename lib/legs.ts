import simplify from "@turf/simplify";
import { z } from "zod";
import { legSchema, type Leg, type Spot } from "./schemas";

// Returns the raw OpenRouteService foot-walking GeoJSON response for one directed pair.
export type FetchRoute = (from: Spot, to: Spot) => Promise<unknown>;

const SIMPLIFY_TOLERANCE_DEGREES = 0.00005; // about 5 m

const orsResponseSchema = z.object({
  features: z
    .array(
      z.object({
        properties: z.object({ summary: z.object({ distance: z.number(), duration: z.number() }) }),
        geometry: z.object({ coordinates: z.array(z.tuple([z.number(), z.number()])) }),
      }),
    )
    .min(1),
});

const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

function toLeg(from: Spot, to: Spot, response: unknown): Leg {
  const { properties, geometry } = orsResponseSchema.parse(response).features[0];
  const { distance, duration } = properties.summary;
  const simplified = simplify(
    { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: geometry.coordinates } },
    { tolerance: SIMPLIFY_TOLERANCE_DEGREES, highQuality: true },
  );
  return legSchema.parse({
    from: from.id,
    to: to.id,
    walkMinutes: Math.ceil(duration / 60),
    meters: Math.round(distance),
    geometry: {
      type: "LineString",
      coordinates: simplified.geometry.coordinates.map(([lng, lat]) => [round5(lng), round5(lat)]),
    },
  });
}

export async function buildLegs(input: {
  spots: Spot[];
  overrides: Record<string, { walkMinutes: number }>;
  fetchRoute: FetchRoute;
}): Promise<Leg[]> {
  const ids = new Set(input.spots.map((s) => s.id));
  for (const key of Object.keys(input.overrides)) {
    const [from, to] = key.split(">");
    if (!ids.has(from) || !ids.has(to)) {
      throw new Error(`Override "${key}" names an unknown spot id`);
    }
  }

  const legs: Leg[] = [];
  for (const from of input.spots) {
    for (const to of input.spots) {
      if (from.id === to.id) continue;
      const leg = toLeg(from, to, await input.fetchRoute(from, to));
      const override = input.overrides[`${from.id}>${to.id}`];
      legs.push(override ? { ...leg, walkMinutes: override.walkMinutes } : leg);
    }
  }
  return legs;
}
