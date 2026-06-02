/**
 * Ориентировъчни изчисления за директни плащания (ДФЗ / ОСП ~2025).
 * Не са официални — ставките са закръглени от публично обобщени параметри.
 */

export const ILLUSTRATIVE_EUR_BGN = 1.956;

export type FarmProductionFocus =
	| "grain"
	| "mixed"
	| "horticulture"
	| "vine"
	| "livestock";

export interface SubsidyCalculatorInput {
	decares: number;
	focus: FarmProductionFocus;
	organicEco: boolean;
	youngFarmer: boolean;
	/** Млечни крави (за обвързано) — само при focus livestock */
	dairyCows?: number;
}

export interface EstimateLine {
	label: string;
	lowBgn: number;
	highBgn: number;
}

export interface SubsidyEstimateResult {
	lines: EstimateLine[];
	totalLowBgn: number;
	totalHighBgn: number;
}

function eurRangeToBgn(lowEur: number, highEur: number, hectares: number): EstimateLine {
	return {
		label: "",
		lowBgn: Math.round(lowEur * hectares * ILLUSTRATIVE_EUR_BGN),
		highBgn: Math.round(highEur * hectares * ILLUSTRATIVE_EUR_BGN),
	};
}

/** Валидира входа; при грешка връща съобщение. */
export function validateCalculatorInput(input: SubsidyCalculatorInput): string | null {
	if (!Number.isFinite(input.decares) || input.decares < 0.5) {
		return "Въведи поне 0.5 декара (минимални площи по практика са по-големи за БИСС).";
	}
	if (input.decares > 100000) {
		return "Стойността е твърде голяма за този опростен модел.";
	}
	if (input.focus === "livestock") {
		const c = input.dairyCows ?? 0;
		if (c > 50000) return "Нереалистичен брой животни.";
	}
	return null;
}

/** Ориентировъчни €/ха за БИСС по тип стопанство (опростен модел). */
const FOCUS_BISS_EUR_HA: Record<Exclude<FarmProductionFocus, "livestock">, readonly [number, number]> = {
	/** Типично зърнено / полско — базов ориентир */
	grain: [85, 90],
	/** Смесено: по-ниска средна интензивност на площта в сметката */
	mixed: [80, 86],
	/** Зеленчуци/овощия: по-високи разходи/спецификации в ориентира */
	horticulture: [92, 102],
	/** Лозя: многогодишни насаждения — друг кошник ставки в опростения модел */
	vine: [72, 84],
};

/** Ориентировъчни €/ха за ПНДП (първи до 30 ха) по фокус */
const FOCUS_PNDP_EUR_HA: Record<Exclude<FarmProductionFocus, "livestock">, readonly [number, number]> = {
	grain: [24, 26],
	mixed: [22, 25],
	horticulture: [26, 30],
	vine: [18, 23],
};

function focusLandFactor(f: FarmProductionFocus): number {
	if (f === "mixed") return 0.92;
	return 1;
}

function focusBissLabel(f: FarmProductionFocus): string {
	const tail = " — ориентир по избран тип";
	switch (f) {
		case "grain":
			return `БИСС (зърнени / полски${tail})`;
		case "mixed":
			return `БИСС (смесено стопанство${tail})`;
		case "horticulture":
			return `БИСС (зеленчуци / овощия${tail})`;
		case "vine":
			return `БИСС (лозя${tail})`;
		default:
			return `БИСС (площ${tail})`;
	}
}

function focusPndpLabel(f: FarmProductionFocus): string {
	switch (f) {
		case "grain":
			return "ПНДП за първите до 30 ха (зърнено/полско)";
		case "mixed":
			return "ПНДП за първите до 30 ха (смесено)";
		case "horticulture":
			return "ПНДП за първите до 30 ха (зеленчуци/овощия)";
		case "vine":
			return "ПНДП за първите до 30 ха (лозя)";
		default:
			return "ПНДП за първите до 30 ха";
	}
}

/**
 * Груба прогноза. Зърното ползва БИСС + ПНДП; животновъдството — обвързано при зададени крави.
 */
export function estimateSubsidy(input: SubsidyCalculatorInput): SubsidyEstimateResult {
	const ha = input.decares / 10;
	const lines: EstimateLine[] = [];

	if (input.focus === "livestock") {
		const cows = input.dairyCows ?? 0;
		if (cows >= 5) {
			lines.push({
				label: "Обвързано подпомагане — млечни крави (ориентировъчно лв/година)",
				lowBgn: cows * 250,
				highBgn: cows * 300,
			});
		} else if (cows > 0) {
			lines.push({
				label: "Обвързано по млечни крави: под 5 животни обикновено не се отчита схемата — ориентир 0 до уточнение в ДФЗ",
				lowBgn: 0,
				highBgn: 0,
			});
		} else {
			lines.push({
				label: "Животновъдство: въведи брой млечни крави (≥5) за обвързано, или ползвай чата за други животни",
				lowBgn: 0,
				highBgn: 0,
			});
		}
		if (ha >= 0.05) {
			const biss = eurRangeToBgn(82, 88, ha);
			biss.label =
				"Директни плащания върху декларирана площ (БИСС — пасища/фуражна база, ориентир)";
			lines.push(biss);
			const pndpHa = Math.min(ha, 30);
			const pndp = eurRangeToBgn(22, 25, pndpHa);
			pndp.label = "ПНДП (до 30 ха — ако отговаряш на условията)";
			lines.push(pndp);
			if (input.youngFarmer) {
				const yHa = Math.min(ha, 30);
				const yf = eurRangeToBgn(50, 60, yHa);
				yf.label = "Млад фермер върху площ (до 30 ха)";
				lines.push(yf);
			}
		}
	} else {
		const f = input.focus;
		const [bLow, bHigh] = FOCUS_BISS_EUR_HA[f];
		const [pLow, pHigh] = FOCUS_PNDP_EUR_HA[f];
		const landFactor = focusLandFactor(f);
		const effHa = ha * landFactor;

		const biss = eurRangeToBgn(bLow, bHigh, effHa);
		biss.label = focusBissLabel(f);
		lines.push(biss);

		const pndpHa = Math.min(effHa, 30);
		const pndp = eurRangeToBgn(pLow, pHigh, pndpHa);
		pndp.label = focusPndpLabel(f);
		lines.push(pndp);

		if (input.youngFarmer) {
			const yHa = Math.min(effHa, 30);
			const yf = eurRangeToBgn(50, 60, yHa);
			yf.label = "Допълнително за млад земеделски производител (до 30 ха)";
			lines.push(yf);
		}

		if (input.organicEco) {
			let lowE = 38;
			let highE = 90;
			if (input.focus === "horticulture") {
				lowE = 80;
				highE = 220;
			}
			if (input.focus === "vine") {
				lowE = 75;
				highE = 198;
			}
			if (input.focus === "mixed") {
				lowE = 42;
				highE = 100;
			}
			const ecoHa = Math.min(effHa, 30);
			const eco = eurRangeToBgn(lowE, highE, ecoHa);
			eco.label =
				"Екосхема / био ориентир (силно опростено — реалната ставка зависи от култура и методология)";
			lines.push(eco);
		}
	}

	let totalLow = 0;
	let totalHigh = 0;
	for (const L of lines) {
		totalLow += L.lowBgn;
		totalHigh += L.highBgn;
	}

	return { lines, totalLowBgn: totalLow, totalHighBgn: totalHigh };
}

export function formatShareSnippet(
	decares: number,
	lowBgn: number,
	highBgn: number,
	siteUrl: string,
): string {
	const u = siteUrl.replace(/\/$/, "");
	return `Според ориентировъчния калкулатор на AgriNexus.Law за ${decares} декара приблизителният диапазон е ${lowBgn.toLocaleString("bg-BG")}–${highBgn.toLocaleString("bg-BG")} лв/година (неофициално, без гаранция). Пробвай и ти: ${u}/kalkulator`;
}
