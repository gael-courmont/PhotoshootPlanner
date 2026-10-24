import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SelectionProvider } from "@/components/selection/SelectionProvider";
import { packages, spots } from "@/lib/content";
import { routing } from "@/i18n/routing";
import "./globals.css";

// Self-hosted (latin subset): the build needs no network access to Google Fonts.
const inter = localFont({
  src: "../fonts/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
});
const cormorant = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-latin-500-normal.woff2", weight: "500" },
    { path: "../fonts/cormorant-garamond-latin-600-normal.woff2", weight: "600" },
  ],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Paris Photowalk Customizer",
  description: "Pick a package, choose your spots, see your route.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const known = {
    packageIds: packages.map((p) => p.id),
    spotIds: spots.map((s) => s.id),
  };

  return (
    <html lang={locale} className={`${inter.variable} ${cormorant.variable}`}>
      <body>
        <NextIntlClientProvider>
          <NuqsAdapter>
            <SelectionProvider known={known}>{children}</SelectionProvider>
          </NuqsAdapter>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
