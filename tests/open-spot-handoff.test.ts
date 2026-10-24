import { describe, expect, it } from "vitest";
import { stashOpenSpot, takeOpenSpot } from "@/lib/open-spot-handoff";

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  } as Storage;
}

describe("open spot handoff", () => {
  it("returns the stashed spot once, then nothing", () => {
    const storage = memoryStorage();
    stashOpenSpot("trocadero", storage);
    expect(takeOpenSpot(storage)).toBe("trocadero");
    expect(takeOpenSpot(storage)).toBeNull();
  });

  it("stashing null clears a stale spot", () => {
    const storage = memoryStorage();
    stashOpenSpot("trocadero", storage);
    stashOpenSpot(null, storage);
    expect(takeOpenSpot(storage)).toBeNull();
  });

  it("does not throw when storage is unavailable", () => {
    const broken = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    } as unknown as Storage;
    expect(() => stashOpenSpot("a", broken)).not.toThrow();
    expect(takeOpenSpot(broken)).toBeNull();
  });
});
