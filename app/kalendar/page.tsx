"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import {
	CROP_LABELS,
	CROP_ORDER,
	DFZ_FIXED_DEADLINES,
	MONTH_NAMES_BG,
	SEASON_TASKS_BY_CROP,
	type CropCalendarKey,
} from "@/lib/season-calendar-data";

export default function KalendarPage() {
	const [crop, setCrop] = useState<CropCalendarKey>("wheat_barley");

	const tasksByMonth = useMemo(() => SEASON_TASKS_BY_CROP[crop], [crop]);

	return (
		<div className="min-h-screen agri-page-bg">
			<nav className="sticky top-0 z-20 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-teal-100/80 dark:border-stone-800">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-y-2 gap-x-3">
					<Link
						href="/"
						className="flex items-center gap-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 text-sm">
						<ArrowLeft size={16} aria-hidden />
						Начало
					</Link>
					<span className="font-medium text-stone-900 dark:text-stone-100 text-sm sm:text-base order-last sm:order-none w-full sm:w-auto text-center sm:text-left">
						Сезонен календар
					</span>
					<div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs sm:text-sm">
						<Link href="/statistiki" className="text-[#0d9488] dark:text-teal-400 font-medium">
							Статистика
						</Link>
						<Link href="/srokove" className="text-[#0d9488] dark:text-teal-400 font-medium">
							Срокове
						</Link>
						<Link href="/kalkulator" className="text-[#0d9488] dark:text-teal-400 font-medium">
							Калкулатор
						</Link>
					</div>
				</div>
			</nav>

			<main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
				<div className="flex items-start gap-4 mb-8">
					<div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center text-teal-800 dark:text-teal-300 shrink-0 border border-teal-200 dark:border-teal-800">
						<CalendarDays size={24} aria-hidden />
					</div>
					<div>
						<h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-50 mb-1">
							Какво правим месец по месец
						</h1>
						<p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
							Ориентир за България по месеци — комбинирай с местен агроном, метеорологична прогноза и официални указания на ДФЗ и БАБХ. Задачите са обобщени по типични полски операции; реалният ход зависи от сорт, район и година. По-долу са отделени ключови дати към кампанията по директни плащания (ориентир — провери текущата заповед).
						</p>
					</div>
				</div>

				<div className="mb-8">
					<label className="block text-sm font-medium text-stone-800 dark:text-stone-100 mb-2">
						Избери основна култура
					</label>
					<div className="flex flex-wrap gap-2">
						{CROP_ORDER.map((k) => (
							<button
								key={k}
								type="button"
								onClick={() => setCrop(k)}
								className={`px-3 py-2 rounded-lg text-sm border transition ${
									crop === k
										? "border-[#0d9488] bg-teal-50 dark:bg-teal-950/40 text-stone-900 dark:text-stone-50"
										: "border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800"
								}`}>
								{CROP_LABELS[k]}
							</button>
						))}
					</div>
				</div>

				<div className="rounded-2xl border border-teal-200/80 dark:border-teal-800/50 bg-teal-50/70 dark:bg-teal-950/25 p-4 sm:p-5 mb-8">
					<p className="text-xs font-semibold uppercase tracking-wide text-teal-900 dark:text-teal-300 mb-3">
						ДФЗ — ключови дати (ориентир кампания)
					</p>
					<ul className="space-y-2 text-sm text-stone-800 dark:text-stone-200">
						{DFZ_FIXED_DEADLINES.map((d, i) => (
							<li key={i}>
								<strong>
									{d.day} {MONTH_NAMES_BG[d.month - 1]}
								</strong>
								{" — "}
								{d.title}
							</li>
						))}
					</ul>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					{MONTH_NAMES_BG.map((monthName, idx) => {
						const m = idx + 1;
						const tasks = tasksByMonth[m];
						if (!tasks?.length) return null;
						return (
							<div
								key={m}
								className="bg-white dark:bg-stone-900/95 rounded-xl border border-stone-200 dark:border-stone-700 p-4 shadow-sm">
								<h2 className="font-semibold text-stone-900 dark:text-stone-50 mb-2 flex items-center gap-2">
									<span className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-sm">
										{m}
									</span>
									{monthName}
								</h2>
								<ul className="text-sm text-stone-600 dark:text-stone-400 space-y-1.5 list-disc pl-5">
									{tasks.map((t, i) => (
										<li key={i}>{t}</li>
									))}
								</ul>
							</div>
						);
					})}
				</div>

				<p className="text-xs text-stone-500 dark:text-stone-500 mt-8 text-center">
					За снимки на писма от ДФЗ или БАБХ и обяснение — ползвай чата с Елена (скоро и качване на снимка като отделна функция).
				</p>
			</main>
		</div>
	);
}
