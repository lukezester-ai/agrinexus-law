"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
	BarChart3,
	Calculator,
	CalendarDays,
	ClipboardList,
	FileText,
	LogOut,
	MessageCircle,
	Search,
	User,
	Loader2,
	Wheat,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { loadFarmProfile } from "@/lib/farm-profile";
import { useAuthUser } from "@/hooks/use-auth-user";

export function MoyaFermaDashboard() {
	const router = useRouter();
	const auth = useAuthUser();
	const [farmHint, setFarmHint] = useState<string | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			const p = loadFarmProfile();
			if (!p) return;
			const parts: string[] = [];
			if (p.region) parts.push(p.region);
			if (p.farm_type) parts.push(p.farm_type);
			if (p.total_decares && Number(p.total_decares) > 0) {
				parts.push(`${p.total_decares} дка`);
			}
			if (parts.length) setFarmHint(parts.join(" · "));
		} catch {
			/* ignore */
		}
	}, []);

	const onLogout = async () => {
		const supabase = createBrowserSupabaseClient();
		if (supabase) await supabase.auth.signOut();
		router.push("/");
		router.refresh();
	};

	if (auth.status === "loading" || auth.status === "unconfigured") {
		return (
			<div className="min-h-screen agri-page-bg flex flex-col items-center justify-center gap-3 px-6">
				<Loader2 className="animate-spin text-teal-700 dark:text-teal-400" size={28} />
				<p className="text-sm text-stone-600 dark:text-stone-400">
					{auth.status === "unconfigured"
						? "Тук ще се появи панелът след настройка на Supabase."
						: "Зареждане на профила…"}
				</p>
				<Link href="/" className="text-sm text-[#0d9488] dark:text-teal-400 underline">
					Към началото
				</Link>
			</div>
		);
	}

	if (auth.status === "anonymous") {
		return (
			<div className="min-h-screen agri-page-bg flex flex-col items-center justify-center gap-4 px-6 text-center">
				<p className="text-sm text-stone-600 dark:text-stone-400 max-w-sm">
					Нужен е вход за „Моя ферма“.
				</p>
				<Link
					href="/vhod?redirect=/moya-ferma"
					className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-white"
					style={{ background: "#0d9488" }}>
					Вход с имейл
				</Link>
			</div>
		);
	}

	const email = auth.user.email ?? "Потребител";

	const tiles: Array<{
		href: string;
		title: string;
		desc: string;
		icon: ReactNode;
	}> = [
		{
			href: "/kalkulator",
			title: "Калкулатор на субсидии",
			desc: "Ориентировъчна сума по декари и тип стопанство — споделя се лесно.",
			icon: (
				<Calculator size={22} className="text-[#0d9488] dark:text-teal-400" />
			),
		},
		{
			href: "/kalendar",
			title: "Сезонен календар",
			desc: "Месечни задачи по култура + ключови дати ДФЗ (ориентир).",
			icon: (
				<CalendarDays
					size={22}
					className="text-[#0d9488] dark:text-teal-400"
				/>
			),
		},
		{
			href: "/statistiki",
			title: "Статистика по култури",
			desc: "Демо серии производство, прогноза и напояване по избрана култура.",
			icon: (
				<BarChart3 size={22} className="text-[#0d9488] dark:text-teal-400" />
			),
		},
		{
			href: "/srokove",
			title: "Твоите срокове",
			desc: "Ориентировъчни дати ДФЗ и чернови PDF.",
			icon: (
				<ClipboardList size={22} className="text-[#0d9488] dark:text-teal-400" />
			),
		},
		{
			href: "/profile",
			title: "Профил на стопанството",
			desc: "Тип, регион, декари и култури — по-точни отговори от екипа.",
			icon: <User size={22} className="text-[#0d9488] dark:text-teal-400" />,
		},
		{
			href: "/documents",
			title: "Документи",
			desc: "Качвай файлове — в облак (влязъл акаунт) или локално в браузъра.",
			icon: (
				<FileText size={22} className="text-[#0d9488] dark:text-teal-400" />
			),
		},
		{
			href: "/search",
			title: "Търсачка ДФЗ",
			desc: "Субсидии, наредби и срокове в базата знания.",
			icon: <Search size={22} className="text-[#0d9488] dark:text-teal-400" />,
		},
		{
			href: "/#chat",
			title: "Чат с екипа",
			desc: "Елена, Борис и Виктория — питай специалиста за твоя случай.",
			icon: (
				<MessageCircle
					size={22}
					className="text-[#0d9488] dark:text-teal-400"
				/>
			),
		},
	];

	return (
		<div className="min-h-screen agri-page-bg">
			<header className="sticky top-0 z-20 border-b border-teal-900/25 bg-gradient-to-r from-[#0f766e] to-[#0d9488] text-white shadow-md">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div className="flex items-start gap-4">
						<div
							className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl border border-white/25 bg-white/10 shrink-0"
							aria-hidden>
							<Wheat size={28} className="text-teal-50" />
						</div>
						<div>
							<p className="text-[11px] uppercase tracking-wider text-teal-100/90 mb-1">
								Професионален панел
							</p>
							<h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
								Моя ферма
							</h1>
							<p className="text-sm text-teal-50/90 mt-1 break-all">{email}</p>
							{farmHint && (
								<p className="text-xs text-teal-100/80 mt-2">{farmHint}</p>
							)}
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-2 sm:justify-end">
						<Link
							href="/"
							className="text-sm px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 transition">
							Начална страница
						</Link>
						<button
							type="button"
							onClick={() => void onLogout()}
							className="text-sm px-3 py-2 rounded-lg bg-black/20 hover:bg-black/30 border border-white/15 flex items-center gap-2 transition">
							<LogOut size={16} aria-hidden />
							Изход
						</button>
					</div>
				</div>
			</header>

			<main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
				<p className="text-sm text-stone-600 dark:text-stone-400 mb-6 max-w-2xl leading-relaxed">
					Оттук управляваш основните операции за стопанството си в AgriNexus.Law —
					без да търсиш отделните страници една по една.
				</p>

				<div className="grid sm:grid-cols-2 gap-4">
					{tiles.map((t) => (
						<Link
							key={t.href}
							href={t.href}
							className="group bg-white dark:bg-stone-900/95 rounded-xl border border-stone-200 dark:border-stone-700 p-5 shadow-sm hover:border-teal-300 dark:hover:border-teal-600/60 hover:shadow-md transition flex gap-4">
							<div className="w-11 h-11 rounded-lg bg-[#ecfdf8] dark:bg-teal-950/55 flex items-center justify-center shrink-0 border border-stone-100 dark:border-teal-900/40">
								{t.icon}
							</div>
							<div className="min-w-0">
								<h2 className="font-medium text-stone-900 dark:text-stone-50 group-hover:text-[#0d9488] dark:group-hover:text-teal-400 transition">
									{t.title}
								</h2>
								<p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
									{t.desc}
								</p>
							</div>
						</Link>
					))}
				</div>

				<p className="text-xs text-stone-500 dark:text-stone-500 mt-8 max-w-xl leading-relaxed">
					Профилът на стопанството се пази в браузъра; документите при вход с имейл се записват в Supabase по твоя акаунт (виж supabase-setup.sql).
				</p>
			</main>
		</div>
	);
}
