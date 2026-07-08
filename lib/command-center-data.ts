/**
 * Реални срокове за Кампания 2026 — директни плащания, екосхеми, данъци.
 * Източници: dfz.bg, mzh.government.bg, наредби №3/2023 и №4/2023.
 *
 * Актуализирано: юли 2026 г.
 */

import type { FarmerLocalProfile } from "./farmer-profile-storage";

export type LocalizedLine = { bg: string; en: string };

export type CommandDeadline = {
	id: string;
	dateISO: string;
	scheme: LocalizedLine;
	action: LocalizedLine;
	sourceNote: LocalizedLine;
	/** Ако deadline-ът вече е минал, пак се показва с етикет "Изтекъл" */
};

export type CommandMissingDoc = {
	id: string;
	label: LocalizedLine;
	hint: LocalizedLine;
};

/** Кампания 2026 — реални дати според официални обявления на ДФЗ и МЗХ. */
export const COMMAND_DEADLINES: CommandDeadline[] = [
	{
		id: "campaign-start",
		dateISO: "2026-03-20",
		scheme: {
			bg: "Старт на Кампания 2026 — директни плащания (ИСУН/СЕУ)",
			en: "Campaign 2026 launch — direct payments (ISUN/SEU)",
		},
		action: {
			bg: "Подай заявление в СЕУ или в Общинска служба по земеделие. От тази година НЕ се изисква КЕП — подписваш на място в ОСЗ.",
			en: "Submit via SEU or local agriculture office. No qualified electronic signature (QES) required for 2026.",
		},
		sourceNote: {
			bg: "Стартът е потвърден от МЗХ на 20.03.2026. Виж Заповед на министъра и Наредба №3/2023.",
			en: "Launch confirmed by MAF on 20 Mar 2026. See Minister's Order and Ordinance 3/2023.",
		},
	},
	{
		id: "unified-deadline",
		dateISO: "2026-06-19",
		scheme: {
			bg: "Краен срок за подаване на заявления без санкции (удължен)",
			en: "Final deadline — no penalty (extended)",
		},
		action: {
			bg: "Краен срок за подаване/редакция на заявление по директни плащания. Първоначалният срок 15 май беше удължен до 19 юни.",
			en: "Final date to submit/edit direct payment applications. Originally 15 May, extended to 19 Jun.",
		},
		sourceNote: {
			bg: "Съгласно обявление на ДФЗ от юни 2026. След тази дата — санкция 1%/ден до 9 юни (вече изтекъл).",
			en: "Per DAFS announcement June 2026. After this date: 1%/day penalty until 9 Jun (already passed).",
		},
	},
	{
		id: "eco-forms-jul",
		dateISO: "2026-07-31",
		scheme: {
			bg: "Краен срок за подаване на еко формуляри в СЕУ (Еко-ЗВПП, Еко-ПЗП, овощарство)",
			en: "Deadline for eco-scheme forms in SEU (Eco-ZVPP, Eco-PZP, orchards)",
		},
		action: {
			bg: "Подай План за управление на хранителните вещества (Еко-ЗВПП), План за паша (Еко-ПЗП) или декларация за плододаване (овощарство) в СЕУ. Приложи диплома на агроном/ветеринар.",
			en: "Submit Nutrient Management Plan (Eco-ZVPP), Grazing Plan (Eco-PZP), or fruiting declaration via SEU. Attach specialist diploma.",
		},
		sourceNote: {
			bg: "Съгласно Наредба №3/2023 и насоки на ДФЗ от 01.07.2026. Подава се само по електронен път, без КЕП.",
			en: "Per Ordinance 3/2023 and DAFS guidelines from 1 Jul 2026. Online only, no QES needed.",
		},
	},
	{
		id: "reg-check-sep",
		dateISO: "2026-09-30",
		scheme: {
			bg: "Проверка на регистрацията на стопаните — двуетапен контрол",
			en: "Farmer registration check — two-stage control",
		},
		action: {
			bg: "От тази година допустимостта се проверява двуетапно. Увери се, че регистрацията ти като земеделски стопанин е актуална към 30 септември.",
			en: "Starting this year, eligibility undergoes two-stage checks. Ensure your farmer registration is valid as of 30 Sep.",
		},
		sourceNote: {
			bg: "Промяна от Кампания 2026 — виж Наръчника за директни плащания 2026 (МЗХ, 25.03.2026).",
			en: "Change as of Campaign 2026 — see Direct Payments Handbook 2026 (MAF, 25 Mar 2026).",
		},
	},
	{
		id: "tax-jun30",
		dateISO: "2026-06-30",
		scheme: {
			bg: "Краен срок за данъчни декларации — ЕТ и земеделски стопани (НАП)",
			en: "Tax return deadline — sole traders and farmers (NRA)",
		},
		action: {
			bg: "Подай годишната данъчна декларация за доходите в НАП. Земеделските стопани, избрали този ред на облагане, подават до 30 юни.",
			en: "File annual income tax return with NRA. Farmers using this taxation regime file by 30 Jun.",
		},
		sourceNote: {
			bg: "Виж ЗДДФЛ и указания на НАП за 2026.",
			en: "See Personal Income Tax Act and NRA guidelines for 2026.",
		},
	},
	{
		id: "advance-oct",
		dateISO: "2026-10-01",
		scheme: {
			bg: "Есенни авансови плащания — очакван старт",
			en: "Autumn advance payments — expected start",
		},
		action: {
			bg: "Следи Индикативния график на ДФЗ за Кампания 2025/2026. Авансите обикновено започват от октомври.",
			en: "Watch the DAFS Indicative Schedule for Campaign 2025/2026. Advances typically start in October.",
		},
		sourceNote: {
			bg: "Индикативният график за Кампания 2025 важи до 30.06.2026. Актуален график за Кампания 2026 се очаква от МЗХ.",
			en: "Indicative Schedule for Campaign 2025 valid until 30 Jun 2026. 2026 schedule pending from MAF.",
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
