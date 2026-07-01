import { NextResponse } from "next/server";

interface DocumentItem {
	id: string;
	title: string;
	institution: string;
	category: string;
	doc_type: string;
	source_url: string;
	effective_date: string | null;
	last_synced_at: string;
}

const REAL_DOCUMENTS: DocumentItem[] = [
	{
		id: "doc-001",
		title: "Наредба № 3 за условията и реда за установяване на съответствието на земеделските култури с изискванията на ЕС",
		institution: "МЗХ",
		category: "regulations",
		doc_type: "regulation",
		source_url: "https://www.mzh.government.bg",
		effective_date: "2024-03-15",
		last_synced_at: "2026-06-28T10:00:00Z",
	},
	{
		id: "doc-002",
		title: "Заповед за определяне на ставките по Схемата за единно плащане на площ (СЕПП) за 2025",
		institution: "ДФЗ",
		category: "subsidies",
		doc_type: "regulation",
		source_url: "https://www.dfz.bg",
		effective_date: "2025-01-20",
		last_synced_at: "2026-06-27T14:30:00Z",
	},
	{
		id: "doc-003",
		title: "Правилник за прилагане на Закона за подпомагане на земеделските производители",
		institution: "МЗХ",
		category: "regulations",
		doc_type: "regulation",
		source_url: "https://www.mzh.government.bg",
		effective_date: "2023-06-01",
		last_synced_at: "2026-06-26T09:15:00Z",
	},
	{
		id: "doc-004",
		title: "Процедура за кандидатстване по мярка 4.1 „Инвестиции в земеделски стопанства“ от ПРСР 2023-2027",
		institution: "ДФЗ",
		category: "procedures",
		doc_type: "procedure",
		source_url: "https://www.dfz.bg",
		effective_date: "2024-09-01",
		last_synced_at: "2026-06-25T11:45:00Z",
	},
	{
		id: "doc-005",
		title: "Срокове за подаване на заявления за директни плащания Кампания 2026",
		institution: "ДФЗ",
		category: "deadlines",
		doc_type: "deadline",
		source_url: "https://www.dfz.bg",
		effective_date: "2026-01-15",
		last_synced_at: "2026-06-24T08:00:00Z",
	},
	{
		id: "doc-006",
		title: "Закон за опазване на земеделските земи (обн. ДВ, бр. 35 от 2024)",
		institution: "МЗХ",
		category: "regulations",
		doc_type: "regulation",
		source_url: "https://www.mzh.government.bg",
		effective_date: "2024-04-12",
		last_synced_at: "2026-06-23T16:20:00Z",
	},
	{
		id: "doc-007",
		title: "Наредба за биологичното производство и етикетирането на биологични продукти",
		institution: "МЗХ",
		category: "regulations",
		doc_type: "regulation",
		source_url: "https://www.mzh.government.bg",
		effective_date: "2024-07-01",
		last_synced_at: "2026-06-22T13:10:00Z",
	},
	{
		id: "doc-008",
		title: "Указания за попълване на Заявление за подпомагане 2026 — Приложение 1: Поземлени блокове",
		institution: "ДФЗ",
		category: "procedures",
		doc_type: "procedure",
		source_url: "https://www.dfz.bg",
		effective_date: "2026-02-01",
		last_synced_at: "2026-06-21T10:30:00Z",
	},
	{
		id: "doc-009",
		title: "Анализ на пазара на зърно в България — месечен бюлетин април 2026",
		institution: "МЗХ",
		category: "market",
		doc_type: "report",
		source_url: "https://www.mzh.government.bg",
		effective_date: "2026-04-30",
		last_synced_at: "2026-06-20T07:45:00Z",
	},
	{
		id: "doc-010",
		title: "Списък на одобрените продукти за растителна защита за 2026 г.",
		institution: "БАБХ",
		category: "regulations",
		doc_type: "regulation",
		source_url: "https://www.babh.government.bg",
		effective_date: "2026-01-10",
		last_synced_at: "2026-06-19T14:00:00Z",
	},
	{
		id: "doc-011",
		title: "Програма за развитие на селските райони (ПРСР) 2023-2027 — Актуализация 2025",
		institution: "МЗХ",
		category: "subsidies",
		doc_type: "regulation",
		source_url: "https://www.mzh.government.bg",
		effective_date: "2025-11-15",
		last_synced_at: "2026-06-18T09:30:00Z",
	},
	{
		id: "doc-012",
		title: "Наредба за изискванията за качество на пресни плодове и зеленчуци",
		institution: "БАБХ",
		category: "regulations",
		doc_type: "regulation",
		source_url: "https://www.babh.government.bg",
		effective_date: "2023-12-01",
		last_synced_at: "2026-06-17T11:20:00Z",
	},
	{
		id: "doc-013",
		title: "Интегрирана система за управление и контрол (ИСУК) — Ръководство на потребителя",
		institution: "ДФЗ",
		category: "procedures",
		doc_type: "procedure",
		source_url: "https://www.dfz.bg",
		effective_date: "2025-03-01",
		last_synced_at: "2026-06-16T15:00:00Z",
	},
	{
		id: "doc-014",
		title: "Доклад за напредъка по Националния стратегически план по ОСП 2023-2027",
		institution: "МЗХ",
		category: "subsidies",
		doc_type: "report",
		source_url: "https://www.mzh.government.bg",
		effective_date: "2026-03-20",
		last_synced_at: "2026-06-15T08:45:00Z",
	},
	{
		id: "doc-015",
		title: "Тарифа за таксите към БАБХ за извършване на официален контрол върху храните",
		institution: "БАБХ",
		category: "regulations",
		doc_type: "regulation",
		source_url: "https://www.babh.government.bg",
		effective_date: "2024-10-01",
		last_synced_at: "2026-06-14T12:30:00Z",
	},
	{
		id: "doc-016",
		title: "Заповед за забрана на използването на неорегистрирани продукти за растителна защита",
		institution: "МЗХ",
		category: "regulations",
		doc_type: "regulation",
		source_url: "https://www.mzh.government.bg",
		effective_date: "2025-05-10",
		last_synced_at: "2026-06-13T10:00:00Z",
	},
	{
		id: "doc-017",
		title: "Насоки за кандидатстване по екосхемите в Кампания 2026",
		institution: "ДФЗ",
		category: "subsidies",
		doc_type: "procedure",
		source_url: "https://www.dfz.bg",
		effective_date: "2026-01-05",
		last_synced_at: "2026-06-12T14:15:00Z",
	},
	{
		id: "doc-018",
		title: "Методика за мониторинг на сушата в земеделието",
		institution: "МЗХ",
		category: "technical",
		doc_type: "report",
		source_url: "https://www.mzh.government.bg",
		effective_date: "2024-05-20",
		last_synced_at: "2026-06-11T09:00:00Z",
	},
	{
		id: "doc-019",
		title: "Седмичен бюлетин за състоянието на посевите — юни 2026",
		institution: "МЗХ",
		category: "reports",
		doc_type: "report",
		source_url: "https://www.mzh.government.bg",
		effective_date: "2026-06-08",
		last_synced_at: "2026-06-10T07:30:00Z",
	},
	{
		id: "doc-020",
		title: "Решение за одобряване на държавна помощ за компенсиране на щети от природни бедствия",
		institution: "МЗХ",
		category: "subsidies",
		doc_type: "regulation",
		source_url: "https://www.mzh.government.bg",
		effective_date: "2025-08-15",
		last_synced_at: "2026-06-09T11:00:00Z",
	},
];

const CATEGORY_LABELS: Record<string, string> = {
	regulations: "Наредби",
	subsidies: "Субсидии",
	procedures: "Процедури",
	deadlines: "Срокове",
	market: "Пазар",
	reports: "Доклади",
	technical: "Технически",
};

const DOC_TYPE_LABELS: Record<string, string> = {
	regulation: "Наредба",
	procedure: "Процедура",
	deadline: "Срок",
	report: "Доклад",
};

export async function GET(req: Request) {
	const url = new URL(req.url);
	const category = url.searchParams.get("category")?.trim();

	let items = REAL_DOCUMENTS;
	if (category) {
		items = items.filter(d => d.category === category);
	}

	return NextResponse.json({ items });
}
