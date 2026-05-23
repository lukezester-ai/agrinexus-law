"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { FarmerCommandPanel } from "@/components/farmer-command-panel";
import { SitePageShell } from "@/components/site-page-shell";

export default function SrokovePage() {
	const [lang, setLang] = useState<"bg" | "en">("bg");

	return (
		<SitePageShell
			maxWidth="4xl"
			subheader={
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
						<CalendarClock size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
						AgriNexus.Law · {lang === "bg" ? "Срокове" : "Deadlines"}
					</p>
					<div className="flex flex-wrap items-center gap-2 sm:gap-3">
						<div className="flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
							<button
								type="button"
								onClick={() => setLang("bg")}
								className={`px-2.5 py-1 text-xs font-semibold ${
									lang === "bg"
										? "bg-emerald-600 text-white"
										: "bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-400"
								}`}
							>
								BG
							</button>
							<button
								type="button"
								onClick={() => setLang("en")}
								className={`px-2.5 py-1 text-xs font-semibold ${
									lang === "en"
										? "bg-emerald-600 text-white"
										: "bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-400"
								}`}
							>
								EN
							</button>
						</div>
						<Link href="/kalendar" className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300 sm:text-sm">
							Календар
						</Link>
						<Link href="/statistiki" className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300 sm:text-sm">
							Статистика
						</Link>
					</div>
				</div>
			}
		>
			<div className="surface-card p-4 sm:p-6">
				<FarmerCommandPanel lang={lang} />
			</div>
		</SitePageShell>
	);
}
