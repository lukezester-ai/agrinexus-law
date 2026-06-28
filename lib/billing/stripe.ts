import Stripe from "stripe";
import { isBillingConfigured } from "@/lib/billing/plans";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
	if (!isBillingConfigured()) return null;
	if (!stripeClient) {
		stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!.trim());
	}
	return stripeClient;
}

export function billingSiteUrl(): string {
	return (
		process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
		"http://localhost:3000"
	);
}
