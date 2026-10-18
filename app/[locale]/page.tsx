import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";

export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("Home");

  return (
    <main className="p-6">
      <h1 className="text-2xl">{t("title")}</h1>
    </main>
  );
}
