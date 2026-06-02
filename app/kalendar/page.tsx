"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { SitePageShell } from "@/components/site-page-shell";
import {
	CROP_LABELS,
	CROP_ORDER,
	DFZ_FIXED_DEADLINES,
	MONTH_NAMES_BG,
	SEASON_TASKS_BY_CROP,
	type CropCalendarKey,
} from "@/lib/season-calendar-data";

type SeasonFilter = "all" | "winter" | "spring" | "summer" | "autumn";

const SEASON_MONTHS: Record<Exclude<SeasonFilter, "all">, number[]> = {
	winter: [12, 1, 2],
	spring: [3, 4, 5],
	summer: [6, 7, 8],
	autumn: [9, 10, 11],
};

function seasonLabelBg(key: SeasonFilter): string {
	switch (key) {
		case "all":
			return "Всички";
		case "winter":
			return "Зима";
		case "spring":
			return "Пролет";
		case "summer":
			return "Лято";
		case "autumn":
			return "Есен";
	}
}

export default function KalendarPage() {
	const [crop, setCrop] = useState<CropCalendarKey>("wheat_barley");
	const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("all");

	const tasksByMonth = useMemo(() => SEASON_TASKS_BY_CROP[crop], [crop]);
	const monthsToRender = useMemo(() => {
		if (seasonFilter === "all") return Array.from({ length: 12 }, (_, i) => i + 1);
		return SEASON_MONTHS[seasonFilter];
	}, [seasonFilter]);

	return (
		<SitePageShell
			maxWidth="4xl"
			subheader={
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Сезонен календар</p>
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold sm:text-sm">
						<Link href="/statistiki" className="text-emerald-700 hover:underline dark:text-emerald-300">
							Статистика
						</Link>
						<Link href="/srokove" className="text-emerald-700 hover:underline dark:text-emerald-300">
							Срокове
						</Link>
						<Link href="/kalkulator" className="text-emerald-700 hover:underline dark:text-emerald-300">
							Калкулатор
						</Link>
					</div>
				</div>
			}
		>
			<div className="surface-card p-5 sm:p-8">
				<div className="flex items-start gap-4 mb-8">
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-teal-200 bg-teal-100 text-teal-800 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
						<CalendarDays size={24} aria-hidden />
					</div>
					<div>
						<h1 className="font-display mb-1 text-2xl font-medium tracking-tight text-slate-950 dark:text-white">
							Какво правим месец по месец
						</h1>
						<p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
							Ориентир за България по месеци — комбинирай с местен агроном, метеорологична прогноза и официални указания на ДФЗ и
							БАБХ. Задачите са обобщени по типични полски операции; реалният ход зависи от сорт, район и година. По-долу са отделени
							ключови дати към кампанията по директни плащания (ориентир — провери текущата заповед).
						</p>
					</div>
				</div>

				<div className="mb-8">
					<label className="block text-sm font-medium text-slate-800 dark:text-slate-100 mb-2">
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
										? "border-emerald-600 bg-teal-50 dark:bg-teal-950/40 text-slate-900 dark:text-slate-50"
										: "border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
								}`}>
								{CROP_LABELS[k]}
							</button>
						))}
					</div>
				</div>

				<div className="mb-8">
					<label className="block text-sm font-medium text-slate-800 dark:text-slate-100 mb-2">
						Избери сезон
					</label>
					<div className="flex flex-wrap gap-2">
						{(["all", "winter", "spring", "summer", "autumn"] as const).map((key) => (
							<button
								key={key}
								type="button"
								onClick={() => setSeasonFilter(key)}
								className={`px-3 py-2 rounded-lg text-sm border transition ${
									seasonFilter === key
										? "border-emerald-600 bg-teal-50 dark:bg-teal-950/40 text-slate-900 dark:text-slate-50"
										: "border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
								}`}>
								{seasonLabelBg(key)}
							</button>
						))}
					</div>
				</div>

				<div className="rounded-2xl border border-teal-200/80 dark:border-teal-800/50 bg-teal-50/70 dark:bg-teal-950/25 p-4 sm:p-5 mb-8">
					<p className="text-xs font-semibold uppercase tracking-wide text-teal-900 dark:text-teal-300 mb-3">
						ДФЗ — ключови дати (ориентир кампания)
					</p>
					<ul className="space-y-2 text-sm text-slate-800 dark:text-slate-200">
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
					{monthsToRender.map((m) => {
						const monthName = MONTH_NAMES_BG[m - 1];
						const tasks = tasksByMonth[m];
						if (!tasks?.length) return null;
						return (
							<div
								key={m}
								className="bg-white dark:bg-slate-900/95 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
								<h2 className="font-semibold text-slate-900 dark:text-slate-50 mb-2 flex items-center gap-2">
									<span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm">
										{m}
									</span>
									{monthName}
								</h2>
								<ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-5">
									{tasks.map((t, i) => (
										<li key={i}>{t}</li>
									))}
								</ul>
							</div>
						);
					})}
				</div>

				<p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">
					За снимки на писма от ДФЗ или БАБХ и обяснение — ползвай чата с Елена (скоро и качване на снимка като отделна функция).
				</p>
			</div>
		</SitePageShell>
	);
}
