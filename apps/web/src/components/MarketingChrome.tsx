"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { SiteNav } from "@/components/site-nav";
import { Footer } from "@/components/Footer";
import { isPublicPath } from "@/components/public/public-site";

/** Marketing shell (nav + footer). Skipped on dashboard, finance, and the public control room. */
export function MarketingChrome({ children }: { children: ReactNode }) {
	const pathname = usePathname() ?? "";
	const isDashboard = pathname.includes("/dashboard");
	const isRadarSmoke = pathname.includes("/dev/radar-smoke");
	const isFinance = pathname === "/finance" || pathname.startsWith("/finance/");
	// Login and privacy stay in this shell; their pages were not part of the homepage port.
	const isControlRoom =
		isPublicPath(pathname) && !pathname.startsWith("/login") && !pathname.startsWith("/privacy");

	if (isDashboard || isRadarSmoke || isFinance || isControlRoom) {
		return <div className="flex min-h-screen flex-1 flex-col">{children}</div>;
	}

	return (
		<div className="relative z-[2] flex min-h-screen flex-col">
			<SiteNav />
			<div className="h-[5.75rem] shrink-0 md:h-24" aria-hidden />
			<div className="flex-1">{children}</div>
			<Footer />
		</div>
	);
}
