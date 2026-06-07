"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
	ArrowRight,
	CalendarDays,
	ClipboardCheck,
	FileSearch,
	Gauge,
	Keyboard,
	Search,
	Sparkles,
	Upload,
	UserRoundCog,
	Wheat,
	X,
} from "lucide-react";

const commands = [
	{
		label: "Питай AI асистента",
		description: "Задай въпрос за субсидии, договори, срокове или документи",
		href: "/#chat",
		keywords: "ai чат въпрос помощ субсидии договори документи",
		Icon: Sparkles,
	},
	{
		label: "Търсене в документи",
		description: "Наредби, процедури, указания и PDF източници",
		href: "/search",
		keywords: "документи наредби процедури pdf търсене",
		Icon: FileSearch,
	},
	{
		label: "AI преглед на документ",
		description: "Подготви договор, ДФЗ документ или уведомление за structured AI анализ",
		href: "/document-review",
		keywords: "преглед документ договор дфз анализ checklist ai",
		Icon: ClipboardCheck,
	},
	{
		label: "Срокове и кампании",
		description: "Следи важни прозорци, заявления и оперативни рискове",
		href: "/srokove",
		keywords: "срокове кампания заявления дфз",
		Icon: CalendarDays,
	},
	{
		label: "Моята ферма",
		description: "Профил на стопанството за по-точни AI отговори",
		href: "/moya-ferma",
		keywords: "ферма профил стопанство култури площи",
		Icon: Wheat,
	},
	{
		label: "Калкулатори",
		description: "Практически сметки за стопанството",
		href: "/kalkulator",
		keywords: "калкулатор сметки разходи",
		Icon: Gauge,
	},
	{
		label: "Статистики",
		description: "Култури, трендове и агро данни",
		href: "/statistiki",
		keywords: "статистики култури данни цени добиви",
		Icon: Search,
	},
	{
		label: "Качи PDF",
		description: "Админ качване и индексиране на документ",
		href: "/admin",
		keywords: "admin pdf качи документ индекс rag",
		Icon: Upload,
	},
	{
		label: "Диагностика",
		description: "Провери runtime, env readiness и RAG индекс",
		href: "/admin/diagnostics",
		keywords: "диагностика rag health env admin",
		Icon: UserRoundCog,
	},
] as const;

function normalize(value: string) {
	return value.trim().toLowerCase();
}

export function CommandPalette() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			const isTyping =
				target?.tagName === "INPUT" ||
				target?.tagName === "TEXTAREA" ||
				target?.isContentEditable;
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				setOpen((value) => !value);
				return;
			}
			if (!isTyping && event.key === "/") {
				event.preventDefault();
				setOpen(true);
			}
			if (event.key === "Escape") setOpen(false);
		};
		const onOpenCommandPalette = () => setOpen(true);
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("agrinexus:open-command-palette", onOpenCommandPalette);
		return () => {
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("agrinexus:open-command-palette", onOpenCommandPalette);
		};
	}, []);

	useEffect(() => {
		if (!open) return;
		const id = window.setTimeout(() => inputRef.current?.focus(), 40);
		return () => window.clearTimeout(id);
	}, [open]);

	const filteredCommands = useMemo(() => {
		const needle = normalize(query);
		if (!needle) return commands;
		return commands.filter((command) => {
			const haystack = normalize(`${command.label} ${command.description} ${command.keywords}`);
			return haystack.includes(needle);
		});
	}, [query]);

	const close = () => {
		setOpen(false);
		setQuery("");
	};

	const goTo = (href: string) => {
		close();
		router.push(href);
	};

	const askAi = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const text = query.trim();
		if (!text) return;
		close();
		router.push(`/?chatQ=${encodeURIComponent(text)}#chat`);
	};

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="fixed bottom-[6.6rem] right-4 z-40 hidden items-center gap-2 rounded-full border border-white/55 bg-white/86 px-4 py-2 text-xs font-semibold text-slate-700 shadow-[0_16px_42px_-22px_rgba(15,23,42,0.5)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-800 dark:border-white/10 dark:bg-slate-950/82 dark:text-slate-200 dark:hover:border-cyan-500/40 dark:hover:text-cyan-200 md:flex"
				aria-label="Отвори command palette"
			>
				<Keyboard size={15} />
				<span>Ctrl K</span>
			</button>

			{open ? (
				<div className="fixed inset-0 z-[70] bg-slate-950/35 px-3 py-16 backdrop-blur-sm dark:bg-black/55 sm:px-6" role="dialog" aria-modal="true">
					<div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-white/55 bg-white/96 shadow-[0_32px_90px_-32px_rgba(15,23,42,0.65)] dark:border-white/10 dark:bg-slate-950/96">
						<div className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3 dark:border-slate-800">
							<div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
								<Keyboard size={17} className="text-cyan-700 dark:text-cyan-300" />
								<span>Бързи команди</span>
							</div>
							<button
								type="button"
								onClick={close}
								className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
								aria-label="Затвори"
							>
								<X size={18} />
							</button>
						</div>

						<form onSubmit={askAi} className="border-b border-slate-200/80 p-4 dark:border-slate-800">
							<label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-inner dark:border-slate-800 dark:bg-slate-900/80">
								<Search size={18} className="shrink-0 text-slate-400" />
								<input
									ref={inputRef}
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									placeholder="Потърси команда или напиши въпрос към AI..."
									className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
								/>
								<button
									type="submit"
									disabled={!query.trim()}
									className="hidden shrink-0 items-center gap-1 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100 sm:inline-flex"
								>
									Питай <ArrowRight size={13} />
								</button>
							</label>
						</form>

						<div className="max-h-[55vh] overflow-y-auto p-2">
							{filteredCommands.length ? (
								filteredCommands.map(({ label, description, href, Icon }) => (
									<button
										key={href}
										type="button"
										onClick={() => goTo(href)}
										className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-cyan-50/80 dark:hover:bg-cyan-950/30"
									>
										<span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-cyan-800 dark:from-emerald-950 dark:to-cyan-950 dark:text-cyan-200">
											<Icon size={18} />
										</span>
										<span className="min-w-0 flex-1">
											<span className="block text-sm font-semibold text-slate-950 dark:text-white">{label}</span>
											<span className="mt-0.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</span>
										</span>
										<ArrowRight size={15} className="shrink-0 text-slate-300" />
									</button>
								))
							) : (
								<div className="grid gap-3 px-4 py-8 text-center">
									<Sparkles className="mx-auto text-cyan-700 dark:text-cyan-300" size={24} />
									<p className="text-sm font-medium text-slate-700 dark:text-slate-200">Няма намерена команда.</p>
									<p className="text-xs text-slate-500 dark:text-slate-400">Натисни Enter, за да изпратиш текста като AI въпрос.</p>
								</div>
							)}
						</div>
					</div>
				</div>
			) : null}
		</>
	);
}
