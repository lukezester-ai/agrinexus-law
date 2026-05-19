/**
 * Проверка на Supabase RAG индекс (локално или production URL).
 *
 *   node scripts/check-rag-index.mjs
 *   node scripts/check-rag-index.mjs https://www.agrinexuslaw.com
 */
const base =
	process.argv[2]?.trim().replace(/\/$/, "") ||
	process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "") ||
	"http://127.0.0.1:3002";

const url = `${base}/api/health`;

async function main() {
	console.log(`GET ${url}\n`);
	const res = await fetch(url, { headers: { Accept: "application/json" } });
	const body = await res.json().catch(() => ({}));
	console.log(JSON.stringify(body, null, 2));
	if (!res.ok || !body.ok) {
		process.exit(1);
	}
	const rag = body.rag;
	if (!rag) {
		console.error(
			"\n⚠ /api/health няма поле rag — deploy-нете последната версия, после npm run check:rag:prod",
		);
		console.error("   За директна проверка: npm run check:rag:local");
		process.exit(2);
	}
	if (!rag.healthy) {
		console.error("\n⚠ RAG индексът НЕ е healthy. hints:", rag.hints?.join(" | ") || "—");
		process.exit(2);
	}
	console.log("\n✓ RAG индекс healthy.");
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
