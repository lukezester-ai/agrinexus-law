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
		if (c > 0 && c < 5) {
			return "За обвързано по млечни крави обикновено се изискват минимум 5 животни — уточни бройката или остави 0 за общ ориентир.";
		}
		if (c > 50000) return "Нереалистичен брой животни.";
	}
	return null;
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
		} else {
			lines.push({
				label: "Животновъдство без достатъчен брой крави за автоматична сметка — попитай Виктория или Елена в чата за твоя случай",
				lowBgn: 0,
				highBgn: 0,
			});
		}
		if (ha >= 0.05) {
			const biss = eurRangeToBgn(85, 90, ha);
			biss.label =
				"Директни плащания върху декларирана площ (БИСС — ако кандидатстваш за площ)";
			lines.push(biss);
			const pndpHa = Math.min(ha, 30);
			const pndp = eurRangeToBgn(24, 26, pndpHa);
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
		const landFactor =
			input.focus === "mixed"
				? 0.92
				: input.focus === "horticulture"
					? 1
					: input.focus === "vine"
						? 1
						: 1;
		const effHa = ha * landFactor;

		const biss = eurRangeToBgn(85, 90, effHa);
		biss.label = "БИСС (директно подпомагане на хектар — ориентир)";
		lines.push(biss);

		const pndpHa = Math.min(effHa, 30);
		const pndp = eurRangeToBgn(24, 26, pndpHa);
		pndp.label = "ПНДП за първите до 30 ха";
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
