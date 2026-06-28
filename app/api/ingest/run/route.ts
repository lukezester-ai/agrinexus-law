import { isIngestAdminAuthorized } from "@/lib/ai-leader/admin-ingest-auth";
import {
	runDocumentArchiveAgent,
	type DocumentArchiveAgentOptions,
} from "@/lib/ai-leader/document-archive-agent";
import { runIngestOrchestration, type IngestRunBody } from "@/lib/ai-leader/ingest-reindex-pipeline";

export const maxDuration = 300;

export async function POST(req: Request) {
  if (!isIngestAdminAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as IngestRunBody & {
      archiveAgent?: boolean;
      reindex?: boolean;
      reindexLimit?: number;
      syncSearch?: boolean;
    };

    if (body.archiveAgent === true || body.mode === "archive") {
      const agentOpts: DocumentArchiveAgentOptions = {
        limitPerSource: body.limitPerSource,
        sourceName: body.sourceName,
        webTopic: body.mode === "web" ? body.topic : undefined,
        webSearchNum: body.searchNum,
        webMaxDownloads: body.maxDownloads,
        reindex: body.reindex !== false,
        reindexLimit: body.reindexLimit,
        syncSearch: body.syncSearch !== false,
      };
      const result = await runDocumentArchiveAgent(agentOpts);
      return Response.json(result);
    }

    const out = await runIngestOrchestration(body);
    if (out.mode === "web") {
      return Response.json({ ok: true, results: out.results, mode: "web" as const });
    }
    return Response.json({ ok: true, results: out.results });
  } catch (error) {
    console.error("[ingest/run] failed:", error);
    return Response.json(
      { error: "Ingest run failed. Check server logs for details." },
      { status: 500 },
    );
  }
}
