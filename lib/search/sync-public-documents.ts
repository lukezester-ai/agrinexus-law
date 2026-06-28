/**
 * Синхронизира ingest-нати public_documents към Meilisearch за лексикално търсене.
 * Typesense learning колекцията остава отделна (видеа/уроци).
 */
import { getSupabaseAdmin } from "@/lib/supabase";
import type { KnowledgeDoc } from "@/lib/knowledge/knowledge-types";
import {
	PUBLIC_DOC_ID_PREFIX,
} from "@/lib/knowledge/public-documents-search";
import { isMeiliConfigured, upsertKnowledgeDocsToMeili } from "@/lib/meilisearch";

type PublicRow = {
	id: string;
	title: string;
	institution: string | null;
	category: string | null;
	doc_type: string | null;
	status: string | null;
	source_url: string | null;
	effective_date: string | null;
};

function rowToKnowledgeDoc(row: PublicRow): KnowledgeDoc {
	const category = row.category?.trim() || "Нормативни актове";
	const type =
		row.doc_type === "scheme" ||
		row.doc_type === "regulation" ||
		row.doc_type === "procedure" ||
		row.doc_type === "deadline" ||
		row.doc_type === "pdf"
			? row.doc_type
			: "pdf";

	return {
		id: `${PUBLIC_DOC_ID_PREFIX}${row.id}`,
		title: row.title,
		category,
		type,
		content: [
			row.title,
			`Институция: ${row.institution ?? "—"}`,
			`Категория: ${category}`,
			`Статус: ${row.status ?? "active"}`,
		].join("\n"),
		keywords: [row.institution ?? "", category, type].filter(Boolean),
		source: row.institution ?? "Държавен архив",
		effectiveDate: row.effective_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
		sourceUrl: row.source_url ?? undefined,
	};
}

export type ArchiveSearchSyncResult = {
	engine: "meili" | "none";
	synced: number;
	skipped: boolean;
	reason?: string;
};

/** Upsert на последните public_documents в Meili (ако е конфигуриран). */
export async function syncPublicDocumentsToSearchIndex(
	limit = 200,
): Promise<ArchiveSearchSyncResult> {
	if (!isMeiliConfigured()) {
		return { engine: "none", synced: 0, skipped: true, reason: "MEILI_HOST not set" };
	}

	const supabase = getSupabaseAdmin();
	if (!supabase) {
		return { engine: "none", synced: 0, skipped: true, reason: "Supabase admin missing" };
	}

	const safeLimit = Math.min(Math.max(limit, 1), 500);
	const { data, error } = await supabase
		.from("public_documents")
		.select("id,title,institution,category,doc_type,status,source_url,effective_date")
		.eq("status", "active")
		.order("last_synced_at", { ascending: false })
		.limit(safeLimit);

	if (error) {
		throw new Error(`syncPublicDocuments: ${error.message}`);
	}

	const docs = ((data ?? []) as PublicRow[]).map(rowToKnowledgeDoc);
	if (docs.length === 0) {
		return { engine: "meili", synced: 0, skipped: false };
	}

	await upsertKnowledgeDocsToMeili(docs);
	return { engine: "meili", synced: docs.length, skipped: false };
}
