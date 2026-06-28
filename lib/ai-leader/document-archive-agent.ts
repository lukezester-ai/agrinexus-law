/**
 * Document Archive Agent — единен фонов работник за:
 * discover → download → public_documents → RAG reindex → search sync.
 *
 * Не е чат-персонаж; оркестрира ingest pipeline-ите в фиксиран ред.
 */

import { getSupabaseAdmin } from "@/lib/supabase";
import { runDocumentIngest } from "@/lib/ingest/run";
import { runWebAgricultureDocumentIngest } from "@/lib/ingest/web-agri-discover";
import type { IngestResult } from "@/lib/ingest/types";
import {
	parseReindexTarget,
	runReindexOrchestration,
	type ReindexTarget,
} from "@/lib/ai-leader/ingest-reindex-pipeline";
import {
	syncPublicDocumentsToSearchIndex,
	type ArchiveSearchSyncResult,
} from "@/lib/search/sync-public-documents";
import type { ReindexStats } from "@/lib/rag/reindex";

export const DOCUMENT_ARCHIVE_AGENT_ID = "document-archive-agent";

export type DocumentArchiveAgentOptions = {
	/** Брой файлове за discover на източник (ДФЗ, МЗХ, …). */
	limitPerSource?: number;
	/** Само един източник по name от lib/ingest/sources.ts */
	sourceName?: string;
	/** Ако е зададена тема — допълнителен web ingest (Google CSE + OpenAI подбор). */
	webTopic?: string | null;
	webSearchNum?: number;
	webMaxDownloads?: number;
	/** Chunk + embed след ingest (по подразбиране true). */
	reindex?: boolean;
	reindexTarget?: ReindexTarget;
	reindexLimit?: number;
	/** Meili upsert след reindex (по подразбиране true). */
	syncSearch?: boolean;
	syncSearchLimit?: number;
};

export type DocumentArchiveAgentResult = {
	ok: true;
	agent: typeof DOCUMENT_ARCHIVE_AGENT_ID;
	startedAt: string;
	finishedAt: string;
	runId: string | null;
	sitemapIngest: IngestResult[];
	webIngest: IngestResult | null;
	reindex: {
		target: ReindexTarget;
		results: ReindexStats[];
		reason: "enabled" | "disabled";
	} | null;
	searchSync: ArchiveSearchSyncResult | null;
	totals: {
		fetched: number;
		stored: number;
		errorCount: number;
	};
};

function sumIngest(results: IngestResult[]) {
	return results.reduce(
		(acc, r) => ({
			fetched: acc.fetched + r.fetched,
			stored: acc.stored + r.stored,
			errorCount: acc.errorCount + r.errors.length,
		}),
		{ fetched: 0, stored: 0, errorCount: 0 },
	);
}

export async function runDocumentArchiveAgent(
	opts: DocumentArchiveAgentOptions = {},
): Promise<DocumentArchiveAgentResult> {
	const startedAt = new Date().toISOString();
	const supabase = getSupabaseAdmin();

	let runId: string | null = null;
	if (supabase) {
		const started = await supabase
			.from("ingest_runs")
			.insert({ source_name: DOCUMENT_ARCHIVE_AGENT_ID, status: "running" })
			.select("id")
			.single();
		runId = (started.data?.id as string | undefined) ?? null;
	}

	const limitPerSource = Math.min(Math.max(opts.limitPerSource ?? 8, 1), 40);
	const doReindex = opts.reindex !== false;
	const doSyncSearch = opts.syncSearch !== false;
	const reindexTarget = parseReindexTarget(opts.reindexTarget ?? "public_doc_content");
	const reindexLimit = Math.min(Math.max(opts.reindexLimit ?? 35, 1), 200);

	let sitemapIngest: IngestResult[] = [];
	let webIngest: IngestResult | null = null;
	let reindex: DocumentArchiveAgentResult["reindex"] = null;
	let searchSync: ArchiveSearchSyncResult | null = null;

	try {
		sitemapIngest = await runDocumentIngest({
			sourceName: opts.sourceName,
			limitPerSource,
		});

		const webTopic = opts.webTopic?.trim();
		if (webTopic) {
			webIngest = await runWebAgricultureDocumentIngest({
				topic: webTopic,
				searchNum: opts.webSearchNum,
				maxDownloads: opts.webMaxDownloads,
			});
		}

		if (doReindex) {
			const out = await runReindexOrchestration(reindexTarget, {
				limit: reindexTarget === "public_doc_content" ? reindexLimit : undefined,
			});
			reindex = { ...out, reason: "enabled" };
		} else {
			reindex = { target: reindexTarget, results: [], reason: "disabled" };
		}

		if (doSyncSearch) {
			searchSync = await syncPublicDocumentsToSearchIndex(opts.syncSearchLimit ?? 200);
		}

		const totals = sumIngest([
			...sitemapIngest,
			...(webIngest ? [webIngest] : []),
		]);

		const finishedAt = new Date().toISOString();

		if (supabase && runId) {
			await supabase
				.from("ingest_runs")
				.update({
					status: totals.errorCount > 0 ? "completed_with_errors" : "completed",
					fetched_count: totals.fetched,
					stored_count: totals.stored,
					error_message:
						totals.errorCount > 0
							? `${totals.errorCount} download/ingest errors (see per-source logs)`
							: null,
					finished_at: finishedAt,
				})
				.eq("id", runId);
		}

		return {
			ok: true,
			agent: DOCUMENT_ARCHIVE_AGENT_ID,
			startedAt,
			finishedAt,
			runId,
			sitemapIngest,
			webIngest,
			reindex,
			searchSync,
			totals,
		};
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		if (supabase && runId) {
			await supabase
				.from("ingest_runs")
				.update({
					status: "failed",
					error_message: msg,
					finished_at: new Date().toISOString(),
				})
				.eq("id", runId);
		}
		throw e;
	}
}

/** Parse cron/query params into agent options. */
export function parseDocumentArchiveAgentFromUrl(url: URL): DocumentArchiveAgentOptions {
	const reindexParam = url.searchParams.get("reindex")?.trim().toLowerCase() ?? "";
	const explicitOff = reindexParam === "0" || reindexParam === "false";
	const explicitOn = reindexParam === "1" || reindexParam === "true";
	const autoReindex = process.env.INGEST_CRON_AUTO_REINDEX?.trim() === "1";
	const doReindex = !explicitOff && (explicitOn || (reindexParam === "" && autoReindex));

	const syncParam = url.searchParams.get("syncSearch")?.trim().toLowerCase() ?? "";
	const syncOff = syncParam === "0" || syncParam === "false";
	const autoSync = process.env.ARCHIVE_AGENT_AUTO_SYNC_SEARCH?.trim() !== "0";
	const doSync = !syncOff && (syncParam === "1" || syncParam === "true" || (syncParam === "" && autoSync));

	const limitPerSource = Math.min(
		Math.max(Number(url.searchParams.get("limit") || 8), 1),
		40,
	);
	const reindexLimit = Math.min(
		Math.max(
			Number.parseInt(
				url.searchParams.get("reindexLimit") ||
					process.env.INGEST_CRON_REINDEX_LIMIT ||
					"35",
				10,
			),
			1,
		),
		200,
	);

	const rawTarget = url.searchParams.get("reindexTarget")?.trim();
	const whitelist = ["public_documents", "public_doc_content", "learned", "static"] as const;
	type W = (typeof whitelist)[number];
	const safeTarget: W = whitelist.includes(rawTarget as W)
		? (rawTarget as W)
		: "public_doc_content";

	const webTopic = url.searchParams.get("webTopic")?.trim() || null;

	return {
		limitPerSource,
		sourceName: url.searchParams.get("source")?.trim() || undefined,
		webTopic,
		reindex: doReindex,
		reindexTarget: parseReindexTarget(safeTarget),
		reindexLimit,
		syncSearch: doSync,
	};
}
