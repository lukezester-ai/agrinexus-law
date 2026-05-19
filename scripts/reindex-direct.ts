/**
 * RAG reindex директно (без dev сървър на :3002).
 * Чете .env.local и вика lib/rag/reindex.
 *
 *   npm run reindex:direct
 *   npm run reindex:direct -- static
 *   npm run reindex:direct -- learned
 */
import { readFileSync, existsSync } from "node:fs";
import { isRagEnabled } from "../lib/rag/config";
import {
	reindexAll,
	reindexLearned,
	reindexPublicDocuments,
	reindexStatic,
	type ReindexStats,
} from "../lib/rag/reindex";

function loadEnvFile(path: string) {
	if (!existsSync(path)) return;
	for (const line of readFileSync(path, "utf8").split("\n")) {
		const t = line.trim();
		if (!t || t.startsWith("#")) continue;
		const eq = t.indexOf("=");
		if (eq < 1) continue;
		const key = t.slice(0, eq).trim();
		let val = t.slice(eq + 1).trim();
		if (
			(val.startsWith('"') && val.endsWith('"')) ||
			(val.startsWith("'") && val.endsWith("'"))
		) {
			val = val.slice(1, -1);
		}
		if (!process.env[key]) process.env[key] = val;
	}
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const target = (process.argv[2] || "all").trim();

function summarize(results: ReindexStats[]) {
	const created = results.reduce((s, r) => s + (r.chunksCreated ?? 0), 0);
	const skipped = results.reduce((s, r) => s + (r.chunksSkipped ?? 0), 0);
	const failed = results.reduce((s, r) => s + (r.chunksFailed ?? 0), 0);
	return { created, skipped, failed };
}

async function main() {
	if (!isRagEnabled()) {
		console.error(
			"RAG не е активиран. Нужни OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, RAG_ENABLED=1 в .env.local",
		);
		process.exit(1);
	}

	console.log(`Reindex direct, target=${target}\n`);

	let results: ReindexStats[];
	switch (target) {
		case "static":
			results = [await reindexStatic()];
			break;
		case "learned":
			results = [await reindexLearned()];
			break;
		case "public_documents":
			results = [await reindexPublicDocuments()];
			break;
		case "all":
			results = await reindexAll();
			break;
		default:
			console.error(`Неизвестен target: ${target}. Ползвай: all | static | learned | public_documents`);
			process.exit(1);
	}

	console.log(JSON.stringify({ ok: true, target, results }, null, 2));
	const { created, skipped, failed } = summarize(results);
	console.log(`\n✓ Готово: +${created} chunks, пропуснати ${skipped}, грешки ${failed}.`);
	console.log("Проверка: npm run check:rag:local");

	for (const r of results) {
		for (const e of r.errors ?? []) console.error("!", e);
	}
	if (failed > 0) process.exit(1);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
