#!/usr/bin/env node

/**
 * Stripe setup script за AgriNexus.Law
 *
 * 1. Създава продукти: Pro (€14.90/мес, €149/год) и Стопанство (€34.90/мес, €349/год)
 * 2. Създава recurring prices в EUR
 * 3. Извежда .env конфигурация за копиране
 *
 * Употреба:
 *   node scripts/setup-stripe.mjs sk_test_xxxxxxxxx
 *
 * Изисква: stripe (npm) — вече е в package.json
 */

import Stripe from "stripe";

const PRODUCTS = [
  {
    id: "pro",
    name: "AgriNexus Pro",
    description: "За активен фермер — неограничен AI чат, GIS парцели, склад, счетоводство, ДДС",
    prices: [
      { interval: "month", amount: 1490, label: "Pro Monthly (€14.90)" },
      { interval: "year", amount: 14900, label: "Pro Yearly (€149)" },
    ],
  },
  {
    id: "stopyanstvo",
    name: "AgriNexus Стопанство",
    description: "За по-големи стопанства — всичко от Pro + неограничени AI прегледи, ТРЗ, Open Banking",
    prices: [
      { interval: "month", amount: 3490, label: "Стопанство Monthly (€34.90)" },
      { interval: "year", amount: 34900, label: "Стопанство Yearly (€349)" },
    ],
  },
];

async function main() {
  const secretKey = process.argv[2];
  if (!secretKey || !secretKey.startsWith("sk_")) {
    console.error("❌ Моля, подайте валиден Stripe Secret Key:");
    console.error("   node scripts/setup-stripe.mjs sk_test_xxxxxxxxxxxxxx");
    console.error("");
    console.error("💡 Къде да го вземете:");
    console.error("   1. Отидете на https://dashboard.stripe.com/register");
    console.error("   2. Регистрирайте се (безплатно, 2 минути)");
    console.error("   3. От Dashboard → Developers → API Keys");
    console.error("   4. Копирайте 'Secret key' (sk_test_...)");
    console.error("   5. Пуснете скрипта отново с този ключ");
    process.exit(1);
  }

  const stripe = new Stripe(secretKey);
  const isLive = secretKey.startsWith("sk_live_");
  const mode = isLive ? "🔴 LIVE" : "🟡 TEST";
  console.log(`\n  ${mode} режим — свързан със Stripe\n`);

  const results = [];

  for (const product of PRODUCTS) {
    console.log(`  ➤ Създаване на продукт "${product.name}"...`);

    const prod = await stripe.products.create({
      name: product.name,
      description: product.description,
      metadata: { plan_id: product.id },
    });

    console.log(`    ✅ Продукт създаден: ${prod.id}`);

    for (const price of product.prices) {
      const p = await stripe.prices.create({
        product: prod.id,
        currency: "eur",
        unit_amount: price.amount,
        recurring: { interval: price.interval },
        metadata: { plan_id: product.id },
      });

      console.log(`    ✅ ${price.label}: ${p.id}`);
      results.push({
        plan: product.id,
        interval: price.interval,
        priceId: p.id,
      });
    }
  }

  console.log("\n  ─────────────────────────────────────────");
  console.log("  ✅ Всички продукти и цени са създадени!\n");

  const proMonthly = results.find((r) => r.plan === "pro" && r.interval === "month")?.priceId;
  const proYearly = results.find((r) => r.plan === "pro" && r.interval === "year")?.priceId;
  const stopyanstvoMonthly = results.find((r) => r.plan === "stopyanstvo" && r.interval === "month")?.priceId;
  const stopyanstvoYearly = results.find((r) => r.plan === "stopyanstvo" && r.interval === "year")?.priceId;

  const webhookUrl = isLive
    ? "https://www.agrinexuslaw.com/api/billing/webhook"
    : "https://www.agrinexuslaw.com/api/billing/webhook  (или http://localhost:3002/api/billing/webhook за локално тестване)";

  console.log("  ─── Копирай това в .env ───\n");
  console.log(`STRIPE_SECRET_KEY=${secretKey}`);
  console.log(`STRIPE_PRICE_PRO_MONTHLY=${proMonthly}`);
  console.log(`STRIPE_PRICE_PRO_YEARLY=${proYearly}`);
  console.log(`STRIPE_PRICE_STOPYANSTVO_MONTHLY=${stopyanstvoMonthly}`);
  console.log(`STRIPE_PRICE_STOPYANSTVO_YEARLY=${stopyanstvoYearly}`);
  console.log(`STRIPE_WEBHOOK_SECRET=  # ще го получиш от Stripe Dashboard след създаване на webhook`);

  console.log("\n  ─── Следващи стъпки ───\n");
  console.log(`  1. Добави горните редове в .env (или във Vercel Environment Variables)`);
  console.log(`  2. Настрой Stripe Webhook:`);
  console.log(`     - Отиди в https://dashboard.stripe.com/webhooks`);
  console.log(`     - Click "Add endpoint" → URL: ${webhookUrl}`);
  console.log(`     - Events: checkout.session.completed, customer.subscription.*, invoice.payment_failed`);
  console.log(`     - След създаване, копирай "Signing secret" (whsec_...) в STRIPE_WEBHOOK_SECRET`);
  console.log(`  3. Рестартирай dev сървъра`);
  console.log(`  4. Тествай checkout на /ceni\n`);
}

main().catch((err) => {
  console.error("\n❌ Грешка:", err.message);
  process.exit(1);
});
