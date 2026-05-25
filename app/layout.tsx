import type { Metadata } from "next";
import { AnalyticsLoader } from "@/components/analytics-loader";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { PwaHelpButton } from "@/components/pwa-help-button";
import { PwaOnboarding } from "@/components/pwa-onboarding";
import { PwaRegister } from "@/components/pwa-register";
import { SiteVisitTracker } from "@/components/site-visit-tracker";
import { ThemeToggle } from "@/components/theme-toggle";
import { buildAgriNexusLawJsonLd } from "@/lib/seo/structured-data";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });
/** Латиница за Outfit; кирилица в заглавията идва от Inter като fallback (виж globals.css). */
const outfit = Outfit({ subsets: ["latin", "latin-ext"], variable: "--font-outfit", display: "swap" });

const themeInitScript = `(function(){try{var k='agrinexus-theme';var f='agrinexus-theme-user-set';var s=localStorage.getItem(k);var u=localStorage.getItem(f)==='1';if(u&&s==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){document.documentElement.classList.remove('dark');}})();`;

const siteUrl =
	process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.agrinexuslaw.com";
const metadataBase = (() => {
	try {
		return new URL(siteUrl);
	} catch {
		return new URL("https://www.agrinexuslaw.com");
	}
})();

export const metadata: Metadata = {
	metadataBase,
	manifest: "/manifest.webmanifest",
	title: {
		default: "AgriNexus.Law - AI за фермери, ДФЗ и ОСП в България",
		template: "%s · AgriNexus.Law",
	},
	description:
		"Професионална платформа за търсене в агро документи, срокове, субсидии и нормативни изисквания за българския земеделски сектор.",
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
	appleWebApp: {
		capable: true,
		title: "AgriNexus.Law",
		statusBarStyle: "default",
	},
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
		title: "AgriNexus.Law - правна и агро информация за български фермери",
		description:
			"Търсене в документи, AI обобщения, срокове, калкулатори и профил на стопанството.",
		locale: "bg_BG",
		type: "website",
		url: siteUrl,
	},
	twitter: {
		card: "summary_large_image",
		title: "AgriNexus.Law - AI за фермери и ДФЗ",
		description:
			"Субсидии, наредби, срокове и практики - на български, за български стопани.",
	},
	icons: {
		icon: [
			{ url: "/icon.svg", type: "image/svg+xml" },
			{ url: "/icon-192", sizes: "192x192", type: "image/png" },
			{ url: "/icon-512", sizes: "512x512", type: "image/png" },
		],
		shortcut: ["/icon.svg"],
		apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
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
			<body
				className={`${inter.variable} ${outfit.variable} agri-mobile-safe agri-body-surface min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-[#030712] dark:text-slate-100 font-sans`}
			>
				{children}
				<PwaRegister />
				<PwaHelpButton />
				<PwaOnboarding />
				<ThemeToggle />
				<CookieConsentBanner />
				<AnalyticsLoader />
				<SiteVisitTracker />
			</body>
		</html>
	);
}
