/**
 * Единна таксономия за категории и типове документи (ingest, търсене, RAG, UI).
 */
import type { KnowledgeDoc } from "./knowledge-types";

export type DocType = KnowledgeDoc["type"];

export type TaxonomyCategoryId =
	| "subsidies"
	| "direct-payments"
	| "eco-schemes"
	| "linked-payments"
	| "regulations"
	| "eu-regulations"
	| "procedures"
	| "deadlines"
	| "conditionality"
	| "bio"
	| "certificates"
	| "plant-protection"
	| "forms";

export type TaxonomyCategory = {
	id: TaxonomyCategoryId;
	label: string;
	/** Стойности в KnowledgeDoc.category и ingest */
	aliases: string[];
	searchHints: string[];
	preferredTypes: DocType[];
};

export const TAXONOMY: TaxonomyCategory[] = [
	{
		id: "direct-payments",
		label: "Директни плащания",
		aliases: ["Директни плащания", "Субсидии", "Директни плащания и схеми"],
		searchHints: ["бисс", "пшеница", "директни", "площ", "хектар"],
		preferredTypes: ["scheme"],
	},
	{
		id: "eco-schemes",
		label: "Екосхеми",
		aliases: ["Екосхеми", "Екологични схеми"],
		searchHints: ["екосхем", "разнообраз", "пасища", "покривни"],
		preferredTypes: ["scheme"],
	},
	{
		id: "linked-payments",
		label: "Обвързани плащания",
		aliases: ["Обвързани плащания", "Обвързана подкрепа"],
		searchHints: ["обвързан", "животновъд", "плодове", "зеленчук"],
		preferredTypes: ["scheme"],
	},
	{
		id: "subsidies",
		label: "Субсидии",
		aliases: ["Субсидии", "Подпомагане", "ОСП"],
		searchHints: ["субсид", "подпомаган", "плащан", "осп"],
		preferredTypes: ["scheme"],
	},
	{
		id: "regulations",
		label: "Нормативни актове",
		aliases: ["Нормативни актове", "Закони", "Наредби"],
		searchHints: ["наредб", "закон", "условност", "gaec"],
		preferredTypes: ["regulation"],
	},
	{
		id: "eu-regulations",
		label: "ЕС регламенти",
		aliases: ["ЕС регламенти", "EUR-Lex", "Регламент (ЕС)"],
		searchHints: ["eur-lex", "регламент (ес)", "комисия"],
		preferredTypes: ["regulation"],
	},
	{
		id: "procedures",
		label: "Процедури",
		aliases: ["Процедури", "Административни процедури"],
		searchHints: ["исак", "кеп", "пик", "подаван", "заявлен"],
		preferredTypes: ["procedure"],
	},
	{
		id: "deadlines",
		label: "Срокове",
		aliases: ["Срокове", "Крайни срокове"],
		searchHints: ["срок", "краен", "кампания", "май", "юни"],
		preferredTypes: ["deadline"],
	},
	{
		id: "conditionality",
		label: "Условност",
		aliases: ["Условност", "GAEC", "SMR"],
		searchHints: ["условност", "gaec", "smr", "кръстосано"],
		preferredTypes: ["regulation"],
	},
	{
		id: "bio",
		label: "Био производство",
		aliases: ["Био производство", "Биологично"],
		searchHints: ["био", "органич", "сертификат био"],
		preferredTypes: ["regulation", "procedure"],
	},
	{
		id: "certificates",
		label: "Сертификати",
		aliases: ["Сертификати", "GlobalG.A.P."],
		searchHints: ["сертификат", "globalgap", "контрол"],
		preferredTypes: ["procedure"],
	},
	{
		id: "plant-protection",
		label: "Растителна защита",
		aliases: ["Растителна защита", "ПРЗ"],
		searchHints: ["препарат", "бабх", "фитосанитар"],
		preferredTypes: ["regulation", "procedure"],
	},
	{
		id: "forms",
		label: "Образци",
		aliases: ["Образци", "Формуляри", "Бланки"],
		searchHints: ["образец", "форма", "приложение", "бланка"],
		preferredTypes: ["procedure"],
	},
];

const aliasToCategory = new Map<string, TaxonomyCategory>();
for (const cat of TAXONOMY) {
	for (const a of cat.aliases) {
		aliasToCategory.set(a.toLowerCase(), cat);
	}
}

export function normalizeDocCategory(raw: string | null | undefined): TaxonomyCategory | null {
	if (!raw?.trim()) return null;
	return aliasToCategory.get(raw.trim().toLowerCase()) ?? null;
}

export function categoryMatchesFilter(
	doc: Pick<KnowledgeDoc, "category" | "type" | "title" | "content" | "keywords">,
	filterCategory: string,
): boolean {
	if (!filterCategory || filterCategory === "all") return true;
	const norm = normalizeDocCategory(doc.category);
	if (norm && (norm.label === filterCategory || norm.id === filterCategory)) return true;
	if (doc.category === filterCategory) return true;
	const tax = TAXONOMY.find((t) => t.id === filterCategory || t.label === filterCategory);
	if (!tax) return doc.category === filterCategory;
	const hay = `${doc.title} ${doc.content} ${doc.keywords.join(" ")}`.toLowerCase();
	return (
		tax.aliases.some((a) => doc.category.toLowerCase() === a.toLowerCase()) ||
		tax.searchHints.some((h) => hay.includes(h))
	);
}

/** Класифицира неетикетиран текст (ingest / chunk). */
export function classifyDocumentFromText(input: {
	title: string;
	content?: string;
	institution?: string;
	docType?: string;
}): { category: string; type: DocType } {
	const hay = `${input.title} ${input.content ?? ""} ${input.institution ?? ""}`.toLowerCase();
	let type: DocType = "regulation";
	if (input.docType === "scheme" || /схем|бисс|площ|подпомаган/i.test(hay)) type = "scheme";
	else if (input.docType === "procedure" || /процедур|исак|заявлен|образец/i.test(hay)) type = "procedure";
	else if (/срок|краен|до \d{1,2}\./i.test(hay)) type = "deadline";

	for (const cat of TAXONOMY) {
		if (cat.searchHints.some((h) => hay.includes(h))) {
			return { category: cat.label, type };
		}
	}
	if (/дфз|директн|плащан/i.test(hay)) return { category: "Директни плащания", type };
	if (/eur|ес регламент/i.test(hay)) return { category: "ЕС регламенти", type };
	if (/мзх|наредб/i.test(hay)) return { category: "Нормативни актове", type };
	return { category: input.institution?.includes("ДФЗ") ? "Субсидии" : "Нормативни актове", type };
}

export type SortableDoc = Pick<KnowledgeDoc, "id" | "title" | "category" | "type" | "effectiveDate"> & {
	score?: number;
};

/** Сортиране: релевантност → тип (срок > процедура > схема) → дата. */
export function sortDocuments(
	docs: SortableDoc[],
	mode: "relevance" | "date_desc" | "date_asc" = "relevance",
): SortableDoc[] {
	const typeRank: Record<DocType, number> = {
		deadline: 4,
		procedure: 3,
		scheme: 2,
		regulation: 1,
	};
	return [...docs].sort((a, b) => {
		if (mode === "date_desc") return b.effectiveDate.localeCompare(a.effectiveDate);
		if (mode === "date_asc") return a.effectiveDate.localeCompare(b.effectiveDate);
		const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
		if (Math.abs(scoreDiff) > 0.01) return scoreDiff;
		const tr = typeRank[b.type] - typeRank[a.type];
		if (tr !== 0) return tr;
		return b.effectiveDate.localeCompare(a.effectiveDate);
	});
}

export function formatTaxonomyForRag(): string {
	const lines = TAXONOMY.map(
		(c) =>
			`- ${c.label} (типове: ${c.preferredTypes.join(", ")}) — също: ${c.aliases.slice(1).join(", ") || "—"}`,
	);
	return [
		"=== ТАКСОНОМИЯ НА ДОКУМЕНТИ (сортиране и класификация) ===",
		"Типове: scheme (схема/субсидия), regulation (наредба/закон), procedure (процедура/образец), deadline (срок).",
		"При отговор групирай по категория, после по тип; спешните срокове — първи.",
		lines.join("\n"),
	].join("\n");
}

/** Карти на началната страница → категория за търсене. */
export const HOME_CATEGORY_SEARCH: {
	title: string;
	subtitle: string;
	searchQuery: string;
	filterCategory: string;
}[] = [
	{ title: "Субсидии", subtitle: "директни плащания, интервенции, ставки", searchQuery: "директни плащания субсидии ОСП", filterCategory: "Директни плащания" },
	{ title: "Закони", subtitle: "наредби, регламенти и изисквания", searchQuery: "наредби регламенти условност", filterCategory: "Нормативни актове" },
	{ title: "Сертификати", subtitle: "био, GlobalG.A.P. и документи", searchQuery: "сертификат GlobalG.A.P. био", filterCategory: "Сертификати" },
	{ title: "Био производство", subtitle: "контрол, дневници и преход", searchQuery: "биологично производство дневници", filterCategory: "Био производство" },
	{ title: "Растителна защита", subtitle: "препарати, ограничения, срокове", searchQuery: "растителна защита БАБХ препарати", filterCategory: "Растителна защита" },
	{ title: "ЕС регламенти", subtitle: "EUR-Lex и ОСП рамка", searchQuery: "ЕС регламент ОСП EUR-Lex", filterCategory: "ЕС регламенти" },
	{ title: "Образци", subtitle: "форми, заявления, приложения", searchQuery: "образец заявление приложение", filterCategory: "Процедури" },
	{ title: "Калкулатори", subtitle: "площи, добиви, субсидии", searchQuery: "калкулатор субсидии площ", filterCategory: "Директни плащания" },
];
