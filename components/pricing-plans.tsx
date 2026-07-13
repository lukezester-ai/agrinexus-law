"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanId } from "@/lib/billing/plans";
import { PLANS, PAID_PLAN_IDS } from "@/lib/billing/plans";

type BillingInterval = "month" | "year";

type SubscriptionPayload = {
	authenticated: boolean;
	billingConfigured?: boolean;
	currency?: string;
	trialDays?: number;
	trialEligible?: boolean;
	plan: { id: PlanId; name: string };
	subscription: {
		status: string;
		currentPeriodEnd: string | null;
		isTrialing?: boolean;
	} | null;
};

function formatEur(amount: number): string {
	return new Intl.NumberFormat("bg-BG", {
		style: "currency",
		currency: "EUR",
		currencyDisplay: "symbol",
		maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
	}).format(amount);
}

function formatTrialEnd(iso: string | null | undefined): string | null {
	if (!iso) return null;
	try {
		return new Intl.DateTimeFormat("bg-BG", { dateStyle: "long" }).format(new Date(iso));
	} catch {
		return null;
	}
}

export function PricingPlans() {
	const [interval, setInterval] = useState<BillingInterval>("month");
	const [currentPlan, setCurrentPlan] = useState<PlanId>("free");
	const [authenticated, setAuthenticated] = useState(false);
	const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [billingReady, setBillingReady] = useState(false);
	const [trialDays, setTrialDays] = useState(7);
	const [trialEligible, setTrialEligible] = useState(false);
	const [isTrialing, setIsTrialing] = useState(false);
	const [trialEnds, setTrialEnds] = useState<string | null>(null);

	useEffect(() => {
		void (async () => {
			try {
				const res = await fetch("/api/billing/subscription", { cache: "no-store" });
				const data = (await res.json()) as SubscriptionPayload;
				if (data.plan?.id) setCurrentPlan(data.plan.id);
				setAuthenticated(Boolean(data.authenticated));
				setBillingReady(Boolean(data.billingConfigured));
				if (typeof data.trialDays === "number") setTrialDays(data.trialDays);
				setTrialEligible(Boolean(data.trialEligible));
				setIsTrialing(Boolean(data.subscription?.isTrialing));
				setTrialEnds(formatTrialEnd(data.subscription?.currentPeriodEnd));
			} catch {
				/* ignore */
			}
		})();
	}, []);

	const startCheckout = useCallback(
		async (planId: PlanId) => {
			setError(null);
			if (!billingReady) {
				setError("Stripe все още не е конфигуриран. Свържете ключовете в .env.");
				return;
			}
			if (!authenticated) {
				window.location.href = `/vhod?next=${encodeURIComponent("/ceni")}`;
				return;
			}
			setLoadingPlan(planId);
			try {
				const res = await fetch("/api/billing/checkout", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ planId, interval }),
				});
				const data = (await res.json()) as { url?: string; error?: string };
				if (!res.ok || !data.url) throw new Error(data.error ?? "Грешка при стартиране на плащането.");
				window.location.href = data.url;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Грешка.");
			} finally {
				setLoadingPlan(null);
			}
		},
		[authenticated, billingReady, interval],
	);

	const openPortal = useCallback(async () => {
		setError(null);
		setLoadingPlan("free");
		try {
			const res = await fetch("/api/billing/portal", { method: "POST" });
			const data = (await res.json()) as { url?: string; error?: string };
			if (!res.ok || !data.url) throw new Error(data.error ?? "Порталът не е наличен.");
			window.location.href = data.url;
		} catch (err) {
			setError(err instanceof Error ? err.message : "Грешка.");
		} finally {
			setLoadingPlan(null);
		}
	}, []);

	const planCards: PlanId[] = ["free", ...PAID_PLAN_IDS];

	return (
		<div className="space-y-10">
			<div className="rounded-[24px] border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 px-6 py-4 text-center text-sm font-medium text-slate-800 dark:text-slate-200 backdrop-blur-md shadow-sm">
				<span>Всички цени са в <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">EUR (€)</strong> — официалната разплащателна единица в България.</span>
				{trialDays > 0 && trialEligible ? (
					<span className="mt-1 block text-emerald-700 dark:text-emerald-300 font-semibold">
						Нови абонати получават <strong className="underline">{trialDays} дни безплатен пробен период</strong>, след което следва автоматично
						таксуване (можете да отмените по всяко време с 1 клик).
					</span>
				) : null}
				{isTrialing && trialEnds ? (
					<span className="mt-1 block font-bold text-emerald-700 dark:text-emerald-300">
						Активен пробен период до {trialEnds}.
					</span>
				) : null}
			</div>

			<div className="flex justify-center">
				<div className="inline-flex rounded-full border border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-1.5 shadow-md backdrop-blur-md gap-1">
					<button
						type="button"
						onClick={() => setInterval("month")}
						className={cn(
							"rounded-full px-6 py-2.5 text-sm font-extrabold transition-all duration-300",
							interval === "month"
								? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 scale-[1.02]"
								: "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
						)}
					>
						Месечно
					</button>
					<button
						type="button"
						onClick={() => setInterval("year")}
						className={cn(
							"rounded-full px-6 py-2.5 text-sm font-extrabold transition-all duration-300 flex items-center gap-1.5",
							interval === "year"
								? "bg-gradient-to-r from-emerald-600 via-teal-600 to-fuchsia-600 text-white shadow-md shadow-emerald-500/25 scale-[1.02]"
								: "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
						)}
					>
						<span>Годишно</span>
						<span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300 animate-pulse">−17%</span>
					</button>
				</div>
			</div>

			{error ? (
				<p className="rounded-2xl border border-rose-300/80 bg-rose-50/90 px-6 py-4 text-sm font-semibold text-rose-800 dark:border-rose-900/80 dark:bg-rose-950/60 dark:text-rose-200 shadow-sm">
					{error}
				</p>
			) : null}

			<div className="grid gap-8 lg:grid-cols-3 items-stretch">
				{planCards.map((planId) => {
					const plan = PLANS[planId];
					const price =
						interval === "year" ? plan.priceYearlyEur : plan.priceMonthlyEur;
					const isCurrent = currentPlan === planId;
					const isPaid = PAID_PLAN_IDS.includes(planId);
					const highlighted = planId === "pro";

					return (
						<div
							key={planId}
							className={cn(
								"card-hover-pro glass-panel-pro flex flex-col rounded-[32px] border p-8 transition-all duration-300 justify-between relative overflow-hidden",
								highlighted
									? "border-emerald-500/60 bg-gradient-to-b from-emerald-50/90 via-white/95 to-white/95 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.25)] dark:from-emerald-950/40 dark:via-slate-900/95 dark:to-slate-950/95 scale-[1.03] z-10"
									: "border-slate-200/90 bg-white/95 dark:border-slate-800 dark:bg-slate-900/90 hover:border-emerald-400/50",
							)}
						>
							{highlighted ? (
								<div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
							) : null}

							<div>
								<div className="mb-4 flex flex-wrap gap-2 items-center">
									{highlighted ? (
										<span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-fuchsia-600 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm">
											<span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
											<span>Препоръчан</span>
										</span>
									) : null}
									{isPaid && trialEligible && trialDays > 0 ? (
										<span className="inline-flex rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
											{trialDays} дни безплатно
										</span>
									) : null}
								</div>
								<h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
									{plan.name}
								</h2>
								<p className="mt-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{plan.tagline}</p>
								
								<div className="mt-6 flex items-baseline gap-1.5">
									<span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
										{price === 0 ? "0 €" : formatEur(price)}
									</span>
									{price > 0 ? (
										<span className="text-sm font-bold text-slate-500 dark:text-slate-400">
											/{interval === "year" ? "година" : "месец"}
										</span>
									) : null}
								</div>

								<div className="my-6 border-t border-slate-200/80 dark:border-slate-800" />

								<ul className="space-y-3.5">
									{plan.features.map((feature) => (
										<li
											key={feature}
											className="flex items-start gap-3 text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed"
										>
											<div className="mt-0.5 shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/25 p-1 text-emerald-600 dark:text-emerald-400">
												<Check size={14} strokeWidth={3} />
											</div>
											<span>{feature}</span>
										</li>
									))}
								</ul>
							</div>

							<div className="mt-8 pt-4">
								{isCurrent && isPaid ? (
									<button
										type="button"
										onClick={() => void openPortal()}
										disabled={loadingPlan !== null}
										className="w-full rounded-2xl border border-slate-300/90 bg-slate-100/80 px-5 py-3.5 text-sm font-extrabold text-slate-800 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 shadow-sm"
									>
										{loadingPlan ? (
											<Loader2 className="mx-auto h-5 w-5 animate-spin text-emerald-600" />
										) : (
											"Управление на абонамента"
										)}
									</button>
								) : isPaid ? (
									<button
										type="button"
										onClick={() => void startCheckout(planId)}
										disabled={loadingPlan !== null || isCurrent}
										className={cn(
											"w-full rounded-2xl px-5 py-4 text-base font-extrabold transition-all duration-200 shadow-md",
											highlighted
												? "bg-gradient-to-r from-emerald-600 via-teal-600 to-fuchsia-600 text-white shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]"
												: "border border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600",
										)}
									>
										{loadingPlan === planId ? (
											<Loader2 className="mx-auto h-5 w-5 animate-spin" />
										) : isCurrent ? (
											"Текущ план"
										) : trialEligible && trialDays > 0 ? (
											`Започни ${trialDays}-дневен trial`
										) : (
											"Избери този план"
										)}
									</button>
								) : (
									<Link
										href={authenticated ? "/search" : "/vhod"}
										className="block w-full rounded-2xl border border-slate-300/90 bg-slate-50/80 px-5 py-3.5 text-center text-sm font-extrabold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700 shadow-sm"
									>
										{authenticated ? "Продължи безплатно" : "Регистрация"}
									</Link>
								)}
							</div>
						</div>
					);
				})}
			</div>

			<p className="mt-10 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 leading-relaxed">
				Плащанията в EUR (€) се обработват с банково ниво на сигурност от Stripe. Можете да отмените или промените абонамента си по всяко време от клиентския портал.
				{!billingReady ? " (Stripe ключовете липсват — checkout е в тестов режим.)" : null}
			</p>
		</div>
	);
}
