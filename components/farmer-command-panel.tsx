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
		<div className="rounded-2xl border border-teal-200/80 dark:border-teal-800/50 bg-white dark:bg-stone-900/95 p-5 sm:p-6 shadow-sm space-y-6">
			<div>
				<h1 className="text-xl font-semibold text-stone-900 dark:text-stone-50">{tr.pageTitle}</h1>
				<p className="text-sm text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">{tr.pageSub}</p>
				<p className="text-xs text-stone-500 dark:text-stone-500 mt-2">{tr.govNote}</p>
			</div>

			<section>
				<h2 className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400 mb-3 flex items-center gap-2">
					<CalendarClock size={16} aria-hidden />
					{tr.sectionDeadlines}
				</h2>
				<ul className="space-y-3 text-sm text-stone-800 dark:text-stone-200 list-disc pl-5">
					{deadlines.map((d: CommandDeadline) => (
						<li key={d.id}>
							<strong>{formatDeadlineHeadline(d, L)}</strong>
							<div className="text-stone-600 dark:text-stone-400 mt-1 text-[13px] leading-relaxed">
								{line(L, d.action)}
							</div>
							<div className="text-stone-500 dark:text-stone-500 mt-1 text-xs leading-relaxed">
								{line(L, d.sourceNote)}
							</div>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}
