import { getRagIndexStatus } from "@/lib/rag/rag-index-status";

/** Smoke + RAG индекс статус за CI / мониторинг. */
export async function GET() {
	const rag = await getRagIndexStatus();
	return Response.json({
		ok: true,
		service: "agrinexus-mvp",
		rag: {
			healthy: rag.healthy,
			enabled: rag.enabled,
			tableReachable: rag.tableReachable,
			totalChunks: rag.totalChunks,
			withEmbedding: rag.withEmbedding,
			withoutEmbedding: rag.withoutEmbedding,
			bySourceType: rag.bySourceType,
			hints: rag.hints,
		},
	});
}
