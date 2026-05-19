/**
 * Директна проверка на knowledge_chunks в Supabase (чете .env.local).
 *   node scripts/check-rag-local.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
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

const url =
	process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const ragEnabled = (process.env.RAG_ENABLED || "1") !== "0";

if (!url || !key) {
	console.error("Липсват SUPABASE URL / SERVICE_ROLE_KEY в .env.local");
	process.exit(1);
}

const supabase = createClient(url, key);

const { count: total, error: e1 } = await supabase
	.from("knowledge_chunks")
	.select("*", { count: "exact", head: true });

if (e1) {
	console.error("Грешка:", e1.message);
	if (e1.message.includes("does not exist") || e1.code === "42P01") {
		console.error("→ Изпълнете supabase-rag-setup.sql в Supabase SQL Editor.");
	}
	process.exit(1);
}

const { count: embedded, error: e2 } = await supabase
	.from("knowledge_chunks")
	.select("*", { count: "exact", head: true })
	.not("embedding", "is", null);

if (e2) {
	console.error("Embedding count error:", e2.message);
	process.exit(1);
}

const bySource = {};
for (const st of ["static", "learned", "public_document", "kb_doc"]) {
	const { count } = await supabase
		.from("knowledge_chunks")
		.select("*", { count: "exact", head: true })
		.eq("source_type", st);
	if (count) bySource[st] = count;
}

const totalN = total ?? 0;
const embN = embedded ?? 0;
const healthy = ragEnabled && totalN > 0 && embN >= totalN;

console.log(
	JSON.stringify(
		{
			ragEnabled,
			totalChunks: totalN,
			withEmbedding: embN,
			withoutEmbedding: totalN - embN,
			bySourceType: bySource,
			healthy,
		},
		null,
		2,
	),
);

if (!healthy) {
	console.error(
		"\n⚠ Индексът не е готов. Пуснете: POST /api/rag/reindex body {\"target\":\"all\"} с INGEST_ADMIN_TOKEN",
	);
	process.exit(2);
}
console.log("\n✓ RAG индекс healthy (локална проверка към Supabase).");
