/**
 * Проверка на Supabase RAG индекс (knowledge_chunks + embeddings).
 */
import { getSupabaseAdmin } from "@/lib/supabase";
import { isRagEnabled } from "@/lib/rag/config";
import { KNOWLEDGE_BASE } from "@/lib/knowledge/dfz-knowledge";

export type RagIndexStatus = {
	configured: boolean;
	enabled: boolean;
	tableReachable: boolean;
	totalChunks: number;
	withEmbedding: number;
	withoutEmbedding: number;
	bySourceType: Record<string, number>;
	staticKbDocs: number;
	healthy: boolean;
	hints: string[];
};

export async function getRagIndexStatus(): Promise<RagIndexStatus> {
	const enabled = isRagEnabled();
	const supabase = getSupabaseAdmin();
	const hints: string[] = [];

	if (!enabled) {
		hints.push(
			"RAG изключен: нужни OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL и RAG_ENABLED≠0.",
		);
		return {
			configured: Boolean(supabase),
			enabled: false,
			tableReachable: false,
			totalChunks: 0,
			withEmbedding: 0,
			withoutEmbedding: 0,
			bySourceType: {},
			staticKbDocs: KNOWLEDGE_BASE.length,
			healthy: false,
			hints,
		};
	}

	if (!supabase) {
		hints.push("Supabase admin client липсва.");
		return {
			configured: false,
			enabled: true,
			tableReachable: false,
			totalChunks: 0,
			withEmbedding: 0,
			withoutEmbedding: 0,
			bySourceType: {},
			staticKbDocs: KNOWLEDGE_BASE.length,
			healthy: false,
			hints,
		};
	}

	const { count: totalChunks, error: countErr } = await supabase
		.from("knowledge_chunks")
		.select("*", { count: "exact", head: true });

	if (countErr) {
		hints.push(
			countErr.message.includes("does not exist") || countErr.code === "42P01"
				? "Таблица knowledge_chunks липсва — изпълнете supabase-rag-setup.sql в Supabase SQL Editor."
				: `Грешка при четене на knowledge_chunks: ${countErr.message}`,
		);
		return {
			configured: true,
			enabled: true,
			tableReachable: false,
			totalChunks: 0,
			withEmbedding: 0,
			withoutEmbedding: 0,
			bySourceType: {},
			staticKbDocs: KNOWLEDGE_BASE.length,
			healthy: false,
			hints,
		};
	}

	const { count: withEmbedding, error: embErr } = await supabase
		.from("knowledge_chunks")
		.select("*", { count: "exact", head: true })
		.not("embedding", "is", null);

	if (embErr) {
		hints.push(`Неуспешна проверка на embeddings: ${embErr.message}`);
	}

	const total = totalChunks ?? 0;
	const embedded = withEmbedding ?? 0;
	const withoutEmbedding = Math.max(0, total - embedded);

	const bySourceType: Record<string, number> = {};
	for (const st of ["static", "learned", "public_document", "kb_doc"] as const) {
		const { count, error: stErr } = await supabase
			.from("knowledge_chunks")
			.select("*", { count: "exact", head: true })
			.eq("source_type", st);
		if (!stErr && count) bySourceType[st] = count;
	}

	if (total === 0) {
		hints.push(
			"Индексът е празен — POST /api/rag/reindex с body {\"target\":\"all\"} и INGEST_ADMIN_TOKEN.",
		);
	} else if (withoutEmbedding > 0) {
		hints.push(`${withoutEmbedding} chunks без embedding — пуснете reindex.`);
	}

	const minChunks = Math.max(10, KNOWLEDGE_BASE.length * 2);
	const healthy = total > 0 && embedded >= minChunks && withoutEmbedding === 0;

	if (healthy && hints.length === 0) {
		hints.push("RAG индексът е наличен и готов за hybrid retrieval.");
	}

	return {
		configured: true,
		enabled: true,
		tableReachable: true,
		totalChunks: total,
		withEmbedding: embedded,
		withoutEmbedding,
		bySourceType,
		staticKbDocs: KNOWLEDGE_BASE.length,
		healthy,
		hints,
	};
}
