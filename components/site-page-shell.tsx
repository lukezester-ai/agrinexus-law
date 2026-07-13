"use client";

import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

const maxWidths = {
	xl: "max-w-xl",
	"2xl": "max-w-2xl",
	"3xl": "max-w-3xl",
	"4xl": "max-w-4xl",
	"5xl": "max-w-5xl",
	"6xl": "max-w-6xl",
	"7xl": "max-w-7xl",
} as const;

export type SiteMaxWidth = keyof typeof maxWidths;

type Props = {
	children: ReactNode;
	/** Максимална ширина на съдържанието под header-а */
	maxWidth?: SiteMaxWidth;
	/** Тесен ред под глобалния header (език, локални връзки, контекст на страницата) */
	subheader?: ReactNode;
	mainClassName?: string;
};

/**
 * Обща обвивка: фон + навигация + опционален subheader + main.
 * Ползвай на всички публични страници за единен графичен дизайн.
 */
export function SitePageShell({ children, maxWidth = "7xl", subheader, mainClassName = "" }: Props) {
	const mw = maxWidths[maxWidth];
	return (
		<div className="relative agri-mobile-safe agri-floating-header-pad min-h-screen agri-page-bg text-slate-950 dark:text-slate-100 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/90 dark:from-[#030712] dark:via-[#0b0f19] dark:to-[#030712]">
			{/* Ambient Fuchsia & Emerald Glow Blobs for Interior Pages */}
			<div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
				<div className="animate-emerald-glow absolute top-[8%] left-[5%] w-[450px] h-[450px] rounded-full bg-emerald-400/15 dark:bg-emerald-500/10 blur-[120px]" />
				<div className="animate-fuchsia-glow absolute top-[20%] right-[8%] w-[480px] h-[480px] rounded-full bg-fuchsia-400/15 dark:bg-fuchsia-500/10 blur-[130px]" />
				<div className="absolute bottom-[15%] left-[25%] w-[400px] h-[400px] rounded-full bg-cyan-400/12 dark:bg-cyan-500/10 blur-[110px] animate-float" />
				{/* Subtle grid pattern overlay */}
				<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_85%_75%_at_50%_35%,black_50%,transparent_100%)]" />
			</div>

			<div className="relative z-10 flex flex-col min-h-screen">
				<SiteHeader />
				{subheader ? (
					<div className="border-b border-slate-200/70 bg-white/65 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/65">
						<div className={`mx-auto w-full min-w-0 px-4 py-3 sm:px-6 ${mw}`}>{subheader}</div>
					</div>
				) : null}
				<main className={`mx-auto w-full min-w-0 px-4 pb-20 pt-8 sm:px-6 sm:pt-10 flex-1 ${mw} ${mainClassName}`}>{children}</main>
			</div>
		</div>
	);
}
