import type { Metadata } from "next";
import { AnalyticsLoader } from "@/components/analytics-loader";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { buildAgriNexusLawJsonLd } from "@/lib/seo/structured-data";
import "./globals.css";

const themeInitScript = `(function(){try{var k='agrinexus-theme';var s=localStorage.getItem(k);if(s==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://agrinexus.bg";
const metadataBase = (() => {
  try {
    return new URL(siteUrl);
  } catch {
    return new URL("https://agrinexus.bg");
  }
})();

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "AgriNexus.Law — AI за фермери, ДФЗ и ОСП (България)",
    template: "%s · AgriNexus.Law",
  },
  description:
    "Елена (право/ДФЗ), Борис (поле и култури), Виктория (сметки и субсидии). Търсачка по схеми, чат и профил на стопанството за българския аграрен сектор.",
  keywords: [
    "ДФЗ",
    "субсидии",
    "ОСП",
    "БИСС",
    "екосхеми",
    "земеделие България",
    "фермер",
    "ИСАК",
    "директни плащания",
    "биологично земеделие",
    "ПРСР",
  ],
  applicationName: "AgriNexus.Law",
  authors: [{ name: "AgriNexus.Law" }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "/",
    languages: { bg: "/" },
  },
  openGraph: {
    siteName: "AgriNexus.Law",
    title: "AgriNexus.Law — AI асистенти за български фермери",
    description:
      "Търсене в база ДФЗ/ОСП, чат с трима специалисти и профил на стопанството.",
    locale: "bg_BG",
    type: "website",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "AgriNexus.Law — AI за фермери и ДФЗ",
    description:
      "Субсидии, наредби, срокове и практики — на български, за български стопани.",
  },
};

const jsonLdGraph = buildAgriNexusLawJsonLd(siteUrl);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bg" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdGraph }}
        />
      </head>
      <body className="antialiased min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
        {children}
        <ThemeToggle />
        <CookieConsentBanner />
        <AnalyticsLoader />
      </body>
    </html>
  );
}
