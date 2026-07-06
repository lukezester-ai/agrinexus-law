import { getUpstashRedis } from "@/lib/utils/rate-limit";
import type { PlanId } from "@/lib/billing/plans";
import { PLANS } from "@/lib/billing/plans";

function dayKey(): string {
	return new Date().toISOString().slice(0, 10);
}

function monthKey(): string {
	return new Date().toISOString().slice(0, 7);
}

export type UsageCheckResult = {
	allowed: boolean;
	used: number;
	limit: number | null;
	resetsAt: string;
};

export async function checkChatUsage(
	identifier: string,
	planId: PlanId,
	isAnonymous: boolean,
): Promise<UsageCheckResult> {
	const plan = PLANS[planId];
	const limit = isAnonymous ? plan.chatDailyLimitAnonymous : plan.chatDailyLimit;
	const redis = getUpstashRedis();
	const key = `billing:chat:${identifier}:${dayKey()}`;
	const tomorrow = new Date();
	tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
	tomorrow.setUTCHours(0, 0, 0, 0);

	if (limit === null) {
		return { allowed: true, used: 0, limit: null, resetsAt: tomorrow.toISOString() };
	}

	let used = 0;
	if (redis) {
		const raw = await redis.get<number>(key);
		used = typeof raw === "number" ? raw : Number(raw ?? 0);
	}

	if (used >= limit) {
		return { allowed: false, used, limit, resetsAt: tomorrow.toISOString() };
	}

	return { allowed: true, used, limit, resetsAt: tomorrow.toISOString() };
}

export async function incrementChatUsage(identifier: string): Promise<void> {
	const redis = getUpstashRedis();
	if (!redis) return;
	const key = `billing:chat:${identifier}:${dayKey()}`;
	try {
		await redis.incr(key);
		await redis.expire(key, 60 * 60 * 48);
	} catch (err) {
		console.error("[usage] incr failed (non‑critical):", err instanceof Error ? err.message : String(err));
	}
}

export async function checkDocumentReviewUsage(
	userId: string,
	planId: PlanId,
): Promise<UsageCheckResult> {
	const plan = PLANS[planId];
	const limit = plan.documentReviewMonthly;
	const nextMonth = new Date();
	nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1, 1);
	nextMonth.setUTCHours(0, 0, 0, 0);

	if (limit === null) {
		return { allowed: true, used: 0, limit: null, resetsAt: nextMonth.toISOString() };
	}
	if (limit === 0) {
		return { allowed: false, used: 0, limit: 0, resetsAt: nextMonth.toISOString() };
	}

	const redis = getUpstashRedis();
	const key = `billing:review:${userId}:${monthKey()}`;
	let used = 0;
	if (redis) {
		const raw = await redis.get<number>(key);
		used = typeof raw === "number" ? raw : Number(raw ?? 0);
	}

	if (used >= limit) {
		return { allowed: false, used, limit, resetsAt: nextMonth.toISOString() };
	}

	return { allowed: true, used, limit, resetsAt: nextMonth.toISOString() };
}

export async function incrementDocumentReviewUsage(userId: string): Promise<void> {
	const redis = getUpstashRedis();
	if (!redis) return;
	const key = `billing:review:${userId}:${monthKey()}`;
	try {
		await redis.incr(key);
		await redis.expire(key, 60 * 60 * 24 * 45);
	} catch (err) {
		console.error("[usage] incr failed (non‑critical):", err instanceof Error ? err.message : String(err));
	}
}
