import {
	AGENT_REGISTRY,
	DEFAULT_AGENT_ORDER,
	getAgentDefinition,
	parseAgentIds,
} from "@/lib/ai-leader/agents/registry";
import {
	getRecentAgentRuns,
	persistAgentRun,
} from "@/lib/ai-leader/agents/agent-run-store";
import type {
	AgentId,
	AgentRunContext,
	AgentRunResult,
	OrchestratorResult,
} from "@/lib/ai-leader/agents/types";

export type RunAgentsOptions = {
	/** Кома-разделен списък или всички по подразбиране */
	agents?: AgentId[];
	/** Пропусни archive (бърз health-only run) */
	skipHeavy?: boolean;
};

export async function runAgentById(
	agentId: AgentId,
	ctx?: Partial<AgentRunContext>,
): Promise<AgentRunResult> {
	const def = getAgentDefinition(agentId);
	if (!def) {
		return {
			ok: false,
			agentId,
			startedAt: new Date().toISOString(),
			finishedAt: new Date().toISOString(),
			metrics: {},
			recommendations: [],
			error: `Unknown agent: ${agentId}`,
		};
	}

	const recentRuns = ctx?.recentRuns ?? (await getRecentAgentRuns(undefined, 12));
	const runCtx: AgentRunContext = {
		recentRuns,
		limitOverrides: ctx?.limitOverrides,
	};

	const result = await def.run(runCtx);
	await persistAgentRun(result);
	return result;
}

export async function runAgentOrchestrator(
	options: RunAgentsOptions = {},
): Promise<OrchestratorResult> {
	const startedAt = new Date().toISOString();
	const recentRuns = await getRecentAgentRuns(undefined, 12);

	let agentIds = options.agents?.length ? options.agents : DEFAULT_AGENT_ORDER;
	if (options.skipHeavy) {
		agentIds = agentIds.filter((id) => id !== "archive" && id !== "indexer");
	}

	const runs: AgentRunResult[] = [];
	const ctx: AgentRunContext = { recentRuns: [...recentRuns] };

	for (const agentId of agentIds) {
		const def = getAgentDefinition(agentId);
		if (!def) continue;
		const result = await def.run(ctx);
		await persistAgentRun(result);
		runs.push(result);
		ctx.recentRuns.unshift(result);
	}

	const ok = runs.every((r) => r.ok);
	const summary = runs
		.map((r) => {
			const meta = AGENT_REGISTRY.find((a) => a.id === r.agentId);
			return `${meta?.nameBg ?? r.agentId}: ${r.ok ? "OK" : "FAIL"}`;
		})
		.join(" · ");

	return {
		ok,
		startedAt,
		finishedAt: new Date().toISOString(),
		runs,
		summary,
	};
}

export { parseAgentIds, AGENT_REGISTRY, DEFAULT_AGENT_ORDER };
