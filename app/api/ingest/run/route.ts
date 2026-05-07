import { runDocumentIngest } from "@/lib/ingest/run";

function isAuthorized(req: Request): boolean {
  const required = process.env.INGEST_ADMIN_TOKEN?.trim();
  if (!required) return false;
  const got = req.headers.get("x-ingest-token")?.trim();
  return Boolean(got && got === required);
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      sourceName?: string;
      limitPerSource?: number;
    };
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
