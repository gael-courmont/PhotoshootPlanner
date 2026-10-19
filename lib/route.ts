import type { Leg, Package, Selection, Spot } from "./schemas";

export type RouteContent = { spots: Spot[]; packages: Package[]; legs: Leg[] };

export type BudgetStatus = "green" | "amber" | "red";

export type TimeBudget = {
  order: string[];
  shootingMinutes: number;
  walkingMinutes: number;
  totalMinutes: number;
  packageMinutes: number;
  ratio: number;
  status: BudgetStatus;
};

const AMBER_FROM = 0.9;
const RED_ABOVE = 1;

function* permutations<T>(items: T[]): Generator<T[]> {
  if (items.length <= 1) {
    yield items;
    return;
  }
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const tail of permutations(rest)) yield [items[i], ...tail];
  }
}

function legMinutes(legs: Leg[]) {
  const byPair = new Map(legs.map((l) => [`${l.from}>${l.to}`, l.walkMinutes]));
  return (from: string, to: string) => {
    const minutes = byPair.get(`${from}>${to}`);
    if (minutes === undefined) throw new Error(`Missing leg ${from} to ${to}`);
    return minutes;
  };
}

// Brute force: the start spot first, then the permutation of the others with the least
// walking. Permutations come out in insertion order, so a strict `<` keeps the earliest on ties.
function bestOrder(start: string, others: string[], walk: (from: string, to: string) => number) {
  let best = [start, ...others];
  let bestMinutes = Infinity;
  for (const perm of permutations(others)) {
    const order = [start, ...perm];
    let minutes = 0;
    for (let i = 1; i < order.length; i++) minutes += walk(order[i - 1], order[i]);
    if (minutes < bestMinutes) {
      best = order;
      bestMinutes = minutes;
    }
  }
  return { order: best, walkingMinutes: bestMinutes === Infinity ? 0 : bestMinutes };
}

// Derived, never stored (ADR 0001). Empty without a start spot.
export function routeOrder(selection: Selection, content: Pick<RouteContent, "legs">): string[] {
  if (!selection.startSpotId) return [];
  return bestOrder(selection.startSpotId, selection.spotIds, legMinutes(content.legs)).order;
}

function budgetFor(
  startSpotId: string | null,
  otherIds: string[],
  packageMinutes: number,
  { spots, legs }: RouteContent,
): TimeBudget {
  const { order, walkingMinutes } = startSpotId
    ? bestOrder(startSpotId, otherIds, legMinutes(legs))
    : { order: [], walkingMinutes: 0 };
  const shootMinutes = new Map(spots.map((s) => [s.id, s.shootMinutes]));
  const shootingMinutes = order.reduce((sum, id) => {
    const minutes = shootMinutes.get(id);
    if (minutes === undefined) throw new Error(`Unknown spot ${id}`);
    return sum + minutes;
  }, 0);
  const totalMinutes = shootingMinutes + walkingMinutes;
  const ratio = totalMinutes / packageMinutes;
  const status = ratio > RED_ABOVE ? "red" : ratio >= AMBER_FROM ? "amber" : "green";
  return { order, shootingMinutes, walkingMinutes, totalMinutes, packageMinutes, ratio, status };
}

const packageMinutesOf = (selection: Selection, packages: Package[]) =>
  packages.find((p) => p.id === selection.packageId)?.minutes;

// Null without a package. Without a start spot the route is empty and the totals are zero.
export function timeBudget(selection: Selection, content: RouteContent): TimeBudget | null {
  const packageMinutes = packageMinutesOf(selection, content.packages);
  if (packageMinutes === undefined) return null;
  if (!selection.startSpotId) return budgetFor(null, [], packageMinutes, content);
  return budgetFor(selection.startSpotId, selection.spotIds, packageMinutes, content);
}

// Unselected spots that would push the best-ordered route over 100% if added.
export function nonFittingSpotIds(selection: Selection, content: RouteContent): string[] {
  const packageMinutes = packageMinutesOf(selection, content.packages);
  const { startSpotId } = selection;
  if (packageMinutes === undefined || !startSpotId) return [];
  const taken = new Set([startSpotId, ...selection.spotIds]);
  return content.spots
    .filter((s) => !taken.has(s.id))
    .filter(
      (s) =>
        budgetFor(startSpotId, [...selection.spotIds, s.id], packageMinutes, content).ratio >
        RED_ABOVE,
    )
    .map((s) => s.id);
}

// 120 -> "2h", 112 -> "1h52", 45 -> "45min".
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}min`;
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, "0")}`;
}
