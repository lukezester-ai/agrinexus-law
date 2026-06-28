import { getSessionUser } from "@/lib/billing/auth";
import { isBillingConfigured } from "@/lib/billing/plans";
import { billingSiteUrl, getStripe } from "@/lib/billing/stripe";
import { getUserSubscription } from "@/lib/billing/subscription";

export async function POST() {
	if (!isBillingConfigured()) {
		return Response.json({ error: "Stripe не е конфигуриран." }, { status: 503 });
	}

	const user = await getSessionUser();
	if (!user) {
		return Response.json({ error: "Не сте влезли." }, { status: 401 });
	}

	const sub = await getUserSubscription(user.id);
	if (!sub.stripeCustomerId) {
		return Response.json(
			{ error: "Няма активен Stripe клиент. Първо изберете план." },
			{ status: 400 },
		);
	}

	const stripe = getStripe();
	if (!stripe) {
		return Response.json({ error: "Stripe не е наличен." }, { status: 503 });
	}

	const portal = await stripe.billingPortal.sessions.create({
		customer: sub.stripeCustomerId,
		return_url: `${billingSiteUrl()}/ceni`,
	});

	return Response.json({ ok: true, url: portal.url });
}
