import { NextResponse } from "next/server";
import { CROP_PROFILES, pickL } from "@/lib/crop-statistics-data";

const KNOWLEDGE_NOTES: Record<string, { bg: string; en: string }> = {
	subsidies: {
		bg: "По Схемата за единно плащане на площ (СЕПП) фермерите получават базово подпомагане от около 80 евро/ха. Допълнително — екосхеми и обвързана подкрепа за протеинови култури, плодове и зеленчуци.",
		en: "Under the Single Area Payment Scheme (SAPS) farmers receive ~€80/ha. Top-ups via eco-schemes and coupled support for protein crops, fruit & vegetables.",
	},
	insurance: {
		bg: "Земеделските производители могат да застраховат реколтата си чрез Националния гаранционен фонд (НГФ) и частни застрахователи. Премиите се субсидират до 50% от държавата.",
		en: "Farmers can insure crops via the National Guarantee Fund (NGF) and private insurers. Premiums are subsidised up to 50% by the state.",
	},
	regulations: {
		bg: "Българското законодателство изисква всички земеделски стопани да регистрират парцелите си в Системата за идентификация на земеделските парцели (СИЗП). Спазване на директивите на ЕС за нитрати и растителна защита.",
		en: "Bulgarian law requires all farmers to register parcels in the LPIS system. Compliance with EU Nitrates and Plant Protection directives is mandatory.",
	},
	prices: {
		bg: "Цените на зърното се формират на борсите CBOT (Чикаго) и MATIF (Париж). Българските производители са ценополучатели — световните цени диктуват местните.",
		en: "Grain prices are set on CBOT (Chicago) and MATIF (Paris). Bulgarian producers are price-takers — global prices dictate local ones.",
	},
	climate: {
		bg: "Изменението на климата води към по-чести екстремни явления — засушавания, наводнения и градушки. Южна България е особено уязвима на топлинен стрес.",
		en: "Climate change leads to more frequent extremes — droughts, floods, hail. Southern Bulgaria is especially vulnerable to heat stress.",
	},
	export: {
		bg: "България изнася основно пшеница, царевица, слънчоглед и рапица. Основни пазари: ЕС, Турция, Египет, Либия. Износът на зърно през 2024 г. надхвърли 5 млн. тона.",
		en: "Bulgaria mainly exports wheat, maize, sunflower and rapeseed. Key markets: EU, Turkey, Egypt, Libya. Grain exports exceeded 5 million tonnes in 2024.",
	},
};

const CROP_INSIGHT_TAGS: Record<string, string[]> = {
	wheat_barley: ["subsidies", "prices", "export", "climate"],
	sunflower: ["subsidies", "prices", "export", "climate"],
	maize: ["subsidies", "prices", "export", "climate"],
	tomatoes: ["subsidies", "insurance", "regulations", "climate"],
	grapes: ["subsidies", "insurance", "climate"],
	apples: ["subsidies", "insurance", "climate"],
	rapeseed: ["subsidies", "prices", "export"],
	lavender: ["subsidies", "prices", "export"],
	rose: ["subsidies", "prices", "export"],
	cow_milk: ["subsidies", "regulations", "prices"],
};

export async function POST(req: Request) {
	try {
		const body = (await req.json()) as { query?: string };
		const query = (body.query || "").trim();
		if (!query) {
			return NextResponse.json({ error: "Липсва заявка." }, { status: 400 });
		}

		const matchedCrop = (Object.keys(CROP_INSIGHT_TAGS) as string[]).find(
			key => query.toLowerCase().includes(key) || query.toLowerCase().includes(pickL(CROP_PROFILES.find(c => c.key === key)?.label ?? { bg: "", en: "" }, "bg").toLowerCase())
		);

		const tags = matchedCrop ? CROP_INSIGHT_TAGS[matchedCrop] : ["subsidies", "prices", "climate"];

		const insights = tags.slice(0, 4).map(tag => ({
			title: tag === "subsidies" ? "Субсидии и подпомагане" :
				tag === "insurance" ? "Застраховане" :
				tag === "regulations" ? "Регулации" :
				tag === "prices" ? "Ценообразуване" :
				tag === "export" ? "Износ" : "Климат",
			source: tag === "subsidies" ? "ДФЗ / CAP 2023-2027" :
				tag === "insurance" ? "НГФ / МЗХ" :
				tag === "regulations" ? "МЗХ / ЕС директиви" :
				tag === "prices" ? "CBOT / MATIF" :
				tag === "export" ? "МЗХ / НСИ" : "МОСВ / НИМХ",
			snippet: KNOWLEDGE_NOTES[tag]?.bg ?? "",
		}));

		return NextResponse.json({
			ok: true,
			mode: "bm25",
			insights,
		});
	} catch (error) {
		console.error("Statistiki insights error:", error);
		return NextResponse.json(
			{ error: "Грешка при генериране на контекст." },
			{ status: 500 },
		);
	}
}
