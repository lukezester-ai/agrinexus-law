"use client";

import { useMemo } from "react";
import { CalendarClock } from "lucide-react";
import {
	formatDeadlineHeadline,
	getActiveDeadlines,
	line,
	type CommandDeadline,
} from "@/lib/command-center-data";

type Lang = "bg" | "en";

const UI: Record<
	Lang,
	{
		pageTitle: string;
		pageSub: string;
		govNote: string;
		sectionDeadlines: string;
	}
> = {
	bg: {
		pageTitle: "Твоите срокове",
		pageSub:
			"Ключови дати по кампанията (единно заявление, късно подаване, евентуални аванси). Датите не са правно обвързващи — сверявай с актуална заповед, ИСУН и dfz.bg.",
		govNote:
			"Ориентировъчни срокове за кампания 2026 (пример: без закъснение до средата на май). За официални бланки и подаване ползвай ИСУН и dfz.bg.",
		sectionDeadlines: "До кога",
	},
	en: {
		pageTitle: "Your deadlines",
		pageSub:
			"Key campaign dates (single application, late window, possible advances). Indicative only — confirm in ISUN and on dfz.bg.",
		govNote:
			"Indicative 2026 dates (e.g. mid‑May standard window). For official forms and filing use ISUN and dfz.bg.",
		sectionDeadlines: "Due dates",
	},
};

type Props = { lang?: Lang };

export function FarmerCommandPanel({ lang = "bg" }: Props) {
	const tr = UI[lang];
	const L = lang;
	const deadlines = useMemo(() => getActiveDeadlines(), []);

	return (
		<div className="glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 p-6 sm:p-10 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.15)] space-y-8 backdrop-blur-xl">
			<div className="relative">
				<div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
					<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
					<span>ОПЕРАТИВЕН КАЛЕНДАР 2026</span>
				</div>
				<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-fuchsia-600">
					{tr.pageTitle}
				</h1>
				<p className="text-base font-medium text-slate-600 dark:text-slate-300 mt-3 leading-relaxed max-w-3xl">
					{tr.pageSub}
				</p>
				<p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-2 italic">
					{tr.govNote}
				</p>
			</div>

			<section>
				<h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
					<CalendarClock size={18} aria-hidden />
					<span>{tr.sectionDeadlines} ({deadlines.length})</span>
				</h2>
				<div className="space-y-4">
					{deadlines.map((d: CommandDeadline) => (
						<div
							key={d.id}
							className="card-hover-pro group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-500/40 flex flex-col sm:flex-row items-start justify-between gap-4"
						>
							<div className="space-y-2 flex-1">
								<h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
									{formatDeadlineHeadline(d, L)}
								</h3>
								<p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
									{line(L, d.action)}
								</p>
								<div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
									<span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
									<span>{line(L, d.sourceNote)}</span>
								</div>
							</div>
							<div className="shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-2 text-center sm:text-right">
								<span className="block text-xs uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Срок до</span>
								<span className="text-sm font-extrabold text-slate-900 dark:text-white">
									{d.dateISO}
								</span>
							</div>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
