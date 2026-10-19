import { nonFittingSpotIds, routeOrder, type RouteContent } from "./route";
import type { Selection } from "./schemas";

export type SpotBadge =
  | { kind: "start" }
  | { kind: "order"; number: number }
  | { kind: "doesntFit" };

export type SpotRow = {
  spotId: string;
  shootMinutes: number;
  badge: SpotBadge | null;
  // False only for unselected spots that would push the Route over the Time budget.
  fits: boolean;
};

export type SpotList = {
  // "Your route": the Start spot first, then the others in Route order.
  route: {
    rows: SpotRow[];
    // Walking time of the Leg between row i and row i + 1.
    legMinutes: number[];
    // Shooting plus walking, the same figure as the budget bar; null without a Start spot.
    totalMinutes: number | null;
  };
  // "More spots": the unselected spots, those that don't fit last.
  more: SpotRow[];
};

// Derived from the Selection, never stored (ADR 0001).
export function buildSpotList(selection: Selection, content: RouteContent): SpotList {
  const shootMinutes = new Map(content.spots.map((s) => [s.id, s.shootMinutes]));
  const minutesOf = (id: string) => {
    const minutes = shootMinutes.get(id);
    if (minutes === undefined) throw new Error(`Unknown spot ${id}`);
    return minutes;
  };

  const order = routeOrder(selection, content);
  const walk = new Map(content.legs.map((l) => [`${l.from}>${l.to}`, l.walkMinutes]));
  const legMinutes = order.slice(1).map((id, i) => walk.get(`${order[i]}>${id}`) ?? 0);

  const rows: SpotRow[] = order.map((spotId, i) => ({
    spotId,
    shootMinutes: minutesOf(spotId),
    badge: i === 0 ? { kind: "start" } : { kind: "order", number: i + 1 },
    fits: true,
  }));
  const totalMinutes = order.length
    ? rows.reduce((sum, r) => sum + r.shootMinutes, 0) + legMinutes.reduce((a, b) => a + b, 0)
    : null;

  const doesntFit = new Set(nonFittingSpotIds(selection, content));
  const taken = new Set(order);
  const unselected: SpotRow[] = content.spots
    .filter((s) => !taken.has(s.id))
    .map((s) => ({
      spotId: s.id,
      shootMinutes: s.shootMinutes,
      badge: doesntFit.has(s.id) ? { kind: "doesntFit" } : null,
      fits: !doesntFit.has(s.id),
    }));

  return {
    route: { rows, legMinutes, totalMinutes },
    more: [...unselected.filter((r) => r.fits), ...unselected.filter((r) => !r.fits)],
  };
}
