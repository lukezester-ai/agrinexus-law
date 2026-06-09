import Link from "next/link";
import { Activity, AlertTriangle, BarChart3, CheckCircle2, Database, KeyRound, Server } from "lucide-react";
import { SitePageShell } from "@/components/site-page-shell";
import { getRagIndexStatus } from "@/lib/rag/rag-index-status";

type Diagnostics = {
	ok: boolean;
	service: string;
	timestamp: string;
	runtime: {
		nodeEnv: string;
		nextPublicSiteUrl: string | null;
	};
	env: Record<string, boolean>;
	rag: {
		healthy: boolean;
		enabled: boolean;
		tableReachable: boolean;
		totalChunks: number;
		withEmbedding: number;
		withoutEmbedding: number;
		bySourceType: Record<string, number>;
		hints: string[];
	};
};

async function getDiagnostics(): Promise<Diagnostics | null> {
	try {
		const rag = await getRagIndexStatus();
		return {
			ok: true,
			service: "agrinexus-mvp",
			timestamp: new Date().toISOString(),
			runtime: {
				nodeEnv: process.env.NODE_ENV || "development",
				nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
			},
			env: {
				openAi: Boolean(process.env.OPENAI_API_KEY?.trim()),
				supabaseUrl: Boolean(
					process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
				),
				supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
				ingestAdminToken: Boolean(process.env.INGEST_ADMIN_TOKEN?.trim()),
				upstashRedis: Boolean(
					process.env.UPSTASH_REDIS_REST_URL?.trim() &&
						process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
				),
				resend: Boolean(process.env.RESEND_API_KEY?.trim()),
			},
			rag: {
				healthy: rag.healthy,
				enabled: rag.enabled,
				tableReachable: rag.tableReachable,
				totalChunks: rag.totalChunks,
				withEmbedding: rag.withEmbedding,
				withoutEmbedding: rag.withoutEmbedding,
				bySourceType: rag.bySourceType,
				hints: rag.hints,
			},
		};
	} catch {
		return null;
	}
}

function StatusBadge({ ok }: { ok: boolean }) {
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
				ok
					? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700/70 dark:bg-emerald-950/40 dark:text-emerald-200"
					: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/70 dark:bg-amber-950/40 dark:text-amber-200"
			}`}
		>
			{ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
			{ok ? "готово" : "внимание"}
		</span>
	);
}

export default async function AdminDiagnosticsPage() {
	const diagnostics = await getDiagnostics();
	const envEntries = diagnostics ? Object.entries(diagnostics.env) : [];
	const ragEntries = diagnostics ? Object.entries(diagnostics.rag.bySourceType || {}) : [];

	return (
		<SitePageShell
			maxWidth="5xl"
			subheader={<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Админ · Диагностика</p>}
		>
			<div className="grid gap-6">
				<div className="glass-panel rounded-3xl p-6 sm:p-8">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-800 dark:bg-cyan-950/35 dark:text-cyan-200">
								<Activity size={14} /> Live status
							</div>
							<h1 className="mt-4 font-display text-3xl font-medium tracking-tight text-slate-950 dark:text-white">
								Системна диагностика
							</h1>
							<p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
								Проверява runtime конфигурация, готовност на ключови integrations и RAG индекса, без да показва тайни стойности.
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							<StatusBadge ok={Boolean(diagnostics?.ok && diagnostics.rag.healthy)} />
							<Link
								href="/admin/cockpit"
								className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-800 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-200"
							>
								<BarChart3 size={14} /> Executive Cockpit
							</Link>
						</div>
					</div>
				</div>

				{diagnostics ? (
					<div className="grid gap-6 lg:grid-cols-3">
						<section className="glass-card rounded-3xl p-6 lg:col-span-1">
							<div className="mb-5 flex items-center gap-2">
								<Server className="text-cyan-700 dark:text-cyan-300" size={20} />
								<h2 className="font-display text-lg font-medium text-slate-950 dark:text-white">Runtime</h2>
							</div>
							<div className="space-y-3 text-sm">
								<p className="flex justify-between gap-4"><span className="text-slate-500">Service</span><span className="font-semibold">{diagnostics.service}</span></p>
								<p className="flex justify-between gap-4"><span className="text-slate-500">Mode</span><span className="font-semibold">{diagnostics.runtime.nodeEnv}</span></p>
								<p className="grid gap-1"><span className="text-slate-500">URL</span><span className="break-all font-mono text-xs">{diagnostics.runtime.nextPublicSiteUrl || "локална среда"}</span></p>
								<p className="grid gap-1"><span className="text-slate-500">Updated</span><span className="font-mono text-xs">{diagnostics.timestamp}</span></p>
							</div>
						</section>

						<section className="glass-card rounded-3xl p-6 lg:col-span-2">
							<div className="mb-5 flex items-center gap-2">
								<KeyRound className="text-emerald-700 dark:text-emerald-300" size={20} />
								<h2 className="font-display text-lg font-medium text-slate-950 dark:text-white">Environment readiness</h2>
							</div>
							<div className="grid gap-3 sm:grid-cols-2">
								{envEntries.map(([key, ok]) => (
									<div key={key} className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950/50">
										<span className="font-medium text-slate-700 dark:text-slate-200">{key}</span>
										<StatusBadge ok={ok} />
									</div>
								))}
							</div>
						</section>

						<section className="glass-card rounded-3xl p-6 lg:col-span-3">
							<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
								<div className="flex items-center gap-2">
									<Database className="text-teal-700 dark:text-teal-300" size={20} />
									<h2 className="font-display text-lg font-medium text-slate-950 dark:text-white">RAG индекс</h2>
								</div>
								<StatusBadge ok={diagnostics.rag.healthy} />
							</div>
							<div className="grid gap-3 sm:grid-cols-4">
								{[
									["Общо chunks", diagnostics.rag.totalChunks],
									["С embedding", diagnostics.rag.withEmbedding],
									["Без embedding", diagnostics.rag.withoutEmbedding],
									["Таблица", diagnostics.rag.tableReachable ? "OK" : "няма достъп"],
								].map(([label, value]) => (
									<div key={label} className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/50">
										<p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
										<p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">{value}</p>
									</div>
								))}
							</div>
							{ragEntries.length ? (
								<div className="mt-5 flex flex-wrap gap-2">
									{ragEntries.map(([key, value]) => (
										<span key={key} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
											{key}: {value}
										</span>
									))}
								</div>
							) : null}
							{diagnostics.rag.hints.length ? (
								<div className="mt-5 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/70 dark:bg-amber-950/30 dark:text-amber-100">
									{diagnostics.rag.hints.join(" · ")}
								</div>
							) : null}
						</section>
					</div>
				) : (
					<div className="rounded-3xl border border-rose-300 bg-rose-50 p-6 text-sm font-medium text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200">
						Диагностиката не отговори. Провери дали приложението работи на очаквания URL.
					</div>
				)}
			</div>
		</SitePageShell>
	);
}
