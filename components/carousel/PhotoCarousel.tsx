"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Spot } from "@/lib/schemas";
import { Lightbox } from "./Lightbox";

export const CAROUSEL_SIZES = "(min-width: 768px) 400px, 100vw";

// Swipeable photos with a counter and dots. The first photo is eager; each other photo is
// only rendered once the Client has swiped to the one before it.
export function PhotoCarousel({ photos }: { photos: Spot["photos"] }) {
  const t = useTranslations("Spot");
  const locale = useLocale() as "en" | "fr";
  const [viewportRef, api] = useEmblaCarousel();
  const [index, setIndex] = useState(0);
  const [reached, setReached] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      const i = api.selectedScrollSnap();
      setIndex(i);
      setReached((r) => Math.max(r, i));
    };
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <div role="group" aria-roledescription="carousel" aria-label={t("photos")} className="relative">
      <div ref={viewportRef} className="overflow-hidden">
        <div className="flex">
          {photos.map((photo, i) => (
            <div
              key={photo.src}
              role="group"
              aria-roledescription="slide"
              aria-label={t("photoOf", { current: i + 1, total: photos.length })}
              className="aspect-3/2 min-w-0 flex-[0_0_100%] bg-stone"
            >
              {i <= reached + 1 && (
                <button
                  type="button"
                  aria-label={t("openPhoto", { number: i + 1 })}
                  onClick={() => setLightboxIndex(i)}
                  className="block size-full"
                >
                <Image
                  src={photo.src}
                  alt={photo.alt[locale]}
                  width={photo.w}
                  height={photo.h}
                  sizes={CAROUSEL_SIZES}
                  priority={i === 0}
                  placeholder={photo.blurDataURL ? "blur" : "empty"}
                  blurDataURL={photo.blurDataURL}
                  className="size-full object-cover"
                />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <span
        aria-live="polite"
        className="absolute top-3 right-3 rounded-full bg-ink/60 px-2 py-0.5 text-xs text-paper"
      >
        {index + 1} / {photos.length}
      </span>
      <div className="absolute inset-x-0 bottom-2 flex justify-center">
        {photos.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            aria-label={t("goToPhoto", { number: i + 1 })}
            aria-current={i === index}
            onClick={() => api?.scrollTo(i)}
            className="flex size-6 items-center justify-center"
          >
            <span className={`size-2 rounded-full ${i === index ? "bg-paper" : "bg-paper/50"}`} />
          </button>
        ))}
      </div>
      <Lightbox photos={photos} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
    </div>
  );
}
