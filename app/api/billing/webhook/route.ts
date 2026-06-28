import Stripe from "stripe";
import { planFromStripePriceId } from "@/lib/billing/plans";
import { getStripe } from "@/lib/billing/stripe";
import {
	getUserIdByStripeCustomerId,
	upsertUserSubscription,
	type SubscriptionStatus,
} from "@/lib/billing/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
	switch (status) {
		case "active":
			return "active";
		case "trialing":
			return "trialing";
		case "past_due":
			return "past_due";
		case "canceled":
		case "unpaid":
		case "incomplete_expired":
			return "canceled";
		default:
			return "inactive";
	}
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription): string | null {
	const end = (subscription as Stripe.Subscription & { current_period_end?: number })
		.current_period_end;
	return typeof end === "number" ? new Date(end * 1000).toISOString() : null;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
	const sub = (invoice as Stripe.Invoice & {
		subscription?: string | Stripe.Subscription | null;
	}).subscription;
	if (!sub) return null;
	return typeof sub === "string" ? sub : sub.id;
}

async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
	const customerId =
		typeof subscription.customer === "string"
			? subscription.customer
			: subscription.customer.id;

	const userId =
		subscription.metadata.supabase_user_id ||
		(await getUserIdByStripeCustomerId(customerId));

	if (!userId) {
		console.warn("[billing/webhook] missing user for subscription", subscription.id);
		return;
	}

	const priceId = subscription.items.data[0]?.price?.id;
	const planId =
		planFromStripePriceId(priceId) ||
		(subscription.metadata.plan_id as "pro" | "stopyanstvo" | undefined) ||
		"free";

	const status = mapStripeStatus(subscription.status);
	const active = status === "active" || status === "trialing" || status === "past_due";

	await upsertUserSubscription(userId, {
		planId: active ? planId : "free",
		status,
		stripeCustomerId: customerId,
		stripeSubscriptionId: subscription.id,
		currentPeriodEnd: subscriptionPeriodEnd(subscription),
		...(status === "trialing" ? { trialUsed: true } : {}),
	});
}

export async function POST(req: Request) {
	const stripe = getStripe();
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

	if (!stripe || !webhookSecret) {
		return Response.json({ error: "Webhook not configured." }, { status: 503 });
	}

	const signature = req.headers.get("stripe-signature");
	if (!signature) {
		return Response.json({ error: "Missing signature." }, { status: 400 });
	}

	let event: Stripe.Event;
	try {
		const body = await req.text();
		event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
	} catch (err) {
		console.error("[billing/webhook] signature", err);
		return Response.json({ error: "Invalid signature." }, { status: 400 });
	}

	try {
		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object as Stripe.Checkout.Session;
				if (session.mode === "subscription" && session.subscription) {
					const subId =
						typeof session.subscription === "string"
							? session.subscription
							: session.subscription.id;
					const subscription = await stripe.subscriptions.retrieve(subId);
					await syncSubscription(subscription);
				}
				break;
			}
			case "customer.subscription.created":
			case "customer.subscription.updated": {
				await syncSubscription(event.data.object as Stripe.Subscription);
				break;
			}
			case "customer.subscription.deleted": {
				const subscription = event.data.object as Stripe.Subscription;
				const customerId =
					typeof subscription.customer === "string"
						? subscription.customer
						: subscription.customer.id;
				const userId =
					subscription.metadata.supabase_user_id ||
					(await getUserIdByStripeCustomerId(customerId));
				if (userId) {
					await upsertUserSubscription(userId, {
						planId: "free",
						status: "canceled",
						stripeCustomerId: customerId,
						stripeSubscriptionId: null,
						currentPeriodEnd: null,
					});
				}
				break;
			}
			case "invoice.payment_failed": {
				const invoice = event.data.object as Stripe.Invoice;
				const subId = invoiceSubscriptionId(invoice);
				if (subId) {
					const subscription = await stripe.subscriptions.retrieve(subId);
					await syncSubscription(subscription);
				}
				break;
			}
			default:
				break;
		}
	} catch (err) {
		console.error("[billing/webhook] handler", event.type, err);
		return Response.json({ error: "Webhook handler failed." }, { status: 500 });
	}

	return Response.json({ received: true });
}
