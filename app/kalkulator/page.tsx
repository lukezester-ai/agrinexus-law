"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Calculator, Check, Copy, Sparkles, Mail, ArrowRight, Loader2 } from "lucide-react";
import { SitePageShell } from "@/components/site-page-shell";
import { createClient } from "@/lib/supabase/client";
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

const FOCUS_IDS = new Set<FarmProductionFocus>(FOCUS_OPTIONS.map((o) => o.id));

/** Версия на запазеното състояние — при промяна на формулите вдигни, за да не се ползват стари сметки от sessionStorage. */
const CALC_STATE_KEY = "agrinexus-kalkulator-state";
const CALC_STATE_VERSION = 2;

type CalcPersisted = {
	v: number;
	decares: string;
	focus: FarmProductionFocus;
	organicEco: boolean;
	youngFarmer: boolean;
	dairyCows: string;
};

function readPersistedCalculator(): CalcPersisted | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = sessionStorage.getItem(CALC_STATE_KEY);
		if (!raw) return null;
		const s = JSON.parse(raw) as Partial<CalcPersisted>;
		if (s?.v !== CALC_STATE_VERSION || typeof s.decares !== "string") return null;
		const focus =
			s.focus && FOCUS_IDS.has(s.focus as FarmProductionFocus)
				? (s.focus as FarmProductionFocus)
				: "grain";
		return {
			v: CALC_STATE_VERSION,
			decares: s.decares,
			focus,
			organicEco: Boolean(s.organicEco),
			youngFarmer: Boolean(s.youngFarmer),
			dairyCows: typeof s.dairyCows === "string" ? s.dairyCows : "",
		};
	} catch {
		return null;
	}
}

export default function KalkulatorPage() {
	const [decares, setDecares] = useState<string>("50");
	const [focus, setFocus] = useState<FarmProductionFocus>("grain");
	const [organicEco, setOrganicEco] = useState(false);
	const [youngFarmer, setYoungFarmer] = useState(false);
	const [dairyCows, setDairyCows] = useState<string>("");
	const [copied, setCopied] = useState(false);

	const [hasAccess, setHasAccess] = useState(false);
	const [leadEmail, setLeadEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const supabase = useMemo(() => createClient(), []);
	const canPersist = useRef(false);

	/** Еднократно: последна сесия (sessionStorage) → иначе профил от „Моята ферма“. */
	useEffect(() => {
		const saved = readPersistedCalculator();
		if (saved) {
			setDecares(saved.decares);
			setFocus(saved.focus);
			setOrganicEco(saved.organicEco);
			setYoungFarmer(saved.youngFarmer);
			setDairyCows(saved.dairyCows);
		} else {
			const p = loadFarmProfile();
			if (p && p.total_decares && p.total_decares > 0) {
				setDecares(String(p.total_decares));
			}
			if (p?.is_organic) setOrganicEco(true);
		}
		queueMicrotask(() => {
			canPersist.current = true;
		});
	}, []);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			if (session?.user) setHasAccess(true);
		});
	}, [supabase]);

	useEffect(() => {
		if (!canPersist.current || typeof window === "undefined") return;
		try {
			const payload: CalcPersisted = {
				v: CALC_STATE_VERSION,
				decares,
				focus,
				organicEco,
				youngFarmer,
				dairyCows,
			};
			sessionStorage.setItem(CALC_STATE_KEY, JSON.stringify(payload));
		} catch {
			/* квота / частен режим */
		}
	}, [decares, focus, organicEco, youngFarmer, dairyCows]);

	const resetCalculatorToProfile = () => {
		try {
			sessionStorage.removeItem(CALC_STATE_KEY);
		} catch {
			/* ignore */
		}
		const p = loadFarmProfile();
		const nextDecares = p && p.total_decares && p.total_decares > 0 ? String(p.total_decares) : "50";
		const nextOrganic = Boolean(p?.is_organic);
		setDecares(nextDecares);
		setFocus("grain");
		setOrganicEco(nextOrganic);
		setYoungFarmer(false);
		setDairyCows("");
		try {
			sessionStorage.setItem(
				CALC_STATE_KEY,
				JSON.stringify({
					v: CALC_STATE_VERSION,
					decares: nextDecares,
					focus: "grain" as FarmProductionFocus,
					organicEco: nextOrganic,
					youngFarmer: false,
					dairyCows: "",
				} satisfies CalcPersisted),
			);
		} catch {
			/* ignore */
		}
	};

	const handleUnlock = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!leadEmail) return;
		setIsSubmitting(true);
		try {
			await supabase.from("leads").insert([{ email: leadEmail }]);
		} catch (err) {
			console.error("Error saving lead", err);
		} finally {
			setHasAccess(true); // Allow access even if insert fails
			setIsSubmitting(false);
		}
	};

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

	const validationError = validateCalculatorInput(input);
	const result = useMemo(() => {
		if (validationError) return null;
		return estimateSubsidy(input);
	}, [input, validationError]);

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
		<SitePageShell
			maxWidth="xl"
			subheader={
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Калкулатор субсидии</p>
					<Link href="/kalendar" className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300 sm:text-sm">
						Сезонен календар
					</Link>
				</div>
			}
		>
			<div className="text-center mb-8">
				<div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-200/80 bg-teal-100 text-teal-800 dark:border-teal-800 dark:bg-teal-950/80 dark:text-teal-300">
					<Calculator size={28} aria-hidden />
				</div>
				<h1 className="font-display mb-2 text-2xl font-medium tracking-tight text-slate-950 dark:text-white sm:text-3xl">
					Колко приблизително може да получиш?
				</h1>
				<p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
					Три полета — ориентировъчен диапазон в лева. Сподели резултата и се запиши за пълен достъп до екипа.
				</p>
			</div>

			<div className="surface-card space-y-5 p-5 sm:p-6">
					<div>
						<label className="block text-sm font-medium text-slate-800 dark:text-slate-100 mb-1.5">
							Декари (общо декларирана площ)
						</label>
						<input
							type="number"
							min={0.5}
							step={0.5}
							value={decares}
							onChange={(e) => setDecares(e.target.value)}
							className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-lg font-medium"
						/>
						<p className="text-xs text-slate-500 mt-1">
							10 декара = 1 хектар. За този раздел стойностите се помнят в сесията (до затваряне на прозореца), за да не се връщат стари декари от профила при всяко посещение.
						</p>
						<button
							type="button"
							onClick={resetCalculatorToProfile}
							className="mt-2 text-xs font-medium text-emerald-700 underline underline-offset-2 hover:text-cyan-700 dark:text-emerald-300 dark:hover:text-cyan-200"
						>
							Нулирай и зареди от „Моята ферма“
						</button>
					</div>

					<div>
						<span id="kalkulator-focus-label" className="block text-sm font-medium text-slate-800 dark:text-slate-100 mb-2">
							Какво отглеждаш основно?
						</span>
						<div
							className="grid gap-2"
							role="radiogroup"
							aria-labelledby="kalkulator-focus-label"
						>
							{FOCUS_OPTIONS.map((o) => (
								<button
									key={o.id}
									type="button"
									role="radio"
									aria-checked={focus === o.id}
									onClick={() => setFocus(o.id)}
									className={`text-left px-4 py-3 rounded-lg border text-sm transition ${
										focus === o.id
											? "border-emerald-600 bg-teal-50 ring-1 ring-emerald-500/30 dark:bg-teal-950/40 text-slate-900 dark:text-slate-50"
											: "border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80"
									}`}>
									{o.label}
								</button>
							))}
						</div>
					</div>

					{focus === "livestock" && (
						<div>
							<label className="block text-sm font-medium text-slate-800 dark:text-slate-100 mb-1.5">
								Брой млечни крави (за обвързано подпомагане, опционално)
							</label>
							<input
								type="number"
								min={0}
								value={dairyCows}
								onChange={(e) => setDairyCows(e.target.value)}
								placeholder="напр. 20 или празно"
								className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-950 dark:text-slate-100"
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
							<span className="text-sm text-slate-800 dark:text-slate-200">
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
							<span className="text-sm text-slate-800 dark:text-slate-200">
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
							<p className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
								{result.totalLowBgn.toLocaleString("bg-BG")} –{" "}
								{result.totalHighBgn.toLocaleString("bg-BG")}{" "}
								<span className="text-lg font-normal text-slate-600 dark:text-slate-400">лв</span>
							</p>
							<p className="text-xs text-slate-600 dark:text-slate-400">
								Сумата се променя при избор на тип стопанство, декари и отметките по-горе.
							</p>

							{hasAccess ? (
								<>
									<ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 border-t border-teal-200/60 dark:border-teal-800/60 pt-3">
										{result.lines.map((L, i) => (
											<li key={i}>
												{L.label && (
													<span className="font-medium text-slate-700 dark:text-slate-300">{L.label}: </span>
												)}
												{L.lowBgn.toLocaleString("bg-BG")} – {L.highBgn.toLocaleString("bg-BG")} лв
											</li>
										))}
									</ul>
									<p className="text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed">
										Това не е официално изчисление на ДФЗ. Ставките са закръглени; реалната сума зависи от заявени схеми,
										площи, санкции и актуализации за кампанията.
									</p>
									<div className="flex flex-wrap gap-2 pt-2">
										<button
											type="button"
											onClick={() => void onShare()}
											className="brand-cta-bg inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm hover:brightness-105 transition">
											{copied ? <Check size={16} /> : <Copy size={16} />}
											{copied ? "Копирано" : "Сподели текст"}
										</button>
										<Link
											href="/"
											className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-800 dark:text-slate-100">
											<Sparkles size={16} />
											Към началото
										</Link>
										<Link
											href="/"
											className="inline-flex items-center px-4 py-2 rounded-lg text-sm text-emerald-700 dark:text-teal-400 font-medium">
											Към чат с Виктория →
										</Link>
									</div>
								</>
							) : (
								<div className="space-y-4 border-t border-teal-200/60 dark:border-teal-800/60 pt-4 text-center">
									<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
										<Mail size={24} />
									</div>
									<h3 className="text-lg font-semibold text-slate-900 dark:text-white">Пълна разбивка по редове</h3>
									<p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
										Въведи имейл, за да видиш детайлните редове и да запазиш контакт с екипа.
									</p>
									<form onSubmit={handleUnlock} className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
										<input
											type="email"
											required
											value={leadEmail}
											onChange={(e) => setLeadEmail(e.target.value)}
											placeholder="vasil@ferma.bg"
											className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
										/>
										<button
											type="submit"
											disabled={isSubmitting}
											className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-70"
										>
											{isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Покажи разбивката"}
											<ArrowRight size={16} />
										</button>
									</form>
								</div>
							)}
						</div>
					)}
				</div>
		</SitePageShell>
	);
}
