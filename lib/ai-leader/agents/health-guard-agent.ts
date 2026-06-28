import { getSupabaseAdmin } from "@/lib/supabase";
import { getRagIndexStatus } from "@/lib/rag/rag-index-status";
import { isSupabasePublicEnvConfigured } from "@/lib/supabase/env";
import { isBillingConfigured } from "@/lib/billing/plans";
import type { AgentRunContext, AgentRunResult } from "@/lib/ai-leader/agents/types";

export const HEALTH_GUARD_AGENT_ID = "guardian" as const;

export async function runHealthGuardAgent(ctx: AgentRunContext): Promise<AgentRunResult> {
	const startedAt = new Date().toISOString();
	const recommendations: string[] = [];
	const issues: string[] = [];

	try {
		const rag = await getRagIndexStatus();
		const supabaseAdmin = Boolean(getSupabaseAdmin());
		const supabasePublic = isSupabasePublicEnvConfigured();
		const billing = isBillingConfigured();
		const openai = Boolean(process.env.OPENAI_API_KEY?.trim());

		if (!supabasePublic) issues.push("NEXT_PUBLIC_SUPABASE_URL/ANON липсват или са невалидни.");
		if (!supabaseAdmin) issues.push("SUPABASE_SERVICE_ROLE_KEY липсва — RAG и агенти не работят.");
		if (!openai) issues.push("OPENAI_API_KEY липсва — чат и embeddings са изключени.");
		if (!rag.healthy) issues.push(...rag.hints.slice(0, 3));
		if (rag.withoutEmbedding > 0) {
			recommendations.push(
				`Indexer: ${rag.withoutEmbedding} chunk-а без embedding — пусни reindex.`,
			);
		}
		if (!billing) {
			recommendations.push("Stripe keys липсват — /ceni checkout е в demo режим.");
		}

		const recentFails = ctx.recentRuns.filter((r) => r.agentId === HEALTH_GUARD_AGENT_ID && !r.ok);
		if (recentFails.length >= 2) {
			recommendations.push("Повтарящи се health проблеми — провери Vercel env и Supabase SQL.");
		}

		const ok = issues.length === 0;
		if (ok) recommendations.push("Системата е в добро състояние — продължи archive + learner цикъла.");

		return {
			ok,
			agentId: HEALTH_GUARD_AGENT_ID,
			startedAt,
			finishedAt: new Date().toISOString(),
			metrics: {
				ragHealthy: rag.healthy,
				ragEnabled: rag.enabled,
				totalChunks: rag.totalChunks,
				withEmbedding: rag.withEmbedding,
				withoutEmbedding: rag.withoutEmbedding,
				supabasePublic,
				supabaseAdmin,
				openai,
				billing,
				issueCount: issues.length,
			},
			recommendations: issues.length ? [...issues, ...recommendations] : recommendations,
			error: ok ? undefined : issues[0],
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			ok: false,
			agentId: HEALTH_GUARD_AGENT_ID,
			startedAt,
			finishedAt: new Date().toISOString(),
			metrics: {},
			recommendations: ["Пусни Guardian отново след fix на env."],
			error: message,
		};
	}
}
