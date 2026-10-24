const KEY = "open-spot";

// The open spot is UI state outside the URL (ADR 0001) but a Locale switch remounts the page, so
// the switch hands it over through sessionStorage. Storage can be blocked, so failures are silent.
export function stashOpenSpot(spotId: string | null, storage: Storage = sessionStorage): void {
  try {
    if (spotId) storage.setItem(KEY, spotId);
    else storage.removeItem(KEY);
  } catch {}
}

// Read once: the spot is cleared so a later reload starts with nothing open.
export function takeOpenSpot(storage: Storage = sessionStorage): string | null {
  try {
    const spotId = storage.getItem(KEY);
    storage.removeItem(KEY);
    return spotId;
  } catch {
    return null;
  }
}
