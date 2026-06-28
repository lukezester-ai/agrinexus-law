import { getSessionUser } from "@/lib/billing/auth";
import type { BillingInterval } from "@/lib/billing/plans";
import {
	BILLING_TRIAL_DAYS,
	isBillingConfigured,
	PAID_PLAN_IDS,
	stripePriceIdForPlan,
	type PlanId,
} from "@/lib/billing/plans";
import { billingSiteUrl, getStripe } from "@/lib/billing/stripe";
import {
	getUserSubscription,
	isTrialEligible,
	upsertUserSubscription,
} from "@/lib/billing/subscription";

export async function POST(req: Request) {
	if (!isBillingConfigured()) {
		return Response.json(
			{ error: "Плащанията все още не са конфигурирани. Свържете Stripe в .env." },
			{ status: 503 },
		);
	}

	const user = await getSessionUser();
	if (!user?.email) {
		return Response.json({ error: "Влезте в акаунта си, за да абонирате." }, { status: 401 });
	}

	let body: { planId?: PlanId; interval?: BillingInterval };
	try {
		body = (await req.json()) as typeof body;
	} catch {
		return Response.json({ error: "Невалидно JSON." }, { status: 400 });
	}

	const planId = body.planId;
	const interval: BillingInterval = body.interval === "year" ? "year" : "month";

	if (!planId || !PAID_PLAN_IDS.includes(planId)) {
		return Response.json({ error: "Невалиден план." }, { status: 400 });
	}

	const priceId = stripePriceIdForPlan(planId, interval);
	if (!priceId) {
		return Response.json(
			{ error: `Липсва Stripe price ID за ${planId} (${interval}).` },
			{ status: 503 },
		);
	}

	const stripe = getStripe();
	if (!stripe) {
		return Response.json({ error: "Stripe не е наличен." }, { status: 503 });
	}

	const existing = await getUserSubscription(user.id);
	let customerId = existing.stripeCustomerId;

	if (!customerId) {
		const customer = await stripe.customers.create({
			email: user.email,
			metadata: { supabase_user_id: user.id },
		});
		customerId = customer.id;
		await upsertUserSubscription(user.id, {
			stripeCustomerId: customerId,
			planId: existing.planId,
			status: existing.status,
		});
	}

	const site = billingSiteUrl();
	const withTrial = isTrialEligible(existing) && BILLING_TRIAL_DAYS > 0;

	const session = await stripe.checkout.sessions.create({
		mode: "subscription",
		customer: customerId,
		line_items: [{ price: priceId, quantity: 1 }],
		success_url: `${site}/ceni?success=1${withTrial ? "&trial=1" : ""}`,
		cancel_url: `${site}/ceni?canceled=1`,
		client_reference_id: user.id,
		metadata: {
			supabase_user_id: user.id,
			plan_id: planId,
			trial_days: withTrial ? String(BILLING_TRIAL_DAYS) : "0",
		},
		subscription_data: {
			metadata: {
				supabase_user_id: user.id,
				plan_id: planId,
			},
			...(withTrial ? { trial_period_days: BILLING_TRIAL_DAYS } : {}),
		},
		allow_promotion_codes: true,
		billing_address_collection: "auto",
	});

	return Response.json({
		ok: true,
		url: session.url,
		trialDays: withTrial ? BILLING_TRIAL_DAYS : 0,
	});
}
