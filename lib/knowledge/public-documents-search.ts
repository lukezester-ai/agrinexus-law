/**
 * Търсене в ingest-нати public_documents (Supabase) → KnowledgeDoc за UI/RAG merge.
 */
import { getSupabaseAdmin } from "@/lib/supabase";
import type { KnowledgeDoc } from "./knowledge-types";
import { classifyDocumentFromText } from "./document-taxonomy";

export const PUBLIC_DOC_ID_PREFIX = "pub-";

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
	const classified = classifyDocumentFromText({
		title: row.title,
		institution: row.institution ?? undefined,
		docType: row.doc_type ?? undefined,
	});
	const category = row.category?.trim() || classified.category;
	const type =
		row.doc_type === "scheme" ||
		row.doc_type === "regulation" ||
		row.doc_type === "procedure" ||
		row.doc_type === "deadline" ||
		row.doc_type === "video" ||
		row.doc_type === "pdf" ||
		row.doc_type === "lesson"
			? row.doc_type
			: classified.type;

	return {
		id: `${PUBLIC_DOC_ID_PREFIX}${row.id}`,
		title: row.title,
		category,
		type,
		content: [
			`Институция: ${row.institution ?? "—"}`,
			`Статус: ${row.status ?? "активен"}`,
			`Оригинал: ${row.source_url ?? "—"}`,
		].join("\n"),
		keywords: [row.institution ?? "", category, type, row.status ?? ""].filter(Boolean),
		source: row.institution ?? "Държавен документ",
		effectiveDate: row.effective_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
		sourceUrl: row.source_url ?? undefined,
	};
}

export function isPublicDocumentId(id: string): boolean {
	return id.startsWith(PUBLIC_DOC_ID_PREFIX);
}

export function publicDocumentUuidFromId(id: string): string | null {
	if (!isPublicDocumentId(id)) return null;
	return id.slice(PUBLIC_DOC_ID_PREFIX.length);
}

/** BM25-подобно търсене в заглавия/категории на public_documents. */
export async function searchPublicDocuments(
	query: string,
	limit = 12,
): Promise<KnowledgeDoc[]> {
	const supabase = getSupabaseAdmin();
	if (!supabase) return [];

	const q = query.trim().toLowerCase();
	if (q.length < 2) return [];

	const { data, error } = await supabase
		.from("public_documents")
		.select(
			"id,title,institution,category,doc_type,status,source_url,effective_date",
		)
		.order("effective_date", { ascending: false, nullsFirst: false })
		.limit(80);

	if (error || !data?.length) return [];

	const tokens = q.split(/\s+/).filter((t) => t.length >= 2);

	const scored = (data as PublicRow[])
		.map((row) => {
			const hay = `${row.title} ${row.category} ${row.institution} ${row.doc_type}`.toLowerCase();
			let score = 0;
			for (const t of tokens) {
				if (hay.includes(t)) score += 3;
			}
			if (hay.includes(q)) score += 8;
			return { row, score };
		})
		.filter((x) => x.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit);

	return scored.map((s) => rowToKnowledgeDoc(s.row));
}

export async function getPublicDocumentById(id: string): Promise<KnowledgeDoc | null> {
	const uuid = publicDocumentUuidFromId(id);
	if (!uuid) return null;
	const supabase = getSupabaseAdmin();
	if (!supabase) return null;

	const { data, error } = await supabase
		.from("public_documents")
		.select(
			"id,title,institution,category,doc_type,status,source_url,effective_date",
		)
		.eq("id", uuid)
		.maybeSingle();

	if (error || !data) return null;
	return rowToKnowledgeDoc(data as PublicRow);
}
