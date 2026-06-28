import type { PlanId } from "@/lib/billing/plans";
import { PLANS } from "@/lib/billing/plans";
import { resolveEffectivePlan } from "@/lib/billing/subscription";
import {
	checkChatUsage,
	checkDocumentReviewUsage,
	incrementChatUsage,
	incrementDocumentReviewUsage,
	type UsageCheckResult,
} from "@/lib/billing/usage";

export type BillingContext = {
	planId: PlanId;
	userId: string | null;
	email: string | null;
	isAnonymous: boolean;
	usageIdentifier: string;
};

export async function buildBillingContext(
	userId: string | null | undefined,
	email: string | null | undefined,
	ip: string,
): Promise<BillingContext> {
	const { planId } = await resolveEffectivePlan(userId, email);
	return {
		planId,
		userId: userId ?? null,
		email: email ?? null,
		isAnonymous: !userId,
		usageIdentifier: userId ?? `ip:${ip}`,
	};
}

export async function assertChatAllowed(ctx: BillingContext): Promise<UsageCheckResult> {
	return checkChatUsage(ctx.usageIdentifier, ctx.planId, ctx.isAnonymous);
}

export async function recordChatUsage(ctx: BillingContext): Promise<void> {
	if (PLANS[ctx.planId].chatDailyLimit !== null || ctx.isAnonymous) {
		await incrementChatUsage(ctx.usageIdentifier);
	}
}

export async function assertDocumentReviewAllowed(
	ctx: BillingContext,
): Promise<UsageCheckResult & { requiresAuth: boolean }> {
	if (!ctx.userId) {
		return {
			allowed: false,
			used: 0,
			limit: 0,
			resetsAt: new Date().toISOString(),
			requiresAuth: true,
		};
	}
	const usage = await checkDocumentReviewUsage(ctx.userId, ctx.planId);
	return { ...usage, requiresAuth: false };
}

export async function recordDocumentReviewUsage(ctx: BillingContext): Promise<void> {
	if (!ctx.userId) return;
	await incrementDocumentReviewUsage(ctx.userId);
}

export function upgradeMessageForChat(ctx: BillingContext): string {
	if (ctx.isAnonymous) {
		return "Достигнахте дневния лимит за безплатни AI въпроси. Регистрирайте се за повече или изберете план Про.";
	}
	return "Достигнахте дневния лимит за безплатен план. Надградете до Про за неограничен AI чат.";
}

export function upgradeMessageForDocumentReview(ctx: BillingContext): string {
	if (!ctx.userId) {
		return "AI преглед на документи изисква регистрация и платен план.";
	}
	if (ctx.planId === "free") {
		return "AI преглед е част от плановете Про и Стопанство. Изберете абонамент на /ceni.";
	}
	return "Достигнахте месечния лимит за AI прегледи. Надградете до Стопанство за неограничен достъп.";
}
