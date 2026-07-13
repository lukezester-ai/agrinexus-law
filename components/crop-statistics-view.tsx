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
	PieChart,
	Pie,
	Cell
} from "recharts";
import { BarChart3, Droplets, TrendingUp, Loader2, MapPin } from "lucide-react";
import {
	analyzeCropOutlook,
	CROP_PROFILES,
	type CropKey,
	type CropStatsLang,
	type CropProfile,
	forecastProductionKt,
	isDryStressLikely,
	OUTLOOK_FACTOR_LABELS,
	OUTLOOK_FACTORS_NONE,
	pickL,
} from "@/lib/crop-statistics-data";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899'];

const STRINGS: Record<CropStatsLang, any> = {
	bg: {
		title: "Статистика за основни култури в България",
		subtitle: "Интерактивна статистика, цени и анализ на тенденциите. Изберете култура и период по-долу.",
		pickCrop: "Култура",
		yAxisKt: "хил. т / млн. л",
		yAxisPrice: "Цена (лв.)",
		ktShort: "обем",
		priceShort: "цена",
		legendHarvest: "Реколта/Обем",
		legendTrend: "Линейна тенденция",
		legendPrice: "Средна изкупна цена",
		yearLabel: "Година",
		forecastTitle: "Прогноза за следващата година",
		forecastIntro: "Ориентировъчна точкова прогноза за {year}: около {kt} {unit} от линейната тенденция.",
		compareHeading: "Сравнения спрямо серията",
		vsLastDetail: "Спрямо последната година в графиката ({year}: {lastKt} {unit}) тенденцията предполага промяна с около {pctSigned} за {nextYear}.",
		vsAvgDetail: "Спрямо средното за периода (~{avgKt} {unit}): около {pctSigned}.",
		rangeDetail: "В рамките на периода: минимум {minKt} ({minYear}), максимум {maxKt} ({maxYear}).",
		outlookHeadwind: "Интерпретация на модела: очаква се по-трудна стопанска година основно заради: {reasons}. Ползвай само за ориентация.",
		outlookTailwind: "Интерпретация на модела: обемите изглеждат относително подкрепящи спрямо последните години, защото: {reasons}.",
		outlookMixed: "Интерпретация на модела: смесени сигнали — нито ясно „лека“, нито „тежка“ година; сред основните бележки: {reasons}.",
		irrigationTitle: "Специфики и уязвимост",
		dryBadge: "Суша",
		dryLead: "При суша (ориентир):",
		normalLead: "При нормални валежи:",
		normalIrrigationExtra: "Напояването често е избирателно; следи песъчливи почви и долинни инверсии при първи признаци на дефицит.",
		disclaimer: "Всички количества, проценти и прогнози са визуализация. За официални справки ползвайте НСИ, Eurostat и ДФЗ.",
		langLabel: "Език",
		weather7dTitle: "7-дневна метео прогноза",
		weatherLoading: "Зареждам прогноза...",
		weatherError: "Неуспешно зареждане на прогноза.",
		dayLabel: "Ден",
		tempLabel: "Темп. (°C)",
		rainLabel: "Валеж (мм)",
		windLabel: "Вятър (м/с)",
		period5: "Последни 5 г.",
		period10: "Последни 10 г.",
		regionsTitle: "Регионално разпределение (%)",
		regionsEmpty: "Няма регионални данни."
	},
	en: {
		title: "Bulgaria crop production & statistics",
		subtitle: "Interactive statistics, prices and trend analysis. Select a crop and period below.",
		pickCrop: "Crop",
		yAxisKt: "Volume",
		yAxisPrice: "Price (BGN)",
		ktShort: "vol",
		priceShort: "price",
		legendHarvest: "Harvest/Volume",
		legendTrend: "Linear trend",
		legendPrice: "Avg Market Price",
		yearLabel: "Year",
		forecastTitle: "Next-year outlook",
		forecastIntro: "Illustrative point forecast for {year}: about {kt} {unit} from the linear trend.",
		compareHeading: "Benchmarks on the series",
		vsLastDetail: "Compared with the latest year in the chart ({year}: {lastKt} {unit}), the trend implies about {pctSigned} for {nextYear}.",
		vsAvgDetail: "Compared with the average (~{avgKt} {unit}): about {pctSigned}.",
		rangeDetail: "Across the points: low {minKt} ({minYear}), high {maxKt} ({maxYear}).",
		outlookHeadwind: "Reading of the model: expect a harder planning year mainly because: {reasons}. Use this only as orientation.",
		outlookTailwind: "Reading of the model: volumes look relatively supportive because: {reasons}.",
		outlookMixed: "Reading of the model: mixed signals — notably: {reasons}.",
		irrigationTitle: "Specifics & Vulnerabilities",
		dryBadge: "Dry risk",
		dryLead: "Dry-pattern emphasis:",
		normalLead: "Typical season:",
		normalIrrigationExtra: "Irrigation is often supplemental; monitor sandy soils and valley frost pockets first.",
		disclaimer: "All figures are visualizations. For official reporting use NSI, Eurostat.",
		langLabel: "Language",
		weather7dTitle: "7-day weather outlook",
		weatherLoading: "Loading forecast...",
		weatherError: "Could not load forecast.",
		dayLabel: "Day",
		tempLabel: "Temp (°C)",
		rainLabel: "Rain (mm)",
		windLabel: "Wind (m/s)",
		period5: "Last 5 yrs",
		period10: "Last 10 yrs",
		regionsTitle: "Regional Breakdown (%)",
		regionsEmpty: "No regional data available."
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
	rapeseed: { lat: 43.4, lon: 26.5 },
	lavender: { lat: 43.5, lon: 27.5 },
	rose: { lat: 42.6, lon: 25.4 }, // Kazanlak
	cow_milk: { lat: 42.5, lon: 25.5 }, // Central
};

function buildChartRows(profile: CropProfile, yearsCount: number) {
	// Взимаме само последните X години
	const fullSeries = [...profile.series].sort((a, b) => a.year - b.year);
	const series = fullSeries.slice(Math.max(0, fullSeries.length - yearsCount));
	
	const { nextYear, forecastKt, slopeKtPerYear, intercept } = forecastProductionKt(series);
	const rows = series.map(p => ({
		yearLabel: String(p.year),
		actual: p.kt as number | undefined,
		price: p.priceBgn,
		fit: intercept + slopeKtPerYear * p.year,
	}));
	rows.push({
		yearLabel: String(nextYear),
		actual: undefined,
		price: undefined,
		fit: forecastKt,
	});
	
	// Взимаме регионите от последната налична година
	const lastRegions = series[series.length - 1]?.regions || {};
	const regionsData = Object.entries(lastRegions).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

	return { rows, nextYear, forecastKt, slopeKtPerYear, dry: isDryStressLikely(series, slopeKtPerYear), regionsData, series };
}

export function CropStatisticsView() {
	const [lang, setLang] = useState<CropStatsLang>("bg");
	const [cropKey, setCropKey] = useState<CropKey>("wheat_barley");
	const [yearsCount, setYearsCount] = useState<number>(10);
	const [profiles, setProfiles] = useState<CropProfile[]>(CROP_PROFILES);
	const [isLoadingData, setIsLoadingData] = useState(true);

	const tr = STRINGS[lang];
	const [weatherDays, setWeatherDays] = useState<ForecastDay[]>([]);
	const [weatherLoading, setWeatherLoading] = useState(false);
	const [weatherError, setWeatherError] = useState<string | null>(null);
	const [ragInsights, setRagInsights] = useState<RagInsight[]>([]);
	const [ragMode, setRagMode] = useState<"rag_hybrid" | "bm25" | null>(null);
	const [ragLoading, setRagLoading] = useState(false);
	const [ragError, setRagError] = useState<string | null>(null);

	// Изтегляне на истинските данни от базата
	useEffect(() => {
		fetch("/api/statistiki/data")
			.then(r => r.json())
			.then(d => {
				if (d.ok && Array.isArray(d.data)) {
					setProfiles(d.data);
				}
			})
			.catch(err => console.error("Error fetching stats:", err))
			.finally(() => setIsLoadingData(false));
	}, []);

	const profile = useMemo(
		() => profiles.find(c => c.key === cropKey) ?? profiles[0],
		[cropKey, profiles],
	);

	const { rows, nextYear, forecastKt, slopeKtPerYear, dry, regionsData, series } = useMemo(
		() => buildChartRows(profile, yearsCount),
		[profile, yearsCount],
	);

	const outlook = useMemo(
		() => analyzeCropOutlook(series, slopeKtPerYear, forecastKt, dry),
		[series, slopeKtPerYear, forecastKt, dry],
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
		<div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 p-6 sm:p-10 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.15)] backdrop-blur-xl space-y-8">
			<div className="flex flex-wrap items-start justify-between gap-5">
				<div className="flex items-start gap-4 min-w-0">
					<div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-fuchsia-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/25 animate-float">
						{isLoadingData ? <Loader2 className="animate-spin" size={30} /> : <BarChart3 size={30} />}
					</div>
					<div>
						<h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-fuchsia-600">
							{tr.title}
						</h1>
						<p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2 leading-relaxed max-w-3xl">
							{tr.subtitle}
						</p>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-3 shrink-0">
					<div className="flex rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-1 shadow-inner">
						<button onClick={() => setYearsCount(5)} className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition-all ${yearsCount === 5 ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>
							{tr.period5}
						</button>
						<button onClick={() => setYearsCount(10)} className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition-all ${yearsCount === 10 ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>
							{tr.period10}
						</button>
					</div>
					<div className="flex rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-1 shadow-inner">
						<button onClick={() => setLang("bg")} className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition-all ${lang === "bg" ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>BG</button>
						<button onClick={() => setLang("en")} className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg transition-all ${lang === "en" ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>EN</button>
					</div>
				</div>
			</div>

			<div className="space-y-3">
				<label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
					{tr.pickCrop}
				</label>
				<div className="flex flex-wrap gap-2.5">
					{profiles.map(c => (
						<button
							key={c.key}
							type="button"
							onClick={() => setCropKey(c.key)}
							className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 ${
								cropKey === c.key
									? "border-emerald-500 bg-gradient-to-r from-emerald-600 via-teal-600 to-fuchsia-600 text-white shadow-md shadow-emerald-600/20 scale-105"
									: "border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-emerald-400 hover:bg-white"
							}`}
						>
							{pickL(c.label, lang)}
						</button>
					))}
				</div>
			</div>

			<div className="rounded-[24px] border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-6 shadow-sm">
				<div className="w-full h-[300px] sm:h-[360px]">
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
								yAxisId="left"
								tick={{ fill: "#64748b", fontSize: 11 }}
								tickLine={false}
								axisLine={{ stroke: "rgba(148,163,184,0.25)" }}
								width={48}
								label={{
									value: profile.unitLabel ? pickL(profile.unitLabel, lang) : tr.yAxisKt,
									angle: -90,
									position: "insideLeft",
									fill: "#64748b",
									fontSize: 11,
								}}
							/>
							<YAxis
								yAxisId="right"
								orientation="right"
								tick={{ fill: "#64748b", fontSize: 11 }}
								tickLine={false}
								axisLine={{ stroke: "rgba(148,163,184,0.25)" }}
								width={48}
								label={{
									value: profile.priceUnitLabel ? pickL(profile.priceUnitLabel, lang) : tr.yAxisPrice,
									angle: 90,
									position: "insideRight",
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
									const unit = name === "actual" || name === "fit" 
										? (profile.unitLabel ? pickL(profile.unitLabel, lang) : tr.ktShort)
										: (profile.priceUnitLabel ? pickL(profile.priceUnitLabel, lang) : "BGN");
									
									// Преводи за тултипа
									let labelName = String(name);
									if (name === "actual") labelName = tr.legendHarvest;
									if (name === "fit") labelName = tr.legendTrend;
									if (name === "price") labelName = tr.legendPrice;

									return [`${Math.round(n)} ${unit}`, labelName];
								}}
								labelFormatter={label => `${tr.yearLabel}: ${label}`}
							/>
							<Legend
								wrapperStyle={{ fontSize: 12 }}
								formatter={value => {
									if (value === "actual") return tr.legendHarvest;
									if (value === "fit") return tr.legendTrend;
									if (value === "price") return tr.legendPrice;
									return value;
								}}
							/>
							<Bar
								yAxisId="left"
								dataKey="actual"
								name="actual"
								fill={`url(#barGrad-${profile.key})`}
								radius={[6, 6, 0, 0]}
								maxBarSize={48}
							/>
							<Line
								yAxisId="left"
								type="monotone"
								dataKey="fit"
								name="fit"
								stroke="#38bdf8"
								strokeWidth={2.5}
								strokeDasharray="4 4"
								dot={{ r: 0 }}
								activeDot={{ r: 6 }}
							/>
							<Line
								yAxisId="right"
								type="monotone"
								dataKey="price"
								name="price"
								stroke="#f43f5e"
								strokeWidth={3}
								dot={{ r: 4, fill: "#f43f5e", strokeWidth: 0 }}
								activeDot={{ r: 6 }}
							/>
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
				<div className="md:col-span-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col items-center justify-center">
					<h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-4 w-full flex items-center gap-2"><MapPin size={16} className="text-teal-500"/> {tr.regionsTitle}</h3>
					{regionsData.length > 0 ? (
						<div className="w-full h-[180px]">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={regionsData}
										cx="50%"
										cy="50%"
										innerRadius={40}
										outerRadius={70}
										paddingAngle={3}
										dataKey="value"
									>
										{regionsData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
										))}
									</Pie>
									<Tooltip 
										formatter={(val: number) => [`${val}%`, 'Дял']}
										contentStyle={{ borderRadius: 8, background: "rgba(15,23,42,0.92)", color: "#fff", border: "none" }}
										itemStyle={{ color: "#fff" }}
									/>
								</PieChart>
							</ResponsiveContainer>
							<div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-slate-500 justify-center">
								{regionsData.map((r, i) => (
									<span key={r.name} className="flex items-center gap-1">
										<span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></span>
										{r.name}
									</span>
								))}
							</div>
						</div>
					) : (
						<p className="text-sm text-slate-500">{tr.regionsEmpty}</p>
					)}
				</div>

				<div className="md:col-span-2 rounded-xl border border-sky-200/80 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/20 p-4 sm:p-5">
					<h2 className="font-semibold text-slate-900 dark:text-slate-50 mb-2 flex items-center gap-2 text-base">
						<TrendingUp size={18} className="text-sky-600 dark:text-sky-400 shrink-0" aria-hidden />
						{tr.forecastTitle}
					</h2>
					<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
						{tr.forecastIntro.replace(/\{year\}/g, String(nextYear)).replace(/\{kt\}/g, String(Math.round(forecastKt))).replace(/\{unit\}/g, profile.unitLabel ? pickL(profile.unitLabel, lang) : tr.ktShort)}
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
								.replace(/\{unit\}/g, profile.unitLabel ? pickL(profile.unitLabel, lang) : tr.ktShort)
								.replace(/\{nextYear\}/g, String(nextYear))}
						</li>
						<li>
							{tr.vsAvgDetail
								.replace(/\{avgKt\}/g, String(Math.round(outlook.avgKt)))
								.replace(/\{unit\}/g, profile.unitLabel ? pickL(profile.unitLabel, lang) : tr.ktShort)
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
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
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
			</div>

			<p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed rounded-xl border border-teal-100 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-950/15 p-4">
				{tr.disclaimer}
			</p>
		</div>
	);
}
