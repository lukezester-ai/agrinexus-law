import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/billing/auth";
import type { PlanId } from "@/lib/billing/plans";
import { PLANS } from "@/lib/billing/plans";

export type SubscriptionStatus =
	| "inactive"
	| "active"
	| "trialing"
	| "past_due"
	| "canceled";

export type UserSubscription = {
	userId: string;
	planId: PlanId;
	status: SubscriptionStatus;
	stripeCustomerId: string | null;
	stripeSubscriptionId: string | null;
	currentPeriodEnd: string | null;
	trialUsed: boolean;
};

type SubscriptionRow = {
	user_id: string;
	plan_id: string;
	status: string;
	stripe_customer_id: string | null;
	stripe_subscription_id: string | null;
	current_period_end: string | null;
	trial_used?: boolean | null;
};

function rowToSubscription(row: SubscriptionRow): UserSubscription {
	const planId = row.plan_id in PLANS ? (row.plan_id as PlanId) : "free";
	return {
		userId: row.user_id,
		planId,
		status: (row.status as SubscriptionStatus) || "inactive",
		stripeCustomerId: row.stripe_customer_id,
		stripeSubscriptionId: row.stripe_subscription_id,
		currentPeriodEnd: row.current_period_end,
		trialUsed: Boolean(row.trial_used),
	};
}

/** Един пробен период на акаунт — само ако никога не е имал абонамент. */
export function isTrialEligible(sub: UserSubscription): boolean {
	return !sub.trialUsed && !sub.stripeSubscriptionId;
}

export function isActiveSubscription(sub: UserSubscription): boolean {
	return (
		sub.planId !== "free" &&
		(sub.status === "active" || sub.status === "trialing" || sub.status === "past_due")
	);
}

export async function getUserSubscription(userId: string): Promise<UserSubscription> {
	const supabase = getSupabaseAdmin();
	if (!supabase) {
		return {
			userId,
			planId: "free",
			status: "inactive",
			stripeCustomerId: null,
			stripeSubscriptionId: null,
			currentPeriodEnd: null,
			trialUsed: false,
		};
	}

	const { data, error } = await supabase
		.from("user_subscriptions")
		.select(
			"user_id,plan_id,status,stripe_customer_id,stripe_subscription_id,current_period_end,trial_used",
		)
		.eq("user_id", userId)
		.maybeSingle();

	if (error || !data) {
		return {
			userId,
			planId: "free",
			status: "inactive",
			stripeCustomerId: null,
			stripeSubscriptionId: null,
			currentPeriodEnd: null,
			trialUsed: false,
		};
	}

	return rowToSubscription(data as SubscriptionRow);
}

export async function resolveEffectivePlan(
	userId: string | null | undefined,
	email: string | null | undefined,
): Promise<{ planId: PlanId; subscription: UserSubscription | null }> {
	if (email && isAdminEmail(email)) {
		return { planId: "stopyanstvo", subscription: null };
	}
	if (!userId) {
		return { planId: "free", subscription: null };
	}
	const subscription = await getUserSubscription(userId);
	if (isActiveSubscription(subscription)) {
		return { planId: subscription.planId, subscription };
	}
	return { planId: "free", subscription };
}

export async function upsertUserSubscription(
	userId: string,
	patch: Partial<Omit<UserSubscription, "userId">>,
): Promise<void> {
	const supabase = getSupabaseAdmin();
	if (!supabase) return;

	await supabase.from("user_subscriptions").upsert(
		{
			user_id: userId,
			plan_id: patch.planId ?? "free",
			status: patch.status ?? "inactive",
			stripe_customer_id: patch.stripeCustomerId ?? null,
			stripe_subscription_id: patch.stripeSubscriptionId ?? null,
			current_period_end: patch.currentPeriodEnd ?? null,
			...(patch.trialUsed !== undefined ? { trial_used: patch.trialUsed } : {}),
			updated_at: new Date().toISOString(),
		},
		{ onConflict: "user_id" },
	);
}

export async function getUserIdByStripeCustomerId(
	customerId: string,
): Promise<string | null> {
	const supabase = getSupabaseAdmin();
	if (!supabase) return null;
	const { data } = await supabase
		.from("user_subscriptions")
		.select("user_id")
		.eq("stripe_customer_id", customerId)
		.maybeSingle();
	return (data?.user_id as string | undefined) ?? null;
}
