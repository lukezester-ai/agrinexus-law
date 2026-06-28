import { isIngestAdminAuthorized } from "@/lib/ai-leader/admin-ingest-auth";
import {
	DOCUMENT_ARCHIVE_AGENT_ID,
	parseDocumentArchiveAgentFromUrl,
	runDocumentArchiveAgent,
} from "@/lib/ai-leader/document-archive-agent";

export const dynamic = "force-dynamic";
/** Ingest + RAG reindex може да е дълъг; Vercel Pro+ ползва по-висок лимит от Hobby. */
export const maxDuration = 300;

function isCronAuthorized(req: Request): boolean {
	const cronSecret = process.env.CRON_SECRET?.trim();
	const auth = req.headers.get("authorization")?.trim() ?? "";
	if (cronSecret && auth === `Bearer ${cronSecret}`) return true;

	const alt = process.env.INGEST_CRON_TOKEN?.trim();
	const header = req.headers.get("x-ingest-cron-token")?.trim();
	if (alt && header === alt) return true;

	return isIngestAdminAuthorized(req);
}

/**
 * Document Archive Agent — планирано теглене и попълване на архива.
 *
 * Авторизация: CRON_SECRET, INGEST_CRON_TOKEN или INGEST_ADMIN_TOKEN.
 * Виж docs/INGEST-GITHUB-ACTIONS.md и `.github/workflows/ingest-cron.yml`.
 *
 * Query:
 * - limit — файлове на източник (default 8)
 * - reindex=1|0 — RAG chunk+embed (default: INGEST_CRON_AUTO_REINDEX=1)
 * - reindexLimit, reindexTarget=public_doc_content
 * - syncSearch=1|0 — Meili upsert (default on)
 * - webTopic=... — опционален web ingest
 * - source=dfz|mzh — само един sitemap източник
 */
export async function GET(req: Request) {
	if (!isCronAuthorized(req)) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const url = new URL(req.url);
	const options = parseDocumentArchiveAgentFromUrl(url);

	try {
		const result = await runDocumentArchiveAgent(options);
		return Response.json({
			...result,
			mode: DOCUMENT_ARCHIVE_AGENT_ID,
			...(!options.reindex
				? {
						reindexHint:
							"RAG reindex пропуснат. За автоматично: INGEST_CRON_AUTO_REINDEX=1 или ?reindex=1",
					}
				: {}),
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("[ingest/cron]", error);
		return Response.json({ ok: false, error: message, agent: DOCUMENT_ARCHIVE_AGENT_ID }, { status: 500 });
	}
}
