/**
 * Ориентировъчни срокове и правила за „Твоите срокове“.
 * Реална продукция: синхронизация с официални обявления на ДФЗ / ИСУН.
 */

import type { FarmerLocalProfile } from "./farmer-profile-storage";

export type LocalizedLine = { bg: string; en: string };

export type CommandDeadline = {
	id: string;
	dateISO: string;
	scheme: LocalizedLine;
	action: LocalizedLine;
	sourceNote: LocalizedLine;
};

export type CommandMissingDoc = {
	id: string;
	label: LocalizedLine;
	hint: LocalizedLine;
};

/** Кампания 2026 — датите са ориентир (не правно обвързващи). */
export const COMMAND_DEADLINES: CommandDeadline[] = [
	{
		id: "campaign-window-mar",
		dateISO: "2026-03-01",
		scheme: {
			bg: "Отваряне на прозорец за електронни заявления (ИСУН) — типично около началото на март",
			en: "E-application window opens (ISUN) — often around early March",
		},
		action: {
			bg: "Провери актуалната заповед за кампанията: кога точно стартира приемът, кои мерки са активни и какви приложения се изискват.",
			en: "Check the campaign order: exact opening dates, active measures, and required annexes.",
		},
		sourceNote: {
			bg: "Датата е ориентир; реалният старт идва от заповед на министъра и обявление на ДФЗ.",
			en: "Indicative date; the real start follows the ministerial order and DAFS notices.",
		},
	},
	{
		id: "unified-may15",
		dateISO: "2026-05-15",
		scheme: {
			bg: "Единно заявление — директни плащания и мерки (ИСУН)",
			en: "Single application — direct payments and measures (ISUN)",
		},
		action: {
			bg: "Подай или актуализирай заявлението до тази дата (без намаление за закъснение).",
			en: "Submit or update your application by this date (standard window).",
		},
		sourceNote: {
			bg: "Провери актуалната заповед и приложенията на www.dfz.bg за текущата кампания.",
			en: "Verify the current DAFS order and annexes on the official portal for the active campaign.",
		},
	},
	{
		id: "late-jun9",
		dateISO: "2026-06-09",
		scheme: {
			bg: "Късно подаване с намаление",
			en: "Late submission with reduction",
		},
		action: {
			bg: "Последен ден за подаване с намаление на плащанията (ориентир).",
			en: "Last day for late filing with payment reduction (indicative).",
		},
		sourceNote: {
			bg: "Сроковете се променят по заповед — не разчитай само на този екран.",
			en: "Deadlines change by order — do not rely on this screen alone.",
		},
	},
	{
		id: "advance-oct",
		dateISO: "2026-10-01",
		scheme: {
			bg: "Есенни авансови плащания (ако са обявени)",
			en: "Autumn advance payments (if announced)",
		},
		action: {
			bg: "Следи обявление за аванс — подготви липсващите документи предварително.",
			en: "Watch for the advance notice — prepare missing documents early.",
		},
		sourceNote: {
			bg: "ДФЗ публикува графика на авансовете по кампания.",
			en: "DAFS publishes the advance schedule per campaign.",
		},
	},
];

function pick<T extends LocalizedLine>(line: T, lang: "bg" | "en"): string {
	if (lang === "en") return line.en;
	return line.bg;
}

export function getActiveDeadlines(now = new Date()): CommandDeadline[] {
	const t = now.getTime();
	return [...COMMAND_DEADLINES].filter(d => {
		const end = new Date(d.dateISO + "T23:59:59").getTime();
		return end >= t - 86400000 * 2;
	});
}

export function formatDeadlineHeadline(d: CommandDeadline, lang: "bg" | "en"): string {
	const date = new Date(d.dateISO);
	const loc = lang === "en" ? "en-GB" : "bg-BG";
	const when = date.toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" });
	if (lang === "bg") return `До ${when}: ${pick(d.scheme, lang)}`;
	return `By ${when}: ${pick(d.scheme, lang)}`;
}

export function getMissingDocuments(profile: FarmerLocalProfile): CommandMissingDoc[] {
	const out: CommandMissingDoc[] = [];
	const dec = Number(String(profile.decares).replace(",", "."));
	const hasArea = Number.isFinite(dec) && dec > 0;

	if (hasArea && !profile.hasLandRightsDoc) {
		out.push({
			id: "land",
			label: {
				bg: "Липсва ти документ за право на ползване на земята (договор наем / аренда / документ за собственост).",
				en: "You are missing land use / tenure proof (lease, rental contract, or ownership document).",
			},
			hint: {
				bg: "Без него е възможен отказ или корекция при проверка за съответствие.",
				en: "Without it you may face refusal or corrections in compliance checks.",
			},
		});
	}

	if (hasArea && !profile.hasBankAccountVerified) {
		out.push({
			id: "bank",
			label: {
				bg: "Липсва потвърждение за банкова сметка за плащания от ДФЗ.",
				en: "Missing confirmation of the bank account for DAFS payments.",
			},
			hint: {
				bg: "Провери ИСУН и потвърди сметката за плащания от ДФЗ с банката си.",
				en: "Check ISUN and confirm your payment account with your bank.",
			},
		});
	}

	if (profile.declaresOrganic && !profile.hasOrganicCertificate) {
		out.push({
			id: "organic-cert",
			label: {
				bg: "Липсва валиден био сертификат при декларирана екосхема / био.",
				en: "Valid organic certificate is missing while organic / eco-scheme is declared.",
			},
			hint: {
				bg: "Възможен е отказ на плащане или допълнителна проверка — уточни с консултант.",
				en: "Payment refusal or extra verification is possible — confirm with an adviser.",
			},
		});
	}

	return out;
}

export function line(lang: "bg" | "en", L: LocalizedLine): string {
	return pick(L, lang);
}
