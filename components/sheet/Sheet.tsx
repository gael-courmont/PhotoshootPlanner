"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Drawer } from "vaul";
import { PEEK_PX, SIDEBAR_PX, SIDEBAR_QUERY } from "@/lib/sheet-layout";
import { SheetPeek } from "./SheetPeek";
import { useMediaQuery } from "./useMediaQuery";

const SNAP_POINTS = [`${PEEK_PX}px`, 0.5];

// Bottom sheet on mobile (peek and half), fixed left sidebar from `md`.
export function Sheet() {
  const t = useTranslations("Sheet");
  const isSidebar = useMediaQuery(SIDEBAR_QUERY);
  const [snap, setSnap] = useState<number | string | null>(SNAP_POINTS[0]);

  if (isSidebar) {
    return (
      <aside
        aria-label={t("title")}
        style={{ width: SIDEBAR_PX }}
        className="fixed inset-y-0 left-0 flex flex-col gap-3 overflow-y-auto bg-white pt-4 shadow-lg"
      >
        <SheetPeek />
        <SheetBody />
      </aside>
    );
  }

  return (
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
        <Drawer.Content className="fixed inset-x-0 bottom-0 flex h-full max-h-[97%] flex-col rounded-t-2xl bg-white shadow-lg outline-none">
          <Drawer.Title className="sr-only">{t("title")}</Drawer.Title>
          <Drawer.Description className="sr-only">{t("description")}</Drawer.Description>
          <Drawer.Handle aria-label={t("handle")} className="!my-0 !h-11 !w-full !bg-transparent after:!top-4 after:!h-1.5 after:!w-12 after:!rounded-full after:!bg-gray-300" />
          <SheetPeek />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SheetBody />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// Placeholder until the spot list lands.
function SheetBody() {
  return null;
}
