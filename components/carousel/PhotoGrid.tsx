"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import type { Spot } from "@/lib/schemas";
import { Lightbox } from "./Lightbox";

// The Spot page's photos as a grid; each opens the full-screen lightbox. The first is eager.
export function PhotoGrid({ photos }: { photos: Spot["photos"] }) {
  const t = useTranslations("Spot");
  const locale = useLocale() as "en" | "fr";
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {photos.map((photo, i) => (
          <li key={photo.src} className="aspect-3/2 overflow-hidden rounded-lg bg-stone">
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
                sizes="(min-width: 768px) 33vw, 50vw"
                priority={i === 0}
                placeholder={photo.blurDataURL ? "blur" : "empty"}
                blurDataURL={photo.blurDataURL}
                className="size-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox photos={photos} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
    </>
  );
}
