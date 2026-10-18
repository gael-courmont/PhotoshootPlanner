// Precomputes walking legs between every ordered pair of spots (see spec, "Walk-time precompute pipeline").
// Reads content/spots.json, calls OpenRouteService, merges content/legs.overrides.json, writes content/legs.json.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { buildLegs, hashSpots, RoutingHttpError, shouldRebuild } from "../lib/legs";
import { spotSchema, type Spot } from "../lib/schemas";

const ORS_URL = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson";
const contentDir = path.join(__dirname, "..", "content");
const file = (name: string) => path.join(contentDir, name);
const readJson = (name: string) => JSON.parse(readFileSync(file(name), "utf8"));

function loadEnvKey(): string | undefined {
  if (process.env.ORS_API_KEY) return process.env.ORS_API_KEY;
  const envPath = path.join(__dirname, "..", ".env");
  if (!existsSync(envPath)) return undefined;
  const line = readFileSync(envPath, "utf8")
    .split("\n")
    .find((l) => l.startsWith("ORS_API_KEY="));
  return line?.slice("ORS_API_KEY=".length).trim() || undefined;
}

async function main() {
  const force = process.argv.includes("--force");
  const spots = z.array(spotSchema).parse(readJson("spots.json"));
  const overrides = z
    .record(z.string(), z.object({ walkMinutes: z.number().nonnegative() }))
    .parse(readJson("legs.overrides.json"));

  const storedHash = existsSync(file("legs.hash")) ? readFileSync(file("legs.hash"), "utf8").trim() : null;
  if (!shouldRebuild({ spots, storedHash, force })) {
    console.log("Spots unchanged since the last run; skipping. Use --force to recompute.");
    return;
  }

  const apiKey = loadEnvKey();
  if (!apiKey) {
    console.error("ORS_API_KEY is missing. Set it in .env (see .env.example).");
    process.exit(1);
  }

  const fetchRoute = async (from: Spot, to: Spot) => {
    const res = await fetch(ORS_URL, {
      method: "POST",
      headers: { Authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates: [from.coords, to.coords] }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new RoutingHttpError(res.status);
    return res.json();
  };

  const legs = await buildLegs({ spots, overrides, fetchRoute });

  // Written only after every pair succeeded, so a partial file can never be committed.
  writeFileSync(file("legs.json"), JSON.stringify(legs, null, 2) + "\n");
  writeFileSync(file("legs.hash"), hashSpots(spots) + "\n");
  console.log(`Wrote ${legs.length} legs.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
