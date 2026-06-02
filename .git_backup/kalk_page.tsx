"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
	Calculator, Check, Copy, Sparkles, Mail, ArrowRight, Loader2,
	Wheat, Tractor, Apple, Grape, Milk, ChevronRight, ChevronLeft, Map, Sprout
} from "lucide-react";
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

const FOCUS_OPTIONS = [
	{ id: "grain" as FarmProductionFocus, label: "Зърнени / полски култури", icon: Wheat, desc: "Пшеница, царевица, слънчоглед" },
	{ id: "mixed" as FarmProductionFocus, label: "Смесено стопанство", icon: Tractor, desc: "Комбинация от култури" },
	{ id: "horticulture" as FarmProductionFocus, label: "Зеленчуци / овощия", icon: Apple, desc: "Овощни градини и зеленчуци" },
	{ id: "vine" as FarmProductionFocus, label: "Лозя", icon: Grape, desc: "Винен и десертен сорт" },
	{ id: "livestock" as FarmProductionFocus, label: "Животновъдство (с площ)", icon: Milk, desc: "Пасища и животни" },
];

const CALC_STATE_KEY = "agrinexus-kalkulator-state-v3";
const CALC_STATE_VERSION = 3;

export default function KalkulatorPage() {
	const [step, setStep] = useState(1);
	const [decares, setDecares] = useState<string>("50");
	const [focus, setFocus] = useState<FarmProductionFocus | null>(null);
	const [organicEco, setOrganicEco] = useState(false);
	const [youngFarmer, setYoungFarmer] = useState(false);
	const [dairyCows, setDairyCows] = useState<string>("");
	
	const [copied, setCopied] = useState(false);
	const [hasAccess, setHasAccess] = useState(false);
	const [leadEmail, setLeadEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const supabase = useMemo(() => createClient(), []);

	useEffect(() => {
		const p = loadFarmProfile();
		if (p && p.total_decares && p.total_decares > 0) {
			setDecares(String(p.total_decares));
		}
		if (p?.is_organic) setOrganicEco(true);
		
		supabase.auth.getSession().then(({ data: { session } }) => {
			if (session?.user) setHasAccess(true);
		});
	}, [supabase]);

	const handleUnlock = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!leadEmail) return;
		setIsSubmitting(true);
		try {
			await supabase.from("leads").insert([{ email: leadEmail }]);
		} catch (err) {
			console.error("Error saving lead", err);
		} finally {
			setHasAccess(true);
			setIsSubmitting(false);
		}
	};

	const input = useMemo((): SubsidyCalculatorInput => {
		const d = Number(String(decares).replace(",", "."));
		const cowRaw = dairyCows.trim();
		const cows = cowRaw === "" ? undefined : Number(cowRaw);
		return {
			decares: Number.isFinite(d) ? d : 0,
			focus: focus || "grain",
			organicEco,
			youngFarmer,
			dairyCows: cows,
		};
	}, [decares, focus, organicEco, youngFarmer, dairyCows]);

	const validationError = validateCalculatorInput(input);
	const result = useMemo(() => {
		if (validationError || !focus) return null;
		return estimateSubsidy(input);
	}, [input, validationError, focus]);

	const onShare = async () => {
		if (!result) return;
		const text = formatShareSnippet(
			input.decares,
			result.totalLowBgn,
			result.totalHighBgn,
			typeof window !== "undefined" ? window.location.origin : "https://agrinexus.bg",
		);
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2500);
		} catch {
			prompt("Копирай текста:", text);
		}
	};

	const slideVariants = {
		enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
		center: { zIndex: 1, x: 0, opacity: 1 },
		exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0 }),
	};

	const [direction, setDirection] = useState(1);
	const paginate = (newDirection: number, nextStep: number) => {
		setDirection(newDirection);
		setStep(nextStep);
	};

	return (
		<SitePageShell
			maxWidth="xl"
			subheader={
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Калкулатор субсидии</p>
					<Link href="/kalendar" className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
						Сезонен календар
					</Link>
				</div>
			}
		>
			<div className="text-center mb-8">
				<motion.div 
					initial={{ scale: 0 }} 
					animate={{ scale: 1 }} 
					className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-100 to-teal-50 text-teal-700 shadow-xl shadow-teal-900/5 dark:border-teal-800 dark:from-teal-900/60 dark:to-teal-950/80 dark:text-teal-300"
				>
					<Calculator size={32} />
				</motion.div>
				<h1 className="font-display mb-3 text-3xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-4xl">
					Оценка на субсидиите
				</h1>
				<p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
					Разберете какъв е потенциалният размер на вашите директни плащания само в 3 лесни стъпки.
				</p>
			</div>

			<div className="relative overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xl shadow-slate-200/20 dark:shadow-black/40 rounded-3xl p-6 sm:p-10 min-h-[480px] flex flex-col">
				
				{/* Progress Indicator */}
				<div className="flex gap-2 mb-8">
					{[1, 2, 3].map((s) => (
						<div key={s} className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
							<motion.div 
								className="h-full bg-teal-500 dark:bg-teal-400"
								initial={{ width: "0%" }}
								animate={{ width: step >= s ? "100%" : "0%" }}
								transition={{ duration: 0.4 }}
							/>
						</div>
					))}
				</div>

				<div className="flex-1 relative">
					<AnimatePresence custom={direction} mode="wait">
						{step === 1 && (
							<motion.div
								key="step1"
								custom={direction}
								variants={slideVariants}
								initial="enter"
								animate="center"
								exit="exit"
								transition={{ duration: 0.3 }}
								className="w-full flex flex-col h-full"
							>
								<h2 className="text-xl font-semibold mb-6 text-slate-900 dark:text-white">Какво отглеждате основно?</h2>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
									{FOCUS_OPTIONS.map((opt) => {
										const Icon = opt.icon;
										const isSelected = focus === opt.id;
										return (
											<button
												key={opt.id}
												onClick={() => setFocus(opt.id)}
												className={`text-left flex items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-200 ${
													isSelected 
														? "border-teal-500 bg-teal-50/50 dark:bg-teal-900/20 dark:border-teal-400" 
														: "border-slate-100 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30"
												}`}
											>
												<div className={`p-2.5 rounded-xl ${isSelected ? 'bg-teal-500 text-white dark:bg-teal-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
													<Icon size={22} />
												</div>
												<div>
													<div className={`font-semibold ${isSelected ? 'text-teal-900 dark:text-teal-100' : 'text-slate-700 dark:text-slate-300'}`}>
														{opt.label}
													</div>
													<div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{opt.desc}</div>
												</div>
											</button>
										)
									})}
								</div>
								<div className="flex justify-end mt-8">
									<button
										disabled={!focus}
										onClick={() => paginate(1, 2)}
										className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-teal-500 dark:hover:bg-teal-400 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/10 dark:shadow-teal-900/20"
									>
										Напред към Стъпка 2 <ChevronRight size={18} />
									</button>
								</div>
							</motion.div>
						)}

						{step === 2 && (
							<motion.div
								key="step2"
								custom={direction}
								variants={slideVariants}
								initial="enter"
								animate="center"
								exit="exit"
								transition={{ duration: 0.3 }}
								className="w-full flex flex-col h-full"
							>
								<h2 className="text-xl font-semibold mb-6 text-slate-900 dark:text-white">Детайли за стопанството</h2>
								
								<div className="space-y-6 flex-1">
									<div>
										<label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
											<Map size={18} className="text-teal-500" /> Общо декларирани декари
										</label>
										<input
											type="number"
											min={0.5}
											step={0.5}
											value={decares}
											onChange={(e) => setDecares(e.target.value)}
											className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 text-xl font-semibold focus:ring-2 focus:ring-teal-500/50 outline-none transition"
										/>
									</div>

									{focus === "livestock" && (
										<motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
											<label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
												<Milk size={18} className="text-teal-500" /> Брой млечни крави (Опционално)
											</label>
											<input
												type="number"
												min={0}
												value={dairyCows}
												onChange={(e) => setDairyCows(e.target.value)}
												placeholder="напр. 20"
												className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/50 outline-none transition"
											/>
										</motion.div>
									)}

									<div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
										<label className="flex items-center gap-3 cursor-pointer group">
											<div className={`flex items-center justify-center w-6 h-6 rounded border ${youngFarmer ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-300 dark:border-slate-600 group-hover:border-teal-400'}`}>
												{youngFarmer && <Check size={14} />}
											</div>
											<input type="checkbox" className="hidden" checked={youngFarmer} onChange={(e) => setYoungFarmer(e.target.checked)} />
											<span className="text-sm font-medium text-slate-700 dark:text-slate-200">Млад земеделски производител (до 30 ха)</span>
										</label>

										<label className="flex items-center gap-3 cursor-pointer group">
											<div className={`flex items-center justify-center w-6 h-6 rounded border ${organicEco ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-300 dark:border-slate-600 group-hover:border-teal-400'}`}>
												{organicEco && <Check size={14} />}
											</div>
											<input type="checkbox" className="hidden" checked={organicEco} onChange={(e) => setOrganicEco(e.target.checked)} />
											<span className="text-sm font-medium text-slate-700 dark:text-slate-200">Биологично земеделие или екосхема <Sprout size={16} className="inline ml-1 text-emerald-500"/></span>
										</label>
									</div>
								</div>

								{validationError && (
									<div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400">
										{validationError}
									</div>
								)}

								<div className="flex justify-between mt-8">
									<button onClick={() => paginate(-1, 1)} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium transition">
										<ChevronLeft size={18} /> Назад
									</button>
									<button
										disabled={!!validationError}
										onClick={() => paginate(1, 3)}
										className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-teal-500 dark:hover:bg-teal-400 text-white font-medium transition disabled:opacity-50 shadow-lg shadow-slate-900/10 dark:shadow-teal-900/20"
									>
										Изчисли <Calculator size={18} />
									</button>
								</div>
							</motion.div>
						)}

						{step === 3 && result && (
							<motion.div
								key="step3"
								custom={direction}
								variants={slideVariants}
								initial="enter"
								animate="center"
								exit="exit"
								transition={{ duration: 0.4 }}
								className="w-full flex flex-col h-full items-center justify-center text-center"
							>
								<div className="mb-2">
									<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold tracking-wide uppercase">
										<Sparkles size={14} /> Прогнозен резултат
									</span>
								</div>
								
								<div className="my-6">
									<h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Очакван диапазон (годишно)</h3>
									<motion.div 
										initial={{ scale: 0.8, opacity: 0 }} 
										animate={{ scale: 1, opacity: 1 }} 
										transition={{ delay: 0.2, type: "spring" }}
										className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-500 dark:from-teal-400 dark:to-emerald-300"
									>
										{result.totalLowBgn.toLocaleString("bg-BG")} – {result.totalHighBgn.toLocaleString("bg-BG")} <span className="text-2xl sm:text-3xl font-medium text-slate-400">лв</span>
									</motion.div>
								</div>

								{hasAccess ? (
									<div className="w-full mt-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 text-left">
										<h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Детайлна разбивка</h4>
										<ul className="space-y-3">
											{result.lines.map((L, i) => (
												<li key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm">
													<span className="text-slate-600 dark:text-slate-400 max-w-[70%]">{L.label}</span>
													<span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
														{L.lowBgn.toLocaleString("bg-BG")} – {L.highBgn.toLocaleString("bg-BG")} лв
													</span>
												</li>
											))}
										</ul>
										<div className="mt-6 flex flex-col sm:flex-row gap-3">
											<button onClick={() => void onShare()} className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-medium transition shadow-md shadow-teal-500/20">
												{copied ? <Check size={18} /> : <Copy size={18} />} {copied ? "Копирано" : "Копирай резултат"}
											</button>
											<button onClick={() => paginate(-1, 1)} className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition text-slate-700 dark:text-slate-300">
												Ново изчисление
											</button>
										</div>
									</div>
								) : (
									<motion.div 
										initial={{ y: 20, opacity: 0 }}
										animate={{ y: 0, opacity: 1 }}
										transition={{ delay: 0.4 }}
										className="w-full max-w-md mx-auto mt-6 p-6 rounded-3xl bg-slate-900 dark:bg-slate-800/80 shadow-2xl relative overflow-hidden"
									>
										<div className="absolute top-0 right-0 p-4 opacity-10"><Calculator size={100} /></div>
										<h4 className="text-lg font-semibold text-white mb-2 relative z-10">Искате ли пълната разбивка?</h4>
										<p className="text-slate-400 text-sm mb-5 relative z-10">Въведете вашия имейл, за да отключите детайлите по схеми и да запазите изчислението си.</p>
										
										<form onSubmit={handleUnlock} className="flex gap-2 relative z-10">
											<input
												type="email"
												required
												value={leadEmail}
												onChange={(e) => setLeadEmail(e.target.value)}
												placeholder="vasil@ferma.bg"
												className="flex-1 px-4 py-3 rounded-xl border-none bg-slate-800 dark:bg-slate-900 text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 outline-none"
											/>
											<button
												type="submit"
												disabled={isSubmitting}
												className="px-4 py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-medium transition disabled:opacity-70"
											>
												{isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
											</button>
										</form>
										<button onClick={() => paginate(-1, 2)} className="mt-4 text-xs text-slate-500 hover:text-white transition">← Назад към данните</button>
									</motion.div>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</SitePageShell>
	);
}
