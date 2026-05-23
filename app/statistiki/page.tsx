"use client";

import Link from "next/link";
import { CropStatisticsView } from "@/components/crop-statistics-view";
import { SitePageShell } from "@/components/site-page-shell";

export default function StatistikiPage() {
	return (
		<SitePageShell
			maxWidth="4xl"
			subheader={
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Статистика по основни култури</p>
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold sm:text-sm">
						<Link href="/kalendar" className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100">
							Календар
						</Link>
						<Link href="/srokove" className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100">
							Срокове
						</Link>
						<Link href="/kalkulator" className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100">
							Калкулатор
						</Link>
					</div>
				</div>
			}
		>
			<div className="surface-card overflow-hidden p-4 sm:p-6">
				<CropStatisticsView />
			</div>
		</SitePageShell>
	);
}
