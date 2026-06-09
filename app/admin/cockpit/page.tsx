import Link from "next/link";
import {
	Activity,
	AlertTriangle,
	BarChart3,
	BrainCircuit,
	CheckCircle2,
	Database,
	FileText,
	GitBranch,
	Layers3,
	Scale,
	Server,
	ShieldCheck,
	Sparkles,
	Upload,
	Users,
} from "lucide-react";
import { SitePageShell } from "@/components/site-page-shell";
import { getRagIndexStatus } from "@/lib/rag/rag-index-status";
import { getSiteVisitStats, isSiteVisitCounterConfigured } from "@/lib/site-visit-counter";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type LatestDocument = {
	title: string | null;
	category: string | null;
	source_url: string | null;
	created_at: string | null;
};

type CockpitData = {
	timestamp: string;
	runtime: {
		nodeEnv: string;
		siteUrl: string | null;
		supabaseConfigured: boolean;
		visitCounterConfigured: boolean;
	};
	counts: {
		chatLogs: number;
		publicDocuments: number;
		documentReviews: number;
		learnedItems: number;
		totalVisits: number;
		uniqueVisitors: number;
	};
	latestDocuments: LatestDocument[];
	rag: Awaited<ReturnType<typeof getRagIndexStatus>>;
};

const readinessModules = [
	{
		label: "AI Brain",
		description: "Общ слой за RAG, чат, document intelligence и тежки задачи.",
		status: "стартиран",
		Icon: BrainCircuit,
	},
	{
		label: "Agrinexus Law",
		description: "Документи, договори, анализ на риск и case memory.",
		status: "MVP",
		Icon: Scale,
	},
	{
		label: "Knowledge Graph",
		description: "Връзки между документи, ферми, парцели, фирми и случаи.",
		status: "следва",
		Icon: GitBranch,
	},
	{
		label: "Executive Cockpit",
		description: "Една страница за health, AI usage, документи и readiness.",
		status: "активно",
		Icon: BarChart3,
	},
	{
		label: "TerraIQ",
		description: "Парцели, почви, култури и агро intelligence.",
		status: "планиран",
		Icon: Layers3,
	},
	{
		label: "Academy / Marketplace",
		description: "Курсове, тестове, услуги, оферти и партньорска мрежа.",
		status: "планиран",
		Icon: Users,
	},
] as const;

function formatCount(value: number) {
	return new Intl.NumberFormat("bg-BG").format(value);
}

function formatDate(value: string | null) {
	if (!value) return "—";
	return new Intl.DateTimeFormat("bg-BG", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

async function safeCount(table: string) {
	const supabase = getSupabaseAdmin();
	if (!supabase) return 0;
	const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
	if (error) return 0;
	return count ?? 0;
}

async function getLatestDocuments(): Promise<LatestDocument[]> {
	const supabase = getSupabaseAdmin();
	if (!supabase) return [];
	const { data, error } = await supabase
		.from("public_documents")
		.select("title, category, source_url, created_at")
		.order("created_at", { ascending: false })
		.limit(5);
	if (error) return [];
	return data || [];
}

async function getCockpitData(): Promise<CockpitData> {
	const visitCounterConfigured = isSiteVisitCounterConfigured();
	const [rag, chatLogs, publicDocuments, documentReviews, learnedItems, latestDocuments, visitStats] = await Promise.all([
		getRagIndexStatus(),
		safeCount("chat_logs"),
		safeCount("public_documents"),
		safeCount("document_reviews"),
		safeCount("knowledge_learned_items"),
		getLatestDocuments(),
		visitCounterConfigured ? getSiteVisitStats() : Promise.resolve({ totalVisits: 0, uniqueVisitors: 0 }),
	]);

	return {
		timestamp: new Date().toISOString(),
		runtime: {
			nodeEnv: process.env.NODE_ENV || "development",
			siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
			supabaseConfigured: Boolean(getSupabaseAdmin()),
			visitCounterConfigured,
		},
		counts: {
			chatLogs,
			publicDocuments,
			documentReviews,
			learnedItems,
			totalVisits: visitStats.totalVisits,
			uniqueVisitors: visitStats.uniqueVisitors,
		},
		latestDocuments,
		rag,
	};
}

function StatusBadge({ ok, label }: { ok: boolean; label?: string }) {
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
				ok
					? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700/70 dark:bg-emerald-950/40 dark:text-emerald-200"
					: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/70 dark:bg-amber-950/40 dark:text-amber-200"
			}`}
		>
			{ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
			{label || (ok ? "готово" : "внимание")}
		</span>
	);
}

function MetricCard({
	label,
	value,
	description,
	Icon,
}: {
	label: string;
	value: string;
	description: string;
	Icon: typeof Activity;
}) {
	return (
		<section className="glass-card rounded-3xl p-5">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
					<p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{value}</p>
					<p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
				</div>
				<div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-200">
					<Icon size={22} />
				</div>
			</div>
		</section>
	);
}

export default async function AdminCockpitPage() {
	const data = await getCockpitData();
	const ragCoverage = data.rag.totalChunks > 0 ? Math.round((data.rag.withEmbedding / data.rag.totalChunks) * 100) : 0;
	const overallReady = data.runtime.supabaseConfigured && data.rag.healthy;

	return (
		<SitePageShell
			maxWidth="7xl"
			subheader={<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Админ · Executive Cockpit</p>}
		>
			<div className="grid gap-6">
				<section className="glass-panel rounded-3xl p-6 sm:p-8">
					<div className="flex flex-wrap items-start justify-between gap-5">
						<div>
							<div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-800 dark:bg-cyan-950/35 dark:text-cyan-200">
								<BarChart3 size={14} /> Agrinexus 2.0 control room
							</div>
							<h1 className="mt-4 font-display text-3xl font-medium tracking-tight text-slate-950 dark:text-white sm:text-4xl">
								Executive Cockpit
							</h1>
							<p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
								Един екран за runtime, AI/RAG готовност, документи, използване и модулна картина на Agrinexus като операционна система за агробизнеса.
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<StatusBadge ok={overallReady} label={overallReady ? "платформата е готова" : "има проверки"} />
							<Link
								href="/admin/diagnostics"
								className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-800 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-200"
							>
								<Server size={14} /> Диагностика
							</Link>
						</div>
					</div>
				</section>

				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
					<MetricCard label="AI заявки" value={formatCount(data.counts.chatLogs)} description="Записи в chat_logs за измерване на AI usage." Icon={Sparkles} />
					<MetricCard label="Посетители" value={formatCount(data.counts.uniqueVisitors)} description={`Уникални посетители по хеширан браузър/IP отпечатък. Общо посещения: ${formatCount(data.counts.totalVisits)}.`} Icon={Users} />
					<MetricCard label="Документи" value={formatCount(data.counts.publicDocuments)} description="Публични документи в Supabase knowledge pipeline." Icon={FileText} />
					<MetricCard label="AI прегледи" value={formatCount(data.counts.documentReviews)} description="Document Intelligence case reviews в Agrinexus Law." Icon={Scale} />
					<MetricCard label="RAG coverage" value={`${ragCoverage}%`} description={`${formatCount(data.rag.withEmbedding)} от ${formatCount(data.rag.totalChunks)} chunks имат embedding.`} Icon={Database} />
					<MetricCard label="Learned items" value={formatCount(data.counts.learnedItems)} description="Натрупано знание от feedback и вътрешни подобрения." Icon={BrainCircuit} />
				</div>

				<div className="grid gap-6 lg:grid-cols-3">
					<section className="glass-card rounded-3xl p-6 lg:col-span-1">
						<div className="mb-5 flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<ShieldCheck className="text-emerald-700 dark:text-emerald-300" size={20} />
								<h2 className="font-display text-lg font-medium text-slate-950 dark:text-white">Runtime</h2>
							</div>
							<StatusBadge ok={data.runtime.supabaseConfigured} />
						</div>
						<div className="space-y-3 text-sm">
							<p className="flex justify-between gap-4"><span className="text-slate-500">Mode</span><span className="font-semibold">{data.runtime.nodeEnv}</span></p>
							<p className="flex justify-between gap-4"><span className="text-slate-500">Supabase</span><span className="font-semibold">{data.runtime.supabaseConfigured ? "configured" : "missing"}</span></p>
							<p className="flex justify-between gap-4"><span className="text-slate-500">Visit counter</span><span className="font-semibold">{data.runtime.visitCounterConfigured ? "configured" : "missing"}</span></p>
							<p className="grid gap-1"><span className="text-slate-500">URL</span><span className="break-all font-mono text-xs">{data.runtime.siteUrl || "локална среда"}</span></p>
							<p className="grid gap-1"><span className="text-slate-500">Updated</span><span className="font-mono text-xs">{data.timestamp}</span></p>
						</div>
					</section>

					<section className="glass-card rounded-3xl p-6 lg:col-span-2">
						<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<Database className="text-teal-700 dark:text-teal-300" size={20} />
								<h2 className="font-display text-lg font-medium text-slate-950 dark:text-white">RAG health</h2>
							</div>
							<StatusBadge ok={data.rag.healthy} />
						</div>
						<div className="grid gap-3 sm:grid-cols-4">
							{[
								["Chunks", data.rag.totalChunks],
								["Embeddings", data.rag.withEmbedding],
								["Missing", data.rag.withoutEmbedding],
								["Static KB", data.rag.staticKbDocs],
							].map(([label, value]) => (
								<div key={label} className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
									<p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
									<p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{value}</p>
								</div>
							))}
						</div>
						{data.rag.hints.length ? (
							<div className="mt-5 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/70 dark:bg-amber-950/30 dark:text-amber-100">
								{data.rag.hints.join(" · ")}
							</div>
						) : null}
					</section>
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<section className="glass-card rounded-3xl p-6">
						<div className="mb-5 flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<FileText className="text-cyan-700 dark:text-cyan-300" size={20} />
								<h2 className="font-display text-lg font-medium text-slate-950 dark:text-white">Последни документи</h2>
							</div>
							<Link href="/admin" className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-800 hover:text-cyan-600 dark:text-cyan-200">
								<Upload size={14} /> Качи
							</Link>
						</div>
						<div className="grid gap-3">
							{data.latestDocuments.length ? data.latestDocuments.map((document) => (
								<div key={`${document.title}-${document.created_at}`} className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
									<p className="line-clamp-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{document.title || "Без заглавие"}</p>
									<p className="mt-2 text-xs text-slate-500">{document.category || "Без категория"} · {formatDate(document.created_at)}</p>
									{document.source_url ? <p className="mt-2 truncate font-mono text-xs text-slate-400">{document.source_url}</p> : null}
								</div>
							)) : (
								<div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
									Няма намерени документи или Supabase не е конфигуриран.
								</div>
							)}
						</div>
					</section>

					<section className="glass-card rounded-3xl p-6">
						<div className="mb-5 flex items-center gap-2">
							<Layers3 className="text-violet-700 dark:text-violet-300" size={20} />
							<h2 className="font-display text-lg font-medium text-slate-950 dark:text-white">Agrinexus 2.0 readiness</h2>
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							{readinessModules.map(({ label, description, status, Icon }) => (
								<div key={label} className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
									<div className="flex items-start justify-between gap-3">
										<Icon className="mt-0.5 text-violet-700 dark:text-violet-300" size={18} />
										<span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{status}</span>
									</div>
									<p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
									<p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
								</div>
							))}
						</div>
					</section>
				</div>
			</div>
		</SitePageShell>
	);
}
