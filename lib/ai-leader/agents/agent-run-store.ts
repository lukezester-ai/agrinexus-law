import { getSupabaseAdmin } from "@/lib/supabase";
import type { AgentId, AgentRunResult } from "@/lib/ai-leader/agents/types";

type StoredRow = {
	id: string;
	agent_id: string;
	ok: boolean;
	started_at: string;
	finished_at: string;
	metrics: Record<string, unknown>;
	recommendations: string[];
	error: string | null;
};

export async function persistAgentRun(result: AgentRunResult): Promise<void> {
	const supabase = getSupabaseAdmin();
	if (!supabase) return;

	const { error } = await supabase.from("agent_runs").insert({
		agent_id: result.agentId,
		ok: result.ok,
		started_at: result.startedAt,
		finished_at: result.finishedAt,
		metrics: result.metrics,
		recommendations: result.recommendations,
		error: result.error ?? null,
	});

	if (error && !error.message.includes("does not exist")) {
		console.warn("[agent-run-store] persist failed:", error.message);
	}
}

export async function getRecentAgentRuns(
	agentId?: AgentId,
	limit = 8,
): Promise<AgentRunResult[]> {
	const supabase = getSupabaseAdmin();
	if (!supabase) return [];

	let query = supabase
		.from("agent_runs")
		.select("agent_id, ok, started_at, finished_at, metrics, recommendations, error")
		.order("started_at", { ascending: false })
		.limit(limit);

	if (agentId) query = query.eq("agent_id", agentId);

	const { data, error } = await query;
	if (error || !data) return [];

	return (data as StoredRow[]).map((row) => ({
		ok: row.ok,
		agentId: row.agent_id as AgentId,
		startedAt: row.started_at,
		finishedAt: row.finished_at,
		metrics: row.metrics ?? {},
		recommendations: row.recommendations ?? [],
		error: row.error ?? undefined,
	}));
}
