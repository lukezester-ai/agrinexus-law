"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
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
	User,
} from "lucide-react";
import { AiCharacterAvatar } from "@/components/ai-character-avatar";
import type { CharacterId } from "@/lib/characters";
import type { KnowledgeDoc } from "@/lib/knowledge/knowledge-types";
import { HOME_CATEGORY_SEARCH } from "@/lib/knowledge/document-taxonomy";
import { getKnowledgeSourceUrl } from "@/lib/knowledge/source-links";
import { isPublicDocumentId } from "@/lib/knowledge/public-documents-search";
import { ChatMarkdown } from "@/components/chat-markdown";
import { SiteHeader } from "@/components/site-header";
import {
	chatBubble,
	chatListContainer,
	heroContainer,
	heroItem,
	panelReveal,
} from "@/lib/motion-variants";

type SearchResponse = {
	results?: KnowledgeDoc[];
	engine?: "meili+internal" | "typesense+internal" | "internal-ai";
	aiSummary?: string;
	error?: string;
};

type ChatMessage = {
	role: "user" | "assistant";
	content: string;
	chatLogId?: string | null;
	/** Кой специалист е отговорил (за аватар в балона). */
	characterId?: CharacterId;
};

type FeedbackState = {
	vote: 1 | -1;
	status: "saving" | "saved" | "error";
};

type LiveStatTile = { value: string; label: string };
type DeadlineRiskRow = { label: string; percent: number };

type LiveStatsResponse = {
	ok?: boolean;
	tiles?: LiveStatTile[];
	deadlineRisks?: DeadlineRiskRow[];
	rag?: { healthy?: boolean; hints?: string[] };
};

const CATEGORY_ICONS = [Sprout, Scale, ShieldCheck, Leaf, BookOpenCheck, FileText, FileDown, Calculator] as const;

const CATEGORY_CARDS = HOME_CATEGORY_SEARCH.map((card, i) => ({
	...card,
	icon: CATEGORY_ICONS[i] ?? FileText,
}));

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
	const [liveTiles, setLiveTiles] = useState<LiveStatTile[]>([
		{ value: "…", label: "чат записа" },
		{ value: "…", label: "страници" },
		{ value: "…", label: "RAG" },
	]);
	const [deadlineRisks, setDeadlineRisks] = useState<DeadlineRiskRow[]>([]);
	const [liveStatsLoading, setLiveStatsLoading] = useState(true);
	const [ragHealthy, setRagHealthy] = useState<boolean | null>(null);
	const [ragStatusHints, setRagStatusHints] = useState<string[]>([]);
	const reducedMotion = useReducedMotion();

	useEffect(() => {
		if (typeof window === "undefined") return;
		const chatQ = new URLSearchParams(window.location.search).get("chatQ");
		if (!chatQ) return;
		setChatInput((prev) => (prev.trim() ? prev : chatQ));
	}, []);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch("/api/stats/live", { cache: "no-store" });
				const data = (await res.json().catch(() => ({}))) as LiveStatsResponse;
				if (cancelled || !data.ok) return;
				if (data.tiles?.length) setLiveTiles(data.tiles);
				if (data.deadlineRisks?.length) setDeadlineRisks(data.deadlineRisks);
				setRagHealthy(Boolean(data.rag?.healthy));
				setRagStatusHints(
					Array.isArray(data.rag?.hints)
						? data.rag.hints.filter((h): h is string => typeof h === "string" && h.trim().length > 0)
						: [],
				);
			} catch {
				/* keep placeholders */
			} finally {
				if (!cancelled) setLiveStatsLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
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
		const assistantCharacter = chatCharacter;
		const nextMessages: ChatMessage[] = [...chatMessages, { role: "user", content: text }];
		setChatMessages(nextMessages);
		setChatInput("");
		setChatBusy(true);
		setChatError(null);
		try {
			// Вземаме профила от localStorage, ако има такъв
			let userProfile = undefined;
			try {
				const stored = localStorage.getItem("agrinexus_farm_profile");
				if (stored) userProfile = JSON.parse(stored);
			} catch (e) {
				console.error("Failed to parse farm profile", e);
			}

			const res = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					characterId: chatCharacter,
					userProfile,
					messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
				}),
			});
			
			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || "Грешка при чат заявка.");
			}

			const contentType = res.headers.get("content-type") || "";
			
			if (contentType.includes("application/json")) {
				const data = (await res.json()) as {
					response?: string;
					chatLogId?: string | null;
				};
				setChatMessages((prev) => [
					...prev,
					{
						role: "assistant",
						content: data.response || "",
						chatLogId: data.chatLogId ?? null,
						characterId: assistantCharacter,
					},
				]);
			} else {
				// Streaming text response
				const chatLogId = res.headers.get("X-Chat-Log-Id") || null;
				const reader = res.body?.getReader();
				const decoder = new TextDecoder("utf-8");
				let done = false;
				let text = "";

				// Добавяме празно съобщение, което ще обновяваме
				setChatMessages((prev) => [
					...prev,
					{ role: "assistant", content: "", chatLogId, characterId: assistantCharacter },
				]);

				if (reader) {
					try {
						while (!done) {
							const { value, done: readerDone } = await reader.read();
							done = readerDone;
							if (value) {
								text += decoder.decode(value, { stream: true });
								setChatMessages((prev) => {
									const newMessages = [...prev];
									const lastIndex = newMessages.length - 1;
									newMessages[lastIndex] = { ...newMessages[lastIndex], content: text };
									return newMessages;
								});
							}
						}
						text += decoder.decode();
						if (text) {
							setChatMessages((prev) => {
								const newMessages = [...prev];
								const lastIndex = newMessages.length - 1;
								newMessages[lastIndex] = { ...newMessages[lastIndex], content: text };
								return newMessages;
							});
						}
					} catch (streamErr) {
						const m =
							streamErr instanceof Error ? streamErr.message : "Прекъснат стрийм на отговора.";
						setChatMessages((prev) => prev.slice(0, -1));
						throw new Error(m);
					}
				} else {
					setChatMessages((prev) => prev.slice(0, -1));
					setChatError("Няма тяло на отговора от сървъра (стрийм). Опресни и опитай пак.");
				}
			}
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
		<div className="agri-mobile-safe agri-floating-header-pad min-h-screen agri-page-bg text-slate-950 dark:text-slate-100">
			<SiteHeader />

			<main>
				<section className="ai-hero-section ai-hero-orbs relative overflow-hidden">
					<motion.div
						className="ai-mesh-bg"
						aria-hidden="true"
						animate={
							reducedMotion
								? false
								: { opacity: [0.72, 0.94, 0.72], scale: [1, 1.02, 1] }
						}
						transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
					/>
					<div className="hero-field-visual absolute inset-y-0 right-0 hidden w-[48%] opacity-90 lg:block" aria-hidden="true" />
					<div className="relative z-10 mx-auto grid min-w-0 max-w-7xl gap-10 px-3 py-12 sm:px-6 sm:py-14 md:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
						<motion.div
							className="relative z-10 min-w-0 max-w-3xl"
							variants={heroContainer(reducedMotion)}
							initial="hidden"
							animate="visible"
						>
							<motion.div
								variants={heroItem(reducedMotion)}
								className="mb-6 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-emerald-200/50 bg-white/35 px-4 py-2 text-xs font-bold uppercase leading-snug tracking-[0.12em] text-emerald-800 shadow-sm backdrop-blur-md dark:border-cyan-500/25 dark:bg-slate-950/35 dark:text-cyan-200"
							>
								<LockKeyhole size={16} className="shrink-0" />
								<span className="sm:hidden">Проверими източници</span>
								<span className="hidden sm:inline">Проверими източници, не свободни догадки</span>
							</motion.div>
							<motion.h1
								variants={heroItem(reducedMotion)}
								className="ai-hero-heading w-full max-w-4xl font-display text-[2rem] font-black leading-[1.12] tracking-tight sm:text-5xl sm:leading-[1.1] md:text-6xl md:leading-[1.08] lg:text-7xl"
							>
								<span className="ai-hero-title-line block text-slate-950 dark:text-[#F7FAFC]">
									Правна и аграрна
								</span>
								<span className="mt-2 block sm:mt-3">
									<span className="text-gradient-ai">документация</span>
								</span>
							</motion.h1>
							<motion.p
								variants={heroItem(reducedMotion)}
								className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300 sm:text-xl"
							>
								AgriNexus.Law комбинира търсене в документи, AI резюмета, срокове и практически инструменти за стопанства, консултанти и агро екипи.
							</motion.p>

							<motion.div variants={heroItem(reducedMotion)} className="mt-8 max-w-3xl">
							<form onSubmit={onSearch} className="max-w-3xl">
								<div
									ref={searchFormRef}
									className={`grid gap-4 rounded-3xl glass-panel p-4 transition-all ${
										searchFocusPulse ? "ring-4 ring-cyan-400/35" : ""
									}`}
								>
									<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
										<div className="flex min-w-0 flex-1 items-center gap-3 px-2">
											<Search className="shrink-0 text-emerald-600 dark:text-cyan-400" size={24} />
											<input
												ref={searchInputRef}
												value={query}
												onChange={(e) => setQuery(e.target.value)}
												placeholder="Попитай за срок, субсидия, наредба или документ..."
												className="min-w-0 w-full flex-1 bg-transparent text-base font-medium text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
											/>
										</div>
										<button
											type="submit"
											disabled={loading || !query.trim()}
											className="brand-cta-bg inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-slate-900 shadow-md transition disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:transform-none sm:w-auto"
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
												className="rounded-full border border-white/50 bg-white/30 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/60 hover:text-emerald-800 hover:shadow-md dark:border-slate-600/50 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-cyan-400/40 dark:hover:text-cyan-200"
											>
												{item}
											</button>
										))}
									</div>
								</div>
							</form>
							</motion.div>

							<motion.div variants={heroItem(reducedMotion)} className="mt-8 grid gap-3 sm:grid-cols-3">
								{TRUST_POINTS.map((item) => {
									const Icon = item.icon;
									return (
										<div
											key={item.label}
											className="group rounded-2xl border border-white/40 bg-white/30 px-4 py-3 shadow-sm backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200/60 hover:shadow-lg dark:border-white/10 dark:bg-slate-950/35 dark:hover:border-cyan-500/25 dark:hover:shadow-cyan-500/10"
										>
											<Icon className="mb-2 text-emerald-600 transition-transform duration-300 group-hover:scale-110 dark:text-cyan-400" size={18} />
											<p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{item.label}</p>
											<p className="mt-1 text-sm font-bold text-slate-950 dark:text-white">{item.value}</p>
										</div>
									);
								})}
							</motion.div>
						</motion.div>

						<motion.div
							className="relative z-10 min-w-0 lg:pl-6"
							variants={panelReveal(reducedMotion, "right")}
							initial="hidden"
							animate="visible"
						>
							<div className="dashboard-preview glass-card min-w-0 shadow-2xl shadow-teal-900/10 dark:shadow-teal-950/40">
								<div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200/50 px-6 py-5 dark:border-slate-800/50">
									<div className="min-w-0">
										<p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">Live Intelligence</p>
										<p className="mt-1 font-display text-xl font-black text-slate-950 dark:text-white">Кампания и документи</p>
									</div>
									<span
										className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold ${
											ragHealthy === false
												? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
												: "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300"
										}`}
										title={
											ragHealthy === false
												? [
														"Статус на векторния индекс (RAG): таблица knowledge_chunks в Supabase, брой chunks и embeddings.",
														"Чатът работи и без това (вътрешна база + OpenAI), но семантичното търсене в индексирани документи може да е ограничено.",
														ragStatusHints[0] ?? "",
														"JSON диагностика: GET /api/health",
													]
														.filter(Boolean)
														.join(" ")
												: "Услугата е онлайн; RAG индексът е в норма."
										}
									>
										{liveStatsLoading ? "…" : ragHealthy === false ? "RAG не е готов" : "онлайн"}
									</span>
								</div>
								<div className="grid gap-4 p-4 sm:p-5">
									<div className="grid grid-cols-3 gap-2 sm:gap-3">
										{liveTiles.map((tile) => (
											<div
												key={tile.label}
												className="border border-slate-100 bg-slate-50 p-4 transition duration-300 hover:border-teal-300/60 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-500/35 dark:hover:shadow-teal-500/10"
											>
												<p className="text-2xl font-black text-slate-950 dark:text-white">
													{liveStatsLoading ? "…" : tile.value}
												</p>
												<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{tile.label}</p>
											</div>
										))}
									</div>
									<div className="rounded-2xl bg-white/50 p-5 dark:bg-slate-900/50">
										<div className="mb-4 flex items-center justify-between">
											<p className="font-display text-base font-bold text-slate-950 dark:text-white">Спешност по срокове</p>
											<LineChart size={20} className="text-teal-600 dark:text-teal-400" />
										</div>
										<div className="space-y-3">
											{(deadlineRisks.length
												? deadlineRisks
												: [{ label: "Зареждане…", percent: 0 }]
											).map((row) => (
												<div key={row.label}>
													<div className="mb-1 flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
														<span>{row.label}</span>
														<span>{row.percent}%</span>
													</div>
													<div className="h-2 bg-slate-100 dark:bg-slate-800">
														<div
															className="h-full bg-emerald-600 transition-[width] duration-500"
															style={{ width: `${row.percent}%` }}
														/>
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
						</motion.div>
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

					<div className="glass-card p-6 sm:p-8">
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
									<article key={doc.id} className="rounded-2xl glass-panel p-6 hover-elevate transition-all">
										<p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{doc.category} · {doc.type}</p>
										<h3 className="font-display text-lg font-black text-slate-950 dark:text-white">{doc.title}</h3>
										<p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{doc.content}</p>
										<p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Източник: {doc.source} · {doc.effectiveDate}</p>
										<div className="mt-4 flex flex-wrap items-center gap-2">
											<button
												type="button"
												onClick={() => jumpToSearch(`Обясни накратко: ${doc.title}`, true)}
												className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-bold hover:border-emerald-500 dark:border-slate-700"
											>
												Попитай AI
											</button>
											{!isPublicDocumentId(doc.id) ? (
												<Link href={`/doc/${doc.id}`} className="rounded-md bg-slate-950 px-3 py-1.5 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
													Отвори
												</Link>
											) : null}
											<a href={getKnowledgeSourceUrl(doc)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
												{isPublicDocumentId(doc.id) ? "PDF / оригинал" : "Оригинал"} <ExternalLink size={12} />
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
									onClick={() => jumpToSearch(card.searchQuery, true)}
									className="group rounded-2xl glass-panel p-6 text-left hover-elevate transition-all"
								>
									<Icon size={24} className="mb-4 text-teal-600 dark:text-teal-400" />
									<p className="font-display text-base font-black text-slate-950 dark:text-white">{card.title}</p>
									<p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{card.subtitle}</p>
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

				<section id="chat" className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
					<div className="lg:pt-1">
						<p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">AI асистент</p>
						<h2 className="mt-2 font-display text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
							Задай въпрос към специалист
						</h2>
						<p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
							Избери профил според задачата. Отговорите могат да се оценяват, за да се подобрява вътрешната база.
						</p>
					</div>

					<div className="glass-card overflow-hidden p-5 sm:p-6">
						<div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800/80">
							<h3 className="font-display text-sm font-black tracking-tight text-slate-950 dark:text-white">Консултация</h3>
							<div className="flex flex-wrap items-center gap-2" role="group" aria-label="Избор на AI специалист">
								{(["elena", "boris", "viktoria"] as const).map((id) => (
									<button
										key={id}
										type="button"
										onClick={() => setChatCharacter(id)}
										aria-pressed={chatCharacter === id}
										className={`flex items-center gap-2 rounded-2xl border px-2 py-1.5 text-left text-xs font-bold transition-all duration-300 sm:px-3 ${
											chatCharacter === id
												? "border-teal-500/70 bg-teal-50/90 shadow-md shadow-teal-500/15 dark:border-teal-400/50 dark:bg-teal-950/40 dark:shadow-teal-500/20"
												: "border-slate-200/90 bg-white/80 hover:border-teal-300/50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-900/60 dark:hover:border-teal-600/40"
										}`}
									>
										<AiCharacterAvatar id={id} size="sm" selected={chatCharacter === id} />
										<span className="hidden min-w-0 sm:block">
											<span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
												{id === "elena" ? "Право" : id === "boris" ? "Поле" : "Финанси"}
											</span>
											<span className="block truncate text-slate-900 dark:text-slate-100">
												{id === "elena" ? "Елена" : id === "boris" ? "Борис" : "Виктория"}
											</span>
										</span>
									</button>
								))}
							</div>
						</div>

						<div className="mb-4 max-h-80 overflow-auto rounded-xl border border-slate-200/90 bg-slate-50/90 p-3 shadow-inner dark:border-slate-700/90 dark:bg-slate-900/50">
							{chatMessages.length === 0 ? (
								<div className="space-y-4">
									<p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
										Задай казус: култура, регион, документ или срок. Под всеки AI отговор можеш да дадеш обратна връзка.
									</p>
									<div className="flex items-center gap-3 border-t border-slate-200/80 pt-4 dark:border-slate-700/80">
										<span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Екип</span>
										<div className="flex -space-x-2">
											{(["elena", "boris", "viktoria"] as const).map((id) => (
												<AiCharacterAvatar key={id} id={id} size="sm" className="ring-2 ring-slate-100 dark:ring-slate-900" />
											))}
										</div>
									</div>
								</div>
							) : (
								<motion.div
									className="space-y-3"
									variants={chatListContainer(reducedMotion)}
									initial="hidden"
									animate="visible"
								>
									{chatMessages.map((msg, idx) => (
										<motion.div
											key={`${msg.role}-${idx}-${msg.chatLogId ?? ""}`}
											variants={chatBubble(reducedMotion)}
											className={`flex gap-3 rounded-xl border p-3.5 text-sm shadow-sm transition-all duration-300 hover:shadow-md ${
												msg.role === "user"
													? "border-slate-200/90 bg-white dark:border-slate-700 dark:bg-slate-950"
													: "border-emerald-200/50 bg-emerald-50/90 dark:border-emerald-900/40 dark:bg-emerald-950/25"
											}`}
										>
											<div className="shrink-0 pt-0.5">
												{msg.role === "user" ? (
													<span className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
														<User size={16} aria-hidden />
													</span>
												) : (
													<AiCharacterAvatar id={msg.characterId ?? "elena"} size="sm" />
												)}
											</div>
											<div className="min-w-0 flex-1">
											<p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
												{msg.role === "user" ? "Ти" : "Асистент"}
											</p>
											<ChatMarkdown content={msg.content} variant={msg.role} />
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
										</motion.div>
									))}
								</motion.div>
							)}
						</div>

						{chatError ? <p className="mb-3 text-xs font-medium text-red-600 dark:text-red-400">{chatError}</p> : null}
						<form onSubmit={sendChat} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:gap-3">
							<input
								value={chatInput}
								onChange={(e) => setChatInput(e.target.value)}
								placeholder="Например: Имам 120 дка пшеница в Добрич. Какво да проверя?"
								className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none ring-emerald-500/0 transition placeholder:text-slate-400 focus:border-emerald-500/70 focus:ring-4 focus:ring-emerald-500/15 dark:border-slate-600 dark:bg-slate-900 dark:focus:border-emerald-500/50"
							/>
							<button
								type="submit"
								disabled={chatBusy || !chatInput.trim()}
								className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-900 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-emerald-100"
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
