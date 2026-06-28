export type AgentId =
	| "archive"
	| "guardian"
	| "learner"
	| "indexer"
	| "analyst";

export type AgentRunResult = {
	ok: boolean;
	agentId: AgentId;
	startedAt: string;
	finishedAt: string;
	metrics: Record<string, unknown>;
	recommendations: string[];
	error?: string;
};

export type AgentDefinition = {
	id: AgentId;
	name: string;
	nameBg: string;
	description: string;
	/** Какво прави агентът при всеки run */
	role: string;
	run: (ctx: AgentRunContext) => Promise<AgentRunResult>;
};

export type AgentRunContext = {
	/** Последни run-ове — за адаптивни лимити и „самообучение“. */
	recentRuns: AgentRunResult[];
	limitOverrides?: Partial<Record<AgentId, Record<string, unknown>>>;
};

export type OrchestratorResult = {
	ok: boolean;
	startedAt: string;
	finishedAt: string;
	runs: AgentRunResult[];
	summary: string;
};
