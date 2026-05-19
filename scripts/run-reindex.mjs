/**
 * RAG reindex чрез POST /api/rag/reindex (чете INGEST_ADMIN_TOKEN от .env.local).
 *
 *   npm run reindex              # localhost:3002, target=all
 *   npm run reindex:static       # само статичната knowledge база
 *   npm run reindex:prod         # production agrinexuslaw.com
 *
 *   node scripts/run-reindex.mjs [baseUrl] [target]
 *   node scripts/run-reindex.mjs http://localhost:3002 public_doc_content
 */
import { readFileSync, existsSync } from "node:fs";

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

const VALID_TARGETS = new Set([
	"all",
	"static",
	"learned",
	"public_documents",
	"public_doc_content",
]);

const args = process.argv.slice(2);
let baseUrl =
	process.env.REINDEX_BASE_URL?.trim() ||
	process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
	"http://localhost:3002";
let target = "all";

for (const arg of args) {
	if (arg.startsWith("http://") || arg.startsWith("https://")) {
		baseUrl = arg.replace(/\/$/, "");
	} else if (VALID_TARGETS.has(arg)) {
		target = arg;
	} else {
		console.error(`Неизвестен аргумент: ${arg}`);
		console.error(`Таргети: ${[...VALID_TARGETS].join(", ")}`);
		process.exit(1);
	}
}

const token = process.env.INGEST_ADMIN_TOKEN?.trim();
if (!token || /^change-me/i.test(token)) {
	console.error(
		"Задайте INGEST_ADMIN_TOKEN в .env.local (не примерната стойност change-me-ingest-token).",
	);
	process.exit(1);
}

const url = `${baseUrl}/api/rag/reindex`;
const body = { target };

console.log(`POST ${url}`);
console.log(`target: ${target}\n`);

let res;
try {
	res = await fetch(url, {
		method: "POST",
		headers: {
			"x-ingest-token": token,
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify(body),
	});
} catch (err) {
	const refused =
		err?.cause?.code === "ECONNREFUSED" ||
		err?.code === "ECONNREFUSED" ||
		String(err).includes("ECONNREFUSED");
	if (refused) {
		console.error(`\n✗ Няма сървър на ${baseUrl} (порт ${new URL(url).port || "80"}).`);
		console.error("  Вариант А — стартирай dev в друг терминал:");
		console.error("    npm run dev");
		console.error("    npm run reindex");
		console.error("  Вариант Б — без сървър (директно към Supabase + OpenAI):");
		console.error("    npm run reindex:direct");
		process.exit(1);
	}
	throw err;
}

const text = await res.text();
let json;
try {
	json = JSON.parse(text);
} catch {
	console.error("Отговор (не JSON):", text.slice(0, 500));
	process.exit(1);
}

console.log(JSON.stringify(json, null, 2));

if (!res.ok) {
	console.error(`\n✗ Reindex неуспешен (HTTP ${res.status}).`);
	if (res.status === 401) {
		console.error("  → Проверете INGEST_ADMIN_TOKEN (същият в .env.local и на сървъра).");
	}
	if (res.status === 503) {
		console.error("  → RAG изключен: OPENAI_API_KEY, SUPABASE_*, RAG_ENABLED=1.");
	}
	process.exit(1);
}

if (json.ok && Array.isArray(json.results)) {
	const created = json.results.reduce((s, r) => s + (r.chunksCreated ?? 0), 0);
	const skipped = json.results.reduce((s, r) => s + (r.chunksSkipped ?? 0), 0);
	const failed = json.results.reduce((s, r) => s + (r.chunksFailed ?? 0), 0);
	console.log(
		`\n✓ Готово: +${created} chunks, пропуснати ${skipped}, грешки ${failed}.`,
	);
	if (json.results.some((r) => r.errors?.length)) {
		for (const r of json.results) {
			for (const e of r.errors ?? []) console.error("  !", e);
		}
	}
}

if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
	console.log("\nПроверка: npm run check:rag:local");
} else {
	console.log("\nПроверка: npm run check:rag:prod");
}
