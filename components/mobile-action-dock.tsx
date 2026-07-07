"use client";

import Link from "next/link";
import { CalendarDays, FileSearch, Home, LayoutDashboard, MessageCircle } from "lucide-react";

const items = [
	{ href: "/", label: "Начало", Icon: Home },
	{ href: "/moya-ferma", label: "Ферма", Icon: LayoutDashboard },
	{ href: "/search", label: "Документи", Icon: FileSearch },
	{ href: "/srokove", label: "Срокове", Icon: CalendarDays },
	{ href: "/#chat", label: "Питай", Icon: MessageCircle },
] as const;

export function MobileActionDock() {
	return (
		<nav
			className="fixed inset-x-3 bottom-3 z-40 rounded-3xl border border-white/45 bg-white/85 px-2 py-2 shadow-[0_18px_54px_-20px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/82 dark:shadow-[0_18px_54px_-16px_rgba(0,0,0,0.75)] md:hidden"
			aria-label="Бързи действия"
		>
			<div className="grid grid-cols-5 gap-1">
				{items.map((item) => {
					const Icon = item.Icon;
					return (
						<Link
							key={item.href}
							href={item.href}
							className="group flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-[10px] font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800 active:scale-95 dark:text-slate-300 dark:hover:bg-emerald-950/45 dark:hover:text-emerald-200"
						>
							<span className="grid h-8 w-8 place-items-center rounded-2xl bg-slate-100 text-slate-700 transition group-hover:bg-emerald-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:group-hover:bg-emerald-500 dark:group-hover:text-slate-950">
								<Icon size={16} aria-hidden />
							</span>
							<span className="truncate">{item.label}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
