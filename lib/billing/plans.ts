export type PlanId = "free" | "pro" | "stopyanstvo";

export type BillingInterval = "month" | "year";

/** Разплащателна единица — EUR (официална валута в България от 2026). */
export const BILLING_CURRENCY = "EUR" as const;

/** Пробен период за нови абонати (дни). Override: BILLING_TRIAL_DAYS в .env */
export const BILLING_TRIAL_DAYS = Math.max(
	0,
	Number.parseInt(process.env.BILLING_TRIAL_DAYS ?? "7", 10) || 7,
);

export type PlanDefinition = {
	id: PlanId;
	name: string;
	tagline: string;
	priceMonthlyEur: number;
	priceYearlyEur: number;
	features: string[];
	chatDailyLimit: number | null;
	chatDailyLimitAnonymous: number;
	documentReviewMonthly: number | null;
	prioritySupport: boolean;
};

export const PLANS: Record<PlanId, PlanDefinition> = {
	free: {
		id: "free",
		name: "Безплатен",
		tagline: "Търсене и базов достъп",
		priceMonthlyEur: 0,
		priceYearlyEur: 0,
		features: [
			"Търсене в архива и документи",
			"До 5 AI въпроса на ден (без акаунт)",
			"До 15 AI въпроса на ден с регистрация",
			"Срокове и калкулатори",
		],
		chatDailyLimit: 15,
		chatDailyLimitAnonymous: 5,
		documentReviewMonthly: 0,
		prioritySupport: false,
	},
	pro: {
		id: "pro",
		name: "Про",
		tagline: "За активен фермер",
		priceMonthlyEur: 19.9,
		priceYearlyEur: 199,
		features: [
			"7 дни безплатен пробен период",
			"Неограничен AI чат с RAG",
			"10 AI прегледа на документи / месец",
			"Изтегляне от държавния архив",
		],
		chatDailyLimit: null,
		chatDailyLimitAnonymous: 0,
		documentReviewMonthly: 10,
		prioritySupport: false,
	},
	stopyanstvo: {
		id: "stopyanstvo",
		name: "Стопанство",
		tagline: "За по-големи стопанства и екипи",
		priceMonthlyEur: 49,
		priceYearlyEur: 490,
		features: [
			"7 дни безплатен пробен период",
			"Всичко от Про",
			"Неограничени AI прегледи на договори",
			"Приоритет и поддръжка по имейл",
		],
		chatDailyLimit: null,
		chatDailyLimitAnonymous: 0,
		documentReviewMonthly: null,
		prioritySupport: true,
	},
};

export const PAID_PLAN_IDS: PlanId[] = ["pro", "stopyanstvo"];

export function planFromStripePriceId(priceId: string | null | undefined): PlanId | null {
	if (!priceId) return null;
	const map: Record<string, PlanId> = {};
	const entries: [string | undefined, PlanId][] = [
		[process.env.STRIPE_PRICE_PRO_MONTHLY?.trim(), "pro"],
		[process.env.STRIPE_PRICE_PRO_YEARLY?.trim(), "pro"],
		[process.env.STRIPE_PRICE_STOPYANSTVO_MONTHLY?.trim(), "stopyanstvo"],
		[process.env.STRIPE_PRICE_STOPYANSTVO_YEARLY?.trim(), "stopyanstvo"],
	];
	for (const [envPrice, plan] of entries) {
		if (envPrice) map[envPrice] = plan;
	}
	return map[priceId] ?? null;
}

export function stripePriceIdForPlan(planId: PlanId, interval: BillingInterval): string | null {
	if (planId === "free") return null;
	const key =
		planId === "pro"
			? interval === "year"
				? "STRIPE_PRICE_PRO_YEARLY"
				: "STRIPE_PRICE_PRO_MONTHLY"
			: interval === "year"
				? "STRIPE_PRICE_STOPYANSTVO_YEARLY"
				: "STRIPE_PRICE_STOPYANSTVO_MONTHLY";
	return process.env[key]?.trim() || null;
}

export function isBillingConfigured(): boolean {
	return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}
