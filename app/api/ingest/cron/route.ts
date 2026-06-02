import { isIngestAdminAuthorized } from "@/lib/ai-leader/admin-ingest-auth";
import {
	parseReindexTarget,
	runReindexOrchestration,
} from "@/lib/ai-leader/ingest-reindex-pipeline";
import { runDocumentIngest } from "@/lib/ingest/run";

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
 * Планирано теглене на документи (ДФЗ/МЗХ sitemap + опционално EUR-Lex от env).
 *
 * Авторизация (който и да е достатъчен):
 * - `Authorization: Bearer $CRON_SECRET` (напр. Vercel Cron)
 * - `x-ingest-cron-token: $INGEST_CRON_TOKEN` — само ако си задал ОТДЕЛЕН INGEST_CRON_TOKEN на сървъра
 * - `x-ingest-token` / Bearer — същото като INGEST_ADMIN_TOKEN (най-просто за GitHub Actions)
 *
 * Външен ping: виж `docs/INGEST-GITHUB-ACTIONS.md` и `.github/workflows/ingest-cron.yml`.
 *
 * RAG след сваляне:
 * - `?reindex=1` (или `true`) — chunk + embed за индексирани публични документи
 * - `?reindex=0` — изключва дори ако е зададено `INGEST_CRON_AUTO_REINDEX=1`
 * - без `reindex` в URL: ако `INGEST_CRON_AUTO_REINDEX=1`, пуска същия reindex по подразбиране
 */
export async function GET(req: Request) {
	if (!isCronAuthorized(req)) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const url = new URL(req.url);
	const limitPerSource = Math.min(Math.max(Number(url.searchParams.get("limit") || 8), 1), 40);
	const reindexParam = url.searchParams.get("reindex")?.trim().toLowerCase() ?? "";
	const explicitOff = reindexParam === "0" || reindexParam === "false";
	const explicitOn = reindexParam === "1" || reindexParam === "true";
	const autoReindex = process.env.INGEST_CRON_AUTO_REINDEX?.trim() === "1";
	const doReindex = !explicitOff && (explicitOn || (reindexParam === "" && autoReindex));
	const reindexReason: "query" | "env" | "skipped" = explicitOff
		? "skipped"
		: explicitOn
			? "query"
			: autoReindex
				? "env"
				: "skipped";

	const defaultReindexLimit = Math.min(
		Math.max(Number.parseInt(process.env.INGEST_CRON_REINDEX_LIMIT || "35", 10), 1),
		200,
	);

	try {
		const results = await runDocumentIngest({ limitPerSource });
		let reindex: { target: string; results: unknown; reason: typeof reindexReason } | null = null;
		if (doReindex) {
			const raw = url.searchParams.get("reindexTarget")?.trim();
			const whitelist = ["public_documents", "public_doc_content", "learned", "static"] as const;
			type W = (typeof whitelist)[number];
			const safeTarget: W = whitelist.includes(raw as W) ? (raw as W) : "public_doc_content";
			const target = parseReindexTarget(safeTarget);
			const contentLimit = Math.min(
				Math.max(
					Number(url.searchParams.get("reindexLimit") || String(defaultReindexLimit)),
					1,
				),
				200,
			);
			const out = await runReindexOrchestration(target, {
				limit: target === "public_doc_content" ? contentLimit : undefined,
			});
			reindex = { ...out, reason: reindexReason };
		}
		return Response.json({
			ok: true,
			mode: "documents" as const,
			limitPerSource,
			results,
			reindex,
			...(!doReindex
				? {
						reindexHint: explicitOff
							? "reindex=0/false — пропуснато."
							: "За chunk+embed: добави ?reindex=1 или задай INGEST_CRON_AUTO_REINDEX=1 в средата.",
					}
				: {}),
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("[ingest/cron]", error);
		return Response.json({ ok: false, error: message }, { status: 500 });
	}
}
