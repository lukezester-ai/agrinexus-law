"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	ClipboardCheck,
	Copy,
	FileText,
	History,
	Scale,
	ShieldCheck,
	Sparkles,
	Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SitePageShell } from "@/components/site-page-shell";

type ReviewMode = "subsidy" | "contract" | "lease" | "notice";

type ReviewHistoryItem = {
	id: string;
	fileName: string;
	mode: ReviewMode;
	context: string;
	prompt: string;
	createdAt: string;
};

const historyStorageKey = "agrinexus-document-review-history";

const reviewModes: Record<ReviewMode, { label: string; description: string; checks: string[] }> = {
	subsidy: {
		label: "Субсидии / ДФЗ",
		description: "Проверка за срокове, условия, приложения и рискови липси.",
		checks: ["Идентифицирани срокове", "Условия за допустимост", "Необходими приложения", "Рискове при непълни данни"],
	},
	contract: {
		label: "Договор",
		description: "Преглед на страни, задължения, плащания, неустойки и прекратяване.",
		checks: ["Страни и предмет", "Плащания и срокове", "Неустойки", "Клауза за прекратяване"],
	},
	lease: {
		label: "Аренда / наем",
		description: "Фокус върху имоти, срок, рента, индексация и регистрационни действия.",
		checks: ["Идентификация на имоти", "Срок и продължаване", "Рента и плащане", "Регистрация и вписване"],
	},
	notice: {
		label: "Уведомление / писмо",
		description: "Извличане на искане, срок за реакция и препоръчана следваща стъпка.",
		checks: ["Какво се иска", "Краен срок", "Необходими доказателства", "Следваща стъпка"],
	},
};

const reviewQuestions = [
	"Кои са най-важните срокове и какво трябва да направя първо?",
	"Има ли липсващи документи или рискови клаузи?",
	"Обясни този документ като checklist за фермер.",
];

const reviewBenefits: { title: string; subtitle: string; Icon: LucideIcon }[] = [
	{ title: "Резюме", subtitle: "на разбираем език", Icon: FileText },
	{ title: "Рискове", subtitle: "клаузи и липси", Icon: AlertTriangle },
	{ title: "Действия", subtitle: "следващ checklist", Icon: ClipboardCheck },
];

export default function DocumentReviewPage() {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [mode, setMode] = useState<ReviewMode>("subsidy");
	const [fileName, setFileName] = useState("");
	const [context, setContext] = useState("");
	const [copied, setCopied] = useState(false);
	const [history, setHistory] = useState<ReviewHistoryItem[]>([]);
	const selectedMode = reviewModes[mode];
	const aiPrompt = useMemo(() => {
		const target = fileName || "качения документ";
		const contextLine = context.trim()
			? `\nКонтекст от фермера: ${context.trim()}`
			: "";
		return `Прегледай ${target} като ${selectedMode.label}. Изведи резюме, рискове, срокове, липсващи данни и следващи действия.${contextLine}`;
	}, [context, fileName, selectedMode.label]);

	useEffect(() => {
		try {
			const saved = localStorage.getItem(historyStorageKey);
			if (!saved) return;
			const parsed = JSON.parse(saved) as ReviewHistoryItem[];
			if (Array.isArray(parsed)) setHistory(parsed.slice(0, 5));
		} catch {
			setHistory([]);
		}
	}, []);

	const persistHistory = (items: ReviewHistoryItem[]) => {
		setHistory(items);
		localStorage.setItem(historyStorageKey, JSON.stringify(items));
	};

	const saveCurrentReview = () => {
		const item: ReviewHistoryItem = {
			id: `${Date.now()}`,
			fileName: fileName || "Без избран файл",
			mode,
			context,
			prompt: aiPrompt,
			createdAt: new Date().toISOString(),
		};
		persistHistory([item, ...history].slice(0, 5));
	};

	const restoreReview = (item: ReviewHistoryItem) => {
		setFileName(item.fileName === "Без избран файл" ? "" : item.fileName);
		setMode(item.mode);
		setContext(item.context);
	};

	const clearHistory = () => {
		persistHistory([]);
	};

	const copyPrompt = async () => {
		await navigator.clipboard.writeText(aiPrompt);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1800);
	};

	return (
		<SitePageShell
			maxWidth="7xl"
			subheader={
				<div className="flex flex-wrap items-center justify-between gap-3">
					<Link href="/" className="text-sm font-semibold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
						← Начало
					</Link>
					<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">AI преглед на документи</p>
					<Link href="/documents" className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
						Мои документи
					</Link>
				</div>
			}
		>
			<div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
				<section className="glass-panel rounded-3xl p-6 sm:p-8">
					<div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-800 dark:bg-cyan-950/35 dark:text-cyan-200">
						<Scale size={14} /> Document copilot
					</div>
					<h1 className="mt-5 font-display text-3xl font-medium tracking-tight text-slate-950 dark:text-white sm:text-5xl">
						Прегледай документ преди да действаш
					</h1>
					<p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
						Подготви договор, уведомление или ДФЗ документ за AI анализ. Страницата структурира въпроса, ключовите проверки и следващите действия.
					</p>

					<div className="mt-7 grid gap-3 sm:grid-cols-3">
						{reviewBenefits.map(({ title, subtitle, Icon }) => {
							const Glyph = Icon;
							return (
								<div key={title} className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/45">
									<Glyph className="mb-3 text-cyan-700 dark:text-cyan-300" size={22} />
									<p className="text-sm font-semibold text-slate-950 dark:text-white">{title}</p>
									<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
								</div>
							);
						})}
					</div>
				</section>

				<section className="surface-card rounded-3xl p-5 sm:p-6">
					<div className="mb-5 flex items-center gap-2">
						<Sparkles className="text-emerald-700 dark:text-emerald-300" size={20} />
						<h2 className="font-display text-xl font-medium text-slate-950 dark:text-white">Подготви AI преглед</h2>
					</div>

					<input
						ref={inputRef}
						type="file"
						accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
						className="hidden"
						onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}
					/>
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50/60 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:border-emerald-500/70 dark:hover:bg-emerald-950/25"
					>
						<Upload size={20} />
						{fileName || "Избери документ за преглед"}
					</button>

					<div className="mt-5 grid gap-3 sm:grid-cols-2">
						{(Object.keys(reviewModes) as ReviewMode[]).map((key) => (
							<button
								key={key}
								type="button"
								onClick={() => setMode(key)}
								className={`rounded-2xl border p-4 text-left transition ${
									mode === key
										? "border-emerald-500 bg-emerald-50 text-emerald-950 shadow-sm dark:border-emerald-500/70 dark:bg-emerald-950/35 dark:text-emerald-100"
										: "border-slate-200 bg-white/70 text-slate-700 hover:border-cyan-300 dark:border-slate-800 dark:bg-slate-950/35 dark:text-slate-200 dark:hover:border-cyan-700"
								}`}
							>
								<p className="text-sm font-semibold">{reviewModes[key].label}</p>
								<p className="mt-1 text-xs leading-5 opacity-80">{reviewModes[key].description}</p>
							</button>
						))}
					</div>
					<label className="mt-5 block">
						<span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
							Контекст за AI анализа
						</span>
						<textarea
							value={context}
							onChange={(event) => setContext(event.target.value)}
							rows={4}
							placeholder="Напр. получих писмо от ДФЗ, имам 120 дка пшеница в Добрич, срокът е до края на месеца..."
							className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/15 dark:border-slate-800 dark:bg-slate-950/45 dark:text-white dark:focus:border-cyan-600"
						/>
					</label>
				</section>
			</div>

			<section className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
				<div className="glass-card rounded-3xl p-6">
					<div className="mb-4 flex items-center gap-2">
						<ShieldCheck size={20} className="text-cyan-700 dark:text-cyan-300" />
						<h2 className="font-display text-lg font-medium text-slate-950 dark:text-white">Checklist за преглед</h2>
					</div>
					<div className="space-y-3">
						{selectedMode.checks.map((item) => (
							<div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950/45">
								<CheckCircle2 className="shrink-0 text-emerald-700 dark:text-emerald-300" size={18} />
								<span className="font-medium text-slate-700 dark:text-slate-200">{item}</span>
							</div>
						))}
					</div>
				</div>

				<div className="glass-card rounded-3xl p-6">
					<h2 className="font-display text-lg font-medium text-slate-950 dark:text-white">Готов AI prompt</h2>
					<p className="mt-3 whitespace-pre-line rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 text-sm leading-7 text-cyan-950 dark:border-cyan-900/70 dark:bg-cyan-950/25 dark:text-cyan-100">
						{aiPrompt}
					</p>
					<div className="mt-4 flex flex-wrap gap-2">
						{reviewQuestions.map((question) => (
							<Link
								key={question}
								href={`/?chatQ=${encodeURIComponent(question)}#chat`}
								className="rounded-full border border-slate-200 bg-white/75 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-400 hover:text-cyan-800 dark:border-slate-800 dark:bg-slate-950/45 dark:text-slate-200 dark:hover:border-cyan-700 dark:hover:text-cyan-200"
							>
								{question}
							</Link>
						))}
					</div>
					<div className="mt-5 flex flex-wrap gap-3">
						<button
							type="button"
							onClick={saveCurrentReview}
							className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:border-emerald-700"
						>
							<History size={16} /> Запази в история
						</button>
						<button
							type="button"
							onClick={() => void copyPrompt()}
							className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/75 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-400 hover:text-cyan-800 dark:border-slate-800 dark:bg-slate-950/45 dark:text-slate-200 dark:hover:border-cyan-700 dark:hover:text-cyan-200"
						>
							<Copy size={16} /> {copied ? "Копирано" : "Копирай prompt"}
						</button>
						<Link
							href={`/?chatQ=${encodeURIComponent(aiPrompt)}#chat`}
							className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-cyan-800 dark:bg-white dark:text-slate-950 dark:hover:bg-cyan-100"
						>
							Изпрати към AI асистента <ArrowRight size={16} />
						</Link>
					</div>
				</div>
			</section>

			<section className="mt-8 rounded-3xl border border-slate-200/80 bg-white/62 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/45">
				<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<History className="text-cyan-700 dark:text-cyan-300" size={20} />
						<h2 className="font-display text-lg font-medium text-slate-950 dark:text-white">Последни AI прегледи</h2>
					</div>
					{history.length ? (
						<button
							type="button"
							onClick={clearHistory}
							className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-rose-300 hover:text-rose-700 dark:border-slate-800 dark:text-slate-400 dark:hover:border-rose-800 dark:hover:text-rose-300"
						>
							Изчисти
						</button>
					) : null}
				</div>

				{history.length ? (
					<div className="grid gap-3 md:grid-cols-2">
						{history.map((item) => (
							<button
								key={item.id}
								type="button"
								onClick={() => restoreReview(item)}
								className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/45 dark:hover:border-cyan-800"
							>
								<p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{item.fileName}</p>
								<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
									{reviewModes[item.mode].label} · {new Date(item.createdAt).toLocaleString("bg-BG")}
								</p>
								<p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.prompt}</p>
							</button>
						))}
					</div>
				) : (
					<p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
						Все още няма запазени прегледи. Подготви prompt и натисни „Запази в история“.
					</p>
				)}
			</section>
		</SitePageShell>
	);
}
