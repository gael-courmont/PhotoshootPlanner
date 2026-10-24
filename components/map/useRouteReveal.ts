"use client";

import { useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "@/components/sheet/useMediaQuery";
import { legs } from "@/lib/content";
import { REDUCED_MOTION_QUERY, REVEAL_MS } from "@/lib/map-config";
import { legsToReveal, revealRoute } from "@/lib/route-reveal";

// The route GeoJSON to draw: whole, except that legs the previous route lacked draw in over
// REVEAL_MS. The first route (load, restored link, reset) and reduced motion skip the animation.
export function useRouteReveal(route: string[]) {
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const [state, setState] = useState({ route, prev: route, progress: 1 });

  // Adjusting state while rendering, so the new legs never flash in fully drawn.
  if (state.route !== route) {
    const animates = !reducedMotion && legsToReveal(state.route, route).size > 0;
    setState({ route, prev: state.route, progress: animates ? 0 : 1 });
  }

  const animating = state.progress < 1;
  useEffect(() => {
    if (!animating) return;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const progress = Math.min((now - start) / REVEAL_MS, 1);
      setState((s) => ({ ...s, progress }));
      if (progress < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [animating, state.route]);

  return useMemo(
    () => revealRoute(state.route, legs, legsToReveal(state.prev, state.route), state.progress),
    [state],
  );
}
