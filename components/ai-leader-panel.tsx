"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, CircleCheck, AlertCircle, Loader2, Play } from "lucide-react";

type AgentMeta = {
	id: string;
	name: string;
	nameBg: string;
	description: string;
	role: string;
};

type AgentRun = {
	ok: boolean;
	agentId: string;
	metrics: Record<string, unknown>;
	recommendations: string[];
	error?: string;
};

type Props = {
	ingestToken: string;
};

export function AiLeaderPanel({ ingestToken }: Props) {
	const [agents, setAgents] = useState<AgentMeta[]>([]);
	const [running, setRunning] = useState(false);
	const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
	const [message, setMessage] = useState("");
	const [lastRuns, setLastRuns] = useState<AgentRun[]>([]);

	useEffect(() => {
		void fetch("/api/agents/run")
			.then((r) => r.json())
			.then((d) => {
				if (Array.isArray(d.agents)) setAgents(d.agents);
			})
			.catch(() => undefined);
	}, []);

	const runAll = useCallback(async () => {
		if (!ingestToken.trim()) {
			setStatus("error");
			setMessage("Въведете INGEST_ADMIN_TOKEN.");
			return;
		}
		setRunning(true);
		setStatus("idle");
		setMessage("");
		setLastRuns([]);
		try {
			const res = await fetch("/api/agents/run", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-ingest-token": ingestToken.trim(),
				},
				body: JSON.stringify({}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Orchestrator failed");
			setLastRuns(data.runs ?? []);
			setStatus(data.ok ? "success" : "error");
			setMessage(data.summary ?? "Готово.");
		} catch (err) {
			setStatus("error");
			setMessage(err instanceof Error ? err.message : "Грешка.");
		} finally {
			setRunning(false);
		}
	}, [ingestToken]);

	const runQuick = useCallback(async () => {
		if (!ingestToken.trim()) {
			setStatus("error");
			setMessage("Въведете INGEST_ADMIN_TOKEN.");
			return;
		}
		setRunning(true);
		setStatus("idle");
		setMessage("");
		setLastRuns([]);
		try {
			const res = await fetch("/api/agents/run", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-ingest-token": ingestToken.trim(),
				},
				body: JSON.stringify({ skipHeavy: true }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Quick run failed");
			setLastRuns(data.runs ?? []);
			setStatus(data.ok ? "success" : "error");
			setMessage(data.summary ?? "Бърз цикъл готов.");
		} catch (err) {
			setStatus("error");
			setMessage(err instanceof Error ? err.message : "Грешка.");
		} finally {
			setRunning(false);
		}
	}, [ingestToken]);

	return (
		<div className="glass-panel rounded-3xl overflow-hidden mb-8">
			<div className="p-8 border-b border-white/10 bg-slate-50/50 dark:bg-slate-900/50">
				<h2 className="font-display text-2xl font-medium text-slate-950 dark:text-white flex items-center gap-3">
					<Bot className="text-violet-600" /> AI Leader — 5 агента, една система
				</h2>
				<p className="text-slate-500 dark:text-slate-400 mt-3 text-sm leading-relaxed">
					Оркестраторът пуска последователно: Пазител → Архивар → Учен → Индексатор → Аналитик.
					Всяка run записва метрики и препоръки (таблица <code className="text-xs bg-slate-200/80 dark:bg-slate-800 px-1 rounded">agent_runs</code>).
				</p>
			</div>

			<div className="p-8 space-y-6">
				<ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
					{agents.map((a) => (
						<li
							key={a.id}
							className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-4 bg-white/40 dark:bg-slate-900/40"
						>
							<p className="font-semibold text-slate-900 dark:text-white">
								{a.nameBg}{" "}
								<span className="text-xs font-normal text-slate-500">({a.id})</span>
							</p>
							<p className="mt-1 text-slate-600 dark:text-slate-400">{a.role}</p>
						</li>
					))}
				</ul>

				<div className="flex flex-wrap gap-3">
					<button
						type="button"
						disabled={running || !ingestToken.trim()}
						onClick={() => void runAll()}
						className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 hover:bg-violet-800 text-white font-bold py-3 px-5 transition disabled:opacity-50"
					>
						{running ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
						Пусни всички 5
					</button>
					<button
						type="button"
						disabled={running || !ingestToken.trim()}
						onClick={() => void runQuick()}
						className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-600 py-3 px-5 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
					>
						Бърз цикъл (без archive/indexer)
					</button>
				</div>

				{status === "success" && (
					<div className="p-4 bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 rounded-2xl flex items-center gap-3 text-sm border border-teal-200 dark:border-teal-800/50">
						<CircleCheck size={18} /> {message}
					</div>
				)}
				{status === "error" && (
					<div className="p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 rounded-2xl flex items-center gap-3 text-sm border border-rose-200 dark:border-rose-800/50">
						<AlertCircle size={18} /> {message}
					</div>
				)}

				{lastRuns.length > 0 && (
					<div className="space-y-2 text-sm">
						{lastRuns.map((run) => {
							const meta = agents.find((a) => a.id === run.agentId);
							return (
								<div
									key={run.agentId}
									className="rounded-lg border border-slate-200 dark:border-slate-700 p-3"
								>
									<p className="font-medium text-slate-900 dark:text-white">
										{meta?.nameBg ?? run.agentId}{" "}
										<span className={run.ok ? "text-teal-600" : "text-rose-600"}>
											{run.ok ? "OK" : "FAIL"}
										</span>
									</p>
									{run.recommendations.slice(0, 2).map((rec) => (
										<p key={rec} className="mt-1 text-slate-600 dark:text-slate-400">
											→ {rec}
										</p>
									))}
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
