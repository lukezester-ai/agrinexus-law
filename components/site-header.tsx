"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Leaf, Search, User as UserIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navBarReveal } from "@/lib/motion-variants";

const navClass =
	"relative rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-300 after:absolute after:inset-x-2 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-gradient-to-r after:from-emerald-400 after:to-cyan-400 after:transition-transform after:duration-300 hover:text-slate-950 hover:after:scale-x-100 dark:text-slate-400 dark:hover:text-white";

const navHighlight =
	"font-bold text-emerald-600 transition-colors duration-300 hover:text-cyan-700 dark:text-emerald-300 dark:hover:text-cyan-200";

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
	const [user, setUser] = useState<User | null>(null);
	const supabase = createClient();

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setUser(session?.user ?? null);
		});
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});
		return () => subscription.unsubscribe();
	}, [supabase.auth]);

	const handleLogout = async () => {
		await supabase.auth.signOut();
		router.push("/");
		router.refresh();
	};

	return (
		<header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-5 sm:pt-4">
			<motion.div
				className="pointer-events-auto flex w-full max-w-6xl min-w-0 items-center justify-between gap-2 rounded-2xl border border-white/40 bg-white/18 px-3 py-2 shadow-[0_8px_36px_-14px_rgba(34,211,238,0.18)] backdrop-blur-[20px] transition-all duration-500 ease-out hover:border-emerald-200/50 hover:shadow-[0_16px_48px_-14px_rgba(74,222,128,0.22)] dark:border-white/12 dark:bg-slate-950/45 dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5)] dark:hover:border-cyan-500/20 dark:hover:shadow-[0_20px_56px_-12px_rgba(34,211,238,0.12)] sm:gap-3 sm:rounded-[1.35rem] sm:px-4 sm:py-2.5 md:px-5"
				variants={navBarReveal(reducedMotion)}
				initial="hidden"
				animate="visible"
			>
				<Link
					href="/"
					className="group flex min-w-0 shrink items-center gap-2 sm:gap-3"
					aria-label="AgriNexus.Law"
				>
					<span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-md ring-2 ring-white/40 transition duration-500 group-hover:scale-[1.05] group-hover:shadow-lg group-hover:shadow-cyan-400/35 group-hover:ring-emerald-200/60 dark:from-emerald-300 dark:via-cyan-400 dark:to-sky-400 dark:text-slate-950 dark:ring-white/20 dark:group-hover:shadow-cyan-400/30 sm:h-10 sm:w-10">
						<span className="absolute inset-0 bg-gradient-to-tr from-white/25 to-transparent opacity-70" aria-hidden />
						<Leaf size={21} className="relative drop-shadow-sm" />
					</span>
					<span className="min-w-0 leading-tight">
						<span className="block text-xs font-black tracking-[0.1em] text-slate-950 sm:text-sm sm:tracking-[0.18em] dark:text-white">
							AGRINEXUS
						</span>
						<span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 sm:block sm:text-[11px] sm:tracking-[0.28em] dark:text-cyan-300">
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
				<div className="flex shrink-0 items-center gap-2">
					<Button
						type="button"
						variant="brand"
						size="sm"
						onClick={() => router.push("/search")}
						className="shrink-0 gap-2 sm:px-4"
						aria-label="Отвори търсене в документи"
					>
						<Search size={16} aria-hidden className="opacity-90" />
						<span className="sr-only sm:not-sr-only">Търси</span>
					</Button>
					{user ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleLogout}
							className="shrink-0 gap-2"
							aria-label="Изход"
						>
							<LogOut size={16} aria-hidden />
							<span className="hidden md:inline">Изход</span>
						</Button>
					) : (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => router.push("/vhod")}
							className="shrink-0 gap-2 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800"
							aria-label="Вход"
						>
							<UserIcon size={16} aria-hidden />
							<span className="hidden md:inline">Вход</span>
						</Button>
					)}
				</div>
			</motion.div>
		</header>
	);
}
