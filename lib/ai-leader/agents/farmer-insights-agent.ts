import { getSupabaseAdmin } from "@/lib/supabase";
import { getLiveIntelligenceStats } from "@/lib/live-intelligence-stats";
import type { AgentRunContext, AgentRunResult } from "@/lib/ai-leader/agents/types";

export const FARMER_INSIGHTS_AGENT_ID = "analyst" as const;

export async function runFarmerInsightsAgent(_ctx: AgentRunContext): Promise<AgentRunResult> {
	const startedAt = new Date().toISOString();
	const recommendations: string[] = [];

	try {
		const live = await getLiveIntelligenceStats();
		const supabase = getSupabaseAdmin();

		let documentReviews = 0;
		let publicDocuments = 0;
		let positiveFeedback = 0;

		if (supabase) {
			const [reviews, docs, feedback] = await Promise.all([
				supabase.from("document_reviews").select("*", { count: "exact", head: true }),
				supabase.from("public_documents").select("*", { count: "exact", head: true }),
				supabase
					.from("chat_logs")
					.select("*", { count: "exact", head: true })
					.eq("feedback", 1),
			]);
			documentReviews = reviews.count ?? 0;
			publicDocuments = docs.count ?? 0;
			positiveFeedback = feedback.count ?? 0;
		}

		const chatTile = live.tiles[0]?.value ?? "—";
		if (positiveFeedback < 5) {
			recommendations.push("Малко 👍 feedback — добави CTA в чата за оценка на отговори.");
		}
		if (documentReviews === 0) {
			recommendations.push("Няма AI прегледи — промотирай /document-review.");
		}
		if (!live.rag.healthy) {
			recommendations.push("RAG не е healthy — landing stats показват „—“ на RAG tile.");
		}
		if (recommendations.length === 0) {
			recommendations.push("Engagement метриките са стабилни — продължи с archive cron.");
		}

		return {
			ok: true,
			agentId: FARMER_INSIGHTS_AGENT_ID,
			startedAt,
			finishedAt: new Date().toISOString(),
			metrics: {
				chatLogsDisplay: chatTile,
				publicDocuments,
				documentReviews,
				positiveFeedback,
				uniqueVisitors: live.visits?.uniqueVisitors ?? null,
				ragHealthy: live.rag.healthy,
				deadlineRisks: live.deadlineRisks.length,
			},
			recommendations,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			ok: false,
			agentId: FARMER_INSIGHTS_AGENT_ID,
			startedAt,
			finishedAt: new Date().toISOString(),
			metrics: {},
			recommendations: ["Провери /api/stats/live и Supabase таблици."],
			error: message,
		};
	}
}
