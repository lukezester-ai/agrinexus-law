import {
	runDocumentArchiveAgent,
	type DocumentArchiveAgentResult,
} from "@/lib/ai-leader/document-archive-agent";
import type { AgentRunContext, AgentRunResult } from "@/lib/ai-leader/agents/types";

export const ARCHIVE_AGENT_ID = "archive" as const;

function resolveLimitPerSource(ctx: AgentRunContext): number {
	const override = ctx.limitOverrides?.archive?.limitPerSource;
	if (typeof override === "number") return Math.min(20, Math.max(1, override));

	const last = ctx.recentRuns.find((r) => r.agentId === ARCHIVE_AGENT_ID);
	const stored = Number(last?.metrics?.stored ?? -1);
	const prevLimit = Number(last?.metrics?.limitPerSource ?? 8);
	if (stored === 0) return Math.min(16, prevLimit + 2);
	return 8;
}

export async function runArchiveAgentAdapter(ctx: AgentRunContext): Promise<AgentRunResult> {
	const startedAt = new Date().toISOString();
	const limitPerSource = resolveLimitPerSource(ctx);

	try {
		const result: DocumentArchiveAgentResult = await runDocumentArchiveAgent({
			limitPerSource,
			reindex: true,
			reindexLimit: 35,
			syncSearch: true,
		});

		const recommendations: string[] = [];
		if (result.totals.stored === 0) {
			recommendations.push("Няма нови документи — увеличи limit или провери ДФЗ sitemap.");
		} else {
			recommendations.push(
				`Архивирани ${result.totals.stored}/${result.totals.fetched} документа.`,
			);
		}
		if (result.totals.errorCount > 0) {
			recommendations.push(`${result.totals.errorCount} грешки при ingest — виж ingest_runs.`);
		}

		return {
			ok: result.totals.errorCount === 0,
			agentId: ARCHIVE_AGENT_ID,
			startedAt,
			finishedAt: result.finishedAt,
			metrics: {
				limitPerSource,
				fetched: result.totals.fetched,
				stored: result.totals.stored,
				errorCount: result.totals.errorCount,
				runId: result.runId,
				reindex: result.reindex?.reason ?? null,
				searchSynced: result.searchSync?.synced ?? 0,
			},
			recommendations,
			error: result.totals.errorCount > 0 ? "Ingest errors" : undefined,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			ok: false,
			agentId: ARCHIVE_AGENT_ID,
			startedAt,
			finishedAt: new Date().toISOString(),
			metrics: { limitPerSource },
			recommendations: ["Провери INGEST_ADMIN_TOKEN и Supabase storage."],
			error: message,
		};
	}
}
