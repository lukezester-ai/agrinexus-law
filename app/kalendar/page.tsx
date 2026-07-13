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
			<div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 p-6 sm:p-10 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.15)] backdrop-blur-xl">
				<div className="flex flex-col sm:flex-row items-start gap-5 mb-10">
					<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-fuchsia-600 text-white shadow-lg shadow-emerald-500/25 animate-float">
						<CalendarDays size={30} aria-hidden />
					</div>
					<div>
						<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-fuchsia-600 mb-2">
							Какво правим месец по месец
						</h1>
						<p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
							Ориентир за България по месеци — комбинирай с местен агроном, метеорологична прогноза и официални указания на ДФЗ и
							БАБХ. Задачите са обобщени по типични полски операции; реалният ход зависи от сорт, район и година. По-долу са отделени
							ключови дати към кампанията по директни плащания.
						</p>
					</div>
				</div>

				<div className="mb-8 space-y-3">
					<label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
						Избери основна култура
					</label>
					<div className="flex flex-wrap gap-2.5">
						{CROP_ORDER.map((k) => (
							<button
								key={k}
								type="button"
								onClick={() => setCrop(k)}
								className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 ${
									crop === k
										? "border-emerald-500 bg-gradient-to-r from-emerald-600 via-teal-600 to-fuchsia-600 text-white shadow-md shadow-emerald-600/20 scale-105"
										: "border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-emerald-400 hover:bg-white"
								}`}>
								{CROP_LABELS[k]}
							</button>
						))}
					</div>
				</div>

				<div className="mb-10 space-y-3">
					<label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
						Избери сезон
					</label>
					<div className="flex flex-wrap gap-2.5">
						{(["all", "winter", "spring", "summer", "autumn"] as const).map((key) => (
							<button
								key={key}
								type="button"
								onClick={() => setSeasonFilter(key)}
								className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 ${
									seasonFilter === key
										? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-sm"
										: "border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-emerald-400 hover:bg-white"
								}`}>
								{seasonLabelBg(key)}
							</button>
						))}
					</div>
				</div>

				<div className="rounded-[24px] border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-6 mb-10 shadow-sm backdrop-blur-md">
					<p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-4 flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
						<span>ДФЗ — ключови дати (ориентир кампания 2026)</span>
					</p>
					<div className="grid gap-3 sm:grid-cols-2">
						{DFZ_FIXED_DEADLINES.map((d, i) => (
							<div key={i} className="flex items-start gap-3 bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
								<span className="shrink-0 rounded-lg bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
									{d.day} {MONTH_NAMES_BG[d.month - 1]}
								</span>
								<span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
									{d.title}
								</span>
							</div>
						))}
					</div>
				</div>

				<div className="grid gap-5 sm:grid-cols-2">
					{monthsToRender.map((m) => {
						const monthName = MONTH_NAMES_BG[m - 1];
						const tasks = tasksByMonth[m];
						if (!tasks?.length) return null;
						return (
							<div
								key={m}
								className="card-hover-pro group rounded-[24px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 flex flex-col justify-between">
								<div>
									<h2 className="font-extrabold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
										<span className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
											{m}
										</span>
										<span>{monthName}</span>
									</h2>
									<ul className="text-sm font-medium text-slate-600 dark:text-slate-300 space-y-2.5 list-disc pl-5 leading-relaxed">
										{tasks.map((t, i) => (
											<li key={i}>{t}</li>
										))}
									</ul>
								</div>
							</div>
						);
					})}
				</div>

				<p className="mt-10 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
					За снимки на писма от ДФЗ или БАБХ и обяснение — ползвай чата с Елена за мигновен анализ на всеки документ.
				</p>
			</div>
		</SitePageShell>
	);
}
