/**
 * Проверка на production env преди Stripe / cron deploy.
 * npx tsx scripts/check-production-env.ts
 */

function has(name: string): boolean {
	const v = process.env[name];
	return Boolean(v?.trim() && !/^(change-me|your_|sk_test_\.\.\.|price_\.\.\.|whsec_\.\.\.)/i.test(v.trim()));
}

type Check = { name: string; ok: boolean; hint?: string };

const checks: Check[] = [
	{ name: "NEXT_PUBLIC_SITE_URL", ok: has("NEXT_PUBLIC_SITE_URL"), hint: "https://www.agrinexuslaw.com" },
	{ name: "NEXT_PUBLIC_SUPABASE_URL", ok: has("NEXT_PUBLIC_SUPABASE_URL") },
	{ name: "SUPABASE_SERVICE_ROLE_KEY", ok: has("SUPABASE_SERVICE_ROLE_KEY") },
	{ name: "OPENAI_API_KEY", ok: has("OPENAI_API_KEY") },
	{
		name: "UPSTASH_REDIS (billing limits)",
		ok: has("UPSTASH_REDIS_REST_URL") && has("UPSTASH_REDIS_REST_TOKEN"),
		hint: "Без Redis лимитите за чат/review не се броят стриктно",
	},
	{ name: "STRIPE_SECRET_KEY", ok: has("STRIPE_SECRET_KEY") },
	{ name: "STRIPE_WEBHOOK_SECRET", ok: has("STRIPE_WEBHOOK_SECRET") },
	{ name: "STRIPE_PRICE_PRO_MONTHLY", ok: has("STRIPE_PRICE_PRO_MONTHLY") },
	{ name: "STRIPE_PRICE_PRO_YEARLY", ok: has("STRIPE_PRICE_PRO_YEARLY") },
	{ name: "STRIPE_PRICE_STOPYANSTVO_MONTHLY", ok: has("STRIPE_PRICE_STOPYANSTVO_MONTHLY") },
	{ name: "STRIPE_PRICE_STOPYANSTVO_YEARLY", ok: has("STRIPE_PRICE_STOPYANSTVO_YEARLY") },
	{ name: "CRON_SECRET (Vercel cron)", ok: has("CRON_SECRET"), hint: "openssl rand -hex 32" },
	{ name: "INGEST_ADMIN_TOKEN", ok: has("INGEST_ADMIN_TOKEN") },
];

console.log("\n=== AgriNexus production env check ===\n");

let failed = 0;
for (const c of checks) {
	const mark = c.ok ? "✓" : "✗";
	if (!c.ok) failed++;
	console.log(`${mark} ${c.name}${c.hint && !c.ok ? ` — ${c.hint}` : ""}`);
}

const billingReady = checks
	.filter((c) => c.name.startsWith("STRIPE"))
	.every((c) => c.ok);
const cronReady = has("CRON_SECRET");

console.log("\n--- Summary ---");
console.log(`Billing live ready: ${billingReady ? "YES" : "NO"}`);
console.log(`Vercel agents cron ready: ${cronReady ? "YES" : "NO"}`);
console.log(`Missing / weak: ${failed}\n`);

process.exit(failed > 0 ? 1 : 0);
