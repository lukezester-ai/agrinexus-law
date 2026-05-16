"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
	ArrowRight,
	BadgeCheck,
	Bell,
	BookOpenCheck,
	Bot,
	Calculator,
	Database,
	ExternalLink,
	FileDown,
	FileText,
	Leaf,
	LineChart,
	LockKeyhole,
	Scale,
	Search,
	ShieldCheck,
	Sparkles,
	Sprout,
	ThumbsDown,
	ThumbsUp,
} from "lucide-react";
import type { KnowledgeDoc } from "@/lib/knowledge/knowledge-types";
import { getKnowledgeSourceUrl } from "@/lib/knowledge/source-links";

type SearchResponse = {
	results?: KnowledgeDoc[];
	engine?: "meili+internal" | "internal-ai";
	aiSummary?: string;
	error?: string;
};

type ChatMessage = {
	role: "user" | "assistant";
	content: string;
	chatLogId?: string | null;
};

type FeedbackState = {
	vote: 1 | -1;
	status: "saving" | "saved" | "error";
};

const CATEGORY_CARDS = [
	{ title: "Субсидии", subtitle: "директни плащания, интервенции, ставки", icon: Sprout },
	{ title: "Закони", subtitle: "наредби, регламенти и изисквания", icon: Scale },
	{ title: "Сертификати", subtitle: "био, GlobalG.A.P. и документи", icon: ShieldCheck },
	{ title: "Био производство", subtitle: "контрол, дневници и преход", icon: Leaf },
	{ title: "Растителна защита", subtitle: "препарати, ограничения, срокове", icon: BookOpenCheck },
	{ title: "ЕС регламенти", subtitle: "EUR-Lex и ОСП рамка", icon: FileText },
	{ title: "Образци", subtitle: "форми, заявления, приложения", icon: FileDown },
	{ title: "Калкулатори", subtitle: "площи, добиви, субсидии", icon: Calculator },
];

const UPDATES = [
	{ badge: "СРОК", title: "Директни плащания и корекции по заявления", meta: "ДФЗ · проследяване на активните прозорци" },
	{ badge: "ПРАВИЛА", title: "Био производство, контрол и задължителни дневници", meta: "Регламенти · консолидирани източници" },
	{ badge: "ДОКУМЕНТИ", title: "Образци за стопанства, заявления и справки", meta: "Вътрешна база · готови за търсене" },
];

const TRUST_POINTS = [
	{ label: "Свързана база", value: "Supabase", icon: Database },
	{ label: "AI търсене", value: "RAG + документи", icon: Bot },
	{ label: "Фокус", value: "Българско земеделие", icon: BadgeCheck },
];

const EXAMPLE_QUERIES = [
	"Какви документи трябват за био сертификат на пшеница?",
	"Кои са сроковете за директни плащания тази кампания?",
	"Обясни ми изискванията за дневници при био стопанство.",
];

export default function Home() {
	const resultsSectionRef = useRef<HTMLElement | null>(null);
	const searchFormRef = useRef<HTMLDivElement | null>(null);
	const searchInputRef = useRef<HTMLInputElement | null>(null);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<KnowledgeDoc[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [aiSummary, setAiSummary] = useState("");
	const [engine, setEngine] = useState<string>("");
	const [filterType, setFilterType] = useState<"all" | KnowledgeDoc["type"]>("all");
	const [chatCharacter, setChatCharacter] = useState<"elena" | "boris" | "viktoria">("elena");
	const [chatInput, setChatInput] = useState("");
	const [chatBusy, setChatBusy] = useState(false);
	const [chatError, setChatError] = useState<string | null>(null);
	const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
	const [feedbackByLogId, setFeedbackByLogId] = useState<Record<string, FeedbackState>>({});
	const [searchFocusPulse, setSearchFocusPulse] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const chatQ = new URLSearchParams(window.location.search).get("chatQ");
		if (!chatQ) return;
		setChatInput((prev) => (prev.trim() ? prev : chatQ));
	}, []);

	const executeSearch = async (rawQuery: string) => {
		const trimmed = rawQuery.trim();
		if (!trimmed) return;
		resultsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
		setLoading(true);
		setError(null);
		setAiSummary("");
		try {
			const res = await fetch("/api/search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query: trimmed, category: "all" }),
			});
			const data = (await res.json().catch(() => ({}))) as SearchResponse;
			if (!res.ok) {
				setError(data.error || "Грешка при търсене.");
				setResults([]);
				return;
			}
			setResults(data.results ?? []);
			setAiSummary(data.aiSummary ?? "");
			setEngine(data.engine ?? "");
		} catch {
			setError("Мрежова грешка. Опитай отново.");
		} finally {
			setLoading(false);
		}
	};

	const filteredResults = useMemo(
		() => results.filter((doc) => (filterType === "all" ? true : doc.type === filterType)),
		[results, filterType],
	);

	const onSearch = async (e: FormEvent) => {
		e.preventDefault();
		await executeSearch(query);
	};

	const jumpToSearch = (prefill?: string, autoRun = false) => {
		const next = (prefill ?? query).trim();
		if (prefill) setQuery(prefill);
		searchFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
		window.setTimeout(() => {
			searchInputRef.current?.focus();
			searchInputRef.current?.setSelectionRange(
				searchInputRef.current.value.length,
				searchInputRef.current.value.length,
			);
			setSearchFocusPulse(true);
			window.setTimeout(() => setSearchFocusPulse(false), 900);
			if (autoRun && next) {
				void executeSearch(next);
			}
		}, 260);
	};

	const sendChat = async (e: FormEvent) => {
		e.preventDefault();
		const text = chatInput.trim();
		if (!text || chatBusy) return;
		const nextMessages: ChatMessage[] = [...chatMessages, { role: "user", content: text }];
		setChatMessages(nextMessages);
		setChatInput("");
		setChatBusy(true);
		setChatError(null);
		try {
			const res = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					characterId: chatCharacter,
					messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
				}),
			});
			const data = (await res.json().catch(() => ({}))) as {
				response?: string;
				error?: string;
				chatLogId?: string | null;
			};
			if (!res.ok || !data.response) {
				throw new Error(data.error || "Грешка при чат заявка.");
			}
			setChatMessages((prev) => [
				...prev,
				{ role: "assistant", content: data.response || "", chatLogId: data.chatLogId ?? null },
			]);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Грешка при чат заявка.";
			setChatError(msg);
		} finally {
			setChatBusy(false);
		}
	};

	const sendFeedback = async (chatLogId: string, feedback: 1 | -1) => {
		if (!chatLogId) return;
		setFeedbackByLogId((prev) => ({ ...prev, [chatLogId]: { vote: feedback, status: "saving" } }));
		try {
			const res = await fetch("/api/chat-feedback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ chatLogId, feedback }),
			});
			if (!res.ok) throw new Error("feedback failed");
			setFeedbackByLogId((prev) => ({ ...prev, [chatLogId]: { vote: feedback, status: "saved" } }));
		} catch {
			setFeedbackByLogId((prev) => {
				const current = prev[chatLogId];
				return {
					...prev,
					[chatLogId]: { vote: current?.vote ?? feedback, status: "error" },
				};
			});
		}
	};

	return (
		<div className="min-h-screen agri-page-bg text-slate-950 dark:text-slate-100">
			<header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/88">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
					<Link href="/" className="flex items-center gap-3" aria-label="AgriNexus.Law">
						<span className="grid h-10 w-10 place-items-center rounded-md bg-emerald-950 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950">
							<Leaf size={21} />
						</span>
						<span className="leading-tight">
							<span className="block text-sm font-black tracking-[0.18em] text-slate-950 dark:text-white">AGRINEXUS</span>
							<span className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700 dark:text-emerald-300">Law Intelligence</span>
						</span>
					</Link>
					<nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
						<Link href="/search" className="hover:text-slate-950 dark:hover:text-white">Документи</Link>
						<Link href="/srokove" className="hover:text-slate-950 dark:hover:text-white">Срокове</Link>
						<Link href="/kalkulator" className="hover:text-slate-950 dark:hover:text-white">Калкулатори</Link>
						<Link href="/statistiki" className="hover:text-slate-950 dark:hover:text-white">Статистики</Link>
					</nav>
					<button
						type="button"
						onClick={() => jumpToSearch()}
						className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 dark:bg-white dark:text-slate-950 dark:hover:bg-emerald-100"
					>
						<Search size={16} /> Търси
					</button>
				</div>
			</header>

			<main>
				<section className="relative overflow-hidden border-b border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(248,250,252,0.62))] dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.82),rgba(15,23,42,0.72))]">
					<div className="hero-field-visual absolute inset-y-0 right-0 hidden w-[48%] opacity-90 lg:block" aria-hidden="true" />
					<div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
						<div className="relative z-10 max-w-3xl">
							<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-800 shadow-sm dark:border-emerald-800 dark:bg-slate-900/80 dark:text-emerald-300">
								<LockKeyhole size={14} /> Проверими източници, не свободни догадки
							</div>
							<h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
								Правна и агро информация, подредена за решения на терен.
							</h1>
							<p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
								AgriNexus.Law комбинира търсене в документи, AI резюмета, срокове и практически инструменти за стопанства, консултанти и агро екипи.
							</p>

							<form onSubmit={onSearch} className="mt-8 max-w-3xl">
								<div
									ref={searchFormRef}
									className={`grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/8 transition-all dark:border-slate-800 dark:bg-slate-900 ${
										searchFocusPulse ? "ring-4 ring-emerald-500/20" : ""
									}`}
								>
									<div className="flex items-center gap-3">
										<Search className="shrink-0 text-emerald-700 dark:text-emerald-300" size={22} />
										<input
											ref={searchInputRef}
											value={query}
											onChange={(e) => setQuery(e.target.value)}
											placeholder="Попитай за срок, субсидия, наредба или документ..."
											className="min-w-0 flex-1 bg-transparent text-base font-medium text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
										/>
										<button
											type="submit"
											disabled={loading || !query.trim()}
											className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
										>
											{loading ? "Търся..." : "Търси"} <ArrowRight size={16} />
										</button>
									</div>
									<div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
										{EXAMPLE_QUERIES.map((item) => (
											<button
												key={item}
												type="button"
												onClick={() => jumpToSearch(item, true)}
												className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-700"
											>
												{item}
											</button>
										))}
									</div>
								</div>
							</form>

							<div className="mt-8 grid gap-3 sm:grid-cols-3">
								{TRUST_POINTS.map((item) => {
									const Icon = item.icon;
									return (
										<div key={item.label} className="border-l-2 border-emerald-600 bg-white/58 px-4 py-3 dark:bg-slate-900/42">
											<Icon className="mb-2 text-emerald-700 dark:text-emerald-300" size={18} />
											<p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{item.label}</p>
											<p className="mt-1 text-sm font-bold text-slate-950 dark:text-white">{item.value}</p>
										</div>
									);
								})}
							</div>
						</div>

						<div className="relative z-10 lg:pl-4">
							<div className="dashboard-preview border border-slate-200 bg-white shadow-2xl shadow-slate-950/12 dark:border-slate-800 dark:bg-slate-950">
								<div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
									<div>
										<p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Live Intelligence</p>
										<p className="mt-1 text-lg font-black text-slate-950 dark:text-white">Кампания и документи</p>
									</div>
									<span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">онлайн</span>
								</div>
								<div className="grid gap-4 p-5">
									<div className="grid grid-cols-3 gap-3">
										{[
											["43", "чат записа"],
											["25", "страници"],
											["0", "грешки build"],
										].map(([value, label]) => (
											<div key={label} className="border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
												<p className="text-2xl font-black text-slate-950 dark:text-white">{value}</p>
												<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</p>
											</div>
										))}
									</div>
									<div className="border border-slate-100 p-4 dark:border-slate-800">
										<div className="mb-4 flex items-center justify-between">
											<p className="text-sm font-bold text-slate-950 dark:text-white">Риск по срокове</p>
											<LineChart size={18} className="text-emerald-700 dark:text-emerald-300" />
										</div>
										<div className="space-y-3">
											{[
												["Директни плащания", "78%"],
												["Био контрол", "51%"],
												["Документи за износ", "34%"],
											].map(([label, width]) => (
												<div key={label}>
													<div className="mb-1 flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
														<span>{label}</span>
														<span>{width}</span>
													</div>
													<div className="h-2 bg-slate-100 dark:bg-slate-800">
														<div className="h-full bg-emerald-600" style={{ width }} />
													</div>
												</div>
											))}
										</div>
									</div>
									<div className="grid gap-3 sm:grid-cols-2">
										<div className="border border-slate-100 p-4 dark:border-slate-800">
											<p className="text-xs uppercase tracking-[0.16em] text-slate-500">Асистент</p>
											<p className="mt-2 text-sm font-bold">Елена · право и ДФЗ</p>
											<p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Отговаря със структура, източници и следваща стъпка.</p>
										</div>
										<div className="border border-slate-100 p-4 dark:border-slate-800">
											<p className="text-xs uppercase tracking-[0.16em] text-slate-500">Контрол</p>
											<p className="mt-2 text-sm font-bold">Feedback loop</p>
											<p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Полезно/неточно се записва за подобрение.</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section ref={resultsSectionRef} className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
					<div className="mb-5 flex flex-wrap items-end justify-between gap-4">
						<div>
							<p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">Документи и отговори</p>
							<h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">AI търсене с ясни резултати</h2>
						</div>
						<select
							value={filterType}
							onChange={(e) => setFilterType(e.target.value as "all" | KnowledgeDoc["type"])}
							className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-900"
						>
							<option value="all">Всички типове</option>
							<option value="scheme">Схеми</option>
							<option value="regulation">Нормативни актове</option>
							<option value="procedure">Процедури</option>
							<option value="deadline">Срокове</option>
						</select>
					</div>

					<div className="border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
						{engine ? <p className="mb-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Search engine: {engine}</p> : null}
						{aiSummary ? (
							<div className="mb-5 border-l-4 border-emerald-600 bg-emerald-50 p-4 text-sm dark:bg-emerald-950/30">
								<p className="font-bold text-emerald-950 dark:text-emerald-100">AI обобщение</p>
								<p className="mt-1 leading-6 text-emerald-900 dark:text-emerald-200">{aiSummary}</p>
							</div>
						) : null}
						{error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
						{!error && filteredResults.length === 0 ? (
							<div className="grid gap-4 py-8 text-center">
								<Sparkles className="mx-auto text-emerald-700 dark:text-emerald-300" size={30} />
								<p className="text-sm text-slate-500 dark:text-slate-400">Използвай търсачката по-горе, за да видиш документи, резюме и следващи действия.</p>
							</div>
						) : (
							<div className="grid gap-4 md:grid-cols-2">
								{filteredResults.map((doc) => (
									<article key={doc.id} className="border border-slate-200 p-4 transition hover:border-emerald-300 dark:border-slate-800">
										<p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{doc.category} · {doc.type}</p>
										<h3 className="text-base font-black text-slate-950 dark:text-white">{doc.title}</h3>
										<p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{doc.content}</p>
										<p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Източник: {doc.source} · {doc.effectiveDate}</p>
										<div className="mt-4 flex flex-wrap items-center gap-2">
											<button
												type="button"
												onClick={() => jumpToSearch(`Обясни накратко: ${doc.title}`, true)}
												className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-bold hover:border-emerald-500 dark:border-slate-700"
											>
												Попитай AI
											</button>
											<Link href={`/doc/${doc.id}`} className="rounded-md bg-slate-950 px-3 py-1.5 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
												Отвори
											</Link>
											<a href={getKnowledgeSourceUrl(doc)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
												Оригинал <ExternalLink size={12} />
											</a>
										</div>
									</article>
								))}
							</div>
						)}
					</div>
				</section>

				<section className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">Категории</p>
						<h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Бърз достъп до най-честите казуси</h2>
						<p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
							Вместо хаотично търсене по сайтове и PDF-и, започни от конкретна тема и получи проверими документи.
						</p>
					</div>
					<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
						{CATEGORY_CARDS.map((card) => {
							const Icon = card.icon;
							return (
								<button
									key={card.title}
									type="button"
									onClick={() => jumpToSearch(card.title, true)}
									className="group border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-950"
								>
									<Icon size={20} className="mb-3 text-emerald-700 dark:text-emerald-300" />
									<p className="text-sm font-black text-slate-950 dark:text-white">{card.title}</p>
									<p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{card.subtitle}</p>
								</button>
							);
						})}
					</div>
				</section>

				<section className="border-y border-slate-200 bg-white/78 dark:border-slate-800 dark:bg-slate-950/70">
					<div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-3">
						<div className="lg:col-span-1">
							<div className="flex items-center gap-2">
								<Bell size={18} className="text-emerald-700 dark:text-emerald-300" />
								<p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">Оперативен фокус</p>
							</div>
							<h2 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">Последни промени и срокове</h2>
							<Link href="/srokove" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
								Виж всички <ArrowRight size={15} />
							</Link>
						</div>
						<div className="grid gap-3 lg:col-span-2">
							{UPDATES.map((item) => (
								<div key={item.title} className="grid gap-2 border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[86px_1fr] dark:border-slate-800 dark:bg-slate-900">
									<span className="w-fit rounded-sm bg-emerald-700 px-2 py-1 text-[10px] font-black text-white">{item.badge}</span>
									<div>
										<p className="text-sm font-black text-slate-950 dark:text-white">{item.title}</p>
										<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.meta}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				<section id="chat" className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
					<div>
						<p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">AI асистент</p>
						<h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Задай въпрос към специалист</h2>
						<p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
							Избери профил според задачата. Отговорите могат да се оценяват, за да се подобрява вътрешната база.
						</p>
					</div>

					<div className="border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
						<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
							<h3 className="text-sm font-black text-slate-950 dark:text-white">Консултация</h3>
							<select
								value={chatCharacter}
								onChange={(e) => setChatCharacter(e.target.value as "elena" | "boris" | "viktoria")}
								className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"
							>
								<option value="elena">Елена · право/ДФЗ</option>
								<option value="boris">Борис · поле</option>
								<option value="viktoria">Виктория · финанси</option>
							</select>
						</div>

						<div className="mb-4 max-h-80 overflow-auto border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
							{chatMessages.length === 0 ? (
								<p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
									Задай казус: култура, регион, документ или срок. Под всеки AI отговор можеш да дадеш обратна връзка.
								</p>
							) : (
								<div className="space-y-3">
									{chatMessages.map((msg, idx) => (
										<div key={`${msg.role}-${idx}`} className={`p-3 text-sm ${msg.role === "user" ? "bg-white dark:bg-slate-950" : "bg-emerald-50 dark:bg-emerald-950/30"}`}>
											<p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{msg.role === "user" ? "Ти" : "Асистент"}</p>
											<p className="whitespace-pre-wrap leading-6">{msg.content}</p>
											{msg.role === "assistant" && msg.chatLogId ? (
												<div className="mt-3 flex flex-wrap items-center gap-2">
													{(() => {
														const state = feedbackByLogId[msg.chatLogId];
														if (!state) return null;
														if (state.status === "saving") return <span className="text-[11px] text-slate-500">Запазва се...</span>;
														if (state.status === "saved") return <span className="text-[11px] text-emerald-700 dark:text-emerald-300">Feedback е записан</span>;
														return <span className="text-[11px] text-red-600 dark:text-red-300">Неуспешен запис</span>;
													})()}
													<button
														type="button"
														onClick={() => void sendFeedback(msg.chatLogId as string, 1)}
														disabled={feedbackByLogId[msg.chatLogId]?.status === "saving"}
														className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-bold disabled:opacity-60 ${
															feedbackByLogId[msg.chatLogId]?.vote === 1 ? "border-emerald-500 text-emerald-700 dark:text-emerald-300" : "border-slate-300 dark:border-slate-600"
														}`}
													>
														<ThumbsUp size={12} /> Полезно
													</button>
													<button
														type="button"
														onClick={() => void sendFeedback(msg.chatLogId as string, -1)}
														disabled={feedbackByLogId[msg.chatLogId]?.status === "saving"}
														className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-bold disabled:opacity-60 ${
															feedbackByLogId[msg.chatLogId]?.vote === -1 ? "border-rose-500 text-rose-700 dark:text-rose-300" : "border-slate-300 dark:border-slate-600"
														}`}
													>
														<ThumbsDown size={12} /> Неточно
													</button>
												</div>
											) : null}
										</div>
									))}
								</div>
							)}
						</div>

						{chatError ? <p className="mb-3 text-xs font-medium text-red-600">{chatError}</p> : null}
						<form onSubmit={sendChat} className="grid gap-2 sm:grid-cols-[1fr_auto]">
							<input
								value={chatInput}
								onChange={(e) => setChatInput(e.target.value)}
								placeholder="Например: Имам 120 дка пшеница в Добрич. Какво да проверя?"
								className="min-w-0 rounded-md border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900"
							/>
							<button
								type="submit"
								disabled={chatBusy || !chatInput.trim()}
								className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
							>
								{chatBusy ? "Изпращам..." : "Изпрати"} <ArrowRight size={16} />
							</button>
						</form>
					</div>
				</section>
			</main>
		</div>
	);
}
