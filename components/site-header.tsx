"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Leaf, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navBarReveal } from "@/lib/motion-variants";

const navClass =
	"relative rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-300 after:absolute after:inset-x-2 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-gradient-to-r after:from-teal-500 after:to-indigo-500 after:transition-transform after:duration-300 hover:text-slate-950 hover:after:scale-x-100 dark:text-slate-400 dark:hover:text-white";

const navHighlight =
	"font-bold text-emerald-700 transition-colors duration-300 hover:text-emerald-900 dark:text-teal-300 dark:hover:text-teal-100";

const NAV_LINKS = [
	{ href: "/search", label: "Документи", highlight: false },
	{ href: "/srokove", label: "Срокове", highlight: false },
	{ href: "/kalkulator", label: "Калкулатори", highlight: false },
	{ href: "/statistiki", label: "Статистики", highlight: false },
	{ href: "/moya-ferma", label: "Моята ферма", highlight: true },
	{ href: "/admin", label: "Качи PDF", highlight: false },
] as const;

/** Единна плаваща навигация — стъклена лента + Framer Motion. */
export function SiteHeader() {
	const router = useRouter();
	const reducedMotion = useReducedMotion();

	return (
		<header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-5 sm:pt-4">
			<motion.div
				className="pointer-events-auto flex w-full max-w-6xl min-w-0 items-center justify-between gap-2 rounded-2xl border border-white/35 bg-white/72 px-3 py-2 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.2)] backdrop-blur-2xl transition-all duration-500 ease-out hover:border-teal-200/60 hover:shadow-[0_16px_48px_-16px_rgba(13,148,136,0.18)] dark:border-white/12 dark:bg-slate-950/58 dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)] dark:hover:border-teal-500/25 dark:hover:shadow-[0_20px_56px_-12px_rgba(45,212,191,0.12)] sm:gap-3 sm:rounded-[1.35rem] sm:px-4 sm:py-2.5 md:px-5"
				variants={navBarReveal(reducedMotion)}
				initial="hidden"
				animate="visible"
			>
				<Link
					href="/"
					className="group flex min-w-0 shrink items-center gap-2 sm:gap-3"
					aria-label="AgriNexus.Law"
				>
					<span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-700 text-white shadow-md ring-2 ring-white/30 transition duration-500 group-hover:scale-[1.04] group-hover:shadow-lg group-hover:shadow-teal-500/30 group-hover:ring-teal-300/50 dark:from-teal-400 dark:via-emerald-500 dark:to-indigo-600 dark:text-slate-950 dark:ring-teal-400/25 dark:group-hover:shadow-teal-400/35 sm:h-10 sm:w-10">
						<span className="absolute inset-0 bg-gradient-to-tr from-white/25 to-transparent opacity-70" aria-hidden />
						<Leaf size={21} className="relative drop-shadow-sm" />
					</span>
					<span className="min-w-0 leading-tight">
						<span className="block text-xs font-black tracking-[0.1em] text-slate-950 sm:text-sm sm:tracking-[0.18em] dark:text-white">
							AGRINEXUS
						</span>
						<span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 sm:block sm:text-[11px] sm:tracking-[0.28em] dark:text-teal-300">
							Law Intelligence
						</span>
					</span>
				</Link>
				<nav className="hidden min-w-0 items-center gap-1 text-sm md:flex lg:gap-2" aria-label="Основна навигация">
					{NAV_LINKS.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className={item.highlight ? `${navClass} ${navHighlight}` : navClass}
						>
							{item.label}
						</Link>
					))}
				</nav>
				<Button
					type="button"
					variant="default"
					size="sm"
					onClick={() => router.push("/search")}
					className="shrink-0 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-900 text-white shadow-md transition-all duration-300 hover:scale-[1.03] hover:from-emerald-700 hover:via-teal-700 hover:to-indigo-800 hover:shadow-lg hover:shadow-teal-500/25 active:scale-[0.98] sm:gap-2 sm:px-4 dark:bg-gradient-to-r dark:from-white dark:via-slate-100 dark:to-teal-100 dark:text-slate-950 dark:hover:from-teal-200 dark:hover:via-white dark:hover:to-indigo-100 dark:hover:shadow-indigo-500/20"
					aria-label="Отвори търсене в документи"
				>
					<Search size={16} aria-hidden className="opacity-90" />
					<span className="sr-only sm:not-sr-only">Търси</span>
				</Button>
			</motion.div>
		</header>
	);
}
