import { isIngestAdminAuthorized } from "@/lib/ai-leader/admin-ingest-auth";
import {
	parseAgentIds,
	runAgentOrchestrator,
} from "@/lib/ai-leader/agents/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isCronAuthorized(req: Request): boolean {
	const cronSecret = process.env.CRON_SECRET?.trim();
	const auth = req.headers.get("authorization")?.trim() ?? "";
	if (cronSecret && auth === `Bearer ${cronSecret}`) return true;

	const alt = process.env.AGENTS_CRON_TOKEN?.trim() ?? process.env.INGEST_CRON_TOKEN?.trim();
	const header = req.headers.get("x-agents-cron-token")?.trim();
	if (alt && header === alt) return true;

	return isIngestAdminAuthorized(req);
}

/**
 * AI Leader — оркестратор на 5-те агента.
 *
 * Query:
 * - agents=guardian,archive,learner,indexer,analyst (default: всички)
 * - skipHeavy=1 — без archive + indexer (бърз health cycle)
 */
export async function GET(req: Request) {
	if (!isCronAuthorized(req)) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const url = new URL(req.url);
	const agents = parseAgentIds(url.searchParams.get("agents"));
	const skipHeavy = url.searchParams.get("skipHeavy") === "1";

	try {
		const result = await runAgentOrchestrator({ agents, skipHeavy });
		return Response.json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("[agents/cron]", error);
		return Response.json({ ok: false, error: message }, { status: 500 });
	}
}
