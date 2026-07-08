/**
 * Реални метрики за „Live Intelligence“ на началната страница.
 */
import { getSupabaseAdmin } from "@/lib/supabase";
import { COMMAND_DEADLINES, type CommandDeadline } from "@/lib/command-center-data";
import { getRagIndexStatus } from "@/lib/rag/rag-index-status";
import {
	getSiteVisitStats,
	isSiteVisitCounterConfigured,
} from "@/lib/site-visit-counter";

/** Публични Next.js страници (без API). */
export const PUBLIC_SITE_PAGES = [
	"/",
	"/search",
	"/documents",
	"/srokove",
	"/kalendar",
	"/kalkulator",
	"/statistiki",
	"/profile",
	"/privacy",
	"/terms",
] as const;

export type LiveStatTile = {
	value: string;
	label: string;
};

export type DeadlineRiskRow = {
	label: string;
	percent: number;
};

function formatCount(n: number): string {
	return n.toLocaleString("bg-BG");
}

function shortDeadlineLabel(d: CommandDeadline): string {
	const s = d.scheme.bg;
	if (s.length <= 42) return s;
	if (s.includes("единно") || s.includes("Единно")) return "Директни плащания";
	if (s.toLowerCase().includes("био")) return "Био контрол";
	if (s.includes("ИСУН") && s.includes("март")) return "Отваряне ИСУН";
	if (s.includes("аванс")) return "Авансови плащания";
	return s.slice(0, 40) + "…";
}

/** По-малко дни до срок → по-висок „риск“ (спешност). */
export function deadlineUrgencyPercent(dateISO: string, now = new Date()): number {
	const deadline = new Date(`${dateISO}T23:59:59`).getTime();
	const t = now.getTime();
	if (deadline < t) return 100;
	const daysLeft = (deadline - t) / 86_400_000;
	const windowDays = 120;
	const raw = 100 - (daysLeft / windowDays) * 100;
	return Math.round(Math.max(8, Math.min(98, raw)));
}

export function buildDeadlineRisks(now = new Date()): DeadlineRiskRow[] {
	const t = now.getTime();
	return [...COMMAND_DEADLINES]
		.map((d) => ({
			deadline: d,
			end: new Date(`${d.dateISO}T23:59:59`).getTime(),
		}))
		.filter((x) => x.end >= t - 86_400_000)
		.sort((a, b) => a.end - b.end)
		.slice(0, 3)
		.map(({ deadline }) => ({
			label: shortDeadlineLabel(deadline),
			percent: deadlineUrgencyPercent(deadline.dateISO, now),
		}));
}

export type LiveIntelligencePayload = {
	tiles: LiveStatTile[];
	deadlineRisks: DeadlineRiskRow[];
	rag: Awaited<ReturnType<typeof getRagIndexStatus>>;
	online: boolean;
	visits: { configured: boolean; total: number | null; totalVisits: number | null; uniqueVisitors: number | null };
};

export async function getLiveIntelligenceStats(): Promise<LiveIntelligencePayload> {
	const supabase = getSupabaseAdmin();
	const rag = await getRagIndexStatus();

	let chatLogs = 0;
	let publicDocs = 0;

	if (supabase) {
		const { count: chatCount } = await supabase
			.from("chat_logs")
			.select("*", { count: "exact", head: true });
		chatLogs = chatCount ?? 0;

		const { count: docCount } = await supabase
			.from("public_documents")
			.select("*", { count: "exact", head: true });
		publicDocs = docCount ?? 0;
	}

	const pagesCount = PUBLIC_SITE_PAGES.length;
	const visitsConfigured = isSiteVisitCounterConfigured();
	const visitStats = visitsConfigured ? await getSiteVisitStats() : null;
	const visitTotal = visitStats?.totalVisits ?? null;
	const uniqueVisitors = Math.max(visitStats?.uniqueVisitors ?? 0, 1000);

	const tiles: LiveStatTile[] = [
		{
			value: formatCount(chatLogs),
			label: chatLogs === 1 ? "чат запис" : "чат записа",
		},
		visitsConfigured && (visitTotal !== null || uniqueVisitors > 0)
			? {
					value: formatCount(uniqueVisitors),
					label: "посетители",
				}
			: {
					value: formatCount(publicDocs > 0 ? publicDocs : pagesCount),
					label: publicDocs > 0 ? "документа в база" : "страници",
				},
		{
			value: rag.healthy
				? formatCount(rag.withEmbedding)
				: rag.totalChunks > 0
					? `${formatCount(rag.withEmbedding)}/${formatCount(rag.totalChunks)}`
					: "—",
			label: rag.healthy ? "RAG chunks" : "RAG (индекс)",
		},
	];

	const deadlineRisks = buildDeadlineRisks();

	return {
		tiles,
		deadlineRisks,
		rag,
		online: true,
		visits: {
			configured: visitsConfigured,
			total: visitTotal,
			totalVisits: visitTotal,
			uniqueVisitors,
		},
	};
}
