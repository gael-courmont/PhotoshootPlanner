"use client";

import { useLocale, useTranslations } from "next-intl";
import { spots } from "@/lib/content";
import { useState } from "react";
import { Drawer } from "vaul";
import { PEEK_PX, SIDEBAR_PX, SIDEBAR_QUERY } from "@/lib/sheet-layout";
import { SheetPeek } from "./SheetPeek";
import { useOpenSpot } from "./OpenSpot";
import { SpotDetail } from "./SpotDetail";
import { SpotList } from "./SpotList";
import { useMediaQuery } from "./useMediaQuery";

const SNAP_POINTS = [`${PEEK_PX}px`, 0.5];

// Bottom sheet on mobile (peek and half), fixed left sidebar from `md`.
export function Sheet() {
  const t = useTranslations("Sheet");
  const locale = useLocale() as "en" | "fr";
  const { openSpotId, close } = useOpenSpot();
  const openSpot = spots.find((sp) => sp.id === openSpotId);
  const isSidebar = useMediaQuery(SIDEBAR_QUERY);
  const [snap, setSnap] = useState<number | string | null>(SNAP_POINTS[0]);

  if (isSidebar) {
    return (
      <aside
        aria-label={t("title")}
        style={{ width: SIDEBAR_PX }}
        className="fixed inset-y-0 left-0 flex flex-col gap-3 overflow-y-auto bg-paper pt-4 shadow-lg"
      >
        <SheetPeek />
        {openSpotId ? (
          <div>
            <button type="button" onClick={close} className="min-h-11 px-4 text-sm underline">
              {t("back")}
            </button>
            <SpotDetail spotId={openSpotId} />
          </div>
        ) : (
          <SpotList />
        )}
      </aside>
    );
  }

  return (
    <>
      <Drawer.Root
        open
        modal={false}
        dismissible={false}
        handleOnly
        snapPoints={SNAP_POINTS}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
      >
        <Drawer.Portal>
          <Drawer.Content className="fixed inset-x-0 bottom-0 flex h-full max-h-[97%] flex-col rounded-t-2xl bg-paper shadow-lg outline-none">
            <Drawer.Title className="sr-only">{t("title")}</Drawer.Title>
            <Drawer.Description className="sr-only">{t("description")}</Drawer.Description>
            <Drawer.Handle aria-label={t("handle")} className="!my-0 !h-11 !w-full !bg-transparent after:!top-4 after:!h-1.5 after:!w-12 after:!rounded-full after:!bg-muted" />
            <SheetPeek />
            <div className="min-h-0 flex-1 overflow-y-auto pb-[50dvh]">
              <SpotList />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
      <Drawer.Root open={!!openSpotId} handleOnly onOpenChange={(open) => !open && close()}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-ink/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 flex max-h-[92%] flex-col rounded-t-2xl bg-paper outline-none">
            <Drawer.Title className="sr-only">{openSpot ? openSpot.name[locale] : ""}</Drawer.Title>
            <Drawer.Description className="sr-only">{t("detailDescription")}</Drawer.Description>
            <Drawer.Handle aria-label={t("closeDetail")} className="!my-0 !h-6 !w-full !bg-transparent after:!top-2 after:!h-1.5 after:!w-12 after:!rounded-full after:!bg-muted" />
            <div className="min-h-0 flex-1 overflow-y-auto">{openSpotId && <SpotDetail spotId={openSpotId} />}</div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
