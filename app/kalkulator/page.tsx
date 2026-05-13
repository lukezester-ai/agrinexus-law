"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
	ArrowLeft,
	Calculator,
	Check,
	Copy,
	Sparkles,
} from "lucide-react";
import {
	estimateSubsidy,
	formatShareSnippet,
	validateCalculatorInput,
	type FarmProductionFocus,
	type SubsidyCalculatorInput,
} from "@/lib/subsidy-calculator";
import { loadFarmProfile } from "@/lib/farm-profile";

const FOCUS_OPTIONS: Array<{ id: FarmProductionFocus; label: string }> = [
	{ id: "grain", label: "Зърнени / полски култури" },
	{ id: "mixed", label: "Смесено стопанство" },
	{ id: "horticulture", label: "Зеленчуци / овощия" },
	{ id: "vine", label: "Лозя" },
	{ id: "livestock", label: "Животновъдство (с площ)" },
];

export default function KalkulatorPage() {
	const [decares, setDecares] = useState<string>("50");
	const [focus, setFocus] = useState<FarmProductionFocus>("grain");
	const [organicEco, setOrganicEco] = useState(false);
	const [youngFarmer, setYoungFarmer] = useState(false);
	const [dairyCows, setDairyCows] = useState<string>("");
	const [copied, setCopied] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);

	useEffect(() => {
		const p = loadFarmProfile();
		if (!p) return;
		if (p.total_decares && p.total_decares > 0) {
			setDecares(String(p.total_decares));
		}
	}, []);

	const input = useMemo((): SubsidyCalculatorInput => {
		const d = Number(String(decares).replace(",", "."));
		const cowRaw = dairyCows.trim();
		const cowNum = cowRaw === "" ? undefined : Number(cowRaw);
		const cows =
			cowNum !== undefined && Number.isFinite(cowNum) ? cowNum : undefined;
		return {
			decares: Number.isFinite(d) ? d : 0,
			focus,
			organicEco,
			youngFarmer,
			dairyCows: cows,
		};
	}, [decares, focus, organicEco, youngFarmer, dairyCows]);

	const result = useMemo(() => {
		const err = validateCalculatorInput(input);
		setValidationError(err);
		if (err) return null;
		return estimateSubsidy(input);
	}, [input]);

	const siteUrl =
		(typeof process !== "undefined" &&
			process.env.NEXT_PUBLIC_SITE_URL?.trim()) ||
		(typeof window !== "undefined" ? window.location.origin : "");

	const onShare = async () => {
		if (!result) return;
		const text = formatShareSnippet(
			input.decares,
			result.totalLowBgn,
			result.totalHighBgn,
			siteUrl || "https://agrinexus.bg",
		);
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2500);
		} catch {
			prompt("Копирай текста:", text);
		}
	};

	return (
		<div className="min-h-screen agri-page-bg">
			<nav className="sticky top-0 z-20 bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-teal-100/80 dark:border-stone-800">
				<div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
					<Link
						href="/"
						className="flex items-center gap-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white text-sm shrink-0">
						<ArrowLeft size={16} aria-hidden />
						Начало
					</Link>
					<span className="font-medium text-stone-900 dark:text-stone-100 text-sm sm:text-base truncate">
						Калкулатор субсидии
					</span>
					<Link
						href="/kalendar"
						className="text-xs sm:text-sm text-[#0d9488] dark:text-teal-400 font-medium shrink-0">
						Календар
					</Link>
				</div>
			</nav>

			<main className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 mb-4 border border-teal-200/80 dark:border-teal-800">
						<Calculator size={28} aria-hidden />
					</div>
					<h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 dark:text-stone-50 mb-2">
						Колко приблизително може да получиш?
					</h1>
					<p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
						Три полета — ориентировъчен диапазон в лева. Сподели резултата и се запиши за пълен достъп до екипа.
					</p>
				</div>

				<div className="bg-white dark:bg-stone-900/95 rounded-2xl border border-stone-200 dark:border-stone-700 p-5 sm:p-6 shadow-sm space-y-5">
					<div>
						<label className="block text-sm font-medium text-stone-800 dark:text-stone-100 mb-1.5">
							Декари (общо декларирана площ)
						</label>
						<input
							type="number"
							min={0.5}
							step={0.5}
							value={decares}
							onChange={(e) => setDecares(e.target.value)}
							className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 text-lg font-medium"
						/>
						<p className="text-xs text-stone-500 mt-1">10 декара = 1 хектар</p>
					</div>

					<div>
						<span className="block text-sm font-medium text-stone-800 dark:text-stone-100 mb-2">
							Какво отглеждаш основно?
						</span>
						<div className="grid gap-2">
							{FOCUS_OPTIONS.map((o) => (
								<button
									key={o.id}
									type="button"
									onClick={() => setFocus(o.id)}
									className={`text-left px-4 py-3 rounded-lg border text-sm transition ${
										focus === o.id
											? "border-[#0d9488] bg-teal-50 dark:bg-teal-950/40 text-stone-900 dark:text-stone-50"
											: "border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800/80"
									}`}>
									{o.label}
								</button>
							))}
						</div>
					</div>

					{focus === "livestock" && (
						<div>
							<label className="block text-sm font-medium text-stone-800 dark:text-stone-100 mb-1.5">
								Брой млечни крави (за обвързано подпомагане, опционално)
							</label>
							<input
								type="number"
								min={0}
								value={dairyCows}
								onChange={(e) => setDairyCows(e.target.value)}
								placeholder="напр. 20 или празно"
								className="w-full px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-950 dark:text-stone-100"
							/>
						</div>
					)}

					<div className="flex flex-col gap-3">
						<label className="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								checked={youngFarmer}
								onChange={(e) => setYoungFarmer(e.target.checked)}
								className="w-4 h-4 rounded"
							/>
							<span className="text-sm text-stone-800 dark:text-stone-200">
								Млад земеделски производител (до 30 ха добавка — опростено)
							</span>
						</label>
						<label className="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								checked={organicEco}
								onChange={(e) => setOrganicEco(e.target.checked)}
								className="w-4 h-4 rounded"
							/>
							<span className="text-sm text-stone-800 dark:text-stone-200">
								Био / екосхема за биологично или висок екологичен компонент (широк диапазон)
							</span>
						</label>
					</div>

					{validationError && (
						<p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2">
							{validationError}
						</p>
					)}

					{result && (
						<div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/80 dark:bg-teal-950/25 p-4 space-y-3">
							<p className="text-xs uppercase tracking-wide text-teal-900 dark:text-teal-300 font-semibold">
								Прогнозен диапазон (годишно)
							</p>
							<p className="text-3xl font-semibold text-stone-900 dark:text-stone-50">
								{result.totalLowBgn.toLocaleString("bg-BG")} –{" "}
								{result.totalHighBgn.toLocaleString("bg-BG")}{" "}
								<span className="text-lg font-normal text-stone-600 dark:text-stone-400">лв</span>
							</p>
							<ul className="text-xs text-stone-600 dark:text-stone-400 space-y-1.5 border-t border-teal-200/60 dark:border-teal-800/60 pt-3">
								{result.lines.map((L, i) => (
									<li key={i}>
										{L.label && <span className="font-medium text-stone-700 dark:text-stone-300">{L.label}: </span>}
										{L.lowBgn.toLocaleString("bg-BG")} – {L.highBgn.toLocaleString("bg-BG")} лв
									</li>
								))}
							</ul>
							<p className="text-[11px] text-stone-500 dark:text-stone-500 leading-relaxed">
								Това не е официално изчисление на ДФЗ. Ставките са закръглени; реалната сума зависи от заявени схеми,
								площи, санкции и актуализации за кампанията.
							</p>
							<div className="flex flex-wrap gap-2 pt-2">
								<button
									type="button"
									onClick={() => void onShare()}
									className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0d9488] text-white text-sm font-medium">
									{copied ? <Check size={16} /> : <Copy size={16} />}
									{copied ? "Копирано" : "Сподели текст"}
								</button>
								<Link
									href="/"
									className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-600 text-sm font-medium text-stone-800 dark:text-stone-100">
									<Sparkles size={16} />
									Към началото
								</Link>
								<Link
									href="/"
									className="inline-flex items-center px-4 py-2 rounded-lg text-sm text-[#0d9488] dark:text-teal-400 font-medium">
									Към чат с Виктория →
								</Link>
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
