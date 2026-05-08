import {
  reindexAll,
  reindexLearned,
  reindexPublicDocuments,
  reindexStatic,
  type ReindexStats,
} from "@/lib/rag/reindex";
import { isRagEnabled } from "@/lib/rag/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const required = process.env.INGEST_ADMIN_TOKEN?.trim();
  if (!required) return false;
  const headerToken =
    req.headers.get("x-ingest-token")?.trim() ||
    req.headers.get("authorization")?.trim().replace(/^Bearer\s+/i, "");
  return Boolean(headerToken && headerToken === required);
}

type Target = "all" | "static" | "learned" | "public_documents";

function isValidTarget(value: unknown): value is Target {
  return (
    value === "all" ||
    value === "static" ||
    value === "learned" ||
    value === "public_documents"
  );
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
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

  let body: { target?: Target } = {};
  try {
    body = (await req.json().catch(() => ({}))) as { target?: Target };
  } catch {
    body = {};
  }
  const target: Target = isValidTarget(body.target) ? body.target : "all";

  try {
    let results: ReindexStats[] = [];
    switch (target) {
      case "static":
        results = [await reindexStatic()];
        break;
      case "learned":
        results = [await reindexLearned()];
        break;
      case "public_documents":
        results = [await reindexPublicDocuments()];
        break;
      case "all":
      default:
        results = await reindexAll();
        break;
    }
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
  if (!isAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json({
    ok: true,
    enabled: isRagEnabled(),
    usage: {
      method: "POST",
      headers: { "x-ingest-token": "<INGEST_ADMIN_TOKEN>" },
      body: { target: "all | static | learned | public_documents" },
    },
  });
}
