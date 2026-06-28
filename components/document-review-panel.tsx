"use client";

import React, { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
	AlertTriangle,
	CloudUpload,
	FileText,
	Loader2,
	Send,
} from "lucide-react";
import { MainNavBar } from "@/components/generated/MainNavBar";
import { AuroraBackground } from "@/components/generated/AuroraBackground";
import { SiteFooter } from "@/components/generated/SiteFooter";
import { cn } from "@/lib/utils";
import { loadFarmProfile } from "@/lib/farm-profile";

type ReviewMode = "subsidy" | "contract" | "lease" | "notice";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const reviewModeLabels: Record<ReviewMode, string> = {
	subsidy: "Субсидии / ДФЗ",
	contract: "Договор",
	lease: "Аренда / наем",
	notice: "Уведомление / писмо",
};

const MODES: { id: ReviewMode; label: string }[] = [
	{ id: "subsidy", label: "Субсидии / ДФЗ" },
	{ id: "contract", label: "Договор" },
	{ id: "lease", label: "Аренда" },
	{ id: "notice", label: "Писмо" },
];

type AnalysisResult = {
	analysis: string;
	fileName: string;
	mode: ReviewMode;
	modeLabel: string;
	riskLevel: string;
	truncated: boolean;
	extractedCharacters: number;
};

type ChatMessage = { role: "user" | "assistant"; content: string };

function riskBadgeClass(level: string) {
	if (level === "high") return "bg-red-500/20 text-red-400 border-red-500/30";
	if (level === "medium") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
	if (level === "low") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
	return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
}

function riskLabel(level: string) {
	if (level === "high") return "Висок риск";
	if (level === "medium") return "Среден риск";
	if (level === "low") return "Нисък риск";
	return "Неопределен";
}

function extractRiskBullets(analysis: string): string[] {
	const section = analysis.match(/3\.[\s\S]*?(?=4\.|$)/i)?.[0] ?? analysis;
	const lines = section
		.split(/\n/)
		.map((l) => l.replace(/^[-*•]\s*/, "").trim())
		.filter((l) => l.length > 12 && !/^рисков/i.test(l));
	return lines.slice(0, 5);
}

function extractDateHints(analysis: string): { date: string; label: string }[] {
	const section = analysis.match(/2\.[\s\S]*?(?=3\.|$)/i)?.[0] ?? "";
	const lines = (section || analysis).split(/\n/).filter(Boolean);
	const out: { date: string; label: string }[] = [];
	for (const line of lines) {
		const m = line.match(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})/);
		if (m) {
			out.push({ date: m[1], label: line.replace(/^[-*•]\s*/, "").slice(0, 120) });
		}
		if (out.length >= 5) break;
	}
	return out;
}

function renderInlineBold(text: string) {
	const parts = text.split(/(\*\*[^*]+\*\*)/g);
	return parts.map((part, i) =>
		part.startsWith("**") && part.endsWith("**") ? (
			<strong key={i} className="text-blue-300">
				{part.slice(2, -2)}
			</strong>
		) : (
			<span key={i}>{part}</span>
		),
	);
}

export function DocumentReviewPanel() {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const chatEndRef = useRef<HTMLDivElement>(null);

	const [file, setFile] = useState<File | null>(null);
	const [mode, setMode] = useState<ReviewMode>("lease");
	const [context, setContext] = useState("");
	const [analyzing, setAnalyzing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<AnalysisResult | null>(null);

	const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
	const [chatInput, setChatInput] = useState("");
	const [chatLoading, setChatLoading] = useState(false);

	const onPickFile = (f: File | null) => {
		if (!f) return;
		if (f.size > MAX_FILE_BYTES) {
			setError(`Файлът е над ${MAX_FILE_BYTES / (1024 * 1024)} MB.`);
			return;
		}
		const name = f.name.toLowerCase();
		const ok =
			name.endsWith(".pdf") ||
			name.endsWith(".docx") ||
			name.endsWith(".txt") ||
			f.type.includes("pdf") ||
			f.type.includes("text");
		if (!ok) {
			setError("Поддържани формати: PDF, DOCX, TXT.");
			return;
		}
		setError(null);
		setFile(f);
		setResult(null);
		setChatMessages([]);
	};

	const runAnalysis = async () => {
		if (!file || analyzing) return;
		setAnalyzing(true);
		setError(null);
		try {
			const fd = new FormData();
			fd.append("file", file);
			fd.append("mode", mode);
			fd.append("context", context);

			const res = await fetch("/api/document-review/analyze", {
				method: "POST",
				body: fd,
			});
			const data = (await res.json()) as AnalysisResult & {
				error?: string;
				ok?: boolean;
				upgradeUrl?: string;
				requiresAuth?: boolean;
			};
			if (!res.ok) {
				const hint =
					data.upgradeUrl && (res.status === 402 || res.status === 401)
						? ` Вижте плановете: ${data.upgradeUrl}`
						: "";
				throw new Error((data.error ?? `HTTP ${res.status}`) + hint);
			}

			setResult({
				analysis: data.analysis,
				fileName: data.fileName,
				mode: data.mode,
				modeLabel: data.modeLabel,
				riskLevel: data.riskLevel,
				truncated: data.truncated,
				extractedCharacters: data.extractedCharacters,
			});
			setChatMessages([
				{
					role: "assistant",
					content: `Анализът на „${data.fileName}" е готов (${reviewModeLabels[data.mode]}). Задай уточняващ въпрос — отговарям като Елена, на база текста на документа.`,
				},
			]);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Неуспешен анализ.");
		} finally {
			setAnalyzing(false);
		}
	};

	const sendFollowUp = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			const q = chatInput.trim();
			if (!q || !result || chatLoading) return;

			const userMsg: ChatMessage = { role: "user", content: q };
			const history = [...chatMessages, userMsg];
			setChatMessages(history);
			setChatInput("");
			setChatLoading(true);

			setChatMessages((prev) => [...prev, { role: "assistant", content: "…" }]);

			const updateAssistant = (text: string) => {
				setChatMessages((prev) => {
					const idx = prev.length - 1;
					if (idx < 0 || prev[idx]?.role !== "assistant") {
						return [...prev, { role: "assistant", content: text }];
					}
					return prev.map((m, i) => (i === idx ? { ...m, content: text } : m));
				});
				chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
			};

			try {
				const res = await fetch("/api/chat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						characterId: "elena",
						messages: [
							{
								role: "user",
								content: `[Контекст от AI преглед на документ „${result.fileName}"]\n\n${result.analysis.slice(0, 6000)}\n\n---\nВъпрос на фермера: ${q}`,
							},
						],
						userProfile: loadFarmProfile(),
					}),
				});

				if (!res.ok) {
					const err = (await res.json().catch(() => null)) as { error?: string } | null;
					throw new Error(err?.error ?? `HTTP ${res.status}`);
				}

				const contentType = res.headers.get("content-type") ?? "";

				let reply = "";
				if (contentType.includes("application/json")) {
					const data = (await res.json()) as { response?: string };
					reply = data.response ?? "";
					updateAssistant(reply || "Няма отговор.");
				} else {
					const reader = res.body?.getReader();
					if (!reader) throw new Error("Липсва отговор.");
					const decoder = new TextDecoder();
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						reply += decoder.decode(value, { stream: true });
						updateAssistant(reply || "…");
					}
					updateAssistant(reply || "Няма отговор.");
				}
			} catch (err) {
				updateAssistant(
					`⚠️ ${err instanceof Error ? err.message : "Грешка при заявката."}`,
				);
			} finally {
				setChatLoading(false);
			}
		},
		[chatInput, chatLoading, chatMessages, result],
	);

	const risks = result ? extractRiskBullets(result.analysis) : [];
	const dates = result ? extractDateHints(result.analysis) : [];

	return (
		<div className="flex min-h-screen flex-col bg-[#0A0A0A] font-sans text-white selection:bg-blue-600/30">
			<MainNavBar activeScreen="AI Review" />

			<AuroraBackground className="flex-grow pt-32 pb-20">
				<main className="mx-auto max-w-7xl px-6">
					<div className="mb-12">
						<h1 className="mb-4 animate-in font-serif text-6xl italic fade-in slide-in-from-bottom-4 duration-700 md:text-7xl">
							AI Преглед на документи
						</h1>
						<p className="max-w-2xl animate-in text-xl font-medium text-zinc-500 fade-in slide-in-from-bottom-6 duration-1000 md:text-2xl">
							Качи договор, ДФЗ документ или писмо — реален анализ с Елена (право / ДФЗ).
						</p>
					</div>

					{!result ? (
						<div className="mx-auto max-w-2xl space-y-6">
							<input
								ref={fileInputRef}
								type="file"
								accept=".pdf,.docx,.txt,application/pdf,text/plain"
								className="hidden"
								onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
							/>

							<div
								role="button"
								tabIndex={0}
								onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
								onClick={() => fileInputRef.current?.click()}
								className="group flex h-[260px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-800 bg-[#181818] transition-all duration-300 hover:border-blue-500/50 hover:bg-[#1c1c1c]"
							>
								<div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition-transform group-hover:scale-110">
									<CloudUpload size={48} className="stroke-[1.5px] text-blue-500" />
								</div>
								<h3 className="mb-2 text-xl font-semibold">
									{file ? file.name : "Пусни PDF, DOCX или TXT"}
								</h3>
								<p className="text-zinc-500">
									{file
										? `${(file.size / 1024 / 1024).toFixed(2)} MB — кликни за смяна`
										: "или избери файл"}
								</p>
								<p className="mt-4 text-xs font-medium uppercase tracking-wider text-zinc-600">
									Макс. {MAX_FILE_BYTES / (1024 * 1024)} MB
								</p>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								{MODES.map((m) => (
									<button
										key={m.id}
										type="button"
										onClick={() => setMode(m.id)}
										className={cn(
											"rounded-xl border px-4 py-3 text-left text-sm transition",
											mode === m.id
												? "border-blue-500 bg-blue-600/20 text-white"
												: "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600",
										)}
									>
										{m.label}
									</button>
								))}
							</div>

							<textarea
								value={context}
								onChange={(e) => setContext(e.target.value)}
								placeholder="Допълнителен контекст (по желание): регион, култура, тип стопанство…"
								rows={3}
								className="w-full rounded-xl border border-zinc-800 bg-[#181818] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:outline-none"
							/>

							{error && (
								<div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
									{error}
								</div>
							)}

							<button
								type="button"
								disabled={!file || analyzing}
								onClick={() => void runAnalysis()}
								className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
							>
								{analyzing ? (
									<>
										<Loader2 size={20} className="animate-spin" /> Анализиране…
									</>
								) : (
									<>Стартирай AI преглед</>
								)}
							</button>

							<p className="text-center text-xs text-zinc-500">
								Не е правен съвет. При спор — адвокат.{" "}
								<Link href="/documents" className="text-blue-400 hover:underline">
									Държавен архив
								</Link>
							</p>
						</div>
					) : (
						<div className="flex min-h-[700px] animate-in flex-col gap-6 fade-in zoom-in-95 duration-700 lg:flex-row">
							<div className="flex flex-[5.5] flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-[#111111] shadow-2xl">
								<div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
									<div className="flex items-center gap-3">
										<FileText size={20} className="text-blue-500" />
										<span className="text-sm font-medium">{result.fileName}</span>
									</div>
									<span
										className={cn(
											"rounded-full border px-3 py-1 text-xs font-bold uppercase",
											riskBadgeClass(result.riskLevel),
										)}
									>
										{riskLabel(result.riskLevel)}
									</span>
								</div>
								<div className="flex-grow overflow-y-auto p-6 md:p-8">
									<div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
										{renderInlineBold(result.analysis)}
									</div>
									{result.truncated && (
										<p className="mt-4 text-xs text-amber-400">
											Документът е съкратен за анализ ({result.extractedCharacters} знака).
										</p>
									)}
								</div>
								<div className="border-t border-zinc-800 bg-zinc-900/50 p-4">
									<button
										type="button"
										onClick={() => {
											setResult(null);
											setFile(null);
											setChatMessages([]);
										}}
										className="text-sm text-zinc-400 hover:text-white"
									>
										← Нов документ
									</button>
								</div>
							</div>

							<div className="flex flex-[4.5] flex-col gap-6">
								<div className="flex h-[420px] flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-[#111111] shadow-2xl">
									<div className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
										<h3 className="text-sm font-bold uppercase tracking-widest">
											Уточняващи въпроси · Елена
										</h3>
									</div>
									<div className="flex flex-grow flex-col gap-4 overflow-y-auto p-4">
										{chatMessages.map((msg, i) => (
											<div
												key={i}
												className={cn(
													"max-w-[90%] rounded-2xl p-3 text-sm leading-relaxed",
													msg.role === "user"
														? "self-end bg-blue-600 text-white"
														: "self-start border border-zinc-800 bg-zinc-900 text-zinc-300",
												)}
											>
												{renderInlineBold(msg.content)}
											</div>
										))}
										<div ref={chatEndRef} />
									</div>
									<form
										onSubmit={sendFollowUp}
										className="flex gap-2 border-t border-zinc-800 bg-zinc-900/50 p-3"
									>
										<input
											value={chatInput}
											onChange={(e) => setChatInput(e.target.value)}
											disabled={chatLoading}
											placeholder="Задай въпрос за документа…"
											className="flex-grow rounded-xl border border-zinc-800 bg-[#181818] px-4 py-2 text-sm focus:border-blue-500/50 focus:outline-none"
										/>
										<button
											type="submit"
											disabled={chatLoading || !chatInput.trim()}
											className="rounded-xl bg-blue-600 p-2 text-white hover:bg-blue-500 disabled:opacity-50"
										>
											{chatLoading ? (
												<Loader2 size={18} className="animate-spin" />
											) : (
												<Send size={18} />
											)}
										</button>
									</form>
								</div>

								{risks.length > 0 && (
									<div className="rounded-3xl border border-zinc-800 bg-[#111111] p-6 shadow-2xl">
										<div className="mb-4 flex items-center gap-2">
											<AlertTriangle size={18} className="text-red-500" />
											<h3 className="text-sm font-bold uppercase tracking-widest text-red-500">
												Рискове
											</h3>
										</div>
										<ul className="space-y-2 text-xs text-zinc-400">
											{risks.map((r, i) => (
												<li key={i} className="rounded-lg border border-red-500/20 bg-zinc-900/50 p-3">
													{r}
												</li>
											))}
										</ul>
									</div>
								)}

								{dates.length > 0 && (
									<div className="rounded-3xl border border-zinc-800 bg-[#111111] p-6 shadow-2xl">
										<h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-blue-500">
											Срокове от анализа
										</h3>
										<ul className="space-y-3 text-sm">
											{dates.map((d, i) => (
												<li key={i} className="text-zinc-300">
													<span className="font-mono text-xs font-bold text-blue-400">{d.date}</span>
													<p className="mt-1 text-xs text-zinc-500">{d.label}</p>
												</li>
											))}
										</ul>
									</div>
								)}
							</div>
						</div>
					)}
				</main>
			</AuroraBackground>

			<SiteFooter />
		</div>
	);
}
