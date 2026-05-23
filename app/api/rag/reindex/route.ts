import { isIngestAdminAuthorized } from "@/lib/ai-leader/admin-ingest-auth";
import {
  getReindexOrchestrationUsageDocs,
  parseReindexTarget,
  runReindexOrchestration,
  type ReindexTarget,
} from "@/lib/ai-leader/ingest-reindex-pipeline";
import { isRagEnabled } from "@/lib/rag/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isIngestAdminAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isRagEnabled()) {
    return Response.json(
      {
        error:
          "RAG не е активиран. Проверете OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY и RAG_ENABLED.",
      },
      { status: 503 },
    );
  }

  let body: { target?: ReindexTarget; limit?: number; onlySourceIds?: string[] } = {};
  try {
    body = (await req.json().catch(() => ({}))) as typeof body;
  } catch {
    body = {};
  }
  const target = parseReindexTarget(body.target);

  try {
    const { results } = await runReindexOrchestration(target, {
      limit: typeof body.limit === "number" ? body.limit : undefined,
      onlySourceIds: Array.isArray(body.onlySourceIds) ? body.onlySourceIds : undefined,
    });
    return Response.json({ ok: true, target, results });
  } catch (error) {
    console.error("[rag/reindex] failed:", error);
    return Response.json(
      {
        error: "RAG reindex failed.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  if (!isIngestAdminAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json({
    ok: true,
    enabled: isRagEnabled(),
    usage: getReindexOrchestrationUsageDocs(),
  });
}
