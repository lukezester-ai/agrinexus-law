import { getSessionUser } from "@/lib/billing/auth";
import {
	BILLING_CURRENCY,
	BILLING_TRIAL_DAYS,
	isBillingConfigured,
	PLANS,
} from "@/lib/billing/plans";
import {
	getUserSubscription,
	isTrialEligible,
	resolveEffectivePlan,
} from "@/lib/billing/subscription";
import {
	checkChatUsage,
	checkDocumentReviewUsage,
} from "@/lib/billing/usage";

export async function GET() {
	const user = await getSessionUser();
	const { planId, subscription } = await resolveEffectivePlan(
		user?.id,
		user?.email,
	);

	const isAnonymous = !user;
	const chatUsage = await checkChatUsage(
		user?.id ?? "anonymous",
		planId,
		isAnonymous,
	);

	let documentReviewUsage = null;
	let trialEligible = false;
	if (user) {
		documentReviewUsage = await checkDocumentReviewUsage(user.id, planId);
		const row = await getUserSubscription(user.id);
		trialEligible = isTrialEligible(row);
	}

	return Response.json({
		ok: true,
		billingConfigured: isBillingConfigured(),
		currency: BILLING_CURRENCY,
		trialDays: BILLING_TRIAL_DAYS,
		trialEligible,
		authenticated: Boolean(user),
		plan: {
			id: planId,
			name: PLANS[planId].name,
			tagline: PLANS[planId].tagline,
		},
		subscription: subscription
			? {
					status: subscription.status,
					currentPeriodEnd: subscription.currentPeriodEnd,
					isTrialing: subscription.status === "trialing",
				}
			: null,
		usage: {
			chat: chatUsage,
			documentReview: documentReviewUsage,
		},
	});
}
