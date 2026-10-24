"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useRef } from "react";
import { Drawer } from "vaul";
import type { Spot } from "@/lib/schemas";

const SWIPE_DOWN_PX = 80;

// Full-screen photos. Mounted only while open, so the larger images are not requested before.
// Vaul supplies the dialog behaviour (focus trap, Escape, labelling); swipe-down is handled here
// because Vaul's own drag would fight the horizontal swipe between photos.
export function Lightbox({
  photos,
  startIndex,
  onClose,
}: {
  photos: Spot["photos"];
  startIndex: number | null;
  onClose: () => void;
}) {
  const t = useTranslations("Spot");
  const locale = useLocale() as "en" | "fr";
  const [viewportRef] = useEmblaCarousel({ startIndex: startIndex ?? 0 });
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  return (
    <Drawer.Root open={startIndex !== null} onOpenChange={(open) => !open && onClose()} handleOnly>
      <Drawer.Portal>
        <Drawer.Content
          className="fixed inset-0 z-50 flex flex-col bg-ink outline-none"
          onTouchStart={(e) => {
            const touch = e.touches[0];
            touchStart.current = { x: touch.clientX, y: touch.clientY };
          }}
          onTouchEnd={(e) => {
            const start = touchStart.current;
            touchStart.current = null;
            if (!start) return;
            const touch = e.changedTouches[0];
            const dy = touch.clientY - start.y;
            if (dy > SWIPE_DOWN_PX && dy > Math.abs(touch.clientX - start.x)) onClose();
          }}
        >
          <Drawer.Title className="sr-only">{t("photos")}</Drawer.Title>
          <Drawer.Description className="sr-only">{t("lightboxDescription")}</Drawer.Description>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closePhotos")}
            className="absolute top-3 right-3 z-10 flex size-11 items-center justify-center rounded-full bg-paper/20 text-xl text-paper"
          >
            ✕
          </button>
          <div ref={viewportRef} className="min-h-0 flex-1 overflow-hidden">
            <div className="flex h-full">
              {photos.map((photo, i) => (
                <div
                  key={photo.src}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={t("photoOf", { current: i + 1, total: photos.length })}
                  className="relative h-full min-w-0 flex-[0_0_100%]"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt[locale]}
                    fill
                    sizes="100vw"
                    placeholder={photo.blurDataURL ? "blur" : "empty"}
                    blurDataURL={photo.blurDataURL}
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
