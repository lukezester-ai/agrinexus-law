"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { FarmerCommandPanel } from "@/components/farmer-command-panel";

export default function SrokovePage() {
	const [lang, setLang] = useState<"bg" | "en">("bg");

	return (
		<div className="min-h-screen agri-page-bg">
			<nav className="sticky top-0 z-20 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-teal-100/80 dark:border-stone-800">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
					<Link
						href="/"
						className="flex items-center gap-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 text-sm">
						<ArrowLeft size={16} aria-hidden />
						Начало
					</Link>
					<span className="font-medium text-stone-900 dark:text-stone-100 text-sm sm:text-base flex items-center gap-2">
						<CalendarClock size={18} className="text-[#0d9488] shrink-0" aria-hidden />
						{lang === "bg" ? "Срокове и документи" : "Deadlines & paperwork"}
					</span>
					<div className="flex items-center gap-2">
						<div className="flex rounded-lg border border-stone-200 dark:border-stone-600 overflow-hidden">
							<button
								type="button"
								onClick={() => setLang("bg")}
								className={`px-2.5 py-1 text-xs font-medium ${
									lang === "bg"
										? "bg-[#0d9488] text-white"
										: "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400"
								}`}>
								BG
							</button>
							<button
								type="button"
								onClick={() => setLang("en")}
								className={`px-2.5 py-1 text-xs font-medium ${
									lang === "en"
										? "bg-[#0d9488] text-white"
										: "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400"
								}`}>
								EN
							</button>
						</div>
						<Link href="/kalendar" className="text-xs sm:text-sm text-[#0d9488] dark:text-teal-400 font-medium">
							Календар
						</Link>
						<Link href="/statistiki" className="text-xs sm:text-sm text-[#0d9488] dark:text-teal-400 font-medium">
							Статистика
						</Link>
						<Link
							href="/moya-ferma"
							className="text-xs sm:text-sm text-[#0d9488] dark:text-teal-400 font-medium">
							Моя ферма
						</Link>
					</div>
				</div>
			</nav>

			<main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
				<FarmerCommandPanel lang={lang} />
			</main>
		</div>
	);
}
