"use client";

import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

const maxWidths = {
	xl: "max-w-xl",
	"2xl": "max-w-2xl",
	"3xl": "max-w-3xl",
	"4xl": "max-w-4xl",
	"5xl": "max-w-5xl",
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
		<div className="agri-mobile-safe min-h-screen agri-page-bg text-slate-950 dark:text-slate-100">
			<SiteHeader />
			{subheader ? (
				<div className="border-b border-slate-200/70 bg-white/55 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/55">
					<div className={`mx-auto w-full min-w-0 px-4 py-3 sm:px-6 ${mw}`}>{subheader}</div>
				</div>
			) : null}
			<main className={`mx-auto w-full min-w-0 px-4 pb-16 pt-8 sm:px-6 sm:pt-10 ${mw} ${mainClassName}`}>{children}</main>
		</div>
	);
}
