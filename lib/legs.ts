import simplify from "@turf/simplify";
import { z } from "zod";
import { legSchema, type Leg, type Spot } from "./schemas";

// Returns the raw OpenRouteService foot-walking GeoJSON response for one directed pair.
export type FetchRoute = (from: Spot, to: Spot) => Promise<unknown>;

export class RoutingHttpError extends Error {
  constructor(readonly status: number) {
    super(`Routing service responded ${status}`);
  }
}

const MAX_RETRIES = 3;
const BACKOFF_MS = 1000;

const isRetryable = (e: unknown) =>
  e instanceof RoutingHttpError && (e.status === 429 || e.status >= 500);

const realSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(fetchRoute: FetchRoute, from: Spot, to: Spot, sleep: (ms: number) => Promise<void>) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetchRoute(from, to);
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      if (!isRetryable(e) || attempt === MAX_RETRIES) {
        throw new Error(`Routing failed for ${from.id} to ${to.id}: ${reason}`, { cause: e });
      }
      await sleep(BACKOFF_MS * 2 ** attempt);
    }
  }
}

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
  sleep?: (ms: number) => Promise<void>;
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
      const leg = toLeg(from, to, await fetchWithRetry(input.fetchRoute, from, to, input.sleep ?? realSleep));
      const override = input.overrides[`${from.id}>${to.id}`];
      legs.push(override ? { ...leg, walkMinutes: override.walkMinutes } : leg);
    }
  }
  return legs;
}
