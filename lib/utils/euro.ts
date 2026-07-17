/**
 * Официални помощни функции и константи за въвеждането на Еврото (€ / EUR)
 * като разплащателна единица в Република България и двойното обозначаване на суми
 * (съгласно Закона за въвеждане на еврото в Република България и фиксирания курс на БНБ).
 */

/**
 * Официален неотменим фиксиран курс на българския лев към еврото
 * (1 EUR = 1.95583 BGN съгласно Регламент (ЕО) № 2866/98 и Закона за БНБ).
 */
export const EUR_BGN_RATE = 1.95583;

/**
 * Преобразува сума от Лева (BGN) в Евро (EUR) по официалния курс и закръгля до 2 знака след десетичната запетая (центове).
 */
export function bgnToEur(bgn: number): number {
	if (!Number.isFinite(bgn)) return 0;
	return Math.round((bgn / EUR_BGN_RATE) * 100) / 100;
}

/**
 * Преобразува сума от Евро (EUR) в Лева (BGN) по официалния курс и закръгля до 2 знака след десетичната запетая (стотинки).
 */
export function eurToBgn(eur: number): number {
	if (!Number.isFinite(eur)) return 0;
	return Math.round((eur * EUR_BGN_RATE) * 100) / 100;
}

/**
 * Форматира сума съгласно изискванията за двойно обозначаване (Dual Display)
 * или единична валута (EUR / BGN).
 * 
 * @param amount Сума в основната валута (по подразбиране BGN или EUR в зависимост от fromCurrency)
 * @param mode "DUAL_EUR_PRIMARY" (550.66 € / 1 077.00 лв.), "DUAL_BGN_PRIMARY" (1 077.00 лв. / 550.66 €), "EUR", или "BGN"
 * @param fromCurrency Валутата, в която е подадена входната сума amount ("BGN" или "EUR", по подразбиране "BGN")
 */
export function formatEuroCurrency(
	amount: number,
	mode: "DUAL_EUR_PRIMARY" | "DUAL_BGN_PRIMARY" | "EUR" | "BGN" = "DUAL_EUR_PRIMARY",
	fromCurrency: "BGN" | "EUR" = "BGN"
): string {
	if (!Number.isFinite(amount)) return mode.includes("EUR") ? "0.00 €" : "0.00 лв.";

	const bgnVal = fromCurrency === "BGN" ? amount : eurToBgn(amount);
	const eurVal = fromCurrency === "EUR" ? amount : bgnToEur(amount);

	const bgnStr = `${bgnVal.toFixed(2)} лв.`;
	const eurStr = `${eurVal.toFixed(2)} €`;

	switch (mode) {
		case "EUR":
			return eurStr;
		case "BGN":
			return bgnStr;
		case "DUAL_BGN_PRIMARY":
			return `${bgnStr} (${eurStr})`;
		case "DUAL_EUR_PRIMARY":
		default:
			return `${eurStr} (${bgnStr})`;
	}
}

/**
 * Бърз помощник за форматиране на заплата/цена, въведена в лева, към задължително двойно обозначаване в Евро.
 */
export function formatDual(amountBgn: number): string {
	return formatEuroCurrency(amountBgn, "DUAL_EUR_PRIMARY", "BGN");
}
