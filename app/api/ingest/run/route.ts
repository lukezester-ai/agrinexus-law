import { runDocumentIngest } from "@/lib/ingest/run";
import { runWebAgricultureDocumentIngest } from "@/lib/ingest/web-agri-discover";

function isAuthorized(req: Request): boolean {
  const required = process.env.INGEST_ADMIN_TOKEN?.trim();
  if (!required) return false;
  const headerToken =
    req.headers.get("x-ingest-token")?.trim() ||
    req.headers.get("authorization")?.trim().replace(/^Bearer\s+/i, "");
  return Boolean(headerToken && headerToken === required);
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      mode?: string;
      topic?: string;
      sourceName?: string;
      limitPerSource?: number;
      searchNum?: number;
      maxDownloads?: number;
    };

    if (body.mode === "web") {
      const topic =
        typeof body.topic === "string" && body.topic.trim()
          ? body.topic.trim()
          : "земеделие субсидии ОСП CAP ПСРР България";
      const one = await runWebAgricultureDocumentIngest({
        topic,
        searchNum: typeof body.searchNum === "number" ? body.searchNum : undefined,
        maxDownloads: typeof body.maxDownloads === "number" ? body.maxDownloads : undefined,
      });
      return Response.json({ ok: true, results: [one], mode: "web" as const });
    }

    const results = await runDocumentIngest({
      sourceName: body.sourceName,
      limitPerSource: body.limitPerSource,
    });
    return Response.json({ ok: true, results });
  } catch (error) {
    console.error("[ingest/run] failed:", error);
    return Response.json(
      { error: "Ingest run failed. Check server logs for details." },
      { status: 500 }
    );
  }
}
