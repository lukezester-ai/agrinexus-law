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

export type YearPoint = {
	year: number;
	kt: number;
	priceBgn?: number;
	regions?: Record<string, number>;
};

export type CropProfile = {
	key: CropKey;
	chartColor: string;
	label: Localized;
	series: YearPoint[];
	genNotes: Localized;
	irrigationGeneral: Localized;
	irrigationIfDry: Localized;
	unitLabel?: Localized;
	priceUnitLabel?: Localized;
};

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

export function isDryStressLikely(series: YearPoint[], slope: number): boolean {
	if (slope < -2) return true;
	const last = series[series.length - 1]?.kt;
	const prev = series[series.length - 2]?.kt;
	if (last != null && prev != null && prev > 0 && last < prev * 0.92) return true;
	return false;
}

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
	trend_down: { bg: "отрицателен наклон в тренда", en: "negative slope in the trend" },
	trend_up: { bg: "положителен наклон в тренда", en: "positive slope in the trend" },
	dry_heuristic: { bg: "признаци за суша на база данни (рязък спад)", en: "dry-pattern heuristic (sharp drop)" },
	forecast_below_avg: { bg: "прогнозираният обем е под средното за годините", en: "forecast volume sits below the average" },
	forecast_above_avg: { bg: "прогнозираният обем е над средното за годините", en: "forecast volume sits above average" },
	high_volatility: { bg: "големи междугодишни колебания (неравна реколта)", en: "large year-to-year swings (uneven harvest)" },
};

export const OUTLOOK_FACTORS_NONE: Localized = {
	bg: "няма изразени сигнали — леки отклонения от средното; умерена картина.",
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

	const hard = dry || relSlope < -0.011 || (forecastKt < avgKt * 0.985 && pctVsLast < -1.5);
	const easy = !dry && relSlope > 0.011 && forecastKt > avgKt * 1.01 && pctVsLast >= -0.5;

	let tone: CropOutlookAnalysis["tone"];
	if (hard && !easy) tone = "headwind";
	else if (easy && !hard) tone = "tailwind";
	else tone = "mixed";

	if (factors.length === 0) tone = "mixed";

	return {
		lastYear, lastKt,
		minKt: minPt.kt, maxKt: maxPt.kt, minYear: minPt.year, maxYear: maxPt.year,
		avgKt, pctVsLast, pctVsAvg, cvSeries, factors, tone,
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
			{ year: 2021, kt: 5980, priceBgn: 350, regions: { "Добруджа": 45, "Тракия": 30, "Северозапад": 15, "Югозапад": 10 } },
			{ year: 2022, kt: 6310, priceBgn: 450, regions: { "Добруджа": 44, "Тракия": 31, "Северозапад": 14, "Югозапад": 11 } },
			{ year: 2023, kt: 6145, priceBgn: 410, regions: { "Добруджа": 46, "Тракия": 29, "Северозапад": 15, "Югозапад": 10 } },
			{ year: 2024, kt: 6420, priceBgn: 380, regions: { "Добруджа": 45, "Тракия": 30, "Северозапад": 14, "Югозапад": 11 } },
			{ year: 2025, kt: 6280, priceBgn: 390, regions: { "Добруджа": 44, "Тракия": 32, "Северозапад": 13, "Югозапад": 11 } },
		],
		genNotes: { bg: "Зърното е съсредоточено в Добруджа и Тракия.", en: "Grain is concentrated in Dobruja and Thrace." },
		irrigationGeneral: { bg: "Поливното зърнопроизводство е ограничено — преобладава сухо отглеждане.", en: "Rainfed dominates for cereals." },
		irrigationIfDry: { bg: "При засушаване: приоритет на североизточна България.", en: "In dry spells: prioritise eastern Bulgaria." },
	},
	{
		key: "sunflower",
		chartColor: "#f4b400",
		label: { bg: "Слънчоглед", en: "Sunflower" },
		unitLabel: { bg: "хил. т", en: "kt" },
		priceUnitLabel: { bg: "лв/т", en: "BGN/t" },
		series: [
			{ year: 2021, kt: 1680, priceBgn: 750, regions: { "Добруджа": 35, "Тракия": 25, "Северозапад": 22, "Югозапад": 18 } },
			{ year: 2022, kt: 1820, priceBgn: 850, regions: { "Добруджа": 36, "Тракия": 24, "Северозапад": 21, "Югозапад": 19 } },
			{ year: 2023, kt: 1755, priceBgn: 820, regions: { "Добруджа": 34, "Тракия": 26, "Северозапад": 22, "Югозапад": 18 } },
			{ year: 2024, kt: 1890, priceBgn: 780, regions: { "Добруджа": 35, "Тракия": 25, "Северозапад": 23, "Югозапад": 17 } },
			{ year: 2025, kt: 1780, priceBgn: 800, regions: { "Добруджа": 36, "Тракия": 24, "Северозапад": 22, "Югозапад": 18 } },
		],
		genNotes: { bg: "Слънчогледът е чувствителен на влага по време на цъфтеж.", en: "Sunflower is moisture-sensitive at flowering." },
		irrigationGeneral: { bg: "При напояване: поддържане на равномерна влага през цъфтеж.", en: "If irrigating: keep even moisture through flowering." },
		irrigationIfDry: { bg: "Приоритет на полета по Янтра, Осъм.", en: "Prioritise fields along Yantra, Osam corridors." },
	},
	{
		key: "maize",
		chartColor: "#e8c547",
		label: { bg: "Царевица", en: "Maize" },
		unitLabel: { bg: "хил. т", en: "kt" },
		priceUnitLabel: { bg: "лв/т", en: "BGN/t" },
		series: [
			{ year: 2021, kt: 2100, priceBgn: 380, regions: { "Тракия": 40, "Добруджа": 30, "Северозапад": 18, "Югозапад": 12 } },
			{ year: 2022, kt: 2380, priceBgn: 410, regions: { "Тракия": 41, "Добруджа": 29, "Северозапад": 17, "Югозапад": 13 } },
			{ year: 2023, kt: 2240, priceBgn: 390, regions: { "Тракия": 39, "Добруджа": 31, "Северозапад": 18, "Югозапад": 12 } },
			{ year: 2024, kt: 2510, priceBgn: 360, regions: { "Тракия": 40, "Добруджа": 30, "Северозапад": 19, "Югозапад": 11 } },
			{ year: 2025, kt: 2395, priceBgn: 375, regions: { "Тракия": 42, "Добруджа": 28, "Северозапад": 18, "Югозапад": 12 } },
		],
		genNotes: { bg: "Царевицата реагира силно на напояване.", en: "Maize responds strongly to irrigation." },
		irrigationGeneral: { bg: "Критични фази: метличистост, наливане на зърното.", en: "Critical stages: tasselling, grain fill." },
		irrigationIfDry: { bg: "Приоритет на напояваните блокове около Пловдив.", en: "Prioritise irrigated blocks around Plovdiv." },
	},
	{
		key: "tomatoes",
		chartColor: "#ef4444",
		label: { bg: "Домати", en: "Tomatoes" },
		unitLabel: { bg: "хил. т", en: "kt" },
		priceUnitLabel: { bg: "лв/т", en: "BGN/t" },
		series: [
			{ year: 2021, kt: 168, priceBgn: 1200, regions: { "Пловдив": 35, "Хасково": 28, "Пазарджик": 20, "Други": 17 } },
			{ year: 2022, kt: 182, priceBgn: 1400, regions: { "Пловдив": 36, "Хасково": 27, "Пазарджик": 19, "Други": 18 } },
			{ year: 2023, kt: 155, priceBgn: 1350, regions: { "Пловдив": 34, "Хасково": 29, "Пазарджик": 20, "Други": 17 } },
			{ year: 2024, kt: 191, priceBgn: 1150, regions: { "Пловдив": 35, "Хасково": 28, "Пазарджик": 21, "Други": 16 } },
			{ year: 2025, kt: 172, priceBgn: 1250, regions: { "Пловдив": 37, "Хасково": 26, "Пазарджик": 20, "Други": 17 } },
		],
		genNotes: { bg: "Доматите са концентрирани в Южна България.", en: "Tomatoes cluster in southern Bulgaria." },
		irrigationGeneral: { bg: "Капково и торонапояване е стандарт.", en: "Drip + fertigation is standard." },
		irrigationIfDry: { bg: "Мониторинг на ранните полета в Хасково.", en: "Monitor early fields in Haskovo." },
	},
	{
		key: "grapes",
		chartColor: "#a855f7",
		label: { bg: "Грозде (вино и десертно)", en: "Grapes" },
		unitLabel: { bg: "хил. т", en: "kt" },
		priceUnitLabel: { bg: "лв/т", en: "BGN/t" },
		series: [
			{ year: 2021, kt: 1180, priceBgn: 650, regions: { "Южен централен": 30, "Югоизточен": 25, "Северен": 24, "Югозападен": 21 } },
			{ year: 2022, kt: 1245, priceBgn: 700, regions: { "Южен централен": 31, "Югоизточен": 24, "Северен": 23, "Югозападен": 22 } },
			{ year: 2023, kt: 1095, priceBgn: 680, regions: { "Южен централен": 29, "Югоизточен": 26, "Северен": 24, "Югозападен": 21 } },
			{ year: 2024, kt: 1270, priceBgn: 620, regions: { "Южен централен": 30, "Югоизточен": 25, "Северен": 25, "Югозападен": 20 } },
			{ year: 2025, kt: 1140, priceBgn: 670, regions: { "Южен централен": 32, "Югоизточен": 24, "Северен": 23, "Югозападен": 21 } },
		],
		genNotes: { bg: "Гроздопроизводството варира с пролетни слани и летни горещини.", en: "Grape harvest varies with spring frost and summer heat." },
		irrigationGeneral: { bg: "Управление на короната и водния стрес преди гроздобер.", en: "Manage canopy and water stress before harvest." },
		irrigationIfDry: { bg: "Мелник, Пловдив —可能需要 дефицитно напояване.", en: "Melnik, Plovdiv subregions may need deficit irrigation." },
	},
	{
		key: "apples",
		chartColor: "#22c55e",
		label: { bg: "Ябълки", en: "Apples" },
		unitLabel: { bg: "хил. т", en: "kt" },
		priceUnitLabel: { bg: "лв/т", en: "BGN/t" },
		series: [
			{ year: 2021, kt: 62, priceBgn: 900, regions: { "Пловдив": 40, "Кюстендил": 30, "Родопи": 18, "Други": 12 } },
			{ year: 2022, kt: 68, priceBgn: 1000, regions: { "Пловдив": 41, "Кюстендил": 29, "Родопи": 17, "Други": 13 } },
			{ year: 2023, kt: 59, priceBgn: 950, regions: { "Пловдив": 39, "Кюстендил": 31, "Родопи": 18, "Други": 12 } },
			{ year: 2024, kt: 71, priceBgn: 850, regions: { "Пловдив": 40, "Кюстендил": 30, "Родопи": 19, "Други": 11 } },
			{ year: 2025, kt: 64, priceBgn: 920, regions: { "Пловдив": 42, "Кюстендил": 28, "Родопи": 18, "Други": 12 } },
		],
		genNotes: { bg: "Овощните градини са локализирани в Пловдив и Родопите.", en: "Orchards are localised in Plovdiv, Rhodopes." },
		irrigationGeneral: { bg: "Капково по контур; критични периоди цъфтеж.", en: "Drip along contour; critical periods flowering." },
		irrigationIfDry: { bg: "Високопланинските участъци без язовири са уязвими.", en: "Upland pockets without reservoir access are vulnerable." },
	},
	{
		key: "rapeseed",
		chartColor: "#fcd34d",
		label: { bg: "Рапица", en: "Rapeseed" },
		unitLabel: { bg: "хил. т", en: "kt" },
		priceUnitLabel: { bg: "лв/т", en: "BGN/t" },
		series: [
			{ year: 2021, kt: 380, priceBgn: 800, regions: { "Добруджа": 40, "Тракия": 25, "Северозапад": 20, "Югозапад": 15 } },
			{ year: 2022, kt: 420, priceBgn: 950, regions: { "Добруджа": 41, "Тракия": 24, "Северозапад": 19, "Югозапад": 16 } },
			{ year: 2023, kt: 360, priceBgn: 900, regions: { "Добруджа": 39, "Тракия": 26, "Северозапад": 20, "Югозапад": 15 } },
			{ year: 2024, kt: 450, priceBgn: 750, regions: { "Добруджа": 40, "Тракия": 25, "Северозапад": 21, "Югозапад": 14 } },
			{ year: 2025, kt: 390, priceBgn: 820, regions: { "Добруджа": 42, "Тракия": 23, "Северозапад": 20, "Югозапад": 15 } },
		],
		genNotes: { bg: "Ключова експортна култура с висока вариативност на добива.", en: "Key export crop with high yield volatility." },
		irrigationGeneral: { bg: "Рядко се напоява, разчита на зимно-пролетна влага.", en: "Rarely irrigated, relies on winter/spring moisture." },
		irrigationIfDry: { bg: "Силно уязвима при сухи есени — затруднено поникване.", en: "Highly vulnerable in dry autumns, hindering emergence." },
	},
	{
		key: "lavender",
		chartColor: "#d8b4e2",
		label: { bg: "Лавандула", en: "Lavender" },
		unitLabel: { bg: "хил. т", en: "kt" },
		priceUnitLabel: { bg: "лв/кг", en: "BGN/kg" },
		series: [
			{ year: 2021, kt: 35, priceBgn: 85, regions: { "Пловдив": 30, "Старозагорско": 25, "Пазарджик": 20, "Други": 25 } },
			{ year: 2022, kt: 42, priceBgn: 90, regions: { "Пловдив": 31, "Старозагорско": 24, "Пазарджик": 19, "Други": 26 } },
			{ year: 2023, kt: 38, priceBgn: 75, regions: { "Пловдив": 29, "Старозагорско": 26, "Пазарджик": 20, "Други": 25 } },
			{ year: 2024, kt: 50, priceBgn: 50, regions: { "Пловдив": 30, "Старозагорско": 25, "Пазарджик": 21, "Други": 24 } },
			{ year: 2025, kt: 45, priceBgn: 60, regions: { "Пловдив": 32, "Старозагорско": 23, "Пазарджик": 20, "Други": 25 } },
		],
		genNotes: { bg: "България е световен лидер, но пазарът често е пренаситен.", en: "Bulgaria is a global leader, but market often oversupplies." },
		irrigationGeneral: { bg: "Силно устойчива на суша култура.", en: "Highly drought-resistant crop." },
		irrigationIfDry: { bg: "Издържа на суша по-добре от повечето култури.", en: "Withstands drought better than most crops." },
	},
	{
		key: "rose",
		chartColor: "#fecdd3",
		label: { bg: "Маслодайна роза", en: "Oil-bearing Rose" },
		unitLabel: { bg: "хил. т", en: "kt" },
		priceUnitLabel: { bg: "лв/кг", en: "BGN/kg" },
		series: [
			{ year: 2021, kt: 12, priceBgn: 3.5, regions: { "Карловско": 40, "Казанлъшко": 35, "Стремска долина": 15, "Други": 10 } },
			{ year: 2022, kt: 14, priceBgn: 4.0, regions: { "Карловско": 41, "Казанлъшко": 34, "Стремска долина": 14, "Други": 11 } },
			{ year: 2023, kt: 11, priceBgn: 3.8, regions: { "Карловско": 39, "Казанлъшко": 36, "Стремска долина": 15, "Други": 10 } },
			{ year: 2024, kt: 15, priceBgn: 4.2, regions: { "Карловско": 40, "Казанлъшко": 35, "Стремска долина": 14, "Други": 11 } },
			{ year: 2025, kt: 13, priceBgn: 4.5, regions: { "Карловско": 42, "Казанлъшко": 33, "Стремска долина": 15, "Други": 10 } },
		],
		genNotes: { bg: "Традиционен сектор в Розовата долина със специфични изисквания за беритба.", en: "Traditional sector in Rose Valley with specific harvesting needs." },
		irrigationGeneral: { bg: "Често капково напояване.", en: "Often drip-irrigated." },
		irrigationIfDry: { bg: "Сушата по време на цъфтеж драстично намалява добива на масло.", en: "Drought during flowering drastically reduces oil yield." },
	},
	{
		key: "cow_milk",
		chartColor: "#cbd5e1",
		label: { bg: "Краве мляко", en: "Cow Milk" },
		unitLabel: { bg: "млн. л", en: "mln. L" },
		priceUnitLabel: { bg: "лв/л", en: "BGN/L" },
		series: [
			{ year: 2021, kt: 850, priceBgn: 0.70, regions: { "Южен централен": 28, "Северен": 25, "Югоизточен": 24, "Югозападен": 23 } },
			{ year: 2022, kt: 820, priceBgn: 1.05, regions: { "Южен централен": 29, "Северен": 24, "Югоизточен": 25, "Югозападен": 22 } },
			{ year: 2023, kt: 790, priceBgn: 0.95, regions: { "Южен централен": 27, "Северен": 26, "Югоизточен": 24, "Югозападен": 23 } },
			{ year: 2024, kt: 770, priceBgn: 0.90, regions: { "Южен централен": 28, "Северен": 25, "Югоизточен": 25, "Югозападен": 22 } },
			{ year: 2025, kt: 760, priceBgn: 0.92, regions: { "Южен централен": 30, "Северен": 24, "Югоизточен": 24, "Югозападен": 22 } },
		],
		genNotes: { bg: "Тенденция на концентрация в по-големи ферми.", en: "Trend of concentration in larger farms." },
		irrigationGeneral: { bg: "Водата е критична за пасища и хигиена.", en: "Water is critical for pastures and hygiene." },
		irrigationIfDry: { bg: "Сушата увеличава фуражните разходи.", en: "Drought increases feed costs." },
	},
];
