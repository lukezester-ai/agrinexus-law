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
	Cell,
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#a855f7", "#ec4899"];

const STRINGS: Record<CropStatsLang, any> = {
	bg: {
		title: "Статистика на реколтата от основни култури в България",
		subtitle: "Интерактивни статистики, цени и анализ на тенденциите. Избери култура и период по-долу.",
		pickCrop: "Избери култура",
		yAxisKt: "хил. т / млн. л",
		yAxisPrice: "Цена (лв.)",
		ktShort: "обем",
		priceShort: "цена",
		legendHarvest: "Реколта/Обем",
		legendTrend: "Линеен тренд",
		legendPrice: "Ср. пазарна цена",
		yearLabel: "Година",
		forecastTitle: "Прогноза за следващата година",
		forecastIntro: "Илюстративна точкова прогноза за {year}: около {kt} {unit} от линейния тренд.",
		compareHeading: "Сравнения в серията",
		vsLastDetail: "Спрямо последната година в графиката ({year}: {lastKt} {unit}), трендът предполага {pctSigned} за {nextYear}.",
		vsAvgDetail: "Спрямо средното (~{avgKt} {unit}): около {pctSigned}.",
		rangeDetail: "В обхвата: мин. {minKt} ({minYear}), макс. {maxKt} ({maxYear}).",
		outlookHeadwind: "Четене на модела: очаквай по-трудна планова година главно поради: {reasons}.",
		outlookTailwind: "Четене на модела: обемите изглеждат относително подкрепящи защото: {reasons}.",
		outlookMixed: "Четене на модела: смесени сигнали — особено: {reasons}.",
		irrigationTitle: "Специфики и поливен режим",
		dryBadge: "Суша",
		dryLead: "При засушаване:",
		normalLead: "Типичен сезон:",
		normalIrrigationExtra: "Напояването често е допълващо; наблюдавай песъчливите почви и долините.",
		disclaimer: "Всички цифри са визуализации. За официална отчетност използвайте НСИ, Евростат.",
		langLabel: "Език",
		period5: "5 години",
		period10: "10 години",
		regionsTitle: "Регионално разпределение (%)",
		regionsEmpty: "Няма регионални данни.",
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
		outlookHeadwind: "Reading of the model: expect a harder planning year mainly because: {reasons}.",
		outlookTailwind: "Reading of the model: volumes look relatively supportive because: {reasons}.",
		outlookMixed: "Reading of the model: mixed signals — notably: {reasons}.",
		irrigationTitle: "Specifics & Vulnerabilities",
		dryBadge: "Dry risk",
		dryLead: "Dry-pattern emphasis:",
		normalLead: "Typical season:",
		normalIrrigationExtra: "Irrigation is often supplemental; monitor sandy soils and valley frost pockets first.",
		disclaimer: "All figures are visualizations. For official reporting use NSI, Eurostat.",
		langLabel: "Language",
		period5: "Last 5 yrs",
		period10: "Last 10 yrs",
		regionsTitle: "Regional Breakdown (%)",
		regionsEmpty: "No regional data available.",
	},
};

function buildChartRows(profile: CropProfile, yearsCount: number) {
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

	const askAiHref = lang === "bg"
		? `/?chatQ=${encodeURIComponent(`Анализирай реколтата от ${pickL(profile.label, "bg")} в България. Рискове, субсидии, срокове.`)}#chat`
		: `/?chatQ=${encodeURIComponent(`Make a short analysis for ${pickL(profile.label, "en")} in Bulgaria. Include risks, subsidies, and deadlines.`)}#chat`;

	const outlookNarrative =
		outlook.tone === "headwind"
			? tr.outlookHeadwind.replace("{reasons}", outlookReasons)
			: outlook.tone === "tailwind"
				? tr.outlookTailwind.replace("{reasons}", outlookReasons)
				: tr.outlookMixed.replace("{reasons}", outlookReasons);

	return (
		<div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex items-start gap-3 min-w-0">
					<div className="w-11 h-11 rounded-xl bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center text-teal-800 dark:text-teal-300 shrink-0 border border-teal-200 dark:border-teal-800">
						{isLoadingData ? <Loader2 className="animate-spin" size={22} /> : <BarChart3 size={22} />}
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
					<div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden mr-2">
						<button onClick={() => setYearsCount(5)} className={`px-3 py-1.5 text-xs font-medium transition ${yearsCount === 5 ? "bg-slate-800 text-white" : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
							{tr.period5}
						</button>
						<button onClick={() => setYearsCount(10)} className={`px-3 py-1.5 text-xs font-medium transition ${yearsCount === 10 ? "bg-slate-800 text-white" : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
							{tr.period10}
						</button>
					</div>
					<div className="flex rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
						<button onClick={() => setLang("bg")} className={`px-3 py-1.5 text-xs font-medium transition ${lang === "bg" ? "bg-emerald-600 text-white" : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>BG</button>
						<button onClick={() => setLang("en")} className={`px-3 py-1.5 text-xs font-medium transition ${lang === "en" ? "bg-emerald-600 text-white" : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>EN</button>
					</div>
				</div>
			</div>

			<div>
				<div className="flex flex-wrap gap-2">
					{profiles.map(c => (
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
								contentStyle={{ background: "rgba(15,23,42,0.92)", border: "1px solid rgba(45,212,191,0.35)", borderRadius: 8 }}
								labelStyle={{ color: "#e2e8f0" }}
								formatter={(value: unknown, name: unknown) => {
									const n = typeof value === "number" ? value : Number(value);
									if (value == null || Number.isNaN(n)) return ["—", String(name)];
									const unit = name === "actual" || name === "fit"
										? (profile.unitLabel ? pickL(profile.unitLabel, lang) : tr.ktShort)
										: (profile.priceUnitLabel ? pickL(profile.priceUnitLabel, lang) : "BGN");
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
					<h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-4 w-full flex items-center gap-2">
						<MapPin size={16} className="text-teal-500" /> {tr.regionsTitle}
					</h3>
					{regionsData.length > 0 ? (
						<div className="w-full h-[180px]">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={regionsData}
										cx="50%" cy="50%"
										innerRadius={40} outerRadius={70}
										paddingAngle={3}
										dataKey="value"
									>
										{regionsData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
										))}
									</Pie>
									<Tooltip
										formatter={(val: number) => [`${val}%`, "Дял"]}
										contentStyle={{ borderRadius: 8, background: "rgba(15,23,42,0.92)", color: "#fff", border: "none" }}
										itemStyle={{ color: "#fff" }}
									/>
								</PieChart>
							</ResponsiveContainer>
							<div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-slate-500 justify-center">
								{regionsData.map((r, i) => (
									<span key={r.name} className="flex items-center gap-1">
										<span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
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
					<p className={`text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-3 border-l-[3px] mb-3 ${
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
				<div className={`rounded-xl border p-4 sm:p-5 ${
					dry
						? "border-orange-300/80 dark:border-orange-900/50 bg-orange-50/60 dark:bg-orange-950/25"
						: "border-teal-200/80 dark:border-teal-900/50 bg-teal-50/40 dark:bg-teal-950/20"
				}`}>
					<h2 className="font-semibold text-slate-900 dark:text-slate-50 mb-2 flex flex-wrap items-center gap-2 text-base">
						<Droplets size={18} className={dry ? "text-orange-600 dark:text-orange-400" : "text-teal-600 dark:text-teal-400"} aria-hidden />
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
				</div>

				<div className="rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 sm:p-5">
					<div className="flex items-center justify-between gap-3 mb-2">
						<h2 className="font-semibold text-slate-900 dark:text-slate-50 text-base">
							{lang === "bg" ? "Контекст за културата" : "Context for this crop"}
						</h2>
						<Link
							href={askAiHref}
							className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 transition">
							{lang === "bg" ? "Питай AI" : "Ask AI"}
						</Link>
					</div>
					<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
						{lang === "bg"
							? "Използвай AI чата за анализ на културата — рискове, субсидии, пазарни тенденции."
							: "Use the AI chat for crop analysis — risks, subsidies, market trends."}
					</p>
				</div>
			</div>

			<p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed rounded-xl border border-teal-100 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-950/15 p-4">
				{tr.disclaimer}
			</p>
		</div>
	);
}
