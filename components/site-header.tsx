"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Search } from "lucide-react";

/** Единна навигация за всички публични страници (графичен дизайн). */
export function SiteHeader() {
	const router = useRouter();

	return (
		<header className="sticky top-0 z-30 border-b border-white/10 bg-white/70 backdrop-blur-2xl dark:border-slate-800/50 dark:bg-slate-950/70">
			<div className="mx-auto flex max-w-7xl min-w-0 items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6">
				<Link href="/" className="flex min-w-0 shrink items-center gap-2 sm:gap-3" aria-label="AgriNexus.Law">
					<span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-emerald-950 text-white shadow-sm sm:h-10 sm:w-10 dark:bg-emerald-500 dark:text-emerald-950">
						<Leaf size={21} />
					</span>
					<span className="min-w-0 leading-tight">
						<span className="block text-xs font-black tracking-[0.1em] text-slate-950 sm:text-sm sm:tracking-[0.18em] dark:text-white">
							AGRINEXUS
						</span>
						<span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 sm:block sm:text-[11px] sm:tracking-[0.28em] dark:text-emerald-300">
							Law Intelligence
						</span>
					</span>
				</Link>
				<nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
					<Link href="/search" className="hover:text-slate-950 dark:hover:text-white">
						Документи
					</Link>
					<Link href="/srokove" className="hover:text-slate-950 dark:hover:text-white">
						Срокове
					</Link>
					<Link href="/kalkulator" className="hover:text-slate-950 dark:hover:text-white">
						Калкулатори
					</Link>
					<Link href="/statistiki" className="hover:text-slate-950 dark:hover:text-white">
						Статистики
					</Link>
					<Link
						href="/moya-ferma"
						className="font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
					>
						Моята ферма
					</Link>
					<Link href="/admin" className="hover:text-slate-950 dark:hover:text-white">
						Качи PDF
					</Link>
				</nav>
				<button
					type="button"
					onClick={() => router.push("/search")}
					className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 sm:gap-2 sm:px-4 dark:bg-white dark:text-slate-950 dark:hover:bg-emerald-100"
					aria-label="Отвори търсене в документи"
				>
					<Search size={16} aria-hidden />
					<span className="sr-only sm:not-sr-only">Търси</span>
				</button>
			</div>
		</header>
	);
}
