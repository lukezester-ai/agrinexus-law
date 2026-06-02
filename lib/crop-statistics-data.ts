export type CropStatsLang = "bg" | "en";

export type Localized = { bg: string; en: string };

export type CropKey =
	| "wheat_barley"
	| "sunflower"
	| "maize"
	| "tomatoes"
	| "grapes"
	| "apples"
	| "rapeseed"
	| "lavender"
	| "rose"
	| "cow_milk";

export function pickL(t: Localized, lang: CropStatsLang): string {
	if (lang === "bg") return t.bg;
	return t.en;
}

/** Production in thousand tonnes (хил. т) — илюстративни стойности за демо графика. */
export type YearPoint = { 
	year: number; 
	kt: number;
	priceBgn?: number; // Средна изкупна цена (лв./тон)
	regions?: Record<string, number>; // Разпределение по региони в %
};

export type CropProfile = {
	key: CropKey;
	chartColor: string;
	label: Localized;
	/** Fallback демо данни */
	series: YearPoint[];
	genNotes: Localized;
	irrigationGeneral: Localized;
	irrigationIfDry: Localized;
	unitLabel?: Localized;
	priceUnitLabel?: Localized;
};

/** Линейна регресия y = a + b·year → прогноза за следващата година */
export function forecastProductionKt(series: YearPoint[]): {
	nextYear: number;
	forecastKt: number;
	slopeKtPerYear: number;
	intercept: number;
} {
	const ys = series.map(p => p.year);
	const vs = series.map(p => p.kt);
	const n = ys.length;
	let sx = 0, sy = 0, sxx = 0, sxy = 0;
	for (let i = 0; i < n; i++) {
		sx += ys[i];
		sy += vs[i];
		sxx += ys[i] * ys[i];
		sxy += ys[i] * vs[i];
	}
	const den = n * sxx - sx * sx;
	const b = den === 0 ? 0 : (n * sxy - sx * sy) / den;
	const a = (sy - b * sx) / n;
	const nextYear = ys[n - 1] + 1;
	const forecastKt = Math.max(0, a + b * nextYear);
	return { nextYear, forecastKt, slopeKtPerYear: b, intercept: a };
}

/** Хевристика: „суха“ година ако наклонът е отрицателен или последният добив е с >8% под предходния */
export function isDryStressLikely(series: YearPoint[], slope: number): boolean {
	if (slope < -2) return true;
	const last = series[series.length - 1]?.kt;
	const prev = series[series.length - 2]?.kt;
	if (last != null && prev != null && prev > 0 && last < prev * 0.92) return true;
	return false;
}

/** Коефициент на вариация σ/μ по серията kt — колко „рискова“ е година спрямо година. */
export function coefficientOfVariationKt(values: number[]): number {
	if (values.length < 2) return 0;
	const mean = values.reduce((a, b) => a + b, 0) / values.length;
	if (mean === 0) return 0;
	const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
	return Math.sqrt(variance) / mean;
}

export type OutlookFactor =
	| "trend_down"
	| "trend_up"
	| "dry_heuristic"
	| "forecast_below_avg"
	| "forecast_above_avg"
	| "high_volatility";

export const OUTLOOK_FACTOR_LABELS: Record<OutlookFactor, Localized> = {
	trend_down: {
		bg: "отрицателен наклон на тенденцията",
		en: "negative slope in the trend",
	},
	trend_up: {
		bg: "положителен наклон на тенденцията",
		en: "positive slope in the trend",
	},
	dry_heuristic: {
		bg: "сигнал за суша по евристика (рязък спад)",
		en: "dry-pattern heuristic (sharp drop)",
	},
	forecast_below_avg: {
		bg: "прогнозният обем е под средното на годините в серията",
		en: "forecast volume sits below the average",
	},
	forecast_above_avg: {
		bg: "прогнозният обем е над средното на годините",
		en: "forecast volume sits above average",
	},
	high_volatility: {
		bg: "големи колебания между годините (непостоянен добив)",
		en: "large year-to-year swings (uneven harvest)",
	},
};

export const OUTLOOK_FACTORS_NONE: Localized = {
	bg: "няма отделни сигнали извън малки отклонения от средното — картината е умерена.",
	en: "no standout signals beyond small deviations from average — a moderate picture.",
};

export type CropOutlookAnalysis = {
	lastYear: number;
	lastKt: number;
	minKt: number;
	maxKt: number;
	minYear: number;
	maxYear: number;
	avgKt: number;
	pctVsLast: number;
	pctVsAvg: number;
	cvSeries: number;
	factors: OutlookFactor[];
	tone: "headwind" | "tailwind" | "mixed";
};

export function analyzeCropOutlook(
	series: YearPoint[],
	slopeKtPerYear: number,
	forecastKt: number,
	dry: boolean,
): CropOutlookAnalysis {
	if (!series || series.length === 0) {
		return { lastYear: 0, lastKt: 0, minKt: 0, maxKt: 0, minYear: 0, maxYear: 0, avgKt: 0, pctVsLast: 0, pctVsAvg: 0, cvSeries: 0, factors: [], tone: "mixed" };
	}
	const n = series.length;
	const last = series[n - 1];
	const lastKt = last.kt;
	const lastYear = last.year;
	const kts = series.map(p => p.kt);
	const avgKt = kts.reduce((a, b) => a + b, 0) / n;
	const pctVsLast = lastKt === 0 ? 0 : ((forecastKt - lastKt) / lastKt) * 100;
	const pctVsAvg = avgKt === 0 ? 0 : ((forecastKt - avgKt) / avgKt) * 100;
	const cvSeries = coefficientOfVariationKt(kts);

	let minPt = series[0];
	let maxPt = series[0];
	for (const p of series) {
		if (p.kt < minPt.kt) minPt = p;
		if (p.kt > maxPt.kt) maxPt = p;
	}

	const relSlope = avgKt > 0 ? slopeKtPerYear / avgKt : 0;

	const factors: OutlookFactor[] = [];
	if (relSlope < -0.007) factors.push("trend_down");
	if (relSlope > 0.007) factors.push("trend_up");
	if (dry) factors.push("dry_heuristic");
	if (forecastKt < avgKt * 0.988) factors.push("forecast_below_avg");
	if (forecastKt > avgKt * 1.012) factors.push("forecast_above_avg");
	if (cvSeries > 0.055) factors.push("high_volatility");

	const hard =
		dry ||
		relSlope < -0.011 ||
		(forecastKt < avgKt * 0.985 && pctVsLast < -1.5);
	const easy =
		!dry &&
		relSlope > 0.011 &&
		forecastKt > avgKt * 1.01 &&
		pctVsLast >= -0.5;

	let tone: CropOutlookAnalysis["tone"];
	if (hard && !easy) tone = "headwind";
	else if (easy && !hard) tone = "tailwind";
	else tone = "mixed";

	if (factors.length === 0) tone = "mixed";

	return {
		lastYear,
		lastKt,
		minKt: minPt.kt,
		maxKt: maxPt.kt,
		minYear: minPt.year,
		maxYear: maxPt.year,
		avgKt,
		pctVsLast,
		pctVsAvg,
		cvSeries,
		factors,
		tone,
	};
}

export const CROP_PROFILES: CropProfile[] = [
	{
		key: "wheat_barley",
		chartColor: "#c9a227",
		label: { bg: "Пшеница и ечемик", en: "Wheat & barley" },
		unitLabel: { bg: "хил. т", en: "kt" },
		priceUnitLabel: { bg: "лв/т", en: "BGN/t" },
		series: [
			{ year: 2021, kt: 5980, priceBgn: 350 },
			{ year: 2022, kt: 6310, priceBgn: 450 },
			{ year: 2023, kt: 6145, priceBgn: 410 },
			{ year: 2024, kt: 6420, priceBgn: 380 },
			{ year: 2025, kt: 6280, priceBgn: 390 },
		],
		genNotes: { bg: "Зърното доминира в Добруджа и горнотракийската низина.", en: "Grain is concentrated in Dobruja and Thrace." },
		irrigationGeneral: { bg: "При зърнено обикновено се разчита на валежи.", en: "Rainfed dominates for cereals." },
		irrigationIfDry: { bg: "При суша: приоритет на напояване в Източна България.", en: "In dry spells: prioritise eastern Bulgaria." },
	},
	{
		key: "sunflower",
		chartColor: "#f4b400",
		label: { bg: "Слънчоглед", en: "Sunflower" },
		unitLabel: { bg: "хил. т", en: "kt" },
		priceUnitLabel: { bg: "лв/т", en: "BGN/t" },
		series: [
			{ year: 2021, kt: 1680, priceBgn: 750 },
			{ year: 2022, kt: 1820, priceBgn: 850 },
			{ year: 2023, kt: 1755, priceBgn: 820 },
			{ year: 2024, kt: 1890, priceBgn: 780 },
			{ year: 2025, kt: 1780, priceBgn: 800 },
		],
		genNotes: { bg: "Слънчогледът е чувствителен на влага при цъфтеж.", en: "Sunflower is moisture-sensitive at flowering." },
		irrigationGeneral: { bg: "При напояване: равномерна влага по време на цъфтеж.", en: "If irrigating: keep even moisture through flowering." },
		irrigationIfDry: { bg: "Подпомагане на инвазионни полета по Янтра, Осъм.", en: "Prioritise fields along Yantra, Osam corridors." },
	},
	{
		key: "maize",
		chartColor: "#e8c547",
		label: { bg: "Царевица", en: "Maize" },
		unitLabel: { bg: "хил. т", en: "kt" },
		priceUnitLabel: { bg: "лв/т", en: "BGN/t" },
		series: [
			{ year: 2021, kt: 2100, priceBgn: 380 },
			{ year: 2022, kt: 2380, priceBgn: 410 },
			{ year: 2023, kt: 2240, priceBgn: 390 },
			{ year: 2024, kt: 2510, priceBgn: 360 },
			{ year: 2025, kt: 2395, priceBgn: 375 },
		],
		genNotes: { bg: "Царевицата отговаря силно на напояване.", en: "Maize responds strongly to irrigation." },
		irrigationGeneral: { bg: "Критични фази: метличина, наливане на зърно.", en: "Critical stages: tasselling, grain fill." },
		irrigationIfDry: { bg: "Приоритет на напоителни масиви в Пловдивско.", en: "Prioritise irrigated blocks around Plovdiv." },
	},
	{
		key: "tomatoes",
		chartColor: "#ef4444",
		label: { bg: "Домати", en: "Tomatoes" },
		unitLabel: { bg: "хил. т", en: "kt" },
		priceUnitLabel: { bg: "лв/т", en: "BGN/t" },
		series: [
			{ year: 2021, kt: 168, priceBgn: 1200 },
			{ year: 2022, kt: 182, priceBgn: 1400 },
			{ year: 2023, kt: 155, priceBgn: 1350 },
			{ year: 2024, kt: 191, priceBgn: 1150 },
			{ year: 2025, kt: 172, priceBgn: 1250 },
		],
		genNotes: { bg: "Доматите са концентрирани в Южна България.", en: "Tomatoes cluster in southern Bulgaria." },
		irrigationGeneral: { bg: "Капково и фертигация са стандарт.", en: "Drip + fertigation is standard." },
		irrigationIfDry: { bg: "Най-уязвими са ранните полета в Хасковско.", en: "Monitor early fields in Haskovo." },
	},
	{
		key: "grapes",
		chartColor: "#a855f7",
		label: { bg: "Грозде (вино и маса)", en: "Grapes" },
		unitLabel: { bg: "хил. т", en: "kt" },
		priceUnitLabel: { bg: "лв/т", en: "BGN/t" },
		series: [
			{ year: 2021, kt: 1180, priceBgn: 650 },
			{ year: 2022, kt: 1245, priceBgn: 700 },
			{ year: 2023, kt: 1095, priceBgn: 680 },
			{ year: 2024, kt: 1270, priceBgn: 620 },
			{ year: 2025, kt: 1140, priceBgn: 670 },
		],
		genNotes: { bg: "Гроздето варира с пролетни слани и летни горещини.", en: "Grape harvest varies with spring frost and summer heat." },
		irrigationGeneral: { bg: "Контрол на вегетацията преди беритба.", en: "Manage canopy and water stress before harvest." },
		irrigationIfDry: { bg: "Мелник, Пловдивско изискват подпомагане.", en: "Melnik, Plovdiv subregions may need deficit irrigation." },
	},
	{
		key: "apples",
		chartColor: "#22c55e",
		label: { bg: "Ябълки", en: "Apples" },
		unitLabel: { bg: "хил. т", en: "kt" },
		priceUnitLabel: { bg: "лв/т", en: "BGN/t" },
		series: [
			{ year: 2021, kt: 62, priceBgn: 900 },
			{ year: 2022, kt: 68, priceBgn: 1000 },
			{ year: 2023, kt: 59, priceBgn: 950 },
			{ year: 2024, kt: 71, priceBgn: 850 },
			{ year: 2025, kt: 64, priceBgn: 920 },
		],
		genNotes: { bg: "Овощарството е локализирано в Пловдивско, Родопите.", en: "Orchards are localised in Plovdiv, Rhodopes." },
		irrigationGeneral: { bg: "Капково на контура; критични периоди цъфтеж.", en: "Drip along contour; critical periods flowering." },
		irrigationIfDry: { bg: "По-нагорни райони без язовирна вода са уязвими.", en: "Upland pockets without reservoir access are vulnerable." },
	},
	{
		key: "rapeseed",
		chartColor: "#fcd34d",
		label: { bg: "Рапица", en: "Rapeseed" },
		unitLabel: { bg: "хил. т", en: "kt" },
		priceUnitLabel: { bg: "лв/т", en: "BGN/t" },
		series: [
			{ year: 2021, kt: 380, priceBgn: 800 },
			{ year: 2022, kt: 420, priceBgn: 950 },
			{ year: 2023, kt: 360, priceBgn: 900 },
			{ year: 2024, kt: 450, priceBgn: 750 },
			{ year: 2025, kt: 390, priceBgn: 820 },
		],
		genNotes: { bg: "Основна експортна култура с висока волатилност на добивите.", en: "Key export crop with high yield volatility." },
		irrigationGeneral: { bg: "Рядко се напоява, разчита се на зимна/пролетна влага.", en: "Rarely irrigated, relies on winter/spring moisture." },
		irrigationIfDry: { bg: "Силно уязвима при суха есен, което пречи на поникването.", en: "Highly vulnerable in dry autumns, hindering emergence." },
	},
	{
		key: "lavender",
		chartColor: "#d8b4e2",
		label: { bg: "Лавандула", en: "Lavender" },
		unitLabel: { bg: "хил. т", en: "kt" },
		priceUnitLabel: { bg: "лв/кг", en: "BGN/kg" },
		series: [
			{ year: 2021, kt: 35, priceBgn: 85 },
			{ year: 2022, kt: 42, priceBgn: 90 },
			{ year: 2023, kt: 38, priceBgn: 75 },
			{ year: 2024, kt: 50, priceBgn: 50 },
			{ year: 2025, kt: 45, priceBgn: 60 },
		],
		genNotes: { bg: "България е световен лидер, но пазарът често се пренасища.", en: "Bulgaria is a global leader, but market often oversupplies." },
		irrigationGeneral: { bg: "Силно сухоустойчива култура.", en: "Highly drought-resistant crop." },
		irrigationIfDry: { bg: "Издържа на суша по-добре от повечето култури.", en: "Withstands drought better than most crops." },
	},
	{
		key: "rose",
		chartColor: "#fecdd3",
		label: { bg: "Маслодайна роза", en: "Oil-bearing Rose" },
		unitLabel: { bg: "хил. т", en: "kt" },
		priceUnitLabel: { bg: "лв/кг", en: "BGN/kg" },
		series: [
			{ year: 2021, kt: 12, priceBgn: 3.5 },
			{ year: 2022, kt: 14, priceBgn: 4.0 },
			{ year: 2023, kt: 11, priceBgn: 3.8 },
			{ year: 2024, kt: 15, priceBgn: 4.2 },
			{ year: 2025, kt: 13, priceBgn: 4.5 },
		],
		genNotes: { bg: "Традиционен сектор в Розовата долина със специфични изисквания за бране.", en: "Traditional sector in Rose Valley with specific harvesting needs." },
		irrigationGeneral: { bg: "Често се напоява капково.", en: "Often drip-irrigated." },
		irrigationIfDry: { bg: "Сушата по време на цъфтеж драстично намалява добива на масло.", en: "Drought during flowering drastically reduces oil yield." },
	},
	{
		key: "cow_milk",
		chartColor: "#cbd5e1",
		label: { bg: "Краве мляко", en: "Cow Milk" },
		unitLabel: { bg: "млн. л.", en: "mln. L" },
		priceUnitLabel: { bg: "лв/л", en: "BGN/L" },
		series: [
			{ year: 2021, kt: 850, priceBgn: 0.70 },
			{ year: 2022, kt: 820, priceBgn: 1.05 },
			{ year: 2023, kt: 790, priceBgn: 0.95 },
			{ year: 2024, kt: 770, priceBgn: 0.90 },
			{ year: 2025, kt: 760, priceBgn: 0.92 },
		],
		genNotes: { bg: "Тенденция на концентрация в по-големи ферми.", en: "Trend of concentration in larger farms." },
		irrigationGeneral: { bg: "Водата е критична за пасищата и хигиената.", en: "Water is critical for pastures and hygiene." },
		irrigationIfDry: { bg: "Сушата увеличава разходите за фураж.", en: "Drought increases feed costs." },
	},
];
