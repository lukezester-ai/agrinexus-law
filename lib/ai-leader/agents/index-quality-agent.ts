import { getRagIndexStatus } from "@/lib/rag/rag-index-status";
import { runReindexOrchestration } from "@/lib/ai-leader/ingest-reindex-pipeline";
import { syncPublicDocumentsToSearchIndex } from "@/lib/search/sync-public-documents";
import type { AgentRunContext, AgentRunResult } from "@/lib/ai-leader/agents/types";

export const INDEX_QUALITY_AGENT_ID = "indexer" as const;

function resolveReindexLimit(ctx: AgentRunContext, withoutEmbedding: number): number {
	const override = ctx.limitOverrides?.indexer?.reindexLimit;
	if (typeof override === "number") return Math.min(100, Math.max(5, override));

	const lastArchive = ctx.recentRuns.find((r) => r.agentId === "archive");
	const stored = Number(lastArchive?.metrics?.stored ?? 0);
	const base = withoutEmbedding > 50 ? 45 : 25;
	return stored > 0 ? Math.min(60, base + 10) : base;
}

export async function runIndexQualityAgent(ctx: AgentRunContext): Promise<AgentRunResult> {
	const startedAt = new Date().toISOString();
	const recommendations: string[] = [];

	try {
		const rag = await getRagIndexStatus();
		const withoutEmbedding = rag.withoutEmbedding;
		const shouldReindex = rag.enabled && withoutEmbedding > 0;
		const reindexLimit = resolveReindexLimit(ctx, withoutEmbedding);

		let reindexed = 0;
		let reindexErrors = 0;

		if (shouldReindex) {
			const { results } = await runReindexOrchestration("public_doc_content", {
				limit: reindexLimit,
			});
			for (const r of results) {
				reindexed += r.chunksCreated ?? 0;
				if (r.errors?.length) reindexErrors += r.errors.length;
			}
			recommendations.push(`Reindex: ${reindexed} chunk-а (limit ${reindexLimit}).`);
		} else if (!rag.enabled) {
			recommendations.push("RAG изключен — Indexer пропусна reindex.");
		} else {
			recommendations.push("Всички chunk-ове имат embeddings — само search sync.");
		}

		const searchSync = await syncPublicDocumentsToSearchIndex(40);
		recommendations.push(`Meili sync: ${searchSync.synced} документа.`);

		const ok = rag.tableReachable && reindexErrors === 0;
		if (reindexErrors > 0) {
			recommendations.push("Има reindex грешки — провери OPENAI quota и Supabase.");
		}

		return {
			ok,
			agentId: INDEX_QUALITY_AGENT_ID,
			startedAt,
			finishedAt: new Date().toISOString(),
			metrics: {
				ragHealthy: rag.healthy,
				withoutEmbedding,
				reindexed,
				reindexErrors,
				reindexLimit,
				searchSynced: searchSync.synced,
				searchSkipped: searchSync.skipped,
			},
			recommendations,
			error: ok ? undefined : "Reindex errors",
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			ok: false,
			agentId: INDEX_QUALITY_AGENT_ID,
			startedAt,
			finishedAt: new Date().toISOString(),
			metrics: {},
			recommendations: ["Пусни ръчен /api/rag/reindex от admin."],
			error: message,
		};
	}
}
