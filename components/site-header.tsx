"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createOptionalClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Scale, Search, User as UserIcon, LogOut } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";
import { navBarReveal } from "@/lib/motion-variants";

const navClass =
	"relative shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition-all duration-300 after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:bg-gradient-to-r after:from-emerald-500 after:to-fuchsia-500 after:transition-transform after:duration-300 hover:text-emerald-600 hover:bg-emerald-500/10 hover:after:scale-x-100 dark:text-slate-300 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/15";

const navHighlight =
	"font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-fuchsia-600 transition-all duration-300 hover:opacity-80 dark:from-emerald-400 dark:to-fuchsia-400";

type NavLink = { href: string; label: string; highlight: boolean; external?: boolean };

const NAV_LINKS: readonly NavLink[] = [
	{ href: "/za-nas", label: "За нас", highlight: false },
	{ href: "/ceni", label: "Цени", highlight: true },
	{ href: "/search", label: "Документи", highlight: false },
	{ href: "/document-review", label: "AI преглед", highlight: true },
	{ href: "/srokove", label: "Срокове", highlight: false },
	{ href: "/kalkulator", label: "Калкулатори", highlight: false },
	{ href: "/statistiki", label: "Статистики", highlight: false },
	{ href: "/moya-ferma", label: "Моята ферма", highlight: false },
	{ href: "https://www.officiabg.com/bg", label: "Officia", highlight: true, external: true },
	{ href: "/admin", label: "Качи PDF", highlight: false },
];

/** Единна плаваща навигация — стъклена лента + Framer Motion. */
export function SiteHeader() {
	const router = useRouter();
	const reducedMotion = useReducedMotion();
	const [user, setUser] = useState<User | null>(null);
	const supabase = useMemo(() => createOptionalClient(), []);

	useEffect(() => {
		if (!supabase) return;
		supabase.auth.getSession().then(({ data: { session } }) => {
			setUser(session?.user ?? null);
		});
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});
		return () => subscription.unsubscribe();
	}, [supabase]);

	const handleLogout = async () => {
		if (!supabase) return;
		await supabase.auth.signOut();
		router.push("/");
		router.refresh();
	};

	return (
		<header className="pointer-events-none fixed inset-x-0 top-2.5 z-50 flex justify-center px-3 sm:px-6">
			<motion.div
				className="pointer-events-auto flex w-full max-w-7xl min-w-0 items-center justify-between gap-2 rounded-2xl border border-emerald-500/30 bg-white/85 px-4 py-2.5 shadow-[0_12px_36px_-12px_rgba(16,185,129,0.25),0_4px_16px_-6px_rgba(217,70,239,0.15)] backdrop-blur-xl transition-all duration-500 ease-out hover:border-emerald-500/50 hover:shadow-[0_18px_48px_-12px_rgba(16,185,129,0.35),0_8px_24px_-6px_rgba(217,70,239,0.22)] dark:border-emerald-500/25 dark:bg-slate-950/75 dark:shadow-[0_12px_40px_-8px_rgba(16,185,129,0.3)] dark:hover:border-fuchsia-500/30 dark:hover:shadow-[0_20px_56px_-12px_rgba(217,70,239,0.25)] sm:gap-3 sm:rounded-2xl"
				variants={navBarReveal(reducedMotion)}
				initial="hidden"
				animate="visible"
			>
				<Link
					href="/"
					className="group flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3"
					aria-label="AgriNexus.Law"
				>
					<span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-fuchsia-600 text-white shadow-md shadow-emerald-500/25 transition-transform duration-300 group-hover:scale-105 sm:h-10 sm:w-10">
						<Scale size={20} className="relative drop-shadow-sm" />
					</span>
					<span className="min-w-0 leading-tight">
						<span className="block text-xs font-extrabold tracking-tight text-slate-900 sm:text-sm dark:text-white">
							AGRINEXUS
						</span>
						<span className="hidden text-[10px] font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-fuchsia-600 sm:block mt-0.5">
							Law & Farm AI
						</span>
					</span>
				</Link>
				<nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden text-sm xl:flex" aria-label="Основна навигация">
					{NAV_LINKS.map((item) =>
						item.external ? (
							<a
								key={item.href}
								href={item.href}
								target="_blank"
								rel="noreferrer"
								className={item.highlight ? `${navClass} ${navHighlight}` : navClass}
							>
								{item.label}
							</a>
						) : (
							<Link
								key={item.href}
								href={item.href}
								className={item.highlight ? `${navClass} ${navHighlight}` : navClass}
							>
								{item.label}
							</Link>
						),
					)}
				</nav>
				<div className="flex shrink-0 items-center gap-2">
					<Button
						type="button"
						size="sm"
						onClick={() => router.push("/search")}
						className="shrink-0 gap-2 sm:px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-full shadow-md shadow-emerald-600/25 transition-all hover:scale-105"
						aria-label="Отвори търсене в документи"
					>
						<Search size={16} aria-hidden className="opacity-90" />
						<span className="sr-only sm:not-sr-only">Търси</span>
					</Button>
					<NotificationBell />
					{user ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleLogout}
							className="shrink-0 gap-2 rounded-full border-slate-300 dark:border-slate-700 hover:border-fuchsia-500 hover:text-fuchsia-600 transition-colors"
							aria-label="Изход"
						>
							<LogOut size={16} aria-hidden />
							<span className="hidden md:inline font-semibold">Изход</span>
						</Button>
					) : (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => router.push("/vhod")}
							className="shrink-0 gap-2 rounded-full border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all font-semibold"
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
