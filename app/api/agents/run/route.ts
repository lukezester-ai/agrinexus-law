import { isIngestAdminAuthorized } from "@/lib/ai-leader/admin-ingest-auth";
import { AGENT_REGISTRY } from "@/lib/ai-leader/agents/registry";
import {
	parseAgentIds,
	runAgentById,
	runAgentOrchestrator,
} from "@/lib/ai-leader/agents/orchestrator";
import type { AgentId } from "@/lib/ai-leader/agents/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
	return Response.json({
		ok: true,
		agents: AGENT_REGISTRY.map((a) => ({
			id: a.id,
			name: a.name,
			nameBg: a.nameBg,
			description: a.description,
			role: a.role,
		})),
		cron: "GET /api/agents/cron",
	});
}

export async function POST(req: Request) {
	if (!isIngestAdminAuthorized(req)) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	let body: { agent?: AgentId; agents?: string; skipHeavy?: boolean } = {};
	try {
		body = await req.json();
	} catch {
		/* empty body ok */
	}

	try {
		if (body.agent) {
			const result = await runAgentById(body.agent);
			return Response.json({ ok: result.ok, run: result });
		}

		const agents = body.agents ? parseAgentIds(body.agents) : undefined;
		const result = await runAgentOrchestrator({
			agents,
			skipHeavy: body.skipHeavy === true,
		});
		return Response.json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("[agents/run]", error);
		return Response.json({ ok: false, error: message }, { status: 500 });
	}
}
