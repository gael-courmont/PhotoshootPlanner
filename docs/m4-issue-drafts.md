# M4 issue drafts

Not yet filed: `gh` was not installed when these were written. File the parent first, then each child as a sub-issue (see `docs/agents/issue-tracker.md`), add the blockers, and apply the label shown. Numbers below are draft ids (D1..D11); `→` means "blocked by".

## Parent: M4 — Polish

Tracks the M4 build plan in `docs/paris-photowalk-customizer-spec.md`. Label: `needs-triage` is not needed, children carry their own labels.

**Done when:** the photographer approves the look, and the map is interactive in under 3 s on a mid-range phone.

Children: D1 to D11.

---

## D1 — Deploy the app to a host  `ready-for-human`

The host is the photographer's decision. Vercel Hobby is non-commercial only, so a business site needs Vercel Pro or another host (Netlify, Cloudflare).

- [ ] Choose a host and connect the repo.
- [ ] Set `NEXT_PUBLIC_MAPTILER_KEY` in the host's environment.
- [ ] Every push to `main` deploys, and pull requests get preview URLs.

**Done when:** a public URL shows the tilted map with the 3 spots, and `/en/spots/trocadero` loads.

## D2 — Design tokens and fonts  `ready-for-agent`

Palette "Paris dusk" as CSS variables and Tailwind theme tokens in `app/[locale]/globals.css`:

| Token | Hex |
| --- | --- |
| cream | `#F4EDE0` |
| paper | `#FBF8F2` |
| stone | `#E6DCC8` |
| sage | `#CBD3B6` |
| seine | `#6F8FA3` |
| ink | `#1E2A33` |
| ink-soft | `#5A6670` |
| gold | `#C19A3E` (non-text only) |
| gold-deep | `#8A6A1F` (gold as text) |
| green / amber / red | `#5E8C61` / `#D9922B` / `#B5483C` |
| muted | `#A39D90` |

- [ ] Cormorant Garamond for titles and Inter for UI, loaded with `next/font`.
- [ ] Sheet, sidebar, budget bar (green/amber/red), spot list, spot detail, buttons and lightbox restyled onto the tokens.
- [ ] Text contrast at least 4.5:1 (gold as text uses `gold-deep`).

**Done when:** the whole UI uses tokens and no hardcoded colours remain outside `lib/map-config.ts`.

## D3 — Build the custom map style in MapTiler  `ready-for-human`  → D2

- [ ] Create the style in the MapTiler editor from the palette in D2: cream ground, stone buildings, sage parks, Seine-blue water, white roads with a thin casing.
- [ ] Keep labels only for landmarks, the Seine and a few major streets; remove POI icons, transit and minor road names.
- [ ] Keep a `building` layer with `render_height` so the 3D extrusions still work.
- [ ] Note the style ID in this issue.

**Done when:** the style ID is recorded and the style looks right in the MapTiler preview.

## D4 — Wire the custom style and move map colours onto the tokens  `ready-for-agent`  → D2, D3

- [ ] Replace `MAP_STYLE_ID` in `lib/map-config.ts` with the custom style ID (env or config), and update `tests/map-config.test.ts`.
- [ ] Route line gold, about 4 px wide with a 1.5 px cream casing; leg labels ink on a cream halo.
- [ ] Building extrusion colour from the tokens; markers use the gold ring, muted greyed state and start flag from the tokens.
- [ ] Font stack for labels exists in the custom style.

**Done when:** on the deployed or local map the style, route, labels and markers all use the brand palette.

## D5 — Language toggle  `ready-for-agent`

`[locale]` routes and FR/EN strings already exist. Missing is the way to switch.

- [ ] A toggle on the map (top right, outside the sheet) that switches between `/en` and `/fr`.
- [ ] Switching keeps the Selection (package, start, spots) and the open spot. Verify against ADR 0001: the URL is a one-way mirror, so carry the query or confirm the store survives the navigation, and cover it with a test or recorded manual check.
- [ ] `<html lang>` and page metadata follow the Locale.
- [ ] Browser-language detection stays on.
- [ ] Toggle is keyboard reachable with a 44 px target and an accessible label.

**Done when:** on `/en` with a package and 2 spots chosen, switching to FR shows the French UI with the same Selection.

## D6 — Motion: fly-to and route reveal  `ready-for-agent`

- [ ] Tapping a marker or a list row flies the camera to the spot in about 500 ms, centred on the visible map area (existing padding).
- [ ] The route reveal animates only legs that were not in the previous route, as a line-progress reveal under 600 ms.
- [ ] No animation on first load, on a restored share link, or on reset: the route just appears.
- [ ] With `prefers-reduced-motion`, no camera animation and no reveal.
- [ ] Pure logic (which legs are new) lives in `lib/` with Vitest tests.

**Done when:** adding a spot animates only its new leg, and with reduced motion on nothing animates.

## D7 — Spot pages  `ready-for-agent`

`app/[locale]/spots/[id]/page.tsx` is a title-only stub.

- [ ] Content: name, description, shooting time, photo grid that opens the existing lightbox.
- [ ] Metadata: title, description, Open Graph image from the spot's first photo, canonical URL.
- [ ] `hreflang` alternates for both Locales, and a sitemap that lists every spot page in both Locales.
- [ ] A button to `/{locale}?start=<id>` that opens the customizer with that spot as the start.
- [ ] Works with placeholder photos. No JSON-LD and no nearby spots in this issue.

**Done when:** every spot has an indexable page in EN and FR, and the button lands on the map with that spot as the start.

## D8 — Analytics  `ready-for-agent`  → D1

- [ ] Typed `track()` helper in `lib/` that is a no-op when the Plausible env var is unset.
- [ ] Plausible script loaded without cookies.
- [ ] Wire package picked (minutes), start set (spot id) and spot added (spot id). No personal data.
- [ ] Summary copied and Continue clicked are added in M5.

**Done when:** the three events show in the Plausible dashboard from the deployed site.

## D9 — Performance pass  `ready-for-agent`  → D1, D4, D7

Measure first, then fix.

- [ ] Mobile Lighthouse on the deployed home page and a spot page: Performance at least 90.
- [ ] `next build` bundle sizes: initial JS under 250 KB gzipped excluding MapLibre; MapLibre confirmed lazy-loaded.
- [ ] Thumbnails under 30 KB; full-size photos load only when the carousel opens.
- [ ] Cheap fixes in this PR; the rest filed as follow-up issues.

**Done when:** the measurements are recorded in the PR and the targets hold or have follow-ups.

## D10 — Accessibility pass  `ready-for-agent`  → D2, D5, D7

- [ ] Mobile Lighthouse Accessibility at least 95.
- [ ] Touch targets at least 44 px (markers, toggle, list rows, buttons).
- [ ] Real alt text on photos (placeholders currently carry provisional alts).
- [ ] Keyboard walkthrough on desktop: reach every spot from the list, open and close the detail, operate the sheet and lightbox.
- [ ] Cheap fixes in this PR; the rest filed as follow-ups.

**Done when:** findings are recorded in the PR and the targets hold or have follow-ups.

## D11 — Photographer sign-off  `ready-for-human`  → D4, D6, D9, D10

- [ ] Photographer reviews the preview deploy on a real mid-range phone over 4G.
- [ ] The map is interactive in under 3 s.
- [ ] Photographer approves the look, or lists changes.

**Done when:** the photographer has approved the look.
