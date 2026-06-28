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
				if (!res.ok || !data.url) {
					throw new Error(data.error ?? "Неуспешно стартиране на плащане.");
				}
				window.location.href = data.url;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Грешка при checkout.");
			} finally {
				setLoadingPlan(null);
			}
		},
		[authenticated, billingReady, interval],
	);

	const openPortal = useCallback(async () => {
		setError(null);
		setLoadingPlan("pro");
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
		<div>
			<div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
				Всички цени са в <strong>EUR (€)</strong> — официалната разплащателна единица в България.
				{trialDays > 0 && trialEligible ? (
					<span className="mt-1 block text-teal-800 dark:text-teal-300">
						Нови абонати: <strong>{trialDays} дни безплатен пробен период</strong>, после автоматично
						таксуване (можете да отмените по всяко време).
					</span>
				) : null}
				{isTrialing && trialEnds ? (
					<span className="mt-1 block font-medium text-teal-800 dark:text-teal-300">
						Активен пробен период до {trialEnds}.
					</span>
				) : null}
			</div>

			<div className="mb-8 flex flex-wrap items-center justify-center gap-3">
				<button
					type="button"
					onClick={() => setInterval("month")}
					className={cn(
						"rounded-full px-4 py-2 text-sm font-medium transition",
						interval === "month"
							? "bg-teal-700 text-white"
							: "border border-slate-200 text-slate-700 dark:border-slate-600 dark:text-slate-200",
					)}
				>
					Месечно
				</button>
				<button
					type="button"
					onClick={() => setInterval("year")}
					className={cn(
						"rounded-full px-4 py-2 text-sm font-medium transition",
						interval === "year"
							? "bg-teal-700 text-white"
							: "border border-slate-200 text-slate-700 dark:border-slate-600 dark:text-slate-200",
					)}
				>
					Годишно (−17%)
				</button>
			</div>

			{error ? (
				<p className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
					{error}
				</p>
			) : null}

			<div className="grid gap-6 lg:grid-cols-3">
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
								"flex flex-col rounded-2xl border p-6 sm:p-8",
								highlighted
									? "border-teal-600 bg-teal-50/40 shadow-lg dark:border-teal-500 dark:bg-teal-950/20"
									: "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40",
							)}
						>
							<div className="mb-3 flex flex-wrap gap-2">
								{highlighted ? (
									<span className="inline-flex w-fit rounded-full bg-teal-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
										Препоръчан
									</span>
								) : null}
								{isPaid && trialEligible && trialDays > 0 ? (
									<span className="inline-flex w-fit rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
										{trialDays} дни безплатно
									</span>
								) : null}
							</div>
							<h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
								{plan.name}
							</h2>
							<p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{plan.tagline}</p>
							<p className="mt-6 font-display text-4xl font-bold text-slate-950 dark:text-white">
								{price === 0 ? "0 €" : formatEur(price)}
								{price > 0 ? (
									<span className="text-base font-normal text-slate-500">
										/{interval === "year" ? "год." : "мес."}
									</span>
								) : null}
							</p>

							<ul className="mt-6 flex-1 space-y-3">
								{plan.features.map((feature) => (
									<li
										key={feature}
										className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
									>
										<Check size={16} className="mt-0.5 shrink-0 text-teal-600" />
										<span>{feature}</span>
									</li>
								))}
							</ul>

							<div className="mt-8">
								{isCurrent && isPaid ? (
									<button
										type="button"
										onClick={() => void openPortal()}
										disabled={loadingPlan !== null}
										className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-600 dark:text-slate-100"
									>
										{loadingPlan ? (
											<Loader2 className="mx-auto h-4 w-4 animate-spin" />
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
											"w-full rounded-xl px-4 py-3 text-sm font-semibold transition",
											highlighted
												? "bg-teal-700 text-white hover:bg-teal-800"
												: "border border-slate-300 text-slate-800 dark:border-slate-600 dark:text-slate-100",
										)}
									>
										{loadingPlan === planId ? (
											<Loader2 className="mx-auto h-4 w-4 animate-spin" />
										) : isCurrent ? (
											"Текущ план"
										) : trialEligible && trialDays > 0 ? (
											`Започни ${trialDays}-дневен trial`
										) : (
											"Избери план"
										)}
									</button>
								) : (
									<Link
										href={authenticated ? "/search" : "/vhod"}
										className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-800 dark:border-slate-600 dark:text-slate-100"
									>
										{authenticated ? "Продължи безплатно" : "Регистрация"}
									</Link>
								)}
							</div>
						</div>
					);
				})}
			</div>

			<p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
				Плащанията в EUR (€) се обработват от Stripe. Отменете по всяко време от клиентския портал.
				{!billingReady ? " (Stripe ключовете липсват — checkout е в тестов режим.)" : null}
			</p>
		</div>
	);
}
