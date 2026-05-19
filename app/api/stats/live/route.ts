import { getLiveIntelligenceStats } from "@/lib/live-intelligence-stats";

export const dynamic = "force-dynamic";

/** Публични live метрики за началната страница + RAG статус (без секрети). */
export async function GET() {
	try {
		const payload = await getLiveIntelligenceStats();
		return Response.json({
			ok: true,
			tiles: payload.tiles,
			deadlineRisks: payload.deadlineRisks,
			online: payload.online,
			visits: payload.visits,
			rag: {
				healthy: payload.rag.healthy,
				enabled: payload.rag.enabled,
				totalChunks: payload.rag.totalChunks,
				withEmbedding: payload.rag.withEmbedding,
				withoutEmbedding: payload.rag.withoutEmbedding,
				bySourceType: payload.rag.bySourceType,
				hints: payload.rag.hints,
			},
		});
	} catch (error) {
		console.error("[stats/live]", error);
		return Response.json(
			{
				ok: false,
				error: "Неуспешно зареждане на live статистика.",
				tiles: [
					{ value: "—", label: "чат записа" },
					{ value: "—", label: "страници" },
					{ value: "—", label: "RAG" },
				],
				deadlineRisks: [],
				rag: { healthy: false, enabled: false, hints: ["API грешка"] },
			},
			{ status: 500 },
		);
	}
}
