"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
	Bar,
	CartesianGrid,
	ComposedChart,
	Legend,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { BarChart3, Droplets, TrendingUp } from "lucide-react";
import {
	analyzeCropOutlook,
	CROP_PROFILES,
	type CropKey,
	type CropStatsLang,
	forecastProductionKt,
	isDryStressLikely,
	OUTLOOK_FACTOR_LABELS,
	OUTLOOK_FACTORS_NONE,
	pickL,
} from "@/lib/crop-statistics-data";

const STRINGS: Record<
	CropStatsLang,
	{
		title: string;
		subtitle: string;
		pickCrop: string;
		yAxisKt: string;
		ktShort: string;
		legendHarvest: string;
		legendTrend: string;
		yearLabel: string;
		forecastTitle: string;
		forecastIntro: string;
		compareHeading: string;
		vsLastDetail: string;
		vsAvgDetail: string;
		rangeDetail: string;
		outlookHeadwind: string;
		outlookTailwind: string;
		outlookMixed: string;
		irrigationTitle: string;
		dryBadge: string;
		dryLead: string;
		normalLead: string;
		normalIrrigationExtra: string;
		disclaimer: string;
		langLabel: string;
		bulletsTitle: string;
		bullet1: string;
		bullet2: string;
		bullet3: string;
		weather7dTitle: string;
		weatherLoading: string;
		weatherError: string;
		dayLabel: string;
		tempLabel: string;
		rainLabel: string;
		windLabel: string;
	}
> = {
	bg: {
		title: "Статистика за основни култури в България",
		subtitle:
			"Избери култура по-долу — виж демонстрационна графика с производство в хиляди тонове за пет последователни години, наложена линейна тенденция и точкова прогноза за следващата кампания. Блокът „напояване“ подчертава сушови години по проста евристика върху същите примерни данни — не е климатологична услуга. За реални решения сравни с официални източници (НСИ, Eurostat, отчети на сектора, борсови цени).",
		pickCrop: "Култура",
		yAxisKt: "хил. т",
		ktShort: "хил. т",
		legendHarvest: "Реколта (демо)",
		legendTrend: "Линейна тенденция",
		yearLabel: "Година",
		forecastTitle: "Прогноза за следващата година (линеен модел)",
		forecastIntro:
			"Ориентировъчна точкова прогноза за {year}: около {kt} хил. т от линейната тенденция върху демо данните — не е официална статистика.",
		compareHeading: "Сравнения спрямо примерната серия",
		vsLastDetail:
			"Спрямо последната година в графиката ({year}: {lastKt} хил. т) тенденцията предполага промяна с около {pctSigned} за {nextYear}.",
		vsAvgDetail: "Спрямо средното за петте години (~{avgKt} хил. т): около {pctSigned}.",
		rangeDetail:
			"В рамките на петте точки: минимум {minKt} хил. т ({minYear}), максимум {maxKt} хил. т ({maxYear}). Голям размах обикновено означава доминиращи метеорологични или пазарни години.",
		outlookHeadwind:
			"Интерпретация на модела (демо): очаква се по-трудна стопанска година за тази култура основно заради: {reasons}. Ползвай само за ориентация.",
		outlookTailwind:
			"Интерпретация на модела (демо): обемите изглеждат относително подкрепящи спрямо последните години, защото: {reasons}. Въпреки това провери маржовете.",
		outlookMixed:
			"Интерпретация на модела (демо): смесени сигнали — нито ясно „лека“, нито „тежка“ година; сред основните бележки: {reasons}.",
		irrigationTitle: "Напояване и вода",
		dryBadge: "Суша",
		dryLead: "При суша (ориентир):",
		normalLead: "При нормални валежи:",
		normalIrrigationExtra:
			"Напояването често е избирателно; следи песъчливи почви и долинни инверсии при първи признаци на дефицит.",
		disclaimer:
			"Всички количества, проценти и „тоновете“ на прогнозата са синтетични демо данни за интерфейса на AgriNexus.Law. Не ги ползвай за търговия със стока, за банкови изисквания или за официално деклариране пред ДФЗ. Винаги валидирай с НСИ, Eurostat, публични документи на ДФЗ и консултант на полето.",
		langLabel: "Език",
		bulletsTitle: "Как да четеш екрана",
		bullet1:
			"Стълбовете са примерни количества; линията показва математическа тенденция, не експертна прогноза.",
		bullet2:
			"Сравненията спрямо средно и миналогодишно ти дават контекст вътре в демо серията — не заместват пазарен или климатичен анализ.",
		bullet3:
			"При смяна на културата виж как се променят текстовете за вода и регионални акценти под графиката.",
		weather7dTitle: "7-дневна метео прогноза (безплатен Open-Meteo)",
		weatherLoading: "Зареждам прогноза...",
		weatherError: "Неуспешно зареждане на прогноза.",
		dayLabel: "Ден",
		tempLabel: "Темп. (°C)",
		rainLabel: "Валеж (мм)",
		windLabel: "Вятър (м/с)",
	},
	en: {
		title: "Bulgaria crop production — 5-year view & outlook",
		subtitle:
			"Pick a crop to see an illustrative five-year production chart (kt), a simple linear trend line, and a next-year numeric outlook.",
		pickCrop: "Crop",
		yAxisKt: "1000 t",
		ktShort: "kt",
		legendHarvest: "Harvest (demo)",
		legendTrend: "Linear trend",
		yearLabel: "Year",
		forecastTitle: "Next-year outlook (linear model)",
		forecastIntro:
			"Illustrative point forecast for {year}: about {kt} thousand tonnes from the linear trend on demo data — not an official statistic.",
		compareHeading: "Benchmarks on the demo series",
		vsLastDetail:
			"Compared with the latest year in the chart ({year}: {lastKt} kt), the trend implies about {pctSigned} for {nextYear}.",
		vsAvgDetail: "Compared with the five-year demo average (~{avgKt} kt): about {pctSigned}.",
		rangeDetail:
			"Across the five points: low {minKt} kt ({minYear}), high {maxKt} kt ({maxYear}) — wide spreads usually mean weather or policy shocks dominated some seasons.",
		outlookHeadwind:
			"Reading of the model (demo): expect a harder planning year for this crop, mainly because: {reasons}. Use this only as orientation.",
		outlookTailwind:
			"Reading of the model (demo): volumes look relatively supportive versus recent history because: {reasons}. Still stress-test margins.",
		outlookMixed:
			"Reading of the model (demo): mixed signals — neither clearly easy nor harsh — notably: {reasons}.",
		irrigationTitle: "Water & irrigation hints",
		dryBadge: "Dry risk",
		dryLead: "Dry-pattern emphasis:",
		normalLead: "Typical season:",
		normalIrrigationExtra:
			"Irrigation is often supplemental; monitor sandy soils and valley frost pockets first when rainfall is near normal.",
		disclaimer:
			"All production figures and forecasts are synthetic demo data for UI testing. Do not use for trading or policy decisions.",
		langLabel: "Language",
		bulletsTitle: "How to read this screen",
		bullet1: "Bars are illustrative volumes; the line is a mathematical trend, not an expert forecast.",
		bullet2: "Benchmarks vs average / prior year are in-demo context only — not market or climate analysis.",
		bullet3: "Switch crops to see irrigation hints change below the chart.",
		weather7dTitle: "7-day weather outlook (free Open-Meteo)",
		weatherLoading: "Loading forecast...",
		weatherError: "Could not load forecast.",
		dayLabel: "Day",
		tempLabel: "Temp (°C)",
		rainLabel: "Rain (mm)",
		windLabel: "Wind (m/s)",
	},
};

type ForecastDay = {
	date: string;
	tempMaxC: number;
	tempMinC: number;
	precipMm: number;
	windMaxMs: number;
};

type RagInsight = {
	title: string;
	source: string;
	snippet: string;
};

const CROP_COORDS: Record<CropKey, { lat: number; lon: number }> = {
	wheat_barley: { lat: 43.6, lon: 27.8 }, // Dobrudzha
	sunflower: { lat: 43.2, lon: 26.9 },
	maize: { lat: 42.4, lon: 25.6 }, // Upper Thrace
	tomatoes: { lat: 42.15, lon: 24.75 }, // Plovdiv
	grapes: { lat: 42.03, lon: 24.87 }, // Asenovgrad/Plovdiv
	apples: { lat: 42.73, lon: 25.48 }, // Central BG
};

function buildChartRows(profile: (typeof CROP_PROFILES)[number]) {
	const { series } = profile;
	const { nextYear, forecastKt, slopeKtPerYear, intercept } = forecastProductionKt(series);
	const rows = series.map(p => ({
		yearLabel: String(p.year),
		actual: p.kt as number | undefined,
		fit: intercept + slopeKtPerYear * p.year,
	}));
	rows.push({
		yearLabel: String(nextYear),
		actual: undefined,
		fit: forecastKt,
	});
	return { rows, nextYear, forecastKt, slopeKtPerYear, dry: isDryStressLikely(series, slopeKtPerYear) };
}

export function CropStatisticsView() {
	const [lang, setLang] = useState<CropStatsLang>("bg");
	const [cropKey, setCropKey] = useState<CropKey>("tomatoes");
	const tr = STRINGS[lang];
	const [weatherDays, setWeatherDays] = useState<ForecastDay[]>([]);
	const [weatherLoading, setWeatherLoading] = useState(false);
	const [weatherError, setWeatherError] = useState<string | null>(null);
	const [ragInsights, setRagInsights] = useState<RagInsight[]>([]);
	const [ragMode, setRagMode] = useState<"rag_hybrid" | "bm25" | null>(null);
	const [ragLoading, setRagLoading] = useState(false);
	const [ragError, setRagError] = useState<string | null>(null);

	const profile = useMemo(
		() => CROP_PROFILES.find(c => c.key === cropKey) ?? CROP_PROFILES[0],
		[cropKey],
	);
	const { rows, nextYear, forecastKt, slopeKtPerYear, dry } = useMemo(
		() => buildChartRows(profile),
		[profile],
	);
	const outlook = useMemo(
		() => analyzeCropOutlook(profile.series, slopeKtPerYear, forecastKt, dry),
		[profile.series, slopeKtPerYear, forecastKt, dry],
	);

	const fmtPctSigned = (p: number) => {
		const sign = p > 0 ? "+" : "";
		return `${sign}${p.toFixed(1)}%`;
	};

	const outlookReasons =
		outlook.factors.length === 0
			? pickL(OUTLOOK_FACTORS_NONE, lang)
			: outlook.factors.map(f => pickL(OUTLOOK_FACTOR_LABELS[f], lang)).join("; ");
	const primaryInsightTitle = ragInsights[0]?.title;
	const askAiPrompt =
		lang === "bg"
			? `Направи кратък анализ за ${pickL(profile.label, "bg")} в България. Включи риск, субсидии и срокове.${primaryInsightTitle ? ` Ползвай и контекста: ${primaryInsightTitle}.` : ""}`
			: `Make a short analysis for ${pickL(profile.label, "en")} in Bulgaria. Include risks, subsidies, and deadlines.${primaryInsightTitle ? ` Also use this context: ${primaryInsightTitle}.` : ""}`;
	const askAiHref = `/?chatQ=${encodeURIComponent(askAiPrompt)}#chat`;

	const outlookNarrative =
		outlook.tone === "headwind"
			? tr.outlookHeadwind.replace("{reasons}", outlookReasons)
			: outlook.tone === "tailwind"
				? tr.outlookTailwind.replace("{reasons}", outlookReasons)
				: tr.outlookMixed.replace("{reasons}", outlookReasons);

	useEffect(() => {
		const coords = CROP_COORDS[cropKey];
		if (!coords) return;
		let cancelled = false;
		setWeatherLoading(true);
		setWeatherError(null);
		void (async () => {
			try {
				const res = await fetch(`/api/weather/forecast?lat=${coords.lat}&lon=${coords.lon}`, {
					cache: "no-store",
				});
				const data = (await res.json().catch(() => ({}))) as {
					ok?: boolean;
					days?: ForecastDay[];
				};
				if (!res.ok || !data.ok || !Array.isArray(data.days)) {
					throw new Error("weather fetch failed");
				}
				if (!cancelled) setWeatherDays(data.days);
			} catch {
				if (!cancelled) {
					setWeatherDays([]);
					setWeatherError(tr.weatherError);
				}
			} finally {
				if (!cancelled) setWeatherLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [cropKey, tr.weatherError]);

	useEffect(() => {
		let cancelled = false;
		setRagLoading(true);
		setRagError(null);
		const cropLabelBg = pickL(profile.label, "bg");
		const query = `Статистика и прогноза за ${cropLabelBg} в България: субсидии, срокове, рискове, изисквания`;

		void (async () => {
			try {
				const res = await fetch("/api/statistiki/insights", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ query }),
				});
				const data = (await res.json().catch(() => ({}))) as {
					ok?: boolean;
					mode?: "rag_hybrid" | "bm25";
					insights?: RagInsight[];
					error?: string;
				};
				if (!res.ok || !data.ok) {
					throw new Error(data.error || "insights failed");
				}
				if (cancelled) return;
				setRagInsights(Array.isArray(data.insights) ? data.insights : []);
				setRagMode(data.mode || null);
			} catch {
				if (!cancelled) {
					setRagInsights([]);
					setRagMode(null);
					setRagError(
						lang === "bg"
							? "RAG контекстът не можа да се зареди в момента."
							: "Could not load RAG context right now.",
					);
				}
			} finally {
				if (!cancelled) setRagLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [cropKey, lang, profile.label]);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex items-start gap-3 min-w-0">
					<div className="w-11 h-11 rounded-xl bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center text-teal-800 dark:text-teal-300 shrink-0 border border-teal-200 dark:border-teal-800">
						<BarChart3 size={22} aria-hidden />
					</div>
					<div>
						<h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-50">
							{tr.title}
						</h1>
						<p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed max-w-3xl">
							{tr.subtitle}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<span className="text-xs text-slate-500 dark:text-slate-400">{tr.langLabel}</span>
					<div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
						<button
							type="button"
							onClick={() => setLang("bg")}
							className={`px-3 py-1.5 text-xs font-medium transition ${
								lang === "bg"
									? "bg-emerald-600 text-white"
									: "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
							}`}>
							BG
						</button>
						<button
							type="button"
							onClick={() => setLang("en")}
							className={`px-3 py-1.5 text-xs font-medium transition ${
								lang === "en"
									? "bg-emerald-600 text-white"
									: "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
							}`}>
							EN
						</button>
					</div>
				</div>
			</div>

			<div className="rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 px-4 py-3">
				<p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-2">
					{tr.bulletsTitle}
				</p>
				<ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-5 leading-relaxed">
					<li>{tr.bullet1}</li>
					<li>{tr.bullet2}</li>
					<li>{tr.bullet3}</li>
				</ul>
			</div>

			<div>
				<label className="block text-sm font-medium text-slate-800 dark:text-slate-100 mb-2">
					{tr.pickCrop}
				</label>
				<div className="flex flex-wrap gap-2">
					{CROP_PROFILES.map(c => (
						<button
							key={c.key}
							type="button"
							onClick={() => setCropKey(c.key)}
							className={`px-3 py-2 rounded-lg text-sm border transition ${
								cropKey === c.key
									? "border-emerald-600 bg-teal-50 dark:bg-teal-950/40 text-slate-900 dark:text-slate-50 shadow-sm"
									: "border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
							}`}
							style={
								cropKey === c.key
									? { boxShadow: `0 0 0 1px ${c.chartColor}44` }
									: undefined
							}>
							{pickL(c.label, lang)}
						</button>
					))}
				</div>
			</div>

			<div className="rounded-2xl border border-teal-200/80 dark:border-teal-800/50 bg-gradient-to-br from-teal-50/90 to-white dark:from-teal-950/30 dark:to-slate-900/90 p-4 sm:p-5">
				<div className="w-full h-[300px] sm:h-[340px]">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
							<defs>
								<linearGradient id={`barGrad-${profile.key}`} x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor={profile.chartColor} stopOpacity={0.95} />
									<stop offset="100%" stopColor={profile.chartColor} stopOpacity={0.35} />
								</linearGradient>
							</defs>
							<CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
							<XAxis
								dataKey="yearLabel"
								tick={{ fill: "#64748b", fontSize: 12 }}
								tickLine={false}
								axisLine={{ stroke: "rgba(148,163,184,0.25)" }}
							/>
							<YAxis
								tick={{ fill: "#64748b", fontSize: 11 }}
								tickLine={false}
								axisLine={{ stroke: "rgba(148,163,184,0.25)" }}
								width={48}
								label={{
									value: tr.yAxisKt,
									angle: -90,
									position: "insideLeft",
									fill: "#64748b",
									fontSize: 11,
								}}
							/>
							<Tooltip
								contentStyle={{
									background: "rgba(15,23,42,0.92)",
									border: "1px solid rgba(45,212,191,0.35)",
									borderRadius: 8,
								}}
								labelStyle={{ color: "#e2e8f0" }}
								formatter={(value: unknown, name: unknown) => {
									const n = typeof value === "number" ? value : Number(value);
									if (value == null || Number.isNaN(n)) return ["—", String(name)];
									return [`${Math.round(n)} ${tr.ktShort}`, String(name)];
								}}
								labelFormatter={label => `${tr.yearLabel}: ${label}`}
							/>
							<Legend
								wrapperStyle={{ fontSize: 12 }}
								formatter={value => {
									if (value === "actual") return tr.legendHarvest;
									if (value === "fit") return tr.legendTrend;
									return value;
								}}
							/>
							<Bar
								dataKey="actual"
								name="actual"
								fill={`url(#barGrad-${profile.key})`}
								radius={[6, 6, 0, 0]}
								maxBarSize={48}
							/>
							<Line
								type="monotone"
								dataKey="fit"
								name="fit"
								stroke="#38bdf8"
								strokeWidth={2.5}
								dot={{ r: 4, fill: "#38bdf8", strokeWidth: 0 }}
								activeDot={{ r: 6 }}
							/>
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="rounded-xl border border-sky-200/80 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/20 p-4 sm:p-5">
					<h2 className="font-semibold text-slate-900 dark:text-slate-50 mb-2 flex items-center gap-2 text-base">
						<TrendingUp size={18} className="text-sky-600 dark:text-sky-400 shrink-0" aria-hidden />
						{tr.forecastTitle}
					</h2>
					<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
						{tr.forecastIntro.replace(/\{year\}/g, String(nextYear)).replace(/\{kt\}/g, String(Math.round(forecastKt)))}
					</p>
					<p className="mt-4 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
						{tr.compareHeading}
					</p>
					<ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-disc pl-5 mb-4">
						<li>
							{tr.vsLastDetail
								.replace(/\{year\}/g, String(outlook.lastYear))
								.replace(/\{lastKt\}/g, String(Math.round(outlook.lastKt)))
								.replace(/\{pctSigned\}/g, fmtPctSigned(outlook.pctVsLast))
								.replace(/\{nextYear\}/g, String(nextYear))}
						</li>
						<li>
							{tr.vsAvgDetail
								.replace(/\{avgKt\}/g, String(Math.round(outlook.avgKt)))
								.replace(/\{pctSigned\}/g, fmtPctSigned(outlook.pctVsAvg))}
						</li>
						<li>
							{tr.rangeDetail
								.replace(/\{minKt\}/g, String(Math.round(outlook.minKt)))
								.replace(/\{maxKt\}/g, String(Math.round(outlook.maxKt)))
								.replace(/\{minYear\}/g, String(outlook.minYear))
								.replace(/\{maxYear\}/g, String(outlook.maxYear))}
						</li>
					</ul>
					<p
						className={`text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-3 border-l-[3px] mb-3 ${
							outlook.tone === "headwind"
								? "border-l-orange-400"
								: outlook.tone === "tailwind"
									? "border-l-emerald-600"
									: "border-l-slate-400"
						}`}>
						{outlookNarrative}
					</p>
					<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
						{pickL(profile.genNotes, lang)}
					</p>
				</div>

				<div
					className={`rounded-xl border p-4 sm:p-5 ${
						dry
							? "border-orange-300/80 dark:border-orange-900/50 bg-orange-50/60 dark:bg-orange-950/25"
							: "border-teal-200/80 dark:border-teal-900/50 bg-teal-50/40 dark:bg-teal-950/20"
					}`}>
					<h2 className="font-semibold text-slate-900 dark:text-slate-50 mb-2 flex flex-wrap items-center gap-2 text-base">
						<Droplets
							size={18}
							className={dry ? "text-orange-600 dark:text-orange-400" : "text-teal-600 dark:text-teal-400"}
							aria-hidden
						/>
						{tr.irrigationTitle}
						{dry ? (
							<span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400 border border-orange-400/60 px-2 py-0.5 rounded-md">
								{tr.dryBadge}
							</span>
						) : null}
					</h2>
					<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
						{pickL(profile.irrigationGeneral, lang)}
					</p>
					<p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
						<strong className={dry ? "text-orange-700 dark:text-orange-300" : "text-teal-700 dark:text-teal-400"}>
							{dry ? tr.dryLead : tr.normalLead}
						</strong>{" "}
						{dry ? pickL(profile.irrigationIfDry, lang) : tr.normalIrrigationExtra}
					</p>
					<div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 p-3">
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-2">
							{tr.weather7dTitle}
						</p>
						{weatherLoading ? (
							<p className="text-sm text-slate-500 dark:text-slate-400">{tr.weatherLoading}</p>
						) : weatherError ? (
							<p className="text-sm text-red-600 dark:text-red-300">{weatherError}</p>
						) : (
							<div className="overflow-x-auto">
								<table className="min-w-full text-xs">
									<thead>
										<tr className="text-slate-500 dark:text-slate-400">
											<th className="text-left pr-3 py-1">{tr.dayLabel}</th>
											<th className="text-left pr-3 py-1">{tr.tempLabel}</th>
											<th className="text-left pr-3 py-1">{tr.rainLabel}</th>
											<th className="text-left py-1">{tr.windLabel}</th>
										</tr>
									</thead>
									<tbody>
										{weatherDays.map((d) => (
											<tr key={d.date} className="border-t border-slate-100 dark:border-slate-800">
												<td className="py-1.5 pr-3">{new Date(d.date).toLocaleDateString(lang === "bg" ? "bg-BG" : "en-GB", { weekday: "short", day: "2-digit", month: "2-digit" })}</td>
												<td className="py-1.5 pr-3">{Math.round(d.tempMinC)}° / {Math.round(d.tempMaxC)}°</td>
												<td className="py-1.5 pr-3">{d.precipMm.toFixed(1)}</td>
												<td className="py-1.5">{d.windMaxMs.toFixed(1)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 sm:p-5">
				<div className="flex items-center justify-between gap-3 mb-2">
					<h2 className="font-semibold text-slate-900 dark:text-slate-50 text-base">
						{lang === "bg" ? "RAG контекст за културата" : "RAG context for this crop"}
					</h2>
					<div className="flex items-center gap-2">
						{ragMode ? (
							<span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
								{ragMode === "rag_hybrid" ? "RAG hybrid" : "BM25 fallback"}
							</span>
						) : null}
						<Link
							href={askAiHref}
							className="brand-cta-bg rounded-md px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:brightness-105 transition">
							{lang === "bg" ? "Попитай AI" : "Ask AI"}
						</Link>
					</div>
				</div>
				{ragLoading ? (
					<p className="text-sm text-slate-600 dark:text-slate-400">
						{lang === "bg" ? "Зареждам релевантен контекст..." : "Loading relevant context..."}
					</p>
				) : ragError ? (
					<p className="text-sm text-red-600 dark:text-red-300">{ragError}</p>
				) : ragInsights.length === 0 ? (
					<p className="text-sm text-slate-600 dark:text-slate-400">
						{lang === "bg"
							? "Няма релевантни RAG резултати за тази култура."
							: "No relevant RAG results for this crop."}
					</p>
				) : (
					<ul className="space-y-2">
						{ragInsights.map((insight, idx) => (
							<li
								key={`${insight.title}-${idx}`}
								className="rounded-lg border border-indigo-100 dark:border-indigo-900/40 bg-white/80 dark:bg-slate-900/60 px-3 py-2">
								<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
									{insight.title}
								</p>
								<p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
									{insight.source}
								</p>
								<p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
									{insight.snippet}
								</p>
							</li>
						))}
					</ul>
				)}
			</div>

			<p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed rounded-xl border border-teal-100 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-950/15 p-4">
				{tr.disclaimer}
			</p>
		</div>
	);
}
