import { isIngestAdminAuthorized } from "@/lib/ai-leader/admin-ingest-auth";
import { runIngestOrchestration, type IngestRunBody } from "@/lib/ai-leader/ingest-reindex-pipeline";

export async function POST(req: Request) {
  if (!isIngestAdminAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as IngestRunBody;
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
