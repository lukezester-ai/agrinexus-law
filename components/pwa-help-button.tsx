"use client";

import { HelpCircle } from "lucide-react";

const OPEN_HELP_EVENT = "agrinexus:open-help";

export function PwaHelpButton() {
	const openHelp = () => {
		if (typeof window === "undefined") return;
		window.dispatchEvent(new Event(OPEN_HELP_EVENT));
	};

	return (
		<button
			type="button"
			onClick={openHelp}
			aria-label="Помощ за инсталиране"
			className="fixed bottom-4 left-4 z-[60] inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-white/95 text-emerald-800 shadow-lg backdrop-blur transition hover:border-emerald-400 hover:bg-white dark:border-emerald-800 dark:bg-slate-900/95 dark:text-emerald-200"
		>
			<HelpCircle size={20} />
		</button>
	);
}
