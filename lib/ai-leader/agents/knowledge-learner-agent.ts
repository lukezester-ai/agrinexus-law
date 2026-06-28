import { getSupabaseAdmin } from "@/lib/supabase";
import type { AgentRunContext, AgentRunResult } from "@/lib/ai-leader/agents/types";

export const KNOWLEDGE_LEARNER_AGENT_ID = "learner" as const;

type ChatRow = {
	id: string;
	character_id: string;
	user_message: string;
	assistant_message: string;
};

function toCategoryFromCharacter(characterId: string): string {
	if (characterId === "elena") return "Процедури";
	if (characterId === "boris") return "Екосхеми";
	if (characterId === "viktoria") return "Директни плащания";
	return "Практически насоки";
}

function extractKeywords(text: string): string[] {
	const stop = new Set(["за", "на", "с", "и", "в", "по", "как", "да", "ли", "от", "при", "че"]);
	return Array.from(
		new Set(
			text
				.toLowerCase()
				.replace(/[^\p{L}\p{N}\s-]/gu, " ")
				.split(/\s+/)
				.map((x) => x.trim())
				.filter((x) => x.length >= 4 && !stop.has(x))
				.slice(0, 8),
		),
	);
}

function titleFromQuestion(question: string): string {
	const compact = question.replace(/\s+/g, " ").trim();
	if (compact.length <= 90) return compact;
	return `${compact.slice(0, 87)}...`;
}

function resolveLearnLimit(ctx: AgentRunContext): number {
	const override = ctx.limitOverrides?.learner?.limit;
	if (typeof override === "number") return Math.min(500, Math.max(1, override));

	const last = ctx.recentRuns.find((r) => r.agentId === KNOWLEDGE_LEARNER_AGENT_ID);
	const lastLearned = Number(last?.metrics?.learned ?? 0);
	if (lastLearned === 0) return 150;
	return 100;
}

export async function runKnowledgeLearnerAgent(ctx: AgentRunContext): Promise<AgentRunResult> {
	const startedAt = new Date().toISOString();
	const recommendations: string[] = [];

	try {
		const supabase = getSupabaseAdmin();
		if (!supabase) {
			return {
				ok: false,
				agentId: KNOWLEDGE_LEARNER_AGENT_ID,
				startedAt,
				finishedAt: new Date().toISOString(),
				metrics: {},
				recommendations: ["Конфигурирай Supabase admin."],
				error: "Supabase admin липсва.",
			};
		}

		const limit = resolveLearnLimit(ctx);
		const rows = await supabase
			.from("chat_logs")
			.select("id, character_id, user_message, assistant_message")
			.eq("feedback", 1)
			.order("created_at", { ascending: false })
			.limit(limit);

		if (rows.error) throw new Error(rows.error.message);

		const items = ((rows.data || []) as ChatRow[]).map((row) => ({
			source_chat_log_id: row.id,
			title: titleFromQuestion(row.user_message),
			category: toCategoryFromCharacter(row.character_id),
			type: "learned_rule",
			content: row.assistant_message,
			keywords: extractKeywords(row.user_message),
			source: "Knowledge Learner Agent",
			effective_date: new Date().toISOString().slice(0, 10),
			quality_score: 1.0,
			is_active: true,
		}));

		if (items.length === 0) {
			recommendations.push("Няма нов positive feedback в чата — насърчи 👍 в AI чата.");
			return {
				ok: true,
				agentId: KNOWLEDGE_LEARNER_AGENT_ID,
				startedAt,
				finishedAt: new Date().toISOString(),
				metrics: { scanned: 0, learned: 0, limit },
				recommendations,
			};
		}

		const upsert = await supabase
			.from("knowledge_learned_items")
			.upsert(items, { onConflict: "source_chat_log_id" });

		if (upsert.error) throw new Error(upsert.error.message);

		if (items.length >= limit * 0.9) {
			recommendations.push("Много feedback — увеличи learner limit или пусни по-често.");
		} else {
			recommendations.push(`${items.length} нови/обновени learned items в RAG базата.`);
		}

		return {
			ok: true,
			agentId: KNOWLEDGE_LEARNER_AGENT_ID,
			startedAt,
			finishedAt: new Date().toISOString(),
			metrics: { scanned: items.length, learned: items.length, limit },
			recommendations,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			ok: false,
			agentId: KNOWLEDGE_LEARNER_AGENT_ID,
			startedAt,
			finishedAt: new Date().toISOString(),
			metrics: {},
			recommendations: ["Провери таблица knowledge_learned_items в Supabase."],
			error: message,
		};
	}
}
